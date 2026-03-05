import { createRoot } from "react-dom/client";
import { useEffect, useRef } from "react";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // Initialize i18n

// Enable console logs for debugging (only in development)
if (import.meta.env.DEV) {
  console.log("🚀 Monnas Old Boys - Console logs enabled");
  console.log("Environment:", import.meta.env.MODE);
  console.log("Dev mode:", import.meta.env.DEV);
}

// Register service worker for PWA and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-push.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
  });
}

// Component to handle overscroll prevention with proper cleanup
function OverscrollPrevention() {
  const touchStartYRef = useRef(0);

  useEffect(() => {
    // Only apply on mobile
    if (window.innerWidth > 768) return;

    // Prevent pull-to-refresh and overscroll bounce
    document.body.style.overscrollBehaviorY = 'none';
    document.documentElement.style.overscrollBehaviorY = 'none';

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const scrollableElement = document.elementFromPoint(
        e.touches[0].clientX,
        e.touches[0].clientY
      )?.closest('[class*="overflow"]') || document.documentElement;

      if (scrollableElement) {
        const scrollTop = scrollableElement.scrollTop || window.scrollY;
        const scrollHeight = scrollableElement.scrollHeight || document.documentElement.scrollHeight;
        const clientHeight = scrollableElement.clientHeight || window.innerHeight;
        const deltaY = currentY - touchStartYRef.current;

        // Prevent overscroll at top (scrolling up when already at top)
        if (scrollTop <= 0 && deltaY > 0) {
          e.preventDefault();
          return;
        }

        // Prevent overscroll at bottom (scrolling down when already at bottom)
        if (scrollTop + clientHeight >= scrollHeight - 1 && deltaY < 0) {
          e.preventDefault();
          return;
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Cleanup on unmount
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.body.style.overscrollBehaviorY = '';
      document.documentElement.style.overscrollBehaviorY = '';
    };
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <>
    <OverscrollPrevention />
    <App />
  </>
);
