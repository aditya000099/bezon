import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Spinner,
  ArrowLeft,
  Package,
  User,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  CurrencyDollar,
  Tag,
  Calendar,
  Pulse,
  Download,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';

export const SellerOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.orders.sellerDetail(id!));
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to fetch order details',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const res = await api.patch(API_ENDPOINTS.orders.updateStatus(id!), {
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(
          `Order status updated to ${newStatus.replace(/_/g, ' ')}`,
        );
        fetchOrderDetails(); // Refresh the data to get the new timeline
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ready_for_pickup':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-700 border-rose-200';

      case 'return_requested':
      case 'refund_requested':
      case 'replacement_requested':
        return 'bg-orange-100 text-orange-700 border-orange-200';

      case 'return_approved':
      case 'refund_approved':
      case 'replacement_approved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';

      case 'return_rejected':
      case 'refund_rejected':
      case 'replacement_rejected':
        return 'bg-rose-100 text-rose-700 border-rose-200';

      case 'returned_to_origin':
      case 'replacement_shipped':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';

      case 'refunding':
        return 'bg-teal-100 text-teal-700 border-teal-200';

      case 'refunded':
      case 'replaced':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';

      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-500">
        <Spinner className="h-8 w-8 animate-spin mb-4 text-teal-500" />
        <p className="font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-500">
        <Package className="h-12 w-12 text-zinc-300 mb-3" />
        <p className="font-bold text-zinc-700">Order not found</p>
        <Link
          to="/seller/orders"
          className="mt-4 text-teal-600 hover:underline"
        >
          Return to Orders
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (acc: number, item: any) => acc + item.qty * Number(item.unitPrice),
    0,
  );
  const discount = Number(order.discount || 0);
  const total = subtotal - discount;

  const orderStatuses = [
    'placed',
    'confirmed',
    'ready_for_pickup',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/seller/orders">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 tracking-tight font-mono">
              Order #{order.orderNumber}
            </h1>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1 font-medium">
              <Calendar className="h-4 w-4" />
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}
          >
            {order.status.replace(/_/g, ' ')}
          </span>
          {order.paymentStatus === 'paid' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Paid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              Pending
            </span>
          )}
          {order.billUrl && (
            <a href={order.billUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="ml-2 font-bold text-zinc-700 border-zinc-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Invoice
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="bg-white border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-zinc-400" />
                Items Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-zinc-100">
                {order.items.map((item: any) => {
                  const primaryImg =
                    item.product?.images?.find((img: any) => img.isPrimary) ||
                    item.product?.images?.[0];
                  return (
                    <li key={item.id} className="p-4 flex gap-4 items-center">
                      <div className="h-16 w-16 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100 shrink-0 overflow-hidden">
                        {primaryImg ? (
                          <img
                            src={primaryImg.url}
                            alt={item.product?.title || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-zinc-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/shop/products/${item.product?.slug || ''}`}
                          className="hover:underline"
                        >
                          <p className="font-bold text-zinc-800 truncate">
                            {item.product?.title || item.productId}
                          </p>
                        </Link>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          Quantity:{' '}
                          <span className="font-semibold text-zinc-700">
                            {item.qty}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-zinc-900">
                          ₹
                          {(item.qty * Number(item.unitPrice)).toLocaleString()}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          ₹{Number(item.unitPrice).toLocaleString()} each
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Pulse Timeline */}
          <Card className="bg-white border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                <Pulse className="h-5 w-5 text-zinc-400" />
                Delivery & Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {order.timeline && order.timeline.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-teal-500 before:via-zinc-200 before:to-transparent">
                  {order.timeline.map((event: any, index: number) => (
                    <div
                      key={event.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-zinc-100 text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        {index === 0 ? (
                          <CheckCircle className="h-5 w-5 text-teal-500" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusColor(event.status)}`}
                          >
                            {event.status.replace(/_/g, ' ')}
                          </span>
                          <time className="text-xs font-semibold text-zinc-400">
                            {new Date(event.createdAt).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric' },
                            )}
                          </time>
                        </div>
                        <p className="text-sm text-zinc-600 mt-2">
                          {event.note || 'Status updated.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic text-center py-4">
                  No timeline events recorded.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summaries & Controls */}
        <div className="space-y-6">
          {/* Status Controls */}
          <Card className="bg-teal-50/50 border-teal-100 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
            <CardHeader>
              <CardTitle className="text-base font-bold text-teal-900 flex items-center gap-2">
                Update Order Status
              </CardTitle>
              <CardDescription className="text-teal-700/80">
                Select a new status to progress the order lifecycle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {(() => {
                  const validTransitions: Record<string, string[]> = {
                    placed: ['confirmed', 'cancelled'],
                    confirmed: ['packed', 'ready_for_pickup', 'cancelled'],
                    packed: ['ready_for_pickup', 'cancelled'],
                    ready_for_pickup: ['cancelled'],
                    shipped: ['out_for_delivery', 'delivery_failed'],
                    out_for_delivery: ['delivered', 'delivery_failed'],
                    delivered: [],

                    // Return flow
                    return_requested: ['return_approved', 'return_rejected'],
                    return_approved: ['returned_to_origin'],
                    returned_to_origin: [
                      'refund_requested',
                      'refunding',
                      'refunded',
                      'replacement_approved',
                    ],

                    // Refund flow
                    refund_requested: ['refund_approved', 'refund_rejected'],
                    refund_approved: ['refunded'],
                    refunding: ['refunded'],

                    // Replacement flow
                    replacement_requested: [
                      'replacement_approved',
                      'replacement_rejected',
                    ],
                    replacement_approved: ['replacement_shipped'],
                    replacement_shipped: ['replaced'],
                  };

                  const allowedNextStatuses =
                    validTransitions[order.status] || [];

                  if (allowedNextStatuses.length === 0) {
                    return (
                      <p className="text-xs text-teal-700 font-semibold italic bg-teal-50 p-3 rounded-lg border border-teal-100">
                        No further status updates are available for this order
                        state.
                      </p>
                    );
                  }

                  return allowedNextStatuses.map((status) => {
                    return (
                      <Button
                        key={status}
                        variant="outline"
                        disabled={updating}
                        className="justify-start capitalize font-bold bg-white border-teal-200 text-teal-700 hover:bg-teal-100"
                        onClick={() => handleUpdateStatus(status)}
                      >
                        {updating ? (
                          <Spinner className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {status.replace(/_/g, ' ')}
                      </Button>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card className="bg-white border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle className="text-base font-bold text-zinc-800 flex items-center gap-2">
                <CurrencyDollar className="h-5 w-5 text-zinc-400" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-800">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Coupon Applied{' '}
                    {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600">
                <span>Fulfillment Charges</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>

              <div className="border-t border-zinc-100 pt-3 flex justify-between font-extrabold text-lg text-zinc-900">
                <span>Total Amount</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping */}
          <Card className="bg-white border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle className="text-base font-bold text-zinc-800 flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-400" />
                Customer & Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Customer
                </p>
                <p className="font-semibold text-zinc-800">
                  {order.customer?.name || 'Guest'}
                </p>
                <p className="text-sm text-zinc-600">{order.customer?.email}</p>
                <p className="text-sm text-zinc-600">{order.customer?.phone}</p>
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Shipping Address
                </p>
                {order.addressSnapshot ? (
                  <div className="text-sm text-zinc-600 leading-relaxed">
                    <p className="font-medium text-zinc-800">
                      {(order.addressSnapshot as any).fullName}
                    </p>
                    <p>{(order.addressSnapshot as any).street}</p>
                    <p>
                      {(order.addressSnapshot as any).city},{' '}
                      {(order.addressSnapshot as any).state}{' '}
                      {(order.addressSnapshot as any).pincode}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 italic">
                    No address provided
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment & Courier */}
          <Card className="bg-white border-zinc-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-250">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle className="text-base font-bold text-zinc-800 flex items-center gap-2">
                <Truck className="h-5 w-5 text-teal-500" />
                Fulfillment & Courier
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {order.delivery && order.delivery.partner ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Delivery Status
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        order.delivery.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.delivery.status === 'delivery_failed'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200 animate-pulse'
                      }`}
                    >
                      {order.delivery.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                        Assigned Courier
                      </p>
                      <p className="font-semibold text-zinc-800">
                        {order.delivery.partner.user?.name}
                      </p>
                      {order.delivery.partner.user?.phone && (
                        <p className="text-xs text-zinc-500 font-medium">
                          Phone: {order.delivery.partner.user.phone}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-zinc-50 pt-2">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                        Vehicle Details
                      </p>
                      <p className="text-xs text-zinc-700 capitalize font-semibold">
                        {order.delivery.partner.vehicleType}{' '}
                        {order.delivery.partner.vehicleNumber
                          ? `— ${order.delivery.partner.vehicleNumber}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ) : order.status === 'ready_for_pickup' ? (
                <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl text-center">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Awaiting Courier Acceptance
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium leading-relaxed">
                    The order is now in the open pool. Available delivery
                    partners in your city can accept it.
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl text-center">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Fulfillment Not Started
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium leading-relaxed">
                    The order will be published to the available delivery
                    partner pool once marked as Ready For Pickup.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
