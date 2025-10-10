import React, { createContext, useContext, useState, ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useAuth } from '@/context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  rightPanel?: ReactNode;
}

// Context to manage right sidebar visibility and content
interface RightSidebarContextType {
  rightPanel: ReactNode | null;
  setRightPanel: (panel: ReactNode | null) => void;
}

const RightSidebarContext = createContext<RightSidebarContextType>({
  rightPanel: null,
  setRightPanel: () => {},
});

export const useRightSidebar = () => useContext(RightSidebarContext);

const MainLayout: React.FC<MainLayoutProps> = ({ children, rightPanel: initialRightPanel }) => {
  const { user } = useAuth();
  const [rightPanel, setRightPanel] = useState<ReactNode | null>(initialRightPanel || null);

  // Use the rightPanel from props if provided, otherwise use state
  const activeRightPanel = initialRightPanel !== undefined ? initialRightPanel : rightPanel;

  return (
    <RightSidebarContext.Provider value={{ rightPanel: activeRightPanel, setRightPanel }}>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar user={user} />
        
        <div className="flex min-h-screen">
          {/* Desktop Sidebar - Fixed left sidebar */}
          {user && <DesktopSidebar />}
          
          {/* Main Content Area - Flexible width based on sidebars */}
          <main className={`
            flex-1 min-h-screen w-full
            ${user ? 'lg:ml-64 xl:ml-72' : ''} 
            ${user ? 'pb-16 lg:pb-0' : 'pb-0'}
          `}>
            {/* Content Container - Adaptive width */}
            <div className={`
              w-full mx-auto px-2 sm:px-4 py-4 lg:py-6
              ${user && activeRightPanel ? 'max-w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl' : user ? 'max-w-full' : 'max-w-6xl'}
            `}>
              {/* Layout with optional right panel */}
              <div className={`
                ${user && activeRightPanel ? 'lg:grid lg:grid-cols-12 lg:gap-6' : ''}
              `}>
                {/* Main Content Area */}
                <div className={`
                  ${user && activeRightPanel ? 'lg:col-span-8 xl:col-span-7' : ''}
                `}>
                  {children}
                </div>
                
                {/* Dynamic Right Panel - Desktop only */}
                {user && activeRightPanel && (
                  <div className="hidden lg:block lg:col-span-4 xl:col-span-5">
                    {activeRightPanel}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {user && <MobileBottomNav />}
      </div>
    </RightSidebarContext.Provider>
  );
};

export default MainLayout;