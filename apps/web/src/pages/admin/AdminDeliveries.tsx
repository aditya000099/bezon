import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const AdminDeliveries: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'approved' | 'suspended' | 'rejected'
  >('pending');
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        '/api/v1/applications/admin/delivery/applications',
      );
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load delivery applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      const response = await api.post(
        `/api/v1/applications/admin/delivery/${selectedApp.id}/approve`,
      );
      if (response.data.success) {
        toast.success('Delivery partner approved successfully');
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to approve delivery partner',
      );
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      const response = await api.post(
        `/api/v1/applications/admin/delivery/${selectedApp.id}/reject`,
        {
          reason: rejectReason,
        },
      );
      if (response.data.success) {
        toast.success('Delivery partner application rejected');
        setSelectedApp(null);
        setShowRejectInput(false);
        setRejectReason('');
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to reject delivery partner',
      );
    }
  };

  const handleSuspend = async () => {
    if (!selectedApp) return;
    try {
      const response = await api.post(
        `/api/v1/applications/admin/delivery/${selectedApp.id}/suspend`,
      );
      if (response.data.success) {
        toast.success('Delivery partner suspended successfully');
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to suspend delivery partner',
      );
    }
  };

  const handleReactivate = async () => {
    if (!selectedApp) return;
    try {
      const response = await api.post(
        `/api/v1/applications/admin/delivery/${selectedApp.id}/reactivate`,
      );
      if (response.data.success) {
        toast.success('Delivery partner reactivated successfully');
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to reactivate delivery partner',
      );
    }
  };

  const filteredApps = applications.filter((app) => app.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Delivery Partners
          </h1>
          <p className="text-muted-foreground">
            Manage delivery partner accounts and applications
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
          {['pending', 'approved', 'suspended', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === tab ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} (
              {applications.filter((a) => a.status === tab).length})
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Delivery
              Partners
            </CardTitle>
            <CardDescription>
              Manage {activeTab} delivery partner accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">
                Loading applications...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                No {activeTab} delivery partners found.
              </div>
            ) : (
              <div className="divide-y border rounded-md">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50"
                  >
                    <div>
                      <h4 className="font-semibold text-lg">
                        {app.user?.name}
                      </h4>
                      <div className="text-sm text-zinc-500 flex gap-4 mt-1">
                        <span>Email: {app.user?.email}</span>
                        <span>
                          Applied:{' '}
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 inline-flex gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${app.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {app.status.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                          {app.vehicleType}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedApp(app);
                        setShowRejectInput(false);
                        setRejectReason('');
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedApp}
        onOpenChange={(open) => !open && setSelectedApp(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Delivery Partner Application</DialogTitle>
            <DialogDescription>
              Review the details provided by the user before approving or
              rejecting.
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    User Information
                  </h5>
                  <p className="font-medium">{selectedApp.user?.name}</p>
                  <p className="text-sm text-zinc-600">
                    {selectedApp.user?.email}
                  </p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Emergency Contact
                  </h5>
                  <p className="font-medium">
                    {selectedApp.emergencyContactName}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {selectedApp.emergencyContactPhone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Identity Documents
                  </h5>
                  <p className="text-sm">
                    <span className="font-medium">Aadhaar:</span>{' '}
                    {selectedApp.aadhaarNumber}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">PAN:</span>{' '}
                    {selectedApp.panNumber}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">License:</span>{' '}
                    {selectedApp.drivingLicense || 'N/A'}
                  </p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Vehicle Details
                  </h5>
                  <p className="text-sm capitalize">
                    <span className="font-medium">Type:</span>{' '}
                    {selectedApp.vehicleType}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Reg. Number:</span>{' '}
                    {selectedApp.vehicleNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Address
                </h5>
                <p className="text-sm">{selectedApp.addressLine}</p>
                <p className="text-sm">
                  {selectedApp.city}, {selectedApp.state} {selectedApp.pincode}
                </p>
              </div>

              {selectedApp.status === 'rejected' && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                  <span className="font-semibold">
                    Previous Rejection Reason:
                  </span>{' '}
                  {selectedApp.rejectionReason}
                </div>
              )}

              {showRejectInput && (
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium text-red-600">
                    Reason for Rejection *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why the application is being rejected..."
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRejectInput(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReject}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!showRejectInput && (
              <>
                <Button variant="outline" onClick={() => setSelectedApp(null)}>
                  Close
                </Button>
                <div className="flex gap-2">
                  {selectedApp?.status === 'pending' && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectInput(true)}
                      >
                        Reject
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleApprove}
                      >
                        Approve Partner
                      </Button>
                    </>
                  )}
                  {selectedApp?.status === 'approved' && (
                    <Button variant="destructive" onClick={handleSuspend}>
                      Suspend Partner
                    </Button>
                  )}
                  {selectedApp?.status === 'suspended' && (
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleReactivate}
                    >
                      Reactivate Partner
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
