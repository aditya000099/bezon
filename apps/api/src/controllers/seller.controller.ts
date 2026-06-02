import { Request, Response, NextFunction } from 'express';
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
    const { shopName, description, gstin, panNumber, bankName, bankAccount, ifsc } = req.body;

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
