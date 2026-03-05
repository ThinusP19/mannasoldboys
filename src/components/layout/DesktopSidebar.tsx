import { useState, useEffect, useCallback } from "react";
import { Home, Users, Heart, ChevronLeft, ChevronRight, User, Facebook, Instagram, Globe, Bell, Briefcase, Award } from "lucide-react";
import { NavLink } from "../NavLink";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { alumniApi } from "@/lib/api";
import { MembershipRequestDialog } from "@/components/MembershipRequestDialog";
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
} from "@/lib/push-notifications";

const SIDEBAR_COLLAPSED_KEY = "desktop-sidebar-collapsed";

export const DesktopSidebar = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const currentLang = i18n.language?.startsWith('af') ? 'af' : 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'af' : 'en';
    i18n.changeLanguage(newLang);
  };
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);

  // Check push notification status on mount
  useEffect(() => {
    const checkPushStatus = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);

      if (supported) {
        const subscribed = await isSubscribedToPush();
        setPushEnabled(subscribed);
      }
      setPushLoading(false);
    };
    checkPushStatus();
  }, []);

  const handlePushToggle = useCallback(async () => {
    setPushLoading(true);
    try {
      if (!pushEnabled) {
        const success = await subscribeToPush();
        if (success) {
          setPushEnabled(true);
          toast({
            title: t('settings.push_enabled'),
            description: t('settings.push_enabled_desc'),
          });
        } else {
          const permission = getNotificationPermission();
          if (permission === 'denied') {
            toast({
              title: t('settings.push_blocked'),
              description: t('settings.push_blocked_desc'),
              variant: "destructive",
            });
          } else {
            toast({
              title: t('status.error'),
              description: t('settings.push_error'),
              variant: "destructive",
            });
          }
        }
      } else {
        await unsubscribeFromPush();
        setPushEnabled(false);
        toast({
          title: t('settings.push_disabled'),
          description: t('settings.push_disabled_desc'),
        });
      }
    } catch (error) {
      console.error("Push toggle error:", error);
      toast({
        title: t('status.error'),
        description: t('settings.push_error'),
        variant: "destructive",
      });
    } finally {
      setPushLoading(false);
    }
  }, [pushEnabled, toast, t]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Fetch user data to check membership status
  const { data: userData } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => {
      try {
        return await alumniApi.getMe();
      } catch (error: any) {
        // Only log non-timeout errors (timeouts are expected when backend is slow)
        const isTimeout = error?.error?.includes("timeout") || error?.details?.includes("timeout");
        if (!isTimeout) {
          console.error("Error fetching user profile:", error);
        }
        return null;
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry on error
  });

  const isMember = userData?.isMember === true;

  // Handle navigation for member-only tabs
  const handleMemberOnlyTabClick = (e: React.MouseEvent, path: string) => {
    if (!isMember) {
      e.preventDefault();
      setMembershipDialogOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <aside className={cn(
      "hidden md:flex flex-col bg-[#000000] text-white border-r border-gray-900 rounded-xl overflow-hidden h-full transition-all duration-300",
      isCollapsed ? "w-20" : "w-72"
    )}>
      <div className="px-4 py-4 border-b border-gray-900">
        <div className="flex items-center justify-center">
          {isCollapsed ? (
            <span className="text-lg font-bold text-white">MO</span>
          ) : (
            <h1 className="text-xl font-bold text-white">Monnas Oldboys</h1>
          )}
        </div>
      </div>
      
      <nav className="flex-1 px-3 pt-6 pb-3 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
              "hover:bg-gray-900 hover:text-white",
              isActive && "bg-gray-900 text-white font-medium",
              isCollapsed && "justify-center px-2"
            )
          }
          title={isCollapsed ? t('nav.profile') : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{t('nav.profile')}</span>}
        </NavLink>


        <NavLink
          to="/my-year"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
              "hover:bg-gray-900 hover:text-white",
              isActive && "bg-gray-900 text-white font-medium",
              isCollapsed && "justify-center px-2"
            )
          }
          title={isCollapsed ? t('nav.my_year') : undefined}
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{t('nav.my_year')}</span>}
        </NavLink>

        <button
          onClick={(e) => handleMemberOnlyTabClick(e, "/directory")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
            "hover:bg-gray-900 hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? t('nav.directory') : undefined}
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{t('nav.directory')}</span>}
        </button>

        <button
          onClick={(e) => handleMemberOnlyTabClick(e, "/marketplace")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
            "hover:bg-gray-900 hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Marketplace" : undefined}
        >
          <Briefcase className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Marketplace</span>}
        </button>

        <button
          onClick={(e) => handleMemberOnlyTabClick(e, "/sponsors")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
            "hover:bg-gray-900 hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Sponsors" : undefined}
        >
          <Award className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sponsors</span>}
        </button>
      </nav>
      
      <div className="px-3 py-3 border-t border-gray-900 space-y-3">
        {/* Push Notifications Toggle */}
        {pushSupported && (
          <div
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
              isCollapsed && "justify-center px-2"
            )}
            title={t('settings.push_notifications')}
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">{t('settings.push_notifications')}</span>
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={handlePushToggle}
                  disabled={pushLoading}
                  className="data-[state=checked]:bg-green-500"
                />
              </>
            )}
            {isCollapsed && (
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={pushLoading}
                className="data-[state=checked]:bg-green-500"
              />
            )}
          </div>
        )}

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
            "hover:bg-gray-900 hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={currentLang === 'en' ? 'Switch to Afrikaans' : 'Switch to English'}
        >
          <Globe className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{currentLang === 'en' ? 'Afrikaans' : 'English'}</span>}
        </button>

        {/* Social Media Links */}
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-center")}>
          <a
            href="https://www.facebook.com/share/1AtzCwMT36/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition-colors"
            title="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="https://www.instagram.com/potchgimmies?igsh=Z2twdXhqNnRkNWVo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition-colors"
            title="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </div>
        
        <Button
          variant="ghost"
          className={cn(
            "w-full text-gray-300 hover:text-white hover:bg-gray-900",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3">{t('nav.collapse')}</span>
            </>
          )}
        </Button>
      </div>

      {/* Membership Request Dialog */}
      <MembershipRequestDialog
        open={membershipDialogOpen}
        onOpenChange={setMembershipDialogOpen}
      />
    </aside>
  );
};
