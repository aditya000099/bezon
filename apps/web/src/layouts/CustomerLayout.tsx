import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Heart, Package, User as UserIcon, LogOut, Store } from 'lucide-react';

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/shop" className="flex items-center gap-2 font-bold text-2xl text-primary">
              <Store className="h-7 w-7 text-primary" />
              <span>Bezon</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link to="/shop" className="hover:text-primary transition-colors">Shop Products</Link>
              <Link to="/shop/orders" className="hover:text-primary transition-colors">My Orders</Link>
              <Link to="/shop/wishlist" className="hover:text-primary transition-colors">Wishlist</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Cart Link with Badge */}
            <Link to="/shop/cart" className="relative p-2 text-slate-600 hover:text-primary transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile info & Logout */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <Link to="/shop/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-500 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Bezon Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
