import { logger } from '@/utils/logger';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
} from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  StarIcon,
  MagnifyingGlassIcon,
  SpinnerIcon,
  SparkleIcon,
  HeartIcon,
} from '@phosphor-icons/react';
import type { Product, Category } from '@bezon/types';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const ShopPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  // Catalogue and Categories states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.categories.base);
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        logger.error('Failed to load categories', err);
      }
    };
    const fetchRecommendations = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.products.recommended, {
          params: { limit: 4 },
        });
        if (res.data.success) {
          setRecommendedProducts(res.data.data);
        }
      } catch (err) {
        logger.error('Failed to load recommendations', err);
      }
    };

    fetchCategories();
    fetchRecommendations();
  }, []);

  // Fetch products when filters or search inputs change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.products.list, {
          params: {
            search: debouncedSearch || undefined,
            category: selectedCategory || undefined,
            sort: sortBy !== 'featured' ? sortBy : undefined,
          },
        });
        if (response.data.success) {
          setProducts(response.data.data.products || []);
        }
      } catch (err) {
        logger.error(err);
        toast.error('Could not load products. Please check connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, selectedCategory, sortBy]);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast.error('Please login to add items to cart.');
      navigate('/login');
      return;
    }
    setAddingToCart((prev) => ({ ...prev, [product.id]: true }));
    try {
      const price = Number(product.basePrice);
      await addItem(product.id, 1, price);
      toast.success(`Added ${product.title} to shopping cart!`);
    } catch (err) {
      logger.error(err);
      toast.error('Failed to add item to cart. Try again.');
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const handleProductClick = async (e: React.MouseEvent, p: any) => {
    e.preventDefault();
    if (p.isSponsored && p.campaignId) {
      // Fire and forget click tracking
      api.post(API_ENDPOINTS.ads.click(p.campaignId)).catch(logger.error);
    }
    navigate(`/products/${p.slug}`);
  };

  const renderProductCard = (p: any) => (
    <Card
      key={p.isSponsored ? `sponsored-${p.id}` : p.id}
      className="overflow-hidden flex flex-col justify-between bg-card relative group"
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(p.id, p.title);
        }}
        className="absolute top-2 right-2 z-10 h-8 w-8 bg-white/80 hover:bg-white text-zinc-400 hover:text-rose-500 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
      >
        <HeartIcon
          className={`h-4 w-4 ${isInWishlist(p.id) ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`}
        />
      </button>
      {p.isSponsored && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-zinc-900/80 backdrop-blur text-[9px] font-bold tracking-widest text-white rounded uppercase shadow-sm">
          Sponsored
        </div>
      )}
      <div onClick={(e) => handleProductClick(e, p)}>
        <div className="aspect-square bg-secondary flex items-center justify-center text-zinc-300 font-semibold text-xs select-none cursor-pointer overflow-hidden rounded-2xl">
          {(() => {
            const primaryImg =
              p.images?.find((img: any) => img.isPrimary) || p.images?.[0];
            return primaryImg ? (
              <img
                src={primaryImg.url}
                alt={p.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <ShoppingBagIcon className="h-10 w-10 opacity-40 mb-2 block mx-auto text-zinc-400" />
            );
          })()}
        </div>
      </div>
      <CardHeader className="p-2 pb-0">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {p.brand || 'Unbranded'}
        </span>
        <div
          onClick={(e) => handleProductClick(e, p)}
          className="cursor-pointer"
        >
          <CardTitle className="text-base font-bold text-zinc-800 line-clamp-1 mt-0.5 hover:text-zinc-600 transition-colors">
            {p.title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
          <StarIcon className="h-3 w-3 fill-amber-500 text-amber-500" />
          <span>{p.avgRating ? Number(p.avgRating).toFixed(1) : '0.0'}</span>
          <span className="text-zinc-400 font-normal">
            ({p.reviewCount || 0})
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 flex items-baseline gap-2">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex gap-2 justify-center items-center">
            <span className="text-lg font-extrabold text-zinc-900">
              ₹{Number(p.basePrice).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-zinc-500 line-through">
              ₹{Number(p.comparePrice).toLocaleString()}
            </span>
          </div>
          <div>
            {p.comparePrice && Number(p.comparePrice) > Number(p.basePrice) && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                Save{' '}
                {Math.round(
                  ((p.comparePrice - p.basePrice) / p.comparePrice) * 100,
                )}
                %
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {p.totalStock > 0 ? (
          <Button
            className="w-full text-xs font-bold"
            size="sm"
            onClick={() => handleAddToCart(p)}
            disabled={addingToCart[p.id]}
          >
            {addingToCart[p.id] ? 'Adding...' : 'Add to Cart'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full text-xs font-bold text-rose-500 cursor-not-allowed"
            size="sm"
            disabled
          >
            Out of Stock
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 bg-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="absolute inset-y-0 left-3 flex items-center text-zinc-400 h-4 w-4 mt-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              placeholder="Search items, brands, sellers..."
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-secondary rounded-xl text-sm px-3 py-2 outline-none font-semibold text-zinc-600 w-full sm:w-auto cursor-pointer"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Popularity</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selectedCategory === ''
                ? 'bg-zinc-800 text-white'
                : 'bg-secondary text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-zinc-800 text-white'
                  : 'bg-secondary text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Section */}
      {!loading &&
        recommendedProducts.length > 0 &&
        !debouncedSearch &&
        !selectedCategory && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <SparkleIcon className="h-5 w-5 text-teal-500" />
              <h2 className="text-xl font-black text-zinc-800 tracking-tight">
                Recommended for You
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((p) => renderProductCard(p))}
            </div>
          </div>
        )}

      {/* Catalog Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 gap-2">
          <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm font-semibold">Loading catalog items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl p-8 bg-white/50">
          <ShoppingBagIcon className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="font-bold text-zinc-700">No matching products found</p>
          <p className="text-xs text-zinc-400 mt-1">
            Try widening your search terms or changing category filters.
          </p>
        </div>
      ) : !selectedCategory && !debouncedSearch ? (
        <div className="flex flex-col gap-10">
          {categories.map((cat) => {
            const catProducts = products.filter((p) => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;
            const hasMore = catProducts.length > 4;
            return (
              <div key={cat.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 px-1">
                  <h2 className="text-2xl font-black text-zinc-800 tracking-tight">
                    {cat.name}
                  </h2>
                  {hasMore && (
                    <button
                      onClick={() => setSelectedCategory(cat.slug)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors shrink-0 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-full"
                    >
                      See More &rarr;
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {catProducts.slice(0, 4).map((p) => renderProductCard(p))}
                </div>
              </div>
            );
          })}

          {/* Fallback for products without a matched category */}
          {products.filter(
            (p) => !categories.find((c) => c.id === p.categoryId),
          ).length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 px-1">
                <h2 className="text-2xl font-black text-zinc-800 tracking-tight">
                  Other Products
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products
                  .filter((p) => !categories.find((c) => c.id === p.categoryId))
                  .slice(0, 4)
                  .map((p) => renderProductCard(p))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-2xl font-black text-zinc-800 tracking-tight">
              {selectedCategory
                ? `${categories.find((c) => c.slug === selectedCategory)?.name || 'Category'} Products`
                : 'Search Results'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => renderProductCard(p))}
          </div>
        </div>
      )}
    </div>
  );
};
