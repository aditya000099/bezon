// ── Shared TypeScript Typings for Bezon ──────────────────────────────────────

export type UserRole = 'customer' | 'seller' | 'delivery' | 'admin';
export type SellerStatus = 'pending' | 'approved' | 'suspended';
export type ProductStatus = 'draft' | 'published' | 'archived';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'ready_for_pickup'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'delivery_failed'
  | 'return_requested'
  | 'return_approved'
  | 'returned_to_origin'
  | 'refunding'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refund_initiated'
  | 'refunded';

export type DeliveryStatus =
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'reattempt_needed'
  | 'returned_to_origin';

export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_failed'
  | 'return_requested'
  | 'return_approved'
  | 'new_task_assigned'
  | 'low_stock'
  | 'general';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Seller {
  id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  logoUrl?: string;
  status: SellerStatus;
  avgDispatchDays: number;
  bankAccountEnc?: string;
  ifscEnc?: string;
  gstin?: string;
  totalSales: number;
  totalOrders: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: User;
}

export interface DeliveryPartner {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleNumber?: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
  totalDelivered: number;
  totalFailed: number;
  rating?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | string;
  parent?: Category;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  cloudinaryId?: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date | string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  comparePrice?: number;
  stock: number;
  lowStockAlert: number;
  weightGrams?: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId?: string;
  title: string;
  slug: string;
  description?: string;
  brand?: string;
  status: ProductStatus;
  basePrice: number;
  comparePrice?: number;
  totalStock: number;
  metaTitle?: string;
  metaDesc?: string;
  viewCount: number;
  soldCount: number;
  avgRating?: number;
  reviewCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  seller?: Seller;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  qty: number;
  priceSnapshot: number;
  addedAt: Date | string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: CartItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantAttrs: Record<string, string>;
  sku: string;
  imageUrl?: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderTimeline {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  actorId?: string;
  actorRole?: UserRole;
  createdAt: Date | string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  sellerId: string;
  addressId: string;
  addressSnapshot: any;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  cancelReason?: string;
  idempotencyKey: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer?: User;
  seller?: Seller;
  items?: OrderItem[];
  timeline?: OrderTimeline[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
