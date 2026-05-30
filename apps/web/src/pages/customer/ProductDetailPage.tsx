import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShieldAlert } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="flex flex-col gap-6">
      <Link to="/shop" className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-semibold mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Shop
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-8">
        {/* Gallery */}
        <div className="flex-1 bg-slate-50 rounded-xl aspect-square flex items-center justify-center text-slate-400 font-bold border border-slate-100">
          Product Gallery Placeholder ({slug})
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase">Electronics</span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-3">Premium Wireless Headphones</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-amber-500 font-bold text-sm gap-0.5">
                <Star className="h-4 w-4 fill-amber-500" />
                <span>4.8</span>
              </div>
              <span className="text-slate-400 text-sm">| 42 reviews</span>
            </div>
          </div>

          <div className="border-y border-slate-100 py-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-950">₹4,999</span>
            <span className="text-slate-400 line-through text-sm">₹6,999</span>
            <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">Save 28%</span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            Experience premium acoustic definition with deep base and active noise cancellation. Styled for ergonomic comfort during long sessions.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Available Stock</label>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-slate-600 font-medium">12 units remaining in stock</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold shadow-md shadow-primary/10 transition-colors">
              Add to Shopping Cart
            </button>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-xl font-semibold transition-colors">
              Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
