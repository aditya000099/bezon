import { Request, Response } from 'express';
import prisma from '../db/client.js';
import { SettlementService } from '../services/settlement.service.js';

export const getAdminSettlementMetrics = async (req: Request, res: Response) => {
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    // Escrow metrics
    let escrowBalance = 0;
    if (adminUser) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: adminUser.id } });
      escrowBalance = wallet ? Number(wallet.balance) : 0;
    }

    // Aggregate holding settlements
    const holdingResult = await prisma.order.aggregate({
      where: { settlementStatus: 'HOLDING' },
      _sum: { settlementAmount: true },
      _count: true,
    });
    
    // Aggregate settled amounts
    const settledResult = await prisma.order.aggregate({
      where: { settlementStatus: 'SETTLED' },
      _sum: { settlementAmount: true },
    });

    // Aggregate refunded amounts
    const refundedResult = await prisma.order.aggregate({
      where: { settlementStatus: 'REFUNDED' },
      _sum: { refundAmount: true },
    });

    res.json({
      success: true,
      data: {
        escrowBalance,
        fundsOnHold: Number(holdingResult._sum.settlementAmount || 0),
        holdingOrdersCount: holdingResult._count,
        settledAmount: Number(settledResult._sum.settlementAmount || 0),
        refundedAmount: Number(refundedResult._sum.refundAmount || 0),
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin settlement metrics:', error);
    res.status(500).json({ success: false, message: 'Server error fetching metrics' });
  }
};

export const getAdminEscrowTransactions = async (req: Request, res: Response) => {
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!adminUser) return res.status(404).json({ success: false, message: 'Admin user not found' });

    const wallet = await prisma.wallet.findUnique({ where: { userId: adminUser.id } });
    if (!wallet) return res.json({ success: true, data: [] });

    // Fetch transactions
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for recent transactions
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error: any) {
    console.error('Error fetching admin escrow transactions:', error);
    res.status(500).json({ success: false, message: 'Server error fetching transactions' });
  }
};

export const processSettlementsManual = async (req: Request, res: Response) => {
  try {
    const result = await SettlementService.processSettlements();
    res.json({
      success: true,
      data: result,
      message: 'Manual settlement processing completed successfully.'
    });
  } catch (error: any) {
    console.error('Error processing manual settlements:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error processing settlements' });
  }
};
