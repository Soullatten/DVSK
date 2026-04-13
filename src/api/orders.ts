import { apiClient } from './client';

export const ordersApi = {
  createOrder: async (addressId: string, couponCode?: string, notes?: string) => {
    const response = await apiClient.post('/orders', { addressId, couponCode, notes });
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
