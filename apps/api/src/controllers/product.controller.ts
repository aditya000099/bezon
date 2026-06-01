import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';

/**
 * Get all published products with search and filtering
 */
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, sort, page, limit } = req.query;

    const result = await ProductService.getProducts({
      search: search?.toString(),
      category: category?.toString(),
      sort: sort?.toString(),
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single product by slug (with variants, category, seller)
 */
export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const product = await ProductService.getProductBySlug(slug);

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new product and nested default variant (Sellers only)
 */
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, brand, description, basePrice, comparePrice, totalStock, categoryId, variants } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const newProduct = await ProductService.createProduct(req.user.id, {
      title,
      brand,
      description,
      basePrice,
      comparePrice,
      totalStock,
      categoryId,
      variants,
    });

    res.status(201).json({
      success: true,
      message: 'Product registered successfully.',
      data: newProduct,
    });
  } catch (err: any) {
    // If it's a validation error or database rule error, return 400
    res.status(err.status || 400).json({
      success: false,
      message: err.message || 'Failed to register product.',
    });
  }
};

/**
 * Update product (Seller owner only)
 */
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { title, brand, description, basePrice, comparePrice, totalStock, categoryId, status, variants } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const updated = await ProductService.updateProduct(req.user.id, id, {
      title,
      brand,
      description,
      basePrice,
      comparePrice,
      totalStock,
      categoryId,
      status,
      variants,
    });

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Archive / delete product (Seller owner or Admin only)
 */
export const archiveProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const archived = await ProductService.archiveProduct(id, {
      id: req.user.id,
      role: req.user.role,
    });

    res.json({
      success: true,
      message: 'Product successfully archived.',
      data: archived,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get products belonging to the authenticated seller
 */
export const getSellerProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const products = await ProductService.getSellerProducts(req.user.id);

    res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const product = await ProductService.getProductBySlug(slug);
    const { CouponService } = await import('../services/coupon.service.js');
    const coupons = await CouponService.getProductCoupons(product.id, product.sellerId, product.categoryId, req.user?.id);
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};
