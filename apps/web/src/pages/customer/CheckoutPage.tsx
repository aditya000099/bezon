import React from 'react';

export const CheckoutPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Checkout Process</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Checkout Details</h3>
        <p className="text-slate-600 text-sm">Please select a delivery address and input payment details via the Razorpay Sandbox gateway overlay.</p>
      </div>
    </div>
  );
};
