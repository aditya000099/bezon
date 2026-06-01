import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Clock, MapPin, Package, Truck, ShoppingBag } from 'lucide-react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { WriteReviewModal } from '../../components/reviews/WriteReviewModal';
import { OrderTrackingStepper } from '../../components/ui/OrderTrackingStepper';

interface TimelineEvent {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  createdAt: string;
  addressSnapshot: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  seller: {
    shopName: string;
    shopSlug: string;
  };
  items: {
    id: string;
    productId: string;
    productTitle: string;
    sku: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
  }[];
  timeline: TimelineEvent[];
}

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<{ id: string; productId: string; title: string } | null>(null);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.orders.detail(id!));
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Loading order tracking...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 p-8 border-dashed border-2 bg-white/50 max-w-lg mx-auto mt-12">
        <Package className="h-12 w-12 text-rose-300 mb-2" />
        <p className="font-bold text-slate-700">Order not found</p>
        <Link to="/shop/orders" className="mt-4">
          <Button size="sm">Back to History</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/shop/orders">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to History
          </Button>
        </Link>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
          Order Tracker <span className="font-mono text-slate-400 font-normal">#{order.orderNumber}</span>
        </h1>
      </div>

      {/* Progress tracking stepper */}
      <OrderTrackingStepper currentStatus={order.status} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipment item list & delivery destinations */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Shipment Items</CardTitle>
            </CardHeader>
            <CardContent className="p-6 divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex gap-3 items-center">
                    <div className="h-12 w-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productTitle} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.productTitle}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</p>
                    </div>
                  </div>
                  <div className="flex justify-between sm:justify-end items-center gap-4 sm:min-w-[120px]">
                    {order.status === 'delivered' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => {
                          setSelectedOrderItem({
                            id: item.id,
                            productId: item.productId, // wait, does order API return productId inside items? Yes. wait, interface check.
                            title: item.productTitle,
                          });
                          setReviewModalOpen(true);
                        }}
                      >
                        Write Review
                      </Button>
                    )}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-sm">₹{(Number(item.unitPrice) * item.qty).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">₹{Number(item.unitPrice).toLocaleString()} &times; {item.qty}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery destination card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center gap-2 py-4">
              <MapPin className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base font-bold text-slate-800">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-sm text-slate-600 space-y-1 leading-relaxed">
              <p className="font-bold text-slate-800">{order.addressSnapshot.fullName}</p>
              <p>{order.addressSnapshot.line1}</p>
              {order.addressSnapshot.line2 && <p>{order.addressSnapshot.line2}</p>}
              <p>
                {order.addressSnapshot.city}, {order.addressSnapshot.state} – {order.addressSnapshot.pincode}
              </p>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Call: {order.addressSnapshot.phone}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status timeline logging details */}
        <div className="flex flex-col gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-4">
              <CardTitle className="text-base font-bold text-slate-800">Payment & Seller</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs text-slate-600">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Shop Vendor</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{order.seller.shopName}</span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payment Status</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-1 ${
                    order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Charges</span>
                <span className="font-extrabold text-slate-900 text-base mt-0.5 block">₹{Number(order.total).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Vertical Timeline logs */}
          <Card className="bg-white border-slate-200 shadow-sm flex-1">
            <CardHeader className="border-b border-slate-100 py-4 flex flex-row items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base font-bold text-slate-800">Status Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {order.timeline.length === 0 ? (
                <p className="text-slate-400 text-xs">No status logs recorded.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-slate-100">
                  {order.timeline.map((evt) => (
                    <div key={evt.id} className="relative pl-6 text-xs text-slate-600 flex flex-col gap-1">
                      <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                        {evt.status.replace(/_/g, ' ')}
                      </p>
                      <p className="text-slate-500 leading-normal">{evt.note || 'No description note.'}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(evt.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedOrderItem && (
        <WriteReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setTimeout(() => setSelectedOrderItem(null), 200);
          }}
          orderItemId={selectedOrderItem.id}
          productId={selectedOrderItem.productId}
          productTitle={selectedOrderItem.title}
          onSuccess={fetchOrderDetail}
        />
      )}
    </div>
  );
};

