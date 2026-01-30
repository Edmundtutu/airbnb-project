// PWA utility functions for service worker and install prompt

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Register service worker for PWA functionality
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available');
              // You can show a notification to the user here
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Listen for beforeinstallprompt event
 */
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('Install prompt available');
    
    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });
};

/**
 * Show install prompt
 */
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
};

/**
 * Check if app is installed
 */
export const isAppInstalled = (): boolean => {
  // Check if running in standalone mode (iOS)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check if running in standalone mode (Android)
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Check if app is installed via beforeinstallprompt
  return deferredPrompt === null && 'serviceWorker' in navigator;
};

/**
 * Check if install prompt is available
 */
export const isInstallPromptAvailable = (): boolean => {
  return deferredPrompt !== null;
};

/**
 * Get install prompt event
 */
export const getInstallPrompt = (): BeforeInstallPromptEvent | null => {
  return deferredPrompt;
};
