import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config/api.config';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { Wishlist } from '@bezon/types';

interface WishlistContextType {
  wishlistItems: Wishlist[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string, productTitle?: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchWishlist = async () => {
    if (!user || user.role !== 'customer') {
      setWishlistItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.wishlist.base);
      if (response.data.success) {
        setWishlistItems(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId: string, productTitle?: string) => {
    if (!user) {
      toast.warning('Please log in to manage your wishlist.');
      return;
    }
    if (user.role !== 'customer') {
      toast.warning('Only customers can manage wishlists.');
      return;
    }

    const exists = isInWishlist(productId);

    // Optimistic UI Update
    if (exists) {
      setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      // Mock addition locally until refetched
      const mockItem: Wishlist = {
        id: Math.random().toString(),
        userId: user.id,
        productId,
        addedAt: new Date().toISOString(),
      };
      setWishlistItems((prev) => [mockItem, ...prev]);
    }

    try {
      const response = await api.post(API_ENDPOINTS.wishlist.toggle(productId));
      if (response.data.success) {
        const added = response.data.data.added;
        if (added) {
          toast.success(productTitle ? `${productTitle} added to wishlist.` : 'Product added to wishlist.');
        } else {
          toast.success(productTitle ? `${productTitle} removed from wishlist.` : 'Product removed from wishlist.');
        }
        await fetchWishlist();
      }
    } catch (err) {
      // Rollback optimistic update
      await fetchWishlist();
      toast.error('Failed to update wishlist. Try again.');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        fetchWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
