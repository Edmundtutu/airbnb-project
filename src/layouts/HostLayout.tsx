import React from 'react';
import { useAuth } from '@/context/AuthContext';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Navbar from '@/components/Navbar';

interface HostLayoutProps {
  children: React.ReactNode;
}

const HostLayout: React.FC<HostLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar />
        
        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:ml-64 xl:ml-72 pb-20 lg:pb-6">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default HostLayout;