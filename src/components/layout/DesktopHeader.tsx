import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { alumniApi, notificationsApi } from "@/lib/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { InlineSearch } from "@/components/InlineSearch";
import { useTranslation } from "react-i18next";

interface DesktopHeaderProps {
  title: string;
}

export const DesktopHeader = ({ title }: DesktopHeaderProps) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user profile data to get year and photo
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

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "user"],
    queryFn: async () => {
      try {
        return await notificationsApi.getAll();
      } catch (error: any) {
        // Only log non-timeout errors (timeouts are expected when backend is slow)
        const isTimeout = error?.error?.includes("timeout") || error?.details?.includes("timeout");
        if (!isTimeout) {
          console.error("Error fetching notifications:", error);
        }
        return [];
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce requests
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes instead of 30 seconds
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
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
    enabled: !!user,
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce requests
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes instead of 30 seconds
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
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
      toast({ title: "Success", description: "All notifications cleared" });
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'error' in error ? (error as { error?: string }).error : undefined;
      toast({
        title: "Error",
        description: errorMessage || "Failed to clear notifications",
        variant: "destructive",
      });
    },
  });

  const profile = userData?.profile;
  const profileName = profile?.name || user?.name || "";
  const profileYear = profile?.year;
  const profilePhoto = profile?.nowPhoto;

  // Split name into first name and surname
  const nameParts = profileName.split(" ");
  const firstName = nameParts[0] || "";
  const surname = nameParts.slice(1).join(" ") || "";

  const handleLogout = () => {
    logout();
    // Show preloader by setting a flag in sessionStorage
    sessionStorage.setItem("showPreloader", "true");
    setTimeout(() => {
      window.location.href = "/login";
    }, 50);
  };

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 bg-transparent">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      
      <div className="flex items-center gap-4">
        <InlineSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-full bg-white relative"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        
        {/* Profile Button - Clickable, no dropdown */}
        <Button 
          variant="ghost" 
          className="flex items-center gap-3 h-12 pl-1 pr-3 bg-white hover:bg-gray-50 rounded-full"
          onClick={() => navigate("/profile")}
        >
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={profilePhoto || undefined} alt={profileName} />
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm">
              {firstName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left hidden lg:block">
            <div className="text-sm font-medium text-foreground">
              {firstName} {surname}
            </div>
            {profileYear && (
              <div className="text-xs text-muted-foreground">{t('profile.class_of', { year: profileYear })}</div>
            )}
          </div>
        </Button>
      </div>

      {/* Notifications Dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('notifications.title')}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {t('notifications.unread_count', { count: unreadCount })}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {t('notifications.description')}
                </DialogDescription>
              </div>
              {notifications.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  {markAllAsReadMutation.isPending ? t('notifications.clearing') : t('notifications.clear_all')}
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('notifications.no_notifications')}</p>
              </div>
            ) : (
              notifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`border transition-all ${
                    !notification.read
                      ? "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              notification.type === "reunion"
                                ? "default"
                                : notification.type === "story"
                                ? "secondary"
                                : notification.type === "member"
                                ? "outline"
                                : "outline"
                            }
                          >
                            {notification.type}
                          </Badge>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <h3 className="font-semibold text-base mb-1">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              markAsReadMutation.mutate(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                          >
                            {t('notifications.mark_read')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setNotificationsOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

