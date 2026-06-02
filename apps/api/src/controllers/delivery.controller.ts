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
 * Get active assigned/accepted task queue
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

    const queue = await prisma.delivery.findMany({
      where: {
        partnerId: partner.id,
        status: {
          in: ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery'],
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
 * Get past trips (delivered / failed / returned)
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

    const history = await prisma.delivery.findMany({
      where: {
        partnerId: partner.id,
        status: {
          in: ['delivered', 'delivery_failed', 'returned_to_origin'],
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
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update delivery assignment status and sync corresponding Order state
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

    if (!delivery || delivery.partnerId !== partner.id) {
      return res.status(404).json({
        success: false,
        message: 'Delivery assignment not found or unauthorized.',
      });
    }

    const VALID_STATUSES = ['accepted', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed'];
    if (!VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery status target. Supported: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the delivery record
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (newStatus === 'accepted') {
        updateData.acceptedAt = new Date();
      } else if (newStatus === 'picked_up') {
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

      // 2. Add Timeline event
      await tx.deliveryTimeline.create({
        data: {
          deliveryId: id,
          status: newStatus,
          note: note || `Status updated to ${newStatus}`,
          lat: lat !== undefined && lat !== null ? new Prisma.Decimal(lat) : null,
          lng: lng !== undefined && lng !== null ? new Prisma.Decimal(lng) : null,
        },
      });

      // 3. Map delivery status change back to the Order model based on current workflow!
      let orderStatus: string | null = null;
      const currentOrderStatus = delivery.order?.status;

      if (currentOrderStatus === 'return_approved') {
        if (newStatus === 'delivered') {
          orderStatus = 'returned_to_origin';
        }
      } else if (currentOrderStatus === 'replacement_approved' || currentOrderStatus === 'replacement_shipped') {
        if (newStatus === 'picked_up') {
          orderStatus = 'replacement_shipped';
        } else if (newStatus === 'in_transit' || newStatus === 'out_for_delivery') {
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
        // Standard flow
        if (newStatus === 'picked_up') {
          orderStatus = 'shipped';
        } else if (newStatus === 'in_transit' || newStatus === 'out_for_delivery') {
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
            note: `Delivery update: Partner marked order as ${newStatus}.`,
          },
        });
      }

      // If delivered successfully, increment totalDelivered count on courier
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
