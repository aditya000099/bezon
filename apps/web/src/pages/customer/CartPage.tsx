import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const CartPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Your Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <ShoppingBag className="h-16 w-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Your cart is currently empty</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-xs text-center">Add high-quality products from the catalog to see them list here.</p>
          <Link to="/shop" className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg mt-6 hover:bg-primary/95 transition-colors">
            Start Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit flex flex-col gap-5">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">Order Summary</h3>
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="text-slate-500">Calculated at Checkout</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 flex justify-between font-bold text-lg text-slate-950">
            <span>Total</span>
            <span>₹0.00</span>
          </div>
          <button disabled className="w-full bg-slate-200 text-slate-400 py-3 rounded-xl font-bold transition-colors cursor-not-allowed">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};
