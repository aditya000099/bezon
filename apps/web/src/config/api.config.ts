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
  // Categories
  categories: `${API_V1}/categories`,
  // Media Uploads
  media: {
    upload: `${API_V1}/media/upload`,
  },
  // Products / Shop (Mock/Real routing placeholders)
  products: {
    list: `${API_V1}/products`,
    detail: (slug: string) => `${API_V1}/products/${slug}`,
    coupons: (slug: string) => `${API_V1}/products/${slug}/coupons`,
    sellerMe: `${API_V1}/products/seller/me`,
    create: `${API_V1}/products`,
    update: (id: string) => `${API_V1}/products/${id}`,
    delete: (id: string) => `${API_V1}/products/${id}`,
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
  // Coupons
  coupons: {
    create: `${API_V1}/coupons`,
    sellerMe: `${API_V1}/coupons/seller/me`,
    update: (id: string) => `${API_V1}/coupons/${id}`,
    delete: (id: string) => `${API_V1}/coupons/${id}`,
    apply: `${API_V1}/coupons/apply`,
    forCart: `${API_V1}/coupons/cart`,
  },
} as const;

export default API_ENDPOINTS;
