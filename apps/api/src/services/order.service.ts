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
        items: true,
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
}
