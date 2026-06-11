import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import { logger } from '../utils/logger';
import { API_ENDPOINTS } from '../config/api.config';

interface ReviewState {
  isSubmitting: boolean;
  isUploading: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  isSubmitting: false,
  isUploading: false,
  error: null,
};

export const uploadReviewImages = createAsyncThunk(
  'review/uploadImages',
  async (files: File[], { rejectWithValue }) => {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post(API_ENDPOINTS.media.upload, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return {
          url: res.data.data.url,
          s3Key: res.data.data.s3Key,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      return uploadedImages;
    } catch (err: any) {
      logger.error('Failed to upload review images', err);
      return rejectWithValue(err.response?.data?.message || 'Failed to upload image(s).');
    }
  }
);

interface SubmitReviewPayload {
  orderItemId: string;
  productId: string;
  rating: number;
  reviewText: string;
  images: any[];
}

export const submitReview = createAsyncThunk(
  'review/submit',
  async (payload: SubmitReviewPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/v1/reviews', payload);
      if (res.data.success) {
        return res.data.data;
      }
      return rejectWithValue('Failed to submit review');
    } catch (err: any) {
      logger.error('Failed to submit review', err);
      return rejectWithValue(err.response?.data?.message || 'Failed to submit review.');
    }
  }
);

interface UpdateReviewPayload {
  id: string;
  rating: number;
  reviewText: string;
  images: any[];
}

export const updateReview = createAsyncThunk(
  'review/update',
  async ({ id, ...payload }: UpdateReviewPayload, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/v1/reviews/${id}/edit`, payload);
      if (res.data.success) {
        return res.data.data;
      }
      return rejectWithValue('Failed to update review');
    } catch (err: any) {
      logger.error('Failed to update review', err);
      return rejectWithValue(err.response?.data?.message || 'Failed to update review.');
    }
  }
);

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uploadReviewImages.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadReviewImages.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadReviewImages.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      })
      .addCase(submitReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      .addCase(updateReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });
  },
});

export default reviewSlice.reducer;
