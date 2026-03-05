import { useState, useEffect, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  Alert,
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  Image as RNImage,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  YStack,
  XStack,
  Text,
  Button,
  Image,
  Spinner,
  TextArea,
} from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  LogOut,
  Pencil,
  Camera,
  Linkedin,
  Instagram,
  Facebook,
  Globe,
  Key,
  Save,
  X,
  Trash2,
  MessageCircle,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Menu,
  Heart,
  BookOpen,
  Flower2,
  ChevronRight,
  Crown,
  Bell,
} from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts';
import { alumniApi, authApi, notificationsApi, type Profile } from '../../src/services';
import { changeLanguage } from '../../src/i18n/config';
import { colors, brandColors } from '../../src/theme';
import { getImageUrl } from '../../src/utils/imageUrl';

// Helper to normalize URLs - adds https:// if missing
const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

// Card style matching web app
const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 8,
  elevation: 2,
  borderWidth: 0,
};

type ContactPermission = 'all' | 'year-group' | 'none';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'then' | 'now' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetPasswords, setShowResetPasswords] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      setUnreadCount(result?.count || 0);
    } catch (err) {
      // Silently fail
      setUnreadCount(0);
    }
  }, []);

  // Fetch all notifications for the modal
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const data = await notificationsApi.getAll();
      // Debug log removed for production
      setNotifications(Array.isArray(data) ? data : []);
      // Update unread count
      const unread = Array.isArray(data) ? data.filter((n: any) => !n.read).length : 0;
      setUnreadCount(unread);
    } catch (err) {
      // Error logged for debugging
      if (__DEV__) console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when modal opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen, fetchNotifications]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
    phone: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    contactPermission: 'all' as ContactPermission,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { data: profile, isLoading, isError, refetch } = useQuery<Profile>({
    queryKey: ['myProfile'],
    queryFn: () => alumniApi.getMyProfile(),
    refetchOnMount: 'always',  // Always fetch fresh data when screen mounts
    staleTime: 0,              // Consider data always stale
  });

  // Populate form data when profile loads (React Query v5 removed onSuccess callback)
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.name || user?.name || '',
        bio: profile.bio || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        linkedin: profile.linkedin || '',
        instagram: profile.instagram || '',
        facebook: profile.facebook || '',
        contactPermission: profile.contactPermission || 'all',
      }));
    }
  }, [profile, user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => alumniApi.createOrUpdateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.error || 'Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      setShowPasswordReset(false);
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      Alert.alert('Success', 'Password changed successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.error || 'Failed to change password');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    setDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setDeleteLoading(true);
    try {
      await authApi.deleteAccount(deletePassword);
      await logout();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Error', error?.error || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setDeletePassword('');
      setDeleteModalOpen(false);
    }
  };

  const handlePickImage = async (type: 'then' | 'now') => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to upload photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,  // Returns base64 directly - more reliable than FileSystem
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        if (!asset.base64) {
          Alert.alert('Upload Failed', 'Failed to process image. Please try again.');
          return;
        }

        setUploadingImage(type);

        try {
          const uri = asset.uri || '';
          const extension = uri.split('.').pop()?.toLowerCase();
          const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
          const base64WithPrefix = `data:${mimeType};base64,${asset.base64}`;

          const updateData = type === 'then' ? { thenPhoto: base64WithPrefix } : { nowPhoto: base64WithPrefix };
          await updateProfileMutation.mutateAsync(updateData);
        } catch (error: any) {
          if (__DEV__) console.error('Image upload error:', error);
          const message = error?.message || error?.error || 'Failed to upload photo';
          const isTimeout = message.toLowerCase().includes('timeout');
          const isPayloadTooLarge = message.toLowerCase().includes('payload') ||
                                    message.toLowerCase().includes('too large') ||
                                    message.toLowerCase().includes('413');
          Alert.alert(
            'Upload Failed',
            isTimeout
              ? 'Upload took too long. Please try a smaller image or check your connection.'
              : isPayloadTooLarge
              ? 'Image is too large. Please select a smaller image.'
              : message
          );
        } finally {
          setUploadingImage(null);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access photo library.');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        bio: formData.bio,
        email: formData.email,
        phone: formData.phone || null,
        linkedin: normalizeUrl(formData.linkedin),
        instagram: normalizeUrl(formData.instagram),
        facebook: normalizeUrl(formData.facebook),
        contactPermission: formData.contactPermission,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = () => {
    if (!formData.currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      name: profile?.name || user?.name || '',
      bio: profile?.bio || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
      linkedin: profile?.linkedin || '',
      instagram: profile?.instagram || '',
      facebook: profile?.facebook || '',
      contactPermission: profile?.contactPermission || 'all',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditing(false);
    setShowPasswordReset(false);
  };

  const handleSocialLink = (url: string | undefined | null) => {
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(fullUrl);
    }
  };

  const handleWhatsApp = () => {
    if (profile?.phone) {
      const cleanPhone = profile.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    }
  };

  const handleNotificationTap = async (notification: any) => {
    // Toggle expanded state
    setExpandedNotificationId((prev) =>
      prev === notification.id ? null : notification.id
    );

    // Mark as read if not already read
    if (!notification.read) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        Alert.alert('Error', err?.error || 'Failed to mark as read');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      Alert.alert('Error', err?.error || 'Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notification: any) => {
    try {
      await notificationsApi.delete(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      if (!notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      Alert.alert('Error', err?.error || 'Failed to delete notification');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reunion':
        return <Calendar size={18} color="#6366f1" />;
      case 'story':
        return <BookOpen size={18} color="#22c55e" />;
      case 'member':
        return <Crown size={18} color="#f59e0b" />;
      default:
        return <Bell size={18} color="#3b82f6" />;
    }
  };

  const currentLang = i18n.language?.startsWith('af') ? 'af' : 'en';

  const handleLanguageToggle = async () => {
    const newLang = currentLang === 'en' ? 'af' : 'en';
    await changeLanguage(newLang);
  };

  const handleMenuItemPress = (item: string) => {
    setMenuOpen(false);

    // Check membership for gated items
    if (!user?.isMember && ['stories', 'memoriam', 'giveback'].includes(item)) {
      Alert.alert(
        'Membership Required',
        'This feature is only available to members. Would you like to become a member?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Become a Member',
            onPress: () => router.push('/(stack)/membership'),
          },
        ]
      );
      return;
    }

    switch (item) {
      case 'membership':
        router.push('/(stack)/membership');
        break;
      case 'stories':
        router.push('/(stack)/stories');
        break;
      case 'memoriam':
        router.push('/(stack)/memoriam');
        break;
      case 'giveback':
        router.push('/(stack)/give-back');
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  if (isLoading && !refreshing) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="#f5f0e8">
        <Spinner size="large" color={brandColors.potchGimNavy} />
        <Text marginTop="$4" color="#6b7280">
          {t('common.loading')}
        </Text>
      </YStack>
    );
  }

  const displayName = profile?.name || user?.name || 'Unknown';
  const initials = displayName.charAt(0).toUpperCase();
  const alumni = {
    ...profile,
    name: displayName,
    email: profile?.email || user?.email || '',
    isMember: user?.isMember,
  };

  const getPermissionLabel = (permission: ContactPermission) => {
    switch (permission) {
      case 'all':
        return 'Visible to all alumni';
      case 'year-group':
        return 'Visible to year group only';
      case 'none':
        return 'Ghost Mode (Not visible)';
    }
  };

  const getPermissionColor = (permission: ContactPermission) => {
    switch (permission) {
      case 'all':
        return colors.light.accent;
      case 'year-group':
        return colors.light.success;
      case 'none':
        return '#6b7280';
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#f5f0e8' }}
      >
        <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 16,
          paddingBottom: 100,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$4">
          <YStack>
            <Text fontSize={28} fontWeight="bold" color="#1a1f2c">
              {t('profile.title')}
            </Text>
            <Text fontSize={14} color="#6b7280">
              Manage your account
            </Text>
          </YStack>
          <XStack gap={12}>
            {/* Notifications Bell */}
            <TouchableOpacity
              onPress={() => setNotificationsOpen(true)}
              style={styles.menuButton}
            >
              <Bell size={24} color={brandColors.potchGimNavy} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Hamburger Menu */}
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              style={styles.menuButton}
            >
              <Menu size={24} color={brandColors.potchGimNavy} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        <YStack gap="$4">
          {/* Profile Header Card */}
          <YStack {...cardStyle} padding={20}>
            {/* Avatar and Info Row */}
            <XStack alignItems="flex-start" gap={16}>
              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarContainer}>
                  {alumni.nowPhoto ? (
                    <RNImage source={{ uri: getImageUrl(alumni.nowPhoto)! }} style={styles.avatar} resizeMode="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text color="#ffffff" fontSize={32} fontWeight="700">
                        {initials}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Name and Badges */}
              <YStack flex={1} gap={8}>
                <Text fontSize={20} fontWeight="700" color="#1a1f2c">
                  {alumni.name}
                </Text>

                <XStack flexWrap="wrap" gap={8}>
                  {alumni.year && (
                    <View style={styles.yearBadge}>
                      <Calendar size={12} color={brandColors.potchGimNavy} />
                      <Text color={brandColors.potchGimNavy} fontSize={12} fontWeight="600" marginLeft={4}>
                        {t('profile.class_of', { year: alumni.year })}
                      </Text>
                    </View>
                  )}
                  {alumni.isMember && (
                    <View style={styles.memberBadge}>
                      <Text color="#ffffff" fontSize={12} fontWeight="600">
                        Member
                      </Text>
                    </View>
                  )}
                </XStack>

                {/* Bio */}
                {alumni.bio && (
                  <Text color="#6b7280" fontSize={14} lineHeight={20}>
                    {alumni.bio}
                  </Text>
                )}
              </YStack>
            </XStack>

            {/* Social Links */}
            {(alumni.linkedin || alumni.instagram || alumni.facebook) && (
              <XStack marginTop={16} paddingTop={16} borderTopWidth={1} borderTopColor="#e5e7eb" gap={16}>
                {alumni.linkedin && (
                  <TouchableOpacity onPress={() => handleSocialLink(alumni.linkedin)} style={styles.socialLink}>
                    <Linkedin size={16} color="#0077b5" />
                    <Text color="#6b7280" fontSize={12} marginLeft={6}>
                      LinkedIn
                    </Text>
                  </TouchableOpacity>
                )}
                {alumni.instagram && (
                  <TouchableOpacity onPress={() => handleSocialLink(alumni.instagram)} style={styles.socialLink}>
                    <Instagram size={16} color="#e4405f" />
                    <Text color="#6b7280" fontSize={12} marginLeft={6}>
                      Instagram
                    </Text>
                  </TouchableOpacity>
                )}
                {alumni.facebook && (
                  <TouchableOpacity onPress={() => handleSocialLink(alumni.facebook)} style={styles.socialLink}>
                    <Facebook size={16} color="#1877f2" />
                    <Text color="#6b7280" fontSize={12} marginLeft={6}>
                      Facebook
                    </Text>
                  </TouchableOpacity>
                )}
              </XStack>
            )}
          </YStack>

          {/* Edit Profile Button */}
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={[styles.editButton, isEditing && styles.editButtonActive]}
          >
            <Pencil size={16} color={isEditing ? '#ffffff' : brandColors.potchGimNavy} />
            <Text color={isEditing ? '#ffffff' : brandColors.potchGimNavy} fontSize={14} fontWeight="600" marginLeft={8}>
              {isEditing ? t('common.cancel') : t('profile.edit_profile')}
            </Text>
          </TouchableOpacity>

          {/* Then and Now Section */}
          <YStack {...cardStyle} padding={16}>
            <XStack alignItems="center" gap={8} marginBottom={16}>
              <View style={styles.iconCircle}>
                <Calendar size={16} color={colors.light.accent} />
              </View>
              <Text color="#1a1f2c" fontSize={16} fontWeight="700">
                {t('profile.then_now')}
              </Text>
            </XStack>

            <XStack gap={12}>
              {/* Then Photo */}
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={() => isEditing && handlePickImage('then')}
                disabled={!isEditing || uploadingImage === 'then'}
              >
                {alumni.thenPhoto ? (
                  <RNImage source={{ uri: getImageUrl(alumni.thenPhoto)! }} style={styles.thenNowPhoto} resizeMode="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <User size={32} color="#9ca3af" />
                  </View>
                )}
                <View style={styles.photoLabel}>
                  <Text color="#ffffff" fontSize={12} fontWeight="600">
                    Then
                  </Text>
                </View>
                {isEditing && (
                  <View style={styles.photoOverlay}>
                    {uploadingImage === 'then' ? (
                      <Spinner size="small" color="#ffffff" />
                    ) : (
                      <Camera size={24} color="#ffffff" />
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {/* Now Photo */}
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={() => isEditing && handlePickImage('now')}
                disabled={!isEditing || uploadingImage === 'now'}
              >
                {alumni.nowPhoto ? (
                  <RNImage source={{ uri: getImageUrl(alumni.nowPhoto)! }} style={styles.thenNowPhoto} resizeMode="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <User size={32} color="#9ca3af" />
                  </View>
                )}
                <View style={styles.photoLabel}>
                  <Text color="#ffffff" fontSize={12} fontWeight="600">
                    Now
                  </Text>
                </View>
                {isEditing && (
                  <View style={styles.photoOverlay}>
                    {uploadingImage === 'now' ? (
                      <Spinner size="small" color="#ffffff" />
                    ) : (
                      <Camera size={24} color="#ffffff" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </XStack>
          </YStack>

          {/* Contact Information */}
          {alumni.contactPermission !== 'none' && (alumni.email || alumni.phone) && (
            <YStack {...cardStyle} padding={16}>
              <XStack alignItems="center" gap={8} marginBottom={16}>
                <View style={styles.iconCircle}>
                  <Mail size={16} color={colors.light.accent} />
                </View>
                <Text color="#1a1f2c" fontSize={16} fontWeight="700">
                  Contact Information
                </Text>
              </XStack>

              <YStack gap={12}>
                {alumni.email && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${alumni.email}`)}
                    style={styles.contactRow}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: '#dbeafe' }]}>
                      <Mail size={16} color={colors.light.accent} />
                    </View>
                    <YStack flex={1}>
                      <Text color="#6b7280" fontSize={12}>
                        {t('profile.email')}
                      </Text>
                      <Text color={colors.light.accent} fontSize={14}>
                        {alumni.email}
                      </Text>
                    </YStack>
                  </TouchableOpacity>
                )}

                {alumni.phone && (
                  <XStack alignItems="center" gap={12}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${alumni.phone}`)}
                      style={[styles.contactRow, { flex: 1 }]}
                    >
                      <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
                        <Phone size={16} color={colors.light.success} />
                      </View>
                      <YStack flex={1}>
                        <Text color="#6b7280" fontSize={12}>
                          {t('profile.phone')}
                        </Text>
                        <Text color="#1a1f2c" fontSize={14}>
                          {alumni.phone}
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleWhatsApp} style={styles.whatsappButton}>
                      <MessageCircle size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </XStack>
                )}
              </YStack>

              <Text color="#6b7280" fontSize={12} marginTop={12}>
                {getPermissionLabel(alumni.contactPermission || 'all')}
              </Text>
            </YStack>
          )}

          {/* Edit Form */}
          {isEditing && (
            <YStack {...cardStyle} padding={16} gap={16}>
              <Text color="#1a1f2c" fontSize={16} fontWeight="700">
                {t('profile.edit_profile')}
              </Text>

              <YStack gap={12}>
                {/* Name */}
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    Name
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                    placeholder="Your name"
                    placeholderTextColor="#000000"
                  />
                </YStack>

                {/* Bio */}
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.bio')}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                    value={formData.bio}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, bio: value }))}
                    placeholder={t('profile.bio_placeholder')}
                    placeholderTextColor="#000000"
                    multiline
                  />
                </YStack>

                {/* Phone */}
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.phone')}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.phone}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                    placeholder="Your phone number"
                    placeholderTextColor="#000000"
                    keyboardType="phone-pad"
                  />
                </YStack>

                {/* LinkedIn */}
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.social_linkedin')}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.linkedin}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, linkedin: value }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                    placeholderTextColor="#000000"
                    autoCapitalize="none"
                  />
                </YStack>

                {/* Instagram */}
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.social_insta')}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.instagram}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, instagram: value }))}
                    placeholder="https://instagram.com/yourprofile"
                    placeholderTextColor="#000000"
                    autoCapitalize="none"
                  />
                </YStack>

                {/* Facebook */}
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.social_fb')}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.facebook}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, facebook: value }))}
                    placeholder="https://facebook.com/yourprofile"
                    placeholderTextColor="#000000"
                    autoCapitalize="none"
                  />
                </YStack>
              </YStack>

              {/* Contact Permission Settings */}
              <YStack gap={8} paddingTop={16} borderTopWidth={1} borderTopColor="#e5e7eb">
                <Text color="#1a1f2c" fontSize={14} fontWeight="600">
                  Profile Visibility
                </Text>
                <Text color="#6b7280" fontSize={12} marginBottom={8}>
                  Choose who can see your contact information
                </Text>

                {(['all', 'year-group', 'none'] as ContactPermission[]).map((permission) => (
                  <TouchableOpacity
                    key={permission}
                    onPress={() => setFormData((prev) => ({ ...prev, contactPermission: permission }))}
                    style={[
                      styles.permissionOption,
                      formData.contactPermission === permission && {
                        borderColor: getPermissionColor(permission),
                        backgroundColor: `${getPermissionColor(permission)}10`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        formData.contactPermission === permission && {
                          borderColor: getPermissionColor(permission),
                          backgroundColor: getPermissionColor(permission),
                        },
                      ]}
                    >
                      {formData.contactPermission === permission && <View style={styles.radioInner} />}
                    </View>
                    <YStack flex={1} gap={2}>
                      <XStack alignItems="center" gap={8}>
                        <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                          {permission === 'all'
                            ? 'Visible to all alumni'
                            : permission === 'year-group'
                            ? 'Visible to year group only'
                            : 'Not visible (Ghost Mode)'}
                        </Text>
                        <View
                          style={[styles.permissionBadge, { backgroundColor: getPermissionColor(permission) }]}
                        >
                          <Text color="#ffffff" fontSize={10} fontWeight="600">
                            {permission === 'all' ? 'Public' : permission === 'year-group' ? 'Recommended' : 'Private'}
                          </Text>
                        </View>
                      </XStack>
                      <Text color="#6b7280" fontSize={12}>
                        {permission === 'all'
                          ? 'Everyone can see your profile and contact info'
                          : permission === 'year-group'
                          ? 'Only your graduation year can see your profile'
                          : 'No one can see your profile or contact info'}
                      </Text>
                    </YStack>
                  </TouchableOpacity>
                ))}
              </YStack>

              {/* Save/Cancel Buttons */}
              <XStack gap={12}>
                <Button
                  flex={1}
                  backgroundColor={brandColors.potchGimNavy}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Save size={16} color="#ffffff" />
                      <Text color="#ffffff" marginLeft={8}>
                        {t('profile.save_changes')}
                      </Text>
                    </>
                  )}
                </Button>
                <Button flex={1} backgroundColor="#f3f4f6" onPress={handleCancel}>
                  <X size={16} color="#6b7280" />
                  <Text color="#6b7280" marginLeft={8}>
                    {t('profile.cancel')}
                  </Text>
                </Button>
              </XStack>
            </YStack>
          )}

          {/* Password Section */}
          <YStack {...cardStyle} padding={16}>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap={8}>
                <View style={styles.iconCircle}>
                  <Key size={16} color={colors.light.accent} />
                </View>
                <Text color="#1a1f2c" fontSize={16} fontWeight="700">
                  Password
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setShowPasswordReset(!showPasswordReset)}>
                <Text color={colors.light.accent} fontSize={14}>
                  {showPasswordReset ? 'Cancel' : 'Reset'}
                </Text>
              </TouchableOpacity>
            </XStack>

            {showPasswordReset && (
              <YStack gap={12} marginTop={16} padding={16} backgroundColor="#f9fafb" borderRadius={8}>
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.current_password')}
                  </Text>
                  <XStack
                    borderWidth={1}
                    borderColor="#e5e7eb"
                    borderRadius={8}
                    alignItems="center"
                    paddingRight="$2"
                    backgroundColor="#ffffff"
                  >
                    <TextInput
                      style={{ flex: 1, fontSize: 16, paddingHorizontal: 12, paddingVertical: 12, color: '#000000' }}
                      value={formData.currentPassword}
                      onChangeText={(value) => setFormData((prev) => ({ ...prev, currentPassword: value }))}
                      placeholder="Enter current password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showResetPasswords}
                    />
                    <TouchableOpacity onPress={() => setShowResetPasswords(!showResetPasswords)}>
                      {showResetPasswords ? (
                        <EyeOff size={20} color="#6b7280" />
                      ) : (
                        <Eye size={20} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </XStack>
                </YStack>
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.new_password')}
                  </Text>
                  <XStack
                    borderWidth={1}
                    borderColor="#e5e7eb"
                    borderRadius={8}
                    alignItems="center"
                    paddingRight="$2"
                    backgroundColor="#ffffff"
                  >
                    <TextInput
                      style={{ flex: 1, fontSize: 16, paddingHorizontal: 12, paddingVertical: 12, color: '#000000' }}
                      value={formData.newPassword}
                      onChangeText={(value) => setFormData((prev) => ({ ...prev, newPassword: value }))}
                      placeholder="Enter new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showResetPasswords}
                    />
                    <TouchableOpacity onPress={() => setShowResetPasswords(!showResetPasswords)}>
                      {showResetPasswords ? (
                        <EyeOff size={20} color="#6b7280" />
                      ) : (
                        <Eye size={20} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </XStack>
                </YStack>
                <YStack gap={4}>
                  <Text color="#1a1f2c" fontSize={12} fontWeight="500">
                    {t('profile.confirm_password')}
                  </Text>
                  <XStack
                    borderWidth={1}
                    borderColor="#e5e7eb"
                    borderRadius={8}
                    alignItems="center"
                    paddingRight="$2"
                    backgroundColor="#ffffff"
                  >
                    <TextInput
                      style={{ flex: 1, fontSize: 16, paddingHorizontal: 12, paddingVertical: 12, color: '#000000' }}
                      value={formData.confirmPassword}
                      onChangeText={(value) => setFormData((prev) => ({ ...prev, confirmPassword: value }))}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showResetPasswords}
                    />
                    <TouchableOpacity onPress={() => setShowResetPasswords(!showResetPasswords)}>
                      {showResetPasswords ? (
                        <EyeOff size={20} color="#6b7280" />
                      ) : (
                        <Eye size={20} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </XStack>
                </YStack>
                <Button
                  backgroundColor={brandColors.potchGimNavy}
                  onPress={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <Spinner size="small" color="#ffffff" />
                  ) : (
                    <Text color="#ffffff">{t('profile.update_password')}</Text>
                  )}
                </Button>
              </YStack>
            )}
          </YStack>

          {/* Logout and Delete Account */}
          {!isEditing && (
            <YStack gap={12}>
              <Button
                backgroundColor="#ffffff"
                borderWidth={1}
                borderColor="#e5e7eb"
                onPress={handleLogout}
                height={48}
              >
                <LogOut size={18} color="#6b7280" />
                <Text color="#1a1f2c" marginLeft={8}>
                  {t('nav.logout')}
                </Text>
              </Button>

              <Button
                backgroundColor={colors.light.destructive}
                onPress={handleDeleteAccount}
                height={48}
              >
                <Trash2 size={18} color="#ffffff" />
                <Text color="#ffffff" marginLeft={8}>
                  Delete Account
                </Text>
              </Button>
            </YStack>
          )}
        </YStack>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menuDrawer}>
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <Text fontSize={18} fontWeight="700" color="#1a1f2c">
                Menu
              </Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <YStack gap={8} paddingTop={8}>
              {/* Become a Member - only show if not a member */}
              {!user?.isMember && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress('membership')}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#fef3c7' }]}>
                    <Crown size={20} color="#f59e0b" />
                  </View>
                  <YStack flex={1}>
                    <Text color="#1a1f2c" fontSize={15} fontWeight="600">
                      Become a Member
                    </Text>
                    <Text color="#6b7280" fontSize={12}>
                      Join our alumni community
                    </Text>
                  </YStack>
                  <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}

              {/* Stories */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('stories')}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: '#dbeafe' }]}>
                  <BookOpen size={20} color={colors.light.accent} />
                </View>
                <YStack flex={1}>
                  <Text color="#1a1f2c" fontSize={15} fontWeight="600">
                    Stories
                  </Text>
                  <Text color="#6b7280" fontSize={12}>
                    Read alumni success stories
                  </Text>
                </YStack>
                {!user?.isMember && (
                  <View style={styles.memberOnlyBadge}>
                    <Text color="#ffffff" fontSize={10} fontWeight="600">
                      MEMBERS
                    </Text>
                  </View>
                )}
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* In Memoriam */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('memoriam')}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: '#fce7f3' }]}>
                  <Flower2 size={20} color="#ec4899" />
                </View>
                <YStack flex={1}>
                  <Text color="#1a1f2c" fontSize={15} fontWeight="600">
                    In Memoriam
                  </Text>
                  <Text color="#6b7280" fontSize={12}>
                    Remember those we've lost
                  </Text>
                </YStack>
                {!user?.isMember && (
                  <View style={styles.memberOnlyBadge}>
                    <Text color="#ffffff" fontSize={10} fontWeight="600">
                      MEMBERS
                    </Text>
                  </View>
                )}
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Give Back */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('giveback')}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: '#dcfce7' }]}>
                  <Heart size={20} color={colors.light.success} />
                </View>
                <YStack flex={1}>
                  <Text color="#1a1f2c" fontSize={15} fontWeight="600">
                    Give Back
                  </Text>
                  <Text color="#6b7280" fontSize={12}>
                    Support school projects
                  </Text>
                </YStack>
                {!user?.isMember && (
                  <View style={styles.memberOnlyBadge}>
                    <Text color="#ffffff" fontSize={10} fontWeight="600">
                      MEMBERS
                    </Text>
                  </View>
                )}
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Language Toggle */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLanguageToggle}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: '#e0e7ff' }]}>
                  <Globe size={20} color="#6366f1" />
                </View>
                <YStack flex={1}>
                  <Text color="#1a1f2c" fontSize={15} fontWeight="600">
                    {t('settings.language', 'Language')}
                  </Text>
                  <Text color="#6b7280" fontSize={12}>
                    {currentLang === 'en' ? 'Switch to Afrikaans' : 'Switch to English'}
                  </Text>
                </YStack>
                <Text color="#6366f1" fontSize={13} fontWeight="600">
                  {currentLang === 'en' ? 'EN' : 'AF'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.menuDivider} />

              {/* Logout */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('logout')}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: '#fee2e2' }]}>
                  <LogOut size={20} color={colors.light.destructive} />
                </View>
                <YStack flex={1}>
                  <Text color={colors.light.destructive} fontSize={15} fontWeight="600">
                    Logout
                  </Text>
                  <Text color="#6b7280" fontSize={12}>
                    Sign out of your account
                  </Text>
                </YStack>
              </TouchableOpacity>
            </YStack>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsOpen(false)}
        >
          <View style={styles.notificationsDrawer}>
            {/* Notifications Header */}
            <View style={styles.notifHeader}>
              <XStack alignItems="center" gap={8}>
                <View style={styles.notifHeaderIcon}>
                  <Bell size={18} color={brandColors.potchGimNavy} />
                </View>
                <Text fontSize={16} fontWeight="700" color="#1a1f2c">
                  {t('nav.notifications')}
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setNotificationsOpen(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Actions Bar */}
            <View style={styles.notifActionsBar}>
              <XStack alignItems="center" gap={8}>
                <Text color="#6b7280" fontSize={13}>
                  {notifications.length} total
                </Text>
                {unreadCount > 0 && (
                  <View style={styles.notifUnreadBadge}>
                    <Text color="#ffffff" fontSize={11} fontWeight="600">
                      {unreadCount} new
                    </Text>
                  </View>
                )}
              </XStack>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllButton}
                  onPress={handleMarkAllAsRead}
                >
                  <Check size={14} color="#3b82f6" />
                  <Text color="#3b82f6" fontSize={12} fontWeight="500" marginLeft={4}>
                    Mark All Read
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notifications List */}
            <ScrollView
              style={styles.notifScrollView}
              contentContainerStyle={styles.notifScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {notificationsLoading ? (
                <YStack alignItems="center" justifyContent="center" padding={40}>
                  <Spinner size="large" color={brandColors.potchGimNavy} />
                  <Text color="#6b7280" marginTop={12}>{t('common.loading')}</Text>
                </YStack>
              ) : notifications.length === 0 ? (
                <YStack alignItems="center" justifyContent="center" padding={40}>
                  <View style={styles.emptyIconCircle}>
                    <Bell size={32} color="#d1d5db" />
                  </View>
                  <Text color="#6b7280" fontSize={16} fontWeight="600" marginTop={16}>
                    {t('notifications.no_notifications')}
                  </Text>
                  <Text color="#9ca3af" fontSize={13} marginTop={4} textAlign="center">
                    You're all caught up!
                  </Text>
                </YStack>
              ) : (
                notifications.map((notification) => {
                  const isExpanded = expandedNotificationId === notification.id;
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notifCard,
                        !notification.read && styles.notifCardUnread,
                        isExpanded && styles.notifCardExpanded,
                      ]}
                      onPress={() => handleNotificationTap(notification)}
                      activeOpacity={0.7}
                    >
                      <XStack alignItems="flex-start" gap={12}>
                        <View style={[
                          styles.notifIconCircle,
                          !notification.read && styles.notifIconCircleUnread,
                        ]}>
                          {getNotificationIcon(notification.type)}
                        </View>
                        <YStack flex={1} gap={2}>
                          <XStack alignItems="center" gap={6}>
                            <Text
                              color="#1a1f2c"
                              fontSize={14}
                              fontWeight={notification.read ? '500' : '600'}
                              flex={1}
                              numberOfLines={isExpanded ? undefined : 1}
                            >
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <View style={styles.newBadge}>
                                <Text color="#ffffff" fontSize={9} fontWeight="700">
                                  NEW
                                </Text>
                              </View>
                            )}
                          </XStack>
                          <Text
                            color="#6b7280"
                            fontSize={isExpanded ? 14 : 12}
                            numberOfLines={isExpanded ? undefined : 2}
                            lineHeight={isExpanded ? 22 : undefined}
                          >
                            {notification.message || '(No message content)'}
                          </Text>
                          <XStack alignItems="center" justifyContent="space-between" marginTop={4}>
                            <Text color="#9ca3af" fontSize={11}>
                              {formatTimeAgo(notification.createdAt)}
                            </Text>
                            <Text color="#3b82f6" fontSize={11}>
                              {isExpanded ? 'Tap to collapse' : 'Tap to read more'}
                            </Text>
                          </XStack>
                        </YStack>
                        <XStack gap={8}>
                          {!notification.read && (
                            <TouchableOpacity
                              style={styles.notifMarkReadBtn}
                              onPress={() => handleNotificationTap(notification)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Check size={16} color="#22c55e" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.notifDeleteBtn}
                            onPress={() => handleDeleteNotification(notification)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </XStack>
                      </XStack>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
            <Text style={styles.deleteModalText}>
              This action cannot be undone. Enter your password to confirm.
            </Text>
            <TextInput
              style={styles.deletePasswordInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />
            <XStack gap={12} marginTop={16}>
              <Button
                flex={1}
                backgroundColor="#f3f4f6"
                onPress={() => {
                  setDeleteModalOpen(false);
                  setDeletePassword('');
                }}
              >
                <Text color="#6b7280">Cancel</Text>
              </Button>
              <Button
                flex={1}
                backgroundColor={colors.light.destructive}
                onPress={confirmDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Spinner size="small" color="#ffffff" />
                ) : (
                  <Text color="#ffffff">Delete</Text>
                )}
              </Button>
            </XStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  formInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    backgroundColor: colors.light.accent,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.accent,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadge: {
    backgroundColor: colors.light.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: brandColors.potchGimNavy,
    borderRadius: 8,
    paddingVertical: 12,
  },
  editButtonActive: {
    backgroundColor: brandColors.potchGimNavy,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainer: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  thenNowPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  permissionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuDrawer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  memberOnlyBadge: {
    backgroundColor: colors.light.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  // Notifications Modal Styles
  notificationsDrawer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  notifHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  notifUnreadBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  notifScrollView: {
    flex: 1,
    maxHeight: 600,
  },
  notifScrollContent: {
    paddingVertical: 8,
    gap: 8,
  },
  notifCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  notifCardUnread: {
    backgroundColor: '#fafbff',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  notifCardExpanded: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconCircleUnread: {
    backgroundColor: '#dbeafe',
  },
  newBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notifDeleteBtn: {
    padding: 4,
  },
  notifMarkReadBtn: {
    padding: 4,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Delete Account Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    width: '90%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1f2c',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  deletePasswordInput: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
});
