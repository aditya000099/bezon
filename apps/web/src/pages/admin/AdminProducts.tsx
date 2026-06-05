import React from 'react';

export const AdminProducts: React.FC = () => {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-zinc-800 text-lg mb-2">
        Platform Catalogue Audit
      </h3>
      <p className="text-zinc-500 text-sm">
        Review published products, flag illegal items, and unpublish listings
        violating policies.
      </p>
    </div>
  );
};
