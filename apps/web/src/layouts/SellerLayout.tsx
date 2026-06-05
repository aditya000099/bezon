import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config/api.config';
import {
  SquaresFour,
  ShoppingBag,
  ClipboardText,
  Package,
  Gear,
  SignOut,
  Storefront,
  Tag,
  Bell,
  ChatTeardropText,
  Checks,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export const SellerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.notifications.unreadCount);
      if (res.data.success) {
        setUnreadCount(res.data.data?.count ?? res.data.data ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.notifications.list);
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/api/v1/notifications/${notif.id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
    setShowNotifications(false);
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/v1/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const links = [
    { to: '/seller', label: 'Dashboard', icon: SquaresFour },
    { to: '/seller/products', label: 'My Products', icon: ShoppingBag },
    { to: '/seller/coupons', label: 'Coupons', icon: Tag },
    { to: '/seller/qa', label: 'Q&A', icon: ChatTeardropText },
    { to: '/seller/orders', label: 'Order Queue', icon: ClipboardText },
    { to: '/seller/returns', label: 'Returns', icon: ArrowSquareOut },
    { to: '/seller/inventory', label: 'Inventory', icon: Package },
    { to: '/seller/settings', label: 'Shop Gear', icon: Gear },
  ];

  return (
    <div className="h-screen bg-zinc-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 gap-2 overflow-hidden">
          <Storefront className="h-6 w-6 text-primary shrink-0" />
          <span
            className="font-bold text-lg text-zinc-800 truncate"
            title={user?.seller?.shopName || 'Bezon Seller'}
          >
            {user?.seller?.shopName || 'Bezon Seller'}
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.to ||
              (link.to === '/seller/products' &&
                location.pathname.startsWith('/seller/add-product'));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <SignOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-zinc-800">Seller Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setShowNotifications((prev) => {
                    const next = !prev;
                    if (next) {
                      fetchNotifications();
                    }
                    return next;
                  });
                }}
                className="relative p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <h3 className="font-bold text-zinc-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                      >
                        <Checks className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-100 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-8 text-center text-zinc-400 text-sm">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-zinc-400 text-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 cursor-pointer transition-colors hover:bg-zinc-50 ${!notif.isRead ? 'bg-teal-50/50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4
                                className={`text-sm ${!notif.isRead ? 'font-bold text-zinc-900' : 'font-medium text-zinc-700'}`}
                              >
                                {notif.title}
                              </h4>
                              {!notif.isRead && (
                                <span className="h-2 w-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-2">
                              {notif.body}
                            </p>
                            <span className="text-[10px] text-zinc-400 mt-2 block">
                              {new Date(notif.createdAt).toLocaleString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-800">
                {user?.name}
              </p>
              <p className="text-xs text-zinc-500 capitalize">
                {user?.role} Account
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 font-semibold">
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
