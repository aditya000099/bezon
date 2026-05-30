import React from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹45,230.00</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> +12% this week
            </span>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Incoming Orders</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">8 Orders</h3>
            <span className="text-xs font-bold text-slate-500 mt-1 block">3 awaiting packing</span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Low Stock Warnings</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">2 Items</h3>
            <span className="text-xs font-bold text-rose-600 mt-1 block">Restock immediately</span>
          </div>
          <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Shop Performance</h3>
        <p className="text-slate-500 text-sm">Visualize transaction charts and vendor progress reports directly in this portal.</p>
      </div>
    </div>
  );
};
