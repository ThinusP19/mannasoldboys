import React, { useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { YStack, XStack, Text, Button, Spinner } from 'tamagui';
import {
  X,
  Users,
  Calendar,
  Image as ImageIcon,
  FileText,
  MessageCircle,
  ExternalLink,
} from '@tamagui/lucide-icons';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { colors } from '../theme/colors';
import { yearGroupsApi, yearGroupPostsApi } from '../services';
import { MembersListDialog } from './MembersListDialog';
import { PostCard } from './PostCard';
import { getImageUrl } from '../utils/imageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface YearGroupDetailDialogProps {
  visible: boolean;
  year: number | null;
  onClose: () => void;
}

export function YearGroupDetailDialog({ visible, year, onClose }: YearGroupDetailDialogProps) {
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  // Fetch year group data
  const { data: yearGroupData, isLoading: yearGroupLoading } = useQuery({
    queryKey: ['yearGroup', year],
    queryFn: () => yearGroupsApi.getByYear(year!),
    enabled: visible && !!year,
  });

  // Fetch members
  const { data: membersData } = useQuery({
    queryKey: ['yearGroupMembers', year],
    queryFn: () => yearGroupsApi.getMembersByYear(year!),
    enabled: visible && !!year,
  });

  // Fetch posts
  const { data: postsData = [] } = useQuery({
    queryKey: ['yearGroupPosts', yearGroupData?.id],
    queryFn: () => yearGroupPostsApi.getByYearGroup(yearGroupData!.id),
    enabled: visible && !!yearGroupData?.id,
  });

  if (!year) return null;

  // Filter members (hide 'none' permission for other year groups, but show for users in same year)
  const filteredMembers =
    membersData?.members?.filter((member: any) => member.contactPermission !== 'none') || [];

  const yearGroupPhotos =
    yearGroupData?.photos && yearGroupData.photos.length > 0
      ? yearGroupData.photos
      : yearGroupData?.groupPhoto
      ? [yearGroupData.groupPhoto]
      : [];

  const handleWhatsApp = async () => {
    if (yearGroupData?.whatsappLink) {
      await WebBrowser.openBrowserAsync(yearGroupData.whatsappLink);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <XStack
          backgroundColor={colors.light.primary}
          paddingVertical={16}
          paddingHorizontal={16}
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack alignItems="center" gap={10}>
            <Calendar size={20} color="#ffffff" />
            <Text color="#ffffff" fontSize={18} fontWeight="700">
              Class of {year}
            </Text>
          </XStack>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </XStack>

        {yearGroupLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color={colors.light.primary} />
            <Text marginTop={16} color="#6b7280">
              Loading year group...
            </Text>
          </YStack>
        ) : !yearGroupData ? (
          <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
            <Calendar size={48} color="#9ca3af" />
            <Text fontSize={18} fontWeight="600" color="#1a1f2c" marginTop={16} textAlign="center">
              Year Group Not Found
            </Text>
            <Text color="#6b7280" textAlign="center" marginTop={8}>
              This year group hasn't been created yet.
            </Text>
          </YStack>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Quick Links Section */}
            <YStack backgroundColor="#f9fafb" padding={16} borderRadius={12} marginBottom={16}>
              <Text color="#6b7280" fontSize={11} fontWeight="600" letterSpacing={1}>
                QUICK LINKS
              </Text>

              <TouchableOpacity
                onPress={() => setShowMembersDialog(true)}
                style={styles.quickLinkItem}
              >
                <XStack alignItems="center" gap={12}>
                  <View style={styles.quickLinkIcon}>
                    <Users size={18} color={colors.light.accent} />
                  </View>
                  <YStack flex={1}>
                    <Text fontSize={14} fontWeight="600" color="#1a1f2c">
                      All Members
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

              {yearGroupData.whatsappLink && (
                <TouchableOpacity onPress={handleWhatsApp} style={styles.quickLinkItem}>
                  <XStack alignItems="center" gap={12}>
                    <View style={[styles.quickLinkIcon, { backgroundColor: '#dcfce7' }]}>
                      <MessageCircle size={18} color={colors.light.success} />
                    </View>
                    <YStack flex={1}>
                      <Text fontSize={14} fontWeight="600" color="#1a1f2c">
                        WhatsApp Group
                      </Text>
                      <Text fontSize={12} color="#6b7280">
                        Join the conversation
                      </Text>
                    </YStack>
                  </XStack>
                  <ExternalLink size={18} color="#6b7280" />
                </TouchableOpacity>
              )}
            </YStack>

            {/* About Section */}
            {yearGroupData.yearInfo && (
              <YStack
                backgroundColor="#ffffff"
                padding={16}
                borderRadius={12}
                marginBottom={16}
                shadowColor="rgba(0,0,0,0.08)"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={1}
                shadowRadius={8}
                elevation={2}
              >
                <XStack alignItems="center" gap={8} marginBottom={12}>
                  <View style={styles.sectionIcon}>
                    <FileText size={16} color={colors.light.accent} />
                  </View>
                  <Text color="#1a1f2c" fontSize={16} fontWeight="700">
                    About
                  </Text>
                </XStack>
                <Text color="#6b7280" fontSize={14} lineHeight={22}>
                  {yearGroupData.yearInfo}
                </Text>
              </YStack>
            )}

            {/* Photos Section */}
            {yearGroupPhotos.length > 0 && (
              <YStack
                backgroundColor="#ffffff"
                padding={16}
                borderRadius={12}
                marginBottom={16}
                shadowColor="rgba(0,0,0,0.08)"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={1}
                shadowRadius={8}
                elevation={2}
              >
                <XStack alignItems="center" gap={8} marginBottom={12}>
                  <View style={styles.sectionIcon}>
                    <ImageIcon size={16} color={colors.light.accent} />
                  </View>
                  <Text color="#1a1f2c" fontSize={16} fontWeight="700">
                    Photos
                  </Text>
                </XStack>
                <XStack flexWrap="wrap" gap={8}>
                  {yearGroupPhotos.map((photo: string, idx: number) => (
                    <View key={idx} style={styles.photoContainer}>
                      <RNImage source={{ uri: getImageUrl(photo)! }} style={styles.photo} resizeMode="cover" />
                    </View>
                  ))}
                </XStack>
              </YStack>
            )}

            {/* Posts Section */}
            {postsData.length > 0 && (
              <YStack marginBottom={16}>
                <XStack alignItems="center" gap={8} marginBottom={12}>
                  <View style={styles.sectionIcon}>
                    <FileText size={16} color={colors.light.accent} />
                  </View>
                  <Text color="#1a1f2c" fontSize={16} fontWeight="700">
                    Posts
                  </Text>
                </XStack>
                <YStack gap={12}>
                  {postsData.map((post: any) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      author={{
                        id: post.author?.id,
                        firstName: post.author?.name?.split(' ')[0],
                        lastName: post.author?.name?.split(' ').slice(1).join(' '),
                        fullName: post.author?.name || 'Potch Gim Alumni',
                        isAdmin: post.author?.role === 'admin',
                      }}
                      images={post.images}
                      createdAt={post.createdAt}
                    />
                  ))}
                </YStack>
              </YStack>
            )}
          </ScrollView>
        )}
      </View>

      {/* Members List Dialog */}
      <MembersListDialog
        visible={showMembersDialog}
        title={`Class of ${year} - All Members`}
        members={filteredMembers.map((member: any) => ({
          id: member.id,
          firstName: member.name?.split(' ')[0] || '',
          lastName: member.name?.split(' ').slice(1).join(' ') || '',
          email: member.email,
          phone: member.phone,
          bio: member.bio,
          graduationYear: year,
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
        currentUserYear={year}
      />
    </Modal>
  );
}

const photoWidth = (SCREEN_WIDTH - 64 - 8) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  quickLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 12,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
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

export default YearGroupDetailDialog;
