import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import { WishlistProvider } from '../context/WishlistContext';
import { NotificationProvider } from '../context/NotificationContext';
import { Toaster } from '../components/ui/toaster';
import ErrorBoundary from '../components/ErrorBoundary';
import AppRoutes from '../routes/AppRoutes';
import '../styles/index.css';
import { ChatRoomsProvider } from '@/context/ChatRoomsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import InstallPrompt from '@/components/pwa/InstallPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <ChatRoomsProvider>
              <BookingProvider allowGuestWrites={false}>
                <WishlistProvider allowGuestWrites={false}>
                  <Router>
                      <TooltipProvider delayDuration={0}>
                        <div className="App min-h-screen bg-background">
                          <AppRoutes />
                          <Toaster />
                          <InstallPrompt />
                        </div>
                      </TooltipProvider>
                  </Router>
                </WishlistProvider>
              </BookingProvider>
            </ChatRoomsProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;