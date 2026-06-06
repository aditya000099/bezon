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
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

// Note: In Bezon, Returns are currently managed entirely on the Order model via returnStatus.
// Therefore, the :id in the route /seller/returns/:id maps directly to the Order ID.
export const SellerReturnDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // This is the Order ID
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inspection State
  const [inspectionStatus, setInspectionStatus] = useState<
    "RESTOCKED" | "DAMAGED" | "DISPOSED" | ""
  >("");
  const [inspectionNotes, setInspectionNotes] = useState("");

  useEffect(() => {
    fetchReturnDetails();
  }, [id]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.orders.sellerDetail(id!));
      if (res.data.success) {
        setOrder(res.data.data);
        const data = res.data.data;
        if (data.returnInspectionStatus !== "PENDING_INSPECTION") {
          setInspectionStatus(data.returnInspectionStatus);
          setInspectionNotes(data.returnInspectionNotes || "");
        }
      }
    } catch (err: any) {
      toast.error("Failed to fetch return details");
    } finally {
      setLoading(false);
    }
  };

  const submitInspection = async () => {
    if (!inspectionStatus) {
      toast.error("Please select an inspection status");
      return;
    }
    if (
      (inspectionStatus === "DAMAGED" || inspectionStatus === "DISPOSED") &&
      !inspectionNotes
    ) {
      toast.error(
        "Inspection notes are required for damaged or disposed products",
      );
      return;
    }

    try {
      setSaving(true);
      const res = await api.post(
        API_ENDPOINTS.orders.sellerInspectReturn(id!),
        {
          status: inspectionStatus,
          notes: inspectionNotes,
        },
      );
      if (res.data.success) {
        toast.success("Return inspected successfully");
        fetchReturnDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save inspection");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSaving(true);
      const res = await api.post(API_ENDPOINTS.orders.sellerApproveReturn(id!));
      if (res.data.success) {
        toast.success("Return approved successfully");
        fetchReturnDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve return");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      setSaving(true);
      const res = await api.post(API_ENDPOINTS.orders.sellerRejectReturn(id!), {
        rejectionReason: reason,
      });
      if (res.data.success) {
        toast.success("Return rejected successfully");
        fetchReturnDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject return");
    } finally {
      setSaving(false);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
        <Spinner className="h-8 w-8 animate-spin mb-4 text-teal-500" />
        <p className="font-medium">Loading return details...</p>
      </div>
    );
  }

  if (!order || !order.returnStatus || order.returnStatus === "NONE") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
        <WarningCircle className="h-12 w-12 mb-3 opacity-20" />
        <p>Return details not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/seller/returns")}
        >
          Back to Returns
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-32 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs & Back Button */}
      <div className="flex flex-col gap-4">
        <nav className="flex text-sm text-zinc-500 items-center">
          <Link to="/seller" className="hover:text-zinc-900">
            Dashboard
          </Link>
          <CaretRight className="mx-2 h-3 w-3" />
          <Link to="/seller/returns" className="hover:text-zinc-900">
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
              onClick={() => navigate("/seller/returns")}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Return: {order.orderNumber}
            </h1>
          </div>
        </div>
      </div>

      {/* Return Summary Card */}
      <Card className="bg-white shadow-sm border-l-4 border-l-teal-500">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
            <div>
              <p className="text-zinc-500 mb-1">Return Reason</p>
              <p className="font-semibold capitalize text-zinc-900">
                {order.returnReason?.replace(/_/g, " ")}
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
              <p className="text-zinc-500 mb-1">Requested Date</p>
              <p className="font-medium text-zinc-900">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            {order.refundStatus && order.refundStatus !== "NONE" && (
              <div>
                <p className="text-zinc-500 mb-1">Refund Status</p>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                    order.refundStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.refundStatus === "FAILED"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.refundStatus}
                </span>
              </div>
            )}
            <div>
              <p className="text-zinc-500 mb-1">Customer City</p>
              <p className="font-medium text-zinc-900 flex items-center gap-1">
                <MapPin className="h-4 w-4 text-zinc-400" />{" "}
                {order.addressSnapshot?.city || "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-600" /> Product Information
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
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" /> Customer Information
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
        </div>
      </div>

      {/* Full-width Timeline */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" /> Return Lifecycle
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative pl-6 space-y-8 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-zinc-200">
            {order.timeline
              ?.slice()
              .reverse()
              .map((t: any, idx: number) => (
                <div key={t.id || idx} className="relative">
                  <div className="absolute -left-[31px] bg-white p-1 rounded-full border border-zinc-200">
                    <div className="h-2 w-2 rounded-full bg-teal-500" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{t.note}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Sticky Action Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-40 p-4 transition-transform md:pl-64">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Approval Actions */}
          {order.returnStatus === "REQUESTED" && (
            <div className="flex w-full justify-between items-center">
              <div>
                <p className="font-bold text-zinc-800">
                  Action Required: Approve Return
                </p>
                <p className="text-sm text-zinc-500">
                  Review the request before assigning a pickup partner.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={saving}
                >
                  Reject
                </Button>
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={handleApprove}
                  disabled={saving}
                >
                  Approve Return
                </Button>
              </div>
            </div>
          )}

          {/* Wait for pickup */}
          {["APPROVED", "ASSIGNED", "PICKED_UP"].includes(
            order.returnStatus,
          ) && (
            <div className="flex w-full justify-between items-center text-zinc-500">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <span>Waiting for logistics to complete return...</span>
              </div>
            </div>
          )}

          {/* Inspection Actions */}
          {order.returnStatus === "COMPLETED" && (
            <div className="flex flex-col md:flex-row w-full gap-4 items-start md:items-center justify-between">
              {order.returnInspectionStatus === "PENDING_INSPECTION" ? (
                <>
                  <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
                    <div className="flex gap-2">
                      {["RESTOCKED", "DAMAGED", "DISPOSED"].map((status) => (
                        <label
                          key={status}
                          className={`px-4 py-2 text-sm font-semibold border rounded-md cursor-pointer transition-colors ${inspectionStatus === status ? "bg-teal-50 border-teal-500 text-teal-800" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
                        >
                          <input
                            type="radio"
                            name="status"
                            className="sr-only"
                            checked={inspectionStatus === status}
                            onChange={() => setInspectionStatus(status as any)}
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder={`Inspection notes ${inspectionStatus === "DAMAGED" || inspectionStatus === "DISPOSED" ? "(Required)" : ""}`}
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        className="w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={submitInspection}
                    disabled={saving}
                    className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto shrink-0"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Save Inspection
                  </Button>
                </>
              ) : (
                <div className="flex w-full justify-between items-center">
                  <div>
                    <p className="font-bold text-zinc-800 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />{" "}
                      Return Inspected
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      Status: <strong>{order.returnInspectionStatus}</strong>
                    </p>
                    {order.returnInspectionNotes && (
                      <p className="text-sm text-zinc-500">
                        Notes: {order.returnInspectionNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
