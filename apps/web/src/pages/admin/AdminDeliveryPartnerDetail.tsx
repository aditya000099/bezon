import { Card, CardContent, CardHeader, CardTitle, Button } from '@bezon/ui';
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
;
;
import { SpinnerIcon, ArrowLeftIcon, ChartBarIcon, MapPinIcon, TruckIcon, ArrowUUpLeftIcon } from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

export const AdminDeliveryPartnerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.adminDeliveries.partnerDetail(id as string));
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      toast.error("Failed to load partner details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SpinnerIcon className="animate-spin text-teal-600 h-8 w-8" />
      </div>
    );
  }

  if (!data) return <div className="text-zinc-500">Partner not found.</div>;

  const { partner, activeAssignments, history } = data;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link to="/admin" className="hover:text-zinc-900">Dashboard</Link>
          <span>→</span>
          <Link to="/admin/deliveries" className="hover:text-zinc-900">Delivery Operations</Link>
          <span>→</span>
          <span className="font-medium text-zinc-900">Partner Details</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Link to="/admin/deliveries">
            <Button variant="ghost" size="icon"><ArrowLeftIcon className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">{partner.user.name}</h1>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            partner.partnerStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' :
            partner.partnerStatus === 'Busy' ? 'bg-amber-100 text-amber-800' :
            partner.partnerStatus === 'Suspended' ? 'bg-red-100 text-red-800' :
            'bg-zinc-100 text-zinc-800'
          }`}>
            {partner.partnerStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" /> Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Success Rate</span>
              <span className="font-bold text-emerald-600">{partner.successRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Total Deliveries</span>
              <span className="font-bold">{partner.totalDelivered}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Failed Deliveries</span>
              <span className="font-bold text-red-600">{partner.totalFailed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Completed Returns</span>
              <span className="font-bold">{history.returnsCompleted.length}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Success rate is calculated as: Completed Deliveries ÷ Total Assigned Deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" /> Profile & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">City</span>
              <span className="font-medium">{partner.city}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Vehicle</span>
              <span className="font-medium capitalize">{partner.vehicleType} ({partner.vehicleNumber})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Phone</span>
              <span className="font-medium">{partner.user.phone || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Assignments ({activeAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAssignments.length === 0 ? (
              <p className="text-zinc-500 text-sm">No active tasks.</p>
            ) : (
              activeAssignments.map((a: any, i: number) => (
                <div key={i} className="border p-3 rounded-lg flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {a.type === 'delivery' ? <TruckIcon className="text-blue-500" /> : <ArrowUUpLeftIcon className="text-amber-500" />}
                    <div>
                      <p className="font-semibold">{a.type === 'delivery' ? 'Delivery' : 'Return Pickup'}</p>
                      <p className="text-xs text-zinc-500">Order: {a.type === 'delivery' ? a.order?.orderNumber : a.orderNumber}</p>
                    </div>
                  </div>
                  <Link to={`/admin/deliveries/${a.type === 'delivery' ? a.order?.id : a.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
