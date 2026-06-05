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
    updateProfile: `${API_V1}/auth/profile`,
  },
  // Cart
  cart: {
    base: `${API_V1}/cart`,
    items: `${API_V1}/cart/items`,
    itemById: (id: string) => `${API_V1}/cart/items/${id}`,
  },
  // Wishlist
  wishlist: {
    base: `${API_V1}/wishlist`,
    toggle: (productId: string) => `${API_V1}/wishlist/toggle/${productId}`,
  },
  // Categories
  categories: `${API_V1}/categories`,
  // Media Uploads
  media: {
    upload: `${API_V1}/media/upload`,
  },
  // Products / Shop (Mock/Real routing placeholders)
  products: {
    recommended: `${API_V1}/products/recommended`,
    list: `${API_V1}/products`,
    detail: (slug: string) => `${API_V1}/products/${slug}`,
    coupons: (slug: string) => `${API_V1}/products/${slug}/coupons`,
    sellerMe: `${API_V1}/products/seller/me`,
    create: `${API_V1}/products`,
    update: (id: string) => `${API_V1}/products/${id}`,
    delete: (id: string) => `${API_V1}/products/${id}`,
    getById: (id: string) => `${API_V1}/products/id/${id}`,
    stats: (id: string) => `${API_V1}/products/${id}/stats`,
    deliveryEstimate: (id: string) => `${API_V1}/products/${id}/delivery-estimate`,
  },
  // Orders
  orders: {
    base: `${API_V1}/orders`,
    detail: (id: string) => `${API_V1}/orders/${id}`,
    updateStatus: (id: string) => `${API_V1}/orders/${id}/status`,
    policyAction: (id: string) => `${API_V1}/orders/${id}/policy-action`,
    sellerMe: `${API_V1}/orders/seller/me`,
    sellerDetail: (id: string) => `${API_V1}/orders/seller/me/${id}`,
    sellerCancel: (id: string) => `${API_V1}/orders/seller/me/${id}/cancel`,
    sellerApproveReturn: (id: string) => `${API_V1}/orders/seller/me/${id}/returns/approve`,
    sellerRejectReturn: (id: string) => `${API_V1}/orders/seller/me/${id}/returns/reject`,
    sellerInspectReturn: (id: string) => `${API_V1}/orders/seller/me/${id}/returns/inspect`,
    cancel: (id: string) => `${API_V1}/orders/${id}/cancel`,
    markRefundCompleted: (id: string) => `${API_V1}/orders/${id}/refund/complete`,
    requestReturn: (id: string) => `${API_V1}/orders/${id}/returns/request`,
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
  // Users
  users: {
    adminList: `${API_V1}/users/admin`,
  },
  // Addresses
  addresses: {
    base: `${API_V1}/addresses`,
    byId: (id: string) => `${API_V1}/addresses/${id}`,
  },
  // Reviews
  reviews: {
    list: (productId: string) => `${API_V1}/reviews/product/${productId}`,
    summary: (productId: string) =>
      `${API_V1}/reviews/product/${productId}/summary`,
  },
  // Questions & Answers
  qa: {
    list: (productId: string) => `${API_V1}/qa/product/${productId}`,
    ask: `${API_V1}/qa`,
    answer: `${API_V1}/qa/answer`,
    sellerQuestions: `${API_V1}/qa/seller`,
    sellerProducts: `${API_V1}/qa/seller/products`,
  },
  // Notifications
  notifications: {
    list: `${API_V1}/notifications`,
    unreadCount: `${API_V1}/notifications/unread-count`,
    markRead: (id: string) => `${API_V1}/notifications/${id}/read`,
    markAllRead: `${API_V1}/notifications/read-all`,
  },
  // Sellers
  sellers: {
    settings: `${API_V1}/sellers/settings`,
    stats: `${API_V1}/sellers/stats`,
    shop: (shopSlug: string) => `${API_V1}/sellers/shop/${shopSlug}`,
  },
  // Config
  config: {
    googleMapsKey: `${API_V1}/config/google-maps-key`,
  },
  // Delivery Partner
  delivery: {
    profile: `${API_V1}/delivery/profile`,
    location: `${API_V1}/delivery/location`,
    available: `${API_V1}/delivery/orders/available`,
    acceptAssignment: (id: string) => `${API_V1}/delivery/orders/${id}/accept`,
    queue: `${API_V1}/delivery/orders/assigned`,
    history: `${API_V1}/delivery/history`,
    updateStatus: (id: string) => `${API_V1}/delivery/assignments/${id}/status`,
    // Return Pickups
    availableReturns: `${API_V1}/delivery/returns/available`,
    acceptReturnPickup: (orderId: string) => `${API_V1}/delivery/returns/${orderId}/accept`,
    returnQueue: `${API_V1}/delivery/returns/assigned`,
    returnHistory: `${API_V1}/delivery/returns/history`,
    markReturnPickedUp: (orderId: string) => `${API_V1}/delivery/returns/${orderId}/pickup`,
    markReturnCompleted: (orderId: string) => `${API_V1}/delivery/returns/${orderId}/complete`,
  },
  // Policies
  policies: {
    list: `${API_V1}/policies`,
    create: `${API_V1}/policies`,
    update: (id: string) => `${API_V1}/policies/${id}`,
    toggle: (id: string) => `${API_V1}/policies/${id}/toggle`,
    delete: (id: string) => `${API_V1}/policies/${id}`,
  },
  // Support Chat
  support: {
    chat: `${API_V1}/support/chat`,
  },
} as const;

export default API_ENDPOINTS;
