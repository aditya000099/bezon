import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag,
  Star,
  MagnifyingGlass,
  Spinner,
  Heart,
  Storefront,
  MapPin,
  Info,
  ArrowLeft,
  GridFour,
} from '@phosphor-icons/react';
import type { Product } from '@bezon/types';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

interface SellerShopData {
  id: string;
  shopName: string;
  shopSlug: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  products: (Product & { category: { id: string; name: string } })[];
}

export const SellerShopPage: React.FC = () => {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  const [seller, setSeller] = useState<SellerShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSellerShop = async () => {
      if (!shopSlug) return;
      setLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.sellers.shop(shopSlug));
        if (response.data.success) {
          setSeller(response.data.data);
        }
      } catch (err) {
        toast.error('Could not load seller shop profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchSellerShop();
  }, [shopSlug]);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast.error('Please login to add items to cart.');
      return;
    }
    setAddingToCart((prev) => ({ ...prev, [product.id]: true }));
    try {
      const price = Number(product.basePrice);
      await addItem(product.id, 1, price);
      toast.success(`Added ${product.title} to shopping cart!`);
    } catch (err) {
      toast.error('Failed to add item to cart. Try again.');
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-400 gap-2">
        <Spinner className="h-10 w-10 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">Opening merchant showcase...</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-400 text-center gap-4">
        <Storefront className="h-16 w-16 text-zinc-200" />
        <h2 className="text-xl font-bold text-zinc-700">
          Shop profile not found
        </h2>
        <Link to="/">
          <Button variant="default">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  // Filter products based on search query and category tab selection
  const filteredProducts = seller.products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategoryId
      ? p.categoryId === selectedCategoryId
      : true;
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories from seller's products for tab/filter display
  const uniqueCategories = Array.from(
    new Map(seller.products.map((p) => [p.category.id, p.category])).values(),
  );

  // Group filtered products by category
  const groupedProducts = filteredProducts.reduce<
    Record<string, { categoryName: string; items: typeof seller.products }>
  >((acc, prod) => {
    const catId = prod.categoryId || 'unassigned';
    const catName = prod.category?.name || 'Other Products';
    if (!acc[catId]) {
      acc[catId] = { categoryName: catName, items: [] };
    }
    acc[catId].items.push(prod);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8">
      {/* Back to general shop */}
      <div>
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Button>
        </Link>
      </div>

      {/* Seller Header Profile Card */}
      <div className="relative overflow-hidden bg-zinc-900 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-zinc-800">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
          {/* Shop Logo / Placeholder */}
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-400 overflow-hidden shadow-inner shrink-0">
            {seller.logoUrl ? (
              <img
                src={seller.logoUrl}
                alt={seller.shopName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Storefront className="h-12 w-12 text-zinc-500" />
            )}
          </div>

          {/* Shop Details */}
          <div className="flex-1 text-center md:text-left flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {seller.shopName}
            </h1>

            {seller.description ? (
              <p className="text-sm text-zinc-400 max-w-2xl font-normal leading-relaxed">
                {seller.description}
              </p>
            ) : (
              <p className="text-sm text-zinc-500 italic">
                No description provided by the seller.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-xs text-zinc-400">
              {(seller.city || seller.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-400" />
                  {seller.city && seller.city}
                  {seller.city && seller.state && ', '}
                  {seller.state && seller.state}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-teal-400" />
                {seller.products.length} published item
                {seller.products.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main GridFour: MagnifyingGlass & Categories + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Filter Panels */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* MagnifyingGlass box */}
          <Card className="bg-white border border-zinc-200 shadow-sm rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                MagnifyingGlass Shop
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="MagnifyingGlass products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Tab Selector */}
          <Card className="bg-white border border-zinc-200 shadow-sm rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 flex flex-col gap-1">
              <button
                onClick={() => setSelectedCategoryId('')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-all text-left ${
                  selectedCategoryId === ''
                    ? 'bg-teal-50 text-teal-700 shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <GridFour className="h-4 w-4" />
                All Categories ({seller.products.length})
              </button>
              {uniqueCategories.map((cat) => {
                const count = seller.products.filter(
                  (p) => p.categoryId === cat.id,
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all text-left ${
                      selectedCategoryId === cat.id
                        ? 'bg-teal-50 text-teal-700 shadow-xs'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-75 font-normal bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5">
                      {count}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Category-grouped catalog products */}
        <div className="lg:col-span-3 flex flex-col gap-10">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-60 text-zinc-400 border border-dashed border-zinc-200 rounded-3xl p-8 bg-white/50 text-center">
              <ShoppingBag className="h-12 w-12 text-zinc-300 mb-2" />
              <p className="font-bold text-zinc-700">No matching items found</p>
              <p className="text-xs text-zinc-400 mt-1">
                Try widening your keywords or checking another category
                selection.
              </p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(
              ([catId, { categoryName, items }]) => (
                <div key={catId} className="flex flex-col gap-4">
                  {/* Category Header */}
                  <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                      {categoryName}
                    </h2>
                    <span className="text-xs font-semibold text-zinc-400">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Product GridFour */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {items.map((p) => (
                      <Card
                        key={p.id}
                        className="overflow-hidden border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between bg-white relative rounded-2xl"
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!user) {
                              toast.error('Please login to use your wishlist.');
                              return;
                            }
                            toggleWishlist(p.id, p.title);
                          }}
                          className="absolute top-3 right-3 z-10 h-7 w-7 bg-white/90 hover:bg-white text-zinc-400 hover:text-rose-500 border border-zinc-100 rounded-full flex items-center justify-center shadow-xs backdrop-blur-xs transition-colors"
                        >
                          <Heart
                            className={`h-4 w-4 ${isInWishlist(p.id) ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`}
                          />
                        </button>

                        <Link to={`/products/${p.slug}`}>
                          <div className="aspect-square bg-zinc-50 border-b border-zinc-100 flex items-center justify-center text-zinc-300 font-semibold text-xs select-none cursor-pointer overflow-hidden">
                            {(() => {
                              const primaryImg =
                                p.images?.find((img: any) => img.isPrimary) ||
                                p.images?.[0];
                              return primaryImg ? (
                                <img
                                  src={primaryImg.url}
                                  alt={p.title}
                                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <ShoppingBag className="h-10 w-10 opacity-40 text-zinc-400" />
                              );
                            })()}
                          </div>
                        </Link>

                        <CardHeader className="p-4 pb-0">
                          <span className="text-[9px] font-extrabold text-teal-600 uppercase tracking-widest">
                            {p.brand || 'Seller Direct'}
                          </span>
                          <Link to={`/products/${p.slug}`}>
                            <CardTitle className="text-sm font-bold text-zinc-800 line-clamp-1 mt-0.5 hover:text-teal-600 transition-colors">
                              {p.title}
                            </CardTitle>
                          </Link>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>
                              {p.avgRating
                                ? Number(p.avgRating).toFixed(1)
                                : '0.0'}
                            </span>
                            <span className="text-zinc-400 font-normal">
                              ({p.reviewCount || 0})
                            </span>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-2.5 flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-zinc-900">
                            ₹{Number(p.basePrice).toLocaleString()}
                          </span>
                        </CardContent>

                        <CardFooter className="p-4 pt-0">
                          {p.totalStock > 0 ? (
                            <Button
                              className="w-full text-xs font-bold rounded-xl"
                              size="sm"
                              onClick={() => handleAddToCart(p)}
                              disabled={addingToCart[p.id]}
                            >
                              {addingToCart[p.id] ? 'Adding...' : 'Add to Cart'}
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              className="w-full text-xs font-bold text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-50 cursor-not-allowed rounded-xl"
                              size="sm"
                              disabled
                            >
                              Out of Stock
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
};
