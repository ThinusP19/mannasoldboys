import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { colors } from '../theme/colors';
import { getImageUrl } from '../utils/imageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 32; // Account for card padding

interface PostAuthor {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  isAdmin?: boolean;
}

interface PostImage {
  url: string;
  caption?: string;
}

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  author?: PostAuthor;
  images?: PostImage[] | string[];
  createdAt: string;
  onPress?: () => void;
}

export function PostCard({
  title,
  content,
  author,
  images = [],
  createdAt,
  onPress,
}: PostCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Normalize images to array of URLs with full server path
  const imageUrls: string[] = images.map((img) => {
    const url = typeof img === 'string' ? img : img.url;
    return getImageUrl(url) || url;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Get author display name
  const getAuthorName = () => {
    if (!author) return 'Potch Gim';
    if (author.isAdmin) return 'Potch Gim';
    if (author.fullName) return author.fullName;
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`;
    }
    return author.firstName || 'Unknown';
  };

  // Get author initials
  const getAuthorInitials = () => {
    if (!author || author.isAdmin) return 'PG';
    const name = getAuthorName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle image scroll
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_WIDTH);
    setActiveImageIndex(index);
  };

  const isAdmin = !author || author.isAdmin;

  return (
    <YStack
      backgroundColor={colors.light.card}
      borderRadius={12}
      overflow="hidden"
      shadowColor="rgba(0,0,0,0.08)"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={1}
      shadowRadius={8}
      elevation={2}
      pressStyle={{ opacity: 0.95 }}
      onPress={onPress}
    >
      {/* Header: Avatar + Author + Date */}
      <XStack padding={12} alignItems="center" gap={10}>
        {/* Avatar */}
        {isAdmin ? (
          <View style={styles.adminAvatarContainer}>
            <Image
              source={require('../../assets/images/school-logo.png')}
              style={styles.adminAvatar}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.userAvatar}>
            <Text color="#ffffff" fontSize={14} fontWeight="600">
              {getAuthorInitials()}
            </Text>
          </View>
        )}

        {/* Author Name and Date */}
        <YStack flex={1}>
          <Text
            color={colors.light.foreground}
            fontSize={14}
            fontWeight="600"
          >
            {getAuthorName()}
          </Text>
          <Text
            color={colors.light.mutedForeground}
            fontSize={12}
          >
            {formatDate(createdAt)}
          </Text>
        </YStack>
      </XStack>

      {/* Image Carousel */}
      {imageUrls.length > 0 && (
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={IMAGE_WIDTH}
            contentContainerStyle={{ paddingHorizontal: 0 }}
          >
            {imageUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dot Indicators */}
          {imageUrls.length > 1 && (
            <View style={styles.dotsContainer}>
              {imageUrls.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeImageIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <YStack padding={12} paddingTop={imageUrls.length > 0 ? 8 : 0} gap={4}>
        {/* Title */}
        <Text
          color={colors.light.foreground}
          fontSize={16}
          fontWeight="700"
        >
          {title}
        </Text>

        {/* Content Text */}
        <Text
          color={colors.light.mutedForeground}
          fontSize={14}
          lineHeight={20}
          numberOfLines={4}
        >
          {content}
        </Text>
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  adminAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.light.accent,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  adminAvatar: {
    width: 32,
    height: 32,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 0.75, // 4:3 aspect ratio
    backgroundColor: colors.light.muted,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default PostCard;
