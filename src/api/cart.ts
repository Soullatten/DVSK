import { apiClient } from './client';
import type { CartResponse } from './types';

export const cartApi = {
  getCart: async () => {
    const response = await apiClient.get<CartResponse>('/cart');
    return response.data.data;
  },

  addItem: async (productId: string, variantId: string, quantity: number = 1) => {
    const response = await apiClient.post<CartResponse>('/cart/items', { productId, variantId, quantity });
    return response.data.data;
  },

  updateItem: async (itemId: string, quantity: number) => {
    const response = await apiClient.put<CartResponse>(`/cart/items/${itemId}`, { quantity });
    return response.data.data;
  },

  removeItem: async (itemId: string) => {
    const response = await apiClient.delete<CartResponse>(`/cart/items/${itemId}`);
    return response.data.data;
  },

  clearCart: async () => {
    const response = await apiClient.delete<CartResponse>('/cart');
    return response.data.data;
  },

  applyCoupon: async (code: string) => {
    const response = await apiClient.post('/cart/coupon', { code });
    return response.data;
  }
};
