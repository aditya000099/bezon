import { Card, Button, Input } from '@bezon/ui';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  ShieldCheckIcon,
  CalendarIcon,
  SpinnerIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  ArrowCounterClockwiseIcon,
  MoneyIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

interface Policy {
  id: string;
  type: "return" | "refund" | "replace";
  title: string;
  description: string;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

type PolicyType = "return" | "refund" | "replace";

const EMPTY_FORM = {
  type: "return" as PolicyType,
  title: "",
  description: "",
  durationDays: 7,
};

export const AdminPolicies: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
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
      toast.error(err.response?.data?.message || "Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    navigate('/admin/policies/create');
  };

  const openEditDialog = (policy: Policy) => {
    navigate(`/admin/policies/${policy.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this policy? Products using it will be unlinked.",
      )
    )
      return;
    setDeletingId(id);
    try {
      await api.delete(API_ENDPOINTS.policies.delete(id));
      toast.success("Policy deleted.");
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete policy.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await api.patch(API_ENDPOINTS.policies.toggle(id));
      toast.success("Policy status toggled.");
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle policy.");
    } finally {
      setTogglingId(null);
    }
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      return: "bg-blue-50 text-blue-700 border-blue-200",
      refund: "bg-emerald-50 text-emerald-700 border-emerald-200",
      replace: "bg-amber-50 text-amber-700 border-amber-200",
    };
    const icons: Record<string, React.ReactNode> = {
      return: <ArrowCounterClockwiseIcon className="h-3 w-3" />,
      refund: <MoneyIcon className="h-3 w-3" />,
      replace: <ArrowsClockwiseIcon className="h-3 w-3" />,
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[type] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}
      >
        {icons[type]}
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
            Policies Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create and manage return, refund, and replacement policies for the
            platform.
          </p>
        </div>
        <Button type="button" onClick={openCreateDialog} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <ShieldCheckIcon className="h-4 w-4" />
            <span className="font-medium">
              {policies.length} {policies.length === 1 ? "Policy" : "Policies"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPolicies}
            disabled={loading}
            className="font-medium"
          >
            {loading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowsClockwiseIcon className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
            <SpinnerIcon className="h-8 w-8 animate-spin mb-4 text-teal-500" />
            <p className="font-medium">Loading policies...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-zinc-50/30">
            <ShieldCheckIcon className="h-12 w-12 text-zinc-300 mb-3" />
            <p className="font-bold text-zinc-700">No policies yet</p>
            <p className="text-sm text-zinc-400">
              Create your first policy to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration Days</th>
                  <th className="px-6 py-4">Usage Count</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {policies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-zinc-800">
                          {policy.title}
                        </p>
                        {policy.description && (
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                            {policy.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{typeBadge(policy.type)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-semibold">
                          {policy.durationDays}
                        </span>
                        <span className="text-xs text-zinc-400">days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">
                        {policy._count?.products ?? 0}{" "}
                        {(policy._count?.products ?? 0) === 1
                          ? "product"
                          : "products"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          policy.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {policy.isActive ? "Active" : "Inactive"}
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
                          title={policy.isActive ? "Deactivate" : "Activate"}
                        >
                          {togglingId === policy.id ? (
                            <SpinnerIcon className="h-4 w-4 animate-spin" />
                          ) : policy.isActive ? (
                            <ToggleRightIcon className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeftIcon className="h-4 w-4 text-zinc-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(policy)}
                          title="Edit"
                        >
                          <PencilSimpleIcon className="h-4 w-4 text-zinc-500" />
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
                            <SpinnerIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
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
    </div>
  );
};
