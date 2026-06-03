import { Request, Response, NextFunction } from 'express';
import prisma from '../db/client.js';

export const applyToBecomeSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { shopName, shopSlug, description, gstin, panNumber, addressLine, city, state, pincode } = req.body;

    // Check if seller profile already exists
    const existing = await prisma.seller.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'rejected') {
        // Re-apply logic: update existing rejected application
        const updated = await prisma.seller.update({
          where: { userId },
          data: {
            status: 'pending',
            rejectionReason: null,
            shopName,
            shopSlug,
            description,
            gstin,
            panNumber,
            addressLine,
            city,
            state,
            pincode,
          },
        });
        return res.json({
          success: true,
          message: 'Seller application re-submitted successfully.',
          data: updated,
        });
      }

      return res.status(400).json({
        success: false,
        message: `You already have a seller profile with status: ${existing.status}`,
      });
    }

    // Ensure shopSlug is unique
    const existingSlug = await prisma.seller.findUnique({
      where: { shopSlug },
    });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'Shop slug is already taken. Please choose another one.',
      });
    }

    const seller = await prisma.seller.create({
      data: {
        userId,
        status: 'pending',
        shopName,
        shopSlug,
        description,
        gstin,
        panNumber,
        addressLine,
        city,
        state,
        pincode,
      },
    });

    res.json({
      success: true,
      message: 'Seller application submitted successfully.',
      data: seller,
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      data: seller,
    });
  } catch (err) {
    next(err);
  }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await prisma.seller.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
};

export const approveSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller application not found.' });
    }

    if (seller.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be approved.' });
    }

    const updated = await prisma.seller.update({
      where: { id },
      data: {
        status: 'approved',
        rejectionReason: null,
        user: {
          update: {
            role: 'seller',
          },
        },
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: seller.userId,
        type: 'general',
        title: 'Application Approved',
        body: 'Your seller application has been approved.',
      },
    });

    res.json({
      success: true,
      message: 'Seller application approved.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const rejectSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller application not found.' });
    }

    if (seller.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be rejected.' });
    }

    const updated = await prisma.seller.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: seller.userId,
        type: 'general',
        title: 'Application Rejected',
        body: 'Your seller application has been rejected.',
      },
    });

    res.json({
      success: true,
      message: 'Seller application rejected.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const suspendSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    if (seller.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved sellers can be suspended.' });
    }

    const updated = await prisma.seller.update({
      where: { id },
      data: {
        status: 'suspended',
      },
    });

    res.json({
      success: true,
      message: 'Seller suspended.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const reactivateSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    if (seller.status !== 'suspended') {
      return res.status(400).json({ success: false, message: 'Only suspended sellers can be reactivated.' });
    }

    const updated = await prisma.seller.update({
      where: { id },
      data: {
        status: 'approved',
        user: {
          update: {
            role: 'seller'
          }
        }
      },
    });

    res.json({
      success: true,
      message: 'Seller reactivated.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// DELIVERY PARTNER ONBOARDING AND APPROVAL
// ============================================================================

export const applyToBecomeDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { vehicleType, vehicleNumber, aadhaarNumber, panNumber, drivingLicense, emergencyContactName, emergencyContactPhone, addressLine, city, state, pincode } = req.body;

    const existing = await prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'rejected') {
        const updated = await prisma.deliveryPartner.update({
          where: { userId },
          data: {
            status: 'pending',
            rejectionReason: null,
            vehicleType: vehicleType || existing.vehicleType,
            vehicleNumber,
            aadhaarNumber,
            panNumber,
            drivingLicense,
            emergencyContactName,
            emergencyContactPhone,
            addressLine,
            city,
            state,
            pincode,
          },
        });
        return res.json({
          success: true,
          message: 'Delivery partner application re-submitted successfully.',
          data: updated,
        });
      }

      return res.status(400).json({
        success: false,
        message: `You already have a delivery partner profile with status: ${existing.status}`,
      });
    }

    const newPartner = await prisma.deliveryPartner.create({
      data: {
        userId,
        status: 'pending',
        vehicleType: vehicleType || 'bike',
        vehicleNumber,
        isAvailable: false,
        aadhaarNumber,
        panNumber,
        drivingLicense,
        emergencyContactName,
        emergencyContactPhone,
        addressLine,
        city,
        state,
        pincode,
      },
    });

    res.json({
      success: true,
      message: 'Delivery partner application submitted successfully.',
      data: newPartner,
    });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryPartnerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      data: partner,
    });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partners = await prisma.deliveryPartner.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: partners,
    });
  } catch (err) {
    next(err);
  }
};

export const approveDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;

    const partner = await prisma.deliveryPartner.findUnique({ where: { id } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found.' });
    }

    if (partner.status !== 'pending' && partner.status !== 'suspended') {
      return res.status(400).json({ success: false, message: 'Only pending or suspended applications can be approved.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.deliveryPartner.update({
        where: { id },
        data: {
          status: 'approved',
          isAvailable: true,
          rejectionReason: null,
          approvedAt: new Date(),
          approvedBy: adminId,
          user: {
            update: {
              role: 'delivery',
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: p.userId,
          type: 'general',
          title: 'Delivery Partner Approved',
          body: 'Your delivery partner application has been approved. You can now access the Delivery Dashboard.',
          targetUrl: '/delivery',
        },
      });

      return p;
    });

    res.json({
      success: true,
      message: 'Delivery partner approved.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const rejectDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const partner = await prisma.deliveryPartner.findUnique({ where: { id } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found.' });
    }

    if (partner.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be rejected.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.deliveryPartner.update({
        where: { id },
        data: {
          status: 'rejected',
          isAvailable: false,
          rejectionReason: reason,
          rejectedAt: new Date(),
          rejectedBy: adminId,
        },
      });

      await tx.notification.create({
        data: {
          userId: p.userId,
          type: 'general',
          title: 'Delivery Partner Rejected',
          body: `Your delivery partner application has been rejected. Reason: ${reason}`,
          targetUrl: '/shop/become-delivery-partner',
        },
      });

      return p;
    });

    res.json({
      success: true,
      message: 'Delivery partner application rejected.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const suspendDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;

    const partner = await prisma.deliveryPartner.findUnique({ where: { id } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found.' });
    }

    if (partner.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved delivery partners can be suspended.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.deliveryPartner.update({
        where: { id },
        data: {
          status: 'suspended',
          isAvailable: false,
          suspendedAt: new Date(),
          suspendedBy: adminId,
        },
      });

      await tx.notification.create({
        data: {
          userId: p.userId,
          type: 'general',
          title: 'Delivery Partner Suspended',
          body: 'Your delivery partner account has been suspended by an administrator.',
          targetUrl: '/shop/profile',
        },
      });

      return p;
    });

    res.json({
      success: true,
      message: 'Delivery partner suspended.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const reactivateDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;

    const partner = await prisma.deliveryPartner.findUnique({ where: { id } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found.' });
    }

    if (partner.status !== 'suspended') {
      return res.status(400).json({ success: false, message: 'Only suspended delivery partners can be reactivated.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.deliveryPartner.update({
        where: { id },
        data: {
          status: 'approved',
          isAvailable: true,
          approvedAt: new Date(),
          approvedBy: adminId,
          user: {
            update: {
              role: 'delivery',
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: p.userId,
          type: 'general',
          title: 'Delivery Partner Reactivated',
          body: 'Your delivery partner account has been reactivated. You can now access the Delivery Dashboard.',
          targetUrl: '/delivery',
        },
      });

      return p;
    });

    res.json({
      success: true,
      message: 'Delivery partner reactivated.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
