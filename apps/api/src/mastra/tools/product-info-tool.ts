import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import prisma from '../../db/client.js';

export const productInfoTool = createTool({
  id: 'get-product-info',
  description:
    'Get product details including pricing, description, seller info, policies, and ratings. Lookup by slug or product ID.',
  inputSchema: z.object({
    productSlug: z.string().optional().describe('The unique product slug'),
    productId: z.string().optional().describe('The UUID of the product'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    message: z.string().optional(),
    product: z
      .object({
        title: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
        brand: z.string().nullable(),
        price: z.number(),
        comparePrice: z.number().nullable(),
        inStock: z.boolean(),
        categoryName: z.string().nullable(),
        sellerShopName: z.string().nullable(),
        avgRating: z.number().nullable(),
        reviewCount: z.number(),
        images: z.array(z.string()),
        policies: z.array(
          z.object({
            type: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            durationDays: z.number(),
          }),
        ),
      })
      .optional(),
  }),
  execute: async (inputData) => {
    try {
      const { productSlug, productId } = inputData;

      if (!productSlug && !productId) {
        return { found: false, message: 'Please provide either a product slug or product ID.' };
      }

      const whereClause: Record<string, unknown> = { status: 'published' };
      if (productId) whereClause.id = productId;
      if (productSlug) whereClause.slug = productSlug;

      const product = await prisma.product.findFirst({
        where: whereClause,
        include: {
          seller: { select: { shopName: true } },
          category: { select: { name: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 3 },
          policies: {
            include: {
              policy: true,
            },
          },
        },
      });

      if (!product) {
        return { found: false, message: 'Product not found or is no longer available.' };
      }

      const activePolicies = product.policies
        .filter((pp) => pp.policy.isActive)
        .map((pp) => ({
          type: pp.policy.type,
          title: pp.policy.title,
          description: pp.policy.description,
          durationDays: pp.policy.durationDays,
        }));

      return {
        found: true,
        product: {
          title: product.title,
          slug: product.slug,
          description: product.description,
          brand: product.brand,
          price: Number(product.basePrice),
          comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
          inStock: product.totalStock > 0,
          categoryName: product.category?.name ?? null,
          sellerShopName: product.seller?.shopName ?? null,
          avgRating: product.avgRating ? Number(product.avgRating) : null,
          reviewCount: product.reviewCount,
          images: product.images.map((img) => img.url),
          policies: activePolicies,
        },
      };
    } catch (error) {
      return {
        found: false,
        message: `Failed to fetch product info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
