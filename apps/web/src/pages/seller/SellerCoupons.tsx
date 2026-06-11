import { Button, Card, CardHeader, CardTitle, CardContent } from '@bezon/ui';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export const SellerCoupons: React.FC = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
    if (!dateStr) return '-';
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
          asChild
          className="w-full sm:w-auto font-bold flex items-center gap-2"
        >
          <Link to="/seller/coupons/new">
            <PlusIcon className="h-4 w-4" /> Create Coupon
          </Link>
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
                    asChild
                  >
                    <Link to={`/seller/coupons/${coupon.id}/edit`}>
                      <PencilSimpleIcon className="h-4 w-4" />
                    </Link>
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
    </div>
  );
};
