import prisma from '../db/client.js';

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

    const statusFlow = [
      'placed',
      'confirmed',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
    ];

    const currentFlowIndex = statusFlow.indexOf(order.status);
    const targetFlowIndex = statusFlow.indexOf(status);

    if (order.status === 'cancelled') {
      const err = new Error('Cannot update status of a cancelled order.');
      (err as any).status = 400;
      throw err;
    }
    if (order.status === 'delivered') {
      const err = new Error('Cannot update status of a delivered order.');
      (err as any).status = 400;
      throw err;
    }

    if (status !== 'cancelled') {
      if (targetFlowIndex === -1) {
        const err = new Error(`Invalid status: ${status}`);
        (err as any).status = 400;
        throw err;
      }
      if (currentFlowIndex !== -1 && targetFlowIndex <= currentFlowIndex) {
        const err = new Error(`Cannot revert order status from "${order.status}" back to "${status}".`);
        (err as any).status = 400;
        throw err;
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
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

    return updatedOrder;
  }
}
