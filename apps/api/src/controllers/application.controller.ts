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
      where: {
        status: {
          in: ['pending', 'rejected'],
        },
      },
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

    const updated = await prisma.seller.update({
      where: { id },
      data: {
        status: 'approved',
        rejectionReason: null,
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
