import React from 'react';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useAuth } from '@/context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar user={user} />
      
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - Fixed left sidebar like Facebook */}
        {user && <DesktopSidebar />}
        
        {/* Main Content Area - Centered like Facebook feed */}
        <main className={`
          flex-1 min-h-screen w-full
          ${user ? 'lg:ml-64 xl:ml-72' : ''} 
          ${user ? 'pb-16 lg:pb-0' : 'pb-0'}
        `}>
          {/* Content Container - Centered with max width like Facebook */}
          <div className={`
            w-full mx-auto px-2 sm:px-4 py-4 lg:py-6
            ${user ? 'max-w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl' : 'max-w-6xl'}
          `}>
            {/* Facebook-like centered feed layout */}
            <div className={`
              ${user ? 'lg:grid lg:grid-cols-12 lg:gap-6' : ''}
            `}>
              {/* Main Feed Area */}
              <div className={`
                ${user ? 'lg:col-span-8 xl:col-span-7' : ''}
              `}>
                {children}
              </div>
              
              {/* Right Sidebar - Desktop only, like Facebook's right panel */}
              {user && (
                <div className="hidden lg:block lg:col-span-4 xl:col-span-5">
                  <div className="sticky top-20 space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-card rounded-lg p-4 border">
                      <h3 className="font-semibold mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                          🛍️ Browse Products
                        </button>
                        <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                          🗺️ Find Shops Near Me
                        </button>
                        <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                          ❤️ View Favorites
                        </button>
                      </div>
                    </div>
                    
                    {/* Trending */}
                    <div className="bg-card rounded-lg p-4 border">
                      <h3 className="font-semibold mb-3">Trending Now</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            📱
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Electronics</p>
                            <p className="text-xs text-muted-foreground">Hot deals</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            👕
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Fashion</p>
                            <p className="text-xs text-muted-foreground">New arrivals</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Only on mobile like Facebook */}
      {user && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;