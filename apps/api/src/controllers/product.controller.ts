import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { RecommendationService } from '../services/recommendation.service.js';
import prisma from '../db/client.js';
import { GeoService } from '../services/geo.service.js';

import { AdsService } from '../services/ads.service.js';

/**
 * Get all published products with search and filtering
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { search, category, sort, page, limit } = req.query;

    const result = await ProductService.getProducts({
      search: search?.toString(),
      category: category?.toString(),
      sort: sort?.toString(),
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    if (search && req.user?.id) {
      RecommendationService.recordActivity(req.user.id, 'search', {
        searchQuery: search.toString(),
      });
    }

    // Inject Sponsored Products
    // Only inject if there's no specific search/sort, or if we want them everywhere. Let's show them everywhere.
    const organicProducts = result.products;
    const organicProductIds = organicProducts.map((p: any) => p.id);
    
    // Fetch 1 sponsored product for every 4 organic products
    const numAds = Math.max(1, Math.floor(organicProducts.length / 4));
    const sponsored = await AdsService.getSponsoredProducts({
      categoryId: category?.toString(),
      excludeProductIds: organicProductIds,
      limit: numAds
    });

    // Mix them in (every 5th slot)
    const mixedProducts = [];
    let organicIdx = 0;
    let sponsoredIdx = 0;

    for (let i = 0; i < organicProducts.length + sponsored.length; i++) {
      if (i % 5 === 0 && sponsoredIdx < sponsored.length) {
        mixedProducts.push(sponsored[sponsoredIdx++]);
      } else if (organicIdx < organicProducts.length) {
        mixedProducts.push(organicProducts[organicIdx++]);
      }
    }

    res.json({
      success: true,
      data: {
        ...result,
        products: mixedProducts
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single product by slug (with variants, category, seller)
 */
export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const slug = req.params.slug as string;
    const product = await ProductService.getProductBySlug(slug);

    if (req.user?.id) {
      RecommendationService.recordActivity(req.user.id, 'view', {
        productId: product.id,
      });
    }

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
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      title,
      brand,
      description,
      categoryId,
      status,
      basePrice,
      comparePrice,
      totalStock,
      lowStockAlert,
      weightGrams,
      sku,
      attributes,
      images,
      linkedProductIds,
      policyIds,
    } = req.body;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized session.' });
    }

    const newProduct = await ProductService.createProduct(req.user.id, {
      title,
      brand,
      description,
      categoryId,
      status,
      basePrice,
      comparePrice,
      totalStock,
      lowStockAlert,
      weightGrams,
      sku,
      attributes,
      images,
      linkedProductIds,
      policyIds,
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
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = req.params.id as string;
    const {
      title,
      brand,
      description,
      basePrice,
      comparePrice,
      totalStock,
      categoryId,
      status,
      attributes,
      lowStockAlert,
      weightGrams,
      sku,
      linkedProductIds,
      images,
      policyIds,
    } = req.body;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized session.' });
    }

    const updatedProduct = await ProductService.updateProduct(
      req.user.id,
      productId,
      {
        title,
        brand,
        description,
        basePrice,
        comparePrice,
        totalStock,
        categoryId,
        status,
        attributes,
        lowStockAlert,
        weightGrams,
        sku,
        linkedProductIds,
        images,
        policyIds,
      },
    );

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Archive / delete product (Seller owner or Admin only)
 */
export const archiveProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized session.' });
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
export const getSellerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized session.' });
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

export const getProductCoupons = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const slug = req.params.slug as string;
    const product = await ProductService.getProductBySlug(slug);
    const { CouponService } = await import('../services/coupon.service.js');
    const coupons = await CouponService.getProductCoupons(
      product.id,
      product.sellerId,
      product.categoryId,
      product.variantGroupId,
      req.user?.id,
    );
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};

export const getRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 8;
    const recommendations = await RecommendationService.getRecommendations(
      req.user?.id,
      limit,
    );
    res.json({ success: true, data: recommendations });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch a single product by ID (merchant editing context)
 */
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = req.params.id as string;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized session.' });
    }

    const product = await ProductService.getProductById(req.user.id, productId);

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch detailed performance and revenue metrics for a product
 */
export const getProductStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = req.params.id as string;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized session.' });
    }

    const stats = await ProductService.getProductStats(req.user.id, productId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Calculate estimated delivery distance and days for a product and destination
 */
export const getDeliveryEstimate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productId = req.params.id as string;
    const { addressId, pincode } = req.query;

    if (!addressId && !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Address ID or Pincode is required.',
      });
    }

    // Fetch product and its seller
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const seller = product.seller;
    if (!seller) {
      return res.status(400).json({
        success: false,
        message: 'Seller information missing for this product.',
      });
    }

    // Determine seller coordinates
    let sellerLat = seller.lat ? Number(seller.lat) : null;
    let sellerLng = seller.lng ? Number(seller.lng) : null;
    const sellerPincode = seller.pincode || '560001';

    if (sellerLat === null || sellerLng === null) {
      const coords = GeoService.getCoordinatesFromPincode(sellerPincode);
      sellerLat = coords.lat;
      sellerLng = coords.lng;
    }

    // Determine destination coordinates
    let destLat: number | null = null;
    let destLng: number | null = null;
    let destinationPincode = '';

    if (addressId) {
      const address = await prisma.address.findUnique({
        where: { id: addressId as string },
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found.',
        });
      }

      // Verify ownership if logged in
      if (req.user && address.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this address.',
        });
      }

      destLat = address.lat ? Number(address.lat) : null;
      destLng = address.lng ? Number(address.lng) : null;
      destinationPincode = address.pincode;

      if (destLat === null || destLng === null) {
        const coords = GeoService.getCoordinatesFromPincode(destinationPincode);
        destLat = coords.lat;
        destLng = coords.lng;
      }
    } else if (pincode) {
      destinationPincode = pincode as string;
      const coords = GeoService.getCoordinatesFromPincode(destinationPincode);
      destLat = coords.lat;
      destLng = coords.lng;
    }

    if (destLat === null || destLng === null) {
      return res.status(400).json({
        success: false,
        message: 'Failed to resolve destination coordinates.',
      });
    }

    // Calculate distance and delivery days
    const distanceKm = GeoService.calculateHaversineDistance(
      sellerLat,
      sellerLng,
      destLat,
      destLng,
    );
    const deliveryDays = GeoService.calculateDeliveryDays(distanceKm);

    res.json({
      success: true,
      data: {
        distanceKm,
        deliveryDays,
        sellerPincode,
        destinationPincode,
      },
    });
  } catch (err) {
    next(err);
  }
};

