import React from 'react';

export const DeliveryProfile: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-slate-800 text-lg mb-2">Courier Profile</h3>
      <p className="text-slate-500 text-sm">Configure vehicle type, number plate information, active availability toggle, and view aggregated rating details.</p>
    </div>
  );
};
