import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Menu, Shield, Users, Image as ImageIcon, FileText, Heart, Calendar, BarChart3, LogOut, Clock, Bell, Coins, X, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminLanguage, setAdminLanguage } from "@/lib/i18n";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  title?: string;
}

const getMenuItems = (t: (key: string) => string) => [
  { id: "dashboard", label: t('admin.overview'), icon: BarChart3 },
  { id: "users", label: t('admin.users'), icon: Users },
  { id: "pending-members", label: t('admin.pending_members'), icon: Clock },
  { id: "notifications", label: t('admin.notifications'), icon: Bell },
  { id: "year-groups", label: t('admin.year_groups'), icon: ImageIcon },
  { id: "stories", label: t('admin.stories'), icon: FileText },
  { id: "memorials", label: t('admin.memorials'), icon: Heart },
  { id: "reunions", label: t('admin.reunions'), icon: Calendar },
  { id: "projects", label: t('admin.projects'), icon: Coins },
];

export const AdminLayout = ({ children, activeTab, onTabChange, title }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuItems = getMenuItems(t);
  const displayTitle = title || t('admin.dashboard');

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/admin/login");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#f5f0e8] md:p-2">
      {/* Mobile Top Bar */}
      <div className="md:hidden p-3 bg-[#f5f0e8] safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 bg-black text-white rounded-xl">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">{displayTitle}</h1>
          <div className="w-10" /> {/* Spacer for centering title */}
        </div>
      </div>

      {/* Mobile Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-black border-gray-900 [&>button]:hidden">
          <div className="flex flex-col h-full">
            {/* Logo/Header with Close Button */}
            <div className="px-4 py-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-8 w-8 text-accent" />
                  <span className="text-lg font-bold text-white">{t('admin.dashboard')}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="px-3 pt-4 pb-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-gray-300",
                      "hover:bg-gray-800 hover:text-white",
                      isActive && "bg-gray-800 text-white font-medium"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Language Toggle and Logout Button */}
              <div className="pt-4 mt-4 border-t border-gray-800">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg py-3"
                  onClick={() => {
                    const currentLang = getAdminLanguage();
                    const newLang = currentLang === 'en' ? 'af' : 'en';
                    setAdminLanguage(newLang);
                  }}
                >
                  <Languages className="w-5 h-5 flex-shrink-0" />
                  <span className="ml-3">
                    {getAdminLanguage() === 'en' ? 'Afrikaans' : 'English'}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg py-3 mt-1"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="ml-3">{t('nav.logout')}</span>
                </Button>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f5f0e8] md:ml-2">
        <AdminHeader title={title} />

        <div className="flex-1 overflow-y-auto pb-4 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
};
