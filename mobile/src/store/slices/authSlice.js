import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios';
import { API_ENDPOINTS } from '../../constants/api';

// Async thunks for authentication actions
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Email verification failed. Please try again.'
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Password reset request failed. Please try again.'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Password reset failed. Please try again.'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Remove tokens from AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      // Check if token exists
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      
      // Get user profile
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      return response.data.data.user;
    } catch (error) {
      // Remove invalid tokens
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load user profile'
      );
    }
  }
);

export const restoreAuthToken = createAsyncThunk(
  'auth/restoreAuthToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Check if token exists in AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      console.log('Restoring auth tokens from AsyncStorage');
      console.log('Token exists in AsyncStorage:', !!token);
      console.log('Refresh token exists in AsyncStorage:', !!refreshToken);
      
      if (token && refreshToken) {
        // If tokens exist in AsyncStorage but not in Redux state, load the user
        console.log('Found tokens in AsyncStorage, loading user data');
        
        try {
          // Try to load user data, but don't fail if it doesn't work
          await dispatch(loadUser());
          console.log('User data loaded successfully');
        } catch (userError) {
          // If loading user fails, we'll still return the tokens
          // This ensures we can at least try to make API calls with the existing token
          console.log('Warning: Could not load user data, but tokens were found');
          console.log('Using tokens without verified user data');
        }
        
        return { token, refreshToken, forceAuthenticated: true };
      } else {
        console.log('No tokens found in AsyncStorage');
        return null;
      }
    } catch (error) {
      console.error('Error restoring auth tokens:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  emailVerified: false,
  passwordResetSent: false,
  passwordResetSuccess: false,
  message: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.authError = null;
    },
    clearAuthMessage: (state) => {
      state.message = null;
    },
    resetAuthState: (state) => {
      state.emailVerified = false;
      state.passwordResetSent = false;
      state.passwordResetSuccess = false;
      state.message = null;
      state.authError = null;
    },
    updateProfile: (state, action) => {
      if (action.payload.guide) {
        // If we're updating guide info, make sure we properly merge it
        state.user = {
          ...state.user,
          guide: {
            ...(state.user?.guide || {}),
            ...action.payload.guide
          }
        };
      } else if (action.payload.vehicleOwner) {
        // If we're updating vehicle owner info, make sure we properly merge it
        state.user = {
          ...state.user,
          vehicleOwner: {
            ...(state.user?.vehicleOwner || {}),
            ...action.payload.vehicleOwner
          }
        };
      } else if (action.payload._id && action.payload.email) {
        // We received a full user object from the API, replace the entire user
        state.user = action.payload;
      } else {
        // For other profile updates
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.authError = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.authError = action.payload;
      })
      
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.authError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.authError = action.payload;
      })
      
      // Verify email cases
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.authError = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emailVerified = true;
        state.message = action.payload.message;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.authError = action.payload;
      })
      
      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.authError = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.passwordResetSent = true;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.authError = action.payload;
      })
      
      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.authError = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.passwordResetSuccess = true;
        state.message = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.authError = action.payload;
      })
      
      // Logout case
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Load user cases
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      
      // Restore auth token
      .addCase(restoreAuthToken.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          
          // Force authentication state if tokens are valid
          if (action.payload.forceAuthenticated) {
            state.isAuthenticated = true;
          }
          
          console.log('Auth tokens restored to Redux state');
          console.log('isAuthenticated set to:', state.isAuthenticated);
        }
      })
      .addCase(restoreAuthToken.rejected, (state, action) => {
        console.log('Failed to restore auth tokens:', action.payload);
      });
  },
});

export const { clearAuthError, clearAuthMessage, resetAuthState, updateProfile } = authSlice.actions;

export default authSlice.reducer;