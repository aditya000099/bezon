import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input } from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  EyeIcon,
  CursorClickIcon,
  CurrencyDollarIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
;
;
;
;
import api from '../../lib/api';
import API_ENDPOINTS from '../../config/api.config';
import { useToast } from '../../context/ToastContext';

export const SellerAds: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

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
      const [campRes, prodRes] = await Promise.all([
        api.get(API_ENDPOINTS.ads.myCampaigns),
        api.get(API_ENDPOINTS.products.sellerMe),
      ]);

      if (campRes.data.success) {
        setCampaigns(campRes.data.data);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.data.products || prodRes.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load campaigns data');
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
        tags: form.tags ? form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
      });

      if (res.data.success) {
        toast.success('Campaign created successfully!');
        setShowCreate(false);
        setForm({
          productId: '',
          title: '',
          dailyBudget: '',
          totalBudget: '',
          costPerClick: '',
          endDate: '',
          tags: '',
        });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await api.put(API_ENDPOINTS.ads.updateCampaign(id), {
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(`Campaign ${newStatus}`);
        setCampaigns(
          campaigns.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update campaign');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await api.delete(API_ENDPOINTS.ads.deleteCampaign(id));
      if (res.data.success) {
        toast.success('Campaign deleted');
        setCampaigns(campaigns.filter((c) => c.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sponsored Ads</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Boost your product visibility
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <PlusIcon weight="bold" /> Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <MegaphoneIcon className="w-16 h-16 text-zinc-300 mb-4" />
          <h3 className="text-lg font-bold text-zinc-900">No campaigns yet</h3>
          <p className="text-zinc-500 max-w-sm mt-2 mb-6">
            Create your first sponsored ad campaign to boost your products to
            the top of search results.
          </p>
          <Button onClick={() => setShowCreate(true)}>Start Advertising</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => {
            const spentPercent = Math.min(
              100,
              (Number(campaign.totalSpent) / Number(campaign.totalBudget)) *
                100,
            );
            const ctr =
              campaign.totalImpressions > 0
                ? (
                    (campaign.totalClicks / campaign.totalImpressions) *
                    100
                  ).toFixed(2)
                : '0.00';

            return (
              <Card key={campaign.id} className="overflow-hidden flex flex-col">
                <CardContent className="p-0 flex-1">
                  <div className="p-5 flex gap-4 border-b border-zinc-100">
                    <div className="w-20 h-20 rounded-md bg-zinc-100 overflow-hidden shrink-0">
                      {campaign.product.images?.[0]?.url ? (
                        <img
                          src={campaign.product.images[0].url}
                          alt={campaign.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-zinc-900 truncate">
                          {campaign.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                            campaign.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : campaign.status === 'paused'
                                ? 'bg-amber-100 text-amber-700'
                                : campaign.status === 'exhausted'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate mt-1">
                        Product: {campaign.product.title}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <EyeIcon className="w-4 h-4" />{' '}
                          <span>{campaign.totalImpressions} views</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <CursorClickIcon className="w-4 h-4" />{' '}
                          <span>{campaign.totalClicks} clicks</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                          <span>{ctr}% CTR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-zinc-50/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-500">
                        Spend: ₹{Number(campaign.totalSpent).toLocaleString()} /
                        ₹{Number(campaign.totalBudget).toLocaleString()}
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {spentPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full ${spentPercent > 90 ? 'bg-rose-500' : 'bg-primary'}`}
                        style={{ width: `${spentPercent}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500">Daily Budget</p>
                        <p className="font-semibold text-zinc-900">
                          ₹{Number(campaign.dailyBudget).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Max CPC Bid</p>
                        <p className="font-semibold text-zinc-900">
                          ₹{Number(campaign.costPerClick).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-between">
                  <div className="text-xs text-zinc-500">
                    {campaign.endDate
                      ? `Ends ${new Date(campaign.endDate).toLocaleDateString()}`
                      : 'Runs continuously'}
                  </div>
                  <div className="flex gap-2">
                    {campaign.status !== 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCampaign(campaign.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {(campaign.status === 'active' ||
                      campaign.status === 'paused') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStatus(campaign.id, campaign.status)
                        }
                        className="gap-2"
                      >
                        {campaign.status === 'active' ? (
                          <>
                            <PauseIcon weight="fill" /> PauseIcon
                          </>
                        ) : (
                          <>
                            <PlayIcon weight="fill" /> Resume
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Create Ad Campaign</DialogTitle>
            <DialogDescription>
              Set up a sponsored product campaign. You are charged per click
              directly from your wallet balance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Product</label>
              <select
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background"
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
              <label className="text-sm font-medium">Campaign Name</label>
              <Input
                placeholder="e.g., Summer Sale Boost"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Budget (₹)</label>
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
                <label className="text-sm font-medium">Total Budget (₹)</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
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
                <label className="text-sm font-medium">
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
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Search Tags (Comma separated)</label>
                <Input
                  placeholder="e.g. running, sports, shoes"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
                <p className="text-xs text-zinc-500">
                  Customers searching for these exact tags will see your sponsored product.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <SpinnerIcon className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Launch Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
