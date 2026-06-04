import prisma from '../db/client.js';

export class DeliveryPoolService {
  /**
   * Finds eligible orders for a specific delivery partner based on city matching.
   * Excludes orders that already have a delivery assignment.
   */
  static async getAvailableOrdersForPartner(partnerId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner || !partner.isAvailable || partner.status !== 'approved') {
      return [];
    }

    if (!partner.city) {
      return [];
    }

    // Find orders that are READY_FOR_PICKUP, have no delivery assignment,
    // and where the seller's city matches the partner's city.
    const availableOrders = await prisma.order.findMany({
      where: {
        status: 'ready_for_pickup',
        delivery: {
          is: null,
        },
        seller: {
          city: {
            equals: partner.city,
            mode: 'insensitive',
          },
        },
      },
      include: {
        seller: {
          select: {
            shopName: true,
            addressLine: true,
            city: true,
            state: true,
            pincode: true,
            lat: true,
            lng: true,
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return availableOrders;
  }
}
