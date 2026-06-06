import { Request, Response, NextFunction } from 'express';
import prisma from '../db/client.js';

export const getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveriesPendingPickup = await prisma.order.count({ where: { status: 'ready_for_pickup' } });
    
    // Stuck > 24 hours (assigned, picked_up, out_for_delivery but not updated in 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deliveriesStuck = await prisma.delivery.count({
      where: {
        status: { in: ['assigned', 'picked_up', 'out_for_delivery'] },
        updatedAt: { lt: twentyFourHoursAgo }
      }
    });

    const returnPickupsPending = await prisma.order.count({
      where: { returnStatus: 'APPROVED', returnPartnerId: null }
    });

    const activeReturnPickups = await prisma.order.count({
      where: { returnStatus: { in: ['ASSIGNED', 'PICKED_UP'] } }
    });

    res.json({
      success: true,
      data: {
        deliveriesPendingPickup,
        deliveriesStuck,
        returnPickupsPending,
        activeReturnPickups
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await prisma.order.findMany({
      where: {
        status: { in: ['ready_for_pickup', 'assigned', 'shipped', 'out_for_delivery', 'delivered'] }
      },
      include: {
        delivery: { include: { partner: { include: { user: true } } } },
        customer: true,
        seller: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

export const getReturnPickups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const returns = await prisma.order.findMany({
      where: {
        returnStatus: { in: ['APPROVED', 'ASSIGNED', 'PICKED_UP', 'COMPLETED'] }
      },
      include: {
        customer: true,
        seller: true,
        returnPartner: { include: { user: true } }
      },
      orderBy: { returnApprovedAt: 'desc' }
    });
    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

export const getPartners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partners = await prisma.deliveryPartner.findMany({
      include: { user: true }
    });
    
    // Enrich with metrics
    const enriched = await Promise.all(partners.map(async (partner) => {
      const activeDeliveries = await prisma.delivery.count({
        where: { partnerId: partner.id, status: { in: ['assigned', 'picked_up', 'out_for_delivery'] } }
      });
      const activeReturns = await prisma.order.count({
        where: { returnPartnerId: partner.id, returnStatus: { in: ['ASSIGNED', 'PICKED_UP'] } }
      });

      const totalAssignedDeliveries = await prisma.delivery.count({ where: { partnerId: partner.id } });
      const completedDeliveries = partner.totalDelivered;
      const successRate = totalAssignedDeliveries > 0 ? (completedDeliveries / totalAssignedDeliveries) * 100 : 0;
      
      const returnsCompleted = await prisma.order.count({ where: { returnPartnerId: partner.id, returnStatus: 'COMPLETED' } });

      let partnerStatus = 'Inactive';
      if (partner.status === 'suspended') partnerStatus = 'Suspended';
      else if (activeDeliveries > 0 || activeReturns > 0) partnerStatus = 'Busy';
      else if (partner.isAvailable) partnerStatus = 'Available';

      return {
        ...partner,
        partnerStatus,
        activeTasks: activeDeliveries + activeReturns,
        successRate,
        returnsCompleted
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

export const getExceptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveryExceptions = await prisma.delivery.findMany({
      where: { failureReason: { not: null } },
      include: { order: true, partner: { include: { user: true } } }
    });
    
    // For return pickups, we'd check if there's any failure. Since return exceptions don't have a direct field, we might look at REJECTED returns if applicable, or just leave empty for now.
    const returnPickupsExceptions = await prisma.order.findMany({
      where: { returnStatus: 'REJECTED' },
      include: { customer: true, returnPartner: { include: { user: true } } }
    });

    res.json({
      success: true,
      data: {
        deliveryExceptions,
        returnPickupsExceptions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCityAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Group by seller city for deliveries
    const deliveriesByCity = await prisma.seller.groupBy({
      by: ['city'],
      _count: { city: true }
    });
    
    const partnersByCity = await prisma.deliveryPartner.groupBy({
      by: ['city'],
      _count: { city: true },
      where: { status: 'approved' }
    });

    const cityStats: any = {};
    deliveriesByCity.forEach(d => {
      if (d.city) cityStats[d.city] = { deliveries: d._count.city, partners: 0 };
    });
    partnersByCity.forEach(p => {
      if (p.city) {
        if (!cityStats[p.city]) cityStats[p.city] = { deliveries: 0, partners: 0 };
        cityStats[p.city].partners = p._count.city;
      }
    });

    res.json({ success: true, data: Object.entries(cityStats).map(([city, stats]: any) => ({ city, ...stats })) });
  } catch (error) {
    next(error);
  }
};

export const getPartnerDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const activeDeliveries = await prisma.delivery.findMany({
      where: { partnerId: partner.id, status: { in: ['assigned', 'picked_up', 'out_for_delivery'] } },
      include: { order: { include: { seller: true, customer: true } } }
    });
    
    const activeReturns = await prisma.order.findMany({
      where: { returnPartnerId: partner.id, returnStatus: { in: ['ASSIGNED', 'PICKED_UP'] } },
      include: { seller: true, customer: true }
    });

    const deliveryHistory = await prisma.delivery.findMany({
      where: { partnerId: partner.id, status: { in: ['delivered', 'delivery_failed', 'returned_to_origin'] } },
      include: { order: true },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    const returnsCompleted = await prisma.order.findMany({
      where: { returnPartnerId: partner.id, returnStatus: 'COMPLETED' },
      orderBy: { returnCompletedAt: 'desc' },
      take: 20
    });

    const totalAssignedDeliveries = await prisma.delivery.count({ where: { partnerId: partner.id } });
    const completedDeliveries = partner.totalDelivered;
    const successRate = totalAssignedDeliveries > 0 ? (completedDeliveries / totalAssignedDeliveries) * 100 : 0;

    let partnerStatus = 'Inactive';
    if (partner.status === 'suspended') partnerStatus = 'Suspended';
    else if (activeDeliveries.length > 0 || activeReturns.length > 0) partnerStatus = 'Busy';
    else if (partner.isAvailable) partnerStatus = 'Available';

    res.json({
      success: true,
      data: {
        partner: { ...partner, successRate, partnerStatus, totalAssignedDeliveries },
        activeAssignments: [...activeDeliveries.map(d => ({ type: 'delivery', ...d })), ...activeReturns.map(r => ({ type: 'return', ...r }))],
        history: { deliveryHistory, returnsCompleted }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string; // Could be delivery id or order id. Let's assume orderId for simplicity.
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        seller: true,
        delivery: { include: { partner: { include: { user: true } }, timeline: { orderBy: { createdAt: 'asc' } } } },
        timeline: { orderBy: { createdAt: 'asc' } },
        returnPartner: { include: { user: true } }
      }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const reassignDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveryId = req.params.id as string;
    const { newPartnerId } = req.body;
    const adminId = req.user!.id;

    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId }, include: { order: { include: { seller: true } }, partner: { include: { user: true } } } }) as any;
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    
    if (['delivered', 'delivery_failed', 'returned_to_origin'].includes(delivery.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reassign completed delivery' });
    }

    const newPartner = await prisma.deliveryPartner.findUnique({ where: { id: newPartnerId }, include: { user: true } });
    if (!newPartner || newPartner.status !== 'approved' || !newPartner.isAvailable) {
      return res.status(400).json({ success: false, message: 'New partner is not approved or not available' });
    }

    if (newPartner.city !== delivery.order.seller.city) {
      return res.status(400).json({ success: false, message: `New partner must be in ${delivery.order.seller.city}` });
    }

    const oldPartnerName = delivery.partner ? delivery.partner.user.name : 'Unassigned';

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: { partnerId: newPartner.id }
      });

      await tx.deliveryTimeline.create({
        data: {
          deliveryId: deliveryId,
          status: delivery.status,
          note: `Delivery Reassigned\n\nOld Partner: ${oldPartnerName}\nNew Partner: ${newPartner.user.name}\nAdmin: Reassigned by Admin`
        }
      });

      // Notify new partner
      await tx.notification.create({
        data: {
          userId: newPartner.userId,
          title: 'New Delivery Assigned',
          body: `Admin assigned you a new delivery for order ${delivery.order.orderNumber}.`,
          type: 'new_task_assigned'
        }
      });

      // Notify old partner
      if (delivery.partnerId) {
        await tx.notification.create({
          data: {
            userId: delivery.partner.userId,
            title: 'Delivery Reassigned',
            body: `Admin reassigned your delivery for order ${delivery.order.orderNumber} to another partner.`,
            type: 'general'
          }
        });
      }
    });

    res.json({ success: true, message: 'Delivery reassigned successfully' });
  } catch (error) {
    next(error);
  }
};

export const reassignReturnPickup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.orderId as string;
    const { newPartnerId } = req.body;
    const adminId = req.user!.id;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true, returnPartner: { include: { user: true } } } }) as any;
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.returnStatus === 'COMPLETED' || order.returnStatus === 'NONE' || order.returnStatus === 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Return pickup cannot be reassigned in this state' });
    }

    const newPartner = await prisma.deliveryPartner.findUnique({ where: { id: newPartnerId }, include: { user: true } });
    if (!newPartner || newPartner.status !== 'approved' || !newPartner.isAvailable) {
      return res.status(400).json({ success: false, message: 'New partner is not approved or not available' });
    }

    // Usually customer.addressSnapshot is not guaranteed to be joined directly but we can check city from order.addressSnapshot if available.
    // order.addressSnapshot is a JSON object.
    const addressSnapshot = order.addressSnapshot as any;
    if (addressSnapshot?.city && newPartner.city !== addressSnapshot.city) {
      return res.status(400).json({ success: false, message: `New partner must be in ${addressSnapshot.city}` });
    }

    const oldPartnerName = order.returnPartner ? order.returnPartner.user.name : 'Unassigned';

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { returnPartnerId: newPartner.id }
      });

      await tx.orderTimeline.create({
        data: {
          orderId: orderId,
          status: 'delivered', // Timeline doesn't have a specific return status
          note: `Return Pickup Reassigned\n\nOld Partner: ${oldPartnerName}\nNew Partner: ${newPartner.user.name}\nAdmin: Reassigned by Admin`,
          actorRole: 'admin',
          actorId: adminId
        }
      });

      // Notify new partner
      await tx.notification.create({
        data: {
          userId: newPartner.userId,
          title: 'New Return Pickup Assigned',
          body: `Admin assigned you a return pickup for order ${order.orderNumber}.`,
          type: 'new_task_assigned'
        }
      });

      // Notify old partner
      if (order.returnPartnerId) {
        await tx.notification.create({
          data: {
            userId: order.returnPartner.userId,
            title: 'Return Pickup Reassigned',
            body: `Admin reassigned your return pickup for order ${order.orderNumber} to another partner.`,
            type: 'general'
          }
        });
      }
    });

    res.json({ success: true, message: 'Return pickup reassigned successfully' });
  } catch (error) {
    next(error);
  }
};
