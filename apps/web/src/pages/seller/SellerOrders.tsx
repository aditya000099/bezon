import { Card, Input, Button } from "@bezon/ui";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SpinnerIcon,
  PackageIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CaretRightIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  WarningIcon,
  UserIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

export const SellerOrders: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const fetchOrders = async (currentPage: number = page) => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.orders.sellerMe, {
        params: { page: currentPage, limit },
      });
      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "confirmed":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "ready_for_pickup":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "placed":
        return <ClockIcon className="h-3.5 w-3.5" />;
      case "confirmed":
        return <CheckCircleIcon className="h-3.5 w-3.5" />;
      case "ready_for_pickup":
        return <PackageIcon className="h-3.5 w-3.5" />;
      case "out_for_delivery":
        return <TruckIcon className="h-3.5 w-3.5" />;
      case "delivered":
        return <CheckCircleIcon className="h-3.5 w-3.5" />;
      case "cancelled":
        return <WarningIcon className="h-3.5 w-3.5" />;
      default:
        return <ClockIcon className="h-3.5 w-3.5" />;
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
            Order Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            View and process customer orders.
          </p>
        </div>
      </div>

      <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Order ID or Customer Name..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(page)}
            disabled={loading}
            className="w-full sm:w-auto font-medium hover:cursor-pointer"
          >
            {loading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PackageIcon className="h-4 w-4 mr-2" />
            )}
            Refresh Orders
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
            <SpinnerIcon className="h-8 w-8 animate-spin mb-4 text-teal-500" />
            <p className="font-medium">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-zinc-50/30">
            <PackageIcon className="h-12 w-12 text-zinc-300 mb-3" />
            <p className="font-bold text-zinc-700">No orders found</p>
            <p className="text-sm text-zinc-400">
              Wait for customers to place orders or adjust your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => {
                  const totalItems = order.items.reduce(
                    (acc: number, item: any) => acc + item.qty,
                    0,
                  );
                  const totalRevenue = order.items.reduce(
                    (acc: number, item: any) =>
                      acc + item.qty * Number(item.unitPrice),
                    0,
                  );

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/seller/orders/${order.id}`)}
                      className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-800 font-mono text-xs">
                          {order.id}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500 text-[11px] mt-1 font-medium">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-800">
                              {order.customer?.name || "Guest"}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {order.customer?.phone || order.customer?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-600 font-medium">
                          <PackageIcon className="h-4 w-4 text-zinc-400" />
                          {totalItems} item{totalItems !== 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-extrabold text-zinc-900">
                          ₹{totalRevenue.toLocaleString()}
                        </div>
                        {order.paymentStatus === "paid" ? (
                          <span className="text-[10px] font-bold text-emerald-600">
                            PAID
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-zinc-400 group-hover:text-teal-600 group-hover:bg-teal-50"
                        >
                          <CaretRightIcon className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t border-zinc-200">
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
          </div>
        )}
      </Card>
    </div>
  );
};
