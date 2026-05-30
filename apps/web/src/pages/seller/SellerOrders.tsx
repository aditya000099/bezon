import React from 'react';

export const SellerOrders: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 text-lg mb-2">Incoming Order Queue</h3>
      <p className="text-slate-500 text-sm">Review placed customer orders. Perform dispatch actions (Confirm, Pack, and Mark Ready for Pickup).</p>
    </div>
  );
};
