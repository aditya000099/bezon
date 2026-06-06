import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Spinner,
  ArrowLeft,
  Package,
  User,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  WarningCircle,
  CaretRight,
  Storefront,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

export const AdminReturnDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Order ID
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturnDetails();
  }, [id]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      // Assuming admin endpoint for order details fetches all necessary return info
      const res = await api.get(API_ENDPOINTS.orders.detail(id!));
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      toast.error("Failed to fetch return details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "ASSIGNED":
        return "bg-orange-100 text-orange-800";
      case "PICKED_UP":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";

      case "PENDING_INSPECTION":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "RESTOCKED":
        return "bg-emerald-100 text-emerald-800";
      case "DAMAGED":
        return "bg-red-100 text-red-800";
      case "DISPOSED":
        return "bg-zinc-100 text-zinc-800";
      default:
        return "bg-zinc-100 text-zinc-800";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-500">
        <Spinner className="h-8 w-8 animate-spin mb-4 text-teal-500" />
        <p className="font-medium">Loading return details...</p>
      </div>
    );
  }

  if (!order || !order.returnStatus || order.returnStatus === "NONE") {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-500">
        <WarningCircle className="h-12 w-12 mb-3 opacity-20" />
        <p>Return details not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/admin/returns")}
        >
          Back to Returns
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumbs & Back Button */}
      <div className="flex flex-col gap-4">
        <nav className="flex text-sm text-zinc-500 items-center">
          <Link to="/admin" className="hover:text-zinc-900">
            Dashboard
          </Link>
          <CaretRight className="mx-2 h-3 w-3" />
          <Link to="/admin/returns" className="hover:text-zinc-900">
            Returns
          </Link>
          <CaretRight className="mx-2 h-3 w-3" />
          <span className="text-zinc-900 font-medium">Return Details</span>
        </nav>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/returns")}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Return Operations: {order.orderNumber}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to={`/admin/orders/${order.id}`}>
              <Button variant="outline" size="sm">
                View Original Order
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Return Summary Card */}
      <Card className="bg-white shadow-sm border-l-4 border-l-teal-500">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-sm">
            <div>
              <p className="text-zinc-500 mb-1">Return Reason</p>
              <p className="font-semibold capitalize text-zinc-900">
                {order.returnReason
                  ? order.returnReason
                      .split("_")
                      .map(
                        (w: string) =>
                          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                      )
                      .join(" ")
                  : "Other"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Return Status</p>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.returnStatus)}`}
              >
                {order.returnStatus?.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Inspection Status</p>
              {order.returnInspectionStatus ? (
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.returnInspectionStatus)}`}
                >
                  {order.returnInspectionStatus?.replace(/_/g, " ")}
                </span>
              ) : (
                <span className="text-zinc-400">-</span>
              )}
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Seller</p>
              <Link
                to={`/admin/sellers`}
                className="font-medium text-teal-600 hover:underline"
              >
                {order.seller?.shopName || "Unknown Seller"}
              </Link>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Customer</p>
              <Link
                to={`/admin/users`}
                className="font-medium text-teal-600 hover:underline"
              >
                {order.customer?.name || "Unknown Customer"}
              </Link>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Returned Date</p>
              <p className="font-medium text-zinc-900">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Product Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-teal-600" /> Product
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-4 items-start border-b pb-4 last:border-0 last:pb-0"
                >
                  {item.product?.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-zinc-100 rounded-md flex items-center justify-center text-xs text-zinc-400 border">
                      <Package className="h-8 w-8 text-zinc-300" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-zinc-900 leading-tight">
                      {item.product?.title}
                    </p>
                    <p className="text-sm text-zinc-500">
                      SKU: {item.product?.slug || "N/A"}
                    </p>
                    <p className="text-sm font-bold text-teal-600">
                      ₹{Number(item.unitPrice).toLocaleString()}
                    </p>
                    <Link
                      to={`/admin/products`}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Full-width Timeline */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" /> Return Lifecycle
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Organize timeline logically by categorizing if possible. Since timeline is just linear notes, we will render it beautifully */}
                <div className="relative pl-6 space-y-8 before:absolute before:inset-y-0 before:left-2.75 before:w-px before:bg-zinc-200">
                  {order.timeline
                    ?.slice()
                    .reverse()
                    .map((t: any, idx: number) => {
                      const isLogistics =
                        t.note.toLowerCase().includes("pickup") ||
                        t.note.toLowerCase().includes("partner") ||
                        t.note.toLowerCase().includes("assigned");
                      const isInspection =
                        t.note.toLowerCase().includes("inspect") ||
                        t.note.toLowerCase().includes("restocked") ||
                        t.note.toLowerCase().includes("damaged") ||
                        t.note.toLowerCase().includes("disposed");
                      const isRequest =
                        t.note.toLowerCase().includes("request") ||
                        t.note.toLowerCase().includes("approve") ||
                        t.note.toLowerCase().includes("reject");

                      let dotColor = "bg-teal-500";
                      if (isInspection) dotColor = "bg-amber-500";
                      if (isLogistics) dotColor = "bg-blue-500";

                      return (
                        <div key={t.id || idx} className="relative">
                          <div className="absolute -left-7.75 bg-white p-1 rounded-full border border-zinc-200">
                            <div
                              className={`h-2 w-2 rounded-full ${dotColor}`}
                            />
                          </div>
                          <div>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLogistics ? "bg-blue-100 text-blue-800" : isInspection ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"}`}
                            >
                              {isLogistics
                                ? "Logistics Event"
                                : isInspection
                                  ? "Inspection Event"
                                  : isRequest
                                    ? "Request Event"
                                    : "System Event"}
                            </span>
                            <p className="font-medium text-zinc-900 mt-1">
                              {t.note}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {new Date(t.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" /> Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm space-y-2">
              <p>
                <span className="text-zinc-500 inline-block w-20">Name:</span>{" "}
                <span className="font-medium">{order.customer?.name}</span>
              </p>
              <p>
                <span className="text-zinc-500 inline-block w-20">Phone:</span>{" "}
                <span>{order.customer?.phone || "N/A"}</span>
              </p>
              <p>
                <span className="text-zinc-500 inline-block w-20">Email:</span>{" "}
                <span>{order.customer?.email}</span>
              </p>
              <p className="pt-2 mt-2 border-t text-zinc-600">
                {order.addressSnapshot?.addressLine1},{" "}
                {order.addressSnapshot?.city}, {order.addressSnapshot?.state}{" "}
                {order.addressSnapshot?.pincode}
              </p>
              {order.returnNotes && (
                <div className="bg-zinc-50 p-3 rounded-md border mt-3">
                  <p className="text-xs font-semibold text-zinc-500 mb-1">
                    Customer Notes:
                  </p>
                  <p className="text-zinc-800 italic">"{order.returnNotes}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Storefront className="h-5 w-5 text-teal-600" /> Seller Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm space-y-2">
              <p>
                <span className="text-zinc-500 inline-block w-20">Shop:</span>{" "}
                <span className="font-medium">{order.seller?.shopName}</span>
              </p>
              <p>
                <span className="text-zinc-500 inline-block w-20">Seller:</span>{" "}
                <span>{order.seller?.user?.name || "N/A"}</span>
              </p>
              <p>
                <span className="text-zinc-500 inline-block w-20">Phone:</span>{" "}
                <span>{order.seller?.user?.phone || "N/A"}</span>
              </p>
              <p>
                <span className="text-zinc-500 inline-block w-20">Email:</span>{" "}
                <span>{order.seller?.user?.email || "N/A"}</span>
              </p>
            </CardContent>
          </Card>

          {/* Delivery Partner */}
          {["ASSIGNED", "PICKED_UP", "COMPLETED"].includes(
            order.returnStatus,
          ) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-5 w-5 text-teal-600" /> Delivery Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-2">
                {order.returnPartner ? (
                  <>
                    <p>
                      <span className="text-zinc-500 inline-block w-24">
                        Partner Name:
                      </span>{" "}
                      <span className="font-medium">
                        {order.returnPartner.user?.name}
                      </span>
                    </p>
                    <p>
                      <span className="text-zinc-500 inline-block w-24">
                        Phone:
                      </span>{" "}
                      <span>{order.returnPartner.user?.phone}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500 inline-block w-24">
                        Assigned On:
                      </span>{" "}
                      <span>
                        {order.returnAssignedAt
                          ? new Date(order.returnAssignedAt).toLocaleString()
                          : "N/A"}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-zinc-500 italic">Assigning partner...</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Inspection Notice */}
          <Card className="bg-zinc-50 border-zinc-200">
            <CardContent className="p-4 text-sm text-zinc-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              This page is read-only. Admins cannot modify return statuses or
              seller inspection results directly.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
