import { apiClient } from './client';
import type { Product, PaginatedProducts } from './types';

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Storefront feels snappier when bouncing between /men, /women, /accessories.
// Cache is keyed by the URL+params; entries are kept for CACHE_TTL_MS or until
// the user reloads the page. Stale entries are still SHOWN immediately (so the
// page renders instantly) and the cache is then refreshed in the background.

const CACHE_TTL_MS = 60_000; // 1 minute hot cache; after that we re-validate.

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<any>>();

const cacheKey = (path: string, params?: Record<string, any>) => {
  if (!params) return path;
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${path}?${sorted}`;
};

/** Read cache, return entry if present (regardless of staleness). */
function readCache<T>(key: string): { data: T; stale: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  return { data: entry.data, stale: Date.now() - entry.ts > CACHE_TTL_MS };
}

function writeCache<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() });
}

export const productsApi = {
  getProducts: async (params?: Record<string, any>): Promise<PaginatedProducts> => {
    const key = cacheKey('/products', params);
    const hit = readCache<PaginatedProducts>(key);

    // Always trigger a network fetch so we eventually have fresh data
    const fetchPromise = apiClient
      .get<PaginatedProducts>('/products', { params })
      .then((res) => {
        writeCache(key, res.data);
        return res.data;
      });

    // Fresh hit → return cache immediately, don't even wait
    if (hit && !hit.stale) return hit.data;

    // Stale hit → return cache immediately, refresh in background
    if (hit && hit.stale) {
      fetchPromise.catch(() => {});
      return hit.data;
    }

    // Cold cache → wait for network
    return fetchPromise;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const key = `/products/${slug}`;
    const hit = readCache<Product>(key);
    const fetchPromise = apiClient
      .get<{ success: boolean; data: Product }>(`/products/${slug}`)
      .then((res) => {
        writeCache(key, res.data.data);
        return res.data.data;
      });
    if (hit && !hit.stale) return hit.data;
    if (hit && hit.stale) {
      fetchPromise.catch(() => {});
      return hit.data;
    }
    return fetchPromise;
  },

  getFeatured: async (): Promise<Product[]> => {
    const key = '/products/featured';
    const hit = readCache<Product[]>(key);
    const fetchPromise = apiClient
      .get<{ success: boolean; data: Product[] }>('/products/featured')
      .then((res) => {
        writeCache(key, res.data.data);
        return res.data.data;
      });
    if (hit && !hit.stale) return hit.data;
    if (hit && hit.stale) {
      fetchPromise.catch(() => {});
      return hit.data;
    }
    return fetchPromise;
  },

  getNewArrivals: async (): Promise<Product[]> => {
    const key = '/products/new-arrivals';
    const hit = readCache<Product[]>(key);
    const fetchPromise = apiClient
      .get<{ success: boolean; data: Product[] }>('/products/new-arrivals')
      .then((res) => {
        writeCache(key, res.data.data);
        return res.data.data;
      });
    if (hit && !hit.stale) return hit.data;
    if (hit && hit.stale) {
      fetchPromise.catch(() => {});
      return hit.data;
    }
    return fetchPromise;
  },

  /** Manually clear the cache (e.g. after the user creates a new product elsewhere). */
  clearCache: () => cache.clear(),
};
