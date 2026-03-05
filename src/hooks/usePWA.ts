import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  useEffect(() => {
    // Check if iOS (iPhone, iPad, iPod)
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install function - handles both Android and iOS
  const install = useCallback(async (): Promise<boolean> => {
    // For iOS, show instructions modal
    if (isIOS) {
      setIsIOSModalOpen(true);
      return false;
    }

    // For Android/Chrome, use the deferred prompt
    if (!deferredPrompt) {
      console.log('PWA install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during PWA install:', error);
      return false;
    }
  }, [deferredPrompt, isIOS]);

  // Open iOS modal
  const openIOSModal = useCallback(() => {
    setIsIOSModalOpen(true);
  }, []);

  // Close iOS modal
  const closeIOSModal = useCallback(() => {
    setIsIOSModalOpen(false);
  }, []);

  // Show install button if:
  // - Not already installed AND
  // - Either has Android prompt OR is iOS (can show instructions)
  const canInstall = !isInstalled && (!!deferredPrompt || isIOS);

  return {
    isInstalled,
    isIOS,
    canInstall,
    hasPrompt: !!deferredPrompt,
    isIOSModalOpen,
    openIOSModal,
    closeIOSModal,
    install
  };
}
