import { useEffect, useState } from "react";

export const Preloader = () => {
  // Always show preloader on page load/refresh
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent body scroll while preloader is active
    document.body.style.overflow = 'hidden';

    // Show preloader for 1.5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = '';
    }, 1500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#000000] preloader-container"
      style={{
        width: '100%',
        height: '100dvh', // Dynamic viewport height - works correctly on mobile
        minHeight: '100vh', // Fallback for older browsers
        WebkitMinHeight: '-webkit-fill-available', // Safari iOS fix
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold text-white tracking-wide animate-pulse">
          Monnas Old Boys
        </h1>
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

