import { createRoot } from "react-dom/client";
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


createRoot(document.getElementById("root")!).render(<App />);
