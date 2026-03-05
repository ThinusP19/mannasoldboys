import { useState, useEffect } from "react";
import { Shield, Users, Image as ImageIcon, Heart, ChevronLeft, ChevronRight, BarChart3, LogOut, Languages, Handshake, Briefcase } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAdminLanguage, setAdminLanguage } from "@/lib/i18n";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ADMIN_SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", label: t('admin.overview'), icon: BarChart3 },
    { id: "users", label: t('admin.users'), icon: Users },
    { id: "sponsor-enquiries", label: "Sponsor Enquiries", icon: Handshake },
    { id: "marketplace", label: "Marketplace", icon: Briefcase },
    { id: "year-groups", label: t('admin.year_groups'), icon: ImageIcon },
    { id: "memorials", label: t('admin.memorials'), icon: Heart },
  ];

  return (
    <aside className={cn(
      "hidden md:flex flex-col bg-[#000000] text-white border-r border-gray-900 rounded-xl overflow-hidden h-full transition-all duration-300",
      isCollapsed ? "w-20" : "w-72"
    )}>
      <div className="px-4 py-4 border-b border-gray-900">
        <div className="flex items-center justify-center">
          {isCollapsed ? (
            <Shield className="h-10 w-10 text-accent" />
          ) : (
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-accent" />
              <span className="text-lg font-bold">Monnas Old Boys</span>
            </div>
          )}
        </div>
      </div>
      
      <nav className="flex-1 px-3 pt-6 pb-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300",
                "hover:bg-gray-900 hover:text-white",
                isActive && "bg-gray-900 text-white font-medium",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      
      <div className="px-3 py-3 border-t border-gray-900">
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

        <Button
          variant="ghost"
          className={cn(
            "w-full mt-2 text-gray-300 hover:text-white hover:bg-gray-900",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={() => {
            const currentLang = getAdminLanguage();
            const newLang = currentLang === 'en' ? 'af' : 'en';
            setAdminLanguage(newLang);
          }}
          title={isCollapsed ? t('settings.language') : undefined}
        >
          <Languages className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="ml-3">
              {getAdminLanguage() === 'en' ? 'Afrikaans' : 'English'}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "w-full mt-2 text-gray-300 hover:text-white hover:bg-gray-900",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={() => {
            localStorage.removeItem("adminAuthToken");
            localStorage.removeItem("adminUser");
            localStorage.removeItem("isAdminAuthenticated");
            navigate("/admin/login");
          }}
          title={isCollapsed ? t('nav.logout') : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">{t('nav.logout')}</span>}
        </Button>
      </div>
    </aside>
  );
};

