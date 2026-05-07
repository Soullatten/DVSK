// Public newsletter-subscribe API. No auth — anyone with an email can
// subscribe from any signup form on the storefront.

const API_BASE_URL = "http://localhost:5000/api";

export interface SubscribeResult {
  id: string;
  email: string;
  alreadySubscribed: boolean;
}

export const subscribersApi = {
  // Subscribe an email to the DVSK newsletter. `source` tracks which form
  // the signup came from so the admin Subscribers list can show acquisition
  // channel — pass "footer", "checkout", "drop-page", etc.
  subscribe: async (email: string, source: string = "footer"): Promise<SubscribeResult> => {
    const res = await fetch(`${API_BASE_URL}/subscribers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    const body = await res.json();
    if (!res.ok || !body?.data) {
      throw new Error(body?.error?.message || body?.message || "Subscription failed");
    }
    return body.data;
  },

  unsubscribe: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/subscribers/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  },
};
