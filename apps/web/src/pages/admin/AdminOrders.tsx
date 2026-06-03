import React from 'react';

export const AdminOrders: React.FC = () => {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-zinc-800 text-lg mb-2">
        Platform Order Tracking
      </h3>
      <p className="text-zinc-500 text-sm">
        Review logs of all transactions placed across the platform and execute
        manual status updates.
      </p>
    </div>
  );
};
