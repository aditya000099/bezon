import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service.js';

// GET /wallet/me — seller or admin gets own wallet
export const getMyWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await WalletService.getWalletByUserId(req.user!.id);
    res.json({ success: true, data: wallet });
  } catch (err) {
    next(err);
  }
};

// GET /wallet/transactions — paginated transaction history
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await WalletService.getOrCreateWallet(req.user!.id);
    const { page, limit, type, referenceType } = req.query;
    const result = await WalletService.getTransactions(wallet.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type: type as string | undefined,
      referenceType: referenceType as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /wallet/all — admin: list all wallets
export const getAllWallets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search } = req.query;
    const result = await WalletService.getAllWallets({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /wallet/manual-credit — admin: manually credit a user's wallet
export const manualCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount || !description) {
      return res.status(400).json({ success: false, message: 'userId, amount, and description are required.' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive.' });
    }
    const result = await WalletService.creditWallet(userId, Number(amount), 'manual_credit', null, description);
    res.json({ success: true, message: `₹${amount} credited successfully.`, data: result });
  } catch (err) {
    next(err);
  }
};
