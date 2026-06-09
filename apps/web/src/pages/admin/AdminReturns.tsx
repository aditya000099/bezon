import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Input,
} from "@bezon/ui";
import React, { useState, useEffect, useMemo } from "react";
import {
  SpinnerIcon,
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  TruckIcon,
  WarningCircleIcon,
  MagnifyingGlassIcon,
  StorefrontIcon,
  PackageIcon,
  ClockIcon,
  MoneyIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";

type TabType = "ACTION_REQUIRED" | "LOGISTICS" | "COMPLETED" | "REFUND_READY";

export const AdminReturns: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("ACTION_REQUIRED");
  const [allReturns, setAllReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sellerFilter] = useState("");
  const [reasonFilter] = useState("");
  const [inspectionFilter] = useState("");
  const [sortOption, setSortOption] = useState("Newest");

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const [reqRes, appRes, assRes, pickRes, compRes, rejRes] =
        await Promise.all([
          api.get(API_ENDPOINTS.orders.base, {
            params: { returnStatus: "REQUESTED" },
          }),
          api.get(API_ENDPOINTS.orders.base, {
            params: { returnStatus: "APPROVED" },
          }),
          api.get(API_ENDPOINTS.orders.base, {
            params: { returnStatus: "ASSIGNED" },
          }),
          api.get(API_ENDPOINTS.orders.base, {
            params: { returnStatus: "PICKED_UP" },
          }),
          api.get(API_ENDPOINTS.orders.base, {
            params: { returnStatus: "COMPLETED" },
          }),
          api.get(API_ENDPOINTS.orders.base, {
            params: { returnStatus: "REJECTED" },
          }),
        ]);

      const data = [
        ...(reqRes.data.data || []),
        ...(appRes.data.data || []),
        ...(assRes.data.data || []),
        ...(pickRes.data.data || []),
        ...(compRes.data.data || []),
        ...(rejRes.data.data || []),
      ];

      setAllReturns(data);
    } catch (err: any) {
      logger.error(err);
      toast.error("Failed to fetch returns data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Analytics Calculations
  const analytics = useMemo(() => {
    if (!allReturns.length) return null;

    const productCounts: Record<string, number> = {};
    const sellerCounts: Record<string, number> = {};
    let totalTime = 0;
    let completedCount = 0;

    allReturns.forEach((r) => {
      // Top Product
      const productTitle = r.items?.[0]?.product?.title;
      if (productTitle) {
        productCounts[productTitle] = (productCounts[productTitle] || 0) + 1;
      }

      // Top Seller
      const sellerName = r.seller?.shopName;
      if (sellerName) {
        sellerCounts[sellerName] = (sellerCounts[sellerName] || 0) + 1;
      }

      // Avg Time
      if (r.returnStatus === "COMPLETED" && r.returnRequestedAt) {
        const endTime = new Date(r.updatedAt).getTime();
        const startTime = new Date(r.returnRequestedAt).getTime();
        totalTime += endTime - startTime;
        completedCount++;
      }
    });

    let topProduct: string | null = null;
    let maxP = 0;
    for (const [p, c] of Object.entries(productCounts)) {
      if (c > maxP) {
        maxP = c;
        topProduct = p;
      }
    }

    let topSeller: string | null = null;
    let maxS = 0;
    for (const [s, c] of Object.entries(sellerCounts)) {
      if (c > maxS) {
        maxS = c;
        topSeller = s;
      }
    }

    let avgTime: string | null = null;
    if (completedCount > 0) {
      const avgDays = totalTime / completedCount / (1000 * 60 * 60 * 24);
      avgTime = avgDays < 1 ? "< 1 day" : `${Math.round(avgDays)} days`;
    }

    return { topProduct, topSeller, avgTime };
  }, [allReturns]);

  // Derived Groups
  const actionRequired = allReturns.filter(
    (r) =>
      r.returnStatus === "REQUESTED" ||
      (r.returnStatus === "COMPLETED" &&
        r.returnInspectionStatus === "PENDING_INSPECTION"),
  );

  const logistics = allReturns.filter((r) =>
    ["APPROVED", "ASSIGNED", "PICKED_UP"].includes(r.returnStatus),
  );

  const completed = allReturns.filter((r) =>
    ["COMPLETED", "REJECTED"].includes(r.returnStatus),
  );

  const refundReady = allReturns.filter(
    (r) =>
      r.returnStatus === "COMPLETED" &&
      r.returnInspectionStatus &&
      r.returnInspectionStatus !== "PENDING_INSPECTION",
  );

  // Apply active tab
  let currentList = actionRequired;
  if (activeTab === "LOGISTICS") currentList = logistics;
  if (activeTab === "COMPLETED") currentList = completed;
  if (activeTab === "REFUND_READY") currentList = refundReady;

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
    if (reasonFilter && r.returnReason !== reasonFilter) return false;
    if (inspectionFilter && r.returnInspectionStatus !== inspectionFilter)
      return false;
    return true;
  });

  // Apply Sorting
  currentList.sort((a, b) => {
    const d1 = new Date(a.returnRequestedAt || a.createdAt).getTime();
    const d2 = new Date(b.returnRequestedAt || b.createdAt).getTime();
    if (sortOption === "Newest") return d2 - d1;
    if (sortOption === "Oldest") return d1 - d2;
    if (sortOption === "Recently Completed") {
      const c1 = new Date(a.updatedAt).getTime();
      const c2 = new Date(b.updatedAt).getTime();
      return c2 - c1;
    }
    return 0;
  });

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
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
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

  const formatReason = (reason?: string) => {
    if (!reason) return "Other";
    return reason
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const pendingSellerActionCount = allReturns.filter(
    (r) => r.returnStatus === "REQUESTED",
  ).length;
  const pendingInspectionCount = allReturns.filter(
    (r) =>
      r.returnStatus === "COMPLETED" &&
      r.returnInspectionStatus === "PENDING_INSPECTION",
  ).length;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Returns Operations Center
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Monitor the complete return lifecycle and manage operational queues.
        </p>
      </div>

      {/* Operations Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-50 border-zinc-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-zinc-700 flex items-center gap-2">
              <ArrowCounterClockwiseIcon className="h-4 w-4" /> Total Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {allReturns.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <WarningCircleIcon className="h-4 w-4" /> Pending Seller Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {pendingSellerActionCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <TruckIcon className="h-4 w-4" /> In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {logistics.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50/50 border-yellow-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <MagnifyingGlassIcon className="h-4 w-4" /> Pending Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {pendingInspectionCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <MoneyIcon className="h-4 w-4" /> Refund Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {refundReady.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Insights */}
      {analytics &&
        (analytics.avgTime || analytics.topProduct || analytics.topSeller) && (
          <div
            className={`grid grid-cols-2 md:grid-cols-${[analytics.avgTime, analytics.topProduct, analytics.topSeller].filter(Boolean).length} gap-4`}
          >
            {analytics.avgTime && (
              <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-md text-teal-600">
                  <ClockIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">
                    Avg Processing Time
                  </p>
                  <p className="text-sm font-bold text-zinc-900">
                    {analytics.avgTime}
                  </p>
                </div>
              </div>
            )}
            {analytics.topProduct && (
              <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-md text-rose-600">
                  <PackageIcon className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-zinc-500 font-medium">
                    Top Returned Product
                  </p>
                  <p
                    className="text-sm font-bold text-zinc-900 truncate"
                    title={analytics.topProduct}
                  >
                    {analytics.topProduct}
                  </p>
                </div>
              </div>
            )}
            {analytics.topSeller && (
              <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-md text-amber-600">
                  <StorefrontIcon className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-zinc-500 font-medium">
                    Seller With Most Returns
                  </p>
                  <p
                    className="text-sm font-bold text-zinc-900 truncate"
                    title={analytics.topSeller}
                  >
                    {analytics.topSeller}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mt-8">
        <div className="flex space-x-1 bg-zinc-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab("ACTION_REQUIRED")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "ACTION_REQUIRED"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Action Required ({actionRequired.length})
          </button>
          <button
            onClick={() => setActiveTab("LOGISTICS")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "LOGISTICS"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Logistics ({logistics.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "COMPLETED"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Return Completed ({completed.length})
          </button>
          <button
            onClick={() => setActiveTab("REFUND_READY")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === "REFUND_READY"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <CheckCircleIcon weight="fill" /> Refund Ready ({refundReady.length}
            )
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search orders, customers, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>Recently Completed</option>
            </select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <SpinnerIcon className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-center p-4">
              <CheckCircleIcon className="h-12 w-12 mb-4 text-emerald-500 opacity-80" />
              <p className="font-medium text-lg text-zinc-800">
                {activeTab === "ACTION_REQUIRED"
                  ? "All clear! No returns currently require action."
                  : activeTab === "LOGISTICS"
                    ? "No returns currently in transit."
                    : activeTab === "REFUND_READY"
                      ? "No returns are ready for refund yet."
                      : "No returns found."}
              </p>
              <p className="text-sm mt-1">
                Your queues are completely up to date.
              </p>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order # / Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller / Customer</TableHead>
                    <TableHead>Return Status</TableHead>
                    <TableHead>Inspection Status</TableHead>
                    {activeTab === "REFUND_READY" && (
                      <TableHead>Refund Status</TableHead>
                    )}
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentList.map((order) => (
                    <TableRow key={order.id} className="hover:bg-zinc-50">
                      <TableCell>
                        <span className="font-medium text-teal-600">
                          {order.orderNumber}
                        </span>
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(
                            order.returnRequestedAt || order.createdAt,
                          ).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-sm font-medium text-zinc-900 max-w-50 truncate"
                          title={order.items?.[0]?.product?.title}
                        >
                          {order.items?.[0]?.product?.title ||
                            "Unknown Product"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          Reason: {formatReason(order.returnReason)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-zinc-900">
                          {order.seller?.shopName || "Unknown Seller"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          By: {order.customer?.name || "Unknown Customer"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${getStatusBadgeClass(order.returnStatus)}`}
                        >
                          {order.returnStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.returnInspectionStatus ? (
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${getStatusBadgeClass(order.returnInspectionStatus)}`}
                          >
                            {order.returnInspectionStatus}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs">-</span>
                        )}
                      </TableCell>
                      {activeTab === "REFUND_READY" && (
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircleIcon weight="fill" /> Return Completed
                            </span>
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircleIcon weight="fill" /> Inspection
                              Completed
                            </span>
                            <span className="flex items-center gap-1 font-bold text-teal-700 mt-1 bg-teal-50 w-fit px-1.5 py-0.5 rounded border border-teal-200">
                              Refund Ready
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/returns/${order.id}`)}
                          className="flex items-center gap-1 ml-auto"
                        >
                          View Details <CaretRightIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile Card View */}
          {!loading && currentList.length > 0 && (
            <div className="md:hidden flex flex-col p-4 gap-4">
              {currentList.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 shadow-sm bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-teal-600">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(
                          order.returnRequestedAt || order.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${getStatusBadgeClass(order.returnStatus)}`}
                    >
                      {order.returnStatus}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1 truncate">
                    {order.items?.[0]?.product?.title || "Unknown Product"}
                  </div>
                  <div className="text-xs text-zinc-600 mb-3 flex flex-col gap-1">
                    <span>Reason: {formatReason(order.returnReason)}</span>
                    <div className="flex justify-between w-full">
                      <span>Seller: {order.seller?.shopName || "Unknown"}</span>
                      <span>Cust: {order.customer?.name || "Unknown"}</span>
                    </div>
                  </div>
                  {order.returnInspectionStatus && (
                    <div className="mb-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${getStatusBadgeClass(order.returnInspectionStatus)}`}
                      >
                        Insp: {order.returnInspectionStatus}
                      </span>
                    </div>
                  )}
                  {activeTab === "REFUND_READY" && (
                    <div className="bg-emerald-50 text-emerald-800 text-xs p-2 rounded mb-3 font-semibold flex items-center gap-1 border border-emerald-100">
                      <CheckCircleIcon weight="fill" /> Ready for Refund
                    </div>
                  )}
                  <Button
                    onClick={() => navigate(`/admin/returns/${order.id}`)}
                    variant="outline"
                    className="w-full text-sm flex items-center justify-center gap-1"
                  >
                    View Details <CaretRightIcon />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
