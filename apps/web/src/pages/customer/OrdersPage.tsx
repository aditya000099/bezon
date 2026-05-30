import React from 'react';

export const OrdersPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Your Purchase History</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-2">Order Milestones</h3>
        <p className="text-slate-600 text-sm">Review your current active orders and tracking status logs.</p>
      </div>
    </div>
  );
};
