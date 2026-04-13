import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cart';

export interface CartItem {
  id: string;           // cart-item key (for backend: cartItem.id, for local: `${productId}_${variantId}`)
  productId: string;
  variantId: string;
  name: string;
  variant: string;      // e.g. "Black / M"
  price: number;        // unit price
  qty: number;
  image: string;
  slug: string;
}

interface AddToCartPayload {
  productId: string;
  variantId: string;
  name: string;
  variant: string;
  price: number;
  image: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: AddToCartPayload, qty?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  loading: boolean;
  syncWithBackend: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getToken() {
  return localStorage.getItem('dvsk_auth_token');
}

function loadLocalCart(): CartItem[] {
  try {
    const saved = localStorage.getItem('dvsk_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items: CartItem[]) {
  localStorage.setItem('dvsk_cart', JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadLocalCart);
  const [loading, setLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    if (getToken()) {
      setUseBackend(true);
      syncWithBackend();
    }
  }, []);

  // Persist to localStorage whenever items change (always, as fallback)
  useEffect(() => {
    saveLocalCart(items);
  }, [items]);

  // Sync cart from backend API
  const syncWithBackend = useCallback(async () => {
    if (!getToken()) return;
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      if (data && data.items) {
        const mapped: CartItem[] = data.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.product.name,
          variant: `${item.variant.color} / ${item.variant.size}`,
          price: Number(item.variant.priceOverride || item.product.salePrice || item.product.basePrice),
          qty: item.quantity,
          image: '', // Backend cart doesn't include images in the nested select
          slug: item.product.slug,
        }));
        setItems(mapped);
        setUseBackend(true);
      }
    } catch (err) {
      console.warn('Cart sync failed, using local cart:', err);
      setUseBackend(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (payload: AddToCartPayload, qty: number = 1) => {
    // Try backend first if authenticated
    if (useBackend && getToken()) {
      try {
        setLoading(true);
        const data = await cartApi.addItem(payload.productId, payload.variantId, qty);
        if (data && data.items) {
          const mapped: CartItem[] = data.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            variant: `${item.variant.color} / ${item.variant.size}`,
            price: Number(item.variant.priceOverride || item.product.salePrice || item.product.basePrice),
            qty: item.quantity,
            image: '',
            slug: item.product.slug,
          }));
          setItems(mapped);
          return;
        }
      } catch (err) {
        console.warn('Backend addItem failed, falling back to local:', err);
      } finally {
        setLoading(false);
      }
    }

    // Local fallback
    setItems((prev) => {
      const key = `${payload.productId}_${payload.variantId}`;
      const existingIndex = prev.findIndex((i) => i.id === key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + qty,
        };
        return updated;
      }
      return [...prev, {
        id: key,
        productId: payload.productId,
        variantId: payload.variantId,
        name: payload.name,
        variant: payload.variant,
        price: payload.price,
        qty,
        image: payload.image,
        slug: payload.slug,
      }];
    });
  }, [useBackend]);

  const removeItem = useCallback(async (id: string) => {
    if (useBackend && getToken()) {
      try {
        setLoading(true);
        const data = await cartApi.removeItem(id);
        if (data && data.items) {
          const mapped: CartItem[] = data.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            variant: `${item.variant.color} / ${item.variant.size}`,
            price: Number(item.variant.priceOverride || item.product.salePrice || item.product.basePrice),
            qty: item.quantity,
            image: '',
            slug: item.product.slug,
          }));
          setItems(mapped);
          return;
        }
      } catch (err) {
        console.warn('Backend removeItem failed:', err);
      } finally {
        setLoading(false);
      }
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [useBackend]);

  const updateQty = useCallback(async (id: string, qty: number) => {
    if (qty < 1) return;

    if (useBackend && getToken()) {
      try {
        setLoading(true);
        const data = await cartApi.updateItem(id, qty);
        if (data && data.items) {
          const mapped: CartItem[] = data.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            variant: `${item.variant.color} / ${item.variant.size}`,
            price: Number(item.variant.priceOverride || item.product.salePrice || item.product.basePrice),
            qty: item.quantity,
            image: '',
            slug: item.product.slug,
          }));
          setItems(mapped);
          return;
        }
      } catch (err) {
        console.warn('Backend updateQty failed:', err);
      } finally {
        setLoading(false);
      }
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  }, [useBackend]);

  const clearCart = useCallback(async () => {
    if (useBackend && getToken()) {
      try {
        setLoading(true);
        await cartApi.clearCart();
      } catch (err) {
        console.warn('Backend clearCart failed:', err);
      } finally {
        setLoading(false);
      }
    }
    setItems([]);
  }, [useBackend]);

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, itemCount, subtotal, loading, syncWithBackend }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
