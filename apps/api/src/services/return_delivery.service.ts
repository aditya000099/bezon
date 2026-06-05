import prisma from '../db/client.js';

export class ReturnDeliveryService {
  /**
   * Get available return pickups for eligible delivery partners.
   */
  static async getAvailableReturnPickups(partnerId: string) {
    const partner = await prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner || !partner.isAvailable || partner.status !== 'approved' || !partner.city) {
      return [];
    }

    // Returns available for pickup: status = APPROVED, no partner assigned
    return await prisma.order.findMany({
      where: {
        returnStatus: 'APPROVED',
        returnPartnerId: null,
        addressSnapshot: {
          path: ['city'],
          equals: partner.city,
        },
      },
      include: {
        items: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
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
      },
      orderBy: { returnApprovedAt: 'asc' },
    });
  }

  /**
   * Accept an available return pickup assignment
   */
  static async acceptReturnPickup(orderId: string, partnerId: string, userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
      include: { user: true }
    });

    if (!partner || !partner.isAvailable || partner.status !== 'approved') {
      const err = new Error('Delivery Partner is not eligible to accept return pickups.');
      (err as any).status = 403;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      // Lock-read the order
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw Object.assign(new Error('Order not found.'), { status: 404 });
      }

      if (order.returnStatus !== 'APPROVED') {
        throw Object.assign(new Error('This return is not available for assignment.'), { status: 400 });
      }

      if (order.returnPartnerId !== null) {
        throw Object.assign(new Error('Return pickup already assigned to another partner.'), { status: 409 });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: 'ASSIGNED',
          returnPartnerId: partner.id,
          returnAssignedAt: new Date(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered', // Main status stays delivered
          note: `Return Pickup Assigned to ${partner.user.name}.`,
          actorId: userId,
          actorRole: 'delivery',
        },
      });

      const seller = await tx.seller.findUnique({ where: { id: order.sellerId } });

      // Notification to customer
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'Return Pickup Assigned',
          body: `Pickup partner ${partner.user.name} has been assigned to your return for order ${order.orderNumber}.`,
          type: 'general',
        },
      });

      // Notification to seller
      if (seller) {
        await tx.notification.create({
          data: {
            userId: seller.userId,
            title: 'Return Pickup Assigned',
            body: `A delivery partner has been assigned to pick up the return for order ${order.orderNumber}.`,
            type: 'general',
          },
        });
      }

      return updatedOrder;
    });
  }

  /**
   * Get active assigned return pickups for the logged-in partner.
   */
  static async getQueue(partnerId: string) {
    return await prisma.order.findMany({
      where: {
        returnPartnerId: partnerId,
        returnStatus: {
          in: ['ASSIGNED', 'PICKED_UP'],
        },
      },
      include: {
        items: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
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
      },
      orderBy: { returnAssignedAt: 'desc' },
    });
  }

  /**
   * Get history of completed return pickups
   */
  static async getHistory(partnerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          returnPartnerId: partnerId,
          returnStatus: 'COMPLETED',
        },
        include: {
          items: true,
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
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
        },
        orderBy: { returnCompletedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: {
          returnPartnerId: partnerId,
          returnStatus: 'COMPLETED',
        },
      })
    ]);

    return { history, total };
  }

  /**
   * Mark return as picked up
   */
  static async markReturnPickedUp(orderId: string, partnerId: string, userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
      include: { user: true }
    });

    if (!partner) {
      throw Object.assign(new Error('Partner not found.'), { status: 404 });
    }

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw Object.assign(new Error('Order not found.'), { status: 404 });
      }

      if (order.returnPartnerId !== partnerId) {
        throw Object.assign(new Error('You are not the assigned delivery partner for this return.'), { status: 403 });
      }

      if (order.returnStatus !== 'ASSIGNED') {
        throw Object.assign(new Error('Return must be in ASSIGNED state to mark as picked up.'), { status: 400 });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: 'PICKED_UP',
          returnPickedUpAt: new Date(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered',
          note: `Return Picked Up by ${partner.user.name}.`,
          actorId: userId,
          actorRole: 'delivery',
        },
      });

      const seller = await tx.seller.findUnique({ where: { id: order.sellerId } });

      // Notifications
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'Return Picked Up',
          body: `Your return for order ${order.orderNumber} has been picked up.`,
          type: 'general',
        },
      });

      if (seller) {
        await tx.notification.create({
          data: {
            userId: seller.userId,
            title: 'Return Picked Up',
            body: `The return for order ${order.orderNumber} has been picked up and is on the way.`,
            type: 'general',
          },
        });
      }

      return updatedOrder;
    });
  }

  /**
   * Mark return as completed
   */
  static async markReturnCompleted(orderId: string, partnerId: string, userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
      include: { user: true }
    });

    if (!partner) {
      throw Object.assign(new Error('Partner not found.'), { status: 404 });
    }

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw Object.assign(new Error('Order not found.'), { status: 404 });
      }

      if (order.returnPartnerId !== partnerId) {
        throw Object.assign(new Error('You are not the assigned delivery partner for this return.'), { status: 403 });
      }

      if (order.returnStatus !== 'PICKED_UP') {
        throw Object.assign(new Error('Return must be in PICKED_UP state to mark as completed.'), { status: 400 });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: 'COMPLETED',
          returnCompletedAt: new Date(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered',
          note: `Return Completed by ${partner.user.name}.`,
          actorId: userId,
          actorRole: 'delivery',
        },
      });

      const seller = await tx.seller.findUnique({ where: { id: order.sellerId } });

      // Notifications
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'Return Completed',
          body: `Your return for order ${order.orderNumber} has been delivered to the seller.`,
          type: 'general',
        },
      });

      if (seller) {
        await tx.notification.create({
          data: {
            userId: seller.userId,
            title: 'Return Received',
            body: `The returned items for order ${order.orderNumber} have been delivered to you.`,
            type: 'general',
          },
        });
      }

      return updatedOrder;
    });
  }
}
