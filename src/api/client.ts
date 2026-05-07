import axios from 'axios';
import { auth } from '../firebase';

// In dev, points at the local Express backend on port 5000.
// In production (Vercel), set VITE_API_URL to your live backend URL —
// e.g. "https://dvsk-backend.onrender.com/api". Vite bakes this into the
// bundle at build time, so changing it requires a redeploy.
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true // Uncomment if you are using cookies for sessions
});

// Always attach the *freshest* Firebase ID token on outgoing requests.
// Firebase tokens expire after 1 hour — if we always read from localStorage
// (which is only updated by authBridge's onIdTokenChanged listener), we can
// race against the token's expiry mid-session. Calling getIdToken() lets
// the SDK refresh transparently when the cached token is close to expiring.
apiClient.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('dvsk_auth_token');
  try {
    if (auth.currentUser) {
      // getIdToken() returns the cached one if it's still fresh, or auto-
      // refreshes it via the refresh token if it's close to expiring.
      token = await auth.currentUser.getIdToken();
    }
  } catch {
    // Fall back to whatever's cached. The 401 handler below will catch
    // a genuinely expired token and force a refresh on retry.
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// One-shot retry on 401: if the backend rejects our token as expired,
// force-refresh via Firebase and replay the request once. Prevents the
// "Invalid or expired token" error from blocking checkout / orders fetches.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const config: any = error?.config;
    if (status === 401 && config && !config._retried && auth.currentUser) {
      try {
        config._retried = true;
        const fresh = await auth.currentUser.getIdToken(true); // force refresh
        localStorage.setItem('dvsk_auth_token', fresh);
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${fresh}`;
        return apiClient.request(config);
      } catch {
        // Couldn't refresh — fall through to original error
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
