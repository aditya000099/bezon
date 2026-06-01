import prisma from '../db/client.js';
import { createProductSchema, productVariantSchema } from '@bezon/validation';
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

    // Images now live inside variants, not on the product
    const [products, totalCount] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
            },
          },
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

  // Get full product details by slug (for product detail page)
  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          where: { isActive: true },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
        category: true,
        seller: {
          select: { id: true, shopName: true, shopSlug: true },
        },
      },
    });

    if (!product || product.status !== 'published') {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    // Bump view count in the background
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('Failed to increment viewCount', err));

    return product;
  }

  // Create a new product with at least one variant (each variant can have images)
  static async createProduct(userId: string, data: {
    title: string;
    brand?: string;
    description?: string;
    basePrice: number;
    comparePrice?: number;
    totalStock?: number;
    categoryId?: string;
    variants: any[];
  }) {
    const { title, brand, description, basePrice, comparePrice, totalStock, categoryId, variants } = data;

    // Make sure this user is an approved seller
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller || seller.status !== 'approved') {
      const err = new Error('Only approved merchants can register products.');
      (err as any).status = 403;
      throw err;
    }

    // Validate the whole payload (product fields + at least 1 variant)
    const validationResult = createProductSchema.safeParse({
      title, brand, description, basePrice, comparePrice, totalStock,
      variants,
    });
    if (!validationResult.success) {
      const err = new Error(validationResult.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }

    // Build a URL-friendly slug from the title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const newProduct = await prisma.$transaction(async (tx) => {
      // Step 1: Create the product record
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
          totalStock: 0,
          status: 'published',
        },
      });

      // Step 2: Create each variant and its images
      let sumStock = 0;
      for (const v of variants) {
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: productObj.id,
            sku: v.sku,
            price: v.price,
            comparePrice: v.comparePrice || null,
            stock: v.stock || 0,
            lowStockAlert: v.lowStockAlert || 5,
            attributes: v.attributes || {},
          },
        });

        // Create images for this variant
        if (Array.isArray(v.images) && v.images.length > 0) {
          for (const img of v.images) {
            await tx.productImage.create({
              data: {
                variantId: createdVariant.id,
                url: img.url,
                s3Key: img.s3Key || null,
                altText: img.altText || null,
                sortOrder: img.sortOrder || 0,
                isPrimary: img.isPrimary || false,
              },
            });
          }
        }

        sumStock += v.stock || 0;
      }

      // Step 3: Update the product's total stock from all variants
      await tx.product.update({
        where: { id: productObj.id },
        data: { totalStock: sumStock },
      });

      return { ...productObj, totalStock: sumStock };
    });

    return newProduct;
  }

  // Update an existing product, its variants, and variant images
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
  }) {
    const { title, brand, description, basePrice, comparePrice, totalStock, categoryId, status, variants } = data;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
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
      // Step 1: Update the product's basic info
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

      // Step 2: Update variants and their images
      if (Array.isArray(variants)) {
        for (const v of variants) {
          if (v.id) {
            // Update existing variant
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

            // Replace this variant's images if a new set was provided
            if (Array.isArray(v.images)) {
              await tx.productImage.deleteMany({ where: { variantId: v.id } });
              for (const img of v.images) {
                await tx.productImage.create({
                  data: {
                    variantId: v.id,
                    url: img.url,
                    s3Key: img.s3Key || null,
                    altText: img.altText || null,
                    sortOrder: img.sortOrder || 0,
                    isPrimary: img.isPrimary || false,
                  },
                });
              }
            }
          } else {
            // Create brand new variant
            const createdVariant = await tx.productVariant.create({
              data: {
                productId,
                sku: v.sku,
                price: v.price,
                comparePrice: v.comparePrice || null,
                stock: v.stock ? Number(v.stock) : 0,
                lowStockAlert: v.lowStockAlert || 5,
                attributes: v.attributes || {},
              },
            });

            // Create images for the new variant
            if (Array.isArray(v.images) && v.images.length > 0) {
              for (const img of v.images) {
                await tx.productImage.create({
                  data: {
                    variantId: createdVariant.id,
                    url: img.url,
                    s3Key: img.s3Key || null,
                    altText: img.altText || null,
                    sortOrder: img.sortOrder || 0,
                    isPrimary: img.isPrimary || false,
                  },
                });
              }
            }
          }
        }
      }

      // Step 3: Recalculate total stock from all active variants
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

      return productObj;
    });

    return updated;
  }

  // Archive (soft-delete) a product
  static async archiveProduct(productId: string, user: { id: string; role: string }) {
    const { id: userId, role } = user;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    // Only the owner seller or an admin can archive
    if (role !== 'admin') {
      const seller = await prisma.seller.findUnique({ where: { userId } });
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

  // Get all products belonging to the logged-in seller
  static async getSellerProducts(userId: string) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      const err = new Error('Seller profile required.');
      (err as any).status = 403;
      throw err;
    }

    return await prisma.product.findMany({
      where: {
        sellerId: seller.id,
        status: { in: ['draft', 'published'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        variants: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
  }
}
