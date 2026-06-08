import prisma from '../db/client.js';
import { Prisma } from '@prisma/client';

/**
 * Strict delivery status transition map.
 */
const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  assigned: ['picked_up', 'accepted'],
  accepted: ['picked_up'],
  picked_up: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'delivery_failed'],
};

/** Terminal delivery statuses — no further actions allowed */
const TERMINAL_DELIVERY_STATUSES = [
  'delivered',
  'delivery_failed',
  'returned_to_origin',
];

export class DeliveryService {
  /**
   * Accept an unassigned delivery assignment.
   */
  static async acceptAssignment(
    orderId: string,
    partnerId: string,
    partnerUserId: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { delivery: true },
      });

      if (!order) {
        throw Object.assign(new Error('Order not found.'), { status: 404 });
      }

      if (order.status !== 'ready_for_pickup') {
        throw Object.assign(
          new Error('This order is no longer available for assignment.'),
          { status: 400 },
        );
      }

      if (order.delivery !== null) {
        throw Object.assign(new Error('Order already assigned.'), {
          status: 409,
        });
      }

      const newDelivery = await tx.delivery.create({
        data: {
          orderId: order.id,
          partnerId,
          status: 'assigned',
          acceptedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'assigned' },
      });

      await tx.deliveryTimeline.create({
        data: {
          deliveryId: newDelivery.id,
          status: 'assigned',
          note: `Delivery partner accepted the assignment.`,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'assigned',
          note: `Delivery partner accepted the trip assignment. Awaiting package pickup.`,
          actorId: partnerUserId,
          actorRole: 'delivery',
        },
      });

      await tx.notification.create({
        data: {
          userId: partnerUserId,
          title: 'Assignment Accepted',
          body: `You accepted delivery for order ${order.orderNumber}. Proceed to pickup.`,
          type: 'new_task_assigned',
        },
      });

      return newDelivery;
    });
  }

  /**
   * Update delivery assignment status and sync corresponding Order state.
   */
  static async updateAssignmentStatus(
    deliveryId: string,
    partnerId: string,
    partnerUserId: string,
    newStatus: string,
    payload: {
      note?: string;
      proofImageUrl?: string;
      proofS3Key?: string;
      failureReason?: string;
      lat?: number;
      lng?: number;
    },
  ) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw Object.assign(new Error('Delivery assignment not found.'), {
        status: 404,
      });
    }

    if (delivery.partnerId === null || delivery.partnerId !== partnerId) {
      throw Object.assign(
        new Error('You are not the assigned delivery partner for this order.'),
        { status: 403 },
      );
    }

    if (TERMINAL_DELIVERY_STATUSES.includes(delivery.status)) {
      throw Object.assign(
        new Error(
          `This delivery is in terminal state "${delivery.status}". No further actions are allowed.`,
        ),
        { status: 400 },
      );
    }

    const allowedNext = DELIVERY_TRANSITIONS[delivery.status];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      throw Object.assign(
        new Error(
          `Cannot transition delivery from "${delivery.status}" to "${newStatus}". Allowed transitions: ${(allowedNext || []).join(', ') || 'none'}.`,
        ),
        { status: 400 },
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: newStatus as any,
        updatedAt: new Date(),
      };

      if (newStatus === 'picked_up') {
        updateData.pickedUpAt = new Date();
      } else if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date();
        updateData.proofImageUrl = payload.proofImageUrl || null;
        updateData.proofS3Key = payload.proofS3Key || null;
      } else if (newStatus === 'delivery_failed') {
        updateData.failureReason = payload.failureReason || 'Failed to deliver';
      }

      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: updateData as any,
      });

      await tx.deliveryTimeline.create({
        data: {
          deliveryId,
          status: newStatus as any,
          note: payload.note || `Delivery status updated to ${newStatus}.`,
          lat:
            payload.lat !== undefined && payload.lat !== null
              ? new Prisma.Decimal(payload.lat)
              : null,
          lng:
            payload.lng !== undefined && payload.lng !== null
              ? new Prisma.Decimal(payload.lng)
              : null,
        },
      });

      let orderStatus: string | null = null;
      const currentOrderStatus = delivery.order?.status;

      if (currentOrderStatus === 'return_approved') {
        if (newStatus === 'delivered') orderStatus = 'returned_to_origin';
      } else if (
        currentOrderStatus === 'replacement_approved' ||
        currentOrderStatus === 'replacement_shipped'
      ) {
        if (newStatus === 'picked_up') orderStatus = 'replacement_shipped';
        else if (newStatus === 'out_for_delivery')
          orderStatus = 'replacement_shipped';
        else if (newStatus === 'delivered') orderStatus = 'replaced';
        else if (newStatus === 'delivery_failed')
          orderStatus = 'delivery_failed';
      } else if (currentOrderStatus === 'refund_approved') {
        if (newStatus === 'delivered') orderStatus = 'refunded';
        else if (newStatus === 'delivery_failed')
          orderStatus = 'delivery_failed';
      } else {
        if (newStatus === 'picked_up') orderStatus = 'shipped';
        else if (newStatus === 'out_for_delivery')
          orderStatus = 'out_for_delivery';
        else if (newStatus === 'delivered') orderStatus = 'delivered';
        else if (newStatus === 'delivery_failed')
          orderStatus = 'delivery_failed';
      }

      if (orderStatus) {
        const orderData: any = { status: orderStatus as any };
        if (orderStatus === 'delivered') {
          orderData.deliveredAt = new Date();
        }
        await tx.order.update({
          where: { id: delivery.orderId },
          data: orderData,
        });

        await tx.orderTimeline.create({
          data: {
            orderId: delivery.orderId,
            status: orderStatus as any,
            note: `Delivery update: Partner marked as ${newStatus}.`,
            actorId: partnerUserId,
            actorRole: 'delivery' as any,
          },
        });
      }

      if (newStatus === 'delivered') {
        await tx.deliveryPartner.update({
          where: { id: partnerId },
          data: { totalDelivered: { increment: 1 } },
        });
      } else if (newStatus === 'delivery_failed') {
        await tx.deliveryPartner.update({
          where: { id: partnerId },
          data: { totalFailed: { increment: 1 } },
        });
      }

      return updatedDelivery;
    });
  }
}
