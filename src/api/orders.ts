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
  }
};
