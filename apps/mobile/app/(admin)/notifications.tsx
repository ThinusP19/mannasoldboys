import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Circle,
  Info,
  Calendar,
  CalendarDays,
  BookOpen,
  UserCheck,
  FolderOpen,
  Shield,
} from '@tamagui/lucide-icons';
import { format } from 'date-fns';

import { adminNotificationsApi, Notification } from '../../src/services/adminApi';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

// Type configuration matching web version
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  reunion: {
    icon: <CalendarDays size={18} color="#3b82f6" />,
    color: '#3b82f6',
    bgColor: '#dbeafe',
    label: 'Reunion',
  },
  story: {
    icon: <BookOpen size={18} color="#8b5cf6" />,
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    label: 'Story',
  },
  member: {
    icon: <UserCheck size={18} color="#22c55e" />,
    color: '#22c55e',
    bgColor: '#dcfce7',
    label: 'Member',
  },
  project: {
    icon: <FolderOpen size={18} color="#f59e0b" />,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    label: 'Project',
  },
  admin_action: {
    icon: <Shield size={18} color="#d97706" />,
    color: '#d97706',
    bgColor: '#fef3c7',
    label: 'Admin',
  },
  general: {
    icon: <Info size={18} color="#3b82f6" />,
    color: '#3b82f6',
    bgColor: '#dbeafe',
    label: 'General',
  },
};

function NotificationCard({ notification, onMarkAsRead, onDelete }: NotificationCardProps) {
  const getTypeConfig = () => {
    return NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.general;
  };

  const typeConfig = getTypeConfig();

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !notification.read && styles.unreadCard]}
      onPress={onMarkAsRead}
      activeOpacity={0.7}
    >
      <XStack alignItems="flex-start" gap="$3">
        {/* Status Indicator */}
        {!notification.read && (
          <View style={styles.unreadDot}>
            <Circle size={8} color="#3b82f6" fill="#3b82f6" />
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: typeConfig.bgColor }]}>
          {typeConfig.icon}
        </View>

        {/* Content */}
        <YStack flex={1} gap="$1">
          {/* Type Badge - matching web version */}
          <XStack alignItems="center" gap="$2" marginBottom="$1">
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
              <Text
                color={typeConfig.color}
                fontSize={11}
                fontWeight="600"
                textTransform="capitalize"
              >
                {typeConfig.label}
              </Text>
            </View>
            {!notification.read && (
              <View style={styles.pulseDot} />
            )}
          </XStack>

          <Text
            color="#1a1f2c"
            fontSize={15}
            fontWeight={notification.read ? '500' : '600'}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text color="#6b7280" fontSize={13} numberOfLines={3}>
            {notification.message}
          </Text>
          <XStack alignItems="center" gap="$1" marginTop="$1">
            <Calendar size={12} color="#9ca3af" />
            <Text color="#9ca3af" fontSize={11}>
              {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm')}
            </Text>
          </XStack>
        </YStack>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </XStack>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminNotificationsApi.getAll();
      setNotifications(data);
    } catch (err: any) {
      setError(err.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;

    try {
      await adminNotificationsApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount === 0) {
      Alert.alert('Info', 'All notifications are already read.');
      return;
    }

    try {
      await adminNotificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      Alert.alert('Success', 'All notifications marked as read.');
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminNotificationsApi.delete(notification.id);
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#1e3a5f" />
        <Text color="#6b7280" marginTop="$3">
          {t('notifications.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <XStack alignItems="center" gap="$2">
          <Bell size={20} color="#1e3a5f" />
          <Text color="#1a1f2c" fontSize={16} fontWeight="600">
            {notifications.length} {t('admin.notifications')}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text color="#ffffff" fontSize={11} fontWeight="600">
                {unreadCount} {t('admin.new')}
              </Text>
            </View>
          )}
        </XStack>

        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          activeOpacity={0.7}
        >
          <CheckCheck size={16} color="#3b82f6" />
          <Text color="#3b82f6" fontSize={13} fontWeight="500" marginLeft="$1">
            {t('notifications.mark_read')}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text color="#dc2626" fontSize={16} textAlign="center">
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications()}>
            <Text color="#ffffff" fontWeight="600">
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onMarkAsRead={() => handleMarkAsRead(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              tintColor="#1e3a5f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BellOff size={48} color="#d1d5db" />
              <Text color="#6b7280" fontSize={16} marginTop="$3">
                {t('notifications.no_notifications')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  unreadBadge: {
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    left: -8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
});
