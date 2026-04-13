import { apiClient } from './client';
import type { Product, PaginatedProducts } from './types';

export const productsApi = {
  getProducts: async (params?: Record<string, any>) => {
    const response = await apiClient.get<PaginatedProducts>('/products', { params });
    return response.data;
  },

  getProductBySlug: async (slug: string) => {
    const response = await apiClient.get<{ success: boolean; data: Product }>(`/products/${slug}`);
    return response.data.data;
  },

  getFeatured: async () => {
    const response = await apiClient.get<{ success: boolean; data: Product[] }>('/products/featured');
    return response.data.data;
  },

  getNewArrivals: async () => {
    const response = await apiClient.get<{ success: boolean; data: Product[] }>('/products/new-arrivals');
    return response.data.data;
  }
};
