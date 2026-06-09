import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '@bezon/ui';
import { ShieldCheckIcon } from '@phosphor-icons/react';

interface CheckoutSummaryPanelProps {
  cartTotal: number;
  appliedCoupon: any;
  isProcessing: boolean;
  itemsCount: number;
  handlePlaceOrder: (e: React.FormEvent) => void;
}

export const CheckoutSummaryPanel: React.FC<CheckoutSummaryPanelProps> = ({
  cartTotal,
  appliedCoupon,
  isProcessing,
  itemsCount,
  handlePlaceOrder,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-zinc-50/80 border-0 rounded-4xl p-4 sm:p-6">
        <CardHeader className="pb-4 border-b border-zinc-200/50">
          <CardTitle className="text-xl font-bold text-zinc-800">
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Subtotal</span>
            <span className="font-semibold text-zinc-900">
              ₹{cartTotal.toLocaleString()}
            </span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Coupon ({appliedCoupon.code})</span>
              <span className="font-semibold">
                -₹{appliedCoupon.discount.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Fulfillment Charges</span>
            <span className="text-emerald-600 font-semibold">FREE</span>
          </div>
          <div className="border-t border-zinc-100 pt-4 flex justify-between text-base font-extrabold text-zinc-900">
            <span>Grand Total</span>
            <span>
              ₹{(appliedCoupon ? appliedCoupon.finalTotal : cartTotal).toLocaleString()}
            </span>
          </div>
        </CardContent>
        <CardFooter className="px-0 pt-6">
          <Button
            className="w-full font-bold h-14 rounded-2xl text-base shadow-xl shadow-zinc-900/10"
            onClick={handlePlaceOrder}
            disabled={isProcessing || itemsCount === 0}
          >
            {isProcessing
              ? 'Generating Orders...'
              : `Place Order & Pay (₹${(appliedCoupon ? appliedCoupon.finalTotal : cartTotal).toLocaleString()})`}
          </Button>
        </CardFooter>
      </Card>

      <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 flex gap-3 text-xs text-zinc-600">
        <ShieldCheckIcon className="h-5 w-5 text-teal-500 shrink-0" />
        <p>
          Your orders are created before payment verification. Successful sandbox processing confirms your allocation.
        </p>
      </div>
    </div>
  );
};
