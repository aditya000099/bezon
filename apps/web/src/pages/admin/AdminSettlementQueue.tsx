import { Card, CardContent, Button, Input } from "@bezon/ui";
import React, { useState, useEffect } from "react";
import {
  DatabaseIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  SpinnerIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { useToast } from "../../context/ToastContext";

export const AdminSettlementQueue: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { toast } = useToast();

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/admin-settlements/queue", {
        params: { page, limit: 15, search },
      });
      if (res.data.success) {
        setQueue(res.data.data?.queue || []);
        setTotalPages(res.data.data?.totalPages || 1);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to fetch settlement queue",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <DatabaseIcon className="h-6 w-6 text-indigo-600" /> Settlement
            Queue
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            View orders awaiting settlement and expected payout timelines
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <Input
            placeholder="Search order number or seller..."
            className="pl-9 bg-white"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      <Card className="border-zinc-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : queue.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              No orders found in the settlement queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900 text-zinc-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Order</th>
                    <th className="px-6 py-3 font-medium">Seller</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Gross Amount
                    </th>
                    <th className="px-6 py-3 font-medium text-right text-rose-300">
                      Commission
                    </th>
                    <th className="px-6 py-3 font-medium text-right text-emerald-300">
                      Settlement
                    </th>
                    <th className="px-6 py-3 font-medium">Expected Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {queue.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-indigo-600">
                          #{item.orderNumber}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-800">
                        {item.seller.shopName}
                      </td>
                      <td className="px-6 py-4">
                        {item.settlementStatus === "HOLDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            <ClockIcon weight="bold" /> Holding
                          </span>
                        ) : item.settlementStatus === "SETTLED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            <CheckCircleIcon weight="bold" /> Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800">
                            {item.settlementStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-zinc-600">
                        ₹{Number(item.total).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-rose-600">
                        -₹{Number(item.commissionAmount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 text-base">
                        ₹{Number(item.settlementAmount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-800">
                        {item.expectedSettlementDate
                          ? new Date(
                              item.expectedSettlementDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-white">
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <CaretLeftIcon className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <CaretRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
