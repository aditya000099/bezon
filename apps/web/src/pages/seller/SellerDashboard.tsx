import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  CurrencyDollar,
  ShoppingBag,
  Warning,
  ArrowUpRight,
  Spinner,
} from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';

export const SellerDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    incomingOrders: 0,
    lowStockAlerts: 0,
    pendingSettlements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.sellers.stats);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to fetch dashboard stats',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
        <Spinner className="h-8 w-8 animate-spin mb-4 text-teal-500" />
        <p className="font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-zinc-200 shadow-sm flex items-center justify-between p-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <CardTitle className="text-2xl font-extrabold text-zinc-800">
              ₹{stats.totalRevenue.toLocaleString()}
            </CardTitle>
          </div>
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <CurrencyDollar className="h-5 w-5" />
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 shadow-sm flex items-center justify-between p-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Incoming Orders
            </span>
            <CardTitle className="text-2xl font-extrabold text-zinc-800">
              {stats.incomingOrders} Orders
            </CardTitle>
            <span className="text-xs font-bold text-zinc-500 block">
              Out of {stats.totalOrders} total
            </span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 shadow-sm flex items-center justify-between p-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Pending Settlements
            </span>
            <CardTitle className="text-2xl font-extrabold text-zinc-800">
              ₹{stats.pendingSettlements?.toLocaleString() || 0}
            </CardTitle>
            <span className="text-xs font-bold text-amber-600 block">
              Funds in Escrow
            </span>
          </div>
          <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <Warning className="h-5 w-5" />
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 shadow-sm flex items-center justify-between p-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <CardTitle className="text-2xl font-extrabold text-zinc-800">
              {stats.lowStockAlerts} Items
            </CardTitle>
            <span className="text-xs font-bold text-rose-600 block">
              Restock immediately
            </span>
          </div>
          <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
            <Warning className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Main Panel */}
      <Card className="bg-white border border-zinc-200 shadow-sm p-6 mb-6">
        <CardHeader className="p-0 pb-3 border-b border-zinc-100">
          <CardTitle className="text-lg font-bold text-zinc-800">
            Shop Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4 text-zinc-500 text-sm">
          Visualize transaction charts and vendor progress reports directly in
          this portal.
        </CardContent>
      </Card>

      {/* Returns Operations */}
      <Card className="bg-white border border-zinc-200 shadow-sm p-6">
        <CardHeader className="p-0 pb-3 border-b border-zinc-100">
          <CardTitle className="text-lg font-bold text-zinc-800">
            Returns Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/seller/returns?tab=action-required" className="block p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors group">
              <p className="text-sm font-medium text-zinc-500 group-hover:text-teal-600">Pending Return Requests</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xl font-bold">Review</span>
                <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-teal-600" />
              </div>
            </a>
            
            <a href="/seller/returns?tab=in-progress" className="block p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors group">
              <p className="text-sm font-medium text-zinc-500 group-hover:text-teal-600">Returns In Transit</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xl font-bold">Track</span>
                <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-teal-600" />
              </div>
            </a>
            
            <a href="/seller/returns?tab=action-required" className="block p-4 border rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors group">
              <p className="text-sm font-medium text-zinc-500 group-hover:text-yellow-600">Pending Inspection</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xl font-bold">Inspect</span>
                <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-yellow-600" />
              </div>
            </a>
            
            <a href="/seller/returns?tab=completed" className="block p-4 border rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors group">
              <p className="text-sm font-medium text-zinc-500 group-hover:text-red-600">Damaged Returns</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xl font-bold">View</span>
                <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-red-600" />
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
