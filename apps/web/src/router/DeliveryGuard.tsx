import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface DeliveryGuardProps {
  children: React.ReactNode;
}

export const DeliveryGuard: React.FC<DeliveryGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'delivery') {
    return <Navigate to="/" replace />;
  }
  if (user.deliveryPartner?.status !== 'approved') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md">
          <h2 className="text-xl font-bold text-zinc-800 mb-2">
            Access Denied
          </h2>
          <p className="text-zinc-600 mb-6">
            Your delivery partner account is currently{' '}
            {user.deliveryPartner?.status}. You cannot access the delivery
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
