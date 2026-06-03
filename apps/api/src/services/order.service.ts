import prisma from '../db/client.js';
import { DeliveryMatchingService } from './delivery_matching.service.js';

export class OrderService {
  /**
   * Retrieves orders based on caller's role (customer, seller, admin)
   */
  static async getOrders(user: { id: string; role: string }) {
    const { id: userId, role } = user;

    if (role === 'customer') {
      return await prisma.order.findMany({
        where: { customerId: userId },
        include: {
          items: true,
          seller: {
            select: {
              shopName: true,
              shopSlug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === 'seller') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
      });

      if (!seller) {
        const err = new Error('Seller profile required.');
        (err as any).status = 403;
        throw err;
      }

      return await prisma.order.findMany({
        where: { sellerId: seller.id },
        include: {
          items: true,
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === 'admin') {
      return await prisma.order.findMany({
        include: {
          items: true,
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              shopName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return [];
  }

  /**
   * Retrieves order details, validating accessibility by caller
   */
  static async getOrderById(orderId: string, user: { id: string; role: string }) {
    const { id: userId, role } = user;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                images: true,
                policies: {
                  include: {
                    policy: true
                  }
                }
              }
            },
            review: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        seller: {
          select: {
            id: true,
            shopName: true,
            shopSlug: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        delivery: {
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      const err = new Error('Order reference not found.');
      (err as any).status = 404;
      throw err;
    }

    if (role === 'customer' && order.customerId !== userId) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    if (role === 'seller') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
      });
      if (!seller || order.sellerId !== seller.id) {
        const err = new Error('Access denied.');
        (err as any).status = 403;
        throw err;
      }
    }

    return order;
  }

  /**
   * Updates the status of an order and records the change in the timeline
   */
  static async updateOrderStatus(orderId: string, status: string, user: { id: string; role: string }) {
    const { id: userId, role } = user;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true }
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (role === 'seller') {
      const seller = await prisma.seller.findUnique({ where: { userId } });
      if (!seller || order.sellerId !== seller.id) {
        const err = new Error('Access denied.');
        (err as any).status = 403;
        throw err;
      }
    }

    // Admin can always update
    if (role === 'customer') {
      const err = new Error('Customers cannot directly modify order status.');
      (err as any).status = 403;
      throw err;
    }

    const validTransitions: Record<string, string[]> = {
      placed: ['confirmed', 'cancelled'],
      confirmed: ['packed', 'ready_for_pickup', 'cancelled'],
      packed: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['shipped', 'out_for_delivery', 'cancelled'],
      shipped: ['out_for_delivery', 'delivery_failed'],
      out_for_delivery: ['delivered', 'delivery_failed'],
      delivered: ['return_requested', 'refund_requested', 'replacement_requested'],
      
      // Return flow
      return_requested: ['return_approved', 'return_rejected'],
      return_approved: ['returned_to_origin'],
      returned_to_origin: ['refund_requested', 'refunding', 'refunded', 'replacement_approved'],
      
      // Refund flow
      refund_requested: ['refund_approved', 'refund_rejected'],
      refund_approved: ['refunded'],
      refunding: ['refunded'],
      
      // Replacement flow
      replacement_requested: ['replacement_approved', 'replacement_rejected'],
      replacement_approved: ['replacement_shipped'],
      replacement_shipped: ['replaced'],
    };

    if (order.status === status) {
      const err = new Error(`Order is already in state "${status}".`);
      (err as any).status = 400;
      throw err;
    }

    if (role !== 'admin') {
      const allowed = validTransitions[order.status];
      if (!allowed || !allowed.includes(status)) {
        const err = new Error(`Cannot transition order status from "${order.status}" to "${status}".`);
        (err as any).status = 400;
        throw err;
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const isPolicyApproval = ['return_approved', 'refund_approved', 'replacement_approved'].includes(status);
      if (isPolicyApproval) {
        await tx.delivery.deleteMany({
          where: { orderId }
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: status as any,
          note: `Order status manually updated to ${status} by ${role}.`,
        },
      });

      return updated;
    });

    const isPolicyApproval = ['return_approved', 'refund_approved', 'replacement_approved'].includes(status);
    if (isPolicyApproval) {
      await DeliveryMatchingService.assignDeliveryPartner(orderId);
    }

    return updatedOrder;
  }

  /**
   * Processes a customer-initiated policy action (return/refund/replace) for an order item
   */
  static async requestOrderPolicyAction(
    orderId: string,
    actionType: 'return' | 'refund' | 'replace',
    itemId: string,
    reason: string,
    user: { id: string; role: string }
  ) {
    const { id: userId, role } = user;

    // Retrieve order detail, ensuring accessibility checks
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                images: true,
                policies: {
                  include: {
                    policy: true
                  }
                }
              }
            }
          }
        },
        delivery: true,
      }
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    // Access control: only the customer who ordered or admin
    if (role === 'customer' && order.customerId !== userId) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    if (order.status !== 'delivered') {
      const err = new Error('Policy actions are only available for delivered orders.');
      (err as any).status = 400;
      throw err;
    }

    const orderItem = order.items.find(item => item.id === itemId);
    if (!orderItem) {
      const err = new Error('Item not found in this order.');
      (err as any).status = 404;
      throw err;
    }

    // Find the corresponding policy for this actionType
    const productPolicies = orderItem.product?.policies || [];
    const matchingProductPolicy = productPolicies.find(pp => pp.policy?.type === actionType);

    if (!matchingProductPolicy || !matchingProductPolicy.policy) {
      const err = new Error(`This item does not support a ${actionType} policy.`);
      (err as any).status = 400;
      throw err;
    }

    const policy = matchingProductPolicy.policy;

    if (!policy.isActive) {
      const err = new Error(`The ${actionType} policy is currently inactive.`);
      (err as any).status = 400;
      throw err;
    }

    // Check durationDays limit from deliveredAt
    const deliveredAt = order.delivery?.deliveredAt;
    if (!deliveredAt) {
      const err = new Error('Delivery timestamp is missing.');
      (err as any).status = 400;
      throw err;
    }

    const deliveryTime = new Date(deliveredAt).getTime();
    const expirationTime = deliveryTime + policy.durationDays * 24 * 60 * 60 * 1000;
    if (Date.now() > expirationTime) {
      const err = new Error(`The ${policy.durationDays}-day window for this ${actionType} policy has expired.`);
      (err as any).status = 400;
      throw err;
    }

    // Map action type to order status
    let targetStatus: any;
    if (actionType === 'refund') {
      targetStatus = 'refund_requested';
    } else if (actionType === 'replace') {
      targetStatus = 'replacement_requested';
    } else {
      targetStatus = 'return_requested';
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: targetStatus },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: targetStatus,
          note: `${actionType.toUpperCase()} requested for item "${orderItem.productTitle}". Reason: ${reason || 'Not specified'}.`,
        },
      });

      return updated;
    });

    return updatedOrder;
  }
  /**
   * Retrieves orders for a specific seller by their user ID
   */
  static async getSellerOrders(userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    return await prisma.order.findMany({
      where: { sellerId: seller.id },
      include: {
        items: true,
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves specific order details for a seller
   */
  static async getSellerOrderById(orderId: string, userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                images: true,
                policies: {
                  include: {
                    policy: true
                  }
                }
              }
            },
            review: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        seller: {
          select: {
            id: true,
            shopName: true,
            shopSlug: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        delivery: {
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      const err = new Error('Order reference not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    return order;
  }
}
