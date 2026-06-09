import { logger } from "@/utils/logger";
import { Card, Button, Input, CardContent } from '@bezon/ui';
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, SpinnerIcon } from "@phosphor-icons/react";
import api from "../../lib/api";
import { API_ENDPOINTS } from "../../config/api.config";
import { useToast } from "../../context/ToastContext";

type PolicyType = "return" | "refund" | "replace";

const EMPTY_FORM = {
  type: "return" as PolicyType,
  title: "",
  description: "",
  durationDays: 7,
};

export const AdminPolicyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (id) {
      fetchPolicy(id);
    }
  }, [id]);

  const fetchPolicy = async (policyId: string) => {
    try {
      setLoading(true);
      // Wait, is there a get policy endpoint? The mock API might not have it exposed specifically if the policies list is available.
      // Usually we just hit the list and find it, or we expect a detail endpoint.
      // Let's hit the list and find it to be safe, since API_ENDPOINTS.policies doesn't explicitly have a getById.
      const res = await api.get(API_ENDPOINTS.policies.list);
      if (res.data.success) {
        const policy = res.data.data.find((p: any) => p.id === policyId);
        if (policy) {
          setForm({
            type: policy.type,
            title: policy.title,
            description: policy.description || "",
            durationDays: policy.durationDays,
          });
        } else {
          toast.error("Policy not found.");
          navigate("/admin/policies");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch policy");
      navigate("/admin/policies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (form.durationDays < 1) {
      toast.error("Duration must be at least 1 day.");
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        await api.put(API_ENDPOINTS.policies.update(id), form);
        toast.success("Policy updated successfully.");
      } else {
        await api.post(API_ENDPOINTS.policies.create, form);
        toast.success("Policy created successfully.");
      }
      navigate("/admin/policies");
    } catch (err: any) {
      logger.error("Policy save error:", err);
      toast.error(err.response?.data?.message || "Failed to save policy.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/policies")}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
            {id ? "Edit Policy" : "Create Policy"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {id
              ? "Modify the existing policy details below."
              : "Fill out the details to create a new return or refund policy."}
          </p>
        </div>
      </div>

      <Card className="bg-white border-zinc-200 shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Type *
                </label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as PolicyType })
                  }
                >
                  <option value="return">Return</option>
                  <option value="refund">Refund</option>
                  <option value="replace">Replace</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Title *
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 30-Day Easy Return"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Description
                </label>
                <textarea
                  className="flex min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                  placeholder="Describe the policy terms..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Duration (Days) *
                </label>
                <Input
                  type="number"
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm({ ...form, durationDays: Number(e.target.value) })
                  }
                  min={1}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/policies")}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={submitting}>
                  {submitting && <SpinnerIcon className="h-4 w-4 animate-spin mr-2" />}
                  {id ? "Save Changes" : "Create Policy"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
