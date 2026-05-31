import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clipboard, ArrowRight, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import type { Order } from '@bezon/types';

export const OrdersPage: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.orders.base);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not fetch your order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'packed':
      case 'ready_for_pickup':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
      case 'delivery_failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Purchase History</h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold">Loading orders history...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 p-8 border-dashed border-2 bg-white/50">
          <Clipboard className="h-12 w-12 text-slate-300 mb-2" />
          <p className="font-bold text-slate-700">No orders placed yet</p>
          <p className="text-xs text-slate-400 mt-1">Browse our shop catalog to place your first order.</p>
          <Link to="/shop">
            <Button className="mt-6 font-bold" size="sm">
              Explore Catalogue
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemsCount = order.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
            return (
              <Card key={order.id} className="bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Order Number</p>
                      <p className="font-mono font-bold text-slate-700 mt-0.5">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Placed On</p>
                      <p className="font-semibold text-slate-700 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Total Amount</p>
                      <p className="font-bold text-slate-900 mt-0.5">₹{Number(order.total).toLocaleString()}</p>
                    </div>
                  </div>

                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                    {order.status.toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>

                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Merchant shop</p>
                    <p className="font-bold text-slate-800 text-sm">{(order as any).seller?.shopName || 'Marketplace Seller'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contains {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <Link to={`/shop/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="font-bold flex items-center gap-1.5 text-xs">
                      Track Details <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
