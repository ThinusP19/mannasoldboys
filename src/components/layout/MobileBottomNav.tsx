import { Home, User, Briefcase, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-4 left-2 right-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl z-50 safe-area-bottom shadow-2xl">
      <div className="flex items-center justify-between h-16 px-3">
        {/* First 2 icons */}
        <button
          onClick={() => navigate("/my-year")}
          className={cn(
            "flex items-center justify-center h-full transition-colors rounded-lg px-3",
            isActive("/my-year") ? "text-white" : "text-gray-400"
          )}
        >
          <Home className={cn("w-6 h-6", isActive("/my-year") && "fill-white text-white")} />
        </button>

        <button
          onClick={() => navigate("/sponsors")}
          className={cn(
            "flex items-center justify-center h-full transition-colors rounded-lg px-3",
            isActive("/sponsors") ? "text-white" : "text-gray-400"
          )}
        >
          <Award className={cn("w-6 h-6", isActive("/sponsors") && "fill-white text-white")} />
        </button>

        {/* Logo in center */}
        <div className="flex items-center justify-center h-full px-2">
          <img
            src="/nobglogo.png"
            alt="Monnas Old Boys Logo"
            className="w-12 h-12 object-contain"
          />
        </div>

        {/* Last 2 icons */}
        <button
          onClick={() => navigate("/marketplace")}
          className={cn(
            "flex items-center justify-center h-full transition-colors rounded-lg px-3",
            isActive("/marketplace") ? "text-white" : "text-gray-400"
          )}
        >
          <Briefcase className={cn("w-6 h-6", isActive("/marketplace") && "fill-white text-white")} />
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={cn(
            "flex items-center justify-center h-full transition-colors rounded-lg px-3",
            isActive("/profile") || location.pathname.startsWith("/alumni/") ? "text-white" : "text-gray-400"
          )}
        >
          <User className={cn("w-6 h-6", (isActive("/profile") || location.pathname.startsWith("/alumni/")) && "fill-white text-white")} />
        </button>
      </div>
    </nav>
  );
};
