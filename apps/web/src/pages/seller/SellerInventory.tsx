import React from 'react';

export const SellerInventory: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 text-lg mb-2">Inventory Stock Level</h3>
      <p className="text-slate-500 text-sm">Configure stock thresholds per variant, view low-stock warnings, and trigger bulk updates.</p>
    </div>
  );
};
