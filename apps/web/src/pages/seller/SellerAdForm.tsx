import { Card, CardContent, CardFooter, Button, Input } from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import API_ENDPOINTS from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { logger } from '@/utils/logger';

export const SellerAdForm: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    productId: '',
    title: '',
    dailyBudget: '',
    totalBudget: '',
    costPerClick: '',
    endDate: '',
    tags: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await api.get(API_ENDPOINTS.products.sellerMe);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data.products || prodRes.data.data);
      }
    } catch (err: any) {
      logger.error('Failed to load products', err);
      toast.error('Failed to load products for ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (
      !form.productId ||
      !form.title ||
      !form.dailyBudget ||
      !form.totalBudget ||
      !form.costPerClick
    ) {
      return toast.error('Please fill all required fields');
    }

    setCreating(true);
    try {
      const res = await api.post(API_ENDPOINTS.ads.campaigns, {
        productId: form.productId,
        title: form.title,
        dailyBudget: Number(form.dailyBudget),
        totalBudget: Number(form.totalBudget),
        costPerClick: Number(form.costPerClick),
        endDate: form.endDate || undefined,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean)
          : [],
      });

      if (res.data.success) {
        toast.success('Campaign created successfully!');
        navigate('/seller/ads');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <SpinnerIcon className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Create Ad Campaign
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Set up a sponsored product campaign. You are charged per click
            directly from your wallet balance.
          </p>
        </div>
      </div>

      <Card className="bg-white border-zinc-200">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Select Product
              </label>
              <select
                className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
              >
                <option value="">-- Choose a published product --</option>
                {products
                  .filter((p) => p.status === 'published')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (₹{p.basePrice})
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Campaign Name
              </label>
              <Input
                placeholder="e.g., Summer Sale Boost"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Daily Budget (₹)
                </label>
                <Input
                  type="number"
                  min="10"
                  placeholder="100"
                  value={form.dailyBudget}
                  onChange={(e) =>
                    setForm({ ...form, dailyBudget: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Total Budget (₹)
                </label>
                <Input
                  type="number"
                  min="10"
                  placeholder="1000"
                  value={form.totalBudget}
                  onChange={(e) =>
                    setForm({ ...form, totalBudget: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Cost Per Click Bid (₹)
                </label>
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="2.50"
                  value={form.costPerClick}
                  onChange={(e) =>
                    setForm({ ...form, costPerClick: e.target.value })
                  }
                />
                <p className="text-xs text-zinc-500">
                  Higher bid = better placement
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  End Date (Optional)
                </label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-zinc-700">
                  Search Tags (Comma separated)
                </label>
                <Input
                  placeholder="e.g. running, sports, shoes"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
                <p className="text-xs text-zinc-500">
                  Customers searching for these exact tags will see your
                  sponsored product.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3 rounded-b-xl py-4">
          <Button variant="outline" onClick={() => navigate('/seller/ads')}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {creating ? (
              <SpinnerIcon className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Launch Campaign
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
