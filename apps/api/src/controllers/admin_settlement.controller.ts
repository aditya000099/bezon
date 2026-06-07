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
      where: { settlementStatus: 'HOLDING', paymentStatus: 'paid' },
      _sum: { settlementAmount: true, total: true },
      _count: true,
    });
    
    // Aggregate settled amounts
    const settledResult = await prisma.order.aggregate({
      where: { settlementStatus: 'SETTLED' },
      _sum: { settlementAmount: true, total: true },
    });

    // Aggregate refunded amounts
    const refundedResult = await prisma.order.aggregate({
      where: { settlementStatus: 'REFUNDED' },
      _sum: { refundAmount: true },
      _count: true,
    });

    // Calculate Platform Revenue: (Total - SettlementAmount) for all paid orders that are not refunded? 
    // Actually, platform commission is earned on SETTLED orders.
    const platformRevenueResult = await prisma.order.aggregate({
      where: { settlementStatus: 'SETTLED' },
      _sum: { total: true, settlementAmount: true }
    });
    const platformRevenue = Number(platformRevenueResult._sum.total || 0) - Number(platformRevenueResult._sum.settlementAmount || 0);

    // Group holding funds by seller
    const holdingBySeller = await prisma.order.groupBy({
      by: ['sellerId'],
      where: { settlementStatus: 'HOLDING', paymentStatus: 'paid' },
      _sum: { settlementAmount: true, total: true },
      _count: { _all: true },
      orderBy: { _sum: { settlementAmount: 'desc' } }
    });

    const sellersAwaitingSettlement = holdingBySeller.length;

    // Fetch seller details for the grouped data
    const sellerIds = holdingBySeller.map(h => h.sellerId);
    const sellers = await prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, shopName: true }
    });
    const sellerMap = new Map(sellers.map(s => [s.id, s.shopName]));

    const fundsOnHoldBySeller = holdingBySeller.map(h => {
      const grossAmount = Number(h._sum.total || 0);
      const settlementAmt = Number(h._sum.settlementAmount || 0);
      return {
        sellerId: h.sellerId,
        shopName: sellerMap.get(h.sellerId) || 'Unknown Seller',
        pendingOrdersCount: h._count._all,
        grossAmountOnHold: grossAmount,
        commissionAmount: grossAmount - settlementAmt,
        expectedSettlementAmount: settlementAmt,
        // Estimation: +14 days from oldest order? Since we group, we don't have exact dates here.
        // We'll leave expectedSettlementDate to be calculated from actual orders in the queue
      };
    });

    res.json({
      success: true,
      data: {
        escrowBalance,
        fundsOnHold: Number(holdingResult._sum.settlementAmount || 0),
        holdingOrdersCount: holdingResult._count,
        settledAmount: Number(settledResult._sum.settlementAmount || 0),
        refundedAmount: Number(refundedResult._sum.refundAmount || 0),
        totalCommissionEarned: platformRevenue,
        totalSettlementsReleased: Number(settledResult._sum.settlementAmount || 0),
        totalRefundsProcessed: refundedResult._count,
        sellersAwaitingSettlement,
        escrowComposition: {
          fundsOnHold: Number(holdingResult._sum.settlementAmount || 0),
          settledAwaitingTransfer: 0,
          refundReserved: 0, // Simplified for now
          platformRevenue,
        },
        fundsOnHoldBySeller
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

export const getAdminSettlementQueue = async (req: Request, res: Response) => {
  try {
    const queue = await prisma.order.findMany({
      where: { settlementStatus: 'HOLDING', paymentStatus: 'paid' },
      include: {
        seller: { select: { shopName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const enrichedQueue = queue.map(order => {
      const grossAmount = Number(order.total || 0);
      const settlementAmt = Number(order.settlementAmount || 0);
      
      const expectedReleaseDate = new Date(order.createdAt);
      expectedReleaseDate.setDate(expectedReleaseDate.getDate() + 14); // Return window
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        seller: { shopName: order.seller?.shopName || 'Unknown' },
        total: grossAmount,
        commissionAmount: grossAmount - settlementAmt,
        settlementAmount: settlementAmt,
        createdAt: order.createdAt,
        expectedSettlementDate: expectedReleaseDate,
        settlementStatus: order.settlementStatus
      };
    });

    res.json({
      success: true,
      data: { queue: enrichedQueue, totalPages: 1 }
    });
  } catch (error: any) {
    console.error('Error fetching settlement queue:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settlement queue' });
  }
};
