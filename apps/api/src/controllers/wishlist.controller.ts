import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlist.service.js';

/**
 * Get authenticated user's wishlist
 */
export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const items = await WishlistService.getUserWishlist(req.user.id);

    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle a product's wishlist status
 */
export const toggleWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const result = await WishlistService.toggleWishlistItem(req.user.id, productId);

    res.json({
      success: true,
      message: result.added ? 'Product added to wishlist.' : 'Product removed from wishlist.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
