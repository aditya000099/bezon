import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Guards
import { RoleGuard } from './RoleGuard';
import { GuestGuard } from './GuestGuard';

// Layouts
import { CustomerLayout } from '../layouts/CustomerLayout';
import { SellerLayout } from '../layouts/SellerLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { DeliveryLayout } from '../layouts/DeliveryLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';

// Customer Pages
import { ShopPage } from '../pages/customer/ShopPage';
import { ProductDetailPage } from '../pages/customer/ProductDetailPage';
import { CartPage } from '../pages/customer/CartPage';
import { CheckoutPage } from '../pages/customer/CheckoutPage';
import { OrdersPage } from '../pages/customer/OrdersPage';
import { OrderDetailPage } from '../pages/customer/OrderDetailPage';
import { WishlistPage } from '../pages/customer/WishlistPage';
import { ProfilePage } from '../pages/customer/ProfilePage';

// Seller Pages
import { SellerDashboard } from '../pages/seller/SellerDashboard';
import { SellerProducts } from '../pages/seller/SellerProducts';
import { SellerOrders } from '../pages/seller/SellerOrders';
import { SellerInventory } from '../pages/seller/SellerInventory';
import { SellerSettings } from '../pages/seller/SellerSettings';
import { SellerCoupons } from '../pages/seller/SellerCoupons';

// Delivery Pages
import { DeliveryQueue } from '../pages/delivery/DeliveryQueue';
import { DeliveryHistory } from '../pages/delivery/DeliveryHistory';
import { DeliveryProfile } from '../pages/delivery/DeliveryProfile';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminOrders } from '../pages/admin/AdminOrders';
import { AdminDeliveries } from '../pages/admin/AdminDeliveries';
import { AdminSellers } from '../pages/admin/AdminSellers';
import { AdminPartners } from '../pages/admin/AdminPartners';
import { AdminProducts } from '../pages/admin/AdminProducts';
import { SellerAddProduct } from '@/pages/seller/SellerAddProduct';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          path="/register"
          element={
            <GuestGuard>
              <RegisterPage />
            </GuestGuard>
          }
        />

        {/* Customer Route Group */}
        <Route
          path="/shop"
          element={
            <RoleGuard allowedRoles={['customer']}>
              <CustomerLayout />
            </RoleGuard>
          }
        >
          <Route index element={<ShopPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Seller Route Group */}
        <Route
          path="/seller"
          element={
            <RoleGuard allowedRoles={['seller']}>
              <SellerLayout />
            </RoleGuard>
          }
        >
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="add-product" element={<SellerAddProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="inventory" element={<SellerInventory />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route path="coupons" element={<SellerCoupons />} />
        </Route>

        {/* Delivery Route Group */}
        <Route
          path="/delivery"
          element={
            <RoleGuard allowedRoles={['delivery']}>
              <DeliveryLayout />
            </RoleGuard>
          }
        >
          <Route index element={<DeliveryQueue />} />
          <Route path="history" element={<DeliveryHistory />} />
          <Route path="profile" element={<DeliveryProfile />} />
        </Route>

        {/* Admin Route Group */}
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="deliveries" element={<AdminDeliveries />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="products" element={<AdminProducts />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
