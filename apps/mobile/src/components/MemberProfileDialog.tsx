import React from 'react';
import {
  View,
  Image,
  Modal,
  ScrollView,
  Linking,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import {
  X,
  Mail,
  Phone,
  Linkedin,
  Instagram,
  Facebook,
  User,
  Calendar,
  Globe,
  MessageCircle,
} from '@tamagui/lucide-icons';
import { colors } from '../theme/colors';
import { getImageUrl } from '../utils/imageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MemberProfile {
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

interface MemberProfileDialogProps {
  visible: boolean;
  member: MemberProfile | null;
  onClose: () => void;
  currentUserYear?: number; // To check year-group permission
}

export function MemberProfileDialog({
  visible,
  member,
  onClose,
  currentUserYear,
}: MemberProfileDialogProps) {
  if (!member) return null;

  const fullName = `${member.firstName} ${member.lastName}`;
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();

  // Check if contact info should be visible
  const canViewContact = () => {
    if (!member.contactPermission || member.contactPermission === 'all') {
      return true;
    }
    if (member.contactPermission === 'year-group') {
      return currentUserYear && member.graduationYear === currentUserYear;
    }
    return false;
  };

  const showContact = canViewContact();

  // Open external links
  const handleEmail = () => {
    if (member.email) {
      Linking.openURL(`mailto:${member.email}`);
    }
  };

  const handlePhone = () => {
    if (member.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (member.phone) {
      const cleanPhone = member.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    }
  };

  const handleSocialLink = (url: string) => {
    if (url) {
      // Add https if not present
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(fullUrl);
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
          <Text color="#ffffff" fontSize={18} fontWeight="700">
            Member Profile
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </XStack>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <YStack alignItems="center" paddingVertical={24} gap={12}>
            {/* Avatar */}
            {member.profilePhoto ? (
              <Image
                source={{ uri: getImageUrl(member.profilePhoto)! }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text color="#ffffff" fontSize={32} fontWeight="700">
                  {initials}
                </Text>
              </View>
            )}

            {/* Name */}
            <Text
              color={colors.light.foreground}
              fontSize={24}
              fontWeight="700"
              textAlign="center"
            >
              {fullName}
            </Text>

            {/* Badges */}
            <XStack gap={8}>
              {member.graduationYear && (
                <View style={styles.yearBadge}>
                  <Calendar size={12} color={colors.light.primary} />
                  <Text
                    color={colors.light.primary}
                    fontSize={12}
                    fontWeight="600"
                  >
                    Class of {member.graduationYear}
                  </Text>
                </View>
              )}
              {member.isMember && (
                <View style={styles.memberBadge}>
                  <Text color="#ffffff" fontSize={12} fontWeight="600">
                    Member
                  </Text>
                </View>
              )}
            </XStack>
          </YStack>

          {/* Bio Section */}
          {member.bio && (
            <YStack
              backgroundColor={colors.light.card}
              borderRadius={12}
              padding={16}
              marginBottom={16}
              shadowColor="rgba(0,0,0,0.08)"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={1}
              shadowRadius={8}
              elevation={2}
            >
              <XStack alignItems="center" gap={8} marginBottom={12}>
                <View style={styles.iconCircle}>
                  <User size={16} color={colors.light.accent} />
                </View>
                <Text
                  color={colors.light.foreground}
                  fontSize={16}
                  fontWeight="700"
                >
                  About
                </Text>
              </XStack>
              <Text
                color={colors.light.mutedForeground}
                fontSize={14}
                lineHeight={22}
              >
                {member.bio}
              </Text>
            </YStack>
          )}

          {/* Then & Now Photos */}
          {(member.photoThen || member.photoNow) && (
            <YStack
              backgroundColor={colors.light.card}
              borderRadius={12}
              padding={16}
              marginBottom={16}
              shadowColor="rgba(0,0,0,0.08)"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={1}
              shadowRadius={8}
              elevation={2}
            >
              <XStack alignItems="center" gap={8} marginBottom={12}>
                <View style={styles.iconCircle}>
                  <Calendar size={16} color={colors.light.accent} />
                </View>
                <Text
                  color={colors.light.foreground}
                  fontSize={16}
                  fontWeight="700"
                >
                  Then & Now
                </Text>
              </XStack>
              <XStack gap={12}>
                {member.photoThen && (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: getImageUrl(member.photoThen)! }}
                      style={styles.thenNowPhoto}
                    />
                    <View style={styles.photoLabel}>
                      <Text color="#ffffff" fontSize={12} fontWeight="600">
                        Then
                      </Text>
                    </View>
                  </View>
                )}
                {member.photoNow && (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: getImageUrl(member.photoNow)! }}
                      style={styles.thenNowPhoto}
                    />
                    <View style={styles.photoLabel}>
                      <Text color="#ffffff" fontSize={12} fontWeight="600">
                        Now
                      </Text>
                    </View>
                  </View>
                )}
              </XStack>
            </YStack>
          )}

          {/* Contact Information */}
          {showContact && (member.email || member.phone) && (
            <YStack
              backgroundColor={colors.light.card}
              borderRadius={12}
              padding={16}
              marginBottom={16}
              shadowColor="rgba(0,0,0,0.08)"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={1}
              shadowRadius={8}
              elevation={2}
            >
              <XStack alignItems="center" gap={8} marginBottom={12}>
                <View style={styles.iconCircle}>
                  <Mail size={16} color={colors.light.accent} />
                </View>
                <Text
                  color={colors.light.foreground}
                  fontSize={16}
                  fontWeight="700"
                >
                  Contact
                </Text>
              </XStack>

              {member.email && (
                <TouchableOpacity onPress={handleEmail}>
                  <XStack
                    alignItems="center"
                    gap={12}
                    paddingVertical={8}
                    borderBottomWidth={member.phone ? 1 : 0}
                    borderBottomColor={colors.light.border}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: '#dbeafe' }]}>
                      <Mail size={16} color={colors.light.accent} />
                    </View>
                    <Text
                      color={colors.light.accent}
                      fontSize={14}
                      flex={1}
                    >
                      {member.email}
                    </Text>
                  </XStack>
                </TouchableOpacity>
              )}

              {member.phone && (
                <XStack alignItems="center" gap={12} paddingVertical={8}>
                  <TouchableOpacity onPress={handlePhone} style={styles.phoneRow}>
                    <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
                      <Phone size={16} color={colors.light.success} />
                    </View>
                    <Text
                      color={colors.light.foreground}
                      fontSize={14}
                      flex={1}
                    >
                      {member.phone}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleWhatsApp}
                    style={styles.whatsappButton}
                  >
                    <MessageCircle size={16} color="#ffffff" />
                  </TouchableOpacity>
                </XStack>
              )}
            </YStack>
          )}

          {/* Contact Hidden Notice */}
          {!showContact && (member.email || member.phone) && (
            <YStack
              backgroundColor={colors.light.muted}
              borderRadius={12}
              padding={16}
              marginBottom={16}
              alignItems="center"
            >
              <Text
                color={colors.light.mutedForeground}
                fontSize={14}
                textAlign="center"
              >
                Contact information is hidden based on privacy settings
              </Text>
            </YStack>
          )}

          {/* Social Media Links */}
          {(member.linkedIn || member.instagram || member.facebook) && (
            <YStack
              backgroundColor={colors.light.card}
              borderRadius={12}
              padding={16}
              marginBottom={16}
              shadowColor="rgba(0,0,0,0.08)"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={1}
              shadowRadius={8}
              elevation={2}
            >
              <XStack alignItems="center" gap={8} marginBottom={12}>
                <View style={styles.iconCircle}>
                  <Globe size={16} color={colors.light.accent} />
                </View>
                <Text
                  color={colors.light.foreground}
                  fontSize={16}
                  fontWeight="700"
                >
                  Connect Online
                </Text>
              </XStack>

              <XStack gap={12} flexWrap="wrap">
                {member.linkedIn && (
                  <TouchableOpacity
                    onPress={() => handleSocialLink(member.linkedIn!)}
                    style={styles.socialButton}
                  >
                    <Linkedin size={18} color="#0077b5" />
                    <Text color="#0077b5" fontSize={13} fontWeight="500">
                      LinkedIn
                    </Text>
                  </TouchableOpacity>
                )}
                {member.instagram && (
                  <TouchableOpacity
                    onPress={() => handleSocialLink(member.instagram!)}
                    style={styles.socialButton}
                  >
                    <Instagram size={18} color="#e4405f" />
                    <Text color="#e4405f" fontSize={13} fontWeight="500">
                      Instagram
                    </Text>
                  </TouchableOpacity>
                )}
                {member.facebook && (
                  <TouchableOpacity
                    onPress={() => handleSocialLink(member.facebook!)}
                    style={styles.socialButton}
                  >
                    <Facebook size={18} color="#1877f2" />
                    <Text color="#1877f2" fontSize={13} fontWeight="500">
                      Facebook
                    </Text>
                  </TouchableOpacity>
                )}
              </XStack>
            </YStack>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const photoSize = (SCREEN_WIDTH - 64 - 12) / 2;

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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.light.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  memberBadge: {
    backgroundColor: colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thenNowPhoto: {
    width: '100%',
    height: photoSize,
    backgroundColor: colors.light.muted,
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
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  whatsappButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: '#ffffff',
  },
});

export default MemberProfileDialog;
