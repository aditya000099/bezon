import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerNavbar } from '../components/layout/CustomerNavbar';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col relative">
      <CustomerNavbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-50 border-t border-zinc-200/50 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold text-zinc-400">
            &copy; {new Date().getFullYear()} Bezon Marketplace. All rights
            reserved.
          </p>
          <div className="flex gap-4 text-xs font-bold text-zinc-400">
            <a
              href="/privacy-policy"
              className="hover:text-zinc-600 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms-and-conditions"
              className="hover:text-zinc-600 transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
