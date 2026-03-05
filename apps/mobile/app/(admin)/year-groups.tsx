import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Spinner, ScrollView, Button } from 'tamagui';
import {
  Image as ImageIcon,
  Plus,
  Edit3,
  Trash2,
  Users,
  X,
  Link as LinkIcon,
  Save,
  Calendar,
  Camera,
} from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

import { adminYearGroupsApi, YearGroup } from '../../src/services/adminApi';
import { getImageUrl } from '../../src/utils/imageUrl';

const MAX_PHOTOS = 10;

interface YearGroupCardProps {
  yearGroup: YearGroup;
  onEdit: () => void;
  onDelete: () => void;
}

function YearGroupCard({ yearGroup, onEdit, onDelete }: YearGroupCardProps) {
  // Get the first photo from photos array or fallback to groupPhoto
  const displayPhoto = yearGroup.photos?.[0] || yearGroup.groupPhoto;
  const photoCount = yearGroup.photos?.length || (yearGroup.groupPhoto ? 1 : 0);

  return (
    <View style={styles.yearGroupCard}>
      {/* Image or Placeholder */}
      {displayPhoto ? (
        <View>
          <Image source={{ uri: getImageUrl(displayPhoto)! }} style={styles.groupImage} />
          {photoCount > 1 && (
            <View style={styles.photoCountBadge}>
              <ImageIcon size={12} color="#ffffff" />
              <Text color="#ffffff" fontSize={11} fontWeight="600" marginLeft={4}>
                {photoCount}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.imagePlaceholder}>
          <ImageIcon size={32} color="#9ca3af" />
        </View>
      )}

      {/* Info */}
      <YStack padding="$3" gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text color="#1a1f2c" fontSize={20} fontWeight="bold">
            Class of {yearGroup.year}
          </Text>
          <XStack alignItems="center" gap="$1">
            <Users size={14} color="#6b7280" />
            <Text color="#6b7280" fontSize={13}>
              {yearGroup._count?.members || 0} members
            </Text>
          </XStack>
        </XStack>

        {yearGroup.yearInfo && (
          <Text color="#6b7280" fontSize={13} numberOfLines={2}>
            {yearGroup.yearInfo}
          </Text>
        )}

        {yearGroup.whatsappLink && (
          <XStack alignItems="center" gap="$1">
            <LinkIcon size={12} color="#25D366" />
            <Text color="#25D366" fontSize={12}>
              WhatsApp Group
            </Text>
          </XStack>
        )}

        {/* Actions */}
        <XStack gap="$2" marginTop="$2">
          <TouchableOpacity style={styles.editButton} onPress={onEdit} activeOpacity={0.7}>
            <Edit3 size={16} color="#3b82f6" />
            <Text color="#3b82f6" fontSize={13} fontWeight="500" marginLeft="$1">
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.7}>
            <Trash2 size={16} color="#ef4444" />
            <Text color="#ef4444" fontSize={13} fontWeight="500" marginLeft="$1">
              Delete
            </Text>
          </TouchableOpacity>
        </XStack>
      </YStack>
    </View>
  );
}

interface YearGroupFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<YearGroup>) => void;
  yearGroup?: YearGroup | null;
  isSaving: boolean;
}

interface ImageItem {
  uri: string;
  base64?: string;
  isExisting?: boolean;
}

function YearGroupForm({ visible, onClose, onSave, yearGroup, isSaving }: YearGroupFormProps) {
  const [year, setYear] = useState(yearGroup?.year?.toString() || '');
  const [yearInfo, setYearInfo] = useState(yearGroup?.yearInfo || '');
  const [whatsappLink, setWhatsappLink] = useState(yearGroup?.whatsappLink || '');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);

  useEffect(() => {
    if (yearGroup) {
      setYear(yearGroup.year.toString());
      setYearInfo(yearGroup.yearInfo || '');
      setWhatsappLink(yearGroup.whatsappLink || '');
      // Load existing photos
      const existingPhotos: ImageItem[] = [];
      if (yearGroup.photos && yearGroup.photos.length > 0) {
        yearGroup.photos.forEach((photo: string) => {
          existingPhotos.push({ uri: photo, isExisting: true });
        });
      } else if (yearGroup.groupPhoto) {
        existingPhotos.push({ uri: yearGroup.groupPhoto, isExisting: true });
      }
      setSelectedImages(existingPhotos);
    } else {
      setYear('');
      setYearInfo('');
      setWhatsappLink('');
      setSelectedImages([]);
    }
  }, [yearGroup]);

  const handlePickImages = async () => {
    if (selectedImages.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: MAX_PHOTOS - selectedImages.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: ImageItem[] = [];

        for (const asset of result.assets) {
          if (selectedImages.length + newImages.length >= MAX_PHOTOS) break;

          try {
            const base64 = await readAsStringAsync(asset.uri, {
              encoding: EncodingType.Base64,
            });
            // Determine mime type from uri
            const extension = asset.uri.split('.').pop()?.toLowerCase();
            const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
            const base64WithPrefix = `data:${mimeType};base64,${base64}`;

            newImages.push({
              uri: asset.uri,
              base64: base64WithPrefix,
              isExisting: false,
            });
          } catch (err) {
            console.error('Failed to read image:', err);
          }
        }

        setSelectedImages((prev) => [...prev, ...newImages]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick images');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!year || isNaN(Number(year))) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    // Prepare photos array - use base64 for new images, URLs for existing
    const photos: string[] = [];
    for (const img of selectedImages) {
      if (img.base64) {
        photos.push(img.base64);
      } else if (img.isExisting && img.uri) {
        photos.push(img.uri);
      }
    }

    onSave({
      year: Number(year),
      photos: photos.length > 0 ? photos : null,
      yearInfo: yearInfo || null,
      whatsappLink: whatsappLink || null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
            <Text color="#1a1f2c" fontSize={20} fontWeight="bold">
              {yearGroup ? 'Edit Year Group' : 'Add Year Group'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Year */}
            <YStack gap="$2" marginBottom="$4">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Year *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2000"
                placeholderTextColor="#9ca3af"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                editable={!yearGroup}
              />
            </YStack>

            {/* Year Group Photos */}
            <YStack gap="$2" marginBottom="$4">
              <XStack alignItems="center" justifyContent="space-between">
                <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                  Year Group Photos ({selectedImages.length}/{MAX_PHOTOS})
                </Text>
              </XStack>

              {/* Add Photos Button */}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handlePickImages}
                disabled={isPickingImage || selectedImages.length >= MAX_PHOTOS}
                activeOpacity={0.7}
              >
                {isPickingImage ? (
                  <Spinner size="small" color="#1e3a5f" />
                ) : (
                  <>
                    <Camera size={20} color="#1e3a5f" />
                    <Text color="#1e3a5f" fontSize={14} fontWeight="500" marginLeft="$2">
                      Add Photos
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Image Preview Grid */}
              {selectedImages.length > 0 && (
                <View style={styles.imageGrid}>
                  {selectedImages.map((img, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri: img.isExisting ? getImageUrl(img.uri)! : img.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                        activeOpacity={0.7}
                      >
                        <X size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </YStack>

            {/* Year Info */}
            <YStack gap="$2" marginBottom="$4">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Year Info
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Information about this year group..."
                placeholderTextColor="#9ca3af"
                value={yearInfo}
                onChangeText={setYearInfo}
                multiline
                numberOfLines={3}
              />
            </YStack>

            {/* WhatsApp Link */}
            <YStack gap="$2" marginBottom="$4">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                WhatsApp Group Link
              </Text>
              <TextInput
                style={styles.input}
                placeholder="https://chat.whatsapp.com/..."
                placeholderTextColor="#9ca3af"
                value={whatsappLink}
                onChangeText={setWhatsappLink}
                autoCapitalize="none"
              />
            </YStack>
          </ScrollView>

          {/* Actions */}
          <XStack gap="$3" marginTop="$4">
            <Button
              flex={1}
              height={48}
              backgroundColor="#f3f4f6"
              onPress={onClose}
              disabled={isSaving}
            >
              <Text color="#6b7280" fontWeight="600">
                Cancel
              </Text>
            </Button>
            <Button
              flex={1}
              height={48}
              backgroundColor="#1e3a5f"
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Spinner color="white" size="small" />
              ) : (
                <XStack alignItems="center" gap="$2">
                  <Save size={18} color="#ffffff" />
                  <Text color="#ffffff" fontWeight="600">
                    Save
                  </Text>
                </XStack>
              )}
            </Button>
          </XStack>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function YearGroupsScreen() {
  const { t } = useTranslation();
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingYearGroup, setEditingYearGroup] = useState<YearGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchYearGroups = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminYearGroupsApi.getAll();
      // Sort by year descending
      setYearGroups(data.sort((a, b) => b.year - a.year));
    } catch (err: any) {
      setError(err.error || 'Failed to load year groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchYearGroups();
  }, []);

  const handleSave = async (data: Partial<YearGroup>) => {
    try {
      setIsSaving(true);
      if (editingYearGroup) {
        await adminYearGroupsApi.update(editingYearGroup.year, data);
        setYearGroups((prev) =>
          prev.map((yg) => (yg.year === editingYearGroup.year ? { ...yg, ...data } : yg))
        );
        Alert.alert('Success', 'Year group updated successfully');
      } else {
        const newYearGroup = await adminYearGroupsApi.create(data as any);
        setYearGroups((prev) => [newYearGroup, ...prev].sort((a, b) => b.year - a.year));
        Alert.alert('Success', 'Year group created successfully');
      }
      setShowForm(false);
      setEditingYearGroup(null);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save year group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (yearGroup: YearGroup) => {
    try {
      // Fetch full details including all photos
      const fullYearGroup = await adminYearGroupsApi.getByYear(yearGroup.year);
      setEditingYearGroup(fullYearGroup);
      setShowForm(true);
    } catch (err) {
      // Fallback to list data if fetch fails
      setEditingYearGroup(yearGroup);
      setShowForm(true);
    }
  };

  const handleDelete = (yearGroup: YearGroup) => {
    Alert.alert(
      'Delete Year Group',
      `Are you sure you want to delete the Class of ${yearGroup.year}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminYearGroupsApi.delete(yearGroup.year);
              setYearGroups((prev) => prev.filter((yg) => yg.year !== yearGroup.year));
              Alert.alert('Success', 'Year group deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to delete year group');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#1e3a5f" />
        <Text color="#6b7280" marginTop="$3">
          {t('home.loading_year_group')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <XStack alignItems="center" gap="$2">
          <Calendar size={20} color="#1e3a5f" />
          <Text color="#1a1f2c" fontSize={16} fontWeight="600">
            {yearGroups.length} {t('admin.year_groups')}
          </Text>
        </XStack>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingYearGroup(null);
            setShowForm(true);
          }}
          activeOpacity={0.7}
        >
          <Plus size={18} color="#ffffff" />
          <Text color="#ffffff" fontSize={14} fontWeight="600" marginLeft="$1">
            {t('admin.create')}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text color="#dc2626" fontSize={16} textAlign="center">
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchYearGroups()}>
            <Text color="#ffffff" fontWeight="600">
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={yearGroups}
          keyExtractor={(item) => item.year.toString()}
          renderItem={({ item }) => (
            <YearGroupCard
              yearGroup={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchYearGroups(true)}
              tintColor="#1e3a5f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ImageIcon size={48} color="#d1d5db" />
              <Text color="#6b7280" fontSize={16} marginTop="$3">
                {t('admin.no_year_groups')}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color="#1e3a5f" />
                <Text color="#1e3a5f" fontSize={14} fontWeight="600" marginLeft="$1">
                  {t('admin.add_year_group')}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <YearGroupForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingYearGroup(null);
        }}
        onSave={handleSave}
        yearGroup={editingYearGroup}
        isSaving={isSaving}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  yearGroupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  groupImage: {
    width: '100%',
    height: 220,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1f2c',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#1e3a5f',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
