import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { storiesApi } from '../../src/services';
import { useAuth } from '../../src/contexts';
import { brandColors, colors } from '../../src/theme';
import { MembershipGate } from '../../src/components/MembershipGate';
import { getImageUrl } from '../../src/utils/imageUrl';

interface Story {
  id: string;
  title: string;
  content: string;
  author?: string;
  author_name?: string;
  authorYear?: number;
  featuredImage?: string;
  images?: string | string[];
  date?: string;
  createdAt: string;
}

function StoryCard({ story }: { story: Story }) {
  const { t } = useTranslation();

  // Guard against invalid story data
  if (!story || typeof story !== 'object') {
    return null;
  }

  // Safely get author name - check author_name first (from API), then author
  const getAuthorName = (): string | null => {
    if (story.author_name) {
      return typeof story.author_name === 'string' ? story.author_name : String(story.author_name);
    }
    if (!story.author) return null;
    if (typeof story.author === 'string') return story.author;
    if (typeof story.author === 'object' && story.author !== null) {
      const name = (story.author as any).name;
      return name ? String(name) : 'Unknown';
    }
    return String(story.author);
  };

  // Safely get content as string
  const getContent = (): string => {
    if (!story.content) return '';
    if (typeof story.content === 'string') return story.content;
    return String(story.content);
  };

  // Safely get title as string
  const getTitle = (): string => {
    if (!story.title) return 'Untitled Story';
    if (typeof story.title === 'string') return story.title;
    return String(story.title);
  };

  // Safely get featured image from images field (could be JSON string or array)
  const getFeaturedImage = (): string | null => {
    if (story.featuredImage && typeof story.featuredImage === 'string') {
      return story.featuredImage;
    }
    if (!story.images) return null;
    try {
      let imagesArray: string[] = [];
      if (typeof story.images === 'string') {
        imagesArray = JSON.parse(story.images);
      } else if (Array.isArray(story.images)) {
        imagesArray = story.images;
      }
      return imagesArray.length > 0 ? String(imagesArray[0]) : null;
    } catch {
      return null;
    }
  };

  // Safely get date string
  const getDateString = (): string => {
    const dateStr = story.date || story.createdAt;
    if (!dateStr) return 'Unknown date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Unknown date';
      return format(date, 'dd MMM yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  const authorName = getAuthorName();
  const featuredImage = getFeaturedImage();
  const contentPreview = getContent().replace(/<[^>]*>/g, '').substring(0, 150);

  return (
    <View style={styles.card}>
      {featuredImage ? (
        <Image source={{ uri: getImageUrl(featuredImage)! }} style={styles.cardImage} resizeMode="cover" />
      ) : null}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {getTitle()}
        </Text>

        <Text style={styles.cardDescription} numberOfLines={3}>
          {contentPreview}...
        </Text>

        <View style={styles.cardMeta}>
          {authorName ? (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color="#9ca3af" />
              <Text style={styles.metaText}>{authorName}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.metaText}>{getDateString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function StoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: stories, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['stories'],
    queryFn: () => storiesApi.getAll(),
  });

  return (
    <MembershipGate
      isMember={user?.isMember}
      pageTitle={t('stories.title')}
      pageDescription={t('stories.description')}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1f2c" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name="book-outline" size={20} color={colors.light.accent} />
          </View>
          <Text style={styles.headerTitle}>{t('stories.title')}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColors.potchGimNavy} />
            <Text style={styles.loadingText}>{t('stories.loading')}</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('errors.generic')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={stories || []}
            keyExtractor={(item, index) => item?.id ? String(item.id) : `story-${index}`}
            renderItem={({ item }) => <StoryCard story={item} />}
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
                <Ionicons name="book-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>{t('stories.no_stories')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('stories.description')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1f2c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: brandColors.potchGimNavy,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
    marginBottom: 16,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f2c',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#6b7280',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
