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

  // Delivery partner profile must exist and be approved
  if (user.role !== 'admin' && user.deliveryPartner?.status !== 'approved') {
    return <Navigate to="/shop" replace />;
  }

  return <>{children}</>;
};
