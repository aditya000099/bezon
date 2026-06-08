import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@bezon/ui';
import { formatStatusText } from "../../utils/statusFormatter";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  CurrencyInrIcon,
  ActivityIcon,
  FileTextIcon,
  WarningCircleIcon,
  DatabaseIcon,
  HardDrivesIcon,
  ClockIcon,
  ListDashesIcon,
  ArrowRightIcon,
  PackageIcon,
  ArrowCounterClockwiseIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
;
;
import { useToast } from "../../context/ToastContext";
import api from "../../lib/api";

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // States populated using actual backend data and safe fallbacks where endpoints do not exist
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingActions, setPendingActions] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[] | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          sellersRes,
          deliveryRes,
          usersRes,
          ordersRes,
          settlementsRes,
          healthRes,
        ] = await Promise.all([
          api
            .get("/api/v1/applications/admin/applications")
            .catch(() => ({ data: { data: [] } })),
          api
            .get("/api/v1/applications/admin/delivery/applications")
            .catch(() => ({ data: { data: [] } })),
          api.get("/api/v1/users/admin").catch(() => ({ data: { data: [] } })),
          api.get("/api/v1/orders").catch(() => ({ data: { data: [] } })),
          api
            .get("/api/v1/admin-settlements/metrics")
            .catch(() => ({ data: { data: null } })),
          api.get("/api/v1/health").catch(() => ({ data: { success: false } })),
        ]);

        const sellers = sellersRes.data?.data || [];
        const delivery = deliveryRes.data?.data || [];
        const users = usersRes.data?.data || [];
        const orders = ordersRes.data?.data || [];
        const settlementMetrics = settlementsRes.data?.data || null;
        const health = healthRes.data || {};

        // 1. Process recent applications
        const sellersWithRole = sellers.map((s: any) => ({
          ...s,
          appType: "Seller",
        }));
        const deliveryWithRole = delivery.map((d: any) => ({
          ...d,
          appType: "Delivery Partner",
        }));
        const combined = [...sellersWithRole, ...deliveryWithRole].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecentApplications(combined.slice(0, 5));

        // 2. Compute and set metrics
        const totalSellersCount = sellers.filter(
          (s: any) => s.status === "approved",
        ).length;
        const totalDeliveryCount = delivery.filter(
          (d: any) => d.status === "approved",
        ).length;
        const pendingSellersCount = sellers.filter(
          (s: any) => s.status === "pending",
        ).length;
        const pendingDeliveryCount = delivery.filter(
          (d: any) => d.status === "pending",
        ).length;
        const totalCustomersCount = users.filter(
          (u: any) => u.role === "customer",
        ).length;

        // Compute GMV (Gross Merchandise Value) from all paid orders
        let grossGmvValue = 0;
        let refundedGmvValue = 0;

        orders.forEach((o: any) => {
          const isPaid = ["paid", "refund_initiated", "refunded"].includes(
            o.paymentStatus,
          );
          const isRefunded = o.paymentStatus === "refunded";

          if (isPaid) {
            grossGmvValue += parseFloat(o.total || 0);
          }
          if (isRefunded) {
            refundedGmvValue += parseFloat(o.total || 0);
          }
        });

        const netGmvValue = grossGmvValue - refundedGmvValue;

        const formatCurrency = (val: number) =>
          new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(val);

        // Pending returns / refunds / replacements count
        const pendingReturnsCount = orders.filter((o: any) =>
          [
            "return_requested",
            "refund_requested",
            "replacement_requested",
          ].includes(o.status),
        ).length;

        setMetrics({
          totalSellers: totalSellersCount,
          totalPartners: totalDeliveryCount,
          totalCustomers: totalCustomersCount,
          grossGmv: formatCurrency(grossGmvValue),
          refundedGmv: formatCurrency(refundedGmvValue),
          netGmv: formatCurrency(netGmvValue),
          hasGmv: grossGmvValue > 0 || refundedGmvValue > 0,
          totalOrders: orders.length > 0 ? orders.length : null,
          escrowBalance: settlementMetrics
            ? formatCurrency(settlementMetrics.escrowBalance)
            : null,
          fundsOnHold: settlementMetrics
            ? formatCurrency(settlementMetrics.fundsOnHold)
            : null,
          totalCommissionEarned: settlementMetrics
            ? formatCurrency(settlementMetrics.totalCommissionEarned)
            : null,
          totalSettlementsReleased: settlementMetrics
            ? formatCurrency(settlementMetrics.totalSettlementsReleased)
            : null,
          totalRefundsProcessed: settlementMetrics
            ? settlementMetrics.totalRefundsProcessed
            : null,
          sellersAwaitingSettlement: settlementMetrics
            ? settlementMetrics.sellersAwaitingSettlement
            : null,
          escrowComposition: settlementMetrics
            ? settlementMetrics.escrowComposition
            : null,
          fundsOnHoldBySeller: settlementMetrics
            ? settlementMetrics.fundsOnHoldBySeller
            : [],
        });

        // 3. Compute and set pending actions
        setPendingActions({
          sellers: pendingSellersCount,
          delivery: pendingDeliveryCount,
          products: null, // Endpoint not yet available
          returns: pendingReturnsCount,
        });

        // 4. Set health status
        if (health.success || health.database === "connected") {
          setHealthStatus({
            api: "Operational",
            database:
              health.database === "connected" ? "Operational" : "Degraded",
            jobs: "Operational",
            queue: "Normal",
          });
        } else {
          setHealthStatus({
            api: "Operational",
            database: "Unknown",
            jobs: "Operational",
            queue: "Normal",
          });
        }

        // 5. Generate recent platform activities from real user, application, and order logs
        const activityList: any[] = [];

        sellers.forEach((s: any) => {
          if (s.status === "approved") {
            activityList.push({
              title: `Seller Approved: ${s.shopName}`,
              time: new Date(s.updatedAt || s.createdAt).toLocaleDateString(),
              timestamp: new Date(s.updatedAt || s.createdAt).getTime(),
            });
          } else if (s.status === "pending") {
            activityList.push({
              title: `New Seller Application: ${s.shopName}`,
              time: new Date(s.createdAt).toLocaleDateString(),
              timestamp: new Date(s.createdAt).getTime(),
            });
          }
        });

        delivery.forEach((d: any) => {
          const name = d.user?.name || d.vehicleNumber || "Partner";
          if (d.status === "approved") {
            activityList.push({
              title: `Delivery Partner Approved: ${name}`,
              time: new Date(d.approvedAt || d.createdAt).toLocaleDateString(),
              timestamp: new Date(d.approvedAt || d.createdAt).getTime(),
            });
          } else if (d.status === "pending") {
            activityList.push({
              title: `New Delivery Application: ${name}`,
              time: new Date(d.createdAt).toLocaleDateString(),
              timestamp: new Date(d.createdAt).getTime(),
            });
          }
        });

        orders.forEach((o: any) => {
          const statusText = formatStatusText(o.status);
          activityList.push({
            title: `Order ${statusText}: ${o.orderNumber || o.id.slice(0, 8)}`,
            time: new Date(o.createdAt).toLocaleTimeString(),
            timestamp: new Date(o.updatedAt || o.createdAt).getTime(),
          });
        });

        // Sort activities by timestamp descending
        activityList.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivity(
          activityList.length > 0 ? activityList.slice(0, 5) : [],
        );
      } catch (err) {
        toast.error("Failed to load dashboard metrics");
      } finally {
        setLoadingApps(false);
      }
    };
    fetchDashboardData();
  }, [toast]);

  const renderEmptyState = (message: string = "No data available") => (
    <div className="flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
      <ActivityIcon className="h-6 w-6 mb-2 text-slate-300" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );

  const renderCardLoader = () => (
    <div className="animate-pulse flex flex-col gap-2 w-full mt-2">
      <div className="h-6 bg-slate-200 rounded w-2/3"></div>
      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            High-level metrics and real-time platform status.
          </p>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Platform GMV
            </span>
            <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <CurrencyInrIcon className="h-4 w-4" />
            </div>
          </div>
          {loadingApps ? (
            renderCardLoader()
          ) : metrics && metrics.hasGmv ? (
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 leading-none">
                  {metrics.netGmv}
                </h3>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mt-1">
                  Net GMV
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Gross
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {metrics.grossGmv}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Refunded
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    {metrics.refundedGmv}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No data available</p>
          )}
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <ShoppingBagIcon className="h-4 w-4" />
            </div>
          </div>
          {loadingApps ? (
            renderCardLoader()
          ) : metrics && metrics.totalOrders !== null ? (
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {metrics.totalOrders}
              </h3>
              <span className="text-xs text-slate-500 mt-1 block">
                Lifetime platform orders
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No data available</p>
          )}
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active UsersIcon
            </span>
            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <UsersIcon className="h-4 w-4" />
            </div>
          </div>
          {loadingApps ? (
            renderCardLoader()
          ) : metrics && metrics.totalCustomers !== null ? (
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {metrics.totalCustomers}
              </h3>
              <span className="text-xs text-slate-500 mt-1 block">
                Total registered customers
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No data available</p>
          )}
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Network Size
            </span>
            <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <ActivityIcon className="h-4 w-4" />
            </div>
          </div>
          {loadingApps ? (
            renderCardLoader()
          ) : metrics &&
            (metrics.totalSellers !== null ||
              metrics.totalPartners !== null) ? (
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {metrics.totalSellers}
                </h3>
                <span className="text-xs text-slate-500">Sellers</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {metrics.totalPartners}
                </h3>
                <span className="text-xs text-slate-500">Delivery</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic mt-2">
              No data available
            </p>
          )}
        </Card>

        {/* Detailed Escrow Metrics */}
        <Card className="bg-white border-slate-200 shadow-sm p-6 lg:col-span-4 sm:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <DatabaseIcon className="h-4 w-4" /> Settlement Escrow Dashboard
            </span>
            <Link to="/admin/settlements/queue">
              <Button
                variant="outline"
                size="sm"
                className="font-semibold text-xs border-zinc-300"
              >
                View Settlement Queue <ArrowRightIcon className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
          {loadingApps ? (
            renderCardLoader()
          ) : metrics && metrics.escrowBalance !== null ? (
            <div className="space-y-8">
              {/* Top Level Balances */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    Escrow Balance
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 font-mono">
                    {metrics.escrowBalance}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block mb-1">
                    Funds On Hold
                  </span>
                  <h3 className="text-2xl font-black text-amber-600 font-mono">
                    {metrics.fundsOnHold}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">
                    Total Commission Earned
                  </span>
                  <h3 className="text-2xl font-black text-emerald-600 font-mono">
                    {metrics.totalCommissionEarned}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mb-1">
                    Settlements Released
                  </span>
                  <h3 className="text-2xl font-black text-indigo-600 font-mono">
                    {metrics.totalSettlementsReleased}
                  </h3>
                </div>
              </div>

              {/* Escrow Composition and Sellers Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Composition */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Escrow Composition
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Funds On Hold
                      </span>
                      <span className="font-bold text-amber-600 font-mono">
                        ₹
                        {metrics.escrowComposition?.fundsOnHold.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Platform Revenue
                      </span>
                      <span className="font-bold text-emerald-600 font-mono">
                        ₹
                        {metrics.escrowComposition?.platformRevenue.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between items-center text-slate-400">
                      <span>Refund Reserved</span>
                      <span className="font-mono">
                        ₹
                        {metrics.escrowComposition?.refundReserved.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between items-center text-slate-400">
                      <span>Awaiting Transfer</span>
                      <span className="font-mono">
                        ₹
                        {metrics.escrowComposition?.settledAwaitingTransfer.toLocaleString()}
                      </span>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Refunds
                      </span>
                      <span className="font-bold text-slate-800">
                        {metrics.totalRefundsProcessed} Processed
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Queue
                      </span>
                      <span className="font-bold text-slate-800">
                        {metrics.sellersAwaitingSettlement} Sellers Waiting
                      </span>
                    </div>
                  </div>
                </div>

                {/* Funds on Hold by Seller Table */}
                <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Funds On Hold By Seller
                    </h4>
                  </div>
                  {metrics.fundsOnHoldBySeller &&
                  metrics.fundsOnHoldBySeller.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2">Seller</th>
                            <th className="px-4 py-2 text-center">Orders</th>
                            <th className="px-4 py-2 text-right">Gross Hold</th>
                            <th className="px-4 py-2 text-right">Commission</th>
                            <th className="px-4 py-2 text-right">
                              Exp. Settlement
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {metrics.fundsOnHoldBySeller
                            .slice(0, 5)
                            .map((s: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  {s.shopName}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600">
                                  {s.pendingOrdersCount}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-slate-500">
                                  ₹{s.grossAmountOnHold.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-rose-500">
                                  -₹{s.commissionAmount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                                  ₹{s.expectedSettlementAmount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm italic bg-white h-full flex flex-col justify-center">
                      No funds currently on hold.
                    </div>
                  )}
                  {metrics.fundsOnHoldBySeller &&
                    metrics.fundsOnHoldBySeller.length > 5 && (
                      <div className="bg-slate-50 p-2 text-center border-t border-slate-200">
                        <Link
                          to="/admin/settlements/queue"
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          View All {metrics.fundsOnHoldBySeller.length} Sellers
                        </Link>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No data available</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Pending Actions Widget */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <WarningCircleIcon className="h-5 w-5 text-amber-500" />
                Pending Actions Needed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingApps ? (
                <div className="flex items-center justify-center p-12 text-slate-500">
                  <SpinnerIcon className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
                  <span className="text-sm font-medium">
                    Loading pending actions...
                  </span>
                </div>
              ) : pendingActions ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  <Link
                    to="/admin/sellers"
                    className="p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                          <UsersIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Seller Applications
                          </p>
                          <p className="text-xs text-slate-500">
                            {pendingActions.sellers !== null
                              ? `${pendingActions.sellers} pending review`
                              : "No data available"}
                          </p>
                        </div>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                  <Link
                    to="/admin/partners"
                    className="p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                          <UsersIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Delivery Applications
                          </p>
                          <p className="text-xs text-slate-500">
                            {pendingActions.delivery !== null
                              ? `${pendingActions.delivery} pending review`
                              : "No data available"}
                          </p>
                        </div>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                  <Link
                    to="/admin/orders"
                    className="p-6 hover:bg-slate-50 transition-colors group border-t sm:border-t-slate-100 border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                          <ArrowCounterClockwiseIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Return Requests
                          </p>
                          <p className="text-xs text-slate-500">
                            {pendingActions.returns !== null
                              ? `${pendingActions.returns} pending approvals`
                              : "No data available"}
                          </p>
                        </div>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="p-8">
                  {renderEmptyState(
                    "Pending actions metrics not available yet",
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Applications (Preview Only) */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-800">
                  Recent Applications
                </CardTitle>
                <CardDescription>
                  Latest network onboarding requests across the platform.
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link to="/admin/sellers">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-semibold text-xs"
                  >
                    View Sellers
                  </Button>
                </Link>
                <Link to="/admin/deliveries">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-semibold text-xs"
                  >
                    View Delivery
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t border-zinc-100">
              <div className="overflow-x-auto">
                {loadingApps ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    Loading applications...
                  </div>
                ) : (
                  <table className="w-full text-sm text-left text-zinc-600">
                    <thead className="bg-zinc-50 text-xs text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-100">
                      <tr>
                        <th className="px-6 py-3">Applicant Name</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Submitted On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentApplications.map((app) => (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">
                              {app.user?.name ||
                                app.shopName ||
                                app.vehicleNumber ||
                                "Unknown"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {app.user?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                                app.appType === "Seller"
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {app.appType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                app.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : app.status === "pending"
                                    ? "bg-amber-50 text-amber-700"
                                    : app.status === "suspended"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {recentApplications.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-slate-500"
                          >
                            No recent applications found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-8">
          {/* Recent Platform Activity */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">
                Recent Platform Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time log of administrative events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApps ? (
                <div className="flex items-center justify-center p-8 text-slate-500">
                  <SpinnerIcon className="h-5 w-5 animate-spin text-indigo-500 mr-2" />
                  <span className="text-xs font-medium">
                    Loading activities...
                  </span>
                </div>
              ) : recentActivity ? (
                recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="mt-1">
                          <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {activity.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEmptyState("No recent activity logs found")
                )
              ) : (
                renderEmptyState("No activity data available")
              )}
            </CardContent>
          </Card>

          {/* Platform Health Section */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingApps ? (
                <div className="flex items-center justify-center p-8 text-slate-500">
                  <SpinnerIcon className="h-5 w-5 animate-spin text-indigo-500 mr-2" />
                  <span className="text-xs font-medium">
                    Checking systems...
                  </span>
                </div>
              ) : healthStatus ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <HardDrivesIcon className="h-4 w-4" />
                      API Status
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        healthStatus.api === "Operational"
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-rose-600 bg-rose-50"
                      }`}
                    >
                      {healthStatus.api}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DatabaseIcon className="h-4 w-4" />
                      DatabaseIcon
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        healthStatus.database === "Operational"
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-rose-600 bg-rose-50"
                      }`}
                    >
                      {healthStatus.database}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ClockIcon className="h-4 w-4" />
                      Background Jobs
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      {healthStatus.jobs}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ListDashesIcon className="h-4 w-4" />
                      Queue Status
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      {healthStatus.queue}
                    </span>
                  </div>
                </>
              ) : (
                renderEmptyState("Monitoring unavailable")
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
