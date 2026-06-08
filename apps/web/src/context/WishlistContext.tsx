import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchWishlist, toggleWishlist, clearWishlist } from '../store/wishlistSlice';

export const useWishlist = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { wishlistItems, loading } = useSelector((state: RootState) => state.wishlist);
  const { user } = useSelector((state: RootState) => state.auth);

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  return {
    wishlistItems,
    loading,
    fetchWishlist: async () => { await dispatch(fetchWishlist()); },
    toggleWishlist: async (productId: string, productTitle?: string) => {
      await dispatch(toggleWishlist({ productId, productTitle, user })).unwrap();
    },
    isInWishlist,
    clearWishlist: () => { dispatch(clearWishlist()); }
  };
};
