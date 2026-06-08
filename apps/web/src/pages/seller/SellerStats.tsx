import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@bezon/ui';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  EyeIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  StarIcon,
  HeartIcon,
  PackageIcon,
  ChatTeardropTextIcon,
  SpinnerIcon,
  TrendUpIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
;
;
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';

interface ProductStats {
  title: string;
  sku: string;
  brand: string | null;
  basePrice: number;
  viewCount: number;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  wishlistSaves: number;
  totalStock: number;
  lowStockAlert: number;
  revenue: number;
}

export const SellerStats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get(API_ENDPOINTS.products.stats(id));
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err: any) {
        toast.error(
          err.response?.data?.message ||
            'Failed to load product performance metrics.',
        );
        navigate('/seller/products');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 gap-2">
        <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">Aggregating listing stats...</p>
      </div>
    );
  }

  if (!stats) return null;

  const isLowStock = stats.totalStock <= stats.lowStockAlert;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
            Business Insights
          </p>
          <h1 className="text-xl font-extrabold text-zinc-800 mt-1 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-teal-500" /> Product Performance
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-mono">
            {stats.title} ({stats.sku}) • {stats.brand || 'Unbranded'}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/seller/products')}
          className="w-full sm:w-auto font-bold flex items-center gap-2 hover:cursor-pointer"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Products
        </Button>
      </div>

      {/* 1. Top Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Views */}
        <Card className="bg-white border border-zinc-200 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <EyeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Views
              </p>
              <h2 className="text-2xl font-black text-zinc-800 mt-1">
                {stats.viewCount.toLocaleString()}
              </h2>
            </div>
          </CardContent>
        </Card>

        {/* Sold */}
        <Card className="bg-white border border-zinc-200 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingBagIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Units Sold
              </p>
              <h2 className="text-2xl font-black text-zinc-800 mt-1">
                {stats.soldCount.toLocaleString()}
              </h2>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="bg-white border border-zinc-200 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Revenue
              </p>
              <h2 className="text-2xl font-black text-zinc-800 mt-1">
                ₹{stats.revenue.toLocaleString()}
              </h2>
            </div>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card className="bg-white border border-zinc-200 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-500">
              <StarIcon className="h-6 w-6 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Average Rating
              </p>
              <h2 className="text-2xl font-black text-zinc-800 mt-1 flex items-baseline gap-1">
                {stats.avgRating.toFixed(1)}
                <span className="text-xs font-normal text-zinc-400">/5.0</span>
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Secondary Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reviews Summary */}
        <Card className="bg-white border border-zinc-200 shadow-xs">
          <CardHeader className="pb-2 border-b border-zinc-50">
            <CardTitle className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <ChatTeardropTextIcon className="h-4 w-4 text-zinc-500" /> Customer
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center items-center h-48 text-center gap-2">
            <h3 className="text-4xl font-black text-zinc-800">
              {stats.reviewCount}
            </h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Verified Reviews
            </p>
            <p className="text-[10px] text-zinc-400 mt-2 max-w-[200px]">
              Feedback rating calculated from customer reviews submitted for
              delivered items.
            </p>
          </CardContent>
        </Card>

        {/* Wishlist Summary */}
        <Card className="bg-white border border-zinc-200 shadow-xs">
          <CardHeader className="pb-2 border-b border-zinc-50">
            <CardTitle className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <HeartIcon className="h-4 w-4 text-zinc-500" /> Wishlist Demand
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center items-center h-48 text-center gap-2">
            <h3 className="text-4xl font-black text-rose-500 flex items-center gap-1">
              <HeartIcon className="h-8 w-8 fill-rose-500 text-rose-500" />{' '}
              {stats.wishlistSaves}
            </h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Wishlist Saves
            </p>
            <p className="text-[10px] text-zinc-400 mt-2 max-w-[200px]">
              Tracks customer shopping interest. Shows how many customers added
              this item to faves.
            </p>
          </CardContent>
        </Card>

        {/* Stock Summary */}
        <Card className="bg-white border border-zinc-200 shadow-xs">
          <CardHeader className="pb-2 border-b border-zinc-50">
            <CardTitle className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-zinc-500" /> Inventory Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center items-center h-48 text-center gap-3">
            <h3
              className={`text-4xl font-black ${isLowStock ? 'text-rose-600' : 'text-zinc-800'}`}
            >
              {stats.totalStock}{' '}
              <span className="text-sm font-normal text-zinc-400">units</span>
            </h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Remaining Stock
            </p>

            {isLowStock ? (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                <WarningCircleIcon className="h-3 w-3" /> Low Stock Alert threshold
                ({stats.lowStockAlert})
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded">
                Alert Threshold: {stats.lowStockAlert} units
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue growth trend details card */}
      <Card className="bg-white border border-zinc-200 shadow-xs">
        <CardHeader className="pb-4 border-b border-zinc-100 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold text-zinc-800">
              Business Health Summary
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Insights aggregated from live product listing parameters
            </CardDescription>
          </div>
          <TrendUpIcon className="h-5 w-5 text-teal-500" />
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-sm text-zinc-600">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Unit Base Price
              </span>
              <span className="font-extrabold text-zinc-800 mt-1 block">
                ₹{stats.basePrice.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Delivered Orders Volume
              </span>
              <span className="font-extrabold text-zinc-800 mt-1 block">
                ₹{stats.revenue.toLocaleString()} ({stats.soldCount} units)
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Product Rating Index
              </span>
              <span className="font-extrabold text-zinc-800 mt-1 block">
                {stats.avgRating.toFixed(2)} ★ ({stats.reviewCount} reviews)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
