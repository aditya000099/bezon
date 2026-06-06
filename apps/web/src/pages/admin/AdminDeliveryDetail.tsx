import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Spinner,
  ArrowLeft,
  WarningCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const AdminDeliveryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<any[]>([]);
  const [reassignModal, setReassignModal] = useState<{
    open: boolean;
    type: "delivery" | "return";
  }>({ open: false, type: "delivery" });
  const [selectedPartner, setSelectedPartner] = useState("");
  const { toast } = useToast();

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        API_ENDPOINTS.adminDeliveries.deliveryDetail(id as string),
      );
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (err) {
      toast.error("Failed to load delivery details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.adminDeliveries.partners);
      if (response.data.success) {
        setPartners(response.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch partners");
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchPartners();
  }, [id]);

  const handleReassign = async () => {
    if (!selectedPartner) return;
    try {
      if (reassignModal.type === "delivery") {
        await api.post(
          API_ENDPOINTS.adminDeliveries.reassignDelivery(order.delivery.id),
          { newPartnerId: selectedPartner },
        );
      } else {
        await api.post(API_ENDPOINTS.adminDeliveries.reassignReturn(order.id), {
          newPartnerId: selectedPartner,
        });
      }
      toast.success("Successfully reassigned");
      setReassignModal({ open: false, type: "delivery" });
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reassign");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="animate-spin text-teal-600 h-8 w-8" />
      </div>
    );
  }

  if (!order)
    return <div className="text-zinc-500">Order/Delivery not found.</div>;

  const currentDelivery = order.delivery;
  const isReturnActive = [
    "APPROVED",
    "ASSIGNED",
    "PICKED_UP",
    "COMPLETED",
  ].includes(order.returnStatus);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link to="/admin" className="hover:text-zinc-900">
            Dashboard
          </Link>
          <span>→</span>
          <Link to="/admin/deliveries" className="hover:text-zinc-900">
            Delivery Operations
          </Link>
          <span>→</span>
          <span className="font-medium text-zinc-900">Delivery Details</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Link to="/admin/deliveries">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            Delivery for Order {order.orderNumber}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Customer</span>
              <Link
                to={`/admin/users/${order.customer.id}`}
                className="font-medium text-blue-600"
              >
                {order.customer.name}
              </Link>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Seller</span>
              <Link
                to={`/admin/sellers/${order.seller.id}`}
                className="font-medium text-blue-600"
              >
                {order.seller.shopName}
              </Link>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Order Amount</span>
              <span className="font-bold">
                ₹{Number(order.total).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">View Full Order</span>
              <Link
                to={`/admin/orders/${order.id}`}
                className="text-blue-600 hover:underline"
              >
                Go to Order
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex justify-between">
              Delivery Logistics
              {currentDelivery &&
                ![
                  "delivered",
                  "delivery_failed",
                  "returned_to_origin",
                ].includes(currentDelivery.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setReassignModal({ open: true, type: "delivery" })
                    }
                  >
                    Reassign
                  </Button>
                )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Status</span>
              <span className="font-semibold uppercase px-2 py-1 bg-zinc-100 rounded text-xs">
                {currentDelivery?.status || order.status}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Partner</span>
              {currentDelivery?.partner ? (
                <Link
                  to={`/admin/delivery-partners/${currentDelivery.partner.id}`}
                  className="font-medium text-blue-600"
                >
                  {currentDelivery.partner.user.name}
                </Link>
              ) : (
                <span className="text-zinc-500">Unassigned</span>
              )}
            </div>
            {currentDelivery?.failureReason && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md flex gap-2">
                <WarningCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Delivery Exception</p>
                  <p className="text-xs">{currentDelivery.failureReason}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Info if active */}
        {isReturnActive && (
          <Card className="md:col-span-2 border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between">
                Return Logistics
                {!["COMPLETED", "REJECTED"].includes(order.returnStatus) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setReassignModal({ open: true, type: "return" })
                    }
                  >
                    Reassign
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-zinc-600">Return Status</span>
                  <span className="font-semibold text-amber-800">
                    {order.returnStatus}
                  </span>
                </div>
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-zinc-600">Inspection Status</span>
                  <span className="font-semibold">
                    {order.returnInspectionStatus || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-zinc-600">Refund Status</span>
                  <span className="font-semibold">
                    {order.refundStatus || "NONE"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-zinc-600">Return Partner</span>
                  {order.returnPartner ? (
                    <Link
                      to={`/admin/delivery-partners/${order.returnPartner.id}`}
                      className="font-medium text-blue-600"
                    >
                      {order.returnPartner.user.name}
                    </Link>
                  ) : (
                    <span className="text-zinc-500">Unassigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timelines */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Event Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {order.timeline?.map((t: any, i: number) => (
                <div
                  key={i}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">
                        {t.status.toUpperCase()}
                      </div>
                      <time className="text-xs font-medium text-amber-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <div className="text-slate-500 whitespace-pre-wrap">
                      {t.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={reassignModal.open}
        onOpenChange={(open) =>
          !open && setReassignModal({ ...reassignModal, open: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reassign{" "}
              {reassignModal.type === "delivery" ? "Delivery" : "Return Pickup"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Select New Partner
            </label>
            <select
              className="w-full border p-2 rounded"
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
            >
              <option value="">-- Choose Partner --</option>
              {partners
                .filter(
                  (p) =>
                    p.partnerStatus === "Available" ||
                    p.partnerStatus === "Busy",
                )
                // Basic client side filter, backend enforces strictly.
                .filter((p) => {
                  if (reassignModal.type === "delivery")
                    return p.city === order.seller.city;
                  const address = order.addressSnapshot as any;
                  return p.city === address?.city;
                })
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.name} ({p.city}) - {p.partnerStatus}
                  </option>
                ))}
            </select>
            <p className="text-xs text-zinc-500 mt-2">
              Only approved and available partners in the correct city are
              shown.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setReassignModal({ ...reassignModal, open: false })
              }
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleReassign}
            >
              Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
