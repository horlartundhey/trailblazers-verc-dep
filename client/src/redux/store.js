import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Persist config for auth slice (using key 'auth' to match existing storage)
const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'user', 'isAuthenticated'],
};

// Wrap auth reducer with persistence
const persistedAuthReducer = persistReducer(persistConfig, authReducer);

// Configure store with persisted auth reducer
const store = configureStore({
  reducer: { auth: persistedAuthReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Create persistor
export const persistor = persistStore(store);
export default store;