import prisma from '../db/client.js';
import { productSchema, productVariantSchema } from '@bezon/validation';
import type { ProductStatus } from '@bezon/types';

export class ProductService {
  /**
   * Retrieves products with filtering, search, and pagination
   */
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

    // Build Prisma query filters
    const where: any = {
      status: 'published',
    };

    if (search) {
      where.OR = [
        { title: { contains: search.toString(), mode: 'insensitive' } },
        { brand: { contains: search.toString(), mode: 'insensitive' } },
        { description: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        slug: category.toString(),
      };
    }

    // Build sorting rules
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') {
      orderBy = { basePrice: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { basePrice: 'desc' };
    } else if (sort === 'popular') {
      orderBy = { viewCount: 'desc' };
    }

    // Query DB
    const [products, totalCount] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: true,
          variants: { where: { isActive: true } },
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

  /**
   * Retrieves detailed single product details by its slug
   */
  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: { where: { isActive: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        seller: {
          select: {
            id: true,
            shopName: true,
            shopSlug: true,
          },
        },
      },
    });

    if (!product || product.status !== 'published') {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    // Increment viewCount atomically in the background
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('Failed to increment viewCount', err));

    return product;
  }

  /**
   * Creates a product catalog listing and standard SKU variants
   */
  static async createProduct(userId: string, data: {
    title: string;
    brand?: string;
    description?: string;
    basePrice: number;
    comparePrice?: number;
    totalStock?: number;
    categoryId?: string;
    variants?: any[];
    images?: any[];
  }) {
    const { title, brand, description, basePrice, comparePrice, totalStock, categoryId, variants, images } = data;

    // Fetch user's seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller || seller.status !== 'approved') {
      const err = new Error('Only approved merchants can register products.');
      (err as any).status = 403;
      throw err;
    }

    // Validate payload schema via @bezon/validation
    const validationResult = productSchema.safeParse({ title, brand, description, basePrice, comparePrice, totalStock });
    if (!validationResult.success) {
      const err = new Error(validationResult.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    let sumStock = totalStock ? Number(totalStock) : 0;

    // Create product and nested variant inside transaction
    const newProduct = await prisma.$transaction(async (tx) => {
      const productObj = await tx.product.create({
        data: {
          sellerId: seller.id,
          categoryId: categoryId || null,
          title,
          slug,
          brand: brand || null,
          description: description || null,
          basePrice,
          comparePrice: comparePrice || null,
          totalStock: sumStock,
          status: 'published',
        },
      });

      // Provision variants if supplied, or fall back to default SKU
      if (Array.isArray(variants) && variants.length > 0) {
        sumStock = 0;
        for (const v of variants) {
          const varValid = productVariantSchema.safeParse(v);
          if (!varValid.success) {
            throw new Error(`Variant validation failed: ${varValid.error.issues[0].message}`);
          }
          await tx.productVariant.create({
            data: {
              productId: productObj.id,
              sku: v.sku,
              price: v.price,
              comparePrice: v.comparePrice || null,
              stock: v.stock,
              lowStockAlert: v.lowStockAlert || 5,
              attributes: v.attributes || {},
            },
          });
          sumStock += v.stock;
        }
        // Update product with correct stock sum
        await tx.product.update({
          where: { id: productObj.id },
          data: { totalStock: sumStock },
        });
        productObj.totalStock = sumStock;
      } else {
        // Fallback default variant
        await tx.productVariant.create({
          data: {
            productId: productObj.id,
            sku: `${seller.shopSlug.toUpperCase().substring(0, 3)}-${slug.substring(0, 5).toUpperCase()}-DFT`,
            price: basePrice,
            stock: sumStock,
            attributes: { type: 'Standard' },
          },
        });
      }

      // Provision images if supplied
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

      return productObj;
    });

    return newProduct;
  }

  /**
   * Updates product metadata, price rules, and images
   */
  static async updateProduct(userId: string, productId: string, data: {
    title?: string;
    brand?: string;
    description?: string;
    basePrice?: number;
    comparePrice?: number;
    totalStock?: number;
    categoryId?: string;
    status?: string;
    variants?: any[];
    images?: any[];
  }) {
    const { title, brand, description, basePrice, comparePrice, totalStock, categoryId, status, variants, images } = data;

    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

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
      const err = new Error('You do not own this product listing.');
      (err as any).status = 403;
      throw err;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update product base fields
      const productObj = await tx.product.update({
        where: { id: productId },
        data: {
          title: title !== undefined ? title : product.title,
          brand: brand !== undefined ? brand : product.brand,
          description: description !== undefined ? description : product.description,
          basePrice: basePrice !== undefined ? basePrice : product.basePrice,
          comparePrice: comparePrice !== undefined ? comparePrice : product.comparePrice,
          totalStock: totalStock !== undefined ? Number(totalStock) : product.totalStock,
          categoryId: categoryId !== undefined ? categoryId : product.categoryId,
          status: status !== undefined ? (status as ProductStatus) : product.status,
        },
      });

      // 2. Update variants if provided
      if (Array.isArray(variants)) {
        for (const v of variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                price: v.price !== undefined ? v.price : undefined,
                comparePrice: v.comparePrice !== undefined ? v.comparePrice : undefined,
                stock: v.stock !== undefined ? Number(v.stock) : undefined,
                lowStockAlert: v.lowStockAlert !== undefined ? Number(v.lowStockAlert) : undefined,
                attributes: v.attributes,
                isActive: v.isActive !== undefined ? v.isActive : undefined,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: productId,
                sku: v.sku,
                price: v.price,
                comparePrice: v.comparePrice || null,
                stock: v.stock ? Number(v.stock) : 0,
                lowStockAlert: v.lowStockAlert || 5,
                attributes: v.attributes || {},
              },
            });
          }
        }
      }

      // 3. Recalculate totalStock from variants automatically if variants are updated
      const allVariants = await tx.productVariant.findMany({
        where: { productId, isActive: true },
      });
      if (allVariants.length > 0) {
        const sumStock = allVariants.reduce((sum, item) => sum + item.stock, 0);
        await tx.product.update({
          where: { id: productId },
          data: { totalStock: sumStock },
        });
        productObj.totalStock = sumStock;
      }

      // 4. Update images if provided
      if (Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId } });
        for (const img of images) {
          await tx.productImage.create({
            data: {
              productId: productId,
              url: img.url,
              s3Key: img.s3Key || null,
              altText: img.altText || null,
              sortOrder: img.sortOrder || 0,
              isPrimary: img.isPrimary || false,
            },
          });
        }
      }

      return productObj;
    });

    return updated;
  }

  /**
   * Archives a product (sets status to archived)
   */
  static async archiveProduct(productId: string, user: { id: string; role: string }) {
    const { id: userId, role } = user;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    // Enforce bounds: Owner or Admin
    if (role !== 'admin') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
      });
      if (!seller || product.sellerId !== seller.id) {
        const err = new Error('Action unauthorized.');
        (err as any).status = 403;
        throw err;
      }
    }

    return await prisma.product.update({
      where: { id: productId },
      data: { status: 'archived' },
    });
  }

  /**
   * Retrieves products belonging to the merchant user
   */
  static async getSellerProducts(userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    return await prisma.product.findMany({
      where: {
        sellerId: seller.id,
        status: { in: ['draft', 'published'] }, // exclude archived by default
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        category: true,
        variants: true,
      },
    });
  }
}
