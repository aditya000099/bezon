import prisma from '../../db/client.js';
import { WalletService } from '../wallet.service.js';

export class AdminOrderService {
  /**
   * Retrieves all orders for an admin
   */
  static async getOrders(filters: any = {}, page: number = 1, limit: number = 10) {
    const where: any = {};
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters.returnStatus) {
      where.returnStatus = filters.returnStatus;
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          returnStatus: true,
          refundStatus: true,
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
            },
          },
          seller: {
            select: {
              shopName: true,
              user: {
                select: { email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where })
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
   * Retrieves order details for admin
   */
  static async getOrderById(orderId: string) {
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

    const returnPolicy = await prisma.policy.findFirst({
      where: { type: 'return', isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    const returnWindowDays = returnPolicy?.durationDays || 7;

    return { ...order, returnWindowDays };
  }

  /**
   * Updates the status of an order and records the change in the timeline
   */
  static async updateOrderStatus(orderId: string, status: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.status === status) {
      const err = new Error(`Order is already in state "${status}".`);
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const isPolicyApproval = [
        'return_approved',
        'refund_approved',
        'replacement_approved',
      ].includes(status);
      if (isPolicyApproval) {
        await tx.delivery.deleteMany({
          where: { orderId },
        });
      }

      const updateData: any = { status: status as any };
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      const statusLabel = status.replace(/_/g, ' ');
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: status as any,
          note: `Admin updated order to ${statusLabel}.`,
          actorId: adminId,
          actorRole: 'admin',
        },
      });

      return updated;
    });
  }

  /**
   * Mark a pending refund as completed
   */
  static async markRefundCompleted(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.status !== 'cancelled') {
      const err = new Error('Refunds can only be processed for cancelled orders.');
      (err as any).status = 400;
      throw err;
    }

    if (order.paymentStatus === 'refunded') {
      const err = new Error('Refund has already been completed.');
      (err as any).status = 400;
      throw err;
    }

    if (order.paymentStatus !== 'refund_initiated') {
      const err = new Error('Order is not pending a refund.');
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (
        !currentOrder ||
        currentOrder.status !== 'cancelled' ||
        currentOrder.paymentStatus !== 'refund_initiated'
      ) {
        throw Object.assign(new Error('Order state changed. Refund aborted.'), { status: 409 });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'refunded',
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'cancelled',
          note: `Admin marked refund as completed. Status changed from refund_initiated to refunded.`,
          actorId: adminId,
          actorRole: 'admin',
        },
      });

      return updatedOrder;
    });
  }

  static async getRefundEligibleReturns() {
    return await prisma.order.findMany({
      where: {
        returnStatus: 'COMPLETED',
        returnInspectionStatus: {
          not: 'PENDING_INSPECTION',
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
    });
  }

  static async simulateRefundProcessing(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    const isLegacyReady =
      order.refundStatus === 'NONE' &&
      order.returnStatus === 'COMPLETED' &&
      order.returnInspectionStatus !== 'PENDING_INSPECTION';
    if (order.refundStatus !== 'READY' && !isLegacyReady)
      throw Object.assign(new Error('Order is not ready for refund'), { status: 400 });

    return await prisma.$transaction(async (tx) => {
      const refundAmountToSet = order.refundAmount
        ? order.refundAmount
        : Number(order.subtotal) - Number(order.discount);

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          refundStatus: 'PROCESSING',
          refundAmount: refundAmountToSet,
          refundInitiatedAt: new Date(),
          refundProcessedById: adminId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: order.status,
          note: 'Refund Processing',
          actorId: adminId,
          actorRole: 'admin',
        },
      });
      return updated;
    });
  }

  static async simulateRefundCompleted(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.refundStatus !== 'PROCESSING')
      throw Object.assign(new Error('Refund is not currently processing'), { status: 400 });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const data: any = {
        refundStatus: 'COMPLETED',
        refundedAt: new Date(),
        refundProcessedById: adminId,
      };

      if (order.settlementStatus === 'HOLDING') {
        data.settlementStatus = 'REFUNDED';
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data,
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: order.status,
          note: `Refund Completed - ₹${order.refundAmount}`,
          actorId: adminId,
          actorRole: 'admin',
        },
      });

      if (order.settlementStatus === 'HOLDING') {
        await tx.orderTimeline.create({
          data: {
            orderId,
            status: order.status,
            note: `Settlement Refunded - ₹${order.refundAmount}`,
            actorId: adminId,
            actorRole: 'admin',
          },
        });
      }

      return updated;
    });

    if (order.settlementStatus === 'HOLDING' && order.refundAmount) {
      try {
        await WalletService.debitWallet(
          adminId,
          Number(order.refundAmount),
          'customer_refund',
          orderId,
          `Customer refund from escrow for order #${order.orderNumber}`,
        );
      } catch (err) {
        console.error('Failed to debit admin escrow wallet for refund:', err);
      }
    }

    return updatedOrder;
  }

  static async simulateRefundFailed(orderId: string, adminId: string, reason: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.refundStatus !== 'PROCESSING')
      throw Object.assign(new Error('Refund is not currently processing'), { status: 400 });

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          refundStatus: 'FAILED',
          refundFailureReason: reason,
          refundProcessedById: adminId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: order.status,
          note: `Refund Failed - ${reason}`,
          actorId: adminId,
          actorRole: 'admin',
        },
      });
      return updated;
    });
  }
}
