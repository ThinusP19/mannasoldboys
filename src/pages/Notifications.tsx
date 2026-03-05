import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, Check, Calendar, BookOpen, UserCheck, FolderOpen, Shield, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';

// Notification type configuration matching mobile app
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  reunion: {
    icon: <Calendar className="w-4 h-4" />,
    color: '#3b82f6',
    bgColor: '#dbeafe',
    label: 'Reunion',
  },
  story: {
    icon: <BookOpen className="w-4 h-4" />,
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    label: 'Story',
  },
  member: {
    icon: <UserCheck className="w-4 h-4" />,
    color: '#22c55e',
    bgColor: '#dcfce7',
    label: 'Member',
  },
  project: {
    icon: <FolderOpen className="w-4 h-4" />,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    label: 'Project',
  },
  admin_action: {
    icon: <Shield className="w-4 h-4" />,
    color: '#d97706',
    bgColor: '#fef3c7',
    label: 'Admin',
  },
  general: {
    icon: <Info className="w-4 h-4" />,
    color: '#3b82f6',
    bgColor: '#dbeafe',
    label: 'General',
  },
};

// Format time ago helper
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const Notifications = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);

  // Clear notification cache when user changes (prevents seeing another user's notifications)
  useEffect(() => {
    if (user?.id && lastUserIdRef.current !== null && lastUserIdRef.current !== user.id) {
      // User changed - clear all notification caches
      queryClient.removeQueries({ queryKey: ["notifications"] });
    }
    lastUserIdRef.current = user?.id || null;
  }, [user?.id, queryClient]);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", "user"],
    queryFn: async () => {
      try {
        return await notificationsApi.getAll();
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread", "user"],
    queryFn: async () => {
      try {
        return await notificationsApi.getUnreadCount();
      } catch (error) {
        return { count: 0 };
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => await notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "user"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread", "user"] });
    },
  });

  // Mark all as read mutation - actually deletes all notifications
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Delete all notifications for the user instead of marking as read
      await Promise.all(notifications.map((n: any) => notificationsApi.delete(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "user"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread", "user"] });
      toast({ title: t('status.success'), description: t('notifications.all_cleared') });
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'error' in error ? (error as { error?: string }).error : undefined;
      toast({
        title: t('status.error'),
        description: errorMessage || t('notifications.clear_error'),
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => await notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "user"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread", "user"] });
      toast({ title: t('status.success'), description: t('notifications.notification_deleted') });
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'error' in error ? (error as { error?: string }).error : undefined;
      toast({
        title: t('status.error'),
        description: errorMessage || t('notifications.delete_error'),
        variant: "destructive",
      });
    },
  });

  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPE_CONFIG[type] || NOTIFICATION_TYPE_CONFIG.general;
  };

  return (
    <AppLayout title={t('notifications.title')}>
      <div className="p-4 md:p-8 bg-[#f5f0e8] min-h-full">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Header - matching mobile app style */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1a1f2c]">{notifications.length} {t('notifications.title')}</h2>
                {unreadCount > 0 && (
                  <span className="inline-block px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                    {unreadCount} {t('admin.new')}
                  </span>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 gap-1"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">{t('notifications.mark_read')}</span>
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <Card className="border-0 shadow-sm bg-white rounded-xl">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">{t('notifications.loading')}</p>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-semibold">{t('notifications.no_notifications')}</p>
                <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: any) => {
                const typeConfig = getTypeConfig(notification.type);
                return (
                  <Card
                    key={notification.id}
                    className={`border-0 shadow-sm rounded-xl transition-all ${
                      !notification.read
                        ? "bg-white border-l-4 border-l-blue-500"
                        : "bg-white"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: typeConfig.bgColor }}
                        >
                          <span style={{ color: typeConfig.color }}>{typeConfig.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Type Badge */}
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold capitalize"
                              style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.color }}
                            >
                              {typeConfig.label}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            )}
                          </div>

                          <h3 className={`text-sm mb-1 ${!notification.read ? 'font-semibold' : 'font-medium'} text-[#1a1f2c]`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Actions row - visible on mobile */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 flex-1">
                              {formatTimeAgo(notification.timestamp || notification.createdAt)}
                            </p>
                            {!notification.read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markAsReadMutation.mutate(notification.id); }}
                                disabled={markAsReadMutation.isPending}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 hover:bg-green-200 transition-colors text-green-700 text-xs font-medium"
                              >
                                <Check className="w-4 h-4" />
                                <span>Gelees</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotificationMutation.mutate(notification.id); }}
                              disabled={deleteNotificationMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors text-red-700 text-xs font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Verwyder</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
