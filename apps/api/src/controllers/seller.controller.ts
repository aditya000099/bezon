import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../db/client.js';
import { CryptoUtil } from '../utils/crypto.util.js';

/**
 * Get seller settings
 */
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user!.id },
    });

    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller profile not found' });
      return;
    }

    // Decrypt bank details for frontend
    const bankName = seller.bankNameEnc ? CryptoUtil.decrypt(seller.bankNameEnc) : '';
    const bankAccount = seller.bankAccountEnc ? CryptoUtil.decrypt(seller.bankAccountEnc) : '';
    const ifsc = seller.ifscEnc ? CryptoUtil.decrypt(seller.ifscEnc) : '';

    res.json({
      success: true,
      data: {
        shopName: seller.shopName,
        description: seller.description,
        gstin: seller.gstin,
        panNumber: seller.panNumber,
        addressLine: seller.addressLine || '',
        city: seller.city || '',
        state: seller.state || '',
        pincode: seller.pincode || '',
        lat: seller.lat || null,
        lng: seller.lng || null,
        bankName,
        bankAccount,
        ifsc,
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update seller settings
 */
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      shopName,
      description,
      gstin,
      panNumber,
      addressLine,
      city,
      state,
      pincode,
      lat,
      lng,
      bankName,
      bankAccount,
      ifsc,
    } = req.body;

    const seller = await prisma.seller.findUnique({
      where: { userId: req.user!.id },
    });

    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller profile not found' });
      return;
    }

    const dataToUpdate: any = {};
    if (shopName !== undefined) dataToUpdate.shopName = shopName;
    if (description !== undefined) dataToUpdate.description = description;
    if (gstin !== undefined) dataToUpdate.gstin = gstin;
    if (panNumber !== undefined) dataToUpdate.panNumber = panNumber;
    if (addressLine !== undefined) dataToUpdate.addressLine = addressLine;
    if (city !== undefined) dataToUpdate.city = city;
    if (state !== undefined) dataToUpdate.state = state;
    if (pincode !== undefined) dataToUpdate.pincode = pincode;
    if (lat !== undefined && lat !== null) dataToUpdate.lat = new Prisma.Decimal(lat);
    if (lng !== undefined && lng !== null) dataToUpdate.lng = new Prisma.Decimal(lng);

    // Encrypt bank details before saving
    if (bankName !== undefined) dataToUpdate.bankNameEnc = CryptoUtil.encrypt(bankName);
    if (bankAccount !== undefined) dataToUpdate.bankAccountEnc = CryptoUtil.encrypt(bankAccount);
    if (ifsc !== undefined) dataToUpdate.ifscEnc = CryptoUtil.encrypt(ifsc);

    const updatedSeller = await prisma.seller.update({
      where: { id: seller.id },
      data: dataToUpdate,
    });

    res.json({
      success: true,
      data: updatedSeller,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public endpoint to fetch seller shop profile and their published products
 */
export const getSellerShopBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const seller = await prisma.seller.findUnique({
      where: { shopSlug },
      select: {
        id: true,
        shopName: true,
        shopSlug: true,
        description: true,
        logoUrl: true,
        city: true,
        state: true,
        products: {
          where: { status: 'published' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            category: true,
          },
        },
      },
    });

    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller shop not found.' });
      return;
    }

    res.json({
      success: true,
      data: seller,
    });
  } catch (err) {
    next(err);
  }
};
