import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Layouts
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import VendorLayout from '@/layouts/VendorLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Guest (renter) Pages
import Home from '@/pages/guest/Home';
import Discover from '@/pages/guest/Discover';
import Product from '@/pages/guest/Product';
import ShopMapPage from '@/pages/guest/ShopMapPage';
import Cart from '@/pages/guest/Cart';
import Profile from '@/pages/guest/Profile';
import Favorites from '@/pages/guest/Favorites';
import ShopDetails from '@/pages/properties/[shopId]';


// Host Pages
import VendorDashboard from '@/pages/host/Dashboard';
import VendorInventory from '@/pages/host/Inventory';
import VendorOrders from '@/pages/host/Orders';
import VendorAnalytics from '@/pages/host/Analytics';
import VendorProfile from '@/pages/host/Profile';

// Route Guards
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  layout: 'main' | 'vendor';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  layout 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const Layout = layout === 'vendor' ? VendorLayout : MainLayout;
  return <Layout>{children}</Layout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <AuthLayout>{children}</AuthLayout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Public Routes - Allow guests */}
      <Route path="/" element={
        <MainLayout>
          <Home />
        </MainLayout>
      } />
      <Route path="/discover" element={
        <MainLayout>
          <Discover />
        </MainLayout>
      } />
      <Route path="/product/:id" element={
        <MainLayout>
          <Product />
        </MainLayout>
      } />
      <Route path="/map" element={
        <MainLayout>
          <ShopMapPage   />
        </MainLayout>
      } />
      
      {/* Protected Customer Routes */}
      <Route path="/cart" element={
        <ProtectedRoute requiredRole={['customer']} layout="main">
          <Cart />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute requiredRole={['customer']} layout="main">
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/favorites" element={
        <ProtectedRoute requiredRole={['customer']} layout="main">
          <Favorites />
        </ProtectedRoute>
      } />


      {/* Host Routes */}
      <Route path="/vendor/dashboard" element={
        <ProtectedRoute requiredRole={['vendor']} layout="vendor">
          <VendorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/vendor/inventory" element={
        <ProtectedRoute requiredRole={['vendor']} layout="vendor">
          <VendorInventory />
        </ProtectedRoute>
      } />
      <Route path="/vendor/orders" element={
        <ProtectedRoute requiredRole={['vendor']} layout="vendor">
          <VendorOrders />
        </ProtectedRoute>
      } />
      <Route path="/vendor/analytics" element={
        <ProtectedRoute requiredRole={['vendor']} layout="vendor">
          <VendorAnalytics />
        </ProtectedRoute>
      } />
      <Route path="/vendor/profile" element={
        <ProtectedRoute requiredRole={['vendor']} layout="vendor">
          <VendorProfile />
        </ProtectedRoute>
      } />

      {/* Shop Details Route */}
      <Route path="/shops/:shopId" element={<ShopDetails />} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;