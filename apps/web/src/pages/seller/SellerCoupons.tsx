import { logger } from "@/utils/logger";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@bezon/ui';
import React, { useState, useEffect } from 'react';
;
;
;
;
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  TagIcon,
  CalendarIcon,
  PercentIcon,
  HashIcon,
  SpinnerIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import type { Category, Product } from '@bezon/types';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  maxUses: number;
  maxUsesPerUser: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  scopeType: 'all' | 'category' | 'product' | 'variantGroup';
  scopeCategoryId?: string;
  scopeProductId?: string;
  scopeCategory?: { name: string };
  scopeProduct?: { title: string };
}

const defaultForm = {
  code: '',
  description: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: '',
  maxDiscount: '',
  minOrderValue: '0',
  maxUses: '100',
  maxUsesPerUser: '1',
  validFrom: '',
  validUntil: '',
  scopeType: 'all' as 'all' | 'category' | 'product' | 'variantGroup',
  scopeCategoryId: '',
  scopeProductId: '',
  applyToAllVariants: false,
};

export const SellerCoupons: React.FC = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentCouponId, setCurrentCouponId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(defaultForm);

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.coupons.sellerMe);
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    const loadMeta = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get(API_ENDPOINTS.categories.base),
          api.get(API_ENDPOINTS.products.sellerMe),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (err) {
        logger.error('Failed to load categories/products', err);
      }
    };
    loadMeta();
  }, []);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setCurrentCouponId(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setDialogMode('edit');
    setCurrentCouponId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      maxDiscount: coupon.maxDiscount?.toString() || '',
      minOrderValue: coupon.minOrderValue.toString(),
      maxUses: coupon.maxUses.toString(),
      maxUsesPerUser: coupon.maxUsesPerUser.toString(),
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 16) : '',
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 16) : '',
      scopeType:
        coupon.scopeType === 'variantGroup' ? 'product' : coupon.scopeType,
      scopeCategoryId: coupon.scopeCategoryId || '',
      scopeProductId:
        coupon.scopeType === 'variantGroup'
          ? products.find(
              (p) => p.variantGroupId === (coupon as any).scopeVariantGroupId,
            )?.id || ''
          : coupon.scopeProductId || '',
      applyToAllVariants: coupon.scopeType === 'variantGroup',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) {
      toast.error('Code and Discount Value are required.');
      return;
    }

    setSubmitting(true);
    try {
      let finalScopeType = form.scopeType;
      let finalScopeProductId =
        form.scopeType === 'product' ? form.scopeProductId : undefined;
      let finalScopeVariantGroupId = undefined;

      if (form.scopeType === 'product' && form.applyToAllVariants) {
        const selectedProduct = products.find(
          (p) => p.id === form.scopeProductId,
        );
        if (selectedProduct && selectedProduct.variantGroupId) {
          finalScopeType = 'variantGroup' as any;
          finalScopeVariantGroupId = selectedProduct.variantGroupId;
          finalScopeProductId = undefined;
        } else if (selectedProduct && !selectedProduct.variantGroupId) {
          toast.error('The selected product is not part of a variant group.');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        minOrderValue: Number(form.minOrderValue),
        maxUses: Number(form.maxUses),
        maxUsesPerUser: Number(form.maxUsesPerUser),
        validFrom: form.validFrom
          ? new Date(form.validFrom).toISOString()
          : undefined,
        validUntil: form.validUntil
          ? new Date(form.validUntil).toISOString()
          : undefined,
        scopeType: finalScopeType,
        scopeCategoryId:
          finalScopeType === 'category' ? form.scopeCategoryId : undefined,
        scopeProductId: finalScopeProductId,
        scopeVariantGroupId: finalScopeVariantGroupId,
      };

      if (dialogMode === 'create') {
        const res = await api.post(API_ENDPOINTS.coupons.create, payload);
        if (res.data.success) {
          toast.success('Coupon created successfully.');
          setIsDialogOpen(false);
          fetchCoupons();
        }
      } else {
        const res = await api.put(
          API_ENDPOINTS.coupons.update(currentCouponId!),
          payload,
        );
        if (res.data.success) {
          toast.success('Coupon updated successfully.');
          setIsDialogOpen(false);
          fetchCoupons();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await api.delete(API_ENDPOINTS.coupons.delete(id));
      if (res.data.success) {
        toast.success('Coupon deleted.');
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete coupon.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">
          My Coupons
        </h1>
        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto font-bold flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 text-zinc-400 gap-2">
          <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm font-semibold">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-75 text-zinc-400 p-8 border-dashed border-2 bg-white/50">
          <TagIcon className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="font-bold text-zinc-700">No coupons created yet</p>
          <p className="text-xs text-zinc-400 mt-1">
            Create your first coupon to offer discounts to customers.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className="bg-white border-zinc-200 shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-teal-500" />
                    <CardTitle className="text-base font-extrabold text-zinc-800 font-mono tracking-wider">
                      {coupon.code}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {coupon.isActive ? (
                      <ToggleRightIcon className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ToggleLeftIcon className="h-5 w-5 text-zinc-400" />
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${coupon.isActive ? 'text-emerald-600' : 'text-zinc-400'}`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {coupon.description && (
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {coupon.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-50 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Discount
                    </span>
                    <span className="font-extrabold text-zinc-800 flex items-center gap-1">
                      {coupon.discountType === 'percentage' ? (
                        <>
                          <PercentIcon className="h-3 w-3" />
                          {coupon.discountValue}%
                        </>
                      ) : (
                        <>₹{coupon.discountValue.toLocaleString()}</>
                      )}
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Usage
                    </span>
                    <span className="font-extrabold text-zinc-800 flex items-center gap-1">
                      <HashIcon className="h-3 w-3" />
                      {coupon.usedCount} / {coupon.maxUses}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-50 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Valid From
                    </span>
                    <span className="font-semibold text-zinc-700 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(coupon.validFrom)}
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Valid Until
                    </span>
                    <span className="font-semibold text-zinc-700 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(coupon.validUntil)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      coupon.scopeType === 'all'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : coupon.scopeType === 'category'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}
                  >
                    {coupon.scopeType === 'variantGroup'
                      ? 'Variants'
                      : coupon.scopeType}
                  </span>
                  {coupon.scopeCategory && (
                    <span className="text-[10px] text-zinc-500">
                      {coupon.scopeCategory.name}
                    </span>
                  )}
                  {coupon.scopeProduct && (
                    <span className="text-[10px] text-zinc-500 truncate">
                      {coupon.scopeProduct.title}
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-800"
                    onClick={() => handleOpenEdit(coupon)}
                  >
                    <PencilSimpleIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-800">
              {dialogMode === 'create' ? 'Create New Coupon' : 'Edit Coupon'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm">
              Configure coupon details, discount rules, and validity period.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Coupon Code *
                </label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    updateForm('code', e.target.value.toUpperCase())
                  }
                  placeholder="e.g. SUMMER25"
                  className="uppercase font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Description
                </label>
                <Input
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="e.g. Summer sale 25% off"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Discount Type *
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) => updateForm('discountType', e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-zinc-600 cursor-pointer h-10"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Discount Value *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.discountValue}
                  onChange={(e) => updateForm('discountValue', e.target.value)}
                  placeholder={
                    form.discountType === 'percentage' ? 'e.g. 25' : 'e.g. 500'
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Max Discount (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => updateForm('maxDiscount', e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Min Order Value (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) => updateForm('minOrderValue', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Max Uses
                </label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => updateForm('maxUses', e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Max Uses / User
                </label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxUsesPerUser}
                  onChange={(e) => updateForm('maxUsesPerUser', e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Valid From
                </label>
                <Input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => updateForm('validFrom', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Valid Until
                </label>
                <Input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => updateForm('validUntil', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Scope Type
                </label>
                <select
                  value={form.scopeType}
                  onChange={(e) => updateForm('scopeType', e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-zinc-600 cursor-pointer h-10"
                >
                  <option value="all">Global</option>
                  <option value="category">Category</option>
                  <option value="product">Product</option>
                </select>
              </div>

              {form.scopeType === 'category' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={form.scopeCategoryId}
                    onChange={(e) =>
                      updateForm('scopeCategoryId', e.target.value)
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-zinc-600 cursor-pointer h-10"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.scopeType === 'product' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Product
                  </label>
                  <select
                    value={form.scopeProductId}
                    onChange={(e) =>
                      updateForm('scopeProductId', e.target.value)
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg text-sm px-3 py-2 outline-none font-semibold text-zinc-600 cursor-pointer h-10"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>

                  {form.scopeProductId &&
                    products.find((p) => p.id === form.scopeProductId)
                      ?.variantGroupId && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="applyAll"
                          checked={form.applyToAllVariants}
                          onChange={(e) =>
                            updateForm('applyToAllVariants', e.target.checked)
                          }
                          className="rounded border-zinc-300 text-teal-600 focus:ring-teal-600"
                        />
                        <label
                          htmlFor="applyAll"
                          className="text-xs text-zinc-600"
                        >
                          Apply to all variants in this product's family
                        </label>
                      </div>
                    )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Submitting...'
                  : dialogMode === 'create'
                    ? 'Create Coupon'
                    : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
