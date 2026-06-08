import { Button } from '@bezon/ui';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserIcon,
  MapPinIcon,
  PackageIcon,
  HeartIcon,
  FileTextIcon,
  ShieldIcon,
  ShieldWarningIcon,
  SignOutIcon,
  CaretRightIcon,
  TruckIcon,
} from '@phosphor-icons/react';
;

export const ProfilePage: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();



  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-zinc-50/80 p-6 sm:p-10 rounded-[2rem]">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover border-[6px] border-white shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)]"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-teal-50 border-[6px] border-white flex items-center justify-center text-teal-500 text-3xl font-extrabold shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-extrabold text-zinc-900">
            {user?.name}
          </h1>
          <p className="text-zinc-500 font-medium mt-1">{user?.email}</p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-xs font-bold uppercase tracking-wider">
            {user?.role} Account
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-zinc-50/80 rounded-3xl overflow-hidden">
          <div className="p-5 bg-zinc-100/50">
            <h2 className="text-sm font-bold text-zinc-700 tracking-tight">
              Account Settings
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            <Link
              to="/profile/edit"
              className="flex items-center justify-between p-4 hover:bg-white/60 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700 font-medium">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 transition-colors">
                  <UserIcon className="h-5 w-5" />
                </div>
                Edit Profile
              </div>
              <CaretRightIcon className="h-5 w-5 text-zinc-400 group-hover:text-teal-600 transition-colors" />
            </Link>
            <Link
              to="/addresses"
              className="flex items-center justify-between p-4 hover:bg-white/60 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700 font-medium">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                Saved Addresses
              </div>
              <CaretRightIcon className="h-5 w-5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-zinc-50/80 rounded-3xl overflow-hidden">
          <div className="p-5 bg-zinc-100/50">
            <h2 className="text-sm font-bold text-zinc-700 tracking-tight">
              My Orders
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            <Link
              to="/orders"
              className="flex items-center justify-between p-4 hover:bg-white/60 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700 font-medium">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <PackageIcon className="h-5 w-5" />
                </div>
                Recent Orders
              </div>
              <CaretRightIcon className="h-5 w-5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
            </Link>
            <Link
              to="/wishlist"
              className="flex items-center justify-between p-4 hover:bg-white/60 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700 font-medium">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
                  <HeartIcon className="h-5 w-5" />
                </div>
                Wishlist
              </div>
              <CaretRightIcon className="h-5 w-5 text-zinc-400 group-hover:text-rose-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div className="bg-zinc-50/80 rounded-3xl overflow-hidden">
          <div className="p-5 bg-zinc-100/50">
            <h2 className="text-sm font-bold text-zinc-700 tracking-tight">
              Legal
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            <Link
              to="/terms-and-conditions"
              className="flex items-center justify-between p-4 hover:bg-white/60 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700 font-medium">
                <div className="p-2 bg-zinc-100 text-zinc-600 rounded-lg group-hover:bg-zinc-200 transition-colors">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                Terms & Conditions
              </div>
              <CaretRightIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </Link>
            <Link
              to="/privacy-policy"
              className="flex items-center justify-between p-4 hover:bg-white/60 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700 font-medium">
                <div className="p-2 bg-zinc-100 text-zinc-600 rounded-lg group-hover:bg-zinc-200 transition-colors">
                  <ShieldIcon className="h-5 w-5" />
                </div>
                Privacy Policy
              </div>
              <CaretRightIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Seller Account */}
        <div className="bg-zinc-50/80 rounded-3xl overflow-hidden">
          <div className="p-5 bg-zinc-100/50">
            <h2 className="text-sm font-bold text-zinc-700 tracking-tight">
              Seller Account
            </h2>
          </div>
          <div className="p-6">
            {!user?.seller && (
              <div className="text-center">
                <p className="text-zinc-600 mb-4 text-sm">
                  Have products to sell? Join our marketplace as a seller today.
                </p>
                <Link to="/become-seller">
                  <Button className="w-full">Become a Seller</Button>
                </Link>
              </div>
            )}

            {user?.seller?.status === 'pending' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-500 rounded-full mb-3">
                  <FileTextIcon className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-zinc-900 mb-1">
                  Application Pending Review
                </h3>
                <p className="text-zinc-500 text-sm">
                  We are currently reviewing your application.
                </p>
              </div>
            )}

            {user?.seller?.status === 'rejected' && (
              <div className="text-center">
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm text-left mb-4">
                  <p className="font-semibold mb-1">Application Rejected</p>
                  <p>{user.seller.rejectionReason}</p>
                </div>
                <Link to="/become-seller">
                  <Button variant="outline" className="w-full">
                    Re-apply
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Partner Account */}
        <div className="bg-zinc-50/80 rounded-3xl overflow-hidden">
          <div className="p-5 bg-zinc-100/50">
            <h2 className="text-sm font-bold text-zinc-700 tracking-tight">
              Delivery Partner Account
            </h2>
          </div>
          <div className="p-6">
            {!user?.deliveryPartner && (
              <div className="text-center">
                <p className="text-zinc-600 mb-4 text-sm">
                  Want to deliver orders? Join our team as a delivery partner.
                </p>
                <Link to="/become-delivery-partner">
                  <Button className="w-full">Become a Delivery Partner</Button>
                </Link>
              </div>
            )}

            {user?.deliveryPartner?.status === 'pending' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-500 rounded-full mb-3">
                  <FileTextIcon className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-zinc-900 mb-1">
                  Application Pending Review
                </h3>
                <p className="text-zinc-500 text-sm">
                  We are currently reviewing your application.
                </p>
              </div>
            )}

            {user?.deliveryPartner?.status === 'rejected' && (
              <div className="text-center">
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm text-left mb-4">
                  <p className="font-semibold mb-1">Application Rejected</p>
                  <p>{user.deliveryPartner.rejectionReason}</p>
                </div>
                <Link to="/become-delivery-partner">
                  <Button variant="outline" className="w-full">
                    Re-apply
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
