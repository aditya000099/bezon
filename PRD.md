# Bezon – Product Requirements Document
### Full E-commerce Ecosystem | Version 5.0 | May 2026
#### Stack: Single Frontend (TS/Tailwind/shadcn) · TypeScript Express Backend · Prisma ORM · PostgreSQL · Razorpay · Docker Containerization (AWS EC2)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Frontend Architecture — Single App, Role-Based Routing](#4-frontend-architecture)
5. [Database Schema — Prisma Models](#5-database-schema--prisma-models)
6. [Feature Specifications](#6-feature-specifications)
7. [Order Lifecycle State Machine](#7-order-lifecycle-state-machine)
8. [Inventory Rules](#8-inventory-rules)
9. [Razorpay Payment Flow](#9-razorpay-payment-flow)
10. [Edge Cases](#10-edge-cases)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Optional / Stretch Features](#12-optional--stretch-features)
13. [7-Day Development Plan](#13-7-day-development-plan)
14. [Docker Deployment Plan](#14-docker-deployment-plan)
15. [Seed Data Requirements](#15-seed-data-requirements)
16. [Deliverables Checklist](#16-deliverables-checklist)

---

## 1. Product Overview

**Bezon** is a multi-actor e-commerce platform. All four roles — customer, seller, delivery partner, admin — share **one React frontend** (`apps/web`). Role-based routing redirects each user to their section after login.

| Component | Description |
|---|---|
| `apps/web` | Single Vite + React + TypeScript frontend (all 4 roles) |
| `apps/api` | Express.js + TypeScript backend — REST API |

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | Vite + React + TypeScript | Strict typing, robust interfaces |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive utility classes and accessible UI library |
| **Backend** | Node.js + Express.js + TypeScript | TS for controllers, middleware, and request validation |
| **Database** | **PostgreSQL** | Mapped and queried via **Prisma ORM** |
| **Auth** | JWT (httpOnly cookies) + bcryptjs | Access tokens only (simplified auth, no refresh tokens) |
| **Payments** | **Razorpay (Sandbox)** | Pre-creation of orders in database before validation |
| **File uploads** | Cloudinary v2 | Multer → Cloudinary stream |
| **Email** | Nodemailer (SMTP) | Order notifications |
| **Monorepo** | npm workspaces | Workspaces config in root package.json |
| **Orchestration** | **Docker & Docker Compose** | Multi-container application setup |
| **Deployment** | **AWS EC2 (Dockerized)** | Serves API and Static Web assets through Docker containers |
| **Database host** | **AWS RDS (PostgreSQL)** | Managed RDS instance |

---

## 3. User Roles & Permissions

| Role | Default route after login | Can access |
|---|---|---|
| `customer` | `/shop` | `/shop/**`, `/cart`, `/checkout`, `/orders`, `/wishlist`, `/profile/**` |
| `seller` | `/seller` | `/seller/**` |
| `delivery` | `/delivery` | `/delivery/**` |
| `admin` | `/admin` | `/admin/**` |

`RoleGuard` (React Router) + `requireRole` middleware (Express) enforce boundaries at both layers.

---

## 4. Frontend Architecture

```
apps/web/src/
├── main.tsx
├── App.tsx                   ← AuthProvider + CartProvider + ToastProvider
├── router/
│   ├── AppRouter.tsx         ← All routes nested under role guards
│   ├── RoleGuard.tsx         ← Wrong role → own home; no auth → /login
│   └── GuestGuard.tsx        ← Logged-in users blocked from /login /register
├── context/
│   ├── AuthContext.tsx       ← user, login(), register(), logout()
│   ├── CartContext.tsx       ← items, addItem(), removeItem()
│   └── ToastContext.tsx      ← toast.success/error/info/warning()
├── lib/
│   └── api.ts                ← Axios (withCredentials, 401 intercept)
├── layouts/
│   ├── CustomerLayout.tsx    ← Top navbar + cart badge
│   ├── SellerLayout.tsx      ← Left sidebar, light theme
│   ├── AdminLayout.tsx       ← Left sidebar, dark theme
│   └── DeliveryLayout.tsx    ← Mobile header + bottom nav
├── pages/
│   ├── public/               ← Landing, Login, Register
│   ├── customer/             ← Shop, PDP, Cart, Checkout, Orders, Wishlist, Profile
│   ├── seller/               ← Dashboard, Products, Orders, Inventory, Analytics
│   ├── delivery/             ← Queue, TaskDetail, StatusUpdate, History
│   └── admin/                ← Dashboard, Users, Sellers, Partners, Orders, Deliveries
├── components/               ← Shared UI and custom features (shadcn/ui)
└── styles/index.css          ← Tailwind CSS setup
```

---

## 5. Database Schema — Prisma Models

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  customer
  seller
  delivery
  admin
}

enum SellerStatus {
  pending
  approved
  suspended
}

enum ProductStatus {
  draft
  published
  archived
}

enum OrderStatus {
  placed
  confirmed
  packed
  ready_for_pickup
  shipped
  out_for_delivery
  delivered
  cancelled
  delivery_failed
  return_requested
  return_approved
  returned_to_origin
  refunding
  refunded
}

enum PaymentStatus {
  pending
  paid
  failed
  refund_initiated
  refunded
}

enum DeliveryStatus {
  assigned
  accepted
  picked_up
  in_transit
  out_for_delivery
  delivered
  delivery_failed
  reattempt_needed
  returned_to_origin
}

enum NotificationType {
  order_placed
  order_confirmed
  order_shipped
  order_delivered
  order_cancelled
  order_failed
  return_requested
  return_approved
  new_task_assigned
  low_stock
  general
}

model User {
  id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String           @db.VarChar(120)
  email           String           @unique(map: "users_email_unique") @db.VarChar(254)
  phone           String?          @db.VarChar(20)
  passwordHash    String           @map("password_hash")
  role            UserRole         @default(customer)
  avatarUrl       String?          @map("avatar_url")
  isActive        Boolean          @default(true) @map("is_active")
  emailVerified   Boolean          @default(false) @map("email_verified")
  createdAt       DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime         @default(now()) @map("updated_at") @db.Timestamptz
  seller          Seller?
  deliveryPartner DeliveryPartner?
  addresses       Address[]
  carts           Cart?
  orders          Order[]
  notifications   Notification[]
  wishlists       Wishlist[]

  @@index([email])
  @@index([role])
  @@index([isActive])
  @@map("users")
}

model Seller {
  id               String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String       @unique(map: "sellers_user_unique") @map("user_id") @db.Uuid
  shopName         String       @map("shop_name") @db.VarChar(120)
  shopSlug         String       @unique(map: "sellers_slug_unique") @map("shop_slug") @db.VarChar(120)
  description      String?
  logoUrl          String?      @map("logo_url")
  status           SellerStatus @default(pending)
  avgDispatchDays  Int          @default(2) @map("avg_dispatch_days") @db.SmallInt
  bankAccountEnc   String?      @map("bank_account_enc")
  ifscEnc          String?      @map("ifsc_enc")
  gstin            String?      @db.VarChar(15)
  totalSales       Decimal      @default(0) @map("total_sales") @db.Decimal(14, 2)
  totalOrders      Int          @default(0) @map("total_orders")
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime     @default(now()) @map("updated_at") @db.Timestamptz
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade, map: "sellers_user_fk")
  products         Product[]
  orders           Order[]

  @@index([status])
  @@index([userId])
  @@map("sellers")
}

model DeliveryPartner {
  id             String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String      @unique(map: "dp_user_unique") @map("user_id") @db.Uuid
  vehicleType    String      @default("bike") @map("vehicle_type") @db.VarChar(30)
  vehicleNumber  String?     @map("vehicle_number") @db.VarChar(20)
  isAvailable    Boolean     @default(true) @map("is_available")
  currentLat     Decimal?    @map("current_lat") @db.Decimal(9, 6)
  currentLng     Decimal?    @map("current_lng") @db.Decimal(9, 6)
  totalDelivered Int         @default(0) @map("total_delivered")
  totalFailed    Int         @default(0) @map("total_failed")
  rating         Decimal?    @db.Decimal(3, 2)
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime    @default(now()) @map("updated_at") @db.Timestamptz
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade, map: "dp_user_fk")
  deliveries     Delivery[]

  @@index([isAvailable])
  @@index([userId])
  @@map("delivery_partners")
}

model Category {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String     @db.VarChar(80)
  slug        String     @unique @db.VarChar(80)
  description String?
  imageUrl    String?    @map("image_url")
  parentId    String?    @map("parent_id") @db.Uuid
  sortOrder   Int        @default(0) @map("sort_order") @db.SmallInt
  isActive    Boolean    @default(true) @map("is_active")
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz
  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id], onDelete: SetNull, map: "categories_parent_fk")
  children    Category[] @relation("CategoryToCategory")
  products    Product[]

  @@index([parentId])
  @@index([isActive])
  @@map("categories")
}

model Product {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sellerId     String        @map("seller_id") @db.Uuid
  categoryId   String?       @map("category_id") @db.Uuid
  title        String        @db.VarChar(255)
  slug         String        @unique @db.VarChar(255)
  description  String?
  brand        String?       @db.VarChar(80)
  status       ProductStatus @default(draft)
  basePrice    Decimal       @map("base_price") @db.Decimal(10, 2)
  comparePrice Decimal?      @map("compare_price") @db.Decimal(10, 2)
  totalStock   Int           @default(0) @map("total_stock")
  metaTitle    String?       @map("meta_title") @db.VarChar(160)
  metaDesc     String?       @map("meta_desc") @db.VarChar(320)
  viewCount    Int           @default(0) @map("view_count")
  soldCount    Int           @default(0) @map("sold_count")
  avgRating    Decimal?      @map("avg_rating") @db.Decimal(3, 2)
  reviewCount  Int           @default(0) @map("review_count")
  createdAt    DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime      @default(now()) @map("updated_at") @db.Timestamptz
  seller       Seller        @relation(fields: [sellerId], references: [id], onDelete: Cascade, map: "products_seller_fk")
  category     Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull, map: "products_category_fk")
  variants     ProductVariant[]
  images       ProductImage[]
  cartItems    CartItem[]
  orderItems   OrderItem[]
  wishlists    Wishlist[]

  @@index([sellerId])
  @@index([categoryId])
  @@index([status])
  @@index([basePrice])
  @@index([totalStock])
  @@map("products")
}

model ProductVariant {
  id            String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId     String      @map("product_id") @db.Uuid
  sku           String      @unique @db.VarChar(80)
  attributes    Json        @default("{}")
  price         Decimal     @db.Decimal(10, 2)
  comparePrice  Decimal?    @map("compare_price") @db.Decimal(10, 2)
  stock         Int         @default(0)
  lowStockAlert Int         @default(5) @map("low_stock_alert")
  weightGrams   Int?        @map("weight_grams")
  isActive      Boolean     @default(true) @map("is_active")
  createdAt     DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime    @default(now()) @map("updated_at") @db.Timestamptz
  product       Product     @relation(fields: [productId], references: [id], onDelete: Cascade, map: "pv_product_fk")
  cartItems     CartItem[]
  orderItems    OrderItem[]

  @@index([productId])
  @@index([stock])
  @@index([isActive])
  @@map("product_variants")
}

model ProductImage {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId    String   @map("product_id") @db.Uuid
  url          String
  cloudinaryId String?  @map("cloudinary_id")
  altText      String?  @map("alt_text") @db.VarChar(160)
  sortOrder    Int      @default(0) @map("sort_order") @db.SmallInt
  isPrimary    Boolean  @default(false) @map("is_primary")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade, map: "pi_product_fk")

  @@index([productId])
  @@map("product_images")
}

model Address {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  label     String   @default("Home") @db.VarChar(40)
  fullName  String   @map("full_name") @db.VarChar(120)
  phone     String   @db.VarChar(20)
  line1     String   @db.VarChar(200)
  line2     String?  @db.VarChar(200)
  city      String   @db.VarChar(80)
  state     String   @db.VarChar(80)
  pincode   String   @db.VarChar(10)
  country   String   @default("India") @db.VarChar(60)
  isDefault Boolean  @default(false) @map("is_default")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade, map: "addr_user_fk")

  @@index([userId])
  @@map("addresses")
}

model Cart {
  id        String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String     @unique @map("user_id") @db.Uuid
  createdAt DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime   @default(now()) @map("updated_at") @db.Timestamptz
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade, map: "carts_user_fk")
  items     CartItem[]

  @@map("carts")
}

model CartItem {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cartId        String         @map("cart_id") @db.Uuid
  productId     String         @map("product_id") @db.Uuid
  variantId     String         @map("variant_id") @db.Uuid
  qty           Int            @default(1) @db.SmallInt
  priceSnapshot Decimal        @map("price_snapshot") @db.Decimal(10, 2)
  addedAt       DateTime       @default(now()) @map("added_at") @db.Timestamptz
  cart          Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade, map: "ci_cart_fk")
  product       Product        @relation(fields: [productId], references: [id], onDelete: Cascade, map: "ci_product_fk")
  variant       ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade, map: "ci_variant_fk")

  @@unique([cartId, variantId], map: "ci_unique_variant")
  @@index([cartId])
  @@map("cart_items")
}

model Order {
  id                String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderNumber       String         @unique @map("order_number") @db.VarChar(20)
  customerId        String         @map("customer_id") @db.Uuid
  sellerId          String         @map("seller_id") @db.Uuid
  addressId         String         @map("address_id") @db.Uuid
  addressSnapshot   Json           @map("address_snapshot")
  status            OrderStatus    @default(placed)
  paymentStatus     PaymentStatus  @default(pending) @map("payment_status")
  razorpayOrderId   String?        @map("razorpay_order_id") @db.VarChar(64)
  razorpayPaymentId String?        @map("razorpay_payment_id") @db.VarChar(64)
  razorpaySignature String?        @map("razorpay_signature")
  subtotal          Decimal        @db.Decimal(12, 2)
  shippingCharge    Decimal        @default(0) @map("shipping_charge") @db.Decimal(10, 2)
  discount          Decimal        @default(0) @db.Decimal(10, 2)
  total             Decimal        @db.Decimal(12, 2)
  cancelReason      String?        @map("cancel_reason")
  idempotencyKey    String         @unique @default(dbgenerated("gen_random_uuid()")) @map("idempotency_key") @db.Uuid
  createdAt         DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime       @default(now()) @map("updated_at") @db.Timestamptz
  customer          User           @relation(fields: [customerId], references: [id], map: "orders_customer_fk")
  seller            Seller         @relation(fields: [sellerId], references: [id], map: "orders_seller_fk")
  items             OrderItem[]
  timeline          OrderTimeline[]
  delivery          Delivery?
  payments          Payment[]

  @@index([customerId])
  @@index([sellerId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt(sort: Desc)])
  @@index([razorpayOrderId])
  @@map("orders")
}

model OrderItem {
  id           String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId      String         @map("order_id") @db.Uuid
  productId    String         @map("product_id") @db.Uuid
  variantId    String         @map("variant_id") @db.Uuid
  productTitle String         @map("product_title") @db.VarChar(255)
  variantAttrs Json           @map("variant_attrs")
  sku          String         @db.VarChar(80)
  imageUrl     String?        @map("image_url")
  qty          Int            @db.SmallInt
  unitPrice    Decimal        @map("unit_price") @db.Decimal(10, 2)
  totalPrice   Decimal        @map("total_price") @db.Decimal(12, 2)
  order        Order          @relation(fields: [orderId], references: [id], onDelete: Cascade, map: "oi_order_fk")
  product      Product        @relation(fields: [productId], references: [id], map: "oi_product_fk")
  variant      ProductVariant @relation(fields: [variantId], references: [id], map: "oi_variant_fk")

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model OrderTimeline {
  id         String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId    String      @map("order_id") @db.Uuid
  status     OrderStatus
  note       String?
  actorId    String?     @map("actor_id") @db.Uuid
  actorRole  UserRole?   @map("actor_role")
  createdAt  DateTime    @default(now()) @map("created_at") @db.Timestamptz
  order      Order       @relation(fields: [orderId], references: [id], onDelete: Cascade, map: "ot_order_fk")

  @@index([orderId])
  @@index([createdAt])
  @@map("order_timeline")
}

model Delivery {
  id                String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId           String           @unique @map("order_id") @db.Uuid
  partnerId         String?          @map("partner_id") @db.Uuid
  status            DeliveryStatus   @default(assigned)
  proofImageUrl     String?          @map("proof_image_url")
  proofCloudinaryId String?          @map("proof_cloudinary_id")
  failureReason     String?          @map("failure_reason") @db.VarChar(200)
  failureNotes      String?          @map("failure_notes")
  attemptCount      Int              @default(0) @map("attempt_count") @db.SmallInt
  assignedAt        DateTime         @default(now()) @map("assigned_at") @db.Timestamptz
  acceptedAt        DateTime?        @map("accepted_at") @db.Timestamptz
  pickedUpAt        DateTime?        @map("picked_up_at") @db.Timestamptz
  deliveredAt       DateTime?        @map("delivered_at") @db.Timestamptz
  updatedAt         DateTime         @default(now()) @map("updated_at") @db.Timestamptz
  order             Order            @relation(fields: [orderId], references: [id], map: "del_order_fk")
  partner           DeliveryPartner? @relation(fields: [partnerId], references: [id], map: "del_partner_fk")
  timeline          DeliveryTimeline[]

  @@index([partnerId])
  @@index([status])
  @@index([orderId])
  @@map("deliveries")
}

model DeliveryTimeline {
  id         String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  deliveryId String         @map("delivery_id") @db.Uuid
  status     DeliveryStatus
  note       String?
  lat        Decimal?       @db.Decimal(9, 6)
  lng        Decimal?       @db.Decimal(9, 6)
  createdAt  DateTime       @default(now()) @map("created_at") @db.Timestamptz
  delivery   Delivery       @relation(fields: [deliveryId], references: [id], onDelete: Cascade, map: "dt_delivery_fk")

  @@index([deliveryId])
  @@map("delivery_timeline")
}

model Wishlist {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  productId String   @map("product_id") @db.Uuid
  addedAt   DateTime @default(now()) @map("added_at") @db.Timestamptz
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade, map: "wl_user_fk")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade, map: "wl_product_fk")

  @@unique([userId, productId], map: "wl_unique")
  @@index([userId])
  @@map("wishlists")
}

model Notification {
  id        String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType
  title     String           @db.VarChar(120)
  body      String?
  data      Json             @default("{}")
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at") @db.Timestamptz
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade, map: "notif_user_fk")

  @@index([userId])
  @@index([isRead])
  @@index([createdAt(sort: Desc)])
  @@map("notifications")
}

model Payment {
  id                String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId           String        @map("order_id") @db.Uuid
  razorpayOrderId   String        @unique @map("razorpay_order_id") @db.VarChar(64)
  razorpayPaymentId String?       @map("razorpay_payment_id") @db.VarChar(64)
  razorpaySignature String?       @map("razorpay_signature")
  amountPaise       Int           @map("amount_paise")
  currency          String        @default("INR") @db.VarChar(3)
  status            PaymentStatus @default(pending)
  method            String?       @db.VarChar(30)
  errorCode         String?       @map("error_code") @db.VarChar(40)
  errorDesc         String?       @map("error_desc")
  capturedAt        DateTime?     @map("captured_at") @db.Timestamptz
  refundedAt        DateTime?     @map("refunded_at") @db.Timestamptz
  refundId          String?       @map("refund_id") @db.VarChar(64)
  createdAt         DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime      @default(now()) @map("updated_at") @db.Timestamptz
  order             Order         @relation(fields: [orderId], references: [id], map: "pay_order_fk")

  @@index([orderId])
  @@index([razorpayPaymentId])
  @@map("payments")
}
```

---

## 6. Feature Specifications

### 6.1 Multi-Seller Cart Behavior
Customers can construct a shopping cart containing products offered by different merchants (multi-seller cart). 

When checkout is initiated, the system handles order creation through a **split-checkout** flow:
- Cart items are grouped by their respective `sellerId`.
- For each group, a unique `Order` is generated representing that seller's subset of the cart.
- A single `razorpay_order_id` can cover the cumulative cart amount, or separate payments are initiated per sub-order.
- Each generated order has its own progress timeline and is dispatched, shipped, and fulfilled independently by its specific seller.

---

## 7. Order Lifecycle State Machine

```
PLACED (payment: pending)
  ├─ [customer pays / verify success] → CONFIRMED (payment: paid)
  │     └─ [seller packs]             → PACKED
  │           └─ [ready]              → READY_FOR_PICKUP
  │                 └─ [picked up]    → SHIPPED → OUT_FOR_DELIVERY
  │                                                   ├─ [success] → DELIVERED
  │                                                   │                └─ [return req] → RETURN_REQUESTED
  │                                                   │                       └─ [approved] → RETURN_APPROVED
  │                                                   │                              └─ [returned] → REFUNDING → REFUNDED
  │                                                   └─ [fail] → DELIVERY_FAILED
  │                                                                  └─ [returned] → RETURNED_TO_ORIGIN
  ├─ [customer cancels before PACKED] → CANCELLED (stock restored)
  └─ [seller rejects / verify fail]   → CANCELLED (stock restored)
```

**Payment states** (separate): `pending → paid → refund_initiated → refunded`

---

## 8. Inventory Rules

All stock changes use atomic Prisma operations/transactions (`stock: { decrement: qty }`) with safety conditions or raw query fallbacks to prevent race conditions.

| Event | Stock Action |
|---|---|
| Checkout initiated (Order created) | Stock is reserved: Decrement `stock` where `stock >= qty` |
| Verification fails / Payment rejected | Restore: Increment `stock` |
| Order cancelled (before PACKED) | Restore: Increment `stock` |
| Seller rejects order | Restore |
| Delivery failed → returned to origin | Restore |
| Return approved + received | Restore |
| OOS at checkout | API returns 422 with per-item error |

---

## 9. Razorpay Payment Flow (Pre-Created Orders)

```
Customer clicks "Place Order"
        │
  POST /api/v1/payments/create-order
  → API validates cart, stock availability, and split-groups items by seller.
  → API creates one or more Order records in the database with status 'placed' and paymentStatus 'pending'.
  → API initiates a Razorpay Order matching the aggregate cart value.
  → Returns { ordersCreated[], razorpayOrderId, aggregateAmount, keyId }
        │
  Frontend opens Razorpay checkout modal
  (VITE_RAZORPAY_KEY_ID from env)
        │
  Customer pays (card / UPI / netbanking / wallet)
        │
  Razorpay returns { razorpayPaymentId, razorpaySignature }
        │
  POST /api/v1/payments/verify
  → API verifies HMAC-SHA256 signature
    (razorpayOrderId + "|" + razorpayPaymentId, secret)
  → On valid: update affected Order records to paymentStatus = 'paid' and status = 'confirmed'.
              fire notifications
  → On invalid / payment failure:
              mark affected Order records as status = 'cancelled' and paymentStatus = 'failed'.
              restore inventory stock levels (increment back)
        │
  Razorpay Webhook (backup):
  POST /api/v1/payments/webhook
  → Verify X-Razorpay-Signature header
  → Handle: payment.captured (mark paid/confirmed), payment.failed (cancel/restore stock)
```

**Key env vars:**
```
RAZORPAY_KEY_ID=rzp_test_...        (frontend VITE_RAZORPAY_KEY_ID)
RAZORPAY_KEY_SECRET=...             (API only — never exposed to browser)
RAZORPAY_WEBHOOK_SECRET=...         (for webhook signature verification)
```

---

## 10. Edge Cases

| Scenario | Handling |
|---|---|
| OOS at checkout | API validates stock before Order and Razorpay order creation; surface error |
| Stale cart price | `priceSnapshot` in cartItems vs current variant price; warn at checkout |
| Duplicate order | Unique `idempotencyKey` on orders table |
| Payment captured but verification fails | Webhook syncs state, marks paid and confirmed; idempotency prevents double |
| Seller rejects | CANCELLED → stock restored → customer notification |
| Cancel after packing | Blocked by status check; only allowed before PACKED |
| Delivery failure | Partner logs reason → DELIVERY_FAILED → returned/reattempted |
| Session expired | Axios 401 interceptor → `/login` |

---

## 11. Non-Functional Requirements

### Security
- Passwords: bcryptjs, 12 rounds
- JWT: httpOnly + Secure + SameSite=Strict cookies (access tokens only)
- Razorpay webhook: HMAC-SHA256 signature verification on every request
- API: Helmet, CORS allowlist, rate limiting (100/15min global, 10/15min auth)
- Cloudinary: signed upload preset, MIME type whitelist (jpg, png, webp)

### Performance
- Product listing: cursor-based pagination, 20/page
- DB pool: managed by Prisma connection limits, 30s idle timeout

### Reliability
- All API responses: `{ success, message, data }` shape
- Global error handler — no stack traces in production
- Prisma interactive transactions (`prisma.$transaction`) for multi-step atomic operations

---

## 12. Optional / Stretch Features

> Excluded from 7-day timeline.

| Feature | Notes |
|---|---|
| Razorpay refund automation | Auto-trigger refund on order cancellation |
| Coupon / promo engine | Fixed or percentage discount at checkout |
| Customer reviews | Star rating + text on PDP |
| Push notifications | Web Push API |
| Dynamic pricing | Stock-level based price rules |
| PWA offline mode | Delivery app cache |

---

## 13. 7-Day Development Plan

### Day 1 — Foundation & Auth
- PostgreSQL setup + `prisma migrate dev` (schema.prisma)
- Prisma clients and client singleton config
- Auth routes: register, login (httpOnly cookie JWT), logout, me (TypeScript types defined)
- `requireAuth` + `requireRole` middleware
- Frontend: AuthContext, LoginPage, RegisterPage, role layout skeletons in Tailwind + React TS
- Seed: admin, sellers, delivery partners, customers

### Day 2 — Products & Catalogue
- Product and variant queries (search/filter/slug), creation/modification
- Category endpoints
- Cloudinary direct-stream upload route
- Frontend: ShopPage, ProductDetailPage, SellerProductsPage, SellerProductFormPage, SellerInventoryPage

### Day 3 — Cart, Checkout & Orders
- Cart items and Orders database logic (multi-seller cart splitting)
- Razorpay endpoints: `POST /payments/create-order` (pre-creates orders) + `POST /payments/verify`
- Razorpay webhook handler
- Atomic stock decrement in interactive transactions
- Frontend: CartPage, CheckoutPage, OrderConfirmPage, OrderHistoryPage, OrderDetailPage
- Seller order queue + confirm/pack/ready actions

### Day 4 — Delivery System
- Delivery assignment and updates
- Auto-assign on `READY_FOR_PICKUP`
- Frontend: DeliveryQueuePage, TaskDetailPage, TaskUpdatePage (proof upload), History
- Admin: Deliveries page, manual assign
- Order status polling in OrderDetailPage

### Day 5 — Admin + Notifications + Inventory Polish
- Admin routes: stats, users, sellers approve/reject, partners create
- Notification model + in-app bell
- Nodemailer emails: order confirmation, shipped, failed, return
- Return flow: `POST /orders/:id/return` → admin approve → stock restore
- WishlistPage

### Day 6 — Polish & Edge Cases
- Stale price warning at cart
- Duplicate order idempotency guard
- Broken image fallback
- Loading skeletons, empty states, error boundary
- LandingPage — polished hero with role CTAs

### Day 7 — Docker Deployment & Demo Prep
- Production seed run on RDS
- Dockerfile setups for web and api
- docker-compose orchestrations
- All demo credentials verified
- README with URLs and credentials

---

## 14. Docker Deployment Plan

### Architecture

```
Internet
    │
    ▼
[Route 53]  bezon.app → EC2 Elastic IP
    │
    ▼
[EC2 Instance — t3.small, Amazon Linux 2023]
    │
    └── docker-compose (Orchestration)
          ├── bezon-web (Nginx container serving built React build static files)
          ├── bezon-api (Express node container running dist API endpoints)
          └── [PostgreSQL] (Optionally runs within Compose network)
```

### Docker Containers

- **bezon-api**: Built via dynamic multi-stage Dockerfile compiling typescript. Exposes internal port `5000`.
- **bezon-web**: Compiles production React TS bundle, assets are served from a thin Alpine Nginx container. Exposes port `80` (mapped to port `80` / `443` on EC2 host).
- Connection settings configured in a shared `.env` loaded directly during container orchestrations.

---

## 15. Seed Data Requirements

### Demo Credentials
| Role | Email | Password | Lands on |
|---|---|---|---|
| Admin | admin@bezon.app | Admin@1234 | `/admin` |
| Seller 1 | seller1@bezon.app | Seller@1234 | `/seller` |
| Seller 2 | seller2@bezon.app | Seller@1234 | `/seller` |
| Delivery | delivery1@bezon.app | Delivery@1234 | `/delivery` |
| Customer | customer1@bezon.app | Customer@1234 | `/shop` |

---

## 16. Deliverables Checklist

### Code
- [ ] `apps/web` — single React + TS frontend (all 4 roles) configured with Tailwind + shadcn/ui
- [ ] `apps/api` — Express + TypeScript + Prisma ORM + PostgreSQL backend
- [ ] `apps/api/prisma/schema.prisma` — full Prisma model definitions
- [ ] `apps/api/src/scripts/seed.ts` — TypeScript production seed script
- [ ] `.env.example` for both `apps/web` and `apps/api`

### Deployed (Docker)
- [ ] Docker Compose running backend Node API and frontend static Nginx proxy
- [ ] Razorpay webhook registered and verified

---
*Bezon Engineering | Version 5.0 | TS + Prisma + PostgreSQL + Razorpay + Docker | May 30, 2026*
