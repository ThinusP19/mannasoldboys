import { useState, useCallback } from 'react';
import {
  RefreshControl,
  View,
  StyleSheet,
  ScrollView as RNScrollView,
  TouchableOpacity,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Image,
  Spinner,
  Button,
} from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Users, ExternalLink, Crown } from '@tamagui/lucide-icons';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../src/contexts';
import { alumniApi, yearGroupsApi, yearGroupPostsApi } from '../../src/services';
import { colors, brandColors } from '../../src/theme';
import { PostCard } from '../../src/components/PostCard';
import { MembersListDialog } from '../../src/components/MembersListDialog';
import { getImageUrl } from '../../src/utils/imageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Green chat card style
const chatCardStyle = {
  ...cardStyle,
  backgroundColor: '#f0fdf4', // green-50
  borderWidth: 1,
  borderColor: '#bbf7d0', // green-200
};

// Membership CTA gradient style
const membershipCardStyle = {
  ...cardStyle,
  backgroundColor: '#fefce8', // yellow-50
  borderWidth: 1,
  borderColor: '#fde68a', // yellow-200
};

export default function MyYearScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  // Get user's full data (includes isMember at top level)
  const { data: userData, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['alumni', 'me'],  // Match web app query key
    queryFn: () => alumniApi.getMe(),
  });

  const yearGroup = userData?.profile?.year;
  const isMember = userData?.isMember === true;

  // Get year group data
  const { data: yearGroupData, isLoading: yearGroupLoading, refetch: refetchYearGroup } = useQuery({
    queryKey: ['yearGroup', yearGroup],
    queryFn: () => yearGroupsApi.getByYear(yearGroup),
    enabled: !!yearGroup,
  });

  // Get members of the year group
  const { data: membersData, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['yearGroupMembers', yearGroup],
    queryFn: () => yearGroupsApi.getMembersByYear(yearGroup),
    enabled: !!yearGroup,
  });

  // Get year group posts
  const { data: yearGroupPosts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['yearGroupPosts', yearGroupData?.id],
    queryFn: () => yearGroupPostsApi.getByYearGroup(yearGroupData.id),
    enabled: !!yearGroupData?.id,
  });

  // Filter members based on contactPermission (show 'all' or 'year-group', hide 'none')
  const filteredMembers = membersData?.members?.filter(
    (member: any) => member.contactPermission !== 'none'
  ) || [];

  const yearGroupPhotos =
    yearGroupData?.photos && yearGroupData.photos.length > 0
      ? yearGroupData.photos
      : yearGroupData?.groupPhoto
      ? [yearGroupData.groupPhoto]
      : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchYearGroup(), refetchMembers(), refetchPosts()]);
    setRefreshing(false);
  };

  const handleWhatsAppPress = async () => {
    if (yearGroupData?.whatsappLink) {
      await WebBrowser.openBrowserAsync(yearGroupData.whatsappLink);
    }
  };

  const isLoading = profileLoading || yearGroupLoading || membersLoading;

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

  return (
    <YStack flex={1} backgroundColor="#f5f0e8">
      <RNScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 16,
          paddingBottom: 100,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <YStack marginBottom={16}>
          <Text fontSize={28} fontWeight="bold" color="#1a1f2c">
            {t('home.title')}
          </Text>
          <Text fontSize={14} color="#6b7280">
            {t('home.description')}
          </Text>
        </YStack>

        {/* Membership CTA - Show to non-members */}
        {user && !isMember && (
          <YStack {...membershipCardStyle} padding={16} marginBottom={16}>
            <XStack alignItems="center" gap={12}>
              <View style={styles.crownContainer}>
                <Crown size={24} color="#ca8a04" />
              </View>
              <YStack flex={1}>
                <Text fontWeight="700" fontSize={18} color="#1a1f2c">
                  {t('home.become_member')}
                </Text>
                <Text fontSize={13} color="#6b7280">
                  {t('home.unlock_benefits')}
                </Text>
              </YStack>
            </XStack>
            <Button
              marginTop={16}
              backgroundColor={colors.light.accent}
              borderRadius={8}
              height={44}
              onPress={() => router.push('/(stack)/membership')}
            >
              <Crown size={16} color="white" />
              <Text color="white" marginLeft={8} fontWeight="600">
                {t('home.become_member')}
              </Text>
            </Button>
          </YStack>
        )}

        {/* No Year Group Set */}
        {!yearGroup && (
          <YStack {...cardStyle} padding={20}>
            <YStack alignItems="center" paddingVertical={20}>
              <Users size={48} color="#6b7280" />
              <Text fontSize={18} fontWeight="600" color="#1a1f2c" marginTop={16} textAlign="center">
                {t('home.year_not_set')}
              </Text>
              <Text color="#6b7280" textAlign="center" marginTop={8}>
                {t('home.year_not_set_desc')}
              </Text>
              <Button
                marginTop={20}
                backgroundColor={brandColors.potchGimNavy}
                borderRadius={8}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text color="white">{t('profile.edit_profile')}</Text>
              </Button>
            </YStack>
          </YStack>
        )}

        {/* Year Group Content */}
        {yearGroup && yearGroupData && (
          <YStack gap={16}>
            {/* Join Chat Section - Green Card */}
            <YStack {...chatCardStyle} padding={16}>
              <Text fontSize={18} fontWeight="700" color="#1a1f2c">
                {t('home.join_chat')}
              </Text>
              <Text fontSize={13} color="#6b7280" marginTop={4}>
                {yearGroupData?.whatsappLink
                  ? t('home.connect_whatsapp')
                  : t('home.description')}
              </Text>

              <YStack marginTop={16} gap={12}>
                {yearGroupData?.whatsappLink ? (
                  <Button
                    backgroundColor="#16a34a"
                    borderRadius={8}
                    height={44}
                    onPress={handleWhatsAppPress}
                  >
                    <MessageCircle size={16} color="white" />
                    <Text color="white" marginHorizontal={8} fontWeight="600">
                      {t('home.join_whatsapp')}
                    </Text>
                    <ExternalLink size={16} color="white" />
                  </Button>
                ) : (
                  <Text color="#6b7280" fontSize={14}>
                    {t('home.whatsapp_soon')}
                  </Text>
                )}

                {filteredMembers.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowMembersDialog(true)}
                    style={styles.membersButton}
                  >
                    <XStack alignItems="center" gap={12} flex={1}>
                      <Users size={20} color="#16a34a" />
                      <YStack>
                        <Text fontSize={14} fontWeight="600" color="#1a1f2c">
                          {t('home.all_members')}
                        </Text>
                        <Text fontSize={12} color="#6b7280">
                          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                        </Text>
                      </YStack>
                    </XStack>
                    <Text color="#6b7280" fontSize={18}>
                      ›
                    </Text>
                  </TouchableOpacity>
                )}
              </YStack>
            </YStack>

            {/* Class Info Section */}
            <YStack {...cardStyle} padding={16} backgroundColor="#000000">
              <Text fontSize={18} fontWeight="700" color="#ffffff">
                {t('profile.class_of', { year: yearGroup })}
              </Text>
              {yearGroupData.yearInfo && (
                <Text fontSize={14} color="#d1d5db" marginTop={8}>
                  {yearGroupData.yearInfo}
                </Text>
              )}
            </YStack>

            {/* Year Group Photos - 2 Column Grid */}
            {yearGroupPhotos.length > 0 && (
              <YStack {...cardStyle} padding={16}>
                <Text fontSize={16} fontWeight="700" color="#1a1f2c" marginBottom={12}>
                  {t('directory.photos')}
                </Text>
                <View style={styles.photoGrid}>
                  {yearGroupPhotos.map((photo: string, idx: number) => (
                    <View key={idx} style={styles.photoContainer}>
                      <RNImage source={{ uri: getImageUrl(photo)! }} style={styles.photo} resizeMode="cover" />
                    </View>
                  ))}
                </View>
              </YStack>
            )}

            {/* Year Group Posts - Using PostCard Component */}
            {yearGroupPosts.length > 0 && (
              <YStack gap={16}>
                <Text fontSize={16} fontWeight="700" color="#1a1f2c">
                  {t('home.posts')}
                </Text>
                {yearGroupPosts.map((post: any) => {
                  const authorName = post.author?.name || '';
                  // Treat as admin post if: role is admin, name contains 'admin', or no author
                  const isAdminPost = !post.author ||
                    post.author?.role === 'admin' ||
                    authorName.toLowerCase().includes('admin') ||
                    authorName === '';
                  return (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      author={{
                        id: post.author?.id,
                        fullName: isAdminPost ? 'Potch Gim' : authorName,
                        isAdmin: isAdminPost,
                      }}
                      images={post.images}
                      createdAt={post.createdAt}
                    />
                  );
                })}
              </YStack>
            )}
          </YStack>
        )}

        {/* No Year Group Found */}
        {yearGroup && !yearGroupLoading && !yearGroupData && isMember && (
          <YStack
            {...cardStyle}
            padding={16}
            backgroundColor="#fefce8"
            borderWidth={1}
            borderColor="#fde68a"
          >
            <Text fontSize={18} fontWeight="600" color="#1a1f2c">
              {t('home.year_not_found')}
            </Text>
            <Text fontSize={12} color="#6b7280" marginTop={4}>
              {t('home.year_not_created')}
            </Text>
            <Text fontSize={14} color="#6b7280" marginTop={12}>
              {t('home.year_not_created')} {t('profile.class_of', { year: yearGroup })}.
            </Text>
          </YStack>
        )}
      </RNScrollView>

      {/* Members List Dialog */}
      <MembersListDialog
        visible={showMembersDialog}
        title={`${t('profile.class_of', { year: yearGroup })} - ${t('home.all_members')}`}
        members={filteredMembers.map((member: any) => ({
          id: member.id,
          firstName: member.name?.split(' ')[0] || '',
          lastName: member.name?.split(' ').slice(1).join(' ') || '',
          email: member.email,
          phone: member.phone,
          bio: member.bio,
          graduationYear: yearGroup,
          isMember: member.isMember,
          contactPermission: member.contactPermission,
          photoThen: member.thenPhoto,
          photoNow: member.nowPhoto,
          profilePhoto: member.nowPhoto || member.thenPhoto,
          linkedIn: member.linkedin,
          instagram: member.instagram,
          facebook: member.facebook,
        }))}
        onClose={() => setShowMembersDialog(false)}
        currentUserYear={yearGroup}
      />
    </YStack>
  );
}

// 16 padding on scroll + 16 padding on card = 32 per side, 8 gap between photos
const photoWidth = (SCREEN_WIDTH - 64 - 8) / 2;

const styles = StyleSheet.create({
  crownContainer: {
    padding: 12,
    backgroundColor: '#fef3c7', // yellow-100
    borderRadius: 50,
  },
  membersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0', // green-200
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    width: photoWidth,
    height: photoWidth,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
