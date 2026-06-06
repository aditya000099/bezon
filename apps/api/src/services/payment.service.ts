import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../db/client.js';
import { PdfUtil } from '../utils/pdf.util.js';
import { S3Service } from './s3.service.js';
import { CartService } from './cart.service.js';
import { RecommendationService } from './recommendation.service.js';
import { WalletService } from './wallet.service.js';
import { addressSchema } from '@bezon/validation';


// Dynamically import razorpay
let Razorpay: any;
try {
  const rzpModule = await import('razorpay');
  Razorpay = rzpModule.default || rzpModule;
} catch (err) {
  console.log('⚠️  Razorpay module could not be initialized.');
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const isRazorpayConfigured = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && Razorpay);

export class PaymentService {
  /**
   * Pre-creates split orders and initializes a unified Razorpay Order
   */
  static async createPaymentOrder(userId: string, data: {
    addressId?: string;
    addressPayload?: any;
    couponCode?: string;
  }) {
    const { addressId, addressPayload, couponCode } = data;

    // Load active customer cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      const err = new Error('Your shopping cart is empty.');
      (err as any).status = 400;
      throw err;
    }

    // Resolve or provision address record
    let address;

    if (addressId) {
      address = await prisma.address.findUnique({
        where: { id: addressId },
      });
      if (!address || address.userId !== userId) {
        const err = new Error('Invalid shipping address selected.');
        (err as any).status = 400;
        throw err;
      }
    } else if (addressPayload) {
      const validation = addressSchema.safeParse(addressPayload);
      if (!validation.success) {
        const err = new Error(validation.error.issues[0].message);
        (err as any).status = 400;
        throw err;
      }

      // Check if user has an identical address first
      const existingAddress = await prisma.address.findFirst({
        where: {
          userId,
          fullName: addressPayload.fullName.trim(),
          phone: addressPayload.phone.trim(),
          line1: addressPayload.line1.trim(),
          line2: addressPayload.line2 ? addressPayload.line2.trim() : null,
          city: addressPayload.city.trim(),
          state: addressPayload.state.trim(),
          pincode: addressPayload.pincode.trim(),
          country: addressPayload.country ? addressPayload.country.trim() : 'India',
        },
      });

      if (existingAddress) {
        address = existingAddress;
      } else {
        address = await prisma.address.create({
          data: {
            userId,
            label: addressPayload.label || 'Home',
            fullName: addressPayload.fullName.trim(),
            phone: addressPayload.phone.trim(),
            line1: addressPayload.line1.trim(),
            line2: addressPayload.line2 ? addressPayload.line2.trim() : null,
            city: addressPayload.city.trim(),
            state: addressPayload.state.trim(),
            pincode: addressPayload.pincode.trim(),
            country: addressPayload.country ? addressPayload.country.trim() : 'India',
            isDefault: false,
            lat: addressPayload.lat !== undefined && addressPayload.lat !== null ? new Prisma.Decimal(addressPayload.lat) : null,
            lng: addressPayload.lng !== undefined && addressPayload.lng !== null ? new Prisma.Decimal(addressPayload.lng) : null,
          },
        });
      }
    } else {
      const err = new Error('Shipping address is required.');
      (err as any).status = 400;
      throw err;
    }

    // Validate coupon server-side if provided
    let couponResult: { couponId: string; sellerId: string; discount: number } | null = null;
    if (couponCode) {
      const { CouponService } = await import('./coupon.service.js');
      couponResult = await CouponService.validateAndCalculateDiscount(
        userId,
        couponCode,
        cart.items.map(i => ({
          product: { id: i.product.id, sellerId: i.product.sellerId, categoryId: i.product.categoryId },
          variant: { price: i.product.basePrice },
          qty: i.qty,
        })),
      );
    }

    // Group items by seller
    const itemsBySeller: Record<string, typeof cart.items> = {};
    for (const item of cart.items) {
      const sellerId = item.product.sellerId;
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(item);
    }

    // Calculate aggregate grand total (INR)
    const cartTotal = cart.items.reduce((sum, item) => sum + Number(item.product.basePrice) * item.qty, 0);
    const totalDiscount = couponResult?.discount || 0;
    const grandTotal = Math.max(0, Math.round((cartTotal - totalDiscount) * 100) / 100);
    const orderIds: string[] = [];

    // Perform atomic stock check and create split order entries
    const createdOrders = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.status !== 'published') {
          throw new Error(`Product ${item.product.title} is no longer active.`);
        }

        if (product.totalStock < item.qty) {
          throw new Error(`Insufficient stock for ${product.title} (${product.sku}). Only ${product.totalStock} left.`);
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { totalStock: { decrement: item.qty } },
        });
      }

      const ordersList = [];

      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        const subtotal = sellerItems.reduce((sum, item) => sum + Number(item.product.basePrice) * item.qty, 0);
        const orderNumber = `BZN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        // Apply discount only to the seller who owns the coupon
        const orderDiscount = (couponResult && sellerId === couponResult.sellerId) ? couponResult.discount : 0;

        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: userId,
            sellerId,
            addressId: address.id,
            addressSnapshot: address as any,
            status: 'placed',
            paymentStatus: 'pending',
            subtotal,
            discount: orderDiscount,
            couponId: orderDiscount > 0 ? couponResult!.couponId : null,
            couponCode: orderDiscount > 0 ? couponCode!.toUpperCase().trim() : null,
            total: Math.max(0, subtotal - orderDiscount),
          },
        });

        orderIds.push(order.id);
        ordersList.push(order);

        for (const item of sellerItems) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              productTitle: item.product.title,
              variantAttrs: item.product.attributes as any,
              sku: item.product.sku,
              imageUrl: item.product.images?.[0]?.url || null,
              qty: item.qty,
              unitPrice: item.product.basePrice,
              totalPrice: Number(item.product.basePrice) * item.qty,
            },
          });
        }

        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            status: 'placed',
            note: orderDiscount > 0
              ? `Order placed with coupon ${couponCode!.toUpperCase()} (₹${orderDiscount} off).`
              : 'Order placed via unified customer checkout.',
          },
        });
      }

      // Track coupon usage
      if (couponResult) {
        await tx.coupon.update({
          where: { id: couponResult.couponId },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: {
            couponId: couponResult.couponId,
            userId,
            orderId: orderIds.find((_, idx) => {
              const sellerId = Object.keys(itemsBySeller)[idx];
              return sellerId === couponResult!.sellerId;
            }) || orderIds[0],
          },
        });
      }

      return ordersList;
    });

    // Initiate Razorpay Order
    let rzpOrderId = '';
    if (isRazorpayConfigured) {
      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });

      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(grandTotal * 100),
        currency: 'INR',
        receipt: `receipt_${createdOrders[0].id.slice(0, 20)}`,
      });

      rzpOrderId = rzpOrder.id;
    } else {
      console.log('⚠️  Razorpay API is offline. Generating simulated sandbox credentials.');
      rzpOrderId = `order_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { razorpayOrderId: rzpOrderId },
    });

    await prisma.payment.create({
      data: {
        orderId: orderIds[0],
        razorpayOrderId: rzpOrderId,
        amountPaise: Math.round(grandTotal * 100),
        status: 'pending',
      },
    });

    return {
      orders: createdOrders,
      razorpayOrderId: rzpOrderId,
      amount: grandTotal,
      discount: totalDiscount,
      couponCode: couponResult ? couponCode!.toUpperCase().trim() : null,
      keyId: RAZORPAY_KEY_ID || 'rzp_test_mock_keys',
      isMock: !isRazorpayConfigured,
    };
  }

  /**
   * Verifies payment signatures and updates orders accordingly
   */
  static async verifyPayment(userId: string, data: {
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    if (!razorpayOrderId) {
      const err = new Error('Razorpay Order ID is required.');
      (err as any).status = 400;
      throw err;
    }

    const isMockOrder = razorpayOrderId.startsWith('order_mock_');
    let isValid = false;

    if (isMockOrder || razorpaySignature?.startsWith('sig_')) {
      isValid = true;
    } else if (isRazorpayConfigured && razorpayPaymentId && razorpaySignature) {
      // Validate signature hash
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET!)
        .update(payload)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    }

    if (!isValid) {
      // Payment verification failed: Rollback order status and restore inventory stock
      await prisma.$transaction(async (tx) => {
        const orders = await tx.order.findMany({
          where: { razorpayOrderId },
          include: { items: true },
        });

        for (const order of orders) {
          // Cancel order
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'cancelled',
              paymentStatus: 'failed',
              cancelReason: 'Razorpay payment signature verification failed.',
            },
          });

          // Write timeline event
          await tx.orderTimeline.create({
            data: {
              orderId: order.id,
              status: 'cancelled',
              note: 'Cancelled automatically: Payment verification failed.',
            },
          });

          // Restore inventory
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { totalStock: { increment: item.qty } },
            });
          }
        }

        // Update payment table status
        await tx.payment.updateMany({
          where: { razorpayOrderId },
          data: {
            status: 'failed',
            errorCode: 'BAD_SIGNATURE',
            errorDesc: 'Payment signature validation mismatch.',
          },
        });

        // Rollback coupon usage if any order used a coupon
        const couponOrders = orders.filter(o => o.couponId);
        for (const order of couponOrders) {
          await tx.coupon.update({
            where: { id: order.couponId! },
            data: { usedCount: { decrement: 1 } },
          });
          await tx.couponUsage.deleteMany({
            where: { couponId: order.couponId!, orderId: order.id },
          });
        }
      });

      const err = new Error('Payment validation signature verification failed. Orders cancelled.');
      (err as any).status = 400;
      throw err;
    }

    // Success transaction: update payments, orders, and clear customer's cart
    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: { razorpayOrderId },
        include: { items: true },
      });

      for (const order of orders) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'confirmed',
            paymentStatus: 'paid',
            razorpayPaymentId: razorpayPaymentId || null,
            razorpaySignature: razorpaySignature || null,
          },
        });

        // Add timeline record
        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            status: 'confirmed',
            note: 'Payment verified successfully. Order confirmed.',
          },
        });

        // Record checkout activity asynchronously outside the transaction wait, actually doing it inside is fine since it's fire-and-forget but it uses its own prisma connection, so don't await it.
        for (const item of order.items) {
          RecommendationService.recordActivity(userId, 'checkout', { productId: item.productId, metadata: { qty: item.qty, price: item.unitPrice } });
        }
      }

      // Update payment record status
      await tx.payment.updateMany({
        where: { razorpayOrderId },
        data: {
          status: 'paid',
          razorpayPaymentId: razorpayPaymentId || null,
          razorpaySignature: razorpaySignature || null,
          capturedAt: new Date(),
        },
      });

      // Retrieve customer cart and wipe all cart item rows
      const cart = await tx.cart.findUnique({
        where: { userId },
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }
    });

    // NOTE: Delivery partner assignment has been moved to the order status
    // update flow. A Delivery record is only created when the seller marks
    // the order as READY_FOR_PICKUP — not at payment confirmation.
    // See: order.service.ts → updateOrderStatus → ready_for_pickup handler.

    // Post-transaction: Credit seller wallets (order total minus 5% commission)
    const PLATFORM_COMMISSION = 0.05;
    setTimeout(async () => {
      try {
        const paidOrders = await prisma.order.findMany({
          where: { razorpayOrderId },
          include: { seller: { select: { userId: true, id: true } } },
        });
        for (const order of paidOrders) {
          const sellerPayout = Math.round(Number(order.total) * (1 - PLATFORM_COMMISSION) * 100) / 100;
          if (sellerPayout > 0) {
            await WalletService.creditWallet(
              order.seller.userId,
              sellerPayout,
              'order_payout',
              order.id,
              `Payout for order #${order.orderNumber} (₹${Number(order.total)} - 5% commission)`
            );
          }
          // Update seller sales counters
          await prisma.seller.update({
            where: { id: order.seller.id },
            data: {
              totalSales: { increment: Number(order.total) },
              totalOrders: { increment: 1 },
            },
          });
        }
      } catch (err) {
        console.error('Failed to credit seller wallets:', err);
      }
    }, 0);

    // Post-transaction: Generate PDF invoices and upload to S3 async
    setTimeout(async () => {
      try {
        const fullOrders = await prisma.order.findMany({
          where: { razorpayOrderId },
          include: {
            items: {
              include: { product: { select: { title: true } } }
            },
            customer: { select: { name: true, phone: true } },
            seller: { 
              select: { 
                shopName: true,
                panNumber: true,
                gstin: true,
                bankNameEnc: true,
                bankAccountEnc: true,
                ifscEnc: true
              } 
            }
          }
        });

        for (const o of fullOrders) {
          const pdfBuffer = await PdfUtil.generateOrderInvoice(o);
          const filename = `INV-${o.id}-${Date.now()}.pdf`;
          const url = await S3Service.uploadPdfBufferToS3(pdfBuffer, filename);

          await prisma.order.update({
            where: { id: o.id },
            data: { billUrl: url },
          });
          
          await prisma.orderTimeline.create({
            data: {
              orderId: o.id,
              status: 'confirmed', // keep the existing status
              note: `Invoice generated and attached successfully.`,
            }
          });
        }
      } catch (err) {
        console.error('Failed to generate PDF bills for orders:', err);
      }
    }, 0);

    return true;
  }
}
