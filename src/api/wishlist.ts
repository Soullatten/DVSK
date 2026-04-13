import { apiClient } from './client';

export const wishlistApi = {
  getWishlist: async () => {
    const response = await apiClient.get('/wishlist');
    return response.data.data;
  },

  add: async (productId: string) => {
    const response = await apiClient.post(`/wishlist/${productId}`);
    return response.data;
  },

  remove: async (productId: string) => {
    const response = await apiClient.delete(`/wishlist/${productId}`);
    return response.data;
  },
};
