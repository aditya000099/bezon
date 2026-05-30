import React from 'react';
import { Users, ShoppingBag, ShieldCheck, DollarSign } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      {/* Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Platform GMV</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹4,25,930.00</h3>
          </div>
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Active Sellers</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">12 Vendors</h3>
          </div>
          <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Couriers Online</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">5 Agents</h3>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">System Status</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">Normal</h3>
          </div>
          <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Platform Oversight</h3>
        <p className="text-slate-500 text-sm">Approve sellers, audit active products, track deliveries, and manage platform permissions.</p>
      </div>
    </div>
  );
};
