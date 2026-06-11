import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config/api.config';
import type { OrderDetail } from '@bezon/types';

export const fetchOrderDetail = createAsyncThunk(
  'order/fetchOrderDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(API_ENDPOINTS.orders.detail(id));
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ||
          'Failed to fetch order tracking details.',
      );
    }
  },
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (
    { id, cancelReason }: { id: string; cancelReason: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post(API_ENDPOINTS.orders.cancel(id), {
        cancelReason,
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to cancel order.',
      );
    }
  },
);

export const requestReturn = createAsyncThunk(
  'order/requestReturn',
  async (
    { id, reason, notes }: { id: string; reason: string; notes: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post(API_ENDPOINTS.orders.requestReturn(id), {
        reason,
        notes,
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to request return.',
      );
    }
  },
);

interface OrderState {
  order: OrderDetail | null;
  loading: boolean;
  error: string | null;

  reviewModalOpen: boolean;
  selectedOrderItem: { id: string; productId: string; title: string } | null;
  existingReview: any | null;

  returnModalOpen: boolean;
  returnReason: string;
  returnNotes: string;
  submittingReturn: boolean;

  cancelModalOpen: boolean;
  cancelReason: string;
  cancelling: boolean;
}

const initialState: OrderState = {
  order: null,
  loading: true,
  error: null,

  reviewModalOpen: false,
  selectedOrderItem: null,
  existingReview: null,

  returnModalOpen: false,
  returnReason: 'damaged',
  returnNotes: '',
  submittingReturn: false,

  cancelModalOpen: false,
  cancelReason: '',
  cancelling: false,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setReviewModalOpen(state, action: PayloadAction<boolean>) {
      state.reviewModalOpen = action.payload;
    },
    setSelectedOrderItem(
      state,
      action: PayloadAction<{
        id: string;
        productId: string;
        title: string;
      } | null>,
    ) {
      state.selectedOrderItem = action.payload;
    },
    setExistingReview(state, action: PayloadAction<any | null>) {
      state.existingReview = action.payload;
    },
    setReturnModalOpen(state, action: PayloadAction<boolean>) {
      state.returnModalOpen = action.payload;
    },
    setReturnReason(state, action: PayloadAction<string>) {
      state.returnReason = action.payload;
    },
    setReturnNotes(state, action: PayloadAction<string>) {
      state.returnNotes = action.payload;
    },
    setCancelModalOpen(state, action: PayloadAction<boolean>) {
      state.cancelModalOpen = action.payload;
    },
    setCancelReason(state, action: PayloadAction<string>) {
      state.cancelReason = action.payload;
    },
    resetReturnState(state) {
      state.returnReason = 'damaged';
      state.returnNotes = '';
      state.returnModalOpen = false;
    },
    resetCancelState(state) {
      state.cancelReason = '';
      state.cancelModalOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelOrder.pending, (state) => {
        state.cancelling = true;
      })
      .addCase(cancelOrder.fulfilled, (state) => {
        state.cancelling = false;
        state.cancelModalOpen = false;
        state.cancelReason = '';
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload as string;
      })
      .addCase(requestReturn.pending, (state) => {
        state.submittingReturn = true;
      })
      .addCase(requestReturn.fulfilled, (state) => {
        state.submittingReturn = false;
        state.returnModalOpen = false;
        state.returnReason = 'damaged';
        state.returnNotes = '';
      })
      .addCase(requestReturn.rejected, (state, action) => {
        state.submittingReturn = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setReviewModalOpen,
  setSelectedOrderItem,
  setExistingReview,
  setReturnModalOpen,
  setReturnReason,
  setReturnNotes,
  setCancelModalOpen,
  setCancelReason,
  resetReturnState,
  resetCancelState,
} = orderSlice.actions;

export default orderSlice.reducer;
