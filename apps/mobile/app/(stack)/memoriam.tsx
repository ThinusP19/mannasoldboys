import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Flower2, Calendar, User, MapPin, Phone, Heart, X } from '@tamagui/lucide-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { memorialsApi } from '../../src/services';
import { useAuth } from '../../src/contexts';
import { brandColors, colors } from '../../src/theme';
import { MembershipGate } from '../../src/components/MembershipGate';
import { getImageUrl } from '../../src/utils/imageUrl';

interface Memorial {
  id: string;
  name: string;
  year?: number;
  bio?: string;
  photo?: string;
  imageLink?: string;
  dateOfPassing?: string;
  tribute?: string;
  funeralDate?: string;
  funeralLocation?: string;
  contactNumber?: string;
  createdAt: string;
}

function MemorialCard({ memorial, onPress }: { memorial: Memorial; onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        <XStack gap={16} padding={16}>
          {/* Photo */}
          <View style={styles.photoContainer}>
            {memorial.photo || memorial.imageLink ? (
              <Image
                source={{ uri: getImageUrl(memorial.imageLink || memorial.photo) || undefined }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <User size={32} color="#9ca3af" />
              </View>
            )}
          </View>

          {/* Info */}
          <YStack flex={1} gap={6}>
            <Text fontSize={18} fontWeight="700" color="#1a1f2c">
              {memorial.name}
            </Text>

            {memorial.year && (
              <XStack alignItems="center" gap={4}>
                <Calendar size={14} color="#6b7280" />
                <Text color="#6b7280" fontSize={13}>
                  {t('profile.class_of', { year: memorial.year })}
                </Text>
              </XStack>
            )}

            {memorial.dateOfPassing && (
              <Text color="#9ca3af" fontSize={12}>
                {t('memorial.passed_away', { date: format(new Date(memorial.dateOfPassing), 'dd MMMM yyyy') })}
              </Text>
            )}

            {memorial.tribute && (
              <Text fontSize={14} color="#6b7280" numberOfLines={2} marginTop={4} lineHeight={20}>
                {memorial.tribute}
              </Text>
            )}

            <Text fontSize={12} color={brandColors.potchGimNavy} marginTop={4}>
              Tap to view details
            </Text>
          </YStack>
        </XStack>

        {/* Flower decoration */}
        <View style={styles.flowerDecoration}>
          <Flower2 size={16} color="#ec4899" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MemorialDetailModal({
  memorial,
  visible,
  onClose
}: {
  memorial: Memorial | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!memorial) return null;

  const photoUrl = memorial.imageLink || memorial.photo;

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {/* Modal Header */}
        <XStack alignItems="center" justifyContent="space-between" padding={16} borderBottomWidth={1} borderBottomColor="#e5e7eb">
          <XStack alignItems="center" gap={12}>
            <View style={styles.modalHeaderIcon}>
              <Flower2 size={18} color="#ec4899" />
            </View>
            <Text fontSize={18} fontWeight="bold" color="#1a1f2c">
              In Loving Memory
            </Text>
          </XStack>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </XStack>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.modalPhotoContainer}>
              {photoUrl ? (
                <Image
                  source={{ uri: getImageUrl(photoUrl) || undefined }}
                  style={styles.modalPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.modalPhotoPlaceholder}>
                  <Heart size={40} color="#9ca3af" />
                </View>
              )}
            </View>
            <Text fontSize={24} fontWeight="bold" color="#1a1f2c" textAlign="center" marginTop={16}>
              {memorial.name}
            </Text>
            {memorial.year && (
              <Text fontSize={16} color="#6b7280" textAlign="center" marginTop={4}>
                {t('profile.class_of', { year: memorial.year })}
              </Text>
            )}
          </View>

          {/* Tribute Section */}
          {memorial.tribute && (
            <View style={styles.section}>
              <XStack alignItems="center" gap={8} marginBottom={12}>
                <Heart size={18} color="#ef4444" />
                <Text fontSize={16} fontWeight="600" color="#1a1f2c">
                  Tribute
                </Text>
              </XStack>
              <View style={styles.tributeCard}>
                <Text fontSize={15} color="#374151" lineHeight={24}>
                  {memorial.tribute}
                </Text>
              </View>
            </View>
          )}

          {/* Date of Passing */}
          {memorial.dateOfPassing && (
            <View style={styles.infoCard}>
              <XStack alignItems="flex-start" gap={12}>
                <View style={styles.infoIconContainer}>
                  <Calendar size={20} color="#6b7280" />
                </View>
                <YStack flex={1}>
                  <Text fontSize={13} color="#6b7280" marginBottom={4}>
                    Date of Passing
                  </Text>
                  <Text fontSize={16} fontWeight="600" color="#1a1f2c">
                    {format(new Date(memorial.dateOfPassing), 'EEEE, d MMMM yyyy')}
                  </Text>
                </YStack>
              </XStack>
            </View>
          )}

          {/* Funeral Date */}
          {memorial.funeralDate && (
            <View style={styles.infoCard}>
              <XStack alignItems="flex-start" gap={12}>
                <View style={styles.infoIconContainer}>
                  <Calendar size={20} color="#6b7280" />
                </View>
                <YStack flex={1}>
                  <Text fontSize={13} color="#6b7280" marginBottom={4}>
                    Funeral Date
                  </Text>
                  <Text fontSize={16} fontWeight="600" color="#1a1f2c">
                    {format(new Date(memorial.funeralDate), 'EEEE, d MMMM yyyy')}
                  </Text>
                </YStack>
              </XStack>
            </View>
          )}

          {/* Funeral Location */}
          {memorial.funeralLocation && (
            <View style={styles.infoCard}>
              <XStack alignItems="flex-start" gap={12}>
                <View style={styles.infoIconContainer}>
                  <MapPin size={20} color="#6b7280" />
                </View>
                <YStack flex={1}>
                  <Text fontSize={13} color="#6b7280" marginBottom={4}>
                    Funeral Location
                  </Text>
                  <Text fontSize={16} fontWeight="600" color="#1a1f2c">
                    {memorial.funeralLocation}
                  </Text>
                </YStack>
              </XStack>
            </View>
          )}

          {/* Contact Number */}
          {memorial.contactNumber && (
            <TouchableOpacity
              style={styles.infoCard}
              onPress={() => handleCall(memorial.contactNumber!)}
              activeOpacity={0.7}
            >
              <XStack alignItems="flex-start" gap={12}>
                <View style={styles.infoIconContainer}>
                  <Phone size={20} color="#6b7280" />
                </View>
                <YStack flex={1}>
                  <Text fontSize={13} color="#6b7280" marginBottom={4}>
                    Contact Number
                  </Text>
                  <Text fontSize={16} fontWeight="600" color={brandColors.potchGimNavy}>
                    {memorial.contactNumber}
                  </Text>
                  <Text fontSize={12} color="#9ca3af" marginTop={2}>
                    Tap to call
                  </Text>
                </YStack>
              </XStack>
            </TouchableOpacity>
          )}

          {/* Footer */}
          <View style={styles.modalFooter}>
            <XStack alignItems="center" justifyContent="center" gap={8}>
              <Heart size={16} color="#ef4444" />
              <Text fontSize={14} color="#6b7280">
                Forever in our hearts
              </Text>
            </XStack>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function MemoriamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [selectedMemorial, setSelectedMemorial] = useState<Memorial | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const { data: memorials, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['memorials'],
    queryFn: () => memorialsApi.getAll(),
  });

  const handleCardPress = (memorial: Memorial) => {
    setSelectedMemorial(memorial);
    setIsDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setIsDetailVisible(false);
    setSelectedMemorial(null);
  };

  return (
    <MembershipGate
      isMember={user?.isMember}
      pageTitle={t('memorial.title')}
      pageDescription="A dedicated space to honor and remember alumni who have passed. Read tributes, share memories, and keep their legacy alive within our community."
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <XStack alignItems="center" gap={12} padding={16}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1a1f2c" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Flower2 size={20} color="#ec4899" />
          </View>
          <Text fontSize={22} fontWeight="bold" color="#1a1f2c">
            {t('memorial.title')}
          </Text>
        </XStack>

        {/* Intro */}
        <View style={styles.introCard}>
          <Text color="#6b7280" fontSize={14} textAlign="center" lineHeight={20}>
            {t('memorial.description')}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Spinner size="large" color={brandColors.potchGimNavy} />
            <Text color="#6b7280" marginTop="$3">
              {t('memorial.loading')}
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <Text color="#dc2626" fontSize={16}>
              {t('errors.generic')}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text color="#ffffff" fontWeight="600">
                {t('common.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={memorials || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemorialCard
                memorial={item}
                onPress={() => handleCardPress(item)}
              />
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
                <Flower2 size={64} color="#d1d5db" />
                <Text color="#6b7280" fontSize={18} fontWeight="600" marginTop="$4">
                  {t('memorial.no_memorials')}
                </Text>
                <Text color="#9ca3af" fontSize={14} marginTop="$2" textAlign="center">
                  {t('memorial.description')}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Memorial Detail Modal */}
      <MemorialDetailModal
        memorial={selectedMemorial}
        visible={isDetailVisible}
        onClose={handleCloseDetail}
      />
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
    backgroundColor: '#fce7f3',
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
    borderLeftColor: '#ec4899',
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
    gap: 12,
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
    position: 'relative',
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  flowerDecoration: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalPhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 4,
    borderColor: '#fce7f3',
  },
  modalPhoto: {
    width: '100%',
    height: '100%',
  },
  modalPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  section: {
    marginBottom: 20,
  },
  tributeCard: {
    backgroundColor: '#fdf2f8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ec4899',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
