import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Star, Search, Loader2 } from 'lucide-react';
import type { Product, Category } from '@bezon/types';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';

export const ShopPage: React.FC = () => {
  const { toast } = useToast();
  const { addItem } = useCart();

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
        const response = await api.get(API_ENDPOINTS.categories);
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
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
        toast.error('Could not load products. Please check connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, selectedCategory, sortBy]);

  const handleAddToCart = async (product: Product) => {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute inset-y-0 left-3 flex items-center text-slate-400 h-4 w-4 mt-3" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            placeholder="Search items, brands, sellers..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-slate-600 w-full sm:w-auto cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-slate-600 w-full sm:w-auto cursor-pointer"
          >
            <option value="featured">Sort by: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popular">Popularity</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-slate-400 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold">Loading catalog items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-white/50">
          <ShoppingBag className="h-12 w-12 text-slate-300 mb-2" />
          <p className="font-bold text-slate-700">No matching products found</p>
          <p className="text-xs text-slate-400 mt-1">
            Try widening your search terms or changing category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Card
              key={p.id}
              className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-white"
            >
              <Link to={`/shop/products/${p.slug}`}>
                <div className="aspect-square bg-slate-50 border-b border-slate-100 flex items-center justify-center text-slate-300 font-semibold text-xs select-none cursor-pointer overflow-hidden">
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
                      <ShoppingBag className="h-10 w-10 opacity-40 mb-2 block mx-auto text-slate-400" />
                    );
                  })()}
                </div>
              </Link>
              <CardHeader className="p-4 pb-0">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  {p.brand || 'Unbranded'}
                </span>
                <Link to={`/shop/products/${p.slug}`}>
                  <CardTitle className="text-base font-bold text-slate-800 line-clamp-1 mt-0.5 hover:text-indigo-600 transition-colors">
                    {p.title}
                  </CardTitle>
                </Link>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span>{p.avgRating ? Number(p.avgRating) : 5.0}</span>
                  <span className="text-slate-400 font-normal">
                    ({p.reviewCount || 0})
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3 flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{Number(p.basePrice).toLocaleString()}
                </span>
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
                    className="w-full text-xs font-bold text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-50 cursor-not-allowed"
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
      )}
    </div>
  );
};
