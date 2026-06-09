import prisma from '../db/client.js';
import { Prisma, UserRole } from '@prisma/client';

export class UserService {
  /**
   * Get all users for admin dashboard, including their recommendation profile based on activities
   */
  static async getAdminUsersList(role?: string) {
    const whereClause: Prisma.UserWhereInput = role ? { role: role as UserRole } : {};
    
    // Fetch users with their 20 most recent activities
    const [users, roleCountsRaw] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            activityType: true,
            searchQuery: true,
            product: {
              select: {
                category: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
    ]);

    const roleCounts = {
      customers: roleCountsRaw.find(r => r.role === 'customer')?._count || 0,
      sellers: roleCountsRaw.find(r => r.role === 'seller')?._count || 0,
      delivery: roleCountsRaw.find(r => r.role === 'delivery')?._count || 0,
      admins: roleCountsRaw.find(r => r.role === 'admin')?._count || 0,
      total: roleCountsRaw.reduce((acc, curr) => acc + curr._count, 0)
    };

    // Map through users to build their recommendation profile
    const enrichedUsers = users.map(user => {
      const categoryCounts: Record<string, number> = {};
      const searchCounts: Record<string, number> = {};

      const activities = (user as any).activities || [];
      for (const act of activities) {
        if (act.product?.category?.name) {
          categoryCounts[act.product.category.name] = (categoryCounts[act.product.category.name] || 0) + 1;
        }
        if (act.searchQuery) {
          const q = act.searchQuery.toLowerCase().trim();
          searchCounts[q] = (searchCounts[q] || 0) + 1;
        }
      }

      // Get top 3 categories
      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      // Get top 3 search queries
      const topSearches = Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        recommendationProfile: {
          categories: topCategories,
          searches: topSearches,
        }
      };
    });

    return { users: enrichedUsers, roleCounts };
  }
}
