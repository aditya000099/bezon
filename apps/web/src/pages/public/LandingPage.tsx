import React from 'react';
import { Link } from 'react-router-dom';
import {
  Storefront,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  Truck,
  ShoppingBag,
} from '@phosphor-icons/react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-2xl text-primary">
          <Storefront className="h-7 w-7 text-primary" />
          <span>Bezon</span>
        </div>
        <Link
          to="/login"
          className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/95 transition-colors shadow-md shadow-primary/20"
        >
          Sign In
        </Link>
      </header>

      {/* Main hero section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-16">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-zinc-900 tracking-tight leading-none mb-6">
          The Multi-Actor E-Commerce{' '}
          <span className="text-primary">Ecosystem</span>
        </h1>
        <p className="text-lg text-zinc-600 max-w-2xl mb-12">
          A high-performance monorepo platform connecting Customers, Sellers,
          Delivery agents, and Admins into one seamless shopping, dispatch, and
          delivery workflow.
        </p>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">
              Customers Portal
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              Browse products, build wishlists, pay via Razorpay Sandbox, and
              track shipments in real-time.
            </p>
            <Link
              to="/login"
              className="text-primary hover:underline text-sm font-semibold flex items-center gap-1"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">
              Seller Dashboard
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              Manage listings, adjust low-stock thresholds, monitor revenues,
              and dispatch incoming shipments.
            </p>
            <Link
              to="/login"
              className="text-emerald-600 hover:underline text-sm font-semibold flex items-center gap-1"
            >
              Sell Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">
              Delivery Partner
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              Accept assigned deliveries, capture photographic proof of receipt,
              and update tracking location.
            </p>
            <Link
              to="/login"
              className="text-blue-600 hover:underline text-sm font-semibold flex items-center gap-1"
            >
              Start Delivering <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">
              Platform Admin
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              Oversee accounts, approve vendor registrations, audit platform
              analytics, and manually reassign couriers.
            </p>
            <Link
              to="/login"
              className="text-zinc-700 hover:underline text-sm font-semibold flex items-center gap-1"
            >
              Admin Console <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-6 text-center text-zinc-500 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Bezon Inc. Built with TypeScript +
          Prisma + PostgreSQL + React + Tailwind v4.
        </p>
      </footer>
    </div>
  );
};
