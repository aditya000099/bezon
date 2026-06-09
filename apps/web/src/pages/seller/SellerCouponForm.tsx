import { Card, CardContent, CardFooter, Button, Input } from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SpinnerIcon } from '@phosphor-icons/react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api.config';
import { useToast } from '../../context/ToastContext';
import { logger } from '@/utils/logger';
import type { Category, Product } from '@bezon/types';

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

export const SellerCouponForm: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get(API_ENDPOINTS.categories.base),
          api.get(API_ENDPOINTS.products.sellerMe),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (prodRes.data.success)
          setProducts(prodRes.data.data.products || prodRes.data.data);

        if (isEditMode) {
          const couponRes = await api.get(API_ENDPOINTS.coupons.sellerMe);
          if (couponRes.data.success) {
            const coupons = couponRes.data.data;
            const coupon = coupons.find((c: any) => c.id === id);
            if (coupon) {
              setForm({
                code: coupon.code,
                description: coupon.description || '',
                discountType: coupon.discountType,
                discountValue: coupon.discountValue.toString(),
                maxDiscount: coupon.maxDiscount?.toString() || '',
                minOrderValue: coupon.minOrderValue.toString(),
                maxUses: coupon.maxUses.toString(),
                maxUsesPerUser: coupon.maxUsesPerUser.toString(),
                validFrom: coupon.validFrom
                  ? coupon.validFrom.slice(0, 16)
                  : '',
                validUntil: coupon.validUntil
                  ? coupon.validUntil.slice(0, 16)
                  : '',
                scopeType:
                  coupon.scopeType === 'variantGroup'
                    ? 'product'
                    : coupon.scopeType,
                scopeCategoryId: coupon.scopeCategoryId || '',
                scopeProductId:
                  coupon.scopeType === 'variantGroup' && prodRes.data.success
                    ? (prodRes.data.data.products || prodRes.data.data).find(
                        (p: any) =>
                          p.variantGroupId === coupon.scopeVariantGroupId,
                      )?.id || ''
                    : coupon.scopeProductId || '',
                applyToAllVariants: coupon.scopeType === 'variantGroup',
              });
            } else {
              toast.error('Coupon not found.');
              navigate('/seller/coupons');
            }
          }
        }
      } catch (err) {
        logger.error('Failed to load form data', err);
        toast.error('Failed to load data for coupon form.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEditMode, navigate, toast]);

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

      if (!isEditMode) {
        const res = await api.post(API_ENDPOINTS.coupons.create, payload);
        if (res.data.success) {
          toast.success('Coupon created successfully.');
          navigate('/seller/coupons');
        }
      } else {
        const res = await api.put(API_ENDPOINTS.coupons.update(id!), payload);
        if (res.data.success) {
          toast.success('Coupon updated successfully.');
          navigate('/seller/coupons');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save coupon.');
    } finally {
      setSubmitting(false);
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
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          {isEditMode ? 'Edit Coupon' : 'Create New Coupon'}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Configure coupon details, discount rules, and validity period.
        </p>
      </div>

      <Card className="bg-white border-zinc-200">
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Coupon Code *
                </label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    updateForm('code', e.target.value.toUpperCase())
                  }
                  placeholder="e.g. SUMMER25"
                  className="uppercase font-mono focus:ring-teal-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Description
                </label>
                <Input
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="e.g. Summer sale 25% off"
                  className="focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Discount Type *
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) => updateForm('discountType', e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md text-sm px-3 py-2 outline-none font-semibold text-zinc-700 cursor-pointer h-10 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="space-y-2">
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
                  className="focus:ring-teal-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Max Discount (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => updateForm('maxDiscount', e.target.value)}
                  placeholder="e.g. 1000"
                  className="focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Min Order Value (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) => updateForm('minOrderValue', e.target.value)}
                  placeholder="0"
                  className="focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Max Uses
                </label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => updateForm('maxUses', e.target.value)}
                  placeholder="100"
                  className="focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Max Uses / User
                </label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxUsesPerUser}
                  onChange={(e) => updateForm('maxUsesPerUser', e.target.value)}
                  placeholder="1"
                  className="focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Valid From
                </label>
                <Input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => updateForm('validFrom', e.target.value)}
                  className="focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Valid Until
                </label>
                <Input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => updateForm('validUntil', e.target.value)}
                  className="focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Scope Type
                </label>
                <select
                  value={form.scopeType}
                  onChange={(e) => updateForm('scopeType', e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md text-sm px-3 py-2 outline-none font-semibold text-zinc-700 cursor-pointer h-10 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Global</option>
                  <option value="category">Category</option>
                  <option value="product">Product</option>
                </select>
              </div>

              {form.scopeType === 'category' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={form.scopeCategoryId}
                    onChange={(e) =>
                      updateForm('scopeCategoryId', e.target.value)
                    }
                    className="w-full bg-white border border-zinc-200 rounded-md text-sm px-3 py-2 outline-none font-semibold text-zinc-700 cursor-pointer h-10 focus:ring-2 focus:ring-teal-500"
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
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Product
                  </label>
                  <select
                    value={form.scopeProductId}
                    onChange={(e) =>
                      updateForm('scopeProductId', e.target.value)
                    }
                    className="w-full bg-white border border-zinc-200 rounded-md text-sm px-3 py-2 outline-none font-semibold text-zinc-700 cursor-pointer h-10 focus:ring-2 focus:ring-teal-500"
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
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          type="checkbox"
                          id="applyAll"
                          checked={form.applyToAllVariants}
                          onChange={(e) =>
                            updateForm('applyToAllVariants', e.target.checked)
                          }
                          className="rounded border-zinc-300 text-teal-600 focus:ring-teal-600 h-4 w-4"
                        />
                        <label
                          htmlFor="applyAll"
                          className="text-sm font-medium text-zinc-700"
                        >
                          Apply to all variants in this product's family
                        </label>
                      </div>
                    )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3 rounded-b-xl py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/seller/coupons')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create Coupon'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
