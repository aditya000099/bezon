import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import api from '../lib/api';
import { logger } from '../utils/logger';
import { API_ENDPOINTS } from '../config/api.config';
import type { Wishlist } from '@bezon/types';
import { addToast } from './toastSlice';

interface WishlistState {
  wishlistItems: Wishlist[];
  loading: boolean;
}

const initialState: WishlistState = {
  wishlistItems: [],
  loading: false,
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.wishlist.base);
      if (response.data.success) {
        return response.data.data || [];
      }
      return rejectWithValue('Failed');
    } catch (err) {
      logger.error(err);
      return rejectWithValue('Failed');
    }
  },
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async (
    { productId, productTitle, user }: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { getState, dispatch, rejectWithValue },
  ) => {
    if (!user) {
      dispatch(
        addToast({
          message: 'Please log in to manage your wishlist.',
          type: 'warning',
        }),
      );
      return rejectWithValue('Not logged in');
    }
    if (user.role !== 'customer') {
      dispatch(
        addToast({
          message: 'Only customers can manage wishlists.',
          type: 'warning',
        }),
      );
      return rejectWithValue('Not customer');
    }

    try {
      const response = await api.post(API_ENDPOINTS.wishlist.toggle(productId));
      if (response.data.success) {
        const added = response.data.data.added;
        if (added) {
          dispatch(
            addToast({
              message: productTitle
                ? `${productTitle} added to wishlist.`
                : 'Product added to wishlist.',
              type: 'success',
            }),
          );
        } else {
          dispatch(
            addToast({
              message: productTitle
                ? `${productTitle} removed from wishlist.`
                : 'Product removed from wishlist.',
              type: 'success',
            }),
          );
        }
        dispatch(fetchWishlist());
        return { productId, added };
      }
      return rejectWithValue('Failed');
    } catch (err) {
      logger.error(err);
      dispatch(
        addToast({
          message: 'Failed to update wishlist. Try again.',
          type: 'error',
        }),
      );
      dispatch(fetchWishlist());
      return rejectWithValue('Failed');
    }
  },
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.wishlistItems = [];
    },
    optimisticToggle: (
      state,
      action: PayloadAction<{ productId: string; userId: string }>,
    ) => {
      const { productId, userId } = action.payload;
      const exists = state.wishlistItems.some((i) => i.productId === productId);
      if (exists) {
        state.wishlistItems = state.wishlistItems.filter(
          (i) => i.productId !== productId,
        );
      } else {
        state.wishlistItems.unshift({
          id: Math.random().toString(),
          userId,
          productId,
          addedAt: new Date().toISOString(),
        } as any);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlistItems = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { clearWishlist, optimisticToggle } = wishlistSlice.actions;
export default wishlistSlice.reducer;
