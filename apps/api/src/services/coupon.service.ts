import prisma from '../db/client.js';
import { couponSchema } from '@bezon/validation';

export class CouponService {
  static async create(sellerId: string, body: any) {
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message);
      (err as any).status = 400;
      throw err;
    }
    const data = parsed.data;

    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) {
      const err = new Error(`Coupon code "${data.code}" is already taken.`);
      (err as any).status = 409;
      throw err;
    }

    if (data.scopeType === 'product' && data.scopeProductId) {
      const product = await prisma.product.findUnique({ where: { id: data.scopeProductId } });
      if (!product || product.sellerId !== sellerId) {
        const err = new Error('You can only create coupons for your own products.');
        (err as any).status = 403;
        throw err;
      }
    } else if (data.scopeType === 'variantGroup' && data.scopeVariantGroupId) {
      const productInGroup = await prisma.product.findFirst({ where: { variantGroupId: data.scopeVariantGroupId, sellerId } });
      if (!productInGroup) {
        const err = new Error('You can only create coupons for your own products.');
        (err as any).status = 403;
        throw err;
      }
    }

    return prisma.coupon.create({
      data: {
        code: data.code,
        sellerId,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount ?? null,
        minOrderValue: data.minOrderValue,
        maxUses: data.maxUses ?? null,
        maxUsesPerUser: data.maxUsesPerUser,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        scopeType: data.scopeType,
        scopeCategoryId: data.scopeCategoryId ?? null,
        scopeProductId: data.scopeProductId ?? null,
        scopeVariantGroupId: data.scopeVariantGroupId ?? null,
      },
    });
  }

  static async update(sellerId: string, couponId: string, body: any) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || coupon.sellerId !== sellerId) {
      const err = new Error('Coupon not found or access denied.');
      (err as any).status = 404;
      throw err;
    }

    const updateData: any = {};
    
    if (body.code !== undefined && body.code !== coupon.code) {
      const existing = await prisma.coupon.findUnique({ where: { code: body.code } });
      if (existing) {
        const err = new Error(`Coupon code "${body.code}" is already taken.`);
        (err as any).status = 409;
        throw err;
      }
      updateData.code = body.code;
    }

    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = body.discountValue;
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount;
    if (body.minOrderValue !== undefined) updateData.minOrderValue = body.minOrderValue;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses;
    if (body.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = body.maxUsesPerUser;
    if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) updateData.validUntil = new Date(body.validUntil);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    if (body.scopeType !== undefined) {
      updateData.scopeType = body.scopeType;

      if (body.scopeType === 'product' && body.scopeProductId) {
        const product = await prisma.product.findUnique({ where: { id: body.scopeProductId } });
        if (!product || product.sellerId !== sellerId) {
          const err = new Error('You can only update coupons for your own products.');
          (err as any).status = 403;
          throw err;
        }
      } else if (body.scopeType === 'variantGroup' && body.scopeVariantGroupId) {
        const productInGroup = await prisma.product.findFirst({ where: { variantGroupId: body.scopeVariantGroupId, sellerId } });
        if (!productInGroup) {
          const err = new Error('You can only update coupons for your own products.');
          (err as any).status = 403;
          throw err;
        }
      }

      updateData.scopeCategoryId = body.scopeCategoryId ?? null;
      updateData.scopeProductId = body.scopeProductId ?? null;
      updateData.scopeVariantGroupId = body.scopeVariantGroupId ?? null;
    }

    return prisma.coupon.update({ where: { id: couponId }, data: updateData });
  }

  static async deleteCoupon(sellerId: string, couponId: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || coupon.sellerId !== sellerId) {
      const err = new Error('Coupon not found or access denied.');
      (err as any).status = 404;
      throw err;
    }
    return prisma.coupon.update({ where: { id: couponId }, data: { isActive: false } });
  }

  static async listSellerCoupons(sellerId: string) {
    return prisma.coupon.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        scopeCategory: { select: { id: true, name: true } },
        scopeProduct: { select: { id: true, title: true } },
        _count: { select: { usages: true } },
      },
    });
  }

  static async applyCoupon(userId: string, code: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: { seller: { select: { id: true, shopName: true } } },
    });

    if (!coupon) {
      const err = new Error('Invalid coupon code.');
      (err as any).status = 404;
      throw err;
    }

    // active check
    if (!coupon.isActive) {
      const err = new Error('This coupon is no longer active.');
      (err as any).status = 400;
      throw err;
    }

    // date check
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      const err = new Error('This coupon has expired or is not yet valid.');
      (err as any).status = 400;
      throw err;
    }

    // global usage check
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      const err = new Error('This coupon has reached its usage limit.');
      (err as any).status = 400;
      throw err;
    }

    // per-user usage check
    const userUsages = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsages >= coupon.maxUsesPerUser) {
      const err = new Error('You have already used this coupon the maximum number of times.');
      (err as any).status = 400;
      throw err;
    }

    // load user cart to check scope + minOrderValue
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, sellerId: true, categoryId: true, title: true, basePrice: true, variantGroupId: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      const err = new Error('Your cart is empty.');
      (err as any).status = 400;
      throw err;
    }

    // filter items that belong to the coupon's seller
    const sellerItems = cart.items.filter(i => i.product.sellerId === coupon.sellerId);
    if (sellerItems.length === 0) {
      const err = new Error(`No items from ${coupon.seller.shopName} in your cart.`);
      (err as any).status = 400;
      throw err;
    }

    // filter further by scope
    let qualifyingItems = sellerItems;
    if (coupon.scopeType === 'category' && coupon.scopeCategoryId) {
      qualifyingItems = sellerItems.filter(i => i.product.categoryId === coupon.scopeCategoryId);
    } else if (coupon.scopeType === 'product' && coupon.scopeProductId) {
      qualifyingItems = sellerItems.filter(i => i.product.id === coupon.scopeProductId);
    } else if (coupon.scopeType === 'variantGroup' && coupon.scopeVariantGroupId) {
      qualifyingItems = sellerItems.filter(i => i.product.variantGroupId === coupon.scopeVariantGroupId);
    }

    if (qualifyingItems.length === 0) {
      const err = new Error('No qualifying items in your cart for this coupon.');
      (err as any).status = 400;
      throw err;
    }

    const qualifyingTotal = qualifyingItems.reduce(
      (sum, item) => sum + Number(item.product.basePrice) * item.qty, 0
    );

    if (qualifyingTotal < Number(coupon.minOrderValue)) {
      const err = new Error(`Minimum order value of ₹${coupon.minOrderValue} not met. Qualifying total: ₹${qualifyingTotal.toFixed(2)}`);
      (err as any).status = 400;
      throw err;
    }

    // calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (Number(coupon.discountValue) / 100) * qualifyingTotal;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Math.min(Number(coupon.discountValue), qualifyingTotal);
    }
    discount = Math.round(discount * 100) / 100;

    const cartTotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.basePrice) * item.qty, 0
    );

    return {
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discount,
      qualifyingTotal,
      cartTotal,
      finalTotal: Math.round((cartTotal - discount) * 100) / 100,
      sellerName: coupon.seller.shopName,
    };
  }

  static async validateAndCalculateDiscount(
    userId: string,
    couponCode: string,
    cartItems: { product: { id: string; sellerId: string; categoryId: string | null }; variant?: { price: any }; qty: number }[],
  ) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
    if (!coupon || !coupon.isActive) return null;

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) return null;
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return null;

    const userUsages = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (userUsages >= coupon.maxUsesPerUser) return null;

    const sellerItems = cartItems.filter(i => i.product.sellerId === coupon.sellerId);
    if (sellerItems.length === 0) return null;

    let qualifyingItems = sellerItems;
    if (coupon.scopeType === 'category' && coupon.scopeCategoryId) {
      qualifyingItems = sellerItems.filter(i => i.product.categoryId === coupon.scopeCategoryId);
    } else if (coupon.scopeType === 'product' && coupon.scopeProductId) {
      qualifyingItems = sellerItems.filter(i => i.product.id === coupon.scopeProductId);
    }
    if (qualifyingItems.length === 0) return null;

    const qualifyingTotal = qualifyingItems.reduce(
      (sum, item) => sum + Number(item.variant?.price || (item.product as any).basePrice) * item.qty, 0
    );
    if (qualifyingTotal < Number(coupon.minOrderValue)) return null;

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (Number(coupon.discountValue) / 100) * qualifyingTotal;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = Math.min(Number(coupon.discountValue), qualifyingTotal);
    }

    return {
      couponId: coupon.id,
      sellerId: coupon.sellerId,
      discount: Math.round(discount * 100) / 100,
    };
  }

  static async getProductCoupons(productId: string, sellerId: string, categoryId: string | null, variantGroupId: string | null, userId?: string) {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        sellerId,
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { scopeType: 'all' },
          { scopeType: 'product', scopeProductId: productId },
          ...(categoryId ? [{ scopeType: 'category' as const, scopeCategoryId: categoryId }] : []),
          ...(variantGroupId ? [{ scopeType: 'variantGroup' as const, scopeVariantGroupId: variantGroupId }] : []),
        ],
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        maxDiscount: true,
        minOrderValue: true,
        maxUses: true,
        usedCount: true,
        maxUsesPerUser: true,
        validUntil: true,
        scopeType: true,
      },
      orderBy: { discountValue: 'desc' },
    });

    return this.filterEligibleCoupons(coupons, userId);
  }

  static async getCartCoupons(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, sellerId: true, categoryId: true, variantGroupId: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) return [];

    const sellerIds = [...new Set(cart.items.map(i => i.product.sellerId))];
    const categoryIds = [...new Set(cart.items.map(i => i.product.categoryId).filter(Boolean))] as string[];
    const productIds = [...new Set(cart.items.map(i => i.product.id))];
    const variantGroupIds = [...new Set(cart.items.map(i => i.product.variantGroupId).filter(Boolean))] as string[];

    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        sellerId: { in: sellerIds },
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { scopeType: 'all' },
          ...(categoryIds.length > 0 ? [{ scopeType: 'category' as const, scopeCategoryId: { in: categoryIds } }] : []),
          { scopeType: 'product' as const, scopeProductId: { in: productIds } },
          ...(variantGroupIds.length > 0 ? [{ scopeType: 'variantGroup' as const, scopeVariantGroupId: { in: variantGroupIds } }] : []),
        ],
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        maxDiscount: true,
        minOrderValue: true,
        maxUses: true,
        usedCount: true,
        maxUsesPerUser: true,
        validUntil: true,
        scopeType: true,
        seller: { select: { shopName: true } },
      },
      orderBy: { discountValue: 'desc' },
      take: 20,
    });

    return this.filterEligibleCoupons(coupons, userId);
  }

  private static async filterEligibleCoupons(coupons: any[], userId?: string) {
    let eligible = coupons.filter(c => !c.maxUses || c.usedCount < c.maxUses);

    if (userId && eligible.length > 0) {
      const usages = await prisma.couponUsage.groupBy({
        by: ['couponId'],
        where: {
          userId,
          couponId: { in: eligible.map(c => c.id) },
        },
        _count: { couponId: true },
      });

      const usageMap = new Map(usages.map(u => [u.couponId, u._count.couponId]));
      eligible = eligible.filter(c => {
        const used = usageMap.get(c.id) || 0;
        return used < c.maxUsesPerUser;
      });
    }

    return eligible.map(({ maxUses, usedCount, maxUsesPerUser, ...rest }: any) => rest);
  }
}

