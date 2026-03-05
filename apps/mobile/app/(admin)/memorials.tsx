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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Spinner, ScrollView, Button } from 'tamagui';
import {
  Heart,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Calendar,
  User,
  Phone,
  MapPin,
  Camera,
} from '@tamagui/lucide-icons';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

import { Picker } from '@react-native-picker/picker';
import { adminMemorialsApi, adminYearGroupsApi, Memorial, YearGroup } from '../../src/services/adminApi';

interface MemorialCardProps {
  memorial: Memorial;
  onEdit: () => void;
  onDelete: () => void;
}

function MemorialCard({ memorial, onEdit, onDelete }: MemorialCardProps) {
  return (
    <View style={styles.memorialCard}>
      <XStack gap="$3">
        {/* Photo */}
        {memorial.photo || memorial.imageLink ? (
          <Image
            source={{ uri: memorial.photo || memorial.imageLink || '' }}
            style={styles.memorialPhoto}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Heart size={24} color="#ec4899" />
          </View>
        )}

        {/* Info */}
        <YStack flex={1} gap="$1">
          <Text color="#1a1f2c" fontSize={17} fontWeight="600">
            {memorial.name}
          </Text>

          <XStack alignItems="center" gap="$1">
            <Calendar size={12} color="#6b7280" />
            <Text color="#6b7280" fontSize={12}>
              Class of {memorial.year}
            </Text>
          </XStack>

          <Text color="#6b7280" fontSize={13} numberOfLines={2} marginTop="$1">
            {memorial.tribute}
          </Text>

          <XStack alignItems="center" gap="$1" marginTop="$1">
            <Text color="#9ca3af" fontSize={11}>
              Passed: {format(new Date(memorial.dateOfPassing), 'dd MMM yyyy')}
            </Text>
          </XStack>

          {memorial.funeralLocation && (
            <XStack alignItems="center" gap="$1">
              <MapPin size={11} color="#9ca3af" />
              <Text color="#9ca3af" fontSize={11} numberOfLines={1}>
                {memorial.funeralLocation}
              </Text>
            </XStack>
          )}
        </YStack>
      </XStack>

      {/* Actions */}
      <XStack gap="$2" marginTop="$3" paddingTop="$3" borderTopWidth={1} borderTopColor="#e5e7eb">
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
    </View>
  );
}

interface ImageItem {
  uri: string;
  base64?: string;
  isExisting?: boolean;
}

interface MemorialFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Memorial>) => void;
  memorial?: Memorial | null;
  isSaving: boolean;
}

function MemorialForm({ visible, onClose, onSave, memorial, isSaving }: MemorialFormProps) {
  const [name, setName] = useState(memorial?.name || '');
  const [year, setYear] = useState(memorial?.year?.toString() || '');
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [tribute, setTribute] = useState(memorial?.tribute || '');
  const [dateOfPassing, setDateOfPassing] = useState(
    memorial?.dateOfPassing ? format(new Date(memorial.dateOfPassing), 'yyyy-MM-dd') : ''
  );
  const [funeralDate, setFuneralDate] = useState(
    memorial?.funeralDate ? format(new Date(memorial.funeralDate), 'yyyy-MM-dd') : ''
  );
  const [funeralLocation, setFuneralLocation] = useState(memorial?.funeralLocation || '');
  const [contactNumber, setContactNumber] = useState(memorial?.contactNumber || '');

  // Year groups state
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loadingYearGroups, setLoadingYearGroups] = useState(false);

  // Fetch year groups when form opens
  useEffect(() => {
    const fetchYearGroups = async () => {
      setLoadingYearGroups(true);
      try {
        const data = await adminYearGroupsApi.getAll();
        setYearGroups(data.sort((a, b) => b.year - a.year));
      } catch (err) {
        console.error('Failed to load year groups:', err);
      } finally {
        setLoadingYearGroups(false);
      }
    };
    if (visible) fetchYearGroups();
  }, [visible]);

  useEffect(() => {
    if (memorial) {
      setName(memorial.name);
      setYear(memorial.year.toString());
      // Load existing photo
      const existingPhoto = memorial.photo || memorial.imageLink;
      if (existingPhoto) {
        setSelectedImage({ uri: existingPhoto, isExisting: true });
      } else {
        setSelectedImage(null);
      }
      setTribute(memorial.tribute);
      setDateOfPassing(format(new Date(memorial.dateOfPassing), 'yyyy-MM-dd'));
      setFuneralDate(memorial.funeralDate ? format(new Date(memorial.funeralDate), 'yyyy-MM-dd') : '');
      setFuneralLocation(memorial.funeralLocation || '');
      setContactNumber(memorial.contactNumber || '');
    } else {
      setName('');
      setYear('');
      setSelectedImage(null);
      setTribute('');
      setDateOfPassing('');
      setFuneralDate('');
      setFuneralLocation('');
      setContactNumber('');
    }
  }, [memorial]);

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          const base64 = await readAsStringAsync(asset.uri, {
            encoding: EncodingType.Base64,
          });
          const extension = asset.uri.split('.').pop()?.toLowerCase();
          const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
          const base64WithPrefix = `data:${mimeType};base64,${base64}`;

          setSelectedImage({
            uri: asset.uri,
            base64: base64WithPrefix,
            isExisting: false,
          });
        } catch (err) {
          console.error('Failed to read image:', err);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!year || isNaN(Number(year))) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }
    if (!tribute.trim()) {
      Alert.alert('Error', 'Please enter a tribute');
      return;
    }
    if (!dateOfPassing) {
      Alert.alert('Error', 'Please enter date of passing');
      return;
    }

    // Prepare photo - use base64 for new image, URL for existing
    let photo: string | null = null;
    if (selectedImage) {
      if (selectedImage.base64) {
        photo = selectedImage.base64;
      } else if (selectedImage.isExisting && selectedImage.uri) {
        photo = selectedImage.uri;
      }
    }

    onSave({
      name: name.trim(),
      year: Number(year),
      photo,
      tribute: tribute.trim(),
      dateOfPassing,
      funeralDate: funeralDate || null,
      funeralLocation: funeralLocation || null,
      contactNumber: contactNumber || null,
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
              {memorial ? 'Edit Memorial' : 'Add Memorial'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <YStack gap="$2" marginBottom="$3">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Name *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </YStack>

            {/* Year Group */}
            <YStack gap="$2" marginBottom="$3">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Year Group *
              </Text>
              {loadingYearGroups ? (
                <View style={styles.pickerLoading}>
                  <Spinner size="small" color="#1e3a5f" />
                  <Text color="#6b7280" fontSize={13} marginLeft="$2">
                    Loading year groups...
                  </Text>
                </View>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={year}
                    onValueChange={(value) => setYear(value)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="Select Year Group" value="" color="#9ca3af" />
                    {yearGroups.map((yg) => (
                      <Picker.Item
                        key={yg.year}
                        label={`Class of ${yg.year}`}
                        value={yg.year.toString()}
                        color="#1a1f2c"
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </YStack>

            {/* Photo */}
            <YStack gap="$2" marginBottom="$3">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Photo
              </Text>

              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                    activeOpacity={0.7}
                  >
                    <X size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handlePickImage}
                    activeOpacity={0.7}
                  >
                    <Camera size={16} color="#1e3a5f" />
                    <Text color="#1e3a5f" fontSize={12} fontWeight="500" marginLeft="$1">
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={handlePickImage}
                  disabled={isPickingImage}
                  activeOpacity={0.7}
                >
                  {isPickingImage ? (
                    <Spinner size="small" color="#1e3a5f" />
                  ) : (
                    <>
                      <Camera size={20} color="#1e3a5f" />
                      <Text color="#1e3a5f" fontSize={14} fontWeight="500" marginLeft="$2">
                        Add Photo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </YStack>

            {/* Tribute */}
            <YStack gap="$2" marginBottom="$3">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Tribute *
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write a tribute..."
                placeholderTextColor="#9ca3af"
                value={tribute}
                onChangeText={setTribute}
                multiline
                numberOfLines={4}
              />
            </YStack>

            {/* Date of Passing */}
            <YStack gap="$2" marginBottom="$3">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Date of Passing * (YYYY-MM-DD)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-15"
                placeholderTextColor="#9ca3af"
                value={dateOfPassing}
                onChangeText={setDateOfPassing}
              />
            </YStack>

            {/* Funeral Date */}
            <YStack gap="$2" marginBottom="$3">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Funeral Date (YYYY-MM-DD)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-20"
                placeholderTextColor="#9ca3af"
                value={funeralDate}
                onChangeText={setFuneralDate}
              />
            </YStack>

            {/* Funeral Location */}
            <YStack gap="$2" marginBottom="$3">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Funeral Location
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Church name, address..."
                placeholderTextColor="#9ca3af"
                value={funeralLocation}
                onChangeText={setFuneralLocation}
              />
            </YStack>

            {/* Contact Number */}
            <YStack gap="$2" marginBottom="$4">
              <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                Contact Number
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Family contact number"
                placeholderTextColor="#9ca3af"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
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

export default function MemorialsScreen() {
  const { t } = useTranslation();
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMemorial, setEditingMemorial] = useState<Memorial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMemorials = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminMemorialsApi.getAll();
      setMemorials(data);
    } catch (err: any) {
      setError(err.error || 'Failed to load memorials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemorials();
  }, []);

  const handleSave = async (data: Partial<Memorial>) => {
    try {
      setIsSaving(true);
      if (editingMemorial) {
        const updated = await adminMemorialsApi.update(editingMemorial.id, data);
        setMemorials((prev) =>
          prev.map((m) => (m.id === editingMemorial.id ? { ...m, ...updated } : m))
        );
        Alert.alert('Success', 'Memorial updated successfully');
      } else {
        const newMemorial = await adminMemorialsApi.create(data as any);
        setMemorials((prev) => [newMemorial, ...prev]);
        Alert.alert('Success', 'Memorial created successfully');
      }
      setShowForm(false);
      setEditingMemorial(null);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save memorial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (memorial: Memorial) => {
    setEditingMemorial(memorial);
    setShowForm(true);
  };

  const handleDelete = (memorial: Memorial) => {
    Alert.alert(
      'Delete Memorial',
      `Are you sure you want to delete the memorial for ${memorial.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminMemorialsApi.delete(memorial.id);
              setMemorials((prev) => prev.filter((m) => m.id !== memorial.id));
              Alert.alert('Success', 'Memorial deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to delete memorial');
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
          {t('memorial.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <XStack alignItems="center" gap="$2">
          <Heart size={20} color="#ec4899" />
          <Text color="#1a1f2c" fontSize={16} fontWeight="600">
            {memorials.length} {t('admin.memorials')}
          </Text>
        </XStack>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingMemorial(null);
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchMemorials()}>
            <Text color="#ffffff" fontWeight="600">
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={memorials}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemorialCard
              memorial={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMemorials(true)}
              tintColor="#1e3a5f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Heart size={48} color="#d1d5db" />
              <Text color="#6b7280" fontSize={16} marginTop="$3">
                {t('memorial.no_memorials')}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color="#1e3a5f" />
                <Text color="#1e3a5f" fontSize={14} fontWeight="600" marginLeft="$1">
                  {t('admin.add_memorial')}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <MemorialForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingMemorial(null);
        }}
        onSave={handleSave}
        memorial={editingMemorial}
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
    gap: 12,
  },
  memorialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  memorialPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  photoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fce7f3',
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
    maxHeight: '90%',
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
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1a1f2c',
  },
  pickerItem: {
    color: '#1a1f2c',
    fontSize: 15,
  },
  pickerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  selectedImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  selectedImage: {
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
  changeImageButton: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingVertical: 4,
  },
});
