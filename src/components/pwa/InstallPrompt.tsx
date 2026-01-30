import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { isInstallPromptAvailable, showInstallPrompt, isAppInstalled } from '@/utils/pwa';

interface InstallPromptProps {
  onDismiss?: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onDismiss }) => {
  const [show, setShow] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if install prompt is available (Android/Chrome)
    if (isInstallPromptAvailable()) {
      setShow(true);
    }

    // Listen for install prompt availability
    const handleInstallAvailable = () => {
      if (!isAppInstalled()) {
        setShow(true);
      }
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);

    // Check if user has dismissed before (stored in localStorage)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setShow(false);
      }
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, show instructions
      setShow(false);
      // You can show a modal with iOS installation instructions here
      alert('To install this app on your iOS device:\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n3. Tap "Add"');
      return;
    }

    const accepted = await showInstallPrompt();
    if (accepted) {
      setShow(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  };

  if (isInstalled || !show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 bg-[#00ac90]/10 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5 text-[#00ac90]" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Install CavaYo
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            {isIOS 
              ? 'Add CavaYo to your home screen for quick access'
              : 'Install our app for a better experience with offline access'
            }
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-[#00ac90] text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-[#00ac90]/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              {isIOS ? 'Show Instructions' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
