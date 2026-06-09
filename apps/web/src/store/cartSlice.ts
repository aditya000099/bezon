import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import { logger } from '../utils/logger';
import { API_ENDPOINTS } from '../config/api.config';
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

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.cart.base);
      if (response.data.success) {
        return response.data.data.items || [];
      }
      return rejectWithValue('Failed to fetch');
    } catch (err) {
      logger.error(err);
      return rejectWithValue('Failed to fetch');
    }
  },
);

export const addItem = createAsyncThunk(
  'cart/add',
  async (
    { productId, qty, priceSnapshot }: any,
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_ENDPOINTS.cart.items, {
        productId,
        qty,
        priceSnapshot,
      });
      if (response.data.success) {
        dispatch(fetchCart());
        return true;
      }
      return rejectWithValue('Failed');
    } catch (err) {
      logger.error(err);
      return rejectWithValue('Failed');
    }
  },
);

export const updateQty = createAsyncThunk(
  'cart/update',
  async ({ itemId, qty }: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.put(API_ENDPOINTS.cart.itemById(itemId), {
        qty,
      });
      if (response.data.success) {
        dispatch(fetchCart());
        return true;
      }
      return rejectWithValue('Failed');
    } catch (err) {
      logger.error(err);
      return rejectWithValue('Failed');
    }
  },
);

export const removeItem = createAsyncThunk(
  'cart/remove',
  async (itemId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.delete(API_ENDPOINTS.cart.itemById(itemId));
      if (response.data.success) {
        dispatch(fetchCart());
        return true;
      }
      return rejectWithValue('Failed');
    } catch (err) {
      logger.error(err);
      return rejectWithValue('Failed');
    }
  },
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
