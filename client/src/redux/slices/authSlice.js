import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../utils/api';

// Action to set token in state
const setToken = (token) => ({
  type: 'auth/setToken',
  payload: token,
});

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Register request payload:', userData);
      const res = await API.post('/api/auth/register', userData);
      console.log('Register response:', res.data);
      const { token, user } = res.data.data;

      return { user, token };
    } catch (error) {
      console.error('Register error:', error.response?.data || error);
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      console.log('Login request payload:', userData);
      const res = await API.post('/api/auth/login', userData);
      console.log('Login response:', res.data);
      const { token, user } = res.data.data;

      // Set the token in Redux state before dispatching getCurrentUser
      dispatch(setToken(token));

      // Dispatch getCurrentUser to fetch the user profile
      await dispatch(getCurrentUser()).unwrap();

      return { user, token };
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Get current user
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      console.log('Get current user - Token:', token);
      if (!token) {
        return rejectWithValue('No token found');
      }

      const res = await API.get('/api/auth/me');
      console.log('Get current user response:', res.data);
      return res.data.data;
    } catch (error) {
      console.error('Get current user error:', error.response?.data || error);
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Authentication failed';
      return rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
  return null;
});

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Normalize user data to ensure consistent structure
const normalizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  region: user.region,
  campus: user.campus,
  memberCode: user.memberCode,
  registrationStatus: user.registrationStatus,
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })

      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })

      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = normalizeUser(action.payload);
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })

      // Logout case
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;