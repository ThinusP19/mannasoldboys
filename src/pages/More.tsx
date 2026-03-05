import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Heart, Settings, LogOut, Bell, Briefcase, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { useTranslation } from 'react-i18next';

const More = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch unread count for notifications
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread", "user"],
    queryFn: async () => {
      try {
        return await notificationsApi.getUnreadCount();
      } catch (error) {
        return { count: 0 };
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  const menuItems = [
    { icon: Bell, title: t('nav.notifications'), path: "/notifications", badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: Briefcase, title: "Marketplace", path: "/marketplace" },
    { icon: Award, title: "Sponsors", path: "/sponsors" },
    { icon: Heart, title: t('more.in_memoriam'), path: "/memorial" },
    { icon: Settings, title: t('nav.settings'), path: "/settings" },
  ];

  return (
    <AppLayout title={t('nav.more')}>
      <div className="p-4 md:p-8 bg-[#f5f0e8] min-h-full">
        <div className="max-w-2xl mx-auto space-y-3">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer border-0 shadow-sm hover:shadow-md transition-all bg-white relative"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <CardTitle className="text-base font-medium">{item.title}</CardTitle>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}

          <Card className="cursor-pointer border-0 shadow-sm hover:shadow-md transition-all bg-white border-destructive/20">
            <CardHeader className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <CardTitle className="text-base font-medium text-destructive">{t('nav.logout')}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default More;
