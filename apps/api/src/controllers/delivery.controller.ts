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

    const { DeliveryService } = await import('../services/delivery.service.js');
    const result = await DeliveryService.acceptAssignment(orderId, partner.id, userId);

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

    const { DeliveryService } = await import('../services/delivery.service.js');
    const result = await DeliveryService.updateAssignmentStatus(id, partner.id, userId, newStatus, {
      note,
      proofImageUrl,
      proofS3Key,
      failureReason,
      lat,
      lng,
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

/**
 * Get available return pickups for the logged-in partner.
 */
export const getAvailableReturnPickups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery Partner profile not found.',
      });
    }

    const { ReturnDeliveryService } = await import('../services/return_delivery.service.js');
    const available = await ReturnDeliveryService.getAvailableReturnPickups(partner.id);

    res.json({
      success: true,
      data: available,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Accept an available return pickup assignment.
 */
export const acceptReturnPickup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orderId = req.params.orderId as string;

    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery Partner profile not found.' });
    }

    const { ReturnDeliveryService } = await import('../services/return_delivery.service.js');
    const order = await ReturnDeliveryService.acceptReturnPickup(orderId, partner.id, userId);

    res.json({
      success: true,
      message: 'Return pickup accepted successfully.',
      data: order,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Get active assigned return pickups
 */
export const getReturnQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery Partner profile not found.' });
    }

    const { ReturnDeliveryService } = await import('../services/return_delivery.service.js');
    const queue = await ReturnDeliveryService.getQueue(partner.id);

    res.json({
      success: true,
      data: queue,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get history of completed return pickups
 */
export const getReturnHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery Partner profile not found.' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { ReturnDeliveryService } = await import('../services/return_delivery.service.js');
    const { history, total } = await ReturnDeliveryService.getHistory(partner.id, page, limit);

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
 * Mark a return as picked up
 */
export const markReturnPickedUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orderId = req.params.orderId as string;

    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery Partner profile not found.' });
    }

    const { ReturnDeliveryService } = await import('../services/return_delivery.service.js');
    const order = await ReturnDeliveryService.markReturnPickedUp(orderId, partner.id, userId);

    res.json({
      success: true,
      message: 'Return marked as picked up successfully.',
      data: order,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Mark a return as completed (delivered to seller)
 */
export const markReturnCompleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orderId = req.params.orderId as string;

    const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery Partner profile not found.' });
    }

    const { ReturnDeliveryService } = await import('../services/return_delivery.service.js');
    const order = await ReturnDeliveryService.markReturnCompleted(orderId, partner.id, userId);

    res.json({
      success: true,
      message: 'Return marked as completed successfully.',
      data: order,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};
