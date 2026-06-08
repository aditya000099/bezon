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
const LoginPage = React.lazy(() => import('../pages/public/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('../pages/public/RegisterPage').then(module => ({ default: module.RegisterPage })));

// Customer Pages
const ShopPage = React.lazy(() => import('../pages/customer/ShopPage').then(module => ({ default: module.ShopPage })));
const ProductDetailPage = React.lazy(() => import('../pages/customer/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })));
const CartPage = React.lazy(() => import('../pages/customer/CartPage').then(module => ({ default: module.CartPage })));
const CheckoutPage = React.lazy(() => import('../pages/customer/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const OrdersPage = React.lazy(() => import('../pages/customer/OrdersPage').then(module => ({ default: module.OrdersPage })));
const OrderDetailPage = React.lazy(() => import('../pages/customer/OrderDetailPage').then(module => ({ default: module.OrderDetailPage })));
const WishlistPage = React.lazy(() => import('../pages/customer/WishlistPage').then(module => ({ default: module.WishlistPage })));
const ProfilePage = React.lazy(() => import('../pages/customer/ProfilePage').then(module => ({ default: module.ProfilePage })));
const EditProfilePage = React.lazy(() => import('../pages/customer/EditProfilePage').then(module => ({ default: module.EditProfilePage })));
const AddressesPage = React.lazy(() => import('../pages/customer/AddressesPage').then(module => ({ default: module.AddressesPage })));
const TermsConditionsPage = React.lazy(() => import('../pages/customer/TermsConditionsPage').then(module => ({ default: module.TermsConditionsPage })));
const PrivacyPolicyPage = React.lazy(() => import('../pages/customer/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
const BecomeSellerPage = React.lazy(() => import('../pages/customer/BecomeSellerPage').then(module => ({ default: module.BecomeSellerPage })));
const SellerShopPage = React.lazy(() => import('../pages/customer/SellerShopPage').then(module => ({ default: module.SellerShopPage })));
const BecomeDeliveryPartnerPage = React.lazy(() => import('../pages/customer/BecomeDeliveryPartnerPage').then(module => ({ default: module.BecomeDeliveryPartnerPage })));

// Seller Pages
const SellerDashboard = React.lazy(() => import('../pages/seller/SellerDashboard').then(module => ({ default: module.SellerDashboard })));
const SellerProducts = React.lazy(() => import('../pages/seller/SellerProducts').then(module => ({ default: module.SellerProducts })));
const SellerOrders = React.lazy(() => import('../pages/seller/SellerOrders').then(module => ({ default: module.SellerOrders })));
const SellerInventory = React.lazy(() => import('../pages/seller/SellerInventory').then(module => ({ default: module.SellerInventory })));
const SellerSettings = React.lazy(() => import('../pages/seller/SellerSettings').then(module => ({ default: module.SellerSettings })));
const SellerCoupons = React.lazy(() => import('../pages/seller/SellerCoupons').then(module => ({ default: module.SellerCoupons })));
import { SellerQA } from "@/pages/seller/SellerQA";
const SellerEditProduct = React.lazy(() => import('../pages/seller/SellerEditProduct').then(module => ({ default: module.SellerEditProduct })));
const SellerStats = React.lazy(() => import('../pages/seller/SellerStats').then(module => ({ default: module.SellerStats })));
const SellerReturns = React.lazy(() => import('../pages/seller/SellerReturns').then(module => ({ default: module.SellerReturns })));
const SellerReturnDetail = React.lazy(() => import('../pages/seller/SellerReturnDetail').then(module => ({ default: module.SellerReturnDetail })));
const SellerOrderDetail = React.lazy(() => import('../pages/seller/SellerOrderDetail').then(module => ({ default: module.SellerOrderDetail })));
const SellerAddProduct = React.lazy(() => import('../pages/seller/SellerAddProduct').then(module => ({ default: module.SellerAddProduct })));
const SellerWallet = React.lazy(() => import('../pages/seller/SellerWallet').then(module => ({ default: module.SellerWallet })));
const SellerAds = React.lazy(() => import('../pages/seller/SellerAds').then(module => ({ default: module.SellerAds })));
// Delivery Pages
const DeliveryQueue = React.lazy(() => import('../pages/delivery/DeliveryQueue').then(module => ({ default: module.DeliveryQueue })));
const DeliveryHistory = React.lazy(() => import('../pages/delivery/DeliveryHistory').then(module => ({ default: module.DeliveryHistory })));
const DeliveryProfile = React.lazy(() => import('../pages/delivery/DeliveryProfile').then(module => ({ default: module.DeliveryProfile })));

// Admin Pages
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminCategories = React.lazy(() => import('../pages/admin/AdminCategories').then(module => ({ default: module.AdminCategories })));
const AdminSellers = React.lazy(() => import('../pages/admin/AdminSellers').then(module => ({ default: module.AdminSellers })));
const AdminPartners = React.lazy(() => import('../pages/admin/AdminPartners').then(module => ({ default: module.AdminPartners })));
const AdminOrders = React.lazy(() => import('../pages/admin/AdminOrders').then(module => ({ default: module.AdminOrders })));
const AdminDeliveries = React.lazy(() => import('../pages/admin/AdminDeliveries').then(module => ({ default: module.AdminDeliveries })));
const AdminDeliveryDetail = React.lazy(() => import('../pages/admin/AdminDeliveryDetail').then(module => ({ default: module.AdminDeliveryDetail })));
const AdminDeliveryPartnerDetail = React.lazy(() => import('../pages/admin/AdminDeliveryPartnerDetail').then(module => ({ default: module.AdminDeliveryPartnerDetail })));
const AdminUsers = React.lazy(() => import('../pages/admin/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminPolicies = React.lazy(() => import('../pages/admin/AdminPolicies').then(module => ({ default: module.AdminPolicies })));
const AdminPolicyForm = React.lazy(() => import('../pages/admin/AdminPolicyForm').then(module => ({ default: module.AdminPolicyForm })));
const AdminRefunds = React.lazy(() => import('../pages/admin/AdminRefunds').then(module => ({ default: module.AdminRefunds })));
const AdminRefundDetail = React.lazy(() => import('../pages/admin/AdminRefundDetail').then(module => ({ default: module.AdminRefundDetail })));
const AdminReturns = React.lazy(() => import('../pages/admin/AdminReturns').then(module => ({ default: module.AdminReturns })));
const AdminWallets = React.lazy(() => import('../pages/admin/AdminWallets').then(module => ({ default: module.AdminWallets })));
const AdminReturnDetail = React.lazy(() => import('../pages/admin/AdminReturnDetail').then(module => ({ default: module.AdminReturnDetail })));
const AdminSettlementQueue = React.lazy(() => import('../pages/admin/AdminSettlementQueue').then(module => ({ default: module.AdminSettlementQueue })));

const ProtectedCustomerRoute = () => (
  <RoleGuard allowedRoles={["customer"]}>
    <Outlet />
  </RoleGuard>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
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
          <Route path="categories" element={<AdminCategories />} />
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
          <Route path="policies/create" element={<AdminPolicyForm />} />
          <Route path="policies/:id/edit" element={<AdminPolicyForm />} />
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
      </React.Suspense>
    </BrowserRouter>
  );
};
