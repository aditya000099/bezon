import prisma from '../db/client.js';

export class WishlistService {
  /**
   * Fetch user's wishlist items
   */
  static async getUserWishlist(userId: string) {
    return await prisma.wishlist.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
            category: true,
          },
        },
      },
    });
  }

  /**
   * Toggle a product in user's wishlist
   */
  static async toggleWishlistItem(userId: string, productId: string) {
    // 1. Verify if product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productExists || productExists.status === 'archived') {
      const err = new Error('Product not found or unavailable.');
      (err as any).status = 404;
      throw err;
    }

    // 2. Check if already wishlisted
    const existing = await prisma.wishlist.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existing) {
      // Remove it
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return { added: false };
    } else {
      // Add it
      await prisma.wishlist.create({
        data: {
          userId,
          productId,
        },
      });
      return { added: true };
    }
  }
}
