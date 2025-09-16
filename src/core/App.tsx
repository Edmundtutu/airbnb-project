import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import {ChatProvider} from "@/context/ChatContext.tsx";
import { MultiChatProvider } from '@/context/MultiChatContext';
import { WishlistProvider } from '../context/WishlistContext';
import { Toaster } from '../components/ui/toaster';
import { ChatLauncher } from '@/components/shared/ChatLauncher';
import { ChatManager } from '@/components/shared/ChatManager';
import ErrorBoundary from '../components/ErrorBoundary';
import AppRoutes from '../routes/AppRoutes';
import '../styles/index.css';

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
          <ErrorBoundary>
            <ChatProvider>
              <MultiChatProvider>
                <BookingProvider>
                  <WishlistProvider>
                    <Router>
                      <div className="App min-h-screen bg-background">
                        <AppRoutes />
                        <ChatLauncher />
                        <ChatManager />
                        <Toaster />
                      </div>
                    </Router>
                  </WishlistProvider>
                </BookingProvider>
              </MultiChatProvider>
            </ChatProvider>
          </ErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;