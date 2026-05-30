import React from 'react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Shopper Profile</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <p className="text-slate-600 text-sm">Configure your personal information, delivery addresses, and login credentials here.</p>
      </div>
    </div>
  );
};
