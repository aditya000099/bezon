import React from 'react';

export const ShopPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 sm:p-12 text-white shadow-lg flex flex-col justify-center">
        <span className="bg-white/20 text-xs px-3 py-1 rounded-full w-max font-bold uppercase tracking-wider mb-3">Summer Launch</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">Upgrade Your Lifestyle</h1>
        <p className="text-white/80 max-w-md text-sm sm:text-base">Explore our curated selection of high-quality goods, sourced from verified sellers with fast delivery partners.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-xl p-6 shadow-sm shrink-0 h-fit">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Filters</h3>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> All Categories</label>
                <label className="flex items-center gap-2"><input type="checkbox" /> Electronics</label>
                <label className="flex items-center gap-2"><input type="checkbox" /> Apparel</label>
                <label className="flex items-center gap-2"><input type="checkbox" /> Home & Living</label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price Range</label>
              <input type="range" className="w-full accent-primary" min="100" max="10000" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>₹100</span>
                <span>₹10,000+</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-slate-500 font-semibold">Showing 4 mock products</p>
            <select className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 outline-none font-semibold text-slate-600">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 1, title: 'Premium Wireless Headphones', price: 4999, category: 'Electronics', stock: 12, rating: 4.8 },
              { id: 2, title: 'Minimalist Leather Wallet', price: 1499, category: 'Apparel', stock: 5, rating: 4.5 },
              { id: 3, title: 'Ergonomic Desk Chair', price: 12999, category: 'Home & Living', stock: 0, rating: 4.9 },
              { id: 4, title: 'Smart Fitness Band', price: 2999, category: 'Electronics', stock: 24, rating: 4.2 },
            ].map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-semibold">
                  Product Image Placeholder
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase">{p.category}</span>
                    <h4 className="font-bold text-slate-800 text-lg mt-1 line-clamp-2">{p.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-amber-500 font-bold mt-1">
                      <span>★ {p.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold text-slate-900">₹{p.price}</span>
                    {p.stock > 0 ? (
                      <button className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary/95 transition-colors">
                        Add to Cart
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-lg">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
