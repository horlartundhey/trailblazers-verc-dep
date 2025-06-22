import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API, { setAuthToken } from '../../utils/api';

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
      // Make the login request
      const res = await API.post('/api/auth/login', userData);
      const { token, user } = res.data.data;

      // Set token in API instance
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // First update the token in the state
      dispatch(setToken(token));

      return { user, token };
    } catch (error) {
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
  async (_, { rejectWithValue, getState, signal }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }

      const res = await API.get('/api/auth/me', { signal });
      return res.data.data;
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
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
  setAuthToken(null);
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
  profilePicture: user.profilePicture || null,
  position: user.position || null,
  trainings: user.trainings || [],
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
    updateUser: (state, action) => {
      state.user = normalizeUser(action.payload);
    }
  },  extraReducers: (builder) => {
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
        setAuthToken(action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        setAuthToken(null);
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
        setAuthToken(action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        setAuthToken(null);
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
        // On failure to fetch profile, keep existing auth state
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

export const { clearError, setToken, updateUser } = authSlice.actions;
export default authSlice.reducer;