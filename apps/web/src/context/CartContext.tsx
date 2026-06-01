import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config/api.config';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  productId: string;
  qty: number;
  priceSnapshot: number;
  product: {
    title: string;
    slug: string;
    sku: string;
    basePrice: number;
    totalStock: number;
    attributes: Record<string, string>;
    images: { url: string; isPrimary: boolean }[];
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, qty: number, priceSnapshot: number) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'customer') {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.cart.base);
      if (response.data.success) {
        setItems(response.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId: string, qty: number, priceSnapshot: number) => {
    if (!user) {
      return;
    }
    try {
      const response = await api.post(API_ENDPOINTS.cart.items, { productId, qty, priceSnapshot });
      if (response.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to add item to cart', err);
      throw err;
    }
  };

  const updateQty = async (itemId: string, qty: number) => {
    try {
      const response = await api.put(API_ENDPOINTS.cart.itemById(itemId), { qty });
      if (response.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to update cart qty', err);
      throw err;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await api.delete(API_ENDPOINTS.cart.itemById(itemId));
      if (response.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to remove cart item', err);
      throw err;
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const cartCount = items.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = items.reduce((acc, item) => acc + (Number(item.product.basePrice) * item.qty), 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      fetchCart,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
