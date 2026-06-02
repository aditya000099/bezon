import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Store, FileText, Landmark, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';

export const SellerSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    panNumber: '',
    gstin: '',
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
          bankName: res.data.data.bankName || '',
          bankAccount: res.data.data.bankAccount || '',
          ifsc: res.data.data.ifsc || '',
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load shop settings';
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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
        <p className="font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Shop Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your storefront details and tax information.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-500" />
              Storefront Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Shop Name</label>
              <Input
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="Enter your brand name"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description about your store and products"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Tax Information
            </CardTitle>
            <CardDescription>Required for generating compliant PDF bills.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">GSTIN Number</label>
              <Input
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="Ex: 22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">PAN Number</label>
              <Input
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="Ex: ABCDE1234F"
                maxLength={10}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-500" />
              Bank Details
            </CardTitle>
            <CardDescription>Your payouts will be credited here. Stored securely via end-to-end encryption.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Bank Name</label>
              <Input
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Ex: State Bank of India"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Account Number</label>
                <div className="relative">
                  <Input
                    type="password"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="Enter account number"
                  />
                  <ShieldCheck className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-[10px] text-slate-400">Stored encrypted.</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">IFSC Code</label>
                <div className="relative">
                  <Input
                    type="password"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                    placeholder="Ex: SBIN0001234"
                  />
                  <ShieldCheck className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="font-bold px-8">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
