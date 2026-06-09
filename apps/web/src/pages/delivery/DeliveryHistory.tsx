import { Card, CardHeader, CardContent } from "@bezon/ui";
import React, { useEffect, useState } from "react";
import {
  SpinnerIcon,
  CalendarIcon,
  PackageIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

export const DeliveryHistory: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.delivery.history);
      if (res.data.success) {
        setTrips(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load past trips.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatItemsString = (order: any) => {
    if (!order || !order.items) return "";
    return order.items
      .map((i: any) => `${i.qty}x ${i.productTitle}`)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-75 text-zinc-500">
        <SpinnerIcon className="h-8 w-8 animate-spin mb-4 text-teal-600" />
        <p className="font-bold">Loading delivery logs...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto pb-10">
      <div>
        <h2 className="text-lg font-extrabold text-zinc-800 tracking-tight">
          Trip Logs
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Review your past completed fulfillments and logs.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
          <CalendarIcon className="h-10 w-10 text-zinc-300 mx-auto" />
          <p className="text-zinc-400 text-xs mt-2 font-semibold">
            No past deliveries logged yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trips.map((trip) => {
            const isSuccess = trip.status === "delivered";
            return (
              <Card
                key={trip.id}
                className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <CardHeader className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-zinc-900 text-sm">
                      {trip.order?.orderNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                        isSuccess
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {isSuccess ? (
                        <>
                          <CheckCircleIcon className="h-3 w-3" /> Delivered
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-3 w-3" /> Failed
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">
                    {formatDate(trip.deliveredAt || trip.updatedAt)}
                  </span>
                </CardHeader>
                <CardContent className="p-4 space-y-3.5">
                  {/* Items */}
                  <div className="flex items-start gap-2">
                    <PackageIcon className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-zinc-600 font-medium">
                      {formatItemsString(trip.order)}
                    </span>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2 border-t border-zinc-50 pt-2.5">
                    <div className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                      <div className="text-[11px] text-zinc-500 leading-snug">
                        <strong className="text-zinc-700 font-bold block">
                          Pickup Merchant:
                        </strong>
                        {trip.order?.seller?.shopName} —{" "}
                        {trip.order?.seller?.city}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div className="text-[11px] text-zinc-500 leading-snug">
                        <strong className="text-zinc-700 font-bold block">
                          Drop Address:
                        </strong>
                        {trip.order?.customer?.name} —{" "}
                        {trip.order?.addressSnapshot?.line1},{" "}
                        {trip.order?.addressSnapshot?.city}
                      </div>
                    </div>
                  </div>

                  {/* Proof of delivery photo preview if available */}
                  {trip.proofImageUrl && (
                    <div className="border-t border-zinc-100 pt-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Proof of Handoff
                      </span>
                      <a
                        href={trip.proofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative group rounded-xl overflow-hidden border border-zinc-200 h-24 w-full block shadow-sm"
                      >
                        <img
                          src={trip.proofImageUrl}
                          alt="Delivery Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <EyeIcon className="h-4 w-4" /> View Image
                        </div>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
