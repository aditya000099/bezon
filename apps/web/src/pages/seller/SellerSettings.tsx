import { Card, CardHeader, CardTitle, CardContent, CardDescription, Input, Button } from '@bezon/ui';
import React, { useEffect, useState } from 'react';
;
;
;
import {
  SpinnerIcon,
  StorefrontIcon,
  FileTextIcon,
  BankIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CompassIcon,
} from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { GoogleAddressInput } from '../../components/ui/GoogleAddressInput';

export const SellerSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    panNumber: '',
    gstin: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    lat: null as number | null,
    lng: null as number | null,
    bankName: '',
    bankAccount: '',
    ifsc: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.sellers.settings);
      if (res.data.success) {
        setFormData({
          shopName: res.data.data.shopName || '',
          description: res.data.data.description || '',
          panNumber: res.data.data.panNumber || '',
          gstin: res.data.data.gstin || '',
          addressLine: res.data.data.addressLine || '',
          city: res.data.data.city || '',
          state: res.data.data.state || '',
          pincode: res.data.data.pincode || '',
          lat: res.data.data.lat || null,
          lng: res.data.data.lng || null,
          bankName: res.data.data.bankName || '',
          bankAccount: res.data.data.bankAccount || '',
          ifsc: res.data.data.ifsc || '',
        });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to load shop settings';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.patch(API_ENDPOINTS.sellers.settings, formData);
      if (res.data.success) {
        toast.success('Shop settings updated successfully');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to update settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-zinc-500">
        <SpinnerIcon className="h-8 w-8 animate-spin mb-4 text-teal-500" />
        <p className="font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
          Shop Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your storefront details and tax information.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <StorefrontIcon className="h-5 w-5 text-teal-500" />
              StorefrontIcon Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-zinc-700">
                Shop Name
              </label>
              <Input
                value={formData.shopName}
                onChange={(e) =>
                  setFormData({ ...formData, shopName: e.target.value })
                }
                placeholder="Enter your brand name"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-zinc-700">
                Description
              </label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description about your store and products"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-250">
          <CardHeader className="border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-teal-500" />
              StorefrontIcon Location
            </CardTitle>
            <CardDescription>
              Configure physical shop address for coordinating delivery courier
              pickup routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-zinc-700">
                Search Shop Address (Google Maps)
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-zinc-700">
                  Address Line
                </label>
                <Input
                  value={formData.addressLine}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine: e.target.value })
                  }
                  placeholder="Shop number, street name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-zinc-700">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="City"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-zinc-700">
                  State / Region
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
              <div className="grid gap-2">
                <label className="text-sm font-bold text-zinc-700">
                  Pincode
                </label>
                <Input
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  placeholder="6-digit pincode"
                  required
                />
              </div>
            </div>

            {formData.lat && formData.lng && (
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl self-start inline-flex items-center gap-1.5 mt-2">
                <CompassIcon className="h-4 w-4 text-emerald-500 animate-spin-slow" />
                StorefrontIcon Geolocation Configured: {formData.lat},{' '}
                {formData.lng}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-amber-500" />
              Tax Information
            </CardTitle>
            <CardDescription>
              Required for generating compliant PDF bills.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-zinc-700">
                GSTIN Number
              </label>
              <Input
                value={formData.gstin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gstin: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ex: 22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-zinc-700">
                PAN Number
              </label>
              <Input
                value={formData.panNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    panNumber: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ex: ABCDE1234F"
                maxLength={10}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <BankIcon className="h-5 w-5 text-emerald-500" />
              BankIcon Details
            </CardTitle>
            <CardDescription>
              Your payouts will be credited here. Stored securely via end-to-end
              encryption.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-zinc-700">
                BankIcon Name
              </label>
              <Input
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="Ex: State BankIcon of India"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-zinc-700">
                  Account Number
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={formData.bankAccount}
                    onChange={(e) =>
                      setFormData({ ...formData, bankAccount: e.target.value })
                    }
                    placeholder="Enter account number"
                  />
                  <ShieldCheckIcon className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-[10px] text-zinc-400">Stored encrypted.</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-zinc-700">
                  IFSC Code
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={formData.ifsc}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ifsc: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ex: SBIN0001234"
                  />
                  <ShieldCheckIcon className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="font-bold px-8">
            {saving && <SpinnerIcon className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
