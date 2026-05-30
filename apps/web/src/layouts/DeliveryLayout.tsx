import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, CheckSquare, History, User, LogOut } from 'lucide-react';

export const DeliveryLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const bottomNavItems = [
    { to: '/delivery', label: 'Tasks Queue', icon: CheckSquare },
    { to: '/delivery/history', label: 'Past Trips', icon: History },
    { to: '/delivery/profile', label: 'My Status', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto border-x border-slate-200 shadow-xl relative">
      {/* Mobile Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary animate-spin" />
          <h2 className="font-bold text-slate-800">Bezon Delivery</h2>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile Content (Scrollable) */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 h-16 flex items-center justify-around z-40 shadow-inner">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full text-xs font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
