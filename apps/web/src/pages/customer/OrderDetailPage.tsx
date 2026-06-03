import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Spinner,
  ArrowLeft,
  Clock,
  MapPin,
  Package,
  Truck,
  ShoppingBag,
  Star,
  Download,
  ArrowCounterClockwise,
  Money,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { WriteReviewModal } from '../../components/reviews/WriteReviewModal';
import { OrderTrackingStepper } from '../../components/ui/OrderTrackingStepper';
import { SupportChatWidget } from '../../components/SupportChatWidget';

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
  billUrl?: string;
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
    product?: {
      policies?: {
        policy?: {
          id: string;
          type: 'return' | 'refund' | 'replace';
          title: string;
          description?: string;
          durationDays: number;
          isActive: boolean;
        };
      }[];
    };
    review?: {
      id: string;
      rating: number;
      reviewText: string | null;
      editCount: number;
      createdAt: string;
      images: { url: string; s3Key?: string; sortOrder: number }[];
    };
  }[];
  timeline: TimelineEvent[];
  delivery?: {
    deliveredAt: string | null;
  } | null;
}

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<{
    id: string;
    productId: string;
    title: string;
  } | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);

  // Policy Action State
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [selectedPolicyItem, setSelectedPolicyItem] = useState<{
    id: string;
    productId: string;
    title: string;
    actionType: 'return' | 'refund' | 'replace';
    durationDays: number;
  } | null>(null);
  const [policyReason, setPolicyReason] = useState('');
  const [submittingPolicy, setSubmittingPolicy] = useState(false);

  const handlePolicyActionSubmit = async () => {
    if (!selectedPolicyItem || !order) return;
    if (!policyReason.trim()) {
      toast.warning('Please provide a reason for your request.');
      return;
    }

    setSubmittingPolicy(true);
    try {
      const res = await api.post(API_ENDPOINTS.orders.policyAction(order.id), {
        actionType: selectedPolicyItem.actionType,
        itemId: selectedPolicyItem.id,
        reason: policyReason.trim(),
      });

      if (res.data.success) {
        toast.success(
          `Successfully submitted ${selectedPolicyItem.actionType} request for ${selectedPolicyItem.title}`,
        );
        setPolicyModalOpen(false);
        setPolicyReason('');
        setSelectedPolicyItem(null);
        await fetchOrderDetail();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmittingPolicy(false);
    }
  };

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.orders.detail(id!));
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Failed to fetch order tracking details.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-400 gap-2">
        <Spinner className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">Loading order tracking...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-75 text-zinc-400 p-8 border-dashed border-2 bg-white/50 max-w-lg mx-auto mt-12">
        <Package className="h-12 w-12 text-rose-300 mb-2" />
        <p className="font-bold text-zinc-700">Order not found</p>
        <Link to="/shop/orders" className="mt-4">
          <Button size="sm">Back to History</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <Link to="/shop/orders">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-zinc-500 hover:text-zinc-900 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to History
            </Button>
          </Link>
          {order.billUrl && (
            <a href={order.billUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-bold bg-zinc-50 text-zinc-700 border-0"
              >
                <Download className="h-4 w-4" /> Download Bill
              </Button>
            </a>
          )}
        </div>
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight sm:text-2xl">
          Order Tracker{' '}
          <span className="font-mono text-zinc-400 font-normal">
            #{order.orderNumber}
          </span>
        </h1>
      </div>

      {/* Progress tracking stepper */}
      <OrderTrackingStepper currentStatus={order.status} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipment item list & delivery destinations */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="bg-zinc-50/80 border-0">
            <CardHeader className="bg-zinc-100/30 rounded-t-2xl">
              <CardTitle className="text-base font-bold text-zinc-800">
                Shipment Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 divide-y divide-zinc-100">
              {order.items.map((item) => {
                // Find active policies
                const policies = item.product?.policies || [];
                const activePolicies = policies
                  .map((pp: any) => pp.policy)
                  .filter((p: any) => p && p.isActive);

                // Helper to check window validity
                const getPolicyExpiryStatus = (p: any) => {
                  if (!order.delivery?.deliveredAt)
                    return { valid: false, text: '' };
                  const deliveryTime = new Date(
                    order.delivery.deliveredAt,
                  ).getTime();
                  const expirationTime =
                    deliveryTime + p.durationDays * 24 * 60 * 60 * 1000;
                  const valid = Date.now() <= expirationTime;
                  return { valid, expiryDate: new Date(expirationTime) };
                };

                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3 border-b border-zinc-100 last:border-b-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex gap-3 items-center">
                        <div className="h-12 w-12 bg-secondary/50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-6 w-6 text-zinc-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-800 text-sm line-clamp-1">
                            {item.productTitle}
                          </p>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between sm:justify-end items-center gap-4 sm:min-w-30">
                        <div className="text-right shrink-0">
                          <p className="font-bold text-zinc-900 text-sm">
                            ₹
                            {(
                              Number(item.unitPrice) * item.qty
                            ).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            ₹{Number(item.unitPrice).toLocaleString()} &times;{' '}
                            {item.qty}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Policy Action Buttons */}
                    {order.status === 'delivered' &&
                      activePolicies.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-zinc-100">
                          {activePolicies.map((p: any) => {
                            const { valid } = getPolicyExpiryStatus(p);
                            if (!valid) return null;

                            const btnConfigs: Record<
                              string,
                              {
                                label: string;
                                icon: any;
                                borderClass: string;
                                textClass: string;
                                bgClass: string;
                              }
                            > = {
                              return: {
                                label: 'Request Return',
                                icon: ArrowCounterClockwise,
                                borderClass:
                                  'border-blue-200 hover:border-blue-300',
                                textClass: 'text-blue-700',
                                bgClass: 'bg-blue-50/50 hover:bg-blue-50',
                              },
                              refund: {
                                label: 'Request Refund',
                                icon: Money,
                                borderClass:
                                  'border-emerald-200 hover:border-emerald-300',
                                textClass: 'text-emerald-700',
                                bgClass: 'bg-emerald-50/50 hover:bg-emerald-50',
                              },
                              replace: {
                                label: 'Request Replacement',
                                icon: ArrowsClockwise,
                                borderClass:
                                  'border-amber-200 hover:border-amber-300',
                                textClass: 'text-amber-700',
                                bgClass: 'bg-amber-50/50 hover:bg-amber-50',
                              },
                            };

                            const config =
                              btnConfigs[p.type] || btnConfigs.return;
                            const Icon = config.icon;

                            return (
                              <Button
                                key={p.id}
                                variant="outline"
                                size="sm"
                                className={`text-[10px] font-bold h-7 gap-1.5 px-3 rounded-md transition-all ${config.borderClass} ${config.textClass} ${config.bgClass}`}
                                onClick={() => {
                                  setSelectedPolicyItem({
                                    id: item.id,
                                    productId: item.productId,
                                    title: item.productTitle,
                                    actionType: p.type,
                                    durationDays: p.durationDays,
                                  });
                                  setPolicyModalOpen(true);
                                }}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {config.label} ({p.durationDays}d)
                              </Button>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Dedicated Product Reviews card below shipment items */}
          <Card className="bg-zinc-50/80 border-0 mt-6">
            <CardHeader className="bg-zinc-100/30 rounded-t-2xl py-4">
              <CardTitle className="text-base font-bold text-zinc-800">
                Product Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 divide-y divide-zinc-100">
              {order.items.map((item) => (
                <div
                  key={`review-${item.id}`}
                  className="py-5 first:pt-0 last:pb-0 flex flex-col gap-4"
                >
                  {/* Product context for review */}
                  <div className="flex items-center gap-3 bg-secondary/30 p-2.5 rounded-2xl">
                    <div className="h-10 w-10 bg-secondary/50 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-zinc-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-800 text-xs truncate">
                        {item.productTitle}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {item.sku}
                      </p>
                    </div>
                  </div>

                  {item.review ? (
                    /* Review Exists State */
                    <div className="w-full bg-secondary/40 rounded-2xl p-4 text-xs text-zinc-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < item.review!.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 fill-zinc-300'}`}
                            />
                          ))}
                          <span className="text-[10px] text-zinc-400 ml-2">
                            Reviewed on:{' '}
                            {new Date(
                              item.review!.createdAt,
                            ).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {item.review.editCount === 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-teal-600 font-bold px-2.5 py-0 hover:bg-teal-50 border border-teal-100 hover:border-teal-200 rounded-md transition-colors"
                            onClick={() => {
                              setSelectedOrderItem({
                                id: item.id,
                                productId: item.productId,
                                title: item.productTitle,
                              });
                              setExistingReview(item.review);
                              setReviewModalOpen(true);
                            }}
                          >
                            Edit Review
                          </Button>
                        ) : (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              Review Updated
                            </span>
                            <span className="text-[8px] text-zinc-400 font-semibold uppercase tracking-wider">
                              Edit limit reached
                            </span>
                          </div>
                        )}
                      </div>
                      {item.review.reviewText && (
                        <p className="mb-3 text-zinc-600 leading-relaxed italic border-l-2 border-zinc-300 pl-3">
                          "{item.review.reviewText}"
                        </p>
                      )}
                      {item.review.images && item.review.images.length > 0 && (
                        <div className="flex gap-2">
                          {item.review.images.map((img: any, idx: number) => (
                            <div
                              key={idx}
                              className="h-14 w-14 rounded-xl overflow-hidden bg-white shadow-sm"
                            >
                              <img
                                src={img.url}
                                alt="Review attachment"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No Review Yet State */
                    <div className="w-full bg-secondary/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-zinc-600 text-xs">
                          You haven't reviewed this product yet.
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Share your thoughts with other customers to help them
                          make better choices.
                        </p>
                      </div>
                      {order.status === 'delivered' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold border-teal-200 text-teal-700 hover:bg-teal-50 shrink-0 self-start sm:self-auto"
                          onClick={() => {
                            setSelectedOrderItem({
                              id: item.id,
                              productId: item.productId,
                              title: item.productTitle,
                            });
                            setExistingReview(null);
                            setReviewModalOpen(true);
                          }}
                        >
                          Write Review
                        </Button>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic bg-zinc-100/80 px-2.5 py-1 rounded shrink-0 self-start sm:self-auto">
                          Available once delivered
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery destination card */}
          <Card className="bg-zinc-50/80 border-0">
            <CardHeader className="flex flex-row items-center gap-2 py-4 bg-zinc-100/30 rounded-t-2xl">
              <MapPin className="h-4 w-4 text-zinc-500" />
              <CardTitle className="text-base font-bold text-zinc-800">
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-sm text-zinc-600 space-y-1 leading-relaxed">
              <p className="font-bold text-zinc-800">
                {order.addressSnapshot.fullName}
              </p>
              <p>{order.addressSnapshot.line1}</p>
              {order.addressSnapshot.line2 && (
                <p>{order.addressSnapshot.line2}</p>
              )}
              <p>
                {order.addressSnapshot.city}, {order.addressSnapshot.state} –{' '}
                {order.addressSnapshot.pincode}
              </p>
              <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Call:{' '}
                {order.addressSnapshot.phone}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status timeline logging details */}
        <div className="flex flex-col gap-6">
          <Card className="bg-zinc-50/80 border-0">
            <CardHeader className="py-4 bg-zinc-100/30 rounded-t-2xl">
              <CardTitle className="text-base font-bold text-zinc-800">
                Payment & Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs text-zinc-600">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                  Shop Vendor
                </span>
                <span className="font-bold text-zinc-800 text-sm mt-0.5 block">
                  {order.seller.shopName}
                </span>
              </div>
              <div className="border-t border-zinc-100 pt-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                  Payment Status
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-1 ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              <div className="border-t border-zinc-100 pt-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                  Total Charges
                </span>
                <span className="font-extrabold text-zinc-900 text-base mt-0.5 block">
                  ₹{Number(order.total).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Vertical Timeline logs */}
          <Card className="bg-zinc-50/80 border-0 flex-1">
            <CardHeader className="py-4 flex flex-row items-center gap-2 bg-zinc-100/30 rounded-t-2xl">
              <Clock className="h-4 w-4 text-zinc-500" />
              <CardTitle className="text-base font-bold text-zinc-800">
                Status Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {order.timeline.length === 0 ? (
                <p className="text-zinc-400 text-xs">
                  No status logs recorded.
                </p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-zinc-100">
                  {order.timeline.map((evt) => (
                    <div
                      key={evt.id}
                      className="relative pl-6 text-xs text-zinc-600 flex flex-col gap-1"
                    >
                      <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-teal-50" />
                      <p className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">
                        {evt.status.replace(/_/g, ' ')}
                      </p>
                      <p className="text-zinc-500 leading-normal">
                        {evt.note || 'No description note.'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
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

      {/* AI Support Chat Container - Horizontal layout */}
      <div className="w-full mt-4">
        <SupportChatWidget
          context={{
            type: 'order',
            orderId: order.id,
            orderNumber: order.orderNumber,
          }}
        />
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
          existingReview={existingReview}
          onSuccess={fetchOrderDetail}
        />
      )}

      {selectedPolicyItem && (
        <Dialog open={policyModalOpen} onOpenChange={setPolicyModalOpen}>
          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle className="capitalize flex items-center gap-2">
                Request {selectedPolicyItem.actionType}
              </DialogTitle>
              <DialogDescription>
                Submit a request for "{selectedPolicyItem.title}". This action
                is subject to the {selectedPolicyItem.durationDays}-day policy
                window.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Reason for Request
                </label>
                <textarea
                  placeholder={`Explain why you are requesting a ${selectedPolicyItem.actionType}...`}
                  value={policyReason}
                  onChange={(e) => setPolicyReason(e.target.value)}
                  className="w-full min-h-24 resize-none rounded-md border border-zinc-200 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPolicyModalOpen(false);
                  setPolicyReason('');
                  setSelectedPolicyItem(null);
                }}
                disabled={submittingPolicy}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePolicyActionSubmit}
                disabled={submittingPolicy || !policyReason.trim()}
                className="font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {submittingPolicy ? (
                  <Spinner className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
