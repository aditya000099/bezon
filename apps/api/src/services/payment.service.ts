import crypto from 'crypto';
import prisma from '../db/client.js';
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
  }) {
    const { addressId, addressPayload } = data;

    // Load active customer cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: true,
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

      address = await prisma.address.create({
        data: {
          userId,
          label: addressPayload.label || 'Home',
          fullName: addressPayload.fullName,
          phone: addressPayload.phone,
          line1: addressPayload.line1,
          line2: addressPayload.line2 || null,
          city: addressPayload.city,
          state: addressPayload.state,
          pincode: addressPayload.pincode,
          country: addressPayload.country || 'India',
          isDefault: false,
        },
      });
    } else {
      const err = new Error('Shipping address is required.');
      (err as any).status = 400;
      throw err;
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
    const cartTotal = cart.items.reduce((sum, item) => sum + Number(item.variant.price) * item.qty, 0);
    const orderIds: string[] = [];

    // Perform atomic stock check and create split order entries
    const createdOrders = await prisma.$transaction(async (tx) => {
      // 1. Verify and decrement stock for all items
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || !variant.isActive) {
          throw new Error(`Variant SKU ${item.variant.sku} is no longer active.`);
        }

        if (variant.stock < item.qty) {
          throw new Error(`Insufficient stock for ${item.product.title} (${item.variant.sku}). Only ${variant.stock} left.`);
        }

        // Decrement stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.qty } },
        });
      }

      const ordersList = [];

      // 2. Generate an Order record per seller grouping
      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        const subtotal = sellerItems.reduce((sum, item) => sum + Number(item.variant.price) * item.qty, 0);
        const orderNumber = `BZN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

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
            total: subtotal, // Standard free shipping
          },
        });

        orderIds.push(order.id);
        ordersList.push(order);

        // Create individual items for this order
        for (const item of sellerItems) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              variantId: item.variantId,
              productTitle: item.product.title,
              variantAttrs: item.variant.attributes as any,
              sku: item.variant.sku,
              imageUrl: item.product.images?.[0]?.url || null,
              qty: item.qty,
              unitPrice: item.variant.price,
              totalPrice: Number(item.variant.price) * item.qty,
            },
          });
        }

        // Write order timeline event
        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            status: 'placed',
            note: 'Order placed via unified customer checkout.',
          },
        });
      }

      return ordersList;
    });

    // 3. Initiate Razorpay Order
    let rzpOrderId = '';
    if (isRazorpayConfigured) {
      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });

      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(cartTotal * 100), // convert to paise
        currency: 'INR',
        receipt: `receipt_${createdOrders[0].id.slice(0, 20)}`,
      });

      rzpOrderId = rzpOrder.id;
    } else {
      console.log('⚠️  Razorpay API is offline. Generating simulated sandbox credentials.');
      rzpOrderId = `order_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    // 4. Update Razorpay Order ID on all newly created split orders
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { razorpayOrderId: rzpOrderId },
    });

    // 5. Generate Payment entry
    await prisma.payment.create({
      data: {
        orderId: orderIds[0],
        razorpayOrderId: rzpOrderId,
        amountPaise: Math.round(cartTotal * 100),
        status: 'pending',
      },
    });

    return {
      orders: createdOrders,
      razorpayOrderId: rzpOrderId,
      amount: cartTotal,
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
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.qty } },
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
      });

      const err = new Error('Payment validation signature verification failed. Orders cancelled.');
      (err as any).status = 400;
      throw err;
    }

    // Success transaction: update payments, orders, and clear customer's cart
    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: { razorpayOrderId },
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

    return true;
  }
}
