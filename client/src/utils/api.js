import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  // baseURL: 'https://trailblazers-verc-server.vercel.app',
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable to hold the store reference
let store = null;

// Function to set auth token in API instance
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete API.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Function to inject the store after initialization
export const setStore = (reduxStore) => {
  store = reduxStore;
};

// Check for token in localStorage on app start
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Set up request interceptor to add token to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Set up response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and notify store of logout
      setAuthToken(null);
      if (store) {
        store.dispatch({ type: 'auth/logout/fulfilled' });
      }
    }
    return Promise.reject(error);
  }
);

// Export the API instance as default
export default API;