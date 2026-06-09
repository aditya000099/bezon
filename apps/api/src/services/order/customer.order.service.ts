import prisma from '../../db/client.js';

export class CustomerOrderService {
  /**
   * Retrieves orders for a customer
   */
  static async getOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where: { customerId: userId },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              productId: true,
              productTitle: true,
              qty: true,
              unitPrice: true,
              imageUrl: true,
              product: {
                select: {
                  slug: true
                }
              }
            },
          },
          seller: {
            select: {
              shopName: true,
              shopSlug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { customerId: userId } })
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Retrieves specific order details for a customer
   */
  static async getOrderById(orderId: string, userId: string) {
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
                    policy: true,
                  },
                },
              },
            },
            review: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
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

    if (order.customerId !== userId) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    const returnPolicy = await prisma.policy.findFirst({
      where: { type: 'return', isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    const returnWindowDays = returnPolicy?.durationDays || 7;

    return { ...order, returnWindowDays };
  }

  /**
   * Cancels a customer order before fulfillment begins
   */
  static async cancelOrder(
    orderId: string,
    customerId: string,
    cancelReason?: string,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.customerId !== customerId) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    if (order.status !== 'placed' && order.status !== 'confirmed') {
      const err = new Error('Order can no longer be cancelled.');
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      let nextPaymentStatus = order.paymentStatus;
      if (order.paymentStatus === 'paid') {
        nextPaymentStatus = 'refund_initiated';
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          paymentStatus: nextPaymentStatus,
          cancelReason: cancelReason || null,
          cancelledAt: new Date(),
          cancelledBy: customerId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'cancelled',
          note: `Customer cancelled the order. ${cancelReason ? `Reason: ${cancelReason}` : ''}`,
          actorId: customerId,
          actorRole: 'customer',
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Processes a customer-initiated policy action (return/refund/replace) for an order item
   */
  static async requestPolicyAction(
    orderId: string,
    actionType: 'return' | 'refund' | 'replace',
    itemId: string,
    reason: string,
    userId: string,
  ) {
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
                    policy: true,
                  },
                },
              },
            },
          },
        },
        delivery: true,
      },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.customerId !== userId) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    if (order.status !== 'delivered') {
      const err = new Error('Policy actions are only available for delivered orders.');
      (err as any).status = 400;
      throw err;
    }

    const orderItem = order.items.find((item) => item.id === itemId);
    if (!orderItem) {
      const err = new Error('Item not found in this order.');
      (err as any).status = 404;
      throw err;
    }

    const productPolicies = orderItem.product?.policies || [];
    const matchingProductPolicy = productPolicies.find(
      (pp) => pp.policy?.type === actionType,
    );

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

    const deliveredAt = order.delivery?.deliveredAt;
    if (!deliveredAt) {
      const err = new Error('Delivery timestamp is missing.');
      (err as any).status = 400;
      throw err;
    }

    const deliveryTime = new Date(deliveredAt).getTime();
    const expirationTime = deliveryTime + policy.durationDays * 24 * 60 * 60 * 1000;
    if (Date.now() > expirationTime) {
      const err = new Error(
        `The ${policy.durationDays}-day window for this ${actionType} policy has expired.`,
      );
      (err as any).status = 400;
      throw err;
    }

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
}
