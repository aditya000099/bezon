import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  MapPin,
  Package,
  Heart,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProfilePage: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center text-indigo-500 text-3xl font-bold shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {user?.name}
          </h1>
          <p className="text-slate-500 font-medium mt-1">{user?.email}</p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            {user?.role} Account
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Account Settings
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            <Link
              to="/shop/profile/edit"
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                Edit Profile
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
            <Link
              to="/shop/addresses"
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                Saved Addresses
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              My Orders
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            <Link
              to="/shop/orders"
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Package className="h-5 w-5" />
                </div>
                Recent Orders
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>
            <Link
              to="/shop/wishlist"
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
                  <Heart className="h-5 w-5" />
                </div>
                Wishlist
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Legal
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            <Link
              to="/shop/terms-and-conditions"
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                Terms & Conditions
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Link>
            <Link
              to="/shop/privacy-policy"
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Shield className="h-5 w-5" />
                </div>
                Privacy Policy
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Seller Account */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Seller Account
            </h2>
          </div>
          <div className="p-6">
            {!user?.seller && (
              <div className="text-center">
                <p className="text-slate-600 mb-4 text-sm">Have products to sell? Join our marketplace as a seller today.</p>
                <Link to="/shop/become-seller">
                  <Button className="w-full">Become a Seller</Button>
                </Link>
              </div>
            )}
            
            {user?.seller?.status === 'pending' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-500 rounded-full mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">Application Pending Review</h3>
                <p className="text-slate-500 text-sm">We are currently reviewing your application.</p>
              </div>
            )}

            {user?.seller?.status === 'rejected' && (
              <div className="text-center">
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm text-left mb-4">
                  <p className="font-semibold mb-1">Application Rejected</p>
                  <p>{user.seller.rejectionReason}</p>
                </div>
                <Link to="/shop/become-seller">
                  <Button variant="outline" className="w-full">Re-apply</Button>
                </Link>
              </div>
            )}

            {user?.seller?.status === 'approved' && (
              <div className="text-center flex flex-col gap-3">
                <p className="text-emerald-600 font-medium text-sm flex items-center justify-center gap-1">
                  <Shield className="h-4 w-4" /> Approved Seller
                </p>
                <Link to="/seller">
                  <Button className="w-full">Go to Seller Dashboard</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
