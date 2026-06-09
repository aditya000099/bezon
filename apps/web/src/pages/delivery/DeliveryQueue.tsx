import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@bezon/ui';
import React, { useEffect, useState } from 'react';
import {
  TruckIcon,
  MapPinIcon,
  NavigationArrowIcon,
  CheckCircleIcon,
  CameraIcon,
  WarningCircleIcon,
  SpinnerIcon,
  PhoneIcon,
  PackageIcon,
  ClockCounterClockwiseIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
;
;
;
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { formatStatusText } from '../../utils/statusFormatter';

export const DeliveryQueue: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  // Three sections of data
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);

  // Pagination for completed
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Return Logistics sections
  const [availableReturns, setAvailableReturns] = useState<any[]>([]);
  const [activeReturns, setActiveReturns] = useState<any[]>([]);
  const [completedReturns, setCompletedReturns] = useState<any[]>([]);

  // Pagination for completed returns
  const [returnHistoryPage, setReturnHistoryPage] = useState(1);
  const [returnHistoryTotalPages, setReturnHistoryTotalPages] = useState(1);

  // Proof of delivery modal state
  const [proofDelivery, setProofDelivery] = useState<any>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [historyPage]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Fetch profile, available, queue, and history in parallel
      const [
        profileRes, availableRes, queueRes, historyRes,
        availableRetRes, queueRetRes, historyRetRes
      ] = await Promise.all([
        api.get(API_ENDPOINTS.delivery.profile),
        api.get(API_ENDPOINTS.delivery.available),
        api.get(API_ENDPOINTS.delivery.queue),
        api.get(`${API_ENDPOINTS.delivery.history}?page=1&limit=5`),
        api.get(API_ENDPOINTS.delivery.availableReturns),
        api.get(API_ENDPOINTS.delivery.returnQueue),
        api.get(`${API_ENDPOINTS.delivery.returnHistory}?page=1&limit=5`),
      ]);

      if (profileRes.data.success) {
        setIsAvailable(profileRes.data.data.isAvailable);
      }

      if (availableRes.data.success) {
        setAvailableTasks(availableRes.data.data);
      }

      if (queueRes.data.success) {
        setActiveDeliveries(queueRes.data.data);
      }

      if (historyRes.data.success) {
        setCompletedDeliveries(historyRes.data.data);
        if (historyRes.data.pagination) {
          setHistoryTotalPages(historyRes.data.pagination.totalPages);
          setHistoryPage(historyRes.data.pagination.page);
        }
      }

      if (availableRetRes.data.success) {
        setAvailableReturns(availableRetRes.data.data);
      }
      if (queueRetRes.data.success) {
        setActiveReturns(queueRetRes.data.data);
      }
      if (historyRetRes.data.success) {
        setCompletedReturns(historyRetRes.data.data);
        if (historyRetRes.data.pagination) {
          setReturnHistoryTotalPages(historyRetRes.data.pagination.totalPages);
          setReturnHistoryPage(historyRetRes.data.pagination.page);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync dispatcher queue.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`${API_ENDPOINTS.delivery.history}?page=${historyPage}&limit=5`);
      if (res.data.success) {
        setCompletedDeliveries(res.data.data);
        if (res.data.pagination) {
          setHistoryTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (err: any) {
      // silent
    }
  };

  const fetchReturnHistory = async () => {
    try {
      const res = await api.get(`${API_ENDPOINTS.delivery.returnHistory}?page=${returnHistoryPage}&limit=5`);
      if (res.data.success) {
        setCompletedReturns(res.data.data);
        if (res.data.pagination) {
          setReturnHistoryTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (err: any) {
      // silent
    }
  };

  useEffect(() => {
    fetchReturnHistory();
  }, [returnHistoryPage]);

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

  const handleAcceptAssignment = async (task: any) => {
    try {
      const res = await api.post(API_ENDPOINTS.delivery.acceptAssignment(task.id));
      if (res.data.success) {
        toast.success('Assignment accepted! Proceed to pickup location.');
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept assignment.');
    }
  };

  const handleAcceptReturnPickup = async (order: any) => {
    try {
      const res = await api.post(API_ENDPOINTS.delivery.acceptReturnPickup(order.id));
      if (res.data.success) {
        toast.success('Return Pickup accepted! Proceed to customer location.');
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept return pickup.');
    }
  };

  const handleMarkReturnPickedUp = async (order: any) => {
    try {
      const res = await api.patch(API_ENDPOINTS.delivery.markReturnPickedUp(order.id));
      if (res.data.success) {
        toast.success('Return marked as picked up.');
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update return status.');
    }
  };

  const handleMarkReturnCompleted = async (order: any) => {
    try {
      const res = await api.patch(API_ENDPOINTS.delivery.markReturnCompleted(order.id));
      if (res.data.success) {
        toast.success('Return completed successfully.');
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete return.');
    }
  };

  const handleUpdateStatus = async (delivery: any, newStatus: string, note: string) => {
    try {
      const res = await api.patch(
        API_ENDPOINTS.delivery.updateStatus(delivery.id),
        { status: newStatus, note },
      );
      if (res.data.success) {
        toast.success(`Status updated to ${formatStatusText(newStatus)}.`);
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
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
        headers: { 'Content-Type': 'multipart/form-data' },
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
      setProofImageUrl(
        'https://s3.ap-south-1.amazonaws.com/bezon-mock-sandbox/uploads/mock_proof.jpg',
      );
      setPhotoCaptured(true);
      setIsUploading(false);
      toast.success('Photographic proof simulated successfully.');
    }, 3000);
  };

  const handleCompleteDelivery = async () => {
    if (!proofDelivery) return;
    if (!proofImageUrl) {
      toast.warning('Please capture photographic proof before signing off.');
      return;
    }

    try {
      const res = await api.patch(
        API_ENDPOINTS.delivery.updateStatus(proofDelivery.id),
        {
          status: 'delivered',
          note: 'PackageIcon successfully handed over to customer.',
          proofImageUrl,
        },
      );

      if (res.data.success) {
        toast.success('Fulfillment Complete! Order successfully delivered.');
        setProofDelivery(null);
        setPhotoCaptured(false);
        setProofImageUrl('');
        setShowProofModal(false);
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit delivery confirmation.');
    }
  };

  const openProofModal = (delivery: any) => {
    setProofDelivery(delivery);
    setPhotoCaptured(false);
    setProofImageUrl('');
    setShowProofModal(true);
  };

  const formatItemsString = (order: any) => {
    if (!order || !order.items) return '';
    return order.items.map((i: any) => `${i.qty}x ${i.productTitle}`).join(', ');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-500">
        <SpinnerIcon className="h-8 w-8 animate-spin mb-4 text-teal-600" />
        <p className="font-bold">Syncing active assignments...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto pb-10">
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

      {/* ======================= */}
      {/* SECTION 1: Available Assignments */}
      {/* ======================= */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase flex items-center gap-2 pl-1">
          <PackageIcon className="h-4 w-4 text-amber-600" />
          Available Assignments
          {availableTasks.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {availableTasks.length}
            </span>
          )}
        </h3>
        {availableTasks.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <WarningCircleIcon className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 text-xs mt-2 font-medium">
              No unassigned orders available for pickup right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {availableTasks.map((t) => (
              <Card
                key={t.id}
                className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-zinc-900 text-base">
                      {t.orderNumber}
                    </span>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Ready For Pickup
                    </span>
                  </div>
                  <CardDescription className="text-xs font-semibold text-zinc-500 mt-1 flex items-center gap-1">
                    <PackageIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {formatItemsString(t)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 pb-4 space-y-2.5">
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    <strong className="text-zinc-800 font-bold block mb-0.5">Pickup:</strong>
                    {t.seller?.shopName} — {t.seller?.addressLine}, {t.seller?.city}
                  </div>
                  <div className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-50 pt-2">
                    <strong className="text-zinc-800 font-bold block mb-0.5">Drop:</strong>
                    {t.customer?.name} — {t.addressSnapshot?.line1}, {t.addressSnapshot?.city}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-zinc-100 p-4">
                  <Button
                    className="w-full rounded-xl font-bold text-xs"
                    disabled={!isAvailable}
                    onClick={() => handleAcceptAssignment(t)}
                  >
                    Accept Trip Assignment
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ======================= */}
      {/* SECTION 2: My Active Deliveries */}
      {/* ======================= */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase flex items-center gap-2 pl-1">
          <TruckIcon className="h-4 w-4 text-teal-600" />
          My Active Deliveries
          {activeDeliveries.length > 0 && (
            <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeDeliveries.length}
            </span>
          )}
        </h3>
        {activeDeliveries.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <WarningCircleIcon className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 text-xs mt-2 font-medium">
              No active deliveries. Accept an assignment above to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeDeliveries.map((trip) => (
              <Card
                key={trip.id}
                className="border-teal-100 bg-teal-50/5 shadow-md rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <CardHeader className="border-b border-teal-50/50 pb-4 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-extrabold text-zinc-900">
                      {trip.order?.orderNumber}
                    </CardTitle>
                    <span className="bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                      {formatStatusText(trip.status)}
                    </span>
                  </div>
                  <CardDescription className="text-xs font-semibold text-zinc-500 mt-1.5 flex items-center gap-1">
                    <PackageIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    {formatItemsString(trip.order)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 text-amber-700 rounded-lg p-1.5 mt-0.5 shrink-0">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Pickup Warehouse
                      </p>
                      <p className="text-sm font-extrabold text-zinc-700 mt-0.5 leading-snug">
                        {trip.order?.seller?.shopName}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                        {trip.order?.seller?.addressLine}, {trip.order?.seller?.city}, {trip.order?.seller?.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-zinc-100 pt-3.5">
                    <div className="bg-emerald-100 text-emerald-700 rounded-lg p-1.5 mt-0.5 shrink-0">
                      <NavigationArrowIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Customer Dropoff
                      </p>
                      <p className="text-sm font-extrabold text-zinc-700 mt-0.5 leading-snug">
                        {trip.order?.customer?.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                        {trip.order?.addressSnapshot?.line1}, {trip.order?.addressSnapshot?.city}, {trip.order?.addressSnapshot?.state}
                      </p>
                      {trip.order?.customer?.phone && (
                        <a
                          href={`tel:${trip.order.customer.phone}`}
                          className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-xs font-bold mt-2 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100"
                        >
                          <PhoneIcon className="h-3.5 w-3.5" /> Call Client
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3 border-t border-zinc-100 p-4 bg-white/50">
                  {(trip.status === 'accepted' || trip.status === 'assigned') && (
                    <Button
                      className="w-full rounded-xl font-bold"
                      onClick={() =>
                        handleUpdateStatus(trip, 'picked_up', 'Courier picked up the parcel from the merchant warehouse.')
                      }
                    >
                      Confirm PackageIcon Pickup
                    </Button>
                  )}
                  {trip.status === 'picked_up' && (
                    <Button
                      className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() =>
                        handleUpdateStatus(trip, 'out_for_delivery', 'Courier is now out for delivery.')
                      }
                    >
                      <ArrowRightIcon className="h-4 w-4 mr-2" />
                      Mark Out For Delivery
                    </Button>
                  )}
                  {(trip.status === 'out_for_delivery' || trip.status === 'in_transit') && (
                    <Button
                      className="w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => openProofModal(trip)}
                    >
                      <CameraIcon className="h-4 w-4 mr-2" /> Complete & Capture Proof
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ======================= */}
      {/* SECTION 3: Completed Deliveries */}
      {/* ======================= */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase flex items-center gap-2 pl-1">
          <ClockCounterClockwiseIcon className="h-4 w-4 text-zinc-500" />
          Completed Deliveries
        </h3>
        {completedDeliveries.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <WarningCircleIcon className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 text-xs mt-2 font-medium">
              No completed deliveries yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {completedDeliveries.map((d) => (
              <Card
                key={d.id}
                className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        d.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {d.status === 'delivered' ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <WarningCircleIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-zinc-800">
                        {d.order?.orderNumber}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {d.order?.seller?.shopName} → {d.order?.customer?.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {d.deliveredAt
                          ? new Date(d.deliveredAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : new Date(d.updatedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap border ${
                      d.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {formatStatusText(d.status)}
                  </span>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {historyTotalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                >
                  <CaretLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold text-zinc-500">
                  Page {historyPage} of {historyTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                  disabled={historyPage >= historyTotalPages}
                  onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                >
                  <CaretRightIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================= */}
      {/* SECTION 4: Available Return Pickups */}
      {/* ======================= */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase flex items-center gap-2 pl-1">
          <PackageIcon className="h-4 w-4 text-rose-600" />
          Available Return Pickups
          {availableReturns.length > 0 && (
            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {availableReturns.length}
            </span>
          )}
        </h3>
        {availableReturns.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <WarningCircleIcon className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 text-xs mt-2 font-medium">
              No return pickups available.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {availableReturns.map((t) => (
              <Card key={t.id} className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-zinc-900 text-base">
                      {t.orderNumber}
                    </span>
                    <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Return Requested
                    </span>
                  </div>
                  <CardDescription className="text-xs font-semibold text-zinc-500 mt-1 flex items-center gap-1">
                    <PackageIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {formatItemsString(t)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 pb-4 space-y-2.5">
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    <strong className="text-zinc-800 font-bold block mb-0.5">Pickup from Customer:</strong>
                    {t.customer?.name} — {t.addressSnapshot?.line1}, {t.addressSnapshot?.city}
                  </div>
                  <div className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-50 pt-2">
                    <strong className="text-zinc-800 font-bold block mb-0.5">Drop to Seller:</strong>
                    {t.seller?.shopName} — {t.seller?.addressLine}, {t.seller?.city}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-zinc-100 p-4">
                  <Button
                    className="w-full rounded-xl font-bold text-xs"
                    disabled={!isAvailable}
                    onClick={() => handleAcceptReturnPickup(t)}
                  >
                    Accept Return Pickup
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ======================= */}
      {/* SECTION 5: Assigned Return Pickups */}
      {/* ======================= */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase flex items-center gap-2 pl-1">
          <TruckIcon className="h-4 w-4 text-purple-600" />
          Assigned Return Pickups
          {activeReturns.length > 0 && (
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeReturns.length}
            </span>
          )}
        </h3>
        {activeReturns.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <WarningCircleIcon className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 text-xs mt-2 font-medium">
              No active return pickups.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeReturns.map((trip) => (
              <Card key={trip.id} className="border-purple-100 bg-purple-50/5 shadow-md rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="border-b border-purple-50/50 pb-4 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-extrabold text-zinc-900">
                      {trip.orderNumber}
                    </CardTitle>
                    <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                      {formatStatusText(trip.returnStatus)}
                    </span>
                  </div>
                  <CardDescription className="text-xs font-semibold text-zinc-500 mt-1.5 flex items-center gap-1">
                    <PackageIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    {formatItemsString(trip)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 text-amber-700 rounded-lg p-1.5 mt-0.5 shrink-0">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Customer Pickup
                      </p>
                      <p className="text-sm font-extrabold text-zinc-700 mt-0.5 leading-snug">
                        {trip.customer?.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                        {trip.addressSnapshot?.line1}, {trip.addressSnapshot?.city}, {trip.addressSnapshot?.state}
                      </p>
                      {trip.customer?.phone && (
                        <a href={`tel:${trip.customer.phone}`} className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700 text-xs font-bold mt-2 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                          <PhoneIcon className="h-3.5 w-3.5" /> Call Customer
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t border-zinc-100 pt-3.5">
                    <div className="bg-emerald-100 text-emerald-700 rounded-lg p-1.5 mt-0.5 shrink-0">
                      <NavigationArrowIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Seller Dropoff
                      </p>
                      <p className="text-sm font-extrabold text-zinc-700 mt-0.5 leading-snug">
                        {trip.seller?.shopName}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                        {trip.seller?.addressLine}, {trip.seller?.city}, {trip.seller?.state}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3 border-t border-zinc-100 p-4 bg-white/50">
                  {trip.returnStatus === 'ASSIGNED' && (
                    <Button
                      className="w-full rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => handleMarkReturnPickedUp(trip)}
                    >
                      Mark Picked Up from Customer
                    </Button>
                  )}
                  {trip.returnStatus === 'PICKED_UP' && (
                    <Button
                      className="w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleMarkReturnCompleted(trip)}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Mark Returned to Seller
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ======================= */}
      {/* SECTION 6: Return Pickup History */}
      {/* ======================= */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-zinc-800 text-sm tracking-wider uppercase flex items-center gap-2 pl-1">
          <ClockCounterClockwiseIcon className="h-4 w-4 text-zinc-500" />
          Return Pickup History
        </h3>
        {completedReturns.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <WarningCircleIcon className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 text-xs mt-2 font-medium">
              No completed return pickups.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {completedReturns.map((d) => (
              <Card key={d.id} className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg shrink-0 bg-emerald-100 text-emerald-700">
                      <CheckCircleIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-zinc-800">
                        {d.orderNumber}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {d.customer?.name} → {d.seller?.shopName}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {d.returnCompletedAt && new Date(d.returnCompletedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {formatStatusText(d.returnStatus)}
                  </span>
                </CardContent>
              </Card>
            ))}
            
            {/* Pagination for Returns */}
            {returnHistoryTotalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                  disabled={returnHistoryPage <= 1}
                  onClick={() => setReturnHistoryPage((p) => Math.max(1, p - 1))}
                >
                  <CaretLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold text-zinc-500">
                  Page {returnHistoryPage} of {returnHistoryTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                  disabled={returnHistoryPage >= returnHistoryTotalPages}
                  onClick={() => setReturnHistoryPage((p) => Math.min(returnHistoryTotalPages, p + 1))}
                >
                  <CaretRightIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
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
                <CheckCircleIcon className="h-10 w-10 text-emerald-500 fill-emerald-50" />
                <p className="font-bold text-sm">Receipt Photo Verified</p>
                <p className="text-[9px] text-zinc-400 leading-tight">
                  Timestamp: {new Date().toLocaleTimeString()} <br /> Location
                  Coordinates Captured
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3.5 text-center">
                <CameraIcon className="h-10 w-10 text-zinc-300" />
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
