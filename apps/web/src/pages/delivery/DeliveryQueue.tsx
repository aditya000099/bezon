import React, { useEffect, useState } from 'react';
import {
  Truck,
  MapPin,
  NavigationArrow,
  ShieldCheck,
  CheckCircle,
  Camera,
  WarningCircle,
  Spinner,
  Phone,
  Package,
} from '@phosphor-icons/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';

export const DeliveryQueue: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [queueTasks, setQueueTasks] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');

  useEffect(() => {
    fetchProfileAndQueue();
  }, []);

  const fetchProfileAndQueue = async () => {
    try {
      setLoading(true);
      // 1. Fetch courier profile for availability status
      const profileRes = await api.get(API_ENDPOINTS.delivery.profile);
      if (profileRes.data.success) {
        setIsAvailable(profileRes.data.data.isAvailable);
      }

      // 2. Fetch active courier tasks
      const queueRes = await api.get(API_ENDPOINTS.delivery.queue);
      if (queueRes.data.success) {
        const tasks = queueRes.data.data;
        // Group tasks into active trip vs available queue
        const active = tasks.find((t: any) =>
          ['accepted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(
            t.status,
          ),
        );
        const pending = tasks.filter((t: any) => t.status === 'assigned');

        setActiveTrip(active || null);
        setQueueTasks(pending);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to sync dispatcher queue.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const nextStatus = !isAvailable;
      const res = await api.patch(API_ENDPOINTS.delivery.profile, {
        isAvailable: nextStatus,
      });
      if (res.data.success) {
        setIsAvailable(nextStatus);
        toast.success(`You are now ${nextStatus ? 'ONLINE' : 'OFFLINE'}.`);
      }
    } catch (err: any) {
      toast.error('Could not update availability status.');
    }
  };

  const handleAcceptTrip = async (task: any) => {
    try {
      const res = await api.patch(
        API_ENDPOINTS.delivery.updateStatus(task.id),
        {
          status: 'accepted',
          note: 'Courier accepted the delivery assignment.',
        },
      );
      if (res.data.success) {
        toast.success(`Fulfillment matched. Proceed to pickup!`);
        fetchProfileAndQueue();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept trip.');
    }
  };

  const handleConfirmPickup = async () => {
    if (!activeTrip) return;
    try {
      const res = await api.patch(
        API_ENDPOINTS.delivery.updateStatus(activeTrip.id),
        {
          status: 'picked_up',
          note: 'Courier picked up the parcel from the merchant warehouse.',
        },
      );
      if (res.data.success) {
        toast.info('Status updated: In Transit. Deliver parcel to client.');
        fetchProfileAndQueue();
      }
    } catch (err: any) {
      toast.error('Failed to update pickup status.');
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const payload = new FormData();
      payload.append('image', file);

      const res = await api.post(API_ENDPOINTS.media.upload, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setProofImageUrl(res.data.data.url);
        setPhotoCaptured(true);
        toast.success('Photographic proof uploaded successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulatePhoto = () => {
    setIsUploading(true);
    setTimeout(() => {
      // Use a premium mockup delivery proof image
      setProofImageUrl(
        'https://s3.ap-south-1.amazonaws.com/bezon-mock-sandbox/uploads/mock_proof.jpg',
      );
      setPhotoCaptured(true);
      setIsUploading(false);
      toast.success('Photographic proof simulated successfully.');
    }, 8000);
  };

  const handleCompleteDelivery = async () => {
    if (!activeTrip) return;
    if (!proofImageUrl) {
      toast.warning('Please capture photographic proof before signing off.');
      return;
    }

    try {
      const res = await api.patch(
        API_ENDPOINTS.delivery.updateStatus(activeTrip.id),
        {
          status: 'delivered',
          note: 'Package successfully handed over to customer.',
          proofImageUrl,
        },
      );

      if (res.data.success) {
        toast.success(`Fulfillment Complete! Order successfully delivered.`);
        setActiveTrip(null);
        setPhotoCaptured(false);
        setProofImageUrl('');
        setShowProofModal(false);
        fetchProfileAndQueue();
      }
    } catch (err: any) {
      toast.error('Failed to submit delivery confirmation.');
    }
  };

  const formatItemsString = (order: any) => {
    if (!order || !order.items) return '';
    return order.items
      .map((i: any) => `${i.qty}x ${i.productTitle}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-500">
        <Spinner className="h-8 w-8 animate-spin mb-4 text-teal-600" />
        <p className="font-bold">Syncing active assignments...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      {/* Availability Status Bar */}
      <div className="flex justify-between items-center bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`}
          ></div>
          <div>
            <p className="text-sm font-extrabold text-zinc-800">
              Duty Status: {isAvailable ? 'ONLINE & ACTIVE' : 'OFFLINE'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {isAvailable
                ? 'You are visible to local order assigners'
                : 'Go online to receive jobs'}
            </p>
          </div>
        </div>
        <Button
          variant={isAvailable ? 'outline' : 'default'}
          size="sm"
          className="rounded-xl font-bold"
          onClick={handleToggleAvailability}
        >
          {isAvailable ? 'Go Offline' : 'Go Online'}
        </Button>
      </div>

      {/* Active Trip Section */}
      {activeTrip ? (
        <div className="flex flex-col gap-3">
          <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase flex items-center gap-1.5 pl-1">
            <span className="h-2 w-2 bg-teal-600 rounded-full animate-ping"></span>
            Current Active Assignment
          </h3>
          <Card className="border-teal-100 bg-teal-50/5 shadow-md rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="border-b border-teal-50/50 pb-4 p-5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-extrabold text-zinc-900">
                  {activeTrip.order?.orderNumber}
                </CardTitle>
                <span className="bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {activeTrip.status.replace(/_/g, ' ')}
                </span>
              </div>
              <CardDescription className="text-xs font-semibold text-zinc-500 mt-1.5 flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                {formatItemsString(activeTrip.order)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 text-amber-700 rounded-lg p-1.5 mt-0.5 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Pickup Warehouse
                  </p>
                  <p className="text-sm font-extrabold text-zinc-700 mt-0.5 leading-snug">
                    {activeTrip.order?.seller?.shopName}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    {activeTrip.order?.seller?.addressLine},{' '}
                    {activeTrip.order?.seller?.city},{' '}
                    {activeTrip.order?.seller?.state}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-zinc-100 pt-3.5">
                <div className="bg-emerald-100 text-emerald-700 rounded-lg p-1.5 mt-0.5 shrink-0">
                  <NavigationArrow className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Customer Dropoff
                  </p>
                  <p className="text-sm font-extrabold text-zinc-700 mt-0.5 leading-snug">
                    {activeTrip.order?.customer?.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    {activeTrip.order?.addressSnapshot?.line1},{' '}
                    {activeTrip.order?.addressSnapshot?.city},{' '}
                    {activeTrip.order?.addressSnapshot?.state}
                  </p>
                  {activeTrip.order?.customer?.phone && (
                    <a
                      href={`tel:${activeTrip.order.customer.phone}`}
                      className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-xs font-bold mt-2 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call Client
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 border-t border-zinc-100 p-4 bg-white/50">
              {activeTrip.status === 'accepted' ? (
                <Button
                  className="w-full rounded-xl font-bold"
                  onClick={handleConfirmPickup}
                >
                  Confirm Package Pickup
                </Button>
              ) : (
                <Button
                  className="w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowProofModal(true)}
                >
                  <Camera className="h-4 w-4 mr-2" /> Complete & Capture Proof
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      ) : null}

      {/* Available Queue Tasks */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase pl-1">
          Available Tasks Queue
        </h3>
        {queueTasks.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <WarningCircle className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 text-xs mt-2 font-medium">
              No pending assignments await your allocation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {queueTasks.map((t) => (
              <Card
                key={t.id}
                className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-zinc-900 text-base">
                      {t.order?.orderNumber}
                    </span>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Pending Accept
                    </span>
                  </div>
                  <CardDescription className="text-xs font-semibold text-zinc-500 mt-1 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-zinc-400" />
                    {formatItemsString(t.order)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 pb-4 space-y-2.5">
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    <strong className="text-zinc-800 font-bold block mb-0.5">
                      Pickup:
                    </strong>
                    {t.order?.seller?.shopName} — {t.order?.seller?.addressLine}
                    , {t.order?.seller?.city}
                  </div>
                  <div className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-50 pt-2">
                    <strong className="text-zinc-800 font-bold block mb-0.5">
                      Drop:
                    </strong>
                    {t.order?.customer?.name} —{' '}
                    {t.order?.addressSnapshot?.line1},{' '}
                    {t.order?.addressSnapshot?.city}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-zinc-100 p-4">
                  <Button
                    className="w-full rounded-xl font-bold text-xs"
                    disabled={!isAvailable || !!activeTrip}
                    onClick={() => handleAcceptTrip(t)}
                  >
                    Accept Trip Assignment
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Proof of Delivery Dialog */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-md bg-white border border-zinc-200 shadow-2xl p-6 rounded-2xl">
          <DialogHeader className="border-b border-zinc-100 pb-4">
            <DialogTitle className="text-base font-extrabold text-zinc-900">
              Proof of Delivery (POD)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload photographic proof of handoff to complete this order.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-6 bg-zinc-50/50 min-h-[160px]">
            {photoCaptured ? (
              <div className="flex flex-col items-center gap-2 text-center text-emerald-600 animate-in zoom-in-95 duration-200">
                <CheckCircle className="h-10 w-10 text-emerald-500 fill-emerald-50" />
                <p className="font-bold text-sm">Receipt Photo Verified</p>
                <p className="text-[9px] text-zinc-400 leading-tight">
                  Timestamp: {new Date().toLocaleTimeString()} <br /> Location
                  Coordinates Captured
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3.5 text-center">
                <Camera className="h-10 w-10 text-zinc-300" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="inline-flex items-center justify-center rounded-xl font-bold text-xs border border-teal-200 bg-white hover:bg-zinc-50 text-teal-600 px-4 py-2 cursor-pointer shadow-sm">
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadPhoto}
                      disabled={isUploading}
                    />
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="font-bold text-[10px] text-zinc-400 hover:text-zinc-600"
                    onClick={handleSimulatePhoto}
                    disabled={isUploading}
                  >
                    Simulate Capture
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row gap-3 pt-4 border-t border-zinc-100 w-full">
            <Button
              variant="outline"
              className="flex-1 font-bold text-xs rounded-xl"
              onClick={() => setShowProofModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              onClick={handleCompleteDelivery}
              disabled={!photoCaptured || isUploading}
            >
              Complete Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
