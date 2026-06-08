import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter, Button } from '@bezon/ui';
import { CreditCardIcon, WalletIcon, BankIcon, WarningCircleIcon, SpinnerIcon } from '@phosphor-icons/react';

interface CheckoutRazorpayModalProps {
  isRazorpayOpen: boolean;
  setIsRazorpayOpen: (open: boolean) => void;
  razorpayOrderId: string;
  cartTotal: number;
  appliedCoupon: any;
  paymentMethod: string;
  setPaymentMethod: (method: 'card' | 'upi' | 'netbanking') => void;
  isProcessing: boolean;
  handlePaymentFailure: () => void;
  handlePaymentSuccess: () => void;
}

export const CheckoutRazorpayModal: React.FC<CheckoutRazorpayModalProps> = ({
  isRazorpayOpen,
  setIsRazorpayOpen,
  razorpayOrderId,
  cartTotal,
  appliedCoupon,
  paymentMethod,
  setPaymentMethod,
  isProcessing,
  handlePaymentFailure,
  handlePaymentSuccess,
}) => {
  return (
    <Dialog open={isRazorpayOpen} onOpenChange={setIsRazorpayOpen}>
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-3xl border-0 shadow-[0_30px_60px_rgba(0,0,0,0.15)] p-8 rounded-[2.5rem]">
        <DialogHeader className="border-b border-zinc-200/50 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-extrabold text-zinc-900 text-lg uppercase tracking-tight font-sans">
                Razorpay <span className="text-teal-600">Sandbox</span>
              </span>
            </div>
            <span className="text-[10px] bg-zinc-100 text-zinc-500 font-bold px-2 py-0.5 rounded uppercase">
              Test Mode
            </span>
          </div>
          <DialogDescription className="text-left mt-2">
            Order Reference ID:{' '}
            <strong className="text-zinc-800 font-mono">{razorpayOrderId}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="my-8 space-y-6">
          <div className="bg-zinc-900 rounded-3xl p-6 flex justify-between items-center text-white shadow-xl">
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                Amount Payable
              </p>
              <p className="text-3xl font-black text-white mt-1">
                ₹{(appliedCoupon ? appliedCoupon.finalTotal : cartTotal).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm text-white rounded-xl px-3 py-2 font-bold text-xs border border-white/10">
              INR
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
              Choose Sandbox Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`border-0 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-zinc-900 text-white shadow-lg'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <CreditCardIcon className="h-5 w-5" />
                <span className="text-xs font-bold">Card</span>
              </button>

              <button
                onClick={() => setPaymentMethod('upi')}
                className={`border-0 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-zinc-900 text-white shadow-lg'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <WalletIcon className="h-5 w-5" />
                <span className="text-xs font-bold">UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod('netbanking')}
                className={`border-0 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === 'netbanking'
                    ? 'bg-zinc-900 text-white shadow-lg'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <BankIcon className="h-5 w-5" />
                <span className="text-xs font-bold">Netbank</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
            <WarningCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              This is a secure developer sandbox mimicking the Razorpay checkout overlay. You can trigger payment verification success or failure.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-4 pt-5 border-t border-zinc-200/50 w-full mt-2">
          <Button
            variant="ghost"
            className="flex-1 font-bold text-sm h-12 flex items-center justify-center gap-2 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
            onClick={handlePaymentFailure}
            disabled={isProcessing}
          >
            {isProcessing ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : 'Simulate Failure'}
          </Button>
          <Button
            className="flex-1 font-bold text-sm bg-zinc-900 text-white hover:bg-zinc-800 h-12 flex items-center justify-center gap-2 rounded-2xl shadow-xl shadow-zinc-900/20"
            onClick={handlePaymentSuccess}
            disabled={isProcessing}
          >
            {isProcessing ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : 'Simulate Success'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
