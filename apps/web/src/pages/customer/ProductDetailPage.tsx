import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShieldCheck, Heart, ShoppingBag, Loader2, BadgePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
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

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product & { familyMembers?: Product[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [coupons, setCoupons] = useState<ProductCoupon[]>([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.products.detail(slug));
        if (response.data.success) {
          const prodData = response.data.data;
          setProduct(prodData);
          setSelectedProduct(prodData);
          
          const images = prodData.images || [];
          const primaryIdx = images.findIndex((img: any) => img.isPrimary);
          setActiveImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
        }
        const couponRes = await api.get(API_ENDPOINTS.products.coupons(slug));
        if (couponRes.data.success) {
          setCoupons(couponRes.data.data);
        }
      } catch (err) {
        toast.error('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [slug]);

  const handleSelectProduct = (p: Product) => {
    if (p.slug !== slug) {
      navigate(`/shop/products/${p.slug}`, { replace: true });
    }
  };

  const currentProduct = selectedProduct || product;
  const currentImages = currentProduct?.images || [];
  
  const currentPrice = currentProduct ? Number(currentProduct.basePrice) : 0;
  const currentComparePrice = currentProduct?.comparePrice ? Number(currentProduct.comparePrice) : null;
  const currentStock = currentProduct ? currentProduct.totalStock : 0;
  const currentSku = currentProduct ? currentProduct.sku : 'N/A';
  const allEditions = product ? [product, ...(product.familyMembers || [])] : [];

  const calcCouponDiscount = (coupon: ProductCoupon) => {
    if (coupon.discountType === 'percentage') {
      let disc = (Number(coupon.discountValue) / 100) * currentPrice;
      if (coupon.maxDiscount) disc = Math.min(disc, Number(coupon.maxDiscount));
      return Math.round(disc * 100) / 100;
    }
    return Math.min(Number(coupon.discountValue), currentPrice);
  };

  const handleAddToCart = async () => {
    if (!currentProduct) return;
    setIsAdding(true);
    try {
      await addItem(currentProduct.id, 1, currentPrice);
      const attrs = currentProduct.attributes as any;
      const varName = attrs?.color ? ` (${attrs.color})` : '';
      toast.success(`${currentProduct.title}${varName} added to cart!`);
    } catch (error) {
      toast.error('Could not add item to cart. Try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToWishlist = () => {
    if (!currentProduct) return;
    toast.success(`${currentProduct.title} saved to Wishlist!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Loading product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 text-center gap-4">
        <ShoppingBag className="h-16 w-16 text-slate-200" />
        <h2 className="text-xl font-bold text-slate-700">Product not found</h2>
        <Link to="/shop">
          <Button variant="default">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/shop">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden border border-slate-200 bg-white">
            <CardContent className="p-0 aspect-square flex items-center justify-center bg-slate-50 relative overflow-hidden">
              {currentImages.length > 0 ? (
                <img
                  src={currentImages[activeImageIndex]?.url || currentImages[0].url}
                  alt={currentProduct?.title || product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-24 w-24 text-slate-200" />
              )}
              {currentStock > 0 ? (
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  In Stock
                </div>
              ) : (
                <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Out of Stock
                </div>
              )}
            </CardContent>
          </Card>
          {currentImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {currentImages.map((img: any, i: number) => (
                <div
                  key={img.id || i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`aspect-square bg-white border rounded-lg flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
                    activeImageIndex === i ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img.url} alt={`View ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category?.name || 'Catalogue Item'}
              </span>
              {product.brand && (
                <span className="text-slate-400 text-xs font-semibold">Brand: {product.brand}</span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {currentProduct?.title || product.title}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-500 font-extrabold text-sm gap-1">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{product.avgRating ? Number(product.avgRating) : 5.0}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-sm font-medium hover:underline cursor-pointer">
                {product.reviewCount || 0} reviews
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-slate-900">₹{currentPrice.toLocaleString()}</span>
              {currentComparePrice && (
                <span className="text-slate-400 line-through text-sm">₹{currentComparePrice.toLocaleString()}</span>
              )}
              {currentComparePrice && currentComparePrice > currentPrice && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                  Save {Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">SKU: <span className="font-mono">{currentSku}</span></p>
          </div>

          {coupons.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Coupons</span>
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
                          ? 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-300'
                          : 'border-slate-100 bg-slate-50/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-white border border-dashed border-indigo-300 rounded-lg px-2.5 py-1.5 shrink-0">
                          <span className="font-mono font-extrabold text-indigo-700 text-xs tracking-wider">{coupon.code}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{coupon.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {coupon.discountType === 'percentage'
                              ? `${Number(coupon.discountValue)}% off${coupon.maxDiscount ? ` (up to ₹${Number(coupon.maxDiscount)})` : ''}`
                              : `₹${Number(coupon.discountValue)} off`}
                            {Number(coupon.minOrderValue) > 0 && ` · Min ₹${Number(coupon.minOrderValue)}`}
                          </p>
                        </div>
                      </div>
                      {meetsMin ? (
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-extrabold text-emerald-700">₹{priceAfter.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">save ₹{disc.toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium shrink-0 ml-3">Min ₹{Number(coupon.minOrderValue)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {allEditions.length > 1 && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Edition
              </label>
              <div className="flex gap-3 flex-wrap">
                {allEditions.map((p) => {
                  const attrs = p.attributes as any;
                  const labelStr = attrs?.color || p.sku;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={`min-w-[120px] border rounded-lg p-3 text-left transition-all ${
                        currentProduct?.id === p.id
                          ? 'border-primary bg-primary/5 text-primary-foreground ring-2 ring-primary/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{labelStr}</p>
                      <p className="text-sm font-extrabold mt-1 text-slate-900">₹{Number(p.basePrice).toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed">
            {currentProduct?.description || product.description || 'No description available for this product.'}
          </p>

          <div className="flex gap-3 items-center bg-indigo-50/30 border border-indigo-50 rounded-xl p-4 text-xs text-slate-600">
            <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0" />
            <p>
              <strong>Fulfillment Promise:</strong> Direct merchant dispatch. Eligible for return within 7 days of verified photographic delivery receipt.
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            {currentStock > 0 ? (
              <Button
                className="flex-1 font-bold h-12 text-sm shadow-lg shadow-primary/10"
                onClick={handleAddToCart}
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
              className="h-12 w-12 border-slate-200 hover:text-rose-500 hover:border-rose-200 transition-colors"
              onClick={handleAddToWishlist}
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
