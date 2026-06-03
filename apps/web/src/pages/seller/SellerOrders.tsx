import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  Package,
  Search,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

export const SellerOrders: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.orders.sellerMe);
      if (res.data.success) {
        setOrders(res.data.data);
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
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "placed":
        return <Clock className="h-3.5 w-3.5" />;
      case "confirmed":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "ready_for_pickup":
        return <Package className="h-3.5 w-3.5" />;
      case "out_for_delivery":
        return <Truck className="h-3.5 w-3.5" />;
      case "delivered":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "cancelled":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <Clock className="h-3.5 w-3.5" />;
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Order Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and process customer orders.
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Order ID or Customer Name..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="w-full sm:w-auto font-medium hover:cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            Refresh Orders
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
            <p className="font-medium">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50/30">
            <Package className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">No orders found</p>
            <p className="text-sm text-slate-400">
              Wait for customers to place orders or adjust your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 font-mono text-xs">
                          {order.id}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-1 font-medium">
                          <Calendar className="h-3 w-3" />
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
                          <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {order.customer?.name || "Guest"}
                            </div>
                            <div className="text-xs text-slate-500">
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
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Package className="h-4 w-4 text-slate-400" />
                          {totalItems} item{totalItems !== 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-extrabold text-slate-900">
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
                          className="text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
