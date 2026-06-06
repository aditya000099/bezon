import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Money,
  Package,
  Truck,
  User,
  Storefront,
  Clock,
  CheckCircle,
  WarningCircle,
  XCircle,
  Spinner,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

export const AdminRefundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`${API_ENDPOINTS.orders.base}/${id}`);
        setOrder(response.data.data);
      } catch (err: any) {
        toast.error("Failed to fetch refund details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-center text-zinc-500">Order not found</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "FAILED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  const refundTimelineEvents =
    order.timeline?.filter(
      (t: any) =>
        t.note?.includes("Refund") ||
        t.status === "refunded" ||
        t.status === "refunding",
    ) || [];

  const returnTimelineEvents =
    order.timeline?.filter(
      (t: any) =>
        t.note?.includes("Return") ||
        t.note?.includes("Marked") ||
        t.note?.includes("Inventory"),
    ) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/refunds")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">Refund Details</h1>
            {order.refundStatus && (
              <span
                className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${getStatusBadge(order.refundStatus)}`}
              >
                {order.refundStatus}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Order #{order.orderNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Refund Information */}
          <Card className="border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
              <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
                <Money className="h-5 w-5" /> Refund Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Refund Amount
                  </p>
                  <p className="text-xl font-bold text-emerald-700">
                    ₹{Number(order.refundAmount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {order.refundStatus || "NONE"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Eligible Since
                  </p>
                  <p className="text-sm text-zinc-900">
                    {order.refundEligibleAt
                      ? new Date(order.refundEligibleAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Completed At
                  </p>
                  <p className="text-sm text-zinc-900">
                    {order.refundedAt
                      ? new Date(order.refundedAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
              {order.refundFailureReason && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded text-sm text-rose-800 flex items-start gap-2">
                  <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Failure Reason:</strong> {order.refundFailureReason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product & Participants */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-zinc-900 mb-4 flex items-center gap-2 border-b pb-2">
                <Package className="text-zinc-500" /> Items & Participants
              </h3>

              <div className="space-y-4">
                {/* Product */}
                <div className="flex items-center gap-4 bg-zinc-50 p-3 rounded-lg border">
                  {order.items?.[0]?.product?.images?.[0]?.url ? (
                    <img
                      src={order.items[0].product.images[0].url}
                      alt="Product"
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-zinc-200 rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 text-sm">
                      {order.items?.[0]?.product?.title || "Unknown Product"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Subtotal: ₹{Number(order.subtotal).toFixed(2)} | Discount:
                      ₹{Number(order.discount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer */}
                  <div className="p-3 border rounded-lg flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                      <User />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium">
                        Customer
                      </p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {order.customer?.name}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {order.customer?.email}
                      </p>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="p-3 border rounded-lg flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                      <Storefront />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium">
                        Seller
                      </p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {order.seller?.shopName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timelines Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-emerald-50/50 border-b">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-800">
                <Clock className="h-4 w-4" /> Refund Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {refundTimelineEvents.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center">
                  No refund events yet.
                </p>
              ) : (
                <div className="relative border-l border-emerald-200 ml-3 space-y-6">
                  {refundTimelineEvents.map((t: any, idx: number) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-2.25 top-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                      <p className="text-sm font-medium text-zinc-900">
                        {t.note || t.status}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-zinc-50 border-b">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-700">
                <Truck className="h-4 w-4" /> Return & Logistics Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {returnTimelineEvents.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center">
                  No return events found.
                </p>
              ) : (
                <div className="relative border-l border-zinc-200 ml-3 space-y-6">
                  {returnTimelineEvents.map((t: any, idx: number) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-2.25 top-1 h-4 w-4 rounded-full bg-zinc-400 ring-4 ring-zinc-50"></div>
                      <p className="text-sm font-medium text-zinc-900">
                        {t.note || t.status}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
