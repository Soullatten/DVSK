import { apiClient } from './client';

export const authApi = {
  register: async (firebaseToken: string, name?: string) => {
    const response = await apiClient.post('/auth/register', { firebaseToken, name });
    return response.data.data;
  },

  login: async (firebaseToken: string) => {
    const response = await apiClient.post('/auth/login', { firebaseToken });
    return response.data.data;
  },

  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },
};
