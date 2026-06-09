import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import { logger } from '../utils/logger';
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

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.auth.me);
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue('Failed');
    } catch (err) {
      logger.error(err);
      return rejectWithValue('Error');
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.auth.login, {
        email,
        password,
      });
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue('Login failed');
    } catch (err) {
      logger.error(err);
      return rejectWithValue('Login failed');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post(API_ENDPOINTS.auth.logout);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer;
