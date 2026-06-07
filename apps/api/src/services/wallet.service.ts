import prisma from '../db/client.js';
import { PLATFORM_COMMISSION_RATE } from '../config/constants.js';

export class WalletService {
  // Get or auto-create wallet for a user
  static async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId } });
    }
    return wallet;
  }

  // Get wallet with balance and last 20 transactions
  static async getWalletByUserId(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { ...wallet, transactions };
  }

  // Atomically credit a wallet (use prisma.$transaction with interactive transactions)
  static async creditWallet(
    userId: string,
    amount: number,
    referenceType: string,
    referenceId: string | null,
    description: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Get or create wallet within transaction
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId } });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Number(balanceBefore) + amount;

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount,
          balanceBefore,
          balanceAfter,
          referenceType,
          referenceId,
          description,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  // Atomically debit a wallet (throws if insufficient balance)
  static async debitWallet(
    userId: string,
    amount: number,
    referenceType: string,
    referenceId: string | null,
    description: string
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      const balanceBefore = wallet.balance;
      if (Number(balanceBefore) < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const balanceAfter = Number(balanceBefore) - amount;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          amount,
          balanceBefore,
          balanceAfter,
          referenceType,
          referenceId,
          description,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  // Get paginated transactions with optional filters
  static async getTransactions(
    walletId: string,
    options: { page?: number; limit?: number; type?: string; referenceType?: string }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const where: any = { walletId };
    if (options.type) where.type = options.type;
    if (options.referenceType) where.referenceType = options.referenceType;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    // Attach full order metrics for settlement visibility
    const orderIds = transactions
      .filter((t) => ['order_payout', 'order_payment', 'refund_debit', 'refund'].includes(t.referenceType) && t.referenceId)
      .map((t) => t.referenceId as string);

    let ordersById = new Map<string, any>();
    if (orderIds.length > 0) {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          settlementAmount: true,
          refundAmount: true,
          customer: { select: { name: true, email: true } },
          seller: { select: { shopName: true } }
        }
      });
      orders.forEach((o) => ordersById.set(o.id, o));
    }

    const enhancedTransactions = transactions.map((t) => {
      let orderDetails = null;
      if (t.referenceId && ordersById.has(t.referenceId)) {
        const o = ordersById.get(t.referenceId);
        const orderTotal = o.total ? Number(o.total) : 0;
        // Re-derive commission amount to ensure accuracy and transparency
        const commissionDeducted = Math.round(orderTotal * PLATFORM_COMMISSION_RATE * 100) / 100;
        
        orderDetails = {
          orderNumber: o.orderNumber,
          orderTotal,
          commissionDeducted,
          settlementAmount: o.settlementAmount ? Number(o.settlementAmount) : 0,
          refundAmount: o.refundAmount ? Number(o.refundAmount) : 0,
          customerName: o.customer?.name || o.customer?.email,
          shopName: o.seller?.shopName,
        };
      }
      return { ...t, orderDetails };
    });

    return { transactions: enhancedTransactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Admin: get all wallets with user info (paginated, searchable)
  static async getAllWallets(options: { page?: number; limit?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const where: any = {};
    if (options.search) {
      where.user = {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { email: { contains: options.search, mode: 'insensitive' } },
        ],
      };
    }

    const [wallets, total] = await Promise.all([
      prisma.wallet.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, seller: { select: { shopName: true, shopSlug: true } } },
          },
        },
        orderBy: { balance: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wallet.count({ where }),
    ]);

    return { wallets, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
