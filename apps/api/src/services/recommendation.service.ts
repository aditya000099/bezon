import prisma from '../db/client.js';

export class RecommendationService {
  /**
   * Record a user activity
   */
  static async recordActivity(
    userId: string | undefined,
    activityType: 'view' | 'search' | 'add_to_cart' | 'wishlist' | 'checkout',
    params: {
      productId?: string;
      searchQuery?: string;
      metadata?: any;
    }
  ) {
    if (!userId) return; // We only track logged-in users for now as we don't have a stable sessionId for guests

    try {
      await prisma.userActivity.create({
        data: {
          userId,
          activityType,
          productId: params.productId,
          searchQuery: params.searchQuery,
          metadata: params.metadata || {},
        },
      });
    } catch (err) {
      console.error('Failed to record user activity:', err);
    }
  }

  /**
   * Get product recommendations based on user history
   */
  static async getRecommendations(userId: string | undefined, limit: number = 8) {
    let recommendedProducts: any[] = [];
    const excludeProductIds = new Set<string>();

    if (userId) {
      // Fetch recent user activities to build a profile
      const recentActivities = await prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          product: {
            select: { categoryId: true, title: true }
          }
        }
      });

      if (recentActivities.length > 0) {
        const categoryIds = new Set<string>();
        const searchTerms = new Set<string>();
        const recentProductIds = new Set<string>();

        for (const act of recentActivities) {
          if (act.productId) {
            recentProductIds.add(act.productId);
            excludeProductIds.add(act.productId);
            if (act.product?.categoryId) categoryIds.add(act.product.categoryId);
          }
          if (act.searchQuery) {
            searchTerms.add(act.searchQuery.toLowerCase());
          }
        }

        // Build a query for recommendations
        const orConditions: any[] = [];
        
        if (categoryIds.size > 0) {
          orConditions.push({ categoryId: { in: Array.from(categoryIds) } });
        }
        
        if (searchTerms.size > 0) {
          for (const term of searchTerms) {
            orConditions.push({
              OR: [
                { title: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
              ]
            });
          }
        }

        if (orConditions.length > 0) {
          recommendedProducts = await prisma.product.findMany({
            where: {
              status: 'published',
              id: { notIn: Array.from(excludeProductIds) }, // Exclude items they recently interacted with
              OR: orConditions,
            },
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              category: true,
            },
            orderBy: [
              { soldCount: 'desc' },
              { viewCount: 'desc' },
            ],
            take: limit,
          });
        }
      }
    }

    // Shuffle the final list a bit to make it feel dynamic
    return recommendedProducts.sort(() => 0.5 - Math.random());
  }
}
