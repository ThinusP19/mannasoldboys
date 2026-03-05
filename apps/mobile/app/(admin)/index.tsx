import React, { useState, useEffect } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui';
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  Heart,
  Calendar,
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
} from '@tamagui/lucide-icons';

// Custom Rand icon component
function RandIcon({ size = 24 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <RNText style={{ fontSize: size * 0.75, fontWeight: 'bold', color: '#f97316' }}>R</RNText>
    </View>
  );
}

import { adminApi, AdminStats } from '../../src/services/adminApi';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
}

function StatCard({ title, value, icon, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1}>
          <Text color="#6b7280" fontSize={13} fontWeight="500">
            {title}
          </Text>
          <Text color="#1a1f2c" fontSize={28} fontWeight="bold" marginTop="$1">
            {value}
          </Text>
        </YStack>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          {React.cloneElement(icon as React.ReactElement, { color })}
        </View>
      </XStack>
      {onPress && (
        <XStack alignItems="center" marginTop="$2">
          <Text color={color} fontSize={12} fontWeight="500">
            {/* View All - keeping this simple as it's a UI element */}
          </Text>
          <ChevronRight size={14} color={color} />
        </XStack>
      )}
    </TouchableOpacity>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function QuickAction({ title, description, icon, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickActionIcon}>{icon}</View>
      <YStack flex={1}>
        <Text color="#1a1f2c" fontSize={15} fontWeight="600">
          {title}
        </Text>
        <Text color="#6b7280" fontSize={12} marginTop="$0.5">
          {description}
        </Text>
      </YStack>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.error || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#1e3a5f" />
        <Text color="#6b7280" marginTop="$3">
          {t('admin.loading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text color="#dc2626" fontSize={16} textAlign="center">
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchStats()}>
          <Text color="#ffffff" fontWeight="600">
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} tintColor="#1e3a5f" />
      }
    >
      <YStack padding="$4" gap="$4">
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <XStack alignItems="center" gap="$3">
            <View style={styles.welcomeIcon}>
              <TrendingUp size={24} color="#ffffff" />
            </View>
            <YStack flex={1}>
              <Text color="#ffffff" fontSize={18} fontWeight="bold">
                {t('admin.welcome_admin')}
              </Text>
              <Text color="rgba(255,255,255,0.8)" fontSize={13} marginTop="$0.5">
                {t('admin.overview_desc')}
              </Text>
            </YStack>
          </XStack>
        </View>

        {/* Stats Grid */}
        <Text color="#1a1f2c" fontSize={18} fontWeight="bold">
          {t('admin.overview')}
        </Text>

        <View style={styles.statsGrid}>
          <StatCard
            title={t('admin.total_users')}
            value={stats?.totalUsers || 0}
            icon={<Users size={24} />}
            color="#3b82f6"
            onPress={() => router.push('/(admin)/users')}
          />
          <StatCard
            title={t('admin.members')}
            value={stats?.totalMembers || 0}
            icon={<UserCheck size={24} />}
            color="#22c55e"
            onPress={() => router.push('/(admin)/users')}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title={t('admin.pending')}
            value={stats?.pendingMembers || 0}
            icon={<Clock size={24} />}
            color="#f59e0b"
            onPress={() => router.push('/(admin)/pending-members')}
          />
          <StatCard
            title={t('admin.stories')}
            value={stats?.totalStories || 0}
            icon={<FileText size={24} />}
            color="#8b5cf6"
            onPress={() => router.push('/(admin)/stories')}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title={t('admin.memorials')}
            value={stats?.totalMemorials || 0}
            icon={<Heart size={24} />}
            color="#ec4899"
            onPress={() => router.push('/(admin)/memorials')}
          />
          <StatCard
            title={t('admin.reunions')}
            value={stats?.totalReunions || 0}
            icon={<Calendar size={24} />}
            color="#14b8a6"
            onPress={() => router.push('/(admin)/reunions')}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title={t('admin.projects')}
            value={stats?.totalProjects || 0}
            icon={<RandIcon size={24} />}
            color="#f97316"
            onPress={() => router.push('/(admin)/projects')}
          />
          <StatCard
            title={t('admin.year_groups')}
            value={stats?.totalYearGroups || 0}
            icon={<ImageIcon size={24} />}
            color="#6366f1"
            onPress={() => router.push('/(admin)/year-groups')}
          />
        </View>

        {/* Quick Actions */}
        <Text color="#1a1f2c" fontSize={18} fontWeight="bold" marginTop="$2">
          {t('admin.quick_actions')}
        </Text>

        <YStack gap="$2">
          {(stats?.pendingMembers || 0) > 0 && (
            <QuickAction
              title={t('admin.review_pending')}
              description={t('admin.requests_awaiting', { count: stats?.pendingMembers })}
              icon={<Clock size={20} color="#f59e0b" />}
              onPress={() => router.push('/(admin)/pending-members')}
            />
          )}
          <QuickAction
            title={t('admin.manage_users')}
            description={t('admin.manage_users_desc')}
            icon={<Users size={20} color="#3b82f6" />}
            onPress={() => router.push('/(admin)/users')}
          />
          <QuickAction
            title={t('admin.create_story')}
            description={t('admin.create_story_desc')}
            icon={<FileText size={20} color="#8b5cf6" />}
            onPress={() => router.push('/(admin)/stories')}
          />
          <QuickAction
            title={t('admin.add_reunion')}
            description={t('admin.add_reunion_desc')}
            icon={<Calendar size={20} color="#14b8a6" />}
            onPress={() => router.push('/(admin)/reunions')}
          />
        </YStack>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </YStack>
    </ScrollView>
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
    backgroundColor: '#f5f0e8',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  welcomeCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
