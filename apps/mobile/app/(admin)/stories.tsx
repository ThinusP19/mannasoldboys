import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

import { adminStoriesApi, Story } from '../../src/services/adminApi';

interface StoryCardProps {
  story: Story;
  onEdit: () => void;
  onDelete: () => void;
}

function StoryCard({ story, onEdit, onDelete }: StoryCardProps) {
  // Safe string getters to prevent render crashes
  const getTitle = (): string => {
    if (!story.title) return 'Untitled Story';
    if (typeof story.title === 'string') return story.title;
    return String(story.title);
  };

  const getContent = (): string => {
    if (!story.content) return 'No content';
    if (typeof story.content === 'string') return story.content;
    return String(story.content);
  };

  const getAuthorName = (): string | null => {
    if (!story.author) return null;
    if (typeof story.author === 'string') return story.author;
    if (typeof story.author === 'object' && story.author !== null) {
      const name = (story.author as any).name;
      if (!name) return 'Unknown author';
      if (typeof name === 'string') return name;
      return String(name);
    }
    return String(story.author);
  };

  // Get safe date value
  const storyDate = story.date || story.createdAt;
  const formattedDate = storyDate && !isNaN(new Date(storyDate).getTime())
    ? format(new Date(storyDate), 'dd MMM yyyy')
    : 'Unknown date';

  const authorName = getAuthorName();

  return (
    <View style={styles.storyCard}>
      <View style={styles.cardContent}>
        <Text style={styles.storyTitle} numberOfLines={2}>
          {getTitle()}
        </Text>

        <Text style={styles.storyContent} numberOfLines={3}>
          {getContent()}
        </Text>

        <View style={styles.metaRow}>
          {authorName && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={12} color="#6b7280" />
              <Text style={styles.metaText}>{authorName}</Text>
            </View>
          )}

          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color="#6b7280" />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit} activeOpacity={0.7}>
            <Ionicons name="pencil" size={16} color="#3b82f6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const MAX_IMAGES = 3;

interface ImageItem {
  uri: string;
  base64?: string;
  isExisting?: boolean;
}

interface StoryFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; images?: string[]; date?: string }) => void;
  story?: Story | null;
  isSaving: boolean;
}

function StoryForm({ visible, onClose, onSave, story, isSaving }: StoryFormProps) {
  const [title, setTitle] = useState(story?.title || '');
  const [content, setContent] = useState(story?.content || '');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setContent(story.content);
      // Load existing images
      const existingImages: ImageItem[] = [];
      if (story.images && story.images.length > 0) {
        story.images.forEach((img: string) => {
          existingImages.push({ uri: img, isExisting: true });
        });
      }
      setSelectedImages(existingImages);
    } else {
      setTitle('');
      setContent('');
      setSelectedImages([]);
    }
  }, [story]);

  const handlePickImages = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: MAX_IMAGES - selectedImages.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: ImageItem[] = [];

        for (const asset of result.assets) {
          if (selectedImages.length + newImages.length >= MAX_IMAGES) break;

          try {
            const base64 = await readAsStringAsync(asset.uri, {
              encoding: EncodingType.Base64,
            });
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
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    // Prepare images array - use base64 for new images, URLs for existing
    const images: string[] = [];
    for (const img of selectedImages) {
      if (img.base64) {
        images.push(img.base64);
      } else if (img.isExisting && img.uri) {
        images.push(img.uri);
      }
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      images: images.length > 0 ? images : undefined,
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {story ? 'Edit Story' : 'Add Story'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter story title"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Content */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Content *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write the story content..."
                placeholderTextColor="#9ca3af"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
              />
            </View>

            {/* Images */}
            <View style={styles.formGroup}>
              <View style={styles.imagesHeader}>
                <Text style={styles.formLabel}>
                  Images ({selectedImages.length}/{MAX_IMAGES})
                </Text>
              </View>

              {/* Add Photos Button */}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handlePickImages}
                disabled={isPickingImage || selectedImages.length >= MAX_IMAGES}
                activeOpacity={0.7}
              >
                {isPickingImage ? (
                  <ActivityIndicator size="small" color="#1e3a5f" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={20} color="#1e3a5f" />
                    <Text style={styles.addPhotoText}>Add Photos</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Image Preview Grid */}
              {selectedImages.length > 0 && (
                <View style={styles.imageGrid}>
                  {selectedImages.map((img, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.saveButtonContent}>
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function StoriesScreen() {
  const { t } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStories = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminStoriesApi.getAll();
      setStories(data);
    } catch (err: any) {
      setError(err.error || 'Failed to load stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleSave = async (data: { title: string; content: string; images?: string[] }) => {
    try {
      setIsSaving(true);
      if (editingStory) {
        const updated = await adminStoriesApi.update(editingStory.id, data);
        setStories((prev) =>
          prev.map((s) => (s.id === editingStory.id ? { ...s, ...updated } : s))
        );
        Alert.alert('Success', 'Story updated successfully');
      } else {
        const newStory = await adminStoriesApi.create(data);
        setStories((prev) => [newStory, ...prev]);
        Alert.alert('Success', 'Story created successfully');
      }
      setShowForm(false);
      setEditingStory(null);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save story');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setShowForm(true);
  };

  const handleDelete = (story: Story) => {
    Alert.alert(
      'Delete Story',
      `Are you sure you want to delete "${story.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminStoriesApi.delete(story.id);
              setStories((prev) => prev.filter((s) => s.id !== story.id));
              Alert.alert('Success', 'Story deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to delete story');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={styles.loadingText}>{t('stories.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text-outline" size={20} color="#1e3a5f" />
          <Text style={styles.headerTitle}>{stories.length} {t('admin.stories')}</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingStory(null);
            setShowForm(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addButtonText}>{t('admin.create')}</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchStories()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoryCard
              story={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStories(true)}
              tintColor="#1e3a5f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>{t('stories.no_stories')}</Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#1e3a5f" />
                <Text style={styles.emptyAddButtonText}>{t('admin.add_story')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <StoryForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingStory(null);
        }}
        onSave={handleSave}
        story={editingStory}
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
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#1a1f2c',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  cardContent: {
    gap: 8,
  },
  storyTitle: {
    color: '#1a1f2c',
    fontSize: 17,
    fontWeight: '600',
  },
  storyContent: {
    color: '#6b7280',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 12,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 4,
  },
  emptyAddButtonText: {
    color: '#1e3a5f',
    fontSize: 14,
    fontWeight: '600',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#1a1f2c',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: '#1a1f2c',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    height: 120,
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
    gap: 8,
  },
  addPhotoText: {
    color: '#1e3a5f',
    fontSize: 14,
    fontWeight: '500',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 80,
    height: 80,
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
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#1e3a5f',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
