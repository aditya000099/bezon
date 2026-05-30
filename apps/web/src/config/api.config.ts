// Bezon Frontend API Endpoints Configuration

export const API_BASE = '/api';
export const API_V1 = `${API_BASE}/v1`;

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: `${API_V1}/auth/register`,
    login: `${API_V1}/auth/login`,
    logout: `${API_V1}/auth/logout`,
    me: `${API_V1}/auth/me`,
  },
  // Cart
  cart: {
    base: `${API_V1}/cart`,
    items: `${API_V1}/cart/items`,
    itemById: (id: string) => `${API_V1}/cart/items/${id}`,
  },
  // Products / Shop (Mock/Real routing placeholders)
  products: {
    list: `${API_V1}/products`,
    detail: (slug: string) => `${API_V1}/products/${slug}`,
  },
  // Orders
  orders: {
    base: `${API_V1}/orders`,
    detail: (id: string) => `${API_V1}/orders/${id}`,
  },
  // Payments
  payments: {
    createOrder: `${API_V1}/payments/create-order`,
    verify: `${API_V1}/payments/verify`,
  },
} as const;

export default API_ENDPOINTS;
