import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchCart, addItem, updateQty, removeItem, clearCart } from '../store/cartSlice';
import type { CartItem } from '../store/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((state: RootState) => state.cart);

  const cartCount = items.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = items.reduce((acc, item) => acc + (Number(item.product.basePrice) * item.qty), 0);

  return {
    items,
    loading,
    fetchCart: async () => { await dispatch(fetchCart()); },
    addItem: async (productId: string, qty: number, priceSnapshot: number) => {
      await dispatch(addItem({ productId, qty, priceSnapshot })).unwrap();
    },
    updateQty: async (itemId: string, qty: number) => {
      await dispatch(updateQty({ itemId, qty })).unwrap();
    },
    removeItem: async (itemId: string) => {
      await dispatch(removeItem(itemId)).unwrap();
    },
    clearCart: () => { dispatch(clearCart()); },
    cartCount,
    cartTotal
  };
};

export type { CartItem };
