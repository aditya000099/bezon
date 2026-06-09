import { Button } from "@bezon/ui";
import React, { useState, useEffect, useMemo } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import api from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { AdminOrderMetrics } from "./components/AdminOrderMetrics";
import { AdminOrderFilters } from "./components/AdminOrderFilters";
import { AdminOrderList } from "./components/AdminOrderList";
import { AdminOrderDetailModal } from "./components/AdminOrderDetailModal";
import { AdminOrderExportControls } from "./components/AdminOrderExportControls";
import { logger } from "@/utils/logger";

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(
    null,
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  const fetchOrders = async (currentPage: number = page) => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/orders", {
        params: { page: currentPage, limit },
      });
      if (response.data.success) {
        setOrders(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        }
      }
    } catch (err: any) {
      logger.error(err);

      toast.error("Failed to load platform orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/api/v1/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrderDetails(response.data.data);
      }
    } catch (err: any) {
      logger.error(err);
      toast.error("Failed to load order details");
      setSelectedOrderId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetail(selectedOrderId);
    } else {
      setSelectedOrderDetails(null);
    }
  }, [selectedOrderId]);

  // Handle Cancel Order
  const handleForceCancel = async () => {
    if (!selectedOrderId || !selectedOrderDetails) return;
    if (
      [
        "delivered",
        "cancelled",
        "delivery_failed",
        "refunded",
        "replaced",
      ].includes(selectedOrderDetails.status)
    ) {
      toast.error("Order cannot be cancelled in its current state.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to FORCE CANCEL this order? This action bypasses standard workflows.",
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      const response = await api.patch(
        `/api/v1/orders/${selectedOrderId}/status`,
        {
          status: "cancelled",
        },
      );
      if (response.data.success) {
        toast.success("Order force cancelled successfully.");
        // Refresh details & list
        fetchOrderDetail(selectedOrderId);
        fetchOrders(page);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  // Extract unique values for filters
  const uniqueSellers = useMemo(() => {
    const sellers = orders.map((o) => o.seller?.shopName).filter(Boolean);
    return Array.from(new Set(sellers)).sort();
  }, [orders]);

  const uniquePartners = useMemo(() => {
    const partners = orders
      .map((o) => o.delivery?.partner?.user?.name)
      .filter(Boolean);
    return Array.from(new Set(partners)).sort();
  }, [orders]);

  const uniqueCustomers = useMemo(() => {
    const customers = orders.map((o) => o.customer?.name).filter(Boolean);
    return Array.from(new Set(customers)).sort();
  }, [orders]);

  // Compute metrics from the active dataset
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let returnedCount = 0;

    orders.forEach((o) => {
      const amt = parseFloat(o.total || 0);
      if (o.status !== "cancelled" && o.status !== "delivery_failed") {
        totalRevenue += amt;
      }

      if (
        [
          "placed",
          "confirmed",
          "packed",
          "ready_for_pickup",
          "shipped",
          "out_for_delivery",
        ].includes(o.status)
      ) {
        pendingCount++;
      } else if (o.status === "delivered") {
        deliveredCount++;
      } else if (o.status === "cancelled") {
        cancelledCount++;
      } else if (
        [
          "return_requested",
          "return_approved",
          "returned_to_origin",
          "refund_requested",
          "refund_approved",
          "refunding",
          "refunded",
        ].includes(o.status)
      ) {
        returnedCount++;
      }
    });

    return {
      total: orders.length,
      pending: pendingCount,
      delivered: deliveredCount,
      cancelled: cancelledCount,
      returned: returnedCount,
      revenue: totalRevenue,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Search term match (Order ID, Customer Name, Seller Name)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId =
          order.id.toLowerCase().includes(term) ||
          (order.orderNumber && order.orderNumber.toLowerCase().includes(term));
        const matchesCust = order.customer?.name?.toLowerCase().includes(term);
        const matchesSeller = order.seller?.shopName
          ?.toLowerCase()
          .includes(term);
        if (!matchesId && !matchesCust && !matchesSeller) return false;
      }

      // 2. Status match
      if (statusFilter && order.status !== statusFilter) return false;

      // 3. Payment match
      if (paymentFilter && order.paymentStatus !== paymentFilter) return false;

      // 4. Seller match
      if (sellerFilter && order.seller?.shopName !== sellerFilter) return false;

      // 5. Delivery Partner match
      if (
        partnerFilter &&
        order.delivery?.partner?.user?.name !== partnerFilter
      )
        return false;

      // 6. Customer match
      if (customerFilter && order.customer?.name !== customerFilter)
        return false;

      // 7. Date range match
      if (startDate) {
        const start = new Date(startDate);
        const orderDate = new Date(order.createdAt);
        if (orderDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const orderDate = new Date(order.createdAt);
        if (orderDate > end) return false;
      }

      return true;
    });
  }, [
    orders,
    searchTerm,
    statusFilter,
    paymentFilter,
    sellerFilter,
    partnerFilter,
    customerFilter,
    startDate,
    endDate,
  ]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  // formatters removed, using centralized utilities in subcomponents

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Platform Orders
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Centralized monitoring console for all customer transactions, logs,
            and delivery states.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminOrderExportControls
            filters={{
              searchTerm,
              statusFilter,
              paymentFilter,
              sellerFilter,
              partnerFilter,
              customerFilter,
              startDate,
              endDate,
            }}
          />
          <Button
            onClick={() => fetchOrders(page)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowCounterClockwiseIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <AdminOrderMetrics
        metrics={metrics}
        loading={loading}
        formatCurrency={formatCurrency}
      />

      <AdminOrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        sellerFilter={sellerFilter}
        setSellerFilter={setSellerFilter}
        partnerFilter={partnerFilter}
        setPartnerFilter={setPartnerFilter}
        customerFilter={customerFilter}
        setCustomerFilter={setCustomerFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        uniqueSellers={uniqueSellers}
        uniquePartners={uniquePartners}
        uniqueCustomers={uniqueCustomers}
      />

      <AdminOrderList
        orders={filteredOrders}
        loading={loading}
        formatCurrency={formatCurrency}
        setSelectedOrderId={setSelectedOrderId}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm font-semibold text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <AdminOrderDetailModal
        selectedOrderId={selectedOrderId}
        setSelectedOrderId={setSelectedOrderId}
        selectedOrderDetails={selectedOrderDetails}
        loadingDetails={loadingDetails}
        formatCurrency={formatCurrency}
        handleForceCancel={handleForceCancel}
        cancelling={cancelling}
      />
    </div>
  );
};
