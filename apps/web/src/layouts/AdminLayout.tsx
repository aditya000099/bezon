import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  SquaresFour,
  Users,
  ShoppingBag,
  ClipboardText,
  ShieldWarning,
  Truck,
  SignOut,
  ShieldCheck,
  CurrencyDollar,
  ArrowCounterClockwise,
  Wallet,
} from "@phosphor-icons/react";

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/admin", label: "Dashboard", icon: SquaresFour },
    { to: "/admin/users", label: "Platform Users", icon: Users },
    { to: "/admin/orders", label: "All Orders", icon: ClipboardText },
    { to: "/admin/deliveries", label: "Delivery Partners", icon: Users },
    { to: "/admin/sellers", label: "Sellers Management", icon: ShieldWarning },
    { to: "/admin/partners", label: "Delivery Ops", icon: Truck },
    { to: "/admin/products", label: "Products Audit", icon: ShoppingBag },
    { to: "/admin/policies", label: "Policies", icon: ShieldCheck },
    { to: "/admin/refunds", label: "Refund Management", icon: CurrencyDollar },
    { to: "/admin/returns", label: "Returns", icon: ArrowCounterClockwise },
    { to: "/admin/wallets", label: "Wallets", icon: Wallet },
  ];

  return (
    <div className="h-screen bg-zinc-100 flex overflow-hidden">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-2 bg-zinc-950">
          <ShieldWarning className="h-6 w-6 text-primary" />
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
            <SignOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-800">
            Admin Control Panel
          </h2>
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
