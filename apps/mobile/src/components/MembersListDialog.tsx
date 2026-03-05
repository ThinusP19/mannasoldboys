import React, { useState } from 'react';
import {
  View,
  Image,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { X, Search, Users } from '@tamagui/lucide-icons';
import { colors } from '../theme/colors';
import { MemberProfileDialog } from './MemberProfileDialog';
import { getImageUrl } from '../utils/imageUrl';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  bio?: string;
  graduationYear?: number | string;
  isMember?: boolean;
  contactPermission?: 'all' | 'year-group' | 'none';
  photoThen?: string;
  photoNow?: string;
  profilePhoto?: string;
  linkedIn?: string;
  instagram?: string;
  facebook?: string;
}

interface MembersListDialogProps {
  visible: boolean;
  title: string;
  members: Member[];
  onClose: () => void;
  currentUserYear?: number;
}

export function MembersListDialog({
  visible,
  title,
  members,
  onClose,
  currentUserYear,
}: MembersListDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);

  // Filter members by search query
  const filteredMembers = members.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Get initials for avatar
  const getInitials = (member: Member) => {
    return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
  };

  // Open member profile
  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setShowMemberProfile(true);
  };

  // Close member profile
  const handleCloseMemberProfile = () => {
    setShowMemberProfile(false);
    setSelectedMember(null);
  };

  const renderMemberItem = ({ item: member }: { item: Member }) => (
    <TouchableOpacity
      onPress={() => handleMemberPress(member)}
      activeOpacity={0.7}
    >
      <XStack
        backgroundColor={colors.light.card}
        borderRadius={12}
        padding={12}
        marginBottom={8}
        alignItems="center"
        gap={12}
        shadowColor="rgba(0,0,0,0.05)"
        shadowOffset={{ width: 0, height: 1 }}
        shadowOpacity={1}
        shadowRadius={4}
        elevation={1}
      >
        {/* Avatar */}
        {member.profilePhoto ? (
          <Image
            source={{ uri: getImageUrl(member.profilePhoto)! }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text color="#ffffff" fontSize={16} fontWeight="600">
              {getInitials(member)}
            </Text>
          </View>
        )}

        {/* Info */}
        <YStack flex={1}>
          <XStack alignItems="center" gap={8}>
            <Text
              color={colors.light.foreground}
              fontSize={16}
              fontWeight="600"
              numberOfLines={1}
            >
              {member.firstName} {member.lastName}
            </Text>
            {member.isMember && (
              <View style={styles.memberBadge}>
                <Text color="#ffffff" fontSize={10} fontWeight="600">
                  Member
                </Text>
              </View>
            )}
          </XStack>
          {member.bio && (
            <Text
              color={colors.light.mutedForeground}
              fontSize={13}
              numberOfLines={1}
              marginTop={2}
            >
              {member.bio}
            </Text>
          )}
        </YStack>

        {/* Arrow indicator */}
        <Text color={colors.light.mutedForeground} fontSize={18}>
          ›
        </Text>
      </XStack>
    </TouchableOpacity>
  );

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
            <Users size={20} color="#ffffff" />
            <Text color="#ffffff" fontSize={18} fontWeight="700">
              {title}
            </Text>
          </XStack>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </XStack>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <XStack
            backgroundColor={colors.light.card}
            borderRadius={10}
            paddingHorizontal={12}
            alignItems="center"
            gap={8}
            borderWidth={1}
            borderColor={colors.light.border}
          >
            <Search size={18} color={colors.light.mutedForeground} />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 10,
                fontSize: 14,
                color: '#000000',
              }}
              placeholder="Search members..."
              placeholderTextColor="#000000"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </XStack>
        </View>

        {/* Members Count */}
        <View style={styles.countContainer}>
          <Text color={colors.light.mutedForeground} fontSize={13}>
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            {searchQuery && ` matching "${searchQuery}"`}
          </Text>
        </View>

        {/* Members List */}
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <YStack alignItems="center" paddingVertical={40}>
              <Users size={48} color={colors.light.mutedForeground} />
              <Text
                color={colors.light.mutedForeground}
                fontSize={16}
                marginTop={12}
              >
                {searchQuery ? 'No members found' : 'No members yet'}
              </Text>
            </YStack>
          }
        />
      </View>

      {/* Member Profile Dialog */}
      <MemberProfileDialog
        visible={showMemberProfile}
        member={selectedMember}
        onClose={handleCloseMemberProfile}
        currentUserYear={currentUserYear}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.muted,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberBadge: {
    backgroundColor: colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});

export default MembersListDialog;
