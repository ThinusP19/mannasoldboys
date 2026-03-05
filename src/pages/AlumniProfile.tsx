import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Linkedin, Instagram, Facebook, Mail, Phone, Heart, MessageCircle, Share2, LogOut, Edit, Save, X, Key, ShieldCheck, MoreVertical, Grid3x3, User, Settings, ArrowLeft, Check, CheckCheck, BookOpen, Heart as HeartIcon, Calendar, Coins, UserPlus, ChevronRight, Menu, X as XIcon, FileText, Gift, Plus, Users, TreePine, Bell, Eye, EyeOff, Trash2, Camera, Crown, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { alumniApi, authApi, notificationsApi } from "@/lib/api";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MembershipRequestDialog } from "@/components/MembershipRequestDialog";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
} from "@/lib/push-notifications";
import { Switch } from "@/components/ui/switch";

const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Memoize isOwnProfile to prevent query from toggling
  const isOwnProfile = useMemo(() => location.pathname === "/profile", [location.pathname]);
  
  // Fetch user data with profile for own profile
  const { data: userData, isLoading: isLoadingUser, error: userError, refetch: refetchUser } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => {
      try {
        const data = await alumniApi.getMe();
        console.log("✅ PROFILE DATA RECEIVED:", data);
        console.log("✅ PROFILE OBJECT:", data?.profile);
        return data;
      } catch (error) {
        console.error("❌ Error fetching user profile:", error);
        throw error;
      }
    },
    enabled: isOwnProfile,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get the profile data - use fetched data for own profile, with safe defaults
  const profile = useMemo(() => {
    return isOwnProfile && userData ? (userData.profile || null) : null;
  }, [isOwnProfile, userData]);

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);
  const [storedSecurityAnswer, setStoredSecurityAnswer] = useState<string>("");
  const [showSecurityQuestion, setShowSecurityQuestion] = useState(true);
  const [showSecurityAnswerInput, setShowSecurityAnswerInput] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

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

  // Fetch real notifications from API
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", "user"],
    queryFn: async () => {
      try {
        return await notificationsApi.getAll();
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    enabled: isOwnProfile && !!authUser,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
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
    enabled: isOwnProfile && !!authUser,
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
  
  // Mark all as read - actually deletes all notifications
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

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };
  
  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    email: "",
    phone: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    contactPermission: "all" as "all" | "year-group" | "none",
    securityQuestion: "What was your first pet's name?",
    securityAnswer: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    thenPhoto: null as File | null,
    nowPhoto: null as File | null,
  });

  // Combine user and profile data for display with safe fallbacks - memoized to prevent re-renders
  // Use formData.contactPermission as the source of truth for immediate UI updates
  const alumni = useMemo(() => {
    if (!isOwnProfile || !userData) return null;
    return {
      id: userData.id,
      name: userData.profile?.name || userData.name || "",
      email: userData.profile?.email || userData.email || "",
      year: userData.profile?.year || null,
      bio: userData.profile?.bio || "",
      phone: userData.profile?.phone || "",
      linkedin: userData.profile?.linkedin || "",
      instagram: userData.profile?.instagram || "",
      facebook: userData.profile?.facebook || "",
      // Use formData.contactPermission as source of truth for immediate updates
      contactPermission: formData.contactPermission || userData.profile?.contactPermission || "all",
      thenPhoto: userData.profile?.thenPhoto || null,
      nowPhoto: userData.profile?.nowPhoto || null,
      verificationStatus: userData.profile?.verificationStatus || null,
      role: userData.role,
      isMember: userData.isMember,
      membershipTier: userData.membershipTier,
      monthlyAmount: userData.monthlyAmount,
    };
  }, [isOwnProfile, userData, formData.contactPermission]);

  // Initialize form data when userData loads or changes
  useEffect(() => {
    if (userData && !isEditing) {
      const profile = userData.profile || {};
      setFormData(prev => ({
        ...prev,
        name: profile.name || userData.name || "",
        bio: profile.bio || "",
        email: profile.email || userData.email || "",
        phone: profile.phone || "",
        linkedin: profile.linkedin || "",
        instagram: profile.instagram || "",
        facebook: profile.facebook || "",
        contactPermission: profile.contactPermission || "all",
        securityQuestion: profile.securityQuestion || prev.securityQuestion || "What was your first pet's name?",
        securityAnswer: "", // Don't load the answer for security reasons, user needs to re-enter it
      }));
    }
  }, [userData, isEditing]); // Update when userData changes

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // Returns data:image/jpeg;base64,...
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Convert images to base64 if new files were uploaded
      let thenPhotoBase64: string | null = null;
      let nowPhotoBase64: string | null = null;

      if (formData.thenPhoto) {
        try {
          thenPhotoBase64 = await fileToBase64(formData.thenPhoto);
        } catch (error) {
          console.error("Error converting thenPhoto to base64:", error);
          toast({
            title: t('status.error'),
            description: t('profile.photo_error'),
            variant: "destructive",
            duration: 5000,
          });
          setLoading(false);
          return;
        }
      }

      if (formData.nowPhoto) {
        try {
          nowPhotoBase64 = await fileToBase64(formData.nowPhoto);
        } catch (error) {
          console.error("Error converting nowPhoto to base64:", error);
          toast({
            title: t('status.error'),
            description: t('profile.photo_error'),
            variant: "destructive",
            duration: 5000,
          });
          setLoading(false);
          return;
        }
      }

      // Prepare profile data for update
      const profileData: any = {
        name: formData.name,
        bio: formData.bio,
        email: formData.email,
        phone: formData.phone || null,
        contactPermission: formData.contactPermission,
        linkedin: formData.linkedin || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        securityQuestion: formData.securityQuestion || null,
        securityAnswer: formData.securityAnswer || null,
      };

      // Only include images if new ones were uploaded
      // If no new image, the backend will preserve existing images
      if (thenPhotoBase64) {
        profileData.thenPhoto = thenPhotoBase64;
      }
      if (nowPhotoBase64) {
        profileData.nowPhoto = nowPhotoBase64;
      }

      // Update profile via API
      await alumniApi.createOrUpdateProfile(profileData);
      
      // Store security answer for viewing (only if it was entered)
      if (formData.securityAnswer) {
        setStoredSecurityAnswer(formData.securityAnswer);
      }
      
      // Invalidate all relevant queries to refresh profile visibility
      await queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["alumni"] });
      await queryClient.invalidateQueries({ queryKey: ["year-group-members"] });
      await queryClient.invalidateQueries({ queryKey: ["all-year-groups"] });
      
      // Refresh user data to show updated profile
      await refetchUser();
      
      // Reset image file inputs and security answer in form (but keep stored one)
      setFormData(prev => ({ ...prev, thenPhoto: null, nowPhoto: null, securityAnswer: "" }));
      setIsEditing(false);
      setShowSecurityAnswer(false);
      setLoading(false);
      
      // Build a comprehensive success message based on what was updated
      const updates: string[] = [];
      
      // Check what was updated
      if (formData.name || formData.bio || formData.email || formData.phone || 
          formData.linkedin || formData.instagram || formData.facebook) {
        updates.push("profile information");
      }
      
      if (formData.contactPermission) {
        const permissionLabel =
          formData.contactPermission === "all" ? "Visible to all alumni" :
          formData.contactPermission === "year-group" ? "Visible to year group only" :
          "Ghost Mode (Not visible)";
        updates.push(`visibility settings (${permissionLabel})`);
      }
      
      if (formData.securityQuestion || formData.securityAnswer) {
        updates.push("security question");
      }
      
      if (thenPhotoBase64 || nowPhotoBase64) {
        updates.push("photos");
      }
      
      const updateMessage = updates.length > 0 
        ? `Your ${updates.join(", ")} ${updates.length === 1 ? "has" : "have"} been saved successfully.`
        : "Your profile has been updated successfully.";
      
      toast({
        title: t('status.saved'),
        description: updateMessage,
        duration: 4000,
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setLoading(false);
      toast({
        title: t('status.error'),
        description: error?.error || error?.details || t('errors.generic'),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleCancel = () => {
    // Reset form data from current user data
    if (userData) {
      setFormData({
        name: userData.profile?.name || userData.name || "",
        bio: userData.profile?.bio || "",
        email: userData.profile?.email || userData.email || "",
        phone: userData.profile?.phone || "",
        linkedin: userData.profile?.linkedin || "",
        instagram: userData.profile?.instagram || "",
        facebook: userData.profile?.facebook || "",
        contactPermission: userData.profile?.contactPermission || "all",
        securityQuestion: userData.profile?.securityQuestion || "What was your first pet's name?",
        securityAnswer: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        thenPhoto: null,
        nowPhoto: null,
      });
    }
    setIsEditing(false);
    setShowPasswordReset(false);
  };

  const handlePasswordReset = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: t('profile.password_mismatch'),
        description: t('validation.password_mismatch'),
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    if (!formData.newPassword || !formData.confirmPassword) {
      toast({
        title: t('validation.missing_info'),
        description: t('validation.fill_required'),
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    // Change password via API
    handlePasswordChange();
  };

  const handlePasswordChange = async () => {
    // Validate inputs
    if (!formData.currentPassword) {
      toast({
        title: t('validation.missing_info'),
        description: t('validation.fill_required'),
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      toast({
        title: t('validation.missing_info'),
        description: t('validation.fill_required'),
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: t('status.error'),
        description: t('profile.password_min_length'),
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: t('profile.password_mismatch'),
        description: t('validation.password_mismatch'),
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword(formData.currentPassword, formData.newPassword);
      
      toast({
        title: t('profile.password_updated'),
        description: t('profile.password_updated'),
        duration: 5000,
      });
      
      setShowPasswordReset(false);
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (error: any) {
      toast({
        title: t('status.error'),
        description: error?.error || error?.details || t('profile.incorrect_current_password'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    // Clear auth state first
    logout();
    // Show preloader by setting a flag in sessionStorage
    sessionStorage.setItem("showPreloader", "true");
    // Force full page reload to ensure clean logout
    setTimeout(() => {
      window.location.href = "/login";
    }, 50);
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      toast({
        title: t('validation.required'),
        description: t('validation.fill_required'),
        variant: "destructive",
      });
      return;
    }

    try {
      setDeleteAccountLoading(true);
      await authApi.deleteAccount(deleteAccountPassword);

      toast({
        title: t('status.success'),
        description: t('status.success'),
      });

      // Clear auth state and redirect to login
      logout();
      sessionStorage.setItem("showPreloader", "true");
      setTimeout(() => {
        window.location.href = "/login";
      }, 50);
    } catch (error: any) {
      const errorMessage = error?.error || error?.details || "Failed to delete account";
      toast({
        title: t('status.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteAccountLoading(false);
      setDeleteAccountPassword("");
    }
  };

  const handleWhatsAppConnect = () => {
    if (!alumni?.phone) return;
    // Format phone number for WhatsApp (remove spaces, +, and other non-digits except country code)
    const phoneNumber = alumni.phone.replace(/\s+/g, "").replace(/\+/g, "");
    // Open WhatsApp with the phone number
    window.open(`https://wa.me/${phoneNumber}`, "_blank");
  };

  // Show loading state while fetching
  if (isLoadingUser) {
    return (
      <AppLayout title={t('profile.title')}>
        <div className="p-0 md:p-8 bg-[#f5f0e8] min-h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('profile.loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show error state if fetch failed
  if (userError) {
    console.error("Profile fetch error:", userError);
    return (
      <AppLayout title={t('profile.title')}>
        <div className="p-0 md:p-8 bg-[#f5f0e8] min-h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{t('errors.try_again')}</p>
            <Button onClick={() => refetchUser()}>{t('common.refresh')}</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If no alumni data, show empty state (shouldn't happen, but safe fallback)
  if (!alumni && !isLoadingUser) {
    return (
      <AppLayout>
        <div className="p-8 text-center bg-[#f5f0e8] min-h-full">
          <p className="text-muted-foreground">{t('errors.not_found')}</p>
          <Button onClick={() => navigate("/directory")} className="mt-4">
            {t('nav.back')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('profile.title')}>
      <div className="p-0 md:p-8 bg-[#f5f0e8] min-h-full">
        {/* Mobile - Redesigned Profile (Matching Mobile App) */}
        <div className="md:hidden bg-[#f5f0e8] min-h-screen pb-20 mobile-scroll">
          {/* Header Section */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-start justify-between">
              <div>
                {!isOwnProfile ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 -ml-2"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-[#1a1f2c]">{t('profile.title')}</h1>
                    <p className="text-sm text-[#6b7280]">{t('profile.manage_account')}</p>
                  </>
                )}
              </div>
              {isOwnProfile && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 relative rounded-full bg-white shadow-md hover:bg-gray-50"
                    onClick={() => setShowNotifications(true)}
                  >
                    <Bell className="w-6 h-6 text-[#1a1f2c]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-full bg-white shadow-md hover:bg-gray-50"
                    onClick={() => setShowMenuSheet(true)}
                  >
                    <Menu className="w-6 h-6 text-[#1a1f2c]" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              {/* Profile Header Row */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-lg">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={alumni.nowPhoto || undefined} alt={alumni.name || "Profile"} />
                    <AvatarFallback className="bg-[#1e3a5f] text-white text-2xl font-bold">
                      {(alumni.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#1a1f2c] truncate">{alumni.name || t('profile.no_name')}</h2>
                  {alumni.year && (
                    <div className="inline-flex items-center gap-1.5 bg-sky-100 text-[#3b82f6] px-3 py-1 rounded-full text-xs font-medium mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t('profile.class_of', { year: alumni.year })}</span>
                    </div>
                  )}
                  {alumni.obNumber && (
                    <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium mt-1 ml-1">
                      <Crown className="w-3.5 h-3.5" />
                      <span>{alumni.obNumber}</span>
                    </div>
                  )}
                  {alumni.verificationStatus === "verified" && (
                    <Badge variant="default" className="text-xs px-2 py-0.5 h-5 mt-1 ml-1">
                      {t('status.approved')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              {alumni.bio && (
                <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">{alumni.bio}</p>
              )}

              {/* Social Links Row */}
              {(alumni.linkedin || alumni.instagram || alumni.facebook) && (
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#e5e7eb]">
                  {alumni.linkedin && (
                    <a
                      href={alumni.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#4b5563] transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {alumni.instagram && (
                    <a
                      href={alumni.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#4b5563] transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-[#E1306C]" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {alumni.facebook && (
                    <a
                      href={alumni.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#4b5563] transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-[#1877F2]" />
                      <span>Facebook</span>
                    </a>
                  )}
                </div>
              )}

              {/* Edit Profile Button */}
              {isOwnProfile && (
                <Button
                  variant="outline"
                  className={`w-full h-11 text-sm font-semibold ${
                    isEditing
                      ? "bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 border-[#1e3a5f]"
                      : "border-[#e5e7eb] hover:bg-gray-100 bg-white"
                  }`}
                  style={{ color: isEditing ? '#ffffff' : '#1a1f2c' }}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? t('common.cancel') : t('profile.edit_profile')}
                </Button>
              )}
            </div>

            {/* Then & Now Photos - Editable (only when editing) */}
            {isOwnProfile && isEditing && (
              <div className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1a1f2c]">{t('profile.then_now')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Then Photo */}
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleInputChange("thenPhoto", e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#f3f4f6] relative">
                      {(formData.thenPhoto || alumni.thenPhoto) ? (
                        <img
                          src={formData.thenPhoto ? URL.createObjectURL(formData.thenPhoto) : alumni.thenPhoto || ""}
                          alt="Then"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-[#9ca3af]" />
                        </div>
                      )}
                      {/* Camera icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      {/* Label at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-sm font-medium text-center">{t('profile.then')}</p>
                      </div>
                    </div>
                  </label>

                  {/* Now Photo */}
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleInputChange("nowPhoto", e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#f3f4f6] relative">
                      {(formData.nowPhoto || alumni.nowPhoto) ? (
                        <img
                          src={formData.nowPhoto ? URL.createObjectURL(formData.nowPhoto) : alumni.nowPhoto || ""}
                          alt="Now"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-[#9ca3af]" />
                        </div>
                      )}
                      {/* Camera icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      {/* Label at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-sm font-medium text-center">{t('profile.now')}</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Edit Profile Form - Only when editing */}
            {isOwnProfile && isEditing && (
              <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                    <Edit className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1a1f2c]">{t('profile.edit_profile')}</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium text-[#1a1f2c]">{t('profile.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-medium text-[#1a1f2c]">{t('profile.bio')}</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    className="min-h-[80px] text-sm"
                    placeholder={t('profile.bio_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-medium text-[#1a1f2c]">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+27 12 345 6789"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-xs font-medium text-[#1a1f2c]">{t('profile.social_linkedin')}</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-xs font-medium text-[#1a1f2c]">{t('profile.social_insta')}</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-xs font-medium text-[#1a1f2c]">{t('profile.social_fb')}</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange("facebook", e.target.value)}
                    placeholder="https://facebook.com/yourprofile"
                    className="h-10"
                  />
                </div>

                {/* Contact Permission/Visibility Setting */}
                <div className="space-y-3 pt-3 border-t border-[#e5e7eb]">
                  <Label className="text-xs font-semibold text-[#1a1f2c]">{t('settings.profile_visibility')}</Label>
                  <p className="text-xs text-[#6b7280]">
                    {t('settings.profile_visibility_desc')}
                  </p>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.contactPermission === "all"
                        ? "border-[#3b82f6] bg-blue-50/50"
                        : "border-[#e5e7eb] hover:bg-[#f5f0e8]/50"
                    }`}>
                      <div className="relative mt-1">
                        <input
                          type="radio"
                          name="contactPermission"
                          value="all"
                          checked={formData.contactPermission === "all"}
                          onChange={(e) => handleInputChange("contactPermission", e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.contactPermission === "all"
                            ? "border-[#3b82f6] bg-[#3b82f6]"
                            : "border-[#e5e7eb] bg-white"
                        }`}>
                          {formData.contactPermission === "all" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#1a1f2c] flex items-center gap-2">
                          {t('profile.visible_all')}
                          <Badge className="bg-[#3b82f6] hover:bg-[#3b82f6] text-white text-xs px-1.5 py-0">
                            {t('profile.visible_all_label')}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#6b7280]">{t('profile.visible_all_desc')}</div>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.contactPermission === "year-group"
                        ? "border-[#22c55e] bg-green-50/50"
                        : "border-[#e5e7eb] hover:bg-[#f5f0e8]/50"
                    }`}>
                      <div className="relative mt-1">
                        <input
                          type="radio"
                          name="contactPermission"
                          value="year-group"
                          checked={formData.contactPermission === "year-group"}
                          onChange={(e) => handleInputChange("contactPermission", e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.contactPermission === "year-group"
                            ? "border-[#22c55e] bg-[#22c55e]"
                            : "border-[#e5e7eb] bg-white"
                        }`}>
                          {formData.contactPermission === "year-group" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#1a1f2c] flex items-center gap-2">
                          {t('profile.visible_year')}
                          <Badge className="bg-[#22c55e] hover:bg-[#22c55e] text-white text-xs px-1.5 py-0">
                            {t('profile.visible_year_label')}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#6b7280]">{t('profile.visible_year_desc')}</div>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.contactPermission === "none"
                        ? "border-[#6b7280] bg-gray-50/50"
                        : "border-[#e5e7eb] hover:bg-[#f5f0e8]/50"
                    }`}>
                      <div className="relative mt-1">
                        <input
                          type="radio"
                          name="contactPermission"
                          value="none"
                          checked={formData.contactPermission === "none"}
                          onChange={(e) => handleInputChange("contactPermission", e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.contactPermission === "none"
                            ? "border-[#6b7280] bg-[#6b7280]"
                            : "border-[#e5e7eb] bg-white"
                        }`}>
                          {formData.contactPermission === "none" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#1a1f2c] flex items-center gap-2">
                          {t('profile.not_visible')}
                          <Badge className="bg-[#6b7280] hover:bg-[#6b7280] text-white text-xs px-1.5 py-0">
                            {t('profile.not_visible_label')}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#6b7280]">{t('profile.not_visible_desc')}</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-3">
                  <Button onClick={handleSave} className="w-full h-11 text-sm bg-[#1e3a5f] hover:bg-[#1e3a5f]/90" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? t('status.saving') : t('profile.save_changes')}
                  </Button>
                </div>
              </div>
            )}

            {/* Then & Now Section - Only when NOT editing */}
            {!isEditing && <div className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1f2c]">{t('profile.then_now')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-square rounded-xl overflow-hidden relative bg-[#f5f0e8]">
                  {alumni.thenPhoto ? (
                    <img
                      src={alumni.thenPhoto}
                      alt="Then"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <User className="w-10 h-10 text-[#6b7280] mx-auto mb-2" />
                        <p className="text-xs text-[#6b7280]">{t('profile.then_photo')}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                    Then
                  </div>
                </div>
                <div className="aspect-square rounded-xl overflow-hidden relative bg-[#f5f0e8]">
                  {alumni.nowPhoto ? (
                    <img
                      src={alumni.nowPhoto}
                      alt="Now"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <User className="w-10 h-10 text-[#6b7280] mx-auto mb-2" />
                        <p className="text-xs text-[#6b7280]">{t('profile.now_photo')}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                    Now
                  </div>
                </div>
              </div>
            </div>}

            {/* Contact Information Section */}
            {alumni.contactPermission !== "none" && (
              <div className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1a1f2c]">{t('profile.contact_info')}</h3>
                </div>
                <div className="space-y-3">
                  {alumni.email && (
                    <div className="bg-[#f3f4f6] rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#6b7280]">{t('profile.email')}</p>
                        <a href={`mailto:${alumni.email}`} className="text-sm font-medium text-[#3b82f6] truncate block">
                          {alumni.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {alumni.phone && (
                    <div className="flex items-center gap-3">
                      <div className="bg-[#f3f4f6] rounded-xl p-3 flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-[#22c55e]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#6b7280]">{t('profile.phone')}</p>
                          <p className="text-sm font-medium text-[#1a1f2c]">{alumni.phone}</p>
                        </div>
                      </div>
                      {!isOwnProfile && (
                        <button
                          onClick={handleWhatsAppConnect}
                          className="w-12 h-12 rounded-full bg-[#22c55e] hover:bg-[#22c55e]/90 flex items-center justify-center flex-shrink-0"
                        >
                          <MessageCircle className="w-6 h-6 text-white" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#6b7280] mt-4">
                  {alumni.contactPermission === "all"
                    ? t('profile.visible_all')
                    : alumni.contactPermission === "year-group"
                    ? t('profile.visible_year')
                    : t('profile.not_visible')}
                </p>
              </div>
            )}

            {/* Password Section - Only for own profile */}
            {isOwnProfile && (
              <div className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Key className="w-5 h-5 text-[#3b82f6]" />
                    </div>
                    <span className="text-sm font-medium text-[#1a1f2c]">{t('profile.password')}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordReset(!showPasswordReset)}
                    className="text-[#3b82f6] hover:text-[#3b82f6] hover:bg-blue-50 h-8 px-3"
                  >
                    {showPasswordReset ? t('common.cancel') : t('profile.reset')}
                  </Button>
                </div>
                {showPasswordReset && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-[#e5e7eb]">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs text-[#1a1f2c]">{t('profile.new_password')}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange("newPassword", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs text-[#1a1f2c]">{t('profile.confirm_password')}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <Button onClick={handlePasswordReset} className="w-full h-10 text-sm bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                      {t('profile.update_password')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons - Only for own profile */}
            {isOwnProfile && !isEditing && (
              <div className="space-y-3 pb-4">
                <Button
                  variant="ghost"
                  className="w-full h-12 text-sm font-medium justify-center text-[#1a1f2c] bg-white hover:bg-gray-50 shadow-md rounded-2xl"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  {t('auth.logout')}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full h-12 text-sm font-medium bg-[#ef4444] hover:bg-[#ef4444]/90 rounded-2xl"
                  onClick={() => setDeleteAccountDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile.delete_account')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop - Card Layout */}
        <div className="hidden md:block">
          <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
              <div className="flex gap-6 items-start">
              {/* Profile Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-4xl shadow-lg overflow-hidden">
                    {alumni.nowPhoto ? (
                      <img 
                        src={alumni.nowPhoto} 
                        alt={alumni.name || "Profile"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(alumni.name || "U").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {alumni.verificationStatus && (
                    <Badge
                      variant={alumni.verificationStatus === "verified" ? "default" : "secondary"}
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    >
                      {alumni.verificationStatus === "verified" ? t('status.approved') : t('status.pending')}
                    </Badge>
                  )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    {isEditing ? (
                      <>
                        <div className="space-y-2 mb-4">
                          <Label htmlFor="name">{t('profile.name')}</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="text-2xl font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          {alumni.year && <Badge variant="secondary">{t('profile.class_of', { year: alumni.year })}</Badge>}
                          {alumni.obNumber && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                              <Crown className="w-3 h-3 mr-1" />
                              {alumni.obNumber}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">{t('profile.bio')}</Label>
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => handleInputChange("bio", e.target.value)}
                            className="min-h-[100px]"
                            placeholder={t('profile.bio_placeholder')}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                <CardTitle className="text-3xl mb-2">{alumni.name}</CardTitle>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{t('profile.class_of', { year: alumni.year })}</Badge>
                  {alumni.obNumber && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                      <Crown className="w-3 h-3 mr-1" />
                      {alumni.obNumber}
                    </Badge>
                  )}
                </div>
                        <p className="text-muted-foreground text-base">{alumni.bio}</p>
                      </>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className={isEditing ? "bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white border-[#1e3a5f]" : "text-[#1a1f2c]"}
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            {t('common.cancel')}
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('profile.edit_profile')}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Then and Now Photos Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">{t('profile.then_now')}</h3>
              {isEditing ? (
                <div className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="thenPhoto-desktop">{t('profile.then_photo')}</Label>
                      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border/50 relative">
                        {(formData.thenPhoto ? URL.createObjectURL(formData.thenPhoto) : alumni.thenPhoto) ? (
                          <img
                            src={formData.thenPhoto ? URL.createObjectURL(formData.thenPhoto) : alumni.thenPhoto || ""}
                            alt="Then"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/30">
                            <div className="text-center">
                              <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">{t('profile.then_photo')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        id="thenPhoto-desktop"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleInputChange("thenPhoto", e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      {formData.thenPhoto && (
                        <p className="text-xs text-muted-foreground">{formData.thenPhoto.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nowPhoto-desktop">{t('profile.now_photo')}</Label>
                      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border/50 relative">
                        {(formData.nowPhoto ? URL.createObjectURL(formData.nowPhoto) : alumni.nowPhoto) ? (
                          <img
                            src={formData.nowPhoto ? URL.createObjectURL(formData.nowPhoto) : alumni.nowPhoto || ""}
                            alt="Now"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/30">
                            <div className="text-center">
                              <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">{t('profile.now_photo')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        id="nowPhoto-desktop"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleInputChange("nowPhoto", e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      {formData.nowPhoto && (
                        <p className="text-xs text-muted-foreground">{formData.nowPhoto.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border/50 relative">
                    {alumni.thenPhoto ? (
                      <img
                        src={alumni.thenPhoto}
                        alt="Then"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/30">
                        <div className="text-center">
                          <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">{t('profile.then_photo')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border/50 relative">
                    {alumni.nowPhoto ? (
                      <img
                        src={alumni.nowPhoto}
                        alt="Now"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/30">
                        <div className="text-center">
                          <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">{t('profile.now_photo')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4">{t('profile.connect')}</h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">{t('profile.social_linkedin')}</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">{t('profile.social_insta')}</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">{t('profile.social_fb')}</Label>
                    <Input
                      id="facebook"
                      value={formData.facebook}
                      onChange={(e) => handleInputChange("facebook", e.target.value)}
                      placeholder="https://facebook.com/yourprofile"
                    />
                  </div>

                  {/* Contact Permission/Visibility Setting */}
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <Label className="text-base font-semibold">{t('settings.profile_visibility')}</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        {t('settings.profile_visibility_desc')}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.contactPermission === "all"
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-gray-200 hover:bg-muted/50"
                      }`}>
                        <div className="relative mt-1">
                          <input
                            type="radio"
                            name="contactPermission"
                            value="all"
                            checked={formData.contactPermission === "all"}
                            onChange={(e) => handleInputChange("contactPermission", e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.contactPermission === "all"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 bg-white"
                          }`}>
                            {formData.contactPermission === "all" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {t('profile.visible_all')}
                            <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs px-2 py-0">
                              {t('profile.visible_all_label')}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{t('profile.visible_all_desc')}</div>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.contactPermission === "year-group"
                          ? "border-green-500 bg-green-50/50"
                          : "border-gray-200 hover:bg-muted/50"
                      }`}>
                        <div className="relative mt-1">
                          <input
                            type="radio"
                            name="contactPermission"
                            value="year-group"
                            checked={formData.contactPermission === "year-group"}
                            onChange={(e) => handleInputChange("contactPermission", e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.contactPermission === "year-group"
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300 bg-white"
                          }`}>
                            {formData.contactPermission === "year-group" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {t('profile.visible_year')}
                            <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-2 py-0">
                              {t('profile.visible_year_label')}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{t('profile.visible_year_desc')}</div>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.contactPermission === "none"
                          ? "border-gray-600 bg-gray-50/50"
                          : "border-gray-200 hover:bg-muted/50"
                      }`}>
                        <div className="relative mt-1">
                          <input
                            type="radio"
                            name="contactPermission"
                            value="none"
                            checked={formData.contactPermission === "none"}
                            onChange={(e) => handleInputChange("contactPermission", e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.contactPermission === "none"
                              ? "border-gray-600 bg-gray-600"
                              : "border-gray-300 bg-white"
                          }`}>
                            {formData.contactPermission === "none" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {t('profile.not_visible')}
                            <Badge className="bg-gray-600 hover:bg-gray-600 text-white text-xs px-2 py-0">
                              {t('profile.not_visible_label')}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{t('profile.not_visible_desc')}</div>
                        </div>
                      </label>
                    </div>
                    {/* Current Permission Badge */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('profile.current_setting')}:</span>
                        {formData.contactPermission === "all" ? (
                          <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-sm">
                            {t('profile.visible_all')}
                          </Badge>
                        ) : formData.contactPermission === "year-group" ? (
                          <Badge className="bg-green-500 hover:bg-green-500 text-white text-sm">
                            {t('profile.visible_year')}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-600 hover:bg-gray-600 text-white text-sm">
                            {t('profile.not_visible')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="flex flex-wrap gap-3">
                {alumni.phone && !isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppConnect}
                    className="bg-green-500 hover:bg-green-600 border-green-500 text-white hover:text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                {alumni.linkedin && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={alumni.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {alumni.instagram && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={alumni.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                )}
                {alumni.facebook && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={alumni.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </a>
                  </Button>
                )}
              </div>
              )}
            </div>

            {/* Contact Details */}
            {alumni.contactPermission !== "none" && (
              <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{t('profile.email')}</h3>
                  </div>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('profile.email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                        />
                      </div>
                <div className="space-y-2">
                        <Label htmlFor="phone">{t('profile.phone')}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                  {alumni.email && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Mail className="w-5 h-5" />
                      <span>{alumni.email}</span>
                    </div>
                  )}
                  {alumni.phone && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <Phone className="w-5 h-5" />
                      <span>{alumni.phone}</span>
                          </div>
                          {!isOwnProfile && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleWhatsAppConnect}
                              className="bg-green-500 hover:bg-green-600 border-green-500 text-white hover:text-white"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    {alumni.contactPermission === "all" ? (
                      <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs">
                        {t('profile.visible_all')}
                      </Badge>
                    ) : alumni.contactPermission === "year-group" ? (
                      <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs">
                        {t('profile.visible_year')}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500 hover:bg-gray-500 text-white text-xs">
                        {t('profile.not_visible')}
                      </Badge>
                    )}
                  </div>
              </div>
            )}

            {/* Password Reset - Only show on own profile */}
            {isOwnProfile && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{t('profile.password')}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordReset(!showPasswordReset)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {showPasswordReset ? t('common.cancel') : t('profile.reset_password')}
                  </Button>
                </div>
                {showPasswordReset && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">{t('profile.current_password')}</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                        placeholder={t('profile.current_password_placeholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{t('profile.new_password')}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange("newPassword", e.target.value)}
                        placeholder={t('profile.new_password_placeholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('profile.confirm_password')}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder={t('profile.confirm_password_placeholder')}
                      />
                    </div>
                    <Button onClick={handlePasswordReset} className="w-full" disabled={loading}>
                      {loading ? t('status.saving') : t('profile.update_password')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Edit/Save Buttons - Only show on own profile */}
            {isOwnProfile && isEditing && (
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSave} className="flex-1" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('status.saving') : t('profile.save_changes')}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1" disabled={loading}>
                  <X className="w-4 h-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              </div>
            )}

              {/* Logout & Delete Account - Only show on own profile */}
              {isOwnProfile && !isEditing && (
                <div className="pt-6 border-t space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('auth.logout')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteAccountDialogOpen(true)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('common.delete')}
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>
        </div>
      </div>


      {/* Menu Item Sheet */}
      <Sheet open={selectedMenuItem !== null} onOpenChange={(open) => !open && setSelectedMenuItem(null)}>
        <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto bg-[#000000] text-white border-gray-900 [&>button]:hidden">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMenuItem(null)}
                className="h-8 w-8 text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <SheetTitle className="text-white">
                {selectedMenuItem === "member" && t('membership.become_member')}
                {selectedMenuItem === "stories" && t('nav.stories')}
                {selectedMenuItem === "memoriam" && t('nav.memorial')}
                {selectedMenuItem === "give-back" && t('nav.giving')}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            {selectedMenuItem === "member" && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle>{t('giving.join_member')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('giving.min_amount')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">{t('giving.what_you_get')}</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{t('giving.perk_photos')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{t('giving.perk_contacts')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{t('giving.perk_chats')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{t('giving.perk_events')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{t('giving.perk_stories')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{t('giving.perk_cap')}</span>
                      </li>
                    </ul>
                  </div>
                  <Button className="w-full bg-accent text-white">{t('membership.become_member')}</Button>
                </CardContent>
              </Card>
            )}

            {selectedMenuItem === "stories" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('stories.title')}</h3>
                </div>
                <p className="text-sm text-gray-400">{t('stories.description')}</p>
                <div className="space-y-4">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-base">Story Title</CardTitle>
                      <p className="text-xs text-muted-foreground">By Author Name</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Story content preview...</p>
                      <Button variant="link" className="px-0 h-auto text-xs mt-2">
                        {t('stories.read_more')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {selectedMenuItem === "memoriam" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('memorial.title')}</h3>
                </div>
                <p className="text-sm text-gray-400">{t('memorial.description')}</p>
                <div className="space-y-4">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <HeartIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{t('profile.name')}</CardTitle>
                          <p className="text-sm text-muted-foreground">{t('profile.class_of', { year: 2015 })}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{t('memorial.tribute')}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{t('reunion.date')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {selectedMenuItem === "give-back" && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle>{t('giving.join_member')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('giving.min_amount')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">{t('giving.what_you_get')}</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• {t('giving.perk_photos')}</li>
                      <li>• {t('giving.perk_contacts')}</li>
                      <li>• {t('giving.perk_chats')}</li>
                      <li>• {t('giving.perk_events')}</li>
                      <li>• {t('giving.perk_stories')}</li>
                      <li>• {t('giving.perk_cap')}</li>
                    </ul>
                  </div>
                  <Button className="w-full bg-accent text-white">{t('membership.become_member')}</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Modal - Mobile */}
      <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
        <SheetContent side="bottom" className="w-full h-[60vh] rounded-t-2xl overflow-hidden flex flex-col md:hidden p-0 bg-white [&>button]:hidden">
          <div className="px-4 pt-3">
            <SheetHeader>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#dbeafe] flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  <SheetTitle className="text-base font-bold text-[#1a1f2c]">{t('notifications.title')}</SheetTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)} className="h-8 w-8">
                  <XIcon className="w-5 h-5 text-[#6b7280]" />
                </Button>
              </div>
            </SheetHeader>
          </div>

          <div className="px-4 py-2">
            <span className="text-sm text-[#6b7280]">{notifications.length} total</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 mt-2 space-y-2 pb-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-[#d1d5db]" />
                </div>
                <p className="text-[#6b7280] text-base font-semibold">No notifications</p>
                <p className="text-[#9ca3af] text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    notification.read
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.read ? "bg-gray-400" : "bg-accent"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-semibold ${
                          notification.read ? "text-gray-600" : "text-foreground"
                        }`}>{notification.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        notification.read ? "text-muted-foreground" : "text-foreground"
                      }`}>{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Menu Sheet - Mobile */}
      <Sheet open={showMenuSheet} onOpenChange={setShowMenuSheet}>
        <SheetContent side="bottom" className="w-full h-auto max-h-[70vh] rounded-t-3xl overflow-hidden flex flex-col md:hidden p-0 bg-white [&>button]:hidden">
          {/* Header */}
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between py-4 border-b">
              <span className="text-lg font-bold text-[#1a1f2c]">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setShowMenuSheet(false)} className="h-8 w-8">
                <XIcon className="w-5 h-5 text-[#6b7280]" />
              </Button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 px-6 py-4 space-y-1">
            {/* Become a Member - only show if not already a member */}
            {userData?.isMember !== true && (
              <div
                onClick={() => {
                  setShowMenuSheet(false);
                  setMembershipDialogOpen(true);
                }}
                className="flex items-center py-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#fef3c7] flex items-center justify-center mr-4">
                  <Crown className="w-5 h-5 text-[#d97706]" />
                </div>
                <div className="flex-1">
                  <span className="text-base font-semibold text-[#1a1f2c]">Become a Member</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            )}

            {/* Directory */}
            <div
              onClick={() => {
                setShowMenuSheet(false);
                const isMember = userData?.isMember === true;
                if (!isMember) {
                  setMembershipDialogOpen(true);
                } else {
                  navigate("/directory");
                }
              }}
              className="flex items-center py-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#e0e7ff] flex items-center justify-center mr-4">
                <Users className="w-5 h-5 text-[#4f46e5]" />
              </div>
              <div className="flex-1">
                <span className="text-base font-semibold text-[#1a1f2c]">Directory</span>
              </div>
              <div className="flex items-center gap-2">
                {userData?.isMember !== true && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">MEMBERS</span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Stories */}
            <div
              onClick={() => {
                setShowMenuSheet(false);
                const isMember = userData?.isMember === true;
                if (!isMember) {
                  setMembershipDialogOpen(true);
                } else {
                  navigate("/stories");
                }
              }}
              className="flex items-center py-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#dbeafe] flex items-center justify-center mr-4">
                <BookOpen className="w-5 h-5 text-[#2563eb]" />
              </div>
              <div className="flex-1">
                <span className="text-base font-semibold text-[#1a1f2c]">Stories</span>
              </div>
              <div className="flex items-center gap-2">
                {userData?.isMember !== true && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">MEMBERS</span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Push Notifications Toggle */}
            {pushSupported && (
              <div
                className="flex items-center py-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#dbeafe] flex items-center justify-center mr-4">
                  <Bell className="w-5 h-5 text-[#2563eb]" />
                </div>
                <div className="flex-1">
                  <span className="text-base font-semibold text-[#1a1f2c]">Push Notifications</span>
                </div>
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={handlePushToggle}
                  disabled={pushLoading}
                />
              </div>
            )}

            {/* Language Toggle */}
            <div
              onClick={() => {
                const currentLang = i18n.language?.startsWith('af') ? 'af' : 'en';
                const newLang = currentLang === 'en' ? 'af' : 'en';
                i18n.changeLanguage(newLang);
                localStorage.setItem('i18nextLng', newLang);
              }}
              className="flex items-center py-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#e0e7ff] flex items-center justify-center mr-4">
                <Globe className="w-5 h-5 text-[#4f46e5]" />
              </div>
              <div className="flex-1">
                <span className="text-base font-semibold text-[#1a1f2c]">Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                  {i18n.language?.startsWith('af') ? 'AF' : 'EN'}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Logout */}
            <div
              onClick={() => {
                setShowMenuSheet(false);
                handleLogout();
              }}
              className="flex items-center py-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#fee2e2] flex items-center justify-center mr-4">
                <LogOut className="w-5 h-5 text-[#dc2626]" />
              </div>
              <div className="flex-1">
                <span className="text-base font-semibold text-[#dc2626]">Logout</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Membership Request Dialog */}
      <MembershipRequestDialog
        open={membershipDialogOpen}
        onOpenChange={setMembershipDialogOpen}
      />

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('common.delete')}</DialogTitle>
            <DialogDescription>
              {t('common.confirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletePassword">{t('profile.password')}</Label>
              <Input
                id="deletePassword"
                type="password"
                placeholder={t('profile.current_password_placeholder')}
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                disabled={deleteAccountLoading}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteAccountDialogOpen(false);
                  setDeleteAccountPassword("");
                }}
                disabled={deleteAccountLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={deleteAccountLoading || !deleteAccountPassword}
              >
                {deleteAccountLoading ? t('status.loading') : t('common.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default AlumniProfile;
