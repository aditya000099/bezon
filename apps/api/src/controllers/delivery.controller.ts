import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../db/client.js';

/**
 * Fetch delivery partner profile
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update delivery partner settings and home address details
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { vehicleType, vehicleNumber, isAvailable, addressLine, city, state, pincode, lat, lng } = req.body;

    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    const updated = await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        vehicleType: vehicleType !== undefined ? vehicleType : partner.vehicleType,
        vehicleNumber: vehicleNumber !== undefined ? vehicleNumber : partner.vehicleNumber,
        isAvailable: isAvailable !== undefined ? !!isAvailable : partner.isAvailable,
        addressLine: addressLine !== undefined ? addressLine : partner.addressLine,
        city: city !== undefined ? city : partner.city,
        state: state !== undefined ? state : partner.state,
        pincode: pincode !== undefined ? pincode : partner.pincode,
        lat: lat !== undefined && lat !== null ? new Prisma.Decimal(lat) : partner.lat,
        lng: lng !== undefined && lng !== null ? new Prisma.Decimal(lng) : partner.lng,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Delivery Profile updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update current geocoded coordinates in real-time
 */
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude coordinates are required.',
      });
    }

    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    const updated = await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        currentLat: new Prisma.Decimal(lat),
        currentLng: new Prisma.Decimal(lng),
      },
    });

    res.json({
      success: true,
      message: 'Real-time location updated.',
      data: {
        currentLat: updated.currentLat,
        currentLng: updated.currentLng,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get available assignments that any delivery partner can claim.
 * Returns Delivery records where partnerId IS NULL and the linked Order
 * is in READY_FOR_PICKUP status.
 */
export const getAvailableAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    const { DeliveryPoolService } = await import('../services/delivery_pool.service.js');
    const available = await DeliveryPoolService.getAvailableOrdersForPartner(partner.id);

    res.json({
      success: true,
      data: available,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Accept an unassigned delivery assignment.
 * Claims a delivery for the calling partner. The Order remains at
 * READY_FOR_PICKUP until the partner physically picks up the package.
 */
export const acceptAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orderId = req.params.orderId as string;

    // Validate UUID to prevent Prisma Validation Errors
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!orderId || orderId === 'undefined' || !uuidRegex.test(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner || !partner.isAvailable || partner.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Delivery Partner is not eligible to accept assignments.',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock-read the order to prevent race conditions
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { delivery: true },
      });

      if (!order) {
        throw Object.assign(new Error('Order not found.'), { status: 404 });
      }

      if (order.status !== 'ready_for_pickup') {
        throw Object.assign(new Error('This order is no longer available for assignment.'), { status: 400 });
      }

      if (order.delivery !== null) {
        throw Object.assign(new Error('Order already assigned.'), { status: 409 });
      }

      // Claim the delivery by creating the delivery record
      const newDelivery = await tx.delivery.create({
        data: {
          orderId: order.id,
          partnerId: partner.id,
          status: 'assigned',
          acceptedAt: new Date(),
        },
      });

      // Update Order status to 'assigned'
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'assigned' },
      });

      // Create delivery timeline event
      await tx.deliveryTimeline.create({
        data: {
          deliveryId: newDelivery.id,
          status: 'assigned',
          note: `Delivery partner accepted the assignment.`,
        },
      });

      // Create order timeline event
      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'assigned',
          note: `Delivery partner accepted the trip assignment. Awaiting package pickup.`,
          actorId: userId,
          actorRole: 'delivery',
        },
      });

      // Notify the partner
      await tx.notification.create({
        data: {
          userId: partner.userId,
          title: 'Assignment Accepted',
          body: `You accepted delivery for order ${order.orderNumber}. Proceed to pickup.`,
          type: 'new_task_assigned',
        },
      });

      return newDelivery;
    });

    res.json({
      success: true,
      message: 'Assignment accepted successfully. Proceed to pickup location.',
      data: result,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Get active assigned/accepted task queue for the logged-in partner.
 * Excludes deliveries whose linked Order is in a terminal state.
 */
export const getQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    // Terminal order states where delivery actions no longer apply
    const terminalOrderStatuses = [
      'delivered',
      'cancelled',
      'delivery_failed',
      'refunded',
      'replaced',
    ];

    const queue = await prisma.delivery.findMany({
      where: {
        partnerId: partner.id,
        status: {
          in: ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery'],
        },
        order: {
          status: {
            notIn: terminalOrderStatuses as any,
          },
        },
      },
      include: {
        order: {
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
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: queue,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get past trips (delivered / failed / returned) with pagination
 */
export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const whereClause = {
      partnerId: partner.id,
      status: {
        in: ['delivered', 'delivery_failed', 'returned_to_origin'] as any,
      },
    };

    const [history, total] = await Promise.all([
      prisma.delivery.findMany({
        where: whereClause,
        include: {
          order: {
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
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.delivery.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Strict delivery status transition map.
 * Only these transitions are allowed for delivery partners.
 */
const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  assigned: ['picked_up', 'accepted'],
  accepted: ['picked_up'],
  picked_up: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'delivery_failed'],
};

/** Terminal delivery statuses — no further actions allowed */
const TERMINAL_DELIVERY_STATUSES = ['delivered', 'delivery_failed', 'returned_to_origin'];

/**
 * Update delivery assignment status and sync corresponding Order state.
 * Enforces strict transition validation and ownership checks.
 */
export const updateAssignmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string; // delivery id
    const { status: newStatus, note, proofImageUrl, proofS3Key, failureReason, lat, lng } = req.body;

    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery assignment not found.',
      });
    }

    // Ownership enforcement: only the assigned partner can update
    if (delivery.partnerId === null || delivery.partnerId !== partner.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not the assigned delivery partner for this order.',
      });
    }

    // Terminal state check
    if (TERMINAL_DELIVERY_STATUSES.includes(delivery.status)) {
      return res.status(400).json({
        success: false,
        message: `This delivery is in terminal state "${delivery.status}". No further actions are allowed.`,
      });
    }

    // Strict transition validation
    const allowedNext = DELIVERY_TRANSITIONS[delivery.status];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition delivery from "${delivery.status}" to "${newStatus}". Allowed transitions: ${(allowedNext || []).join(', ') || 'none'}.`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the delivery record
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (newStatus === 'picked_up') {
        updateData.pickedUpAt = new Date();
      } else if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date();
        updateData.proofImageUrl = proofImageUrl || null;
        updateData.proofS3Key = proofS3Key || null;
      } else if (newStatus === 'delivery_failed') {
        updateData.failureReason = failureReason || 'Failed to deliver';
      }

      const updatedDelivery = await tx.delivery.update({
        where: { id },
        data: updateData,
      });

      // 2. Create Delivery Timeline event for every transition
      await tx.deliveryTimeline.create({
        data: {
          deliveryId: id,
          status: newStatus,
          note: note || `Delivery status updated to ${newStatus}.`,
          lat: lat !== undefined && lat !== null ? new Prisma.Decimal(lat) : null,
          lng: lng !== undefined && lng !== null ? new Prisma.Decimal(lng) : null,
        },
      });

      // 3. Map delivery status to Order status
      let orderStatus: string | null = null;
      const currentOrderStatus = delivery.order?.status;

      // Handle policy flows (return/replacement/refund)
      if (currentOrderStatus === 'return_approved') {
        if (newStatus === 'delivered') {
          orderStatus = 'returned_to_origin';
        }
      } else if (currentOrderStatus === 'replacement_approved' || currentOrderStatus === 'replacement_shipped') {
        if (newStatus === 'picked_up') {
          orderStatus = 'replacement_shipped';
        } else if (newStatus === 'out_for_delivery') {
          orderStatus = 'replacement_shipped';
        } else if (newStatus === 'delivered') {
          orderStatus = 'replaced';
        } else if (newStatus === 'delivery_failed') {
          orderStatus = 'delivery_failed';
        }
      } else if (currentOrderStatus === 'refund_approved') {
        if (newStatus === 'delivered') {
          orderStatus = 'refunded';
        } else if (newStatus === 'delivery_failed') {
          orderStatus = 'delivery_failed';
        }
      } else {
        // Standard delivery flow
        if (newStatus === 'picked_up') {
          orderStatus = 'shipped';
        } else if (newStatus === 'out_for_delivery') {
          orderStatus = 'out_for_delivery';
        } else if (newStatus === 'delivered') {
          orderStatus = 'delivered';
        } else if (newStatus === 'delivery_failed') {
          orderStatus = 'delivery_failed';
        }
      }

      if (orderStatus) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: orderStatus as any },
        });

        await tx.orderTimeline.create({
          data: {
            orderId: delivery.orderId,
            status: orderStatus as any,
            note: `Delivery update: Partner marked as ${newStatus}.`,
            actorId: userId,
            actorRole: 'delivery' as any,
          },
        });
      }

      // 4. Update partner statistics on terminal delivery states
      if (newStatus === 'delivered') {
        await tx.deliveryPartner.update({
          where: { id: partner.id },
          data: { totalDelivered: { increment: 1 } },
        });
      } else if (newStatus === 'delivery_failed') {
        await tx.deliveryPartner.update({
          where: { id: partner.id },
          data: { totalFailed: { increment: 1 } },
        });
      }

      return updatedDelivery;
    });

    res.json({
      success: true,
      message: 'Fulfillment stage updated successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
