import prisma from '../../db/client.js';

export class SellerOrderService {
  /**
   * Retrieves orders for a specific seller by their user ID
   */
  static async getOrders(
    userId: string,
    filters: { returnStatus?: string; returnInspectionStatus?: string } = {},
    page: number = 1,
    limit: number = 10
  ) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    const whereClause: any = { sellerId: seller.id };

    if (filters.returnStatus) {
      if (filters.returnStatus.includes(',')) {
        whereClause.returnStatus = { in: filters.returnStatus.split(',') };
      } else {
        whereClause.returnStatus = filters.returnStatus;
      }
    }

    if (filters.returnInspectionStatus) {
      if (filters.returnInspectionStatus === 'INSPECTED_ALL') {
        whereClause.returnInspectionStatus = { not: 'PENDING_INSPECTION' };
      } else {
        whereClause.returnInspectionStatus = filters.returnInspectionStatus;
      }
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          returnStatus: true,
          returnInspectionStatus: true,
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
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          returnPartner: {
            select: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: whereClause })
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
   * Retrieves specific order details for a seller
   */
  static async getOrderById(orderId: string, userId: string) {
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
        returnPartner: {
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

  /**
   * Updates the status of an order and records the change in the timeline
   */
  static async updateOrderStatus(orderId: string, status: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller || order.sellerId !== seller.id) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    const validTransitions: Record<string, string[]> = {
      placed: ['confirmed', 'cancelled'],
      confirmed: ['packed', 'ready_for_pickup', 'cancelled'],
      packed: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['cancelled'],
    };

    if (order.status === status) {
      const err = new Error(`Order is already in state "${status}".`);
      (err as any).status = 400;
      throw err;
    }

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      const err = new Error(
        `Cannot transition order status from "${order.status}" to "${status}".`,
      );
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });

      const statusLabel = status.replace(/_/g, ' ');
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: status as any,
          note: `Seller updated order to ${statusLabel}.`,
          actorId: userId,
          actorRole: 'seller',
        },
      });

      return updated;
    });
  }

  /**
   * Cancel an order by a seller
   */
  static async cancelOrder(orderId: string, userId: string, cancelReason?: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error('Seller profile not found.');
      (err as any).status = 404;
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error('Access denied.');
      (err as any).status = 403;
      throw err;
    }

    const ALLOWED_STATUSES = ['placed', 'confirmed', 'packed'];
    if (!ALLOWED_STATUSES.includes(order.status)) {
      const err = new Error('Order can no longer be cancelled.');
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || !ALLOWED_STATUSES.includes(currentOrder.status)) {
        throw Object.assign(new Error('Order state changed. Cancellation aborted.'), { status: 409 });
      }

      let nextPaymentStatus = currentOrder.paymentStatus;
      if (currentOrder.paymentStatus === 'paid') {
        nextPaymentStatus = 'refund_initiated';
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          paymentStatus: nextPaymentStatus,
          cancelReason: cancelReason || null,
          cancelledAt: new Date(),
          cancelledBy: seller.id,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'cancelled',
          note: `Seller cancelled the order. ${cancelReason ? `Reason: ${cancelReason}` : ''}`,
          actorId: seller.userId,
          actorRole: 'seller',
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Approve a return
   */
  static async approveReturn(orderId: string, sellerUserId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerUserId },
    });

    if (!seller) {
      const err = new Error('Seller profile not found.');
      (err as any).status = 404;
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error('Access denied. You do not own this order.');
      (err as any).status = 403;
      throw err;
    }

    if (order.returnStatus !== 'REQUESTED') {
      const err = new Error('Only pending return requests can be approved.');
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || currentOrder.returnStatus !== 'REQUESTED') {
        throw Object.assign(new Error('Order state changed. Approval aborted.'), { status: 409 });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: 'APPROVED',
          returnApprovedAt: new Date(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered',
          note: `Return Approved by Seller.`,
          actorId: seller.userId,
          actorRole: 'seller',
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Reject a return
   */
  static async rejectReturn(orderId: string, sellerUserId: string, rejectionReason: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerUserId },
    });

    if (!seller) {
      const err = new Error('Seller profile not found.');
      (err as any).status = 404;
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.sellerId !== seller.id) {
      const err = new Error('Access denied. You do not own this order.');
      (err as any).status = 403;
      throw err;
    }

    if (order.returnStatus !== 'REQUESTED') {
      const err = new Error('Only pending return requests can be rejected.');
      (err as any).status = 400;
      throw err;
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      const err = new Error('Rejection reason is required.');
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder || currentOrder.returnStatus !== 'REQUESTED') {
        throw Object.assign(new Error('Order state changed. Rejection aborted.'), { status: 409 });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnStatus: 'REJECTED',
          returnRejectedAt: new Date(),
          returnRejectedReason: rejectionReason.trim(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered',
          note: `Return Rejected by Seller. Reason: ${rejectionReason.trim()}.`,
          actorId: seller.userId,
          actorRole: 'seller',
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Inspects a returned product and updates its inspection status.
   */
  static async inspectReturnedProduct(
    orderId: string,
    sellerUserId: string,
    status: 'RESTOCKED' | 'DAMAGED' | 'DISPOSED',
    notes: string | null,
  ) {
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerUserId },
    });

    if (!seller) {
      throw Object.assign(new Error('Seller profile not found.'), { status: 403 });
    }

    if ((status === 'DAMAGED' || status === 'DISPOSED') && (!notes || notes.trim() === '')) {
      throw Object.assign(
        new Error('Inspection notes are required when marking a product as DAMAGED or DISPOSED.'),
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw Object.assign(new Error('Order not found.'), { status: 404 });
    }

    if (order.sellerId !== seller.id) {
      throw Object.assign(new Error('Access denied. You do not own this order.'), { status: 403 });
    }

    if (order.returnStatus !== 'COMPLETED') {
      throw Object.assign(new Error('Only completed returns can be inspected.'), { status: 400 });
    }

    if (order.returnInspectionStatus !== 'PENDING_INSPECTION') {
      throw Object.assign(new Error('This return has already been inspected.'), { status: 400 });
    }

    return await prisma.$transaction(async (tx) => {
      const refundAmount = Number(order.subtotal) - Number(order.discount);

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          returnInspectionStatus: status,
          returnInspectionNotes: notes,
          returnInspectedAt: new Date(),
          returnInspectedById: seller.id,
          refundStatus: 'READY',
          refundAmount: refundAmount,
          refundEligibleAt: new Date(),
        },
      });

      let statusWord = '';
      if (status === 'RESTOCKED') statusWord = 'Restocked';
      if (status === 'DAMAGED') statusWord = 'Damaged';
      if (status === 'DISPOSED') statusWord = 'Disposed';

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered',
          note: `Product Marked ${statusWord} By Seller.`,
          actorId: seller.userId,
          actorRole: 'seller',
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered',
          note: `Refund Eligible`,
          actorId: seller.userId,
          actorRole: 'seller',
        },
      });

      if (status === 'RESTOCKED') {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product && product.sellerId === seller.id) {
            const previousStock = product.totalStock;
            const returnedQty = item.qty;
            const newStock = previousStock + returnedQty;

            await tx.product.update({
              where: { id: product.id },
              data: { totalStock: newStock },
            });

            await tx.orderTimeline.create({
              data: {
                orderId: order.id,
                status: 'delivered',
                note: `Inventory Increased +${returnedQty} (Stock Updated: ${previousStock} → ${newStock})`,
                actorId: seller.userId,
                actorRole: 'seller',
              },
            });
          }
        }
      }

      return updatedOrder;
    });
  }
}
