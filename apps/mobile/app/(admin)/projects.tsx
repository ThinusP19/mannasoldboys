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
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

import { adminProjectsApi, Project } from '../../src/services/adminApi';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const goal = project.goal || 0;
  const raised = project.raised || 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  return (
    <View style={styles.projectCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleSection}>
            <Text style={styles.projectTitle} numberOfLines={2}>
              {project.title}
            </Text>
            {project.description && (
              <Text style={styles.projectDescription} numberOfLines={2}>
                {project.description}
              </Text>
            )}
          </View>
          <View style={styles.randBadge}>
            <Text style={styles.randText}>R</Text>
          </View>
        </View>

        {/* Progress */}
        {goal > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.raisedAmount}>
                <Ionicons name="trending-up-outline" size={14} color="#22c55e" />
                <Text style={styles.raisedText}>R{raised.toLocaleString()}</Text>
              </View>
              <View style={styles.goalAmount}>
                <Ionicons name="flag-outline" size={14} color="#6b7280" />
                <Text style={styles.goalText}>R{goal.toLocaleString()} goal</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <Text style={styles.progressPercent}>{progress.toFixed(1)}% funded</Text>
          </View>
        )}

        {/* Bank Details */}
        {project.bankName && (
          <View style={styles.bankDetails}>
            <View style={styles.bankHeader}>
              <Ionicons name="card-outline" size={12} color="#6b7280" />
              <Text style={styles.bankLabel}>Bank Details</Text>
            </View>
            <Text style={styles.bankInfo}>
              {project.bankName} - {project.accountNumber}
            </Text>
          </View>
        )}

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

interface ProjectFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
  project?: Project | null;
  isSaving: boolean;
}

function ProjectForm({ visible, onClose, onSave, project, isSaving }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [goal, setGoal] = useState(project?.goal?.toString() || '');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [bankName, setBankName] = useState(project?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(project?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(project?.accountHolder || '');
  const [branchCode, setBranchCode] = useState(project?.branchCode || '');
  const [reference, setReference] = useState(project?.reference || '');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      setGoal(project.goal?.toString() || '');
      // Load existing images
      const existingImages: ImageItem[] = [];
      if (project.images && project.images.length > 0) {
        project.images.forEach((img: string) => {
          existingImages.push({ uri: img, isExisting: true });
        });
      }
      setSelectedImages(existingImages);
      setBankName(project.bankName || '');
      setAccountNumber(project.accountNumber || '');
      setAccountHolder(project.accountHolder || '');
      setBranchCode(project.branchCode || '');
      setReference(project.reference || '');
    } else {
      setTitle('');
      setDescription('');
      setGoal('');
      setSelectedImages([]);
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      setBranchCode('');
      setReference('');
    }
  }, [project]);

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
      description: description.trim() || undefined,
      goal: goal ? Number(goal) : undefined,
      images: images.length > 0 ? images : undefined,
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      accountHolder: accountHolder.trim() || undefined,
      branchCode: branchCode.trim() || undefined,
      reference: reference.trim() || undefined,
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
              {project ? 'Edit Project' : 'Add Project'}
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
                placeholder="Project title"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Project description..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Goal */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fundraising Goal (R)</Text>
              <TextInput
                style={styles.input}
                placeholder="50000"
                placeholderTextColor="#9ca3af"
                value={goal}
                onChangeText={setGoal}
                keyboardType="number-pad"
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

            {/* Bank Details Section */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Bank Details (for donations)</Text>
            </View>

            {/* Bank Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="FNB"
                placeholderTextColor="#9ca3af"
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            {/* Account Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234567890"
                placeholderTextColor="#9ca3af"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
              />
            </View>

            {/* Account Holder */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Account Holder</Text>
              <TextInput
                style={styles.input}
                placeholder="Potch Gim Alumni Association"
                placeholderTextColor="#9ca3af"
                value={accountHolder}
                onChangeText={setAccountHolder}
              />
            </View>

            {/* Branch Code */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Branch Code</Text>
              <TextInput
                style={styles.input}
                placeholder="250655"
                placeholderTextColor="#9ca3af"
                value={branchCode}
                onChangeText={setBranchCode}
              />
            </View>

            {/* Reference */}
            <View style={styles.formGroupLast}>
              <Text style={styles.formLabel}>Reference</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Name + Project"
                placeholderTextColor="#9ca3af"
                value={reference}
                onChangeText={setReference}
              />
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

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjects = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminProjectsApi.getAll();
      setProjects(data);
    } catch (err: any) {
      setError(err.error || 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSave = async (data: Partial<Project>) => {
    try {
      setIsSaving(true);
      if (editingProject) {
        const updated = await adminProjectsApi.update(editingProject.id, data);
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? { ...p, ...updated } : p))
        );
        Alert.alert('Success', 'Project updated successfully');
      } else {
        const newProject = await adminProjectsApi.create(data as any);
        setProjects((prev) => [newProject, ...prev]);
        Alert.alert('Success', 'Project created successfully');
      }
      setShowForm(false);
      setEditingProject(null);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = (project: Project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminProjectsApi.delete(project.id);
              setProjects((prev) => prev.filter((p) => p.id !== project.id));
              Alert.alert('Success', 'Project deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to delete project');
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
        <Text style={styles.loadingText}>{t('giving.loading_projects')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="wallet-outline" size={20} color="#f97316" />
          <Text style={styles.headerTitle}>{projects.length} {t('admin.projects')}</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingProject(null);
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProjects()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProjects(true)}
              tintColor="#1e3a5f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>{t('giving.no_projects')}</Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#1e3a5f" />
                <Text style={styles.emptyAddButtonText}>{t('admin.add_project')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <ProjectForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingProject(null);
        }}
        onSave={handleSave}
        project={editingProject}
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
  projectCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitleSection: {
    flex: 1,
    gap: 4,
  },
  projectTitle: {
    color: '#1a1f2c',
    fontSize: 17,
    fontWeight: '600',
  },
  projectDescription: {
    color: '#6b7280',
    fontSize: 13,
  },
  randBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  randText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  progressSection: {
    marginTop: 8,
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  raisedAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raisedText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  goalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalText: {
    color: '#6b7280',
    fontSize: 13,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressPercent: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'right',
  },
  bankDetails: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bankLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  bankInfo: {
    color: '#9ca3af',
    fontSize: 11,
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
    maxHeight: '90%',
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
    marginBottom: 12,
  },
  formGroupLast: {
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
    height: 80,
    textAlignVertical: 'top',
  },
  sectionDivider: {
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
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
