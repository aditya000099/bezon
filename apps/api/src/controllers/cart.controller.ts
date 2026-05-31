import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service.js';

/**
 * Get the active customer's cart
 */
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const cart = await CartService.getOrCreateCart(req.user.id);

    res.json({
      success: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Add an item to the shopping cart
 */
export const addCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId, qty = 1, priceSnapshot } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!productId || !variantId || !priceSnapshot) {
      return res.status(400).json({ success: false, message: 'Product ID, Variant ID, and Price Snapshot are required.' });
    }

    const newItem = await CartService.addCartItem(req.user.id, {
      productId,
      variantId,
      qty,
      priceSnapshot,
    });

    res.status(201).json({
      success: true,
      message: 'Item added to shopping cart.',
      data: newItem,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Modify cart item quantity
 */
export const updateCartItemQty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { qty } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (qty === undefined || Number(qty) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive quantity is required.' });
    }

    const updated = await CartService.updateCartItemQty(req.user.id, id, qty);

    res.json({
      success: true,
      message: 'Cart quantity updated.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove an item from the cart
 */
export const removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    await CartService.removeCartItem(req.user.id, id);

    res.json({
      success: true,
      message: 'Item removed from shopping cart.',
    });
  } catch (err) {
    next(err);
  }
};
