import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { colors } from '../theme/colors';
import { reunionsApi } from '../services';

interface Reunion {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  targetYearGroups?: string;
  userRegistration?: {
    status: 'coming' | 'maybe' | 'not_coming';
  };
}

// Helper function to format year groups for display
const formatYearGroups = (targetYearGroups?: string): string => {
  if (!targetYearGroups) return 'Open to All Alumni';
  try {
    const years = JSON.parse(targetYearGroups);
    if (!Array.isArray(years) || years.length === 0) return 'Open to All Alumni';
    return `Class of ${years.join(', ')}`;
  } catch {
    return 'Open to All Alumni';
  }
};

interface ReunionDetailDialogProps {
  visible: boolean;
  reunion: Reunion | null;
  onClose: () => void;
}

export function ReunionDetailDialog({
  visible,
  reunion,
  onClose,
}: ReunionDetailDialogProps) {
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState<'coming' | 'maybe' | 'not_coming' | null>(null);

  // Sync local status with reunion prop when it changes
  useEffect(() => {
    if (reunion?.userRegistration?.status) {
      setLocalStatus(reunion.userRegistration.status);
    } else {
      setLocalStatus(null);
    }
  }, [reunion?.userRegistration?.status, reunion?.id]);

  const registerMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'coming' | 'maybe' | 'not_coming' }) =>
      reunionsApi.register(id, status),
    onSuccess: (_, variables) => {
      // Update local status immediately for instant feedback
      setLocalStatus(variables.status);
      queryClient.invalidateQueries({ queryKey: ['reunions'] });
    },
  });

  if (!reunion) return null;

  // Guard against invalid/missing date to prevent render crashes
  if (!reunion.date || isNaN(new Date(reunion.date).getTime())) {
    return null;
  }

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

  const getDateString = (): string => {
    try {
      return format(new Date(reunion.date), 'EEEE, MMMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  const reunionDate = new Date(reunion.date);
  const isPast = reunionDate < new Date();
  const currentStatus = localStatus;
  const isRegistering = registerMutation.isPending;

  const handleRSVP = (status: 'coming' | 'maybe' | 'not_coming') => {
    registerMutation.mutate({ id: reunion.id, status });
  };

  const handleOpenMaps = () => {
    const location = getLocation();
    if (location === 'Location TBD') return;
    const encodedLocation = encodeURIComponent(location);
    const url = `https://maps.google.com/maps?q=${encodedLocation}`;
    Linking.openURL(url);
  };

  const getStatusLabel = (): string => {
    switch (currentStatus) {
      case 'coming':
        return "You're going!";
      case 'maybe':
        return 'You marked as maybe';
      case 'not_coming':
        return "You can't make it";
      default:
        return 'Not responded';
    }
  };

  const getStatusColor = (): string => {
    switch (currentStatus) {
      case 'coming':
        return colors.light.success;
      case 'maybe':
        return colors.light.warning;
      case 'not_coming':
        return colors.light.destructive;
      default:
        return '#6b7280';
    }
  };

  const description = getDescription();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="calendar" size={20} color="#ffffff" />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getTitle()}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isPast ? '#6b7280' : colors.light.success },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {isPast ? 'Past Event' : 'Upcoming'}
              </Text>
            </View>
          </View>

          {/* Date & Time Card */}
          <View style={[styles.card, { backgroundColor: colors.light.accent }]}>
            <View style={styles.dateRow}>
              <View style={styles.dateContent}>
                <Ionicons name="calendar" size={20} color="#ffffff" />
                <Text style={styles.dateText}>{getDateString()}</Text>
              </View>
              {reunion.time ? (
                <View style={styles.timeContent}>
                  <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.timeText}>{reunion.time}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <View style={styles.locationRow}>
              <View style={styles.locationContent}>
                <View style={styles.locationIcon}>
                  <Ionicons name="location-outline" size={18} color={colors.light.accent} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Location</Text>
                  <Text style={styles.locationValue}>{getLocation()}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleOpenMaps} style={styles.mapButton}>
                <Ionicons name="open-outline" size={16} color={colors.light.accent} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Year Groups Card */}
          <View style={styles.card}>
            <View style={styles.yearGroupsRow}>
              <View style={styles.yearGroupsContent}>
                <View style={styles.locationIcon}>
                  <Ionicons name="people-outline" size={18} color={colors.light.accent} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Target Audience</Text>
                  <Text style={styles.locationValue}>{formatYearGroups(reunion.targetYearGroups)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Event Details Card */}
          {description ? (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="people-outline" size={16} color={colors.light.accent} />
                </View>
                <Text style={styles.sectionTitle}>Event Details</Text>
              </View>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          ) : null}

          {/* RSVP Section - Only for upcoming events */}
          {!isPast ? (
            <View style={styles.card}>
              <Text style={styles.rsvpTitle}>Interested in attending?</Text>

              {/* Current Status */}
              {currentStatus ? (
                <View style={styles.currentStatusRow}>
                  <Text style={styles.currentStatusLabel}>Current status:</Text>
                  <View
                    style={[
                      styles.currentStatusBadge,
                      { backgroundColor: `${getStatusColor()}20` },
                    ]}
                  >
                    <Text style={[styles.currentStatusText, { color: getStatusColor() }]}>
                      {getStatusLabel()}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* RSVP Buttons */}
              <View style={styles.rsvpButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.rsvpButton,
                    currentStatus === 'coming' && styles.rsvpButtonGoing,
                  ]}
                  onPress={() => handleRSVP('coming')}
                  disabled={isRegistering}
                >
                  {isRegistering && currentStatus !== 'coming' ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={currentStatus === 'coming' ? '#ffffff' : '#6b7280'}
                      />
                      <Text
                        style={[
                          styles.rsvpButtonText,
                          { color: currentStatus === 'coming' ? '#ffffff' : '#6b7280' },
                        ]}
                      >
                        I'm Going
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rsvpButton,
                    currentStatus === 'maybe' && styles.rsvpButtonMaybe,
                  ]}
                  onPress={() => handleRSVP('maybe')}
                  disabled={isRegistering}
                >
                  {isRegistering && currentStatus !== 'maybe' ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                  ) : (
                    <>
                      <Ionicons
                        name="help-circle-outline"
                        size={18}
                        color={currentStatus === 'maybe' ? '#ffffff' : '#6b7280'}
                      />
                      <Text
                        style={[
                          styles.rsvpButtonText,
                          { color: currentStatus === 'maybe' ? '#ffffff' : '#6b7280' },
                        ]}
                      >
                        Maybe
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rsvpButton,
                    currentStatus === 'not_coming' && styles.rsvpButtonNotComing,
                  ]}
                  onPress={() => handleRSVP('not_coming')}
                  disabled={isRegistering}
                >
                  {isRegistering && currentStatus !== 'not_coming' ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                  ) : (
                    <>
                      <Ionicons
                        name="close"
                        size={18}
                        color={currentStatus === 'not_coming' ? '#ffffff' : '#6b7280'}
                      />
                      <Text
                        style={[
                          styles.rsvpButtonText,
                          { color: currentStatus === 'not_coming' ? '#ffffff' : '#6b7280' },
                        ]}
                      >
                        Can't Come
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Past Event Notice */}
          {isPast ? (
            <View style={styles.pastEventCard}>
              <Text style={styles.pastEventText}>
                This event has already taken place.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
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
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  locationValue: {
    color: '#1a1f2c',
    fontSize: 15,
    fontWeight: '500',
  },
  mapButton: {
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  yearGroupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearGroupsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#1a1f2c',
    fontSize: 16,
    fontWeight: '700',
  },
  descriptionText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 22,
  },
  rsvpTitle: {
    color: '#1a1f2c',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  currentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  currentStatusLabel: {
    color: '#6b7280',
    fontSize: 13,
  },
  currentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rsvpButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  rsvpButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  rsvpButtonGoing: {
    backgroundColor: colors.light.success,
  },
  rsvpButtonMaybe: {
    backgroundColor: colors.light.warning,
  },
  rsvpButtonNotComing: {
    backgroundColor: colors.light.destructive,
  },
  pastEventCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pastEventText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ReunionDetailDialog;
