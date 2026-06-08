import prisma from '../db/client.js';
import { WalletService } from './wallet.service.js';

export class AdsService {
  // Create a new ad campaign (seller must own the product, product must be published)
  static async createCampaign(
    sellerId: string,
    data: {
      productId: string;
      title: string;
      dailyBudget: number;
      totalBudget: number;
      costPerClick: number;
      startDate?: string;
      endDate?: string;
      tags?: string[];
    },
  ) {
    // Validate product ownership
    const product = await prisma.product.findFirst({
      where: { id: data.productId, sellerId, status: 'published' },
    });
    if (!product) throw new Error('Product not found or not published.');

    // Validate minimum CPC
    if (data.costPerClick < 1) throw new Error('Minimum cost per click is ₹1.');
    if (data.dailyBudget < data.costPerClick)
      throw new Error('Daily budget must be at least equal to CPC.');
    if (data.totalBudget < data.dailyBudget)
      throw new Error('Total budget must be at least equal to daily budget.');

    // Check seller has a wallet (auto-create if not)
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: { userId: true },
    });
    if (!seller) throw new Error('Seller not found.');
    await WalletService.getOrCreateWallet(seller.userId);

    const campaign = await prisma.adCampaign.create({
      data: {
        sellerId,
        productId: data.productId,
        title: data.title,
        dailyBudget: data.dailyBudget,
        totalBudget: data.totalBudget,
        costPerClick: data.costPerClick,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        tags: data.tags || [],
      },
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    return campaign;
  }

  // Update campaign (pause, resume, edit budgets)
  static async updateCampaign(
    sellerId: string,
    campaignId: string,
    updates: any,
  ) {
    const campaign = await prisma.adCampaign.findFirst({
      where: { id: campaignId, sellerId },
    });
    if (!campaign) throw new Error('Campaign not found.');

    const allowedFields: any = {};
    if (updates.status !== undefined) allowedFields.status = updates.status;
    if (updates.dailyBudget !== undefined)
      allowedFields.dailyBudget = updates.dailyBudget;
    if (updates.totalBudget !== undefined)
      allowedFields.totalBudget = updates.totalBudget;
    if (updates.costPerClick !== undefined)
      allowedFields.costPerClick = updates.costPerClick;
    if (updates.title !== undefined) allowedFields.title = updates.title;
    if (updates.endDate !== undefined)
      allowedFields.endDate = updates.endDate
        ? new Date(updates.endDate)
        : null;
    if (updates.tags !== undefined) allowedFields.tags = updates.tags;

    return prisma.adCampaign.update({
      where: { id: campaignId },
      data: allowedFields,
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
  }

  // Delete campaign (only if not active)
  static async deleteCampaign(sellerId: string, campaignId: string) {
    const campaign = await prisma.adCampaign.findFirst({
      where: { id: campaignId, sellerId },
    });
    if (!campaign) throw new Error('Campaign not found.');
    if (campaign.status === 'active')
      throw new Error('Cannot delete an active campaign. Pause it first.');

    await prisma.adEvent.deleteMany({ where: { campaignId } });
    await prisma.adCampaign.delete({ where: { id: campaignId } });
    return { deleted: true };
  }

  // Get sponsored products for shop page (returns products with campaign info)
  static async getSponsoredProducts(options: {
    categoryId?: string;
    limit?: number;
    excludeProductIds?: string[];
    searchQuery?: string;
  }) {
    const limit = options.limit || 3;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const where: any = {
      status: 'active',
      startDate: { lte: now },
      product: { status: 'published', totalStock: { gt: 0 } },
    };
    // Filter by category if provided (could be UUID or slug)
    if (options.categoryId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.categoryId);
      if (isUUID) {
        where.product.categoryId = options.categoryId;
      } else {
        where.product.category = { slug: options.categoryId };
      }
    }
    // Filter by search tags or product details if provided
    if (options.searchQuery) {
      const words = options.searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        where.AND = [
          {
            OR: [
              { tags: { hasSome: words } },
              { product: { title: { contains: options.searchQuery, mode: 'insensitive' } } },
              { product: { brand: { contains: options.searchQuery, mode: 'insensitive' } } }
            ]
          }
        ];
      }
    }
    // Exclude already-shown product IDs
    if (options.excludeProductIds && options.excludeProductIds.length > 0) {
      where.productId = { notIn: options.excludeProductIds };
    }
    // Only campaigns that haven't expired
    where.OR = [{ endDate: null }, { endDate: { gte: now } }];

    // Fetch active campaigns, prioritize by higher CPC bid
    let campaigns = await prisma.adCampaign.findMany({
      where,
      orderBy: { costPerClick: 'desc' },
      take: limit * 2, // fetch extra to filter budget-exceeded ones
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: true,
            basePrice: true,
            comparePrice: true,
            totalStock: true,
            avgRating: true,
            reviewCount: true,
            soldCount: true,
            categoryId: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, altText: true },
            },
            seller: { select: { shopName: true, shopSlug: true } },
          },
        },
      },
    });

    // Reset todaySpent if date has changed, and filter out budget-exceeded
    const validCampaigns = [];
    for (const c of campaigns) {
      const campaignTodayStr = new Date(c.todayDate)
        .toISOString()
        .split('T')[0];
      if (campaignTodayStr !== todayStr) {
        // Reset daily counter
        await prisma.adCampaign.update({
          where: { id: c.id },
          data: { todaySpent: 0, todayDate: new Date(todayStr) },
        });
        c.todaySpent = 0 as any;
      }
      // Check daily and total budget
      if (Number(c.todaySpent) >= Number(c.dailyBudget)) continue;
      if (Number(c.totalSpent) >= Number(c.totalBudget)) {
        await prisma.adCampaign.update({
          where: { id: c.id },
          data: { status: 'exhausted' },
        });
        continue;
      }
      validCampaigns.push(c);
      if (validCampaigns.length >= limit) break;
    }

    // Record impressions (fire and forget)
    for (const c of validCampaigns) {
      prisma.adCampaign
        .update({
          where: { id: c.id },
          data: { totalImpressions: { increment: 1 } },
        })
        .catch(() => {});
      prisma.adEvent
        .create({ data: { campaignId: c.id, eventType: 'impression' } })
        .catch(() => {});
    }

    return validCampaigns.map((c) => ({
      ...c.product,
      isSponsored: true,
      campaignId: c.id,
    }));
  }

  // Record a click — debit wallet, increment counters
  static async recordClick(campaignId: string, userId?: string) {
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
      include: { seller: { select: { userId: true } } },
    });
    if (!campaign || campaign.status !== 'active') return { recorded: false };

    const cpc = Number(campaign.costPerClick);

    try {
      // Debit seller wallet
      await WalletService.debitWallet(
        campaign.seller.userId,
        cpc,
        'ad_spend',
        campaignId,
        `Ad click on "${campaign.title}" (CPC: ₹${cpc})`,
      );
    } catch (err: any) {
      // Insufficient balance — auto-pause campaign
      if (err.message === 'Insufficient wallet balance') {
        await prisma.adCampaign.update({
          where: { id: campaignId },
          data: { status: 'exhausted' },
        });
        return { recorded: false, reason: 'insufficient_balance' };
      }
      throw err;
    }

    // Update campaign counters
    const todayStr = new Date().toISOString().split('T')[0];
    const campaignTodayStr = new Date(campaign.todayDate)
      .toISOString()
      .split('T')[0];

    await prisma.adCampaign.update({
      where: { id: campaignId },
      data: {
        totalClicks: { increment: 1 },
        totalSpent: { increment: cpc },
        todaySpent: campaignTodayStr === todayStr ? { increment: cpc } : cpc,
        todayDate:
          campaignTodayStr !== todayStr ? new Date(todayStr) : undefined,
      },
    });

    // Create ad event
    await prisma.adEvent.create({
      data: {
        campaignId,
        eventType: 'click',
        userId: userId || null,
        cost: cpc,
      },
    });

    // Check if budgets are now exceeded
    const updatedCampaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });
    if (updatedCampaign) {
      if (
        Number(updatedCampaign.totalSpent) >=
        Number(updatedCampaign.totalBudget)
      ) {
        await prisma.adCampaign.update({
          where: { id: campaignId },
          data: { status: 'exhausted' },
        });
      }
    }

    return { recorded: true };
  }

  // Get seller's own campaigns
  static async getSellerCampaigns(sellerId: string) {
    return prisma.adCampaign.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
  }

  // Get campaign stats
  static async getCampaignStats(sellerId: string, campaignId: string) {
    const campaign = await prisma.adCampaign.findFirst({
      where: { id: campaignId, sellerId },
      include: {
        product: { select: { title: true, slug: true } },
      },
    });
    if (!campaign) throw new Error('Campaign not found.');

    const ctr =
      campaign.totalImpressions > 0
        ? ((campaign.totalClicks / campaign.totalImpressions) * 100).toFixed(2)
        : '0.00';

    return {
      ...campaign,
      ctr: `${ctr}%`,
      avgCostPerClick:
        campaign.totalClicks > 0
          ? (Number(campaign.totalSpent) / campaign.totalClicks).toFixed(2)
          : '0.00',
    };
  }

  // Admin: all campaigns
  static async getAllCampaigns(options: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const where: any = {};
    if (options.status) where.status = options.status;

    const [campaigns, total] = await Promise.all([
      prisma.adCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { shopName: true } },
          product: {
            select: {
              title: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      }),
      prisma.adCampaign.count({ where }),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
