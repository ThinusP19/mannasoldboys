import { useState } from 'react';
import {
  RefreshControl,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { reunionsApi } from '../../src/services';
import { useAuth } from '../../src/contexts';
import { colors, brandColors } from '../../src/theme';
import ReunionDetailDialog from '../../src/components/ReunionDetailDialog';
import { MembershipGate } from '../../src/components/MembershipGate';

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
    return `For Class of ${years.join(', ')}`;
  } catch {
    return 'Open to All Alumni';
  }
};

export default function ReunionsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { data: reunions, isLoading, refetch } = useQuery({
    queryKey: ['reunions'],
    queryFn: () => reunionsApi.getAll(),
  });

  const registerMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'coming' | 'maybe' | 'not_coming' }) =>
      reunionsApi.register(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunions'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleReunionPress = (reunion: Reunion) => {
    setSelectedReunion(reunion);
    setShowDetailDialog(true);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brandColors.potchGimNavy} />
        <Text style={styles.loadingText}>{t('reunion.loading')}</Text>
      </View>
    );
  }

  // Sort reunions by date (upcoming first), filtering out entries without valid dates
  const sortedReunions = [...(reunions || [])]
    .filter((r: any) => r && r.date)
    .sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  // Separate upcoming and past reunions
  const now = new Date();
  const upcomingReunions = sortedReunions.filter((r: any) => new Date(r.date) >= now);
  const pastReunions = sortedReunions
    .filter((r: any) => new Date(r.date) < now)
    .reverse();

  const ReunionCard = ({ reunion, isPast }: { reunion: Reunion; isPast: boolean }) => {
    // Guard against invalid reunion data
    if (!reunion || typeof reunion !== 'object') return null;
    if (!reunion.date) return null;

    const reunionDate = new Date(reunion.date);
    if (isNaN(reunionDate.getTime())) return null;

    const currentStatus = reunion.userRegistration?.status;

    // Safely get string values
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
        return format(reunionDate, 'EEEE, MMMM d, yyyy');
      } catch {
        return 'Unknown date';
      }
    };

    const description = getDescription();

    return (
      <TouchableOpacity
        onPress={() => handleReunionPress(reunion)}
        activeOpacity={0.8}
        style={{ opacity: isPast ? 0.75 : 1 }}
      >
        <View style={styles.card}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {getTitle()}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isPast ? '#6b7280' : colors.light.success },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {isPast ? t('reunion.past') : t('reunion.upcoming')}
              </Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.metaRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={16} color={colors.light.accent} />
            </View>
            <Text style={styles.metaText}>{getDateString()}</Text>
          </View>

          {/* Location */}
          <View style={styles.metaRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={16} color={colors.light.accent} />
            </View>
            <Text style={styles.metaText} numberOfLines={1}>
              {getLocation()}
            </Text>
          </View>

          {/* Description */}
          {description ? (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {description}
            </Text>
          ) : null}

          {/* Year Groups */}
          <View style={styles.yearGroupRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="people-outline" size={16} color={colors.light.accent} />
            </View>
            <Text style={styles.yearGroupText}>
              {formatYearGroups((reunion as any).targetYearGroups)}
            </Text>
          </View>

          {/* RSVP Status Indicator */}
          {!isPast && currentStatus ? (
            <View style={styles.rsvpRow}>
              <Text style={styles.rsvpLabel}>{t('reunion.rsvp')}:</Text>
              <View
                style={[
                  styles.rsvpStatusBadge,
                  {
                    backgroundColor:
                      currentStatus === 'coming'
                        ? `${colors.light.success}20`
                        : currentStatus === 'maybe'
                        ? `${colors.light.warning}20`
                        : `${colors.light.destructive}20`,
                  },
                ]}
              >
                {currentStatus === 'coming' && <Ionicons name="checkmark" size={12} color={colors.light.success} />}
                {currentStatus === 'maybe' && <Ionicons name="help-circle-outline" size={12} color={colors.light.warning} />}
                {currentStatus === 'not_coming' && <Ionicons name="close" size={12} color={colors.light.destructive} />}
                <Text
                  style={[
                    styles.rsvpStatusText,
                    {
                      color:
                        currentStatus === 'coming'
                          ? colors.light.success
                          : currentStatus === 'maybe'
                          ? colors.light.warning
                          : colors.light.destructive,
                    },
                  ]}
                >
                  {currentStatus === 'coming'
                    ? t('reunion.coming')
                    : currentStatus === 'maybe'
                    ? t('reunion.maybe')
                    : t('reunion.not_coming')}
                </Text>
              </View>
            </View>
          ) : null}

          {/* View Details Button */}
          <TouchableOpacity
            style={[
              styles.viewDetailsButton,
              isPast && { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
            ]}
            onPress={() => handleReunionPress(reunion)}
          >
            <Text
              style={[
                styles.viewDetailsText,
                { color: isPast ? '#6b7280' : colors.light.accent },
              ]}
            >
              {isPast ? t('reunion.view_details') : `${t('reunion.view_details')} & ${t('reunion.rsvp')}`}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={isPast ? '#6b7280' : colors.light.accent} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <MembershipGate
      isMember={user?.isMember}
      pageTitle={t('reunion.title')}
      pageDescription="Stay connected with your graduating class through reunion events. RSVP to upcoming gatherings, view event details, and celebrate your shared memories with fellow alumni."
    >
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingTop: insets.top + 16,
            paddingBottom: 100,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('reunion.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {upcomingReunions.length > 0
                ? `${upcomingReunions.length} ${t('reunion.upcoming').toLowerCase()} ${upcomingReunions.length === 1 ? 'event' : 'events'}`
                : 'View all past and upcoming reunions'}
            </Text>
          </View>

          {/* Empty State */}
          {sortedReunions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>{t('reunion.no_upcoming')}</Text>
              <Text style={styles.emptySubtitle}>Check back later for upcoming events!</Text>
            </View>
          ) : null}

          {/* Upcoming Reunions Section */}
          {upcomingReunions.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{t('reunion.upcoming')} {t('reunion.title')}</Text>
                <View style={styles.sectionCount}>
                  <Text style={[styles.sectionCountText, { color: colors.light.accent }]}>
                    {upcomingReunions.length}
                  </Text>
                </View>
              </View>
              {upcomingReunions.map((reunion: Reunion, index: number) => (
                <ReunionCard
                  key={reunion?.id ? String(reunion.id) : `upcoming-${index}`}
                  reunion={reunion}
                  isPast={false}
                />
              ))}
            </View>
          ) : null}

          {/* Past Reunions Section */}
          {pastReunions.length > 0 ? (
            <View style={[styles.section, { opacity: 0.75 }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: '#9ca3af' }]} />
                <Text style={[styles.sectionTitle, { color: '#6b7280' }]}>{t('reunion.past')}</Text>
                <View style={[styles.sectionCount, { backgroundColor: '#f3f4f6' }]}>
                  <Text style={[styles.sectionCountText, { color: '#6b7280' }]}>
                    {pastReunions.length}
                  </Text>
                </View>
              </View>
              {pastReunions.map((reunion: Reunion, index: number) => (
                <ReunionCard
                  key={reunion?.id ? String(reunion.id) : `past-${index}`}
                  reunion={reunion}
                  isPast={true}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Reunion Detail Dialog */}
        <ReunionDetailDialog
          visible={showDetailDialog}
          reunion={selectedReunion}
          onClose={() => {
            setShowDetailDialog(false);
            setSelectedReunion(null);
          }}
        />
      </View>
    </MembershipGate>
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
    marginTop: 16,
    color: '#6b7280',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1f2c',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.accent,
  },
  sectionTitle: {
    color: '#1a1f2c',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionCount: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: `${colors.light.accent}15`,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f2c',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    color: '#6b7280',
    fontSize: 14,
    flex: 1,
  },
  descriptionText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  yearGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  yearGroupText: {
    color: '#6b7280',
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  rsvpLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  rsvpStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rsvpStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: `${colors.light.accent}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.light.accent,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
