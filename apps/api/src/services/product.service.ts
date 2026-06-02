import prisma from '../db/client.js';
import { createProductSchema, productSchema } from '@bezon/validation';
import type { ProductStatus } from '@bezon/types';

export class ProductService {
  // Fetch published products with search, filters, and pagination
  static async getProducts(query: {
    search?: string;
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, category, sort, page = 1, limit = 20 } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'published' };

    if (search) {
      where.OR = [
        { title: { contains: search.toString(), mode: 'insensitive' } },
        { brand: { contains: search.toString(), mode: 'insensitive' } },
        { description: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category.toString() };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { basePrice: 'asc' };
    else if (sort === 'price-desc') orderBy = { basePrice: 'desc' };
    else if (sort === 'popular') orderBy = { viewCount: 'desc' };

    const [products, totalCount] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

  // Get full product details by slug, including other variants in the same family
  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        seller: {
          select: { id: true, shopName: true, shopSlug: true },
        },
        policies: {
          include: { policy: true },
        },
      },
    });

    if (!product || product.status !== 'published') {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    // Fetch sibling variants if this product belongs to a group
    let siblings: any[] = [];
    if (product.variantGroupId) {
      siblings = await prisma.product.findMany({
        where: {
          variantGroupId: product.variantGroupId,
          status: 'published',
          id: { not: product.id }, // Optional: exclude self, or include self and map
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          policies: {
            include: { policy: true },
          },
        },
      });
    }

    // Bump view count in the background
    prisma.product
      .update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment viewCount', err));

    return {
      ...product,
      familyMembers: siblings,
    };
  }

  // Create a new product and optionally link it
  static async createProduct(userId: string, data: any) {
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
    } = data;

    // Make sure this user is an approved seller
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller || seller.status !== 'approved') {
      const err = new Error('Only approved merchants can register products.');
      (err as any).status = 403;
      throw err;
    }

    // Validate the payload
    const validationResult = createProductSchema.safeParse(data);
    if (!validationResult.success) {
      const err = new Error(validationResult.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }

    const createdProduct = await prisma.$transaction(async (tx) => {
      let variantGroupId = null;

      if (linkedProductIds && linkedProductIds.length > 0) {
        const existingProducts = await tx.product.findMany({
          where: { id: { in: linkedProductIds }, sellerId: seller.id },
        });

        if (existingProducts.length > 0) {
          const existingGroup = existingProducts.find(
            (p) => p.variantGroupId,
          )?.variantGroupId;

          if (existingGroup) {
            variantGroupId = existingGroup;
          } else {
            const group = await tx.variantGroup.create({
              data: { name: title },
            });
            variantGroupId = group.id;
          }

          await tx.product.updateMany({
            where: { id: { in: existingProducts.map((p) => p.id) } },
            data: { variantGroupId, categoryId },
          });
        }
      }

      // Build a URL-friendly slug from title + sku
      const slug =
        (title + '-' + sku).toLowerCase().replace(/[^a-z0-9]+/g, '-') +
        '-' +
        Math.random().toString(36).substring(2, 6);

      const productObj = await tx.product.create({
        data: {
          sellerId: seller.id,
          categoryId,
          variantGroupId,
          title,
          slug,
          brand: brand || null,
          description: description || null,
          status: status || 'draft',
          sku,
          attributes: attributes || {},
          basePrice,
          comparePrice: comparePrice || null,
          totalStock: totalStock || 0,
          lowStockAlert: lowStockAlert || 5,
          weightGrams: weightGrams || null,
        },
      });

      // Create images for this product
      if (Array.isArray(images) && images.length > 0) {
        for (const img of images) {
          await tx.productImage.create({
            data: {
              productId: productObj.id,
              url: img.url,
              s3Key: img.s3Key || null,
              altText: img.altText || null,
              sortOrder: img.sortOrder || 0,
              isPrimary: img.isPrimary || false,
            },
          });
        }
      }

      // Attach policies if provided
      if (Array.isArray(policyIds) && policyIds.length > 0) {
        for (const policyId of policyIds) {
          await tx.productPolicy.create({
            data: { productId: productObj.id, policyId },
          });
        }
      }

      return productObj;
    });

    return createdProduct;
  }

  // Update a specific product
  static async updateProduct(userId: string, productId: string, data: any) {
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
    } = data;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    if (product.sellerId !== seller.id) {
      const err = new Error('Not authorized to update this product.');
      (err as any).status = 403;
      throw err;
    }

    const updated = await prisma.$transaction(async (tx) => {
      let currentVariantGroupId = product.variantGroupId;

      if (linkedProductIds !== undefined) {
        if (linkedProductIds.length > 0) {
          const existingProducts = await tx.product.findMany({
            where: { id: { in: linkedProductIds }, sellerId: seller.id },
          });

          if (existingProducts.length > 0) {
            const existingGroup =
              currentVariantGroupId ||
              existingProducts.find((p) => p.variantGroupId)?.variantGroupId;

            if (existingGroup) {
              currentVariantGroupId = existingGroup;
            } else {
              const group = await tx.variantGroup.create({
                data: { name: title },
              });
              currentVariantGroupId = group.id;
            }

            await tx.product.updateMany({
              where: { id: { in: existingProducts.map((p) => p.id) } },
              data: { variantGroupId: currentVariantGroupId, categoryId },
            });
          }
        } else {
          // Empty array means unlink this specific product
          currentVariantGroupId = null;
        }
      }

      // Handle image updates (delete existing and insert new ones)
      if (images !== undefined && Array.isArray(images)) {
        await tx.productImage.deleteMany({
          where: { productId },
        });

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          await tx.productImage.create({
            data: {
              productId,
              url: img.url,
              s3Key: img.s3Key || null,
              altText: img.altText || null,
              sortOrder: img.sortOrder !== undefined ? img.sortOrder : i,
              isPrimary: img.isPrimary || false,
            },
          });
        }
      }

      const p = await tx.product.update({
        where: { id: productId },
        data: {
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
          variantGroupId: currentVariantGroupId,
        },
      });

      // Update policies if provided
      if (Array.isArray(policyIds)) {
        await tx.productPolicy.deleteMany({ where: { productId } });
        for (const policyId of policyIds) {
          await tx.productPolicy.create({
            data: { productId, policyId },
          });
        }
      }

      return p;
    });

    return updated;
  }

  // Archive product (and its siblings in same group if requested, but let's just do single product)
  static async archiveProduct(
    productId: string,
    user?: { id: string; role: string },
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    if (user && user.role !== 'admin' && product.sellerId !== user.id) {
      // Need to find seller profile if user ID is provided (seller profile ID != user ID)
      const seller = await prisma.seller.findUnique({
        where: { userId: user.id },
      });
      if (!seller || seller.id !== product.sellerId) {
        const err = new Error('Not authorized to archive this product.');
        (err as any).status = 403;
        throw err;
      }
    }

    return await prisma.product.update({
      where: { id: productId },
      data: { status: 'archived' },
    });
  }

  // Get products for a specific seller
  static async getSellerProducts(userId: string) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      const err = new Error('Seller profile not found.');
      (err as any).status = 404;
      throw err;
    }

    return await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        variantGroup: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        policies: {
          include: { policy: true },
        },
      },
    });
  }

  // Get a single product details by ID (merchant dashboard context)
  static async getProductById(userId: string, productId: string) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    if (product.sellerId !== seller.id) {
      const err = new Error('Not authorized to view this product.');
      (err as any).status = 403;
      throw err;
    }

    return product;
  }

  // Calculate detailed performance and revenue metrics for a product
  static async getProductStats(userId: string, productId: string) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    if (product.sellerId !== seller.id) {
      const err = new Error('Not authorized to view this product stats.');
      (err as any).status = 403;
      throw err;
    }

    // 1. Wishlist Saves count
    const wishlistSaves = await prisma.wishlist.count({
      where: { productId },
    });

    // 2. Revenue & Units Sold from delivered orders
    const deliveredItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          status: 'delivered',
        },
      },
      select: {
        unitPrice: true,
        qty: true,
      },
    });

    const calculatedRevenue = deliveredItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.qty,
      0,
    );

    const calculatedUnitsSold = deliveredItems.reduce(
      (sum, item) => sum + item.qty,
      0,
    );

    return {
      title: product.title,
      sku: product.sku,
      brand: product.brand,
      basePrice: Number(product.basePrice),
      // Performance
      viewCount: product.viewCount,
      soldCount: product.soldCount || calculatedUnitsSold,
      // Customer Feedback
      avgRating: product.avgRating ? Number(product.avgRating) : 0,
      reviewCount: product.reviewCount,
      // Wishlist
      wishlistSaves,
      // Inventory
      totalStock: product.totalStock,
      lowStockAlert: product.lowStockAlert,
      // Revenue
      revenue: calculatedRevenue,
    };
  }
}
