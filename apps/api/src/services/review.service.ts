import prisma from '../db/client.js';
import { reviewSchema } from '@bezon/validation';

export class ReviewService {
  static async createReview(userId: string, data: any) {
    const validatedData = reviewSchema.parse(data);

    // Ensure the order item exists, belongs to the user, and the order is delivered
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: validatedData.orderItemId },
      include: { order: true },
    });

    if (!orderItem) {
      const err = new Error('Order item not found');
      (err as any).status = 404;
      throw err;
    }

    if (orderItem.order.customerId !== userId) {
      const err = new Error('You do not own this order');
      (err as any).status = 403;
      throw err;
    }

    if (orderItem.order.status !== 'delivered') {
      const err = new Error('You can only review delivered products');
      (err as any).status = 400;
      throw err;
    }

    if (orderItem.productId !== validatedData.productId) {
      const err = new Error('Product mismatch');
      (err as any).status = 400;
      throw err;
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { orderItemId: validatedData.orderItemId },
    });

    if (existingReview) {
      const err = new Error('You have already reviewed this item');
      (err as any).status = 400;
      throw err;
    }

    // Create review in a transaction and update product rating
    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId,
          productId: validatedData.productId,
          orderItemId: validatedData.orderItemId,
          rating: validatedData.rating,
          reviewText: validatedData.reviewText,
          images: {
            create: validatedData.images.map((img: any) => ({
              url: img.url,
              s3Key: img.s3Key,
              sortOrder: img.sortOrder,
            })),
          },
        },
        include: {
          images: true,
        },
      });

      // Recalculate average rating
      const aggregation = await tx.review.aggregate({
        where: { productId: validatedData.productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avgRating = aggregation._avg.rating || 0;
      const reviewCount = aggregation._count.rating || 0;

      await tx.product.update({
        where: { id: validatedData.productId },
        data: {
          avgRating,
          reviewCount,
        },
      });

      // Notify the seller
      const productForNotif = await tx.product.findUnique({
        where: { id: validatedData.productId },
        include: { seller: { select: { userId: true } } },
      });

      if (productForNotif) {
        const { NotificationService } = await import('./notification.service.js');
        NotificationService.create(
          productForNotif.seller.userId,
          'new_review',
          'New Product Review',
          `Someone left a ${validatedData.rating}-star review on "${productForNotif.title}"`,
          { productSlug: productForNotif.slug, reviewId: review.id },
          `/seller/products`, // Assuming they check reviews in their products list or order queue
        ).catch((err) => console.error('Failed to create review notification:', err));
      }

      return review;
    });
  }

  static async editReview(reviewId: string, userId: string, data: any) {
    const { editReviewSchema } = await import('@bezon/validation');
    const validatedData = editReviewSchema.parse(data);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { images: true },
    });

    if (!review) {
      const err = new Error('Review not found');
      (err as any).status = 404;
      throw err;
    }

    if (review.userId !== userId) {
      const err = new Error('You do not own this review');
      (err as any).status = 403;
      throw err;
    }

    if (review.editCount > 0) {
      const err = new Error('This review has already been edited once');
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      // Delete old images
      await tx.reviewImage.deleteMany({
        where: { reviewId },
      });

      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: validatedData.rating,
          reviewText: validatedData.reviewText,
          editCount: { increment: 1 },
          images: {
            create: validatedData.images.map((img: any) => ({
              url: img.url,
              s3Key: img.s3Key,
              sortOrder: img.sortOrder,
            })),
          },
        },
        include: { images: true },
      });

      // Recalculate average rating if rating changed
      if (review.rating !== validatedData.rating) {
        const aggregation = await tx.review.aggregate({
          where: { productId: review.productId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        const avgRating = aggregation._avg.rating || 0;
        const reviewCount = aggregation._count.rating || 0;

        await tx.product.update({
          where: { id: review.productId },
          data: { avgRating, reviewCount },
        });
      }

      return updatedReview;
    });
  }

  static async getProductReviews(productId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Number(query.limit || 10));
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await prisma.$transaction([
      prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, avatarUrl: true },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  static async getProductReviewSummary(productId: string) {
    const reviews = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: {
        rating: true,
      },
    });

    const breakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let totalCount = 0;
    let sumRatings = 0;

    for (const r of reviews) {
      const count = r._count.rating;
      const rating = r.rating as 1 | 2 | 3 | 4 | 5;
      breakdown[rating] = count;
      totalCount += count;
      sumRatings += count * rating;
    }

    const avgRating = totalCount > 0 ? Number((sumRatings / totalCount).toFixed(2)) : 0;

    return {
      avgRating,
      totalCount,
      breakdown,
    };
  }
}
