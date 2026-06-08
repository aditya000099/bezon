import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// Guards
import { RoleGuard } from "./RoleGuard";
import { GuestGuard } from "./GuestGuard";
import { SellerGuard } from "./SellerGuard";
import { DeliveryGuard } from "./DeliveryGuard";

// Layouts
import { CustomerLayout } from "../layouts/CustomerLayout";
import { SellerLayout } from "../layouts/SellerLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { DeliveryLayout } from "../layouts/DeliveryLayout";

// Public Pages
import { LoginPage } from "../pages/public/LoginPage";
import { RegisterPage } from "../pages/public/RegisterPage";

// Customer Pages
import { ShopPage } from "../pages/customer/ShopPage";
import { ProductDetailPage } from "../pages/customer/ProductDetailPage";
import { CartPage } from "../pages/customer/CartPage";
import { CheckoutPage } from "../pages/customer/CheckoutPage";
import { OrdersPage } from "../pages/customer/OrdersPage";
import { OrderDetailPage } from "../pages/customer/OrderDetailPage";
import { WishlistPage } from "../pages/customer/WishlistPage";
import { ProfilePage } from "../pages/customer/ProfilePage";
import { EditProfilePage } from "../pages/customer/EditProfilePage";
import { AddressesPage } from "../pages/customer/AddressesPage";
import { TermsConditionsPage } from "../pages/customer/TermsConditionsPage";
import { PrivacyPolicyPage } from "../pages/customer/PrivacyPolicyPage";
import { BecomeSellerPage } from "../pages/customer/BecomeSellerPage";
import { SellerShopPage } from "../pages/customer/SellerShopPage";
import { BecomeDeliveryPartnerPage } from "../pages/customer/BecomeDeliveryPartnerPage";

// Seller Pages
import { SellerDashboard } from "../pages/seller/SellerDashboard";
import { SellerProducts } from "../pages/seller/SellerProducts";
import { SellerOrders } from "../pages/seller/SellerOrders";
import { SellerInventory } from "../pages/seller/SellerInventory";
import { SellerSettings } from "../pages/seller/SellerSettings";
import { SellerCoupons } from "../pages/seller/SellerCoupons";
import { SellerQA } from "@/pages/seller/SellerQA";
import { SellerEditProduct } from "../pages/seller/SellerEditProduct";
import { SellerStats } from "../pages/seller/SellerStats";
import { SellerReturns } from "../pages/seller/SellerReturns";
import { SellerReturnDetail } from "../pages/seller/SellerReturnDetail";
import { SellerOrderDetail } from "../pages/seller/SellerOrderDetail";
import { SellerAddProduct } from "../pages/seller/SellerAddProduct";
import { SellerWallet } from "../pages/seller/SellerWallet";
import { SellerAds } from "../pages/seller/SellerAds";
// Delivery Pages
import { DeliveryQueue } from "../pages/delivery/DeliveryQueue";
import { DeliveryHistory } from "../pages/delivery/DeliveryHistory";
import { DeliveryProfile } from "../pages/delivery/DeliveryProfile";

// Admin Pages
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminSellers } from "../pages/admin/AdminSellers";
import { AdminPartners } from "../pages/admin/AdminPartners";
import { AdminOrders } from "../pages/admin/AdminOrders";
import { AdminDeliveries } from "../pages/admin/AdminDeliveries";
import { AdminDeliveryDetail } from "../pages/admin/AdminDeliveryDetail";
import { AdminDeliveryPartnerDetail } from "../pages/admin/AdminDeliveryPartnerDetail";
import { AdminUsers } from "../pages/admin/AdminUsers";
import { AdminPolicies } from "../pages/admin/AdminPolicies";
import { AdminRefunds } from "../pages/admin/AdminRefunds";
import { AdminRefundDetail } from "../pages/admin/AdminRefundDetail";
import { AdminReturns } from "../pages/admin/AdminReturns";
import { AdminWallets } from "../pages/admin/AdminWallets";
import { AdminReturnDetail } from "../pages/admin/AdminReturnDetail";
import { AdminSettlementQueue } from "../pages/admin/AdminSettlementQueue";

const ProtectedCustomerRoute = () => (
  <RoleGuard allowedRoles={["customer"]}>
    <Outlet />
  </RoleGuard>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
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

        {/* Customer Route Group (Public & Protected) */}
        <Route path="/" element={<CustomerLayout />}>
          {/* Public Routes */}
          <Route index element={<ShopPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="sellers/:shopSlug" element={<SellerShopPage />} />
          <Route
            path="terms-and-conditions"
            element={<TermsConditionsPage />}
          />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedCustomerRoute />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="become-seller" element={<BecomeSellerPage />} />
            <Route
              path="become-delivery-partner"
              element={<BecomeDeliveryPartnerPage />}
            />
            <Route path="addresses" element={<AddressesPage />} />
          </Route>
        </Route>

        {/* Seller Route Group */}
        <Route
          path="/seller"
          element={
            <SellerGuard>
              <SellerLayout />
            </SellerGuard>
          }
        >
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="products/:id/edit" element={<SellerEditProduct />} />
          <Route path="products/:id/stats" element={<SellerStats />} />
          <Route path="add-product" element={<SellerAddProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="orders/:id" element={<SellerOrderDetail />} />
          <Route path="returns" element={<SellerReturns />} />
          <Route path="returns/:id" element={<SellerReturnDetail />} />
          <Route path="inventory" element={<SellerInventory />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route path="coupons" element={<SellerCoupons />} />
          <Route path="wallet" element={<SellerWallet />} />
          <Route path="ads" element={<SellerAds />} />
          <Route path="qa" element={<SellerQA />} />
        </Route>

        {/* Delivery Route Group */}
        <Route
          path="/delivery"
          element={
            <DeliveryGuard>
              <DeliveryLayout />
            </DeliveryGuard>
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
            <RoleGuard allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="deliveries" element={<AdminDeliveries />} />
          <Route path="deliveries/:id" element={<AdminDeliveryDetail />} />
          <Route
            path="delivery-partners/:id"
            element={<AdminDeliveryPartnerDetail />}
          />
          <Route path="users" element={<AdminUsers />} />
          <Route path="policies" element={<AdminPolicies />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="refunds/:id" element={<AdminRefundDetail />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="returns/:id" element={<AdminReturnDetail />} />
          <Route path="wallets" element={<AdminWallets />} />
          <Route path="settlements/queue" element={<AdminSettlementQueue />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
