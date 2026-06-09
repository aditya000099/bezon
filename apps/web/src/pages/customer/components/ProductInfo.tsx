import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@bezon/ui';
import {
  StarIcon,
  HeartIcon,
  SealPercentIcon,
  StorefrontIcon,
  ShieldCheckIcon,
  ArrowCounterClockwiseIcon,
  MoneyIcon,
  ArrowsClockwiseIcon,
} from '@phosphor-icons/react';
import type { Product } from '@bezon/types';

interface ProductCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  validUntil: string;
  scopeType: string;
}

interface ProductInfoProps {
  product: Product & {
    seller?: { id: string; shopName: string; shopSlug: string };
  };
  currentProduct: Product;
  currentPrice: number;
  currentComparePrice: number | null;
  currentStock: number;
  currentSku: string;
  allEditions: Product[];
  coupons: ProductCoupon[];
  isAdding: boolean;
  isInWishlist: (id: string) => boolean;
  onSelectProduct: (p: Product) => void;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  currentProduct,
  currentPrice,
  currentComparePrice,
  currentStock,
  currentSku,
  allEditions,
  coupons,
  isAdding,
  isInWishlist,
  onSelectProduct,
  onAddToCart,
  onAddToWishlist,
}) => {
  const calcCouponDiscount = (coupon: ProductCoupon) => {
    if (coupon.discountType === 'percentage') {
      let disc = (Number(coupon.discountValue) / 100) * currentPrice;
      if (coupon.maxDiscount) disc = Math.min(disc, Number(coupon.maxDiscount));
      return Math.round(disc * 100) / 100;
    }
    return Math.min(Number(coupon.discountValue), currentPrice);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {product.category?.name || 'Catalogue Item'}
          </span>
          {product.brand && (
            <span className="text-zinc-400 text-xs font-semibold">
              Brand: {product.brand}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
          {currentProduct?.title || product.title}
        </h1>
        {product.seller && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-zinc-500">
            <span>Sold by:</span>
            <Link
              to={`/sellers/${product.seller.shopSlug}`}
              className="font-bold text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-1"
            >
              <StorefrontIcon className="h-4 w-4 shrink-0 text-teal-500" />
              {product.seller.shopName}
            </Link>
          </div>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(product.avgRating ? Number(product.avgRating) : 0)
                    ? 'fill-amber-500 text-amber-500'
                    : 'fill-zinc-100 text-zinc-200'
                }`}
              />
            ))}
            <span className="text-amber-500 font-extrabold text-sm ml-1.5">
              {product.avgRating ? Number(product.avgRating).toFixed(1) : '0.0'}
            </span>
          </div>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-500 text-sm font-medium hover:underline cursor-pointer">
            {product.reviewCount || 0} reviews
          </span>
        </div>
      </div>

      <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-5 flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-zinc-900">
            ₹{currentPrice.toLocaleString()}
          </span>
          {currentPrice && (
            <span className="text-zinc-400 line-through text-sm">
              ₹{(currentComparePrice ?? currentPrice ?? 0).toLocaleString()}
            </span>
          )}
          {currentComparePrice && currentComparePrice > currentPrice && (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
              Save {Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)}%
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          SKU: <span className="font-mono">{currentSku}</span>
        </p>
      </div>

      {coupons.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SealPercentIcon className="h-4 w-4 text-teal-500" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Available Coupons
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {coupons.map((coupon) => {
              const disc = calcCouponDiscount(coupon);
              const priceAfter = Math.max(0, currentPrice - disc);
              const meetsMin = currentPrice >= Number(coupon.minOrderValue);
              return (
                <div
                  key={coupon.id}
                  className={`border rounded-xl p-3.5 flex items-center justify-between transition-all ${
                    meetsMin
                      ? 'border-teal-200 bg-teal-50/30 hover:border-teal-300'
                      : 'border-zinc-100 bg-zinc-50/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-white border border-dashed border-teal-300 rounded-lg px-2.5 py-1.5 shrink-0">
                      <span className="font-mono font-extrabold text-teal-700 text-xs tracking-wider">
                        {coupon.code}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-700 truncate">
                        {coupon.description}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {coupon.discountType === 'percentage'
                          ? `${Number(coupon.discountValue)}% off${coupon.maxDiscount ? ` (up to ₹${Number(coupon.maxDiscount)})` : ''}`
                          : `₹${Number(coupon.discountValue)} off`}
                        {Number(coupon.minOrderValue) > 0 &&
                          ` · Min ₹${Number(coupon.minOrderValue)}`}
                      </p>
                    </div>
                  </div>
                  {meetsMin ? (
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-extrabold text-emerald-700">
                        ₹{priceAfter.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold">
                        save ₹{disc.toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 font-medium shrink-0 ml-3">
                      Min ₹{Number(coupon.minOrderValue)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allEditions.length > 1 && (
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Select Edition
          </label>
          <div className="flex gap-3 flex-wrap">
            {allEditions.map((p) => {
              const attrs = p.attributes as any;
              const labelStr = attrs?.color || p.sku;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className={`min-w-30 border rounded-lg p-3 text-left transition-all ${
                    currentProduct?.id === p.id
                      ? 'border-primary bg-primary/5 text-primary-foreground ring-2 ring-primary/20'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  <p className="text-xs font-bold text-black">{labelStr}</p>
                  <p className="text-sm font-extrabold mt-1 text-zinc-900">
                    ₹{Number(p.basePrice).toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-sm text-zinc-600 leading-relaxed">
        {currentProduct?.description ||
          product.description ||
          'No description available for this product.'}
      </p>

      {/* Product Policies */}
      {currentProduct?.policies && (currentProduct.policies as any[]).length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheckIcon className="h-4 w-4 text-teal-500" />
            Product Policies
          </p>
          <div className="flex flex-wrap gap-2">
            {(currentProduct.policies as any[]).map((pp: any) => {
              const policy = pp.policy;
              if (!policy) return null;
              const config: Record<
                string,
                { icon: any; bg: string; text: string; border: string }
              > = {
                return: {
                  icon: ArrowCounterClockwiseIcon,
                  bg: 'bg-blue-50',
                  text: 'text-blue-700',
                  border: 'border-blue-100',
                },
                refund: {
                  icon: MoneyIcon,
                  bg: 'bg-emerald-50',
                  text: 'text-emerald-700',
                  border: 'border-emerald-100',
                },
                replace: {
                  icon: ArrowsClockwiseIcon,
                  bg: 'bg-amber-50',
                  text: 'text-amber-700',
                  border: 'border-amber-100',
                },
              };
              const c = config[policy.type] || config.return;
              const Icon = c.icon;
              return (
                <div
                  key={pp.id}
                  className={`flex items-center gap-2 ${c.bg} ${c.border} border rounded-lg px-3 py-2 text-xs ${c.text}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">{policy.title}</span>
                  <span className="opacity-70">{policy.durationDays} days</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex gap-3 items-center bg-teal-50/30 border border-teal-50 rounded-xl p-4 text-xs text-zinc-600">
          <ShieldCheckIcon className="h-5 w-5 text-teal-500 shrink-0" />
          <p>
            <strong>Fulfillment Promise:</strong> Direct merchant dispatch. Standard platform policies apply.
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        {currentStock > 0 ? (
          <Button
            className="flex-1 font-bold h-12 text-sm shadow-lg shadow-primary/10"
            onClick={onAddToCart}
            disabled={isAdding}
          >
            {isAdding ? 'Adding to Cart...' : 'Add to Shopping Cart'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="flex-1 font-bold h-12 text-sm text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-50 cursor-not-allowed"
            disabled
          >
            Out of Stock
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className={`h-12 w-12 border-zinc-200 hover:text-rose-500 hover:border-rose-200 transition-colors ${
            currentProduct && isInWishlist(currentProduct.id)
              ? 'bg-rose-50/50 border-rose-200 text-rose-500 hover:bg-rose-100/50'
              : ''
          }`}
          onClick={onAddToWishlist}
        >
          <HeartIcon
            className={`h-5 w-5 ${
              currentProduct && isInWishlist(currentProduct.id)
                ? 'fill-rose-500 text-rose-500'
                : 'text-zinc-400'
            }`}
          />
        </Button>
      </div>
    </div>
  );
};
