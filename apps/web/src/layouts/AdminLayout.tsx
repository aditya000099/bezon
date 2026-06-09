import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  SquaresFourIcon,
  UsersIcon,
  ClipboardTextIcon,
  ShieldWarningIcon,
  TruckIcon,
  SignOutIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ArrowCounterClockwiseIcon,
  WalletIcon,
  ListIcon,
  List as HamburgerIcon,
} from "@phosphor-icons/react";
import { Sheet, SheetContent, SheetTrigger } from '@bezon/ui';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/admin", label: "Dashboard", icon: SquaresFourIcon },
    { to: "/admin/users", label: "Platform Users", icon: UsersIcon },
    { to: "/admin/orders", label: "All Orders", icon: ClipboardTextIcon },
    { to: "/admin/categories", label: "Categories", icon: ListIcon },
    { to: "/admin/deliveries", label: "Delivery Ops", icon: TruckIcon },
    {
      to: "/admin/sellers",
      label: "Sellers Management",
      icon: ShieldWarningIcon,
    },
    { to: "/admin/partners", label: "Delivery Partners", icon: UsersIcon },
    { to: "/admin/policies", label: "Policies", icon: ShieldCheckIcon },
    {
      to: "/admin/refunds",
      label: "Refund Management",
      icon: CurrencyDollarIcon,
    },
    { to: "/admin/returns", label: "Returns", icon: ArrowCounterClockwiseIcon },
    { to: "/admin/wallets", label: "Wallets", icon: WalletIcon },
  ];

  return (
    <div className="h-screen bg-zinc-100 flex overflow-hidden">
      {/* Dark Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-zinc-900 text-zinc-300 flex-col shrink-0 h-full transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-2 bg-zinc-950">
          <ShieldWarningIcon className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-white">Bezon Admin</span>
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ease-out transform ${
                  isActive
                    ? "bg-primary text-white scale-100"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white hover:translate-x-1"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-rose-950 hover:text-rose-400 transition-colors"
          >
            <SignOutIcon className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 -ml-2 text-zinc-600 hover:text-zinc-900 focus:outline-none transition-colors">
                    <HamburgerIcon className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 flex flex-col bg-zinc-900 text-zinc-300 border-r-zinc-800">
                  <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-2 bg-zinc-950">
                    <ShieldWarningIcon className="h-6 w-6 text-primary animate-pulse" />
                    <span className="font-bold text-lg text-white">Bezon Admin</span>
                  </div>
                  <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
                    {links.map((link) => {
                      const Icon = link.icon;
                      const isActive = location.pathname === link.to;
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ease-out transform ${
                            isActive
                              ? "bg-primary text-white scale-100"
                              : "text-zinc-400 hover:bg-zinc-800 hover:text-white hover:translate-x-1"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-rose-950 hover:text-rose-400 transition-colors"
                    >
                      <SignOutIcon className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <h2 className="text-xl font-bold text-zinc-800">
              Admin Control Panel
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-800">
                {user?.name}
              </p>
              <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-700 font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
