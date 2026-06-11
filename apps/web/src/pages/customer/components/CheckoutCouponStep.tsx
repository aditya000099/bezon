import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
} from '@bezon/ui';
import {
  CheckCircleIcon,
  XIcon,
  TagIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
import api from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api.config';
import { useToast } from '../../../context/ToastContext';
import { fireConfetti } from '@/components/ui/confetti';

interface CheckoutCouponStepProps {
  appliedCoupon: any;
  setAppliedCoupon: (val: any) => void;
  availableCoupons: any[];
  couponLoading: boolean;
  setCouponLoading: (val: boolean) => void;
  couponCode: string;
  setCouponCode: (val: string) => void;
  couponError: string;
  setCouponError: (val: string) => void;
  showManualInput: boolean;
  setShowManualInput: (val: boolean) => void;
  handleApplyCoupon: () => void;
  removeCoupon: () => void;
}

export const CheckoutCouponStep: React.FC<CheckoutCouponStepProps> = ({
  appliedCoupon,
  setAppliedCoupon,
  availableCoupons,
  couponLoading,
  setCouponLoading,
  couponCode,
  setCouponCode,
  couponError,
  setCouponError,
  showManualInput,
  setShowManualInput,
  handleApplyCoupon,
  removeCoupon,
}) => {
  const { toast } = useToast();

  return (
    <Card className="bg-zinc-50/80 border-0 rounded-4xl p-4 sm:p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-zinc-800">
          3. Apply Coupon
        </CardTitle>
        <CardDescription className="text-zinc-500 mt-1">
          Select an available coupon or enter a code manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-800 text-sm">
                  {appliedCoupon.code}
                </p>
                <p className="text-xs text-emerald-600">
                  {appliedCoupon.description} - You save ₹
                  {appliedCoupon.discount.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {availableCoupons.length > 0 && (
              <div className="flex flex-col gap-2">
                {availableCoupons.map((c) => (
                  <div
                    key={c.id}
                    className="border-0 bg-white/60 rounded-2xl p-4 flex items-center justify-between hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-teal-50 rounded-xl px-3 py-2 shrink-0">
                        <span className="font-mono font-extrabold text-teal-700 text-xs tracking-wider">
                          {c.code}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-700 truncate">
                          {c.description}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {c.discountType === 'percentage'
                            ? `${Number(c.discountValue)}% off${c.maxDiscount ? ` (up to ₹${Number(c.maxDiscount)})` : ''}`
                            : `₹${Number(c.discountValue)} off`}
                          {Number(c.minOrderValue) > 0 &&
                            ` · Min ₹${Number(c.minOrderValue)}`}
                          {c.seller?.shopName && ` · ${c.seller.shopName}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 ml-3 font-bold text-xs h-9 px-5 border-0 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl"
                      disabled={couponLoading}
                      onClick={() => {
                        setCouponCode(c.code);
                        setCouponError('');
                        setCouponLoading(true);
                        api
                          .post(API_ENDPOINTS.coupons.apply, {
                            code: c.code,
                          })
                          .then((res: any) => {
                            if (res.data.success) {
                              setAppliedCoupon({
                                code: res.data.data.code,
                                discount: res.data.data.discount,
                                description: res.data.data.description,
                                finalTotal: res.data.data.finalTotal,
                              });
                              toast.success(
                                `Coupon ${res.data.data.code} applied! You save ₹${res.data.data.discount}`,
                              );
                              fireConfetti({
                                particleCount: 150,
                                spread: 100,
                              });
                            }
                          })
                          .catch((err: any) => {
                            const msg =
                              err.response?.data?.message ||
                              'Could not apply this coupon.';
                            setCouponError(msg);
                            toast.error(msg);
                          })
                          .finally(() => setCouponLoading(false));
                      }}
                    >
                      {couponLoading && couponCode === c.code ? (
                        <SpinnerIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {couponError && (
              <p className="text-rose-500 text-xs font-medium">{couponError}</p>
            )}

            {!showManualInput && availableCoupons.length > 0 ? (
              <button
                onClick={() => setShowManualInput(true)}
                className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1 mt-1"
              >
                <TagIcon className="h-3 w-3" /> Have a different code?
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Enter coupon code"
                      className="pl-9 uppercase"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleApplyCoupon()
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="font-bold px-6 border-0 bg-zinc-200/50 hover:bg-zinc-200 rounded-2xl"
                  >
                    {couponLoading ? (
                      <SpinnerIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
                {couponError && (
                  <p className="text-rose-500 text-xs">{couponError}</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
