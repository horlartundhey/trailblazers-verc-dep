import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable to hold the store reference
let store = null;

// Function to inject the store after initialization
export const setStore = (reduxStore) => {
  store = reduxStore;

  // Set up request interceptor to add token to all requests
  API.interceptors.request.use(
    (config) => {
      if (!store) {
        console.warn('Store not initialized in API interceptor');
        return config;
      }
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Set up response interceptor to handle 401 errors
  API.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401 && store) {
        // Dispatch logout action when token is invalid/expired
        store.dispatch({ type: 'auth/logout/fulfilled' });
        window.location.href = '/login'; // Redirect to login on 401
      }
      return Promise.reject(error);
    }
  );
};

// Export the API instance
export default API;