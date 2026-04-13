import { apiClient } from './client';
import type { Product } from './types';

export const searchApi = {
  search: async (q: string, params?: Record<string, any>) => {
    const response = await apiClient.get<{ success: boolean; data: Product[]; meta: any }>('/search', {
      params: { q, ...params },
    });
    return response.data;
  },

  suggestions: async (q: string) => {
    const response = await apiClient.get<{ success: boolean; data: Array<{ name: string; slug: string }> }>(
      '/search/suggestions',
      { params: { q } }
    );
    return response.data.data;
  },
};
