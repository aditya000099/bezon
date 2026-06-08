import { Card, CardHeader, CardTitle, CardContent, Button } from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
;
;
import {
  SpinnerIcon,
  ClipboardIcon,
  ArrowRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  QuestionIcon,
} from '@phosphor-icons/react';
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
      toast.error(
        err.response?.data?.message || 'Could not fetch your order history.',
      );
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
        return 'bg-blue-50 text-blue-700';
      case 'confirmed':
        return 'bg-teal-50 text-teal-700';
      case 'packed':
      case 'ready_for_pickup':
        return 'bg-amber-50 text-amber-700';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-purple-50 text-purple-700';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700';
      case 'cancelled':
      case 'delivery_failed':
        return 'bg-rose-50 text-rose-700';
      default:
        return 'bg-zinc-50 text-zinc-700';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
        Your Purchase History
      </h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-400 gap-2">
          <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm font-semibold">Loading orders history...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] text-zinc-400 p-8 border-dashed border-2 bg-white/50">
          <ClipboardIcon className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="font-bold text-zinc-700">No orders placed yet</p>
          <p className="text-xs text-zinc-400 mt-1">
            Browse our shop catalog to place your first order.
          </p>
          <Link to="/">
            <Button className="mt-6 font-bold" size="sm">
              Explore Catalogue
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const itemsCount =
              order.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
            return (
              <Card
                key={order.id}
                className="bg-zinc-50/80 overflow-hidden hover:bg-zinc-100 transition-colors"
              >
                <div className="bg-zinc-100/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-zinc-500">
                    <div>
                      <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                        Order Number
                      </p>
                      <p className="font-mono font-bold text-zinc-700 mt-0.5">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                        Placed On
                      </p>
                      <p className="font-semibold text-zinc-700 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                        Total Amount
                      </p>
                      <p className="font-bold text-zinc-900 mt-0.5">
                        ₹{Number(order.total).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    {(() => {
                      const o = order as any;
                      if (o.refundStatus && o.refundStatus !== 'NONE') {
                        return (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                              o.refundStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : o.refundStatus === 'FAILED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : o.refundStatus === 'READY'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            REFUND {o.refundStatus}
                          </span>
                        );
                      }
                      if (o.returnStatus && o.returnStatus !== 'NONE') {
                        return (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                              o.returnStatus === 'REQUESTED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : o.returnStatus === 'APPROVED' ||
                                    o.returnStatus === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : o.returnStatus === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            RETURN {o.returnStatus}
                          </span>
                        );
                      }
                      return (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(order.status)}`}
                        >
                          {order.status.toUpperCase().replace(/_/g, ' ')}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                      Merchant shop
                    </p>
                    <p className="font-bold text-zinc-800 text-sm">
                      {(order as any).seller?.shopName || 'Marketplace Seller'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Contains {itemsCount}{' '}
                      {itemsCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <Link to={`/orders/${order.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-bold flex items-center gap-1.5 text-xs"
                    >
                      Track Details <ArrowRightIcon className="h-3.5 w-3.5" />
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
