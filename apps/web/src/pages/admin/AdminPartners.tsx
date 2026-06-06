import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@phosphor-icons/react";
import api from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const AdminPartners: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  // Application State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [appActiveTab, setAppActiveTab] = useState<"pending" | "approved" | "suspended" | "rejected">("pending");

  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const appRes = await api.get("/api/v1/applications/admin/delivery/applications");
      setApplications(appRes.data.data);
    } catch (err: any) {
      toast.error("Failed to load delivery applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Applications functions
  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      const response = await api.post(`/api/v1/applications/admin/delivery/${selectedApp.id}/approve`);
      if (response.data.success) {
        toast.success("Delivery partner approved");
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve partner");
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) return toast.error("Rejection reason required");
    try {
      const response = await api.post(`/api/v1/applications/admin/delivery/${selectedApp.id}/reject`, { reason: rejectReason });
      if (response.data.success) {
        toast.success("Delivery partner application rejected");
        setSelectedApp(null);
        setShowRejectInput(false);
        setRejectReason("");
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject partner");
    }
  };

  const handleSuspend = async () => {
    if (!selectedApp) return;
    try {
      const response = await api.post(`/api/v1/applications/admin/delivery/${selectedApp.id}/suspend`);
      if (response.data.success) {
        toast.success("Delivery partner suspended");
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to suspend partner");
    }
  };

  const handleReactivate = async () => {
    if (!selectedApp) return;
    try {
      const response = await api.post(`/api/v1/applications/admin/delivery/${selectedApp.id}/reactivate`);
      if (response.data.success) {
        toast.success("Delivery partner reactivated");
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reactivate partner");
    }
  };

  const filteredApps = applications.filter((app) => app.status === appActiveTab);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Delivery Partners</h1>
        <p className="text-muted-foreground">Manage delivery partner applications and approvals.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="animate-spin text-teal-600 h-8 w-8" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
            {["pending", "approved", "suspended", "rejected"].map((tab) => (
              <button
                key={tab}
                onClick={() => setAppActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${appActiveTab === tab ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} (
                {applications.filter((a) => a.status === tab).length})
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{appActiveTab.charAt(0).toUpperCase() + appActiveTab.slice(1)} Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredApps.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">No {appActiveTab} delivery applications found.</div>
              ) : (
                <div className="divide-y border rounded-md">
                  {filteredApps.map((app) => (
                    <div key={app.id} className="p-4 flex items-center justify-between hover:bg-zinc-50">
                      <div>
                        <h4 className="font-semibold text-lg">{app.user?.name}</h4>
                        <div className="text-sm text-zinc-500 flex gap-4 mt-1">
                          <span>Email: {app.user?.email}</span>
                          <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 inline-flex gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${app.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <Button onClick={() => { setSelectedApp(app); setShowRejectInput(false); setRejectReason(""); }}>
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legacy Application Review Modal */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Review Application</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-zinc-500 font-bold uppercase">Name:</span> {selectedApp.user?.name}</div>
                <div><span className="text-zinc-500 font-bold uppercase">Email:</span> {selectedApp.user?.email}</div>
                <div><span className="text-zinc-500 font-bold uppercase">Aadhaar:</span> {selectedApp.aadhaarNumber}</div>
                <div><span className="text-zinc-500 font-bold uppercase">Vehicle:</span> {selectedApp.vehicleType} ({selectedApp.vehicleNumber})</div>
                <div className="col-span-2"><span className="text-zinc-500 font-bold uppercase">Address:</span> {selectedApp.addressLine}, {selectedApp.city}</div>
              </div>
              {showRejectInput && (
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium text-red-600">Rejection Reason</label>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full border p-2 rounded" />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReject}>Confirm Reject</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {!showRejectInput && (
              <>
                <Button variant="outline" onClick={() => setSelectedApp(null)}>Close</Button>
                {selectedApp?.status === "pending" && (
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => setShowRejectInput(true)}>Reject</Button>
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleApprove}>Approve</Button>
                  </div>
                )}
                {selectedApp?.status === "approved" && <Button variant="destructive" onClick={handleSuspend}>Suspend</Button>}
                {selectedApp?.status === "suspended" && <Button className="bg-emerald-600 text-white" onClick={handleReactivate}>Reactivate</Button>}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
