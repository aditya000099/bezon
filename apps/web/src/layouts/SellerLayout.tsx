import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { API_ENDPOINTS } from "../config/api.config";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Package,
  Settings,
  LogOut,
  Store,
  Tag,
  Bell,
  MessageSquare,
} from "lucide-react";

export const SellerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.notifications.unreadCount);
        if (res.data.success) {
          setUnreadCount(res.data.data?.count ?? res.data.data ?? 0);
        }
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { to: "/seller", label: "Dashboard", icon: LayoutDashboard },
    { to: "/seller/products", label: "My Products", icon: ShoppingBag },
    { to: "/seller/coupons", label: "Coupons", icon: Tag },
    { to: "/seller/qa", label: "Q&A", icon: MessageSquare },
    { to: "/seller/orders", label: "Order Queue", icon: ClipboardList },
    { to: "/seller/inventory", label: "Inventory", icon: Package },
    { to: "/seller/settings", label: "Shop Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-slate-800">Bezon Seller</span>
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.to ||
              (link.to === "/seller/products" &&
                location.pathname.startsWith("/seller/add-product"));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-slate-800">Seller Dashboard</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/seller/qa")}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role} Account
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
