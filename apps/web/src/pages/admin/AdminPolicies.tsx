import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus, Edit2, Trash2, ShieldCheck, Calendar, Loader2,
  ToggleLeft, ToggleRight, RotateCcw, Banknote, RefreshCw,
} from 'lucide-react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';

interface Policy {
  id: string;
  type: 'return' | 'refund' | 'replace';
  title: string;
  description: string;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

type PolicyType = 'return' | 'refund' | 'replace';

const EMPTY_FORM = {
  type: 'return' as PolicyType,
  title: '',
  description: '',
  durationDays: 7,
};

export const AdminPolicies: React.FC = () => {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.policies.list);
      if (res.data.success) {
        setPolicies(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPolicy(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (policy: Policy) => {
    setEditingPolicy(policy);
    setForm({
      type: policy.type,
      title: policy.title,
      description: policy.description || '',
      durationDays: policy.durationDays,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (form.durationDays < 1) {
      toast.error('Duration must be at least 1 day.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPolicy) {
        await api.put(API_ENDPOINTS.policies.update(editingPolicy.id), form);
        toast.success('Policy updated successfully.');
      } else {
        await api.post(API_ENDPOINTS.policies.create, form);
        toast.success('Policy created successfully.');
      }
      setDialogOpen(false);
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy? Products using it will be unlinked.')) return;
    setDeletingId(id);
    try {
      await api.delete(API_ENDPOINTS.policies.delete(id));
      toast.success('Policy deleted.');
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete policy.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await api.patch(API_ENDPOINTS.policies.toggle(id));
      toast.success('Policy status toggled.');
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle policy.');
    } finally {
      setTogglingId(null);
    }
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      return: 'bg-blue-50 text-blue-700 border-blue-200',
      refund: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      replace: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    const icons: Record<string, React.ReactNode> = {
      return: <RotateCcw className="h-3 w-3" />,
      refund: <Banknote className="h-3 w-3" />,
      replace: <RefreshCw className="h-3 w-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {icons[type]}
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Policies Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage return, refund, and replacement policies for the platform.</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">{policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPolicies} disabled={loading} className="font-medium">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
            <p className="font-medium">Loading policies...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50/30">
            <ShieldCheck className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">No policies yet</p>
            <p className="text-sm text-slate-400">Create your first policy to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration Days</th>
                  <th className="px-6 py-4">Usage Count</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{policy.title}</p>
                        {policy.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{policy.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{typeBadge(policy.type)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold">{policy.durationDays}</span>
                        <span className="text-xs text-slate-400">days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {policy._count?.products ?? 0} {(policy._count?.products ?? 0) === 1 ? 'product' : 'products'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        policy.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggle(policy.id)}
                          disabled={togglingId === policy.id}
                          title={policy.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {togglingId === policy.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : policy.isActive ? (
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(policy)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(policy.id)}
                          disabled={deletingId === policy.id}
                          title="Delete"
                        >
                          {deletingId === policy.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Create Policy'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Type *</label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as PolicyType })}
              >
                <option value="return">Return</option>
                <option value="refund">Refund</option>
                <option value="replace">Replace</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 30-Day Easy Return"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                placeholder="Describe the policy terms..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Duration (Days) *</label>
              <Input
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingPolicy ? 'Save Changes' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
