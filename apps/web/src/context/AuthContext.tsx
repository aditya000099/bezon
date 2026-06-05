import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config/api.config';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'seller' | 'delivery' | 'admin';
  avatarUrl?: string;
  isActive: boolean;
  seller?: {
    id: string;
    shopName: string;
    shopSlug: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    rejectionReason: string | null;
    description?: string | null;
    gstin?: string | null;
    panNumber?: string | null;
    addressLine?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  } | null;
  deliveryPartner?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    vehicleType: string;
    vehicleNumber?: string | null;
    isAvailable: boolean;
    aadhaarNumber?: string | null;
    panNumber?: string | null;
    drivingLicense?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    rejectionReason: string | null;
    addressLine?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.auth.me);
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post(API_ENDPOINTS.auth.login, { email, password });
    if (response.data.success) {
      setUser(response.data.data);
      return response.data.data;
    }
    throw new Error('Login failed');
  };

  const logout = async () => {
    await api.post(API_ENDPOINTS.auth.logout);
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

