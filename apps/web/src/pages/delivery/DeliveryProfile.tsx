import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter, Input, Button } from '@bezon/ui';
import React, { useEffect, useState } from 'react';
;
;
;
import {
  SpinnerIcon,
  TruckIcon,
  ShieldCheckIcon,
  UserIcon,
  CompassIcon,
  StarIcon,
  NavigationArrowIcon,
  MapPinIcon,
} from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { GoogleAddressInput } from '../../components/ui/GoogleAddressInput';

export const DeliveryProfile: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    vehicleType: 'bike',
    vehicleNumber: '',
    isAvailable: true,
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    lat: null as number | null,
    lng: null as number | null,
  });

  const [stats, setStats] = useState({
    totalDelivered: 0,
    totalFailed: 0,
    rating: 5.0,
    userName: '',
    userEmail: '',
    userPhone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.delivery.profile);
      if (res.data.success) {
        const data = res.data.data;
        setFormData({
          vehicleType: data.vehicleType || 'bike',
          vehicleNumber: data.vehicleNumber || '',
          isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          addressLine: data.addressLine || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          lat: data.lat || null,
          lng: data.lng || null,
        });

        setStats({
          totalDelivered: data.totalDelivered || 0,
          totalFailed: data.totalFailed || 0,
          rating: data.rating ? parseFloat(data.rating) : 5.0,
          userName: data.user?.name || '',
          userEmail: data.user?.email || '',
          userPhone: data.user?.phone || '',
        });
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to load delivery profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.patch(API_ENDPOINTS.delivery.profile, formData);
      if (res.data.success) {
        toast.success('Courier profile updated successfully.');
        fetchProfile();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-75 text-zinc-500">
        <SpinnerIcon className="h-8 w-8 animate-spin mb-4 text-teal-600" />
        <p className="font-bold">Loading courier profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto pb-10">
      {/* Driver Header Summary Card */}
      <div className="bg-linear-to-br from-zinc-900 to-teal-950 text-white rounded-2xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-teal-500/25 border border-teal-400/40 flex items-center justify-center text-xl font-bold">
            {stats.userName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="font-extrabold text-lg leading-tight">
              {stats.userName}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {stats.userEmail} • {stats.userPhone || 'No Phone'}
            </p>
          </div>
        </div>

        {/* Deliverer Quick Stats */}
        <div className="grid grid-cols-3 bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Completed
            </span>
            <span className="text-base font-extrabold text-teal-300 mt-0.5">
              {stats.totalDelivered}
            </span>
          </div>
          <div className="flex flex-col border-x border-white/10">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Failed
            </span>
            <span className="text-base font-extrabold text-rose-400 mt-0.5">
              {stats.totalFailed}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Rating
            </span>
            <span className="text-base font-extrabold text-amber-400 mt-0.5 flex items-center gap-0.5 justify-center">
              <StarIcon className="h-3.5 w-3.5 fill-amber-400" />{' '}
              {stats.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Online/Offline Toggle */}
      <div className="flex justify-between items-center bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${formData.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`}
          ></div>
          <div>
            <p className="text-sm font-extrabold text-zinc-800">
              Duty Status: {formData.isAvailable ? 'ONLINE' : 'OFFLINE'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {formData.isAvailable
                ? 'You are visible for location matching'
                : 'You are currently resting'}
            </p>
          </div>
        </div>
        <Button
          variant={formData.isAvailable ? 'outline' : 'default'}
          size="sm"
          className="rounded-xl font-bold"
          onClick={() =>
            setFormData((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))
          }
        >
          {formData.isAvailable ? 'Go Offline' : 'Go Online'}
        </Button>
      </div>

      {/* Vehicle details & Address form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Vehicle Card */}
        <Card className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-zinc-100 pb-3 p-5">
            <CardTitle className="text-base font-extrabold text-zinc-800 flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-teal-600" /> Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Vehicle Type
              </label>
              <select
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                value={formData.vehicleType}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleType: e.target.value })
                }
              >
                <option value="bike">Bicycle / Motorcycle</option>
                <option value="car">Car / Sedan</option>
                <option value="van">Delivery Van</option>
                <option value="truck">Heavy TruckIcon</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Number Plate info
              </label>
              <Input
                value={formData.vehicleNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vehicleNumber: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ex: MH-02-AB-1234"
              />
            </div>
          </CardContent>
        </Card>

        {/* Courier Base Location Card */}
        <Card className="bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-zinc-100 pb-3 p-5">
            <CardTitle className="text-base font-extrabold text-zinc-800 flex items-center gap-2">
              <NavigationArrowIcon className="h-5 w-5 text-teal-600" /> Base Address
              (Google Maps)
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Used for calculating distance matching thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Search Home Location
              </label>
              <GoogleAddressInput
                onAddressSelect={(selected) => {
                  setFormData((prev) => ({
                    ...prev,
                    addressLine: selected.addressLine,
                    city: selected.city,
                    state: selected.state,
                    pincode: selected.pincode,
                    lat: selected.lat,
                    lng: selected.lng,
                  }));
                }}
                defaultValue={
                  formData.addressLine
                    ? `${formData.addressLine}, ${formData.city}, ${formData.state}`
                    : ''
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Street Address
                </label>
                <Input
                  value={formData.addressLine}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine: e.target.value })
                  }
                  placeholder="Street"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="City"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="State"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Pincode
                </label>
                <Input
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  placeholder="Pincode"
                  required
                />
              </div>
            </div>

            {formData.lat && formData.lng && (
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-xl self-start flex items-center gap-1 mt-1">
                <CompassIcon className="h-3.5 w-3.5 text-emerald-500 animate-spin-slow" />
                Base coordinates active: {formData.lat}, {formData.lng}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-zinc-50 border-t border-zinc-100 p-4 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl font-bold"
            >
              {saving && <SpinnerIcon className="h-4 w-4 mr-2 animate-spin" />}
              Save Courier Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
