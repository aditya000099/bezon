import React from 'react';
import { Card } from '@/components/ui/card';
import { ShoppingBag, CurrencyInr, Clock, CheckCircle, XCircle, ArrowCounterClockwise } from '@phosphor-icons/react';

export interface AdminOrderMetricsProps {
  metrics: {
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    returned: number;
    revenue: number;
  };
  loading: boolean;
  formatCurrency: (val: number) => string;
}

export const AdminOrderMetrics: React.FC<AdminOrderMetricsProps> = ({ metrics, loading, formatCurrency }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="bg-white border-zinc-200 shadow-sm p-4">
        <div className="flex justify-between items-start text-zinc-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Total Revenue</span>
          <CurrencyInr className="h-4 w-4 text-indigo-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 mt-2 truncate">
          {loading ? '...' : formatCurrency(metrics.revenue)}
        </h3>
      </Card>

      <Card className="bg-white border-zinc-200 shadow-sm p-4">
        <div className="flex justify-between items-start text-zinc-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Total Orders</span>
          <ShoppingBag className="h-4 w-4 text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 mt-2">
          {loading ? '...' : metrics.total}
        </h3>
      </Card>

      <Card className="bg-white border-zinc-200 shadow-sm p-4">
        <div className="flex justify-between items-start text-zinc-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
          <Clock className="h-4 w-4 text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 mt-2">
          {loading ? '...' : metrics.pending}
        </h3>
      </Card>

      <Card className="bg-white border-zinc-200 shadow-sm p-4">
        <div className="flex justify-between items-start text-zinc-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Delivered</span>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 mt-2">
          {loading ? '...' : metrics.delivered}
        </h3>
      </Card>

      <Card className="bg-white border-zinc-200 shadow-sm p-4">
        <div className="flex justify-between items-start text-zinc-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Returned</span>
          <ArrowCounterClockwise className="h-4 w-4 text-purple-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 mt-2">
          {loading ? '...' : metrics.returned}
        </h3>
      </Card>

      <Card className="bg-white border-zinc-200 shadow-sm p-4">
        <div className="flex justify-between items-start text-zinc-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
          <XCircle className="h-4 w-4 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 mt-2">
          {loading ? '...' : metrics.cancelled}
        </h3>
      </Card>
    </div>
  );
};
