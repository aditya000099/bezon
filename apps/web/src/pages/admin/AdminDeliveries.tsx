import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@bezon/ui';
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
;
;
;
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";
import {
  SpinnerIcon,
  PackageIcon,
  TruckIcon,
  ArrowUUpLeftIcon,
  UsersIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

export const AdminDeliveries: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "deliveries" | "returns" | "partners" | "exceptions"
  >("overview");
  const [loading, setLoading] = useState(true);

  // Data State
  const [dashboard, setDashboard] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any>({
    deliveryExceptions: [],
    returnPickupsExceptions: [],
  });
  const [cityAnalytics, setCityAnalytics] = useState<any[]>([]);

  const { toast } = useToast();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [dashRes, delRes, retRes, partRes, excRes, cityRes] =
        await Promise.all([
          api.get(API_ENDPOINTS.adminDeliveries.dashboard),
          api.get(API_ENDPOINTS.adminDeliveries.deliveries),
          api.get(API_ENDPOINTS.adminDeliveries.returns),
          api.get(API_ENDPOINTS.adminDeliveries.partners),
          api.get(API_ENDPOINTS.adminDeliveries.exceptions),
          api.get(API_ENDPOINTS.adminDeliveries.cityAnalytics),
        ]);
      setDashboard(dashRes.data.data);
      setDeliveries(delRes.data.data);
      setReturns(retRes.data.data);
      setPartners(partRes.data.data);
      setExceptions(excRes.data.data);
      setCityAnalytics(cityRes.data.data);
    } catch (err: any) {
      toast.error("Failed to load delivery operations data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Delivery Operations Center
        </h1>
        <p className="text-muted-foreground">
          Monitor deliveries, returns, partners, and analytics.
        </p>
      </div>

      <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: <PackageIcon /> },
          { id: "deliveries", label: "Deliveries", icon: <TruckIcon /> },
          { id: "returns", label: "Return Pickups", icon: <ArrowUUpLeftIcon /> },
          { id: "partners", label: "Partners", icon: <UsersIcon /> },
          { id: "exceptions", label: "Exceptions", icon: <WarningCircleIcon /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <SpinnerIcon className="animate-spin text-teal-600 h-8 w-8" />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4 flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-amber-800">
                      Pending Pickup
                    </p>
                    <p className="text-3xl font-bold text-amber-900">
                      {dashboard?.deliveriesPendingPickup || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-200">
                  <CardContent className="p-4 flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-rose-800">
                      Stuck {">"} 24h
                    </p>
                    <p className="text-3xl font-bold text-rose-900">
                      {dashboard?.deliveriesStuck || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-blue-800">
                      Return Pending Assignment
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {dashboard?.returnPickupsPending || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4 flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-emerald-800">
                      Active Return Pickups
                    </p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {dashboard?.activeReturnPickups || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>City Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>City</TableHead>
                          <TableHead className="text-right">
                            Active Deliveries
                          </TableHead>
                          <TableHead className="text-right">
                            Available Partners
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cityAnalytics.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {c.city || "Unknown"}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.deliveries}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.partners}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Partner Leaderboard (Top 5)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partner Name</TableHead>
                          <TableHead className="text-right">
                            Completed
                          </TableHead>
                          <TableHead className="text-right">
                            Success Rate
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...partners]
                          .sort((a, b) => b.totalDelivered - a.totalDelivered)
                          .slice(0, 5)
                          .map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>
                                <Link
                                  to={`/admin/delivery-partners/${p.id}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {p.user.name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-right">
                                {p.totalDelivered}
                              </TableCell>
                              <TableCell className="text-right">
                                {p.successRate.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* DELIVERIES TAB */}
          {activeTab === "deliveries" && (
            <Card>
              <CardHeader>
                <CardTitle>Deliveries Lifecycle</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          {d.orderNumber}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-zinc-100 text-xs rounded font-semibold uppercase">
                            {d.delivery?.status || d.status}
                          </span>
                        </TableCell>
                        <TableCell>{d.seller?.city || "N/A"}</TableCell>
                        <TableCell>
                          {d.delivery?.partner?.user?.name || "Unassigned"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/admin/deliveries/${d.id}`}>
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* RETURNS TAB */}
          {activeTab === "returns" && (
            <Card>
              <CardHeader>
                <CardTitle>Return Pickups Lifecycle</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Return Status</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.orderNumber}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded font-semibold uppercase">
                            {r.returnStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(r.addressSnapshot as any)?.city || "N/A"}
                        </TableCell>
                        <TableCell>
                          {r.returnPartner?.user?.name || "Unassigned"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/admin/deliveries/${r.id}`}>
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* PARTNERS TAB */}
          {activeTab === "partners" && (
            <Card>
              <CardHeader>
                <CardTitle>Partner Directory & Performance</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Active Tasks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.user.name}
                        </TableCell>
                        <TableCell>{p.city}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              p.partnerStatus === "Available"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.partnerStatus === "Busy"
                                  ? "bg-amber-100 text-amber-800"
                                  : p.partnerStatus === "Suspended"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-zinc-100 text-zinc-800"
                            }`}
                          >
                            {p.partnerStatus}
                          </span>
                        </TableCell>
                        <TableCell>{p.successRate.toFixed(1)}%</TableCell>
                        <TableCell>{p.activeTasks}</TableCell>
                        <TableCell className="text-right">
                          <Link to={`/admin/delivery-partners/${p.id}`}>
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* EXCEPTIONS TAB */}
          {activeTab === "exceptions" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">
                    Delivery Exceptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Failure Reason</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exceptions.deliveryExceptions.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">
                            {d.order.orderNumber}
                          </TableCell>
                          <TableCell>
                            {d.partner?.user?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {d.failureReason}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/deliveries/${d.orderId}`}>
                              <Button size="sm" variant="outline">
                                Investigate
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {exceptions.deliveryExceptions.length === 0 && (
                    <div className="p-4 text-center text-zinc-500">
                      No delivery exceptions recorded.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-600">
                    Return Pickup Exceptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exceptions.returnPickupsExceptions.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.orderNumber}
                          </TableCell>
                          <TableCell>
                            {r.returnPartner?.user?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-amber-600 font-medium">
                            {r.returnStatus}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/deliveries/${r.id}`}>
                              <Button size="sm" variant="outline">
                                Investigate
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {exceptions.returnPickupsExceptions.length === 0 && (
                    <div className="p-4 text-center text-zinc-500">
                      No return exceptions recorded.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};
