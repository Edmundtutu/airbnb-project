import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Layouts
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import HostLayout from '@/layouts/HostLayout';

// Lazy-loaded Right Panels
const FeedsPanel = lazy(() => import('@/layouts/FeedsPanel'));

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Guest (renter) Pages
import Feed from '@/pages/guest/Feed';
import Discover from '@/pages/guest/Discover';
import Listing from '@/pages/guest/Listing';
import PropertyMapPage from '@/pages/guest/PropertyMapPage';
import Bookings from '@/pages/guest/Bookings';
import Profile from '@/pages/guest/Profile';
import Favorites from '@/pages/guest/Favorites';
import PropertyDetails from '@/pages/properties/[propertyId]';


// Host Pages
import HostDashboard from '@/pages/host/Dashboard';
import HostListings from '@/pages/host/Listings';
import HostCreateListing from '@/pages/host/CreateListing';
import HostListingDetails from '@/pages/host/ListingDetails';
import HostBookings from '@/pages/host/Bookings';
import HostAnalytics from '@/pages/host/Analytics';
import HostProfile from '@/pages/host/Profile';
import ChatsListPage from '@/pages/chats/ChatsListPage';
import ChatRoomPage from '@/pages/chats/ChatRoomPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';


// Tentative to production pages
import ExploerDiscover from '@/pages/tentative-pages/Discover';
import ExploreMap from '@/pages/tentative-pages/Map';
import ExploreProperties from '@/pages/tentative-pages/Properties';
import RegisterHost from '@/pages/tentative-pages/pre-onboard/RegisterHost';
import PendingReview from '@/pages/tentative-pages/pre-onboard/PendingReview';
// Coming Soon Page
import CommingSoonPage from '@/pages/tentative-pages/CommingSoonApp';


// Route Guards
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: ('guest' | 'host' | 'admin')[];
  layout: 'main' | 'host';
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

  // Check if host has verified property for host routes
  if (layout === 'host' && user?.role === 'host') {
    if (user.can_access_host_dashboard === false) {
      return <Navigate to="/pre-onboard/pending-review" replace />;
    }
  }

  const Layout = layout === 'host' ? HostLayout : MainLayout;
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
      {/* Public Routes - Allow guests */}
      <Route path="/" element={
        import.meta.env.VITE_SHOW_COMMING_SOON === "true" ? <CommingSoonPage /> : (
          <MainLayout>
            <Discover />
          </MainLayout>
        )
      } />
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

      <Route path="/feed" element={
        <MainLayout rightPanel={
          <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg" />}>
            <FeedsPanel />
          </Suspense>
        }>
          <Feed />
        </MainLayout>
      } />
      <Route path="/listing/:id" element={
        <MainLayout>
          <Listing />
        </MainLayout>
      } />
      <Route path="/map" element={
        <MainLayout>
          <PropertyMapPage />
        </MainLayout>
      } />

      {/* Protected Guest Routes */}
      <Route path="/bookings" element={
        <ProtectedRoute requiredRole={['guest']} layout="main">
          <Bookings />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute requiredRole={['guest']} layout="main">
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/favorites" element={
        <ProtectedRoute requiredRole={['guest']} layout="main">
          <Favorites />
        </ProtectedRoute>
      } />


      {/* Host Routes */}
      <Route path="/host/dashboard" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <HostDashboard />
        </ProtectedRoute>
      } />
      <Route path="/host/listings" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <HostListings />
        </ProtectedRoute>
      } />
      <Route path="/host/listings/new" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <HostCreateListing />
        </ProtectedRoute>
      } />
      <Route path="/host/listings/:listingId" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <HostListingDetails />
        </ProtectedRoute>
      } />
      <Route path="/host/bookings" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <HostBookings />
        </ProtectedRoute>
      } />
      <Route path="/host/analytics" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <HostAnalytics />
        </ProtectedRoute>
      } />
      <Route path="/host/profile" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <HostProfile />
        </ProtectedRoute>
      } />
      <Route path="/host/notifications" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/host/settings" element={
        <ProtectedRoute requiredRole={['host']} layout="host">
          <SettingsPage />
        </ProtectedRoute>
      } />

      {/* Chat Routes (shared by host and guest) */}
      <Route
        path="/chats"
        element={
          <ProtectedRoute layout="main">
            <ChatsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chats/:bookingId"
        element={
          <ProtectedRoute layout="main">
            <ChatRoomPage />
          </ProtectedRoute>
        }
      />

      {/* Notifications Route (shared by host and guest) */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute layout="main">
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Settings Route (shared by host and guest) */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute layout="main">
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Properties Index Route */}
      <Route 
        path="/properties" 
        element={
          <MainLayout>
            <ExploreProperties />
          </MainLayout>
        } 
      />

      {/* Property Details Route */}
      <Route 
        path="/properties/:propertyId" 
        element={
          <MainLayout>
            <PropertyDetails />
          </MainLayout>
        } 
      />


      {/* Tentative to production routes */}
      <Route
        path="/explore/discovery"
        element={
          <MainLayout>
            <ExploerDiscover />
          </MainLayout>
        }
      />
      <Route
        path="/explore/map"
        element={
          <MainLayout>
            <ExploreMap />
          </MainLayout>
        }
      />
      <Route
        path="/explore/properties"
        element={
          <MainLayout>
            <ExploreProperties />
          </MainLayout>
        }
      />
      <Route
        path="/pre-onboard/register-host"
        element={
          <PublicRoute>
            <RegisterHost />
          </PublicRoute>}
      />
      <Route
        path="/pre-onboard/pending-review"
        element={
          <ProtectedRoute requiredRole={['host']} layout="main">
            <PendingReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pre-onboard/create-listing"
        element={
          <ProtectedRoute requiredRole={['host']} layout="main">
            <HostCreateListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pre-onboard/host-listings"
        element={
          <ProtectedRoute requiredRole={['host']} layout="main">
            <HostListings />
          </ProtectedRoute>
        }
      />
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;