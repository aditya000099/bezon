import React from 'react';
import { Button } from '@bezon/ui';
import { MapPinIcon, TruckIcon, SpinnerIcon } from '@phosphor-icons/react';

interface ProductDeliveryEstimateProps {
  selectedAddress: any | null;
  customPincode: string;
  deliveryEstimate: {
    distanceKm: number;
    deliveryDays: number;
    sellerPincode: string;
    destinationPincode: string;
  } | null;
  loadingEstimate: boolean;
  estimateError: string;
  onOpenAddressModal: () => void;
}

export const ProductDeliveryEstimate: React.FC<ProductDeliveryEstimateProps> = ({
  selectedAddress,
  customPincode,
  deliveryEstimate,
  loadingEstimate,
  estimateError,
  onOpenAddressModal,
}) => {
  const getDeliveryDateString = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-4xl p-5 border border-slate-100/50 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
            <MapPinIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Deliver At
            </span>
            {selectedAddress ? (
              <div className="mt-0.5">
                <p className="text-sm font-extrabold text-slate-800 truncate">
                  {selectedAddress.fullName} · {selectedAddress.label}
                </p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {selectedAddress.line1}, {selectedAddress.city} - {selectedAddress.pincode}
                </p>
              </div>
            ) : (
              <div className="mt-0.5">
                <p className="text-sm font-extrabold text-slate-800">
                  Pincode: {customPincode}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Custom location estimate</p>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddressModal}
          className="rounded-xl border-slate-200 text-xs font-bold hover:bg-slate-100/80 shrink-0 self-center"
        >
          Change
        </Button>
      </div>

      <div className="border-t border-slate-100/80 pt-4 flex items-center justify-between gap-4">
        {loadingEstimate ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <SpinnerIcon className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Calculating shipping estimate...</span>
          </div>
        ) : estimateError ? (
          <p className="text-xs text-rose-500 font-semibold">{estimateError}</p>
        ) : deliveryEstimate ? (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <TruckIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-emerald-800">
                Delivery by {getDeliveryDateString(deliveryEstimate.deliveryDays)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Est. time: {deliveryEstimate.deliveryDays} days
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            Enter a valid address or pincode to check delivery times.
          </p>
        )}
      </div>
    </div>
  );
};
