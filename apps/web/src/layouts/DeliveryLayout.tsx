import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  CompassIcon,
  CheckSquareIcon,
  ClockCounterClockwiseIcon,
  UserIcon,
  SignOutIcon,
} from "@phosphor-icons/react";

export const DeliveryLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const bottomNavItems = [
    { to: "/delivery", label: "Tasks Queue", icon: CheckSquareIcon },
    {
      to: "/delivery/history",
      label: "Past Trips",
      icon: ClockCounterClockwiseIcon,
    },
    { to: "/delivery/profile", label: "My Status", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col max-w-md mx-auto border-x border-zinc-200 shadow-xl relative">
      {/* Mobile Top Header */}
      <header className="h-14 bg-white border-b border-zinc-200 sticky top-0 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <CompassIcon className="h-5 w-5 text-primary animate-spin" />
          <h2 className="font-bold text-zinc-800">Bezon Delivery</h2>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="p-2 text-zinc-500 hover:text-rose-600 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <SignOutIcon className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile Content (Scrollable) */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-zinc-200 h-16 flex items-center justify-around z-40 shadow-inner">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full text-xs font-semibold transition-colors ${
                isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-800"
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
