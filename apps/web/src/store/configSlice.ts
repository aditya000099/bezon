import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import { logger } from '../utils/logger';

interface ConfigState {
  googleMapsApiKey: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  googleMapsApiKey: null,
  loading: false,
  error: null,
};

export const fetchGoogleMapsKey = createAsyncThunk(
  'config/fetchGoogleMapsKey',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/v1/config/google-maps-key');
      if (res.data.success && res.data.data.googleMapsApiKey) {
        return res.data.data.googleMapsApiKey as string;
      }
      return rejectWithValue('Failed to get Google Maps API Key');
    } catch (err) {
      logger.error('Failed to fetch google maps key', err);
      return rejectWithValue('Failed to fetch google maps key');
    }
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoogleMapsKey.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoogleMapsKey.fulfilled, (state, action) => {
        state.loading = false;
        state.googleMapsApiKey = action.payload;
      })
      .addCase(fetchGoogleMapsKey.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default configSlice.reducer;
