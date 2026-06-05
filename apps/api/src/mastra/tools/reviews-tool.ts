import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import prisma from '../../db/client.js';

export const productReviewsTool = createTool({
  id: 'get-product-reviews',
  description:
    'Get reviews and rating summary for a product. Returns rating breakdown and paginated reviews.',
  inputSchema: z.object({
    productId: z.string().describe('The UUID of the product'),
    page: z.number().optional().default(1).describe('Page number for pagination (default: 1)'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    message: z.string().optional(),
    data: z
      .object({
        averageRating: z.number().nullable(),
        totalReviews: z.number(),
        breakdown: z.record(z.string(), z.number()),
        currentPage: z.number(),
        totalPages: z.number(),
        reviews: z.array(
          z.object({
            userName: z.string(),
            rating: z.number(),
            text: z.string().nullable(),
            date: z.string(),
            images: z.array(z.string()),
          }),
        ),
      })
      .optional(),
  }),
  execute: async (inputData) => {
    try {
      const { productId, page = 1 } = inputData;
      const pageSize = 10;
      const skip = (page - 1) * pageSize;

      // Get rating breakdown
      const ratingGroups = await prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true },
        where: { productId },
      });

      let totalReviews = 0;
      let weightedSum = 0;
      const breakdown: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

      for (const group of ratingGroups) {
        const count = group._count.rating;
        breakdown[String(group.rating)] = count;
        totalReviews += count;
        weightedSum += group.rating * count;
      }

      const averageRating = totalReviews > 0 ? Math.round((weightedSum / totalReviews) * 10) / 10 : null;
      const totalPages = Math.max(1, Math.ceil(totalReviews / pageSize));

      // Get paginated reviews
      const reviews = await prisma.review.findMany({
        where: { productId },
        include: {
          user: { select: { name: true } },
          images: { select: { url: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      });

      return {
        found: true,
        data: {
          averageRating,
          totalReviews,
          breakdown,
          currentPage: page,
          totalPages,
          reviews: reviews.map((review) => ({
            userName: review.user.name,
            rating: review.rating,
            text: review.reviewText,
            date: review.createdAt.toISOString(),
            images: review.images.map((img) => img.url),
          })),
        },
      };
    } catch (error) {
      return {
        found: false,
        message: `Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
