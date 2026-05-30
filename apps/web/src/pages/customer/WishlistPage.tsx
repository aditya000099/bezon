import React from 'react';

export const WishlistPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Your Wishlist</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <p className="text-slate-600 text-sm">Save your favorite products here to add them to your cart later.</p>
      </div>
    </div>
  );
};
