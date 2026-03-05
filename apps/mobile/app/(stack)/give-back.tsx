import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spinner, Button } from 'tamagui';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Target, Users, TrendingUp } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';

import { projectsApi } from '../../src/services';
import { useAuth } from '../../src/contexts';
import { brandColors, colors } from '../../src/theme';
import { MembershipGate } from '../../src/components/MembershipGate';

interface Project {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  image?: string;
  status: 'active' | 'completed' | 'paused';
  donorCount?: number;
}

function ProjectCard({ project, onDonate, t }: { project: Project; onDonate: () => void; t: (key: string) => string }) {
  const progress = Math.min((project.currentAmount / project.targetAmount) * 100, 100);
  const isComplete = project.status === 'completed' || progress >= 100;

  return (
    <View style={styles.card}>
      {project.image && (
        <Image source={{ uri: project.image }} style={styles.cardImage} resizeMode="cover" />
      )}
      <YStack padding={16} gap={12}>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <Text fontSize={18} fontWeight="700" color="#1a1f2c" flex={1} numberOfLines={2}>
            {project.title}
          </Text>
          <View style={[styles.statusBadge, isComplete && styles.statusComplete]}>
            <Text color={isComplete ? '#22c55e' : colors.light.accent} fontSize={11} fontWeight="600">
              {isComplete ? 'COMPLETE' : 'ACTIVE'}
            </Text>
          </View>
        </XStack>

        <Text fontSize={14} color="#6b7280" numberOfLines={3} lineHeight={20}>
          {project.description}
        </Text>

        {/* Progress Bar */}
        <YStack gap={8}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <XStack justifyContent="space-between">
            <Text color="#22c55e" fontSize={14} fontWeight="600">
              R{project.currentAmount.toLocaleString()}
            </Text>
            <Text color="#6b7280" fontSize={14}>
              of R{project.targetAmount.toLocaleString()}
            </Text>
          </XStack>
        </YStack>

        {/* Stats */}
        <XStack gap={16}>
          <XStack alignItems="center" gap={6}>
            <TrendingUp size={14} color="#6b7280" />
            <Text color="#6b7280" fontSize={12}>
              {progress.toFixed(0)}% funded
            </Text>
          </XStack>
          {project.donorCount && (
            <XStack alignItems="center" gap={6}>
              <Users size={14} color="#6b7280" />
              <Text color="#6b7280" fontSize={12}>
                {project.donorCount} donors
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Donate Button */}
        {!isComplete && (
          <Button
            backgroundColor={colors.light.success}
            onPress={onDonate}
            height={44}
            marginTop={4}
          >
            <Heart size={16} color="#ffffff" />
            <Text color="#ffffff" fontWeight="600" marginLeft={8}>
              {t('giving.contribute')}
            </Text>
          </Button>
        )}
      </YStack>
    </View>
  );
}

export default function GiveBackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: projects, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  const handleDonate = (project: Project) => {
    Alert.alert(
      'Contribute to Project',
      `Would you like to contribute to "${project.title}"?\n\nPlease contact us at alumni@potchgim.co.za for donation details.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK' },
      ]
    );
  };

  return (
    <MembershipGate
      isMember={user?.isMember}
      pageTitle={t('giving.title')}
      pageDescription={t('giving.description')}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <XStack alignItems="center" gap={12} padding={16}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1a1f2c" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Heart size={20} color={colors.light.success} />
          </View>
          <Text fontSize={22} fontWeight="bold" color="#1a1f2c">
            {t('giving.title')}
          </Text>
        </XStack>

        {/* Intro */}
        <View style={styles.introCard}>
          <Text color="#6b7280" fontSize={14} textAlign="center" lineHeight={20}>
            {t('giving.description')}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Spinner size="large" color={brandColors.potchGimNavy} />
            <Text color="#6b7280" marginTop="$3">
              {t('giving.loading_projects')}
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <Text color="#dc2626" fontSize={16}>
              Failed to load projects
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text color="#ffffff" fontWeight="600">
                {t('common.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={projects || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProjectCard project={item} onDonate={() => handleDonate(item)} t={t} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={brandColors.potchGimNavy}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Heart size={64} color="#d1d5db" />
                <Text color="#6b7280" fontSize={18} fontWeight="600" marginTop="$4">
                  {t('giving.no_projects')}
                </Text>
                <Text color="#9ca3af" fontSize={14} marginTop="$2" textAlign="center">
                  School projects needing support will appear here.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </MembershipGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.light.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: brandColors.potchGimNavy,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusComplete: {
    backgroundColor: '#dcfce7',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.light.success,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
});
