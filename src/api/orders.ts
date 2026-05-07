import { apiClient } from './client';

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  color: string;
  image?: string | null;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  email?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number | string;
  shippingCost: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  shippingProvider?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address?: OrderAddress;
}

export const ordersApi = {
  createOrder: async (payload: {
    shippingAddress?: ShippingAddressInput;
    addressId?: string;
    couponCode?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/orders', payload);
    return response.data.data;
  },

  createPayment: async (orderId: string) => {
    const response = await apiClient.post('/payments/create-order', { orderId });
    return response.data.data;
  },

  verifyPayment: async (paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    const response = await apiClient.post('/payments/verify', paymentData);
    return response.data.data;
  },

  // List authenticated customer's orders (paginated server-side)
  list: async (page = 1, limit = 20): Promise<{ orders: OrderSummary[]; meta?: any }> => {
    const response = await apiClient.get('/orders', { params: { page, limit } });
    const body = response.data.data;
    // Backend may return { orders, meta } OR a bare array — handle both
    if (Array.isArray(body)) return { orders: body };
    return body;
  },

  // Single order detail (used by the tracking page)
  getById: async (orderId: string): Promise<OrderSummary> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data.data;
  },

  cancel: async (orderId: string) => {
    const response = await apiClient.post(`/orders/${orderId}/cancel`);
    return response.data.data;
  },
};
