import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Spinner,
  ArrowCounterClockwise,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  Money,
  CaretRight,
  Clock,
  XCircle,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import { Link, useNavigate } from "react-router-dom";

type TabType = "READY" | "PROCESSING" | "COMPLETED" | "FAILED";

export const AdminRefunds: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("READY");
  const [allRefunds, setAllRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  // Modals
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      // For phase 7 simulation, we get all orders that have refundStatus != NONE
      const res = await api.get(API_ENDPOINTS.orders.base, {
        params: { limit: 100 },
      });
      const refunds = res.data.data.filter(
        (r: any) =>
          (r.refundStatus && r.refundStatus !== "NONE") ||
          (r.returnStatus === "COMPLETED" &&
            r.returnInspectionStatus &&
            r.returnInspectionStatus !== "PENDING_INSPECTION"),
      );
      setAllRefunds(refunds);
    } catch (err: any) {
      toast.error("Failed to fetch refunds data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  // Derived Groups
  const ready = allRefunds.filter(
    (r) =>
      (r.refundStatus === "READY" || r.refundStatus === "NONE") &&
      r.returnStatus === "COMPLETED" &&
      r.returnInspectionStatus !== "PENDING_INSPECTION",
  );
  const processing = allRefunds.filter((r) => r.refundStatus === "PROCESSING");
  const completed = allRefunds.filter((r) => r.refundStatus === "COMPLETED");
  const failed = allRefunds.filter((r) => r.refundStatus === "FAILED");

  const totalRefunded = completed.reduce(
    (sum, r) => sum + Number(r.refundAmount || 0),
    0,
  );

  // Apply active tab
  let currentList = ready;
  if (activeTab === "PROCESSING") currentList = processing;
  if (activeTab === "COMPLETED") currentList = completed;
  if (activeTab === "FAILED") currentList = failed;

  // Apply filters
  currentList = currentList.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !r.orderNumber?.toLowerCase().includes(q) &&
        !r.customer?.name?.toLowerCase().includes(q) &&
        !r.items?.[0]?.product?.title?.toLowerCase().includes(q)
      )
        return false;
    }
    if (
      sellerFilter &&
      !r.seller?.shopName?.toLowerCase().includes(sellerFilter.toLowerCase())
    )
      return false;
    return true;
  });

  const handleSimulateProcessing = async () => {
    if (!selectedOrder) return;
    try {
      await api.post(`${API_ENDPOINTS.orders.base}/${selectedOrder.id}/refunds/simulate-processing`);
      toast.success("Refund processing started successfully");
      setProcessingModalOpen(false);
      fetchRefunds();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to start processing refund",
      );
    }
  };

  const handleSimulateCompleted = async (orderId: string) => {
    try {
      await api.post(`${API_ENDPOINTS.orders.base}/${orderId}/refunds/simulate-completed`);
      toast.success("Refund marked as completed");
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete refund");
    }
  };

  const handleSimulateFailed = async (orderId: string) => {
    try {
      await api.post(`${API_ENDPOINTS.orders.base}/${orderId}/refunds/simulate-failed`, {
        reason: "Simulation failure requested",
      });
      toast.error("Refund marked as failed");
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark as failed");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Refund Management
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage refund operations and simulations independently from logistics.
        </p>
      </div>

      {/* Operations Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Money className="h-4 w-4" /> Refund Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {ready.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {processing.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {completed.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-rose-800 flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">
              {failed.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700 text-white shadow-lg">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Money className="h-4 w-4" /> Total Refunded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{totalRefunded.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mt-8">
        <div className="flex space-x-1 bg-zinc-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab("READY")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "READY"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Ready ({ready.length})
          </button>
          <button
            onClick={() => setActiveTab("PROCESSING")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "PROCESSING"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Processing ({processing.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === "COMPLETED"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Completed ({completed.length})
          </button>
          <button
            onClick={() => setActiveTab("FAILED")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === "FAILED"
                ? "bg-white text-rose-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Failed ({failed.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search order, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-center p-4">
              <p className="font-medium text-lg text-zinc-800">
                {activeTab === "READY"
                  ? "No refunds ready to process."
                  : activeTab === "PROCESSING"
                    ? "No refunds currently processing."
                    : activeTab === "FAILED"
                      ? "No failed refunds."
                      : "No completed refunds found."}
              </p>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Refund Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentList.map((order) => (
                    <TableRow key={order.id} className="hover:bg-zinc-50">
                      <TableCell>
                        <span className="font-medium text-zinc-900">
                          {order.orderNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-sm text-zinc-900 max-w-[200px] truncate"
                          title={order.items?.[0]?.product?.title}
                        >
                          {order.items?.[0]?.product?.title || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-zinc-900">
                          {order.customer?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-zinc-900">
                          ₹
                          {Number(
                            order.refundAmount ||
                              Number(order.subtotal) - Number(order.discount),
                          ).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-zinc-500">
                          {activeTab === "READY" && order.refundEligibleAt
                            ? new Date(
                                order.refundEligibleAt,
                              ).toLocaleDateString()
                            : activeTab === "PROCESSING" &&
                                order.refundInitiatedAt
                              ? new Date(
                                  order.refundInitiatedAt,
                                ).toLocaleDateString()
                              : activeTab === "COMPLETED" && order.refundedAt
                                ? new Date(
                                    order.refundedAt,
                                  ).toLocaleDateString()
                                : new Date(
                                    order.updatedAt,
                                  ).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === "READY" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                setSelectedOrder(order);
                                setProcessingModalOpen(true);
                              }}
                            >
                              Process Refund
                            </Button>
                          )}
                          {activeTab === "PROCESSING" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() =>
                                  handleSimulateCompleted(order.id)
                                }
                              >
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => handleSimulateFailed(order.id)}
                              >
                                Fail
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/refunds/${order.id}`)
                            }
                            className="flex items-center gap-1"
                          >
                            Details <CaretRight />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {processingModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-900">
              <WarningCircle className="text-amber-500 h-6 w-6" /> Confirm
              Refund Processing
            </h2>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to start processing a refund of{" "}
              <strong className="text-zinc-900">
                ₹
                {Number(
                  selectedOrder.refundAmount ||
                    Number(selectedOrder.subtotal) -
                      Number(selectedOrder.discount),
                ).toFixed(2)}
              </strong>{" "}
              for order{" "}
              <strong className="text-zinc-900">
                {selectedOrder.orderNumber}
              </strong>
              ?
              <br />
              <br />
              <span className="text-xs text-amber-600 block bg-amber-50 p-2 rounded">
                Note: This is a simulation. The refund status will move to
                PROCESSING.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setProcessingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSimulateProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Processing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
