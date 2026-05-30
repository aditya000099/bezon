import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GuestGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-primary"></div>
      </div>
    );
  }

  if (user) {
    const defaults = {
      customer: '/shop',
      seller: '/seller',
      delivery: '/delivery',
      admin: '/admin',
    };
    return <Navigate to={defaults[user.role]} replace />;
  }

  return <>{children}</>;
};
