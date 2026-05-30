import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingBag, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-white border border-slate-200 shadow-sm flex items-center justify-between p-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <CardTitle className="text-2xl font-extrabold text-slate-800">₹45,230.00</CardTitle>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> +12% this week
            </span>
          </div>
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm flex items-center justify-between p-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incoming Orders</span>
            <CardTitle className="text-2xl font-extrabold text-slate-800">8 Orders</CardTitle>
            <span className="text-xs font-bold text-slate-500 block">3 awaiting packing</span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm flex items-center justify-between p-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <CardTitle className="text-2xl font-extrabold text-slate-800">2 Items</CardTitle>
            <span className="text-xs font-bold text-rose-600 block">Restock immediately</span>
          </div>
          <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Main Panel */}
      <Card className="bg-white border border-slate-200 shadow-sm p-6">
        <CardHeader className="p-0 pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800">Shop Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4 text-slate-500 text-sm">
          Visualize transaction charts and vendor progress reports directly in this portal.
        </CardContent>
      </Card>
    </div>
  );
};
