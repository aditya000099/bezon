import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, SignOut, Storefront } from '@phosphor-icons/react';

export const CustomerNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-50 transition-all duration-500 ease-out flex justify-center w-full ${scrolled ? 'pt-4 px-4' : 'pt-0 px-0'}`}
    >
      <header
        className={`w-full transition-all duration-500 ease-out flex items-center justify-between ${
          scrolled
            ? 'max-w-5xl bg-white/80 backdrop-blur-2xl border border-white/40 h-14 px-6 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
            : 'max-w-7xl bg-zinc-50 border-b border-transparent h-20 px-4 sm:px-6 lg:px-8 rounded-none'
        }`}
      >
        <div className="flex items-center gap-8">
          <Link
            to="/shop"
            className="flex items-center gap-2 font-bold text-2xl text-zinc-900 hover:opacity-80 transition-opacity"
          >
            <Storefront className="h-7 w-7 text-teal-700" weight="fill" />
            <span className="tracking-tight">Bezon</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-500">
            <Link to="/shop" className="hover:text-zinc-900 transition-colors">
              Shop
            </Link>
            <Link
              to="/shop/orders"
              className="hover:text-zinc-900 transition-colors"
            >
              Orders
            </Link>
            <Link
              to="/shop/wishlist"
              className="hover:text-zinc-900 transition-colors"
            >
              Wishlist
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Cart Link with Badge */}
          <Link
            to="/shop/cart"
            className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors bg-white hover:bg-zinc-100 rounded-full"
          >
            <ShoppingCart className="h-5 w-5" weight="bold" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-700 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Profile info & Logout */}
          <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-zinc-200/50">
            <Link
              to="/shop/profile"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity bg-white hover:bg-zinc-100 p-1 pr-3 rounded-full border border-zinc-100"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-xs">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-extrabold text-zinc-800 leading-tight">
                  {user?.name.split(' ')[0]}
                </p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-zinc-400 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50"
            >
              <SignOut className="h-5 w-5" weight="bold" />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};
