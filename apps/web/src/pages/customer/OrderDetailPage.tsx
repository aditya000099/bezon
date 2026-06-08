import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@bezon/ui';
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
;
;
;
import {
  SpinnerIcon,
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
  ShoppingBagIcon,
  StarIcon,
  DownloadIcon,
  ArrowCounterClockwiseIcon,
  MoneyIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import { WriteReviewModal } from "../../components/reviews/WriteReviewModal";
import { OrderTrackingStepper } from "../../components/ui/OrderTrackingStepper";
import { SupportChatWidget } from "../../components/SupportChatWidget";
import type { OrderDetail } from "@bezon/types";

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

  // Return Request State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("damaged");
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const handleReturnSubmit = async () => {
    if (!order) return;
    if (!returnReason) {
      toast.warning("Please select a return reason.");
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await api.post(API_ENDPOINTS.orders.requestReturn(order.id), {
        reason: returnReason,
        notes: returnNotes.trim(),
      });

      if (res.data.success) {
        toast.success("Return requested successfully.");
        setReturnModalOpen(false);
        setReturnReason("damaged");
        setReturnNotes("");
        await fetchOrderDetail();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to request return.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!cancelReason) {
      toast.warning("Please select a cancellation reason.");
      return;
    }

    setCancelling(true);
    try {
      const res = await api.post(API_ENDPOINTS.orders.cancel(order.id), {
        cancelReason,
      });

      if (res.data.success) {
        toast.success("Order cancelled successfully.");
        setCancelModalOpen(false);
        setCancelReason("");
        await fetchOrderDetail();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
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
          "Failed to fetch order tracking details.",
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
        <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-sm font-semibold">Loading order tracking...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-75 text-zinc-400 p-8 border-dashed border-2 bg-white/50 max-w-lg mx-auto mt-12">
        <PackageIcon className="h-12 w-12 text-rose-300 mb-2" />
        <p className="font-bold text-zinc-700">Order not found</p>
        <Link to="/orders" className="mt-4">
          <Button size="sm">Back to History</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <Link to="/orders">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-zinc-500 hover:text-zinc-900 -ml-2"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to History
            </Button>
          </Link>
          <div className="flex gap-2">
            {(order.status === "placed" || order.status === "confirmed") && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                onClick={() => setCancelModalOpen(true)}
              >
                Cancel Order
              </Button>
            )}
            {order.status === "delivered" &&
              (!order.returnStatus || order.returnStatus === "NONE") &&
              (() => {
                const deliveredAt =
                  order.deliveredAt ||
                  order.delivery?.deliveredAt ||
                  order.timeline?.find((t) => t.status === "delivered")
                    ?.createdAt;
                if (!deliveredAt) return false;
                const deliveryTime = new Date(deliveredAt).getTime();
                const windowDays = (order as any).returnWindowDays || 7;
                const expirationTime =
                  deliveryTime + windowDays * 24 * 60 * 60 * 1000;
                return Date.now() <= expirationTime;
              })() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  onClick={() => setReturnModalOpen(true)}
                >
                  Request Return
                </Button>
              )}
            {order.billUrl && (
              <a href={order.billUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 font-bold bg-zinc-50 text-zinc-700 border-0"
                >
                  <DownloadIcon className="h-4 w-4" /> DownloadIcon Bill
                </Button>
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight sm:text-2xl">
            Order Tracker{" "}
            <span className="font-mono text-zinc-400 font-normal">
              #{order.orderNumber}
            </span>
          </h1>
          {order.returnStatus && order.returnStatus !== "NONE" && (
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                order.returnStatus === "REQUESTED"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : order.returnStatus === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              RETURN {order.returnStatus.toUpperCase()}
            </span>
          )}
        </div>
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
                            <ShoppingBagIcon className="h-6 w-6 text-zinc-300" />
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
                            ₹{Number(item.unitPrice).toLocaleString()} &times;{" "}
                            {item.qty}
                          </p>
                        </div>
                      </div>
                    </div>
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
                        <ShoppingBagIcon className="h-5 w-5 text-zinc-300" />
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
                            <StarIcon
                              key={i}
                              className={`h-3.5 w-3.5 ${i < item.review!.rating ? "text-amber-400 fill-amber-400" : "text-zinc-300 fill-zinc-300"}`}
                            />
                          ))}
                          <span className="text-[10px] text-zinc-400 ml-2">
                            Reviewed on:{" "}
                            {new Date(
                              item.review!.createdAt,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
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
                      {order.status === "delivered" ? (
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
              <MapPinIcon className="h-4 w-4 text-zinc-500" />
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
                {order.addressSnapshot.city}, {order.addressSnapshot.state} –{" "}
                {order.addressSnapshot.pincode}
              </p>
              <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                <TruckIcon className="h-3.5 w-3.5" /> Call:{" "}
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
                    order.paymentStatus === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
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

          {order.returnStatus !== "NONE" && (
            <Card className="bg-zinc-50/80 border-0">
              <CardHeader className="py-4 flex flex-row items-center gap-2 bg-zinc-100/30 rounded-t-2xl">
                <ArrowCounterClockwiseIcon className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-base font-bold text-zinc-800">
                  Return Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs text-zinc-600">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Current Status
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-1 ${
                      order.returnStatus === "APPROVED" ||
                      order.returnStatus === "ASSIGNED" ||
                      order.returnStatus === "PICKED_UP" ||
                      order.returnStatus === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : order.returnStatus === "REJECTED"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {order.returnStatus}
                  </span>
                  {/* Detailed Description */}
                  {order.returnStatus === "APPROVED" && (
                    <p className="text-[10px] mt-1 text-emerald-600 font-medium">
                      Waiting for pickup partner assignment
                    </p>
                  )}
                  {order.returnStatus === "ASSIGNED" && (
                    <p className="text-[10px] mt-1 text-emerald-600 font-medium">
                      Pickup partner assigned
                    </p>
                  )}
                  {order.returnStatus === "PICKED_UP" && (
                    <p className="text-[10px] mt-1 text-emerald-600 font-medium">
                      Product is being returned to seller
                    </p>
                  )}
                  {order.returnStatus === "COMPLETED" && (
                    <p className="text-[10px] mt-1 text-emerald-600 font-medium">
                      Product received by seller
                    </p>
                  )}
                </div>
                {order.returnRequestedAt && (
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Requested On
                    </span>
                    <span className="font-semibold text-zinc-700">
                      {new Date(order.returnRequestedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {order.returnApprovedAt && (
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Approved On
                    </span>
                    <span className="font-semibold text-zinc-700">
                      {new Date(order.returnApprovedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {order.returnRejectedAt && (
                  <div className="border-t border-zinc-100 pt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                        Rejected On
                      </span>
                      <span className="font-semibold text-zinc-700">
                        {new Date(order.returnRejectedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {order.returnRejectedReason && (
                      <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-2 rounded border border-rose-100">
                        <strong>Reason:</strong> {order.returnRejectedReason}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {order.refundStatus && order.refundStatus !== "NONE" && (
            <Card className="bg-zinc-50/80 border-0">
              <CardHeader className="py-4 flex flex-row items-center gap-2 bg-zinc-100/30 rounded-t-2xl">
                <MoneyIcon className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base font-bold text-zinc-800">
                  Refund Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs text-zinc-600">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Current Status
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-1 ${
                      order.refundStatus === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : order.refundStatus === "FAILED"
                          ? "bg-rose-50 text-rose-700"
                          : order.refundStatus === "READY"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {order.refundStatus}
                  </span>
                </div>
                {order.refundAmount && (
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Refund Amount
                    </span>
                    <span className="font-bold text-zinc-900 text-sm">
                      ₹{Number(order.refundAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                {order.refundedAt && (
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Completed On
                    </span>
                    <span className="font-semibold text-zinc-700">
                      {new Date(order.refundedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {order.refundFailureReason &&
                  order.refundStatus === "FAILED" && (
                    <div className="border-t border-zinc-100 pt-3">
                      <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                        <strong>Issue:</strong> {order.refundFailureReason}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Vertical Timeline logs */}
          <Card className="bg-zinc-50/80 border-0 flex-1">
            <CardHeader className="py-4 flex flex-row items-center gap-2 bg-zinc-100/30 rounded-t-2xl">
              <ClockIcon className="h-4 w-4 text-zinc-500" />
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
                        {evt.status.replace(/_/g, " ")}
                      </p>
                      <p className="text-zinc-500 leading-normal">
                        {evt.note || "No description note."}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(evt.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
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
            type: "order",
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

      {returnModalOpen && (
        <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Request Return
              </DialogTitle>
              <DialogDescription>
                Submit a return request for this order. This action is subject
                to the {(order as any).returnWindowDays || 7}-day return window.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  <option value="damaged">Damaged Product</option>
                  <option value="wrong_product">Wrong Product Received</option>
                  <option value="missing_items">Missing Items</option>
                  <option value="not_as_described">
                    Product Not As Described
                  </option>
                  <option value="defective">Defective Product</option>
                  <option value="quality">Quality Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Additional Notes (Optional)
                </label>
                <textarea
                  placeholder={`Explain the issue in more detail...`}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full min-h-24 resize-none rounded-md border border-zinc-200 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReturnModalOpen(false);
                  setReturnReason("damaged");
                  setReturnNotes("");
                }}
                disabled={submittingReturn}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnSubmit}
                disabled={submittingReturn || !returnReason}
                className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submittingReturn ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {cancelModalOpen && (
        <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-600 flex items-center gap-2">
                Cancel Order
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this order? Once cancelled, this
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  <option value="" disabled>
                    Select a reason...
                  </option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price">
                    Found a better price
                  </option>
                  <option value="Delivery taking too long">
                    Delivery taking too long
                  </option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelReason("");
                }}
                disabled={cancelling}
              >
                Keep Order
              </Button>
              <Button
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason}
                className="font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {cancelling ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
