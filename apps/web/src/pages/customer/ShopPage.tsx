import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Star, Search, SlidersHorizontal } from 'lucide-react';
import type { Product } from '@bezon/types';

export const ShopPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock products with shared types mapping
  const mockProducts: Partial<Product>[] = [
    { id: '1', title: 'Premium Wireless Headphones', basePrice: 4999 as any, brand: 'Acoustic', totalStock: 12, avgRating: 4.8 as any, reviewCount: 42 },
    { id: '2', title: 'Minimalist Leather Wallet', basePrice: 1499 as any, brand: 'Sartorial', totalStock: 5, avgRating: 4.5 as any, reviewCount: 15 },
    { id: '3', title: 'Ergonomic Desk Chair', basePrice: 12999 as any, brand: 'Comfort+', totalStock: 0, avgRating: 4.9 as any, reviewCount: 9 },
    { id: '4', title: 'Smart Fitness Band', basePrice: 2999 as any, brand: 'FitPulse', totalStock: 24, avgRating: 4.2 as any, reviewCount: 56 },
  ];

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
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex gap-2 items-center text-sm w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <select className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-slate-600 w-full sm:w-auto">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockProducts.map((p) => (
          <Card key={p.id} className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-white">
            <div className="aspect-square bg-slate-50 border-b border-slate-100 flex items-center justify-center text-slate-300 font-semibold text-xs select-none">
              <ShoppingBag className="h-10 w-10 opacity-40 mb-2 block mx-auto text-slate-400" />
            </div>
            <CardHeader className="p-4 pb-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{p.brand}</span>
              <CardTitle className="text-base font-bold text-slate-800 line-clamp-1 mt-0.5">{p.title}</CardTitle>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
                <Star className="h-3 w-3 fill-amber-500" />
                <span>{p.avgRating as any}</span>
                <span className="text-slate-400 font-normal">({p.reviewCount})</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-950">₹{p.basePrice as any}</span>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              {p.totalStock && p.totalStock > 0 ? (
                <Button className="w-full text-xs font-bold" size="sm">
                  Add to Cart
                </Button>
              ) : (
                <Button variant="secondary" className="w-full text-xs font-bold text-rose-500 bg-rose-50" size="sm" disabled>
                  Out of Stock
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
