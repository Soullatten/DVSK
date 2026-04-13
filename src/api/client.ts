import axios from 'axios';

// Ensure this matches the port your backend is actually running on (5000)
export const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true // Uncomment if you are using cookies for sessions
});

// Add interceptors to automatically attach Firebase auth token
apiClient.interceptors.request.use((config) => {
  // We will pull the token from localStorage or context later when auth is fully integrated
  const token = localStorage.getItem('dvsk_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
