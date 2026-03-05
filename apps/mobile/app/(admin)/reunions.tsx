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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { adminReunionsApi, Reunion } from '../../src/services/adminApi';

interface ReunionCardProps {
  reunion: Reunion;
  onEdit: () => void;
  onDelete: () => void;
  onViewGuests: () => void;
}

function ReunionCard({ reunion, onEdit, onDelete, onViewGuests }: ReunionCardProps) {
  // Safe string getters to prevent render crashes
  const getTitle = (): string => {
    if (!reunion.title) return 'Untitled Reunion';
    if (typeof reunion.title === 'string') return reunion.title;
    return String(reunion.title);
  };

  const getLocation = (): string => {
    if (!reunion.location) return 'Location TBD';
    if (typeof reunion.location === 'string') return reunion.location;
    return String(reunion.location);
  };

  const getDescription = (): string | null => {
    if (!reunion.description) return null;
    if (typeof reunion.description === 'string') return reunion.description;
    return String(reunion.description);
  };

  // Guard against invalid/missing date
  const hasValidDate = reunion.date && !isNaN(new Date(reunion.date).getTime());
  const reunionDate = hasValidDate ? new Date(reunion.date) : new Date();
  const isPast = hasValidDate ? reunionDate < new Date() : false;

  return (
    <View style={[styles.reunionCard, isPast && styles.pastReunion]}>
      <View style={styles.cardRow}>
        {/* Date Badge */}
        <View style={[styles.dateBadge, isPast && styles.pastDateBadge]}>
          <Text style={[styles.dateDay, isPast && styles.pastDateText]}>
            {hasValidDate ? format(reunionDate, 'dd') : '--'}
          </Text>
          <Text style={[styles.dateMonth, isPast && styles.pastDateText]}>
            {hasValidDate ? format(reunionDate, 'MMM') : '---'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.reunionTitle} numberOfLines={2}>
            {getTitle()}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#6b7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {getLocation()}
            </Text>
          </View>

          {getDescription() && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {getDescription()}
            </Text>
          )}

          <View style={styles.badgesRow}>
            {reunion.targetYearGroups && reunion.targetYearGroups.length > 0 && (
              <View style={styles.yearsBadge}>
                <Text style={styles.yearsBadgeText}>
                  {reunion.targetYearGroups.length} year group(s)
                </Text>
              </View>
            )}
            {reunion._count?.registrations !== undefined && (
              <View style={styles.registrationsBadge}>
                <Ionicons name="people-outline" size={12} color="#22c55e" />
                <Text style={styles.registrationsText}>
                  {reunion._count.registrations} registered
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.viewButton} onPress={onViewGuests} activeOpacity={0.7}>
          <Ionicons name="eye-outline" size={16} color="#6366f1" />
          <Text style={styles.viewButtonText}>Guests</Text>
        </TouchableOpacity>

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
  );
}

interface GuestListModalProps {
  visible: boolean;
  onClose: () => void;
  reunionId: string | null;
  reunionTitle: string;
}

function GuestListModal({ visible, onClose, reunionId, reunionTitle }: GuestListModalProps) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && reunionId) {
      fetchGuests();
    }
  }, [visible, reunionId]);

  const fetchGuests = async () => {
    if (!reunionId) return;
    try {
      setLoading(true);
      const data = await adminReunionsApi.getRegistrations(reunionId);
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to load guest list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Guest List</Text>
              <Text style={styles.modalSubtitle}>{reunionTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e3a5f" />
            </View>
          ) : registrations.length === 0 ? (
            <View style={styles.emptyGuests}>
              <Ionicons name="people-outline" size={32} color="#d1d5db" />
              <Text style={styles.emptyGuestsText}>No registrations yet</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.guestCount}>
                {registrations.length} guest(s) registered
              </Text>
              {registrations.map((reg, index) => (
                <View key={reg.id || index} style={styles.guestItem}>
                  <View style={styles.guestRow}>
                    <View style={styles.guestAvatar}>
                      <Text style={styles.guestAvatarText}>
                        {reg.user?.name?.[0] || '?'}
                      </Text>
                    </View>
                    <View style={styles.guestInfo}>
                      <Text style={styles.guestName}>
                        {reg.user?.name || 'Unknown'}
                      </Text>
                      <Text style={styles.guestEmail}>
                        {reg.user?.email || ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        reg.status === 'coming' && styles.comingBadge,
                        reg.status === 'maybe' && styles.maybeBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          reg.status === 'coming' && styles.comingText,
                          reg.status === 'maybe' && styles.maybeText,
                        ]}
                      >
                        {reg.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface ReunionFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reunion>) => void;
  reunion?: Reunion | null;
  isSaving: boolean;
}

function ReunionForm({ visible, onClose, onSave, reunion, isSaving }: ReunionFormProps) {
  // Helper to safely format date
  const getFormattedDate = (dateStr?: string) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
    return format(new Date(dateStr), 'yyyy-MM-dd');
  };

  const [title, setTitle] = useState(reunion?.title || '');
  const [date, setDate] = useState(getFormattedDate(reunion?.date));
  const [location, setLocation] = useState(reunion?.location || '');
  const [description, setDescription] = useState(reunion?.description || '');
  const [targetYears, setTargetYears] = useState(reunion?.targetYearGroups?.join(', ') || '');

  useEffect(() => {
    if (reunion) {
      setTitle(reunion.title || '');
      setDate(getFormattedDate(reunion.date));
      setLocation(reunion.location || '');
      setDescription(reunion.description || '');
      setTargetYears(reunion.targetYearGroups?.join(', ') || '');
    } else {
      setTitle('');
      setDate('');
      setLocation('');
      setDescription('');
      setTargetYears('');
    }
  }, [reunion]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!date) {
      Alert.alert('Error', 'Please enter a date');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    const yearGroups = targetYears
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    onSave({
      title: title.trim(),
      date,
      location: location.trim(),
      description: description.trim() || null,
      targetYearGroups: yearGroups.length > 0 ? yearGroups : null,
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
              {reunion ? 'Edit Reunion' : 'Add Reunion'}
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
                placeholder="Reunion event title"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-12-15"
                placeholderTextColor="#9ca3af"
                value={date}
                onChangeText={setDate}
              />
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Venue name and address"
                placeholderTextColor="#9ca3af"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Event details..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Target Year Groups */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Year Groups (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="1990, 1991, 1992"
                placeholderTextColor="#9ca3af"
                value={targetYears}
                onChangeText={setTargetYears}
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

export default function ReunionsScreen() {
  const { t } = useTranslation();
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReunion, setEditingReunion] = useState<Reunion | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingGuestsFor, setViewingGuestsFor] = useState<Reunion | null>(null);

  const fetchReunions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminReunionsApi.getAll();
      // Sort by date descending
      setReunions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err: any) {
      setError(err.error || 'Failed to load reunions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReunions();
  }, []);

  const handleSave = async (data: Partial<Reunion>) => {
    try {
      setIsSaving(true);
      if (editingReunion) {
        const updated = await adminReunionsApi.update(editingReunion.id, data);
        setReunions((prev) =>
          prev.map((r) => (r.id === editingReunion.id ? { ...r, ...updated } : r))
        );
        Alert.alert('Success', 'Reunion updated successfully');
      } else {
        const newReunion = await adminReunionsApi.create(data as any);
        setReunions((prev) =>
          [newReunion, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
        Alert.alert('Success', 'Reunion created successfully');
      }
      setShowForm(false);
      setEditingReunion(null);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to save reunion');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (reunion: Reunion) => {
    setEditingReunion(reunion);
    setShowForm(true);
  };

  const handleDelete = (reunion: Reunion) => {
    Alert.alert(
      'Delete Reunion',
      `Are you sure you want to delete "${reunion.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminReunionsApi.delete(reunion.id);
              setReunions((prev) => prev.filter((r) => r.id !== reunion.id));
              Alert.alert('Success', 'Reunion deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to delete reunion');
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
        <Text style={styles.loadingText}>{t('reunion.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={20} color="#14b8a6" />
          <Text style={styles.headerTitle}>{reunions.length} {t('admin.reunions')}</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingReunion(null);
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchReunions()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reunions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReunionCard
              reunion={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              onViewGuests={() => setViewingGuestsFor(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchReunions(true)}
              tintColor="#1e3a5f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>{t('reunion.no_upcoming')}</Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#1e3a5f" />
                <Text style={styles.emptyAddButtonText}>{t('admin.add_reunion')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <ReunionForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingReunion(null);
        }}
        onSave={handleSave}
        reunion={editingReunion}
        isSaving={isSaving}
      />

      {/* Guest List Modal */}
      <GuestListModal
        visible={!!viewingGuestsFor}
        onClose={() => setViewingGuestsFor(null)}
        reunionId={viewingGuestsFor?.id || null}
        reunionTitle={viewingGuestsFor?.title || ''}
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
  reunionCard: {
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
  pastReunion: {
    opacity: 0.7,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastDateBadge: {
    backgroundColor: '#f3f4f6',
  },
  dateDay: {
    color: '#1e3a5f',
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateMonth: {
    color: '#1e3a5f',
    fontSize: 12,
  },
  pastDateText: {
    color: '#9ca3af',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  reunionTitle: {
    color: '#1a1f2c',
    fontSize: 17,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#6b7280',
    fontSize: 13,
  },
  descriptionText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  yearsBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yearsBadgeText: {
    color: '#6366f1',
    fontSize: 11,
  },
  registrationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registrationsText: {
    color: '#22c55e',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  viewButtonText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#6b7280',
    fontSize: 13,
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
  emptyGuests: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyGuestsText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
  },
  guestCount: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 8,
  },
  guestItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatarText: {
    color: '#1e3a5f',
    fontWeight: '600',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    color: '#1a1f2c',
    fontSize: 14,
    fontWeight: '500',
  },
  guestEmail: {
    color: '#6b7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  comingBadge: {
    backgroundColor: '#dcfce7',
  },
  maybeBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  comingText: {
    color: '#22c55e',
  },
  maybeText: {
    color: '#f59e0b',
  },
});
