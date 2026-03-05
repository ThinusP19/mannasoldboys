import { useState, useMemo } from 'react';
import {
  RefreshControl,
  FlatList,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image as RNImage,
  TextInput,
} from 'react-native';
import {
  YStack,
  XStack,
  Text,
  Spinner,
} from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { yearGroupsApi } from '../../src/services';
import { useAuth } from '../../src/contexts';
import { colors, brandColors } from '../../src/theme';
import { YearGroupDetailDialog } from '../../src/components/YearGroupDetailDialog';
import { MembershipGate } from '../../src/components/MembershipGate';
import { getImageUrl } from '../../src/utils/imageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_MARGIN) / 2;

// Card style matching web app
const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 8,
  elevation: 2,
  borderWidth: 0,
};

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showYearGroupDialog, setShowYearGroupDialog] = useState(false);

  const { data: yearGroups, isLoading, refetch } = useQuery({
    queryKey: ['yearGroups'],
    queryFn: () => yearGroupsApi.getAll(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter year groups based on search
  const filteredYearGroups = useMemo(() => {
    if (!yearGroups) return [];
    if (!searchQuery.trim()) return yearGroups;

    const query = searchQuery.toLowerCase();
    return yearGroups.filter((yg: any) => yg.year.toString().includes(query));
  }, [yearGroups, searchQuery]);

  // Sort by year descending (newest first)
  const sortedYearGroups = useMemo(() => {
    return [...filteredYearGroups].sort((a: any, b: any) => b.year - a.year);
  }, [filteredYearGroups]);

  const handleYearGroupPress = (year: number) => {
    setSelectedYear(year);
    setShowYearGroupDialog(true);
  };

  if (isLoading && !refreshing) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="#f5f0e8">
        <Spinner size="large" color={brandColors.potchGimNavy} />
        <Text marginTop="$4" color="#6b7280">
          {t('directory.loading')}
        </Text>
      </YStack>
    );
  }

  const renderYearGroupCard = ({ item, index }: { item: any; index: number }) => {
    const thumbnail =
      item.photos && item.photos.length > 0 ? item.photos[0] : item.groupPhoto;

    const isOdd = index % 2 === 1;

    return (
      <TouchableOpacity
        style={[styles.cardContainer, isOdd && { marginLeft: CARD_MARGIN }]}
        onPress={() => handleYearGroupPress(item.year)}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          {/* Thumbnail Image */}
          {thumbnail ? (
            <RNImage source={{ uri: getImageUrl(thumbnail)! }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderContainer}>
              <Calendar size={32} color="#9ca3af" />
              <Text fontSize={12} color="#9ca3af" marginTop={8}>
                {t('directory.no_photo')}
              </Text>
            </View>
          )}

          {/* Year Label Overlay */}
          <View style={styles.labelOverlay}>
            <Text color="#ffffff" fontSize={14} fontWeight="700">
              {t('profile.class_of', { year: item.year })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <MembershipGate
      isMember={user?.isMember}
      pageTitle={t('directory.title')}
      pageDescription="Access our complete alumni directory to find and connect with fellow graduates from any year. Browse profiles, view photos, and stay connected with the Potch Gim community."
    >
      <YStack flex={1} backgroundColor="#f5f0e8">
        {/* Header */}
        <YStack paddingTop={insets.top + 16} paddingHorizontal={16} paddingBottom={12}>
          <Text fontSize={28} fontWeight="bold" color="#1a1f2c" marginBottom={16}>
            {t('directory.title')}
          </Text>

          {/* Search Bar */}
          <XStack
            borderRadius={10}
            alignItems="center"
            paddingHorizontal={14}
            backgroundColor="white"
            height={48}
            {...cardStyle}
          >
            <Search size={20} color="#9ca3af" />
            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                paddingLeft: 10,
                color: '#000000',
              }}
              placeholder={t('directory.search')}
              placeholderTextColor="#000000"
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardType="number-pad"
            />
          </XStack>
        </YStack>

        {/* Year Groups Grid */}
        <FlatList
          data={sortedYearGroups}
          keyExtractor={(item: any) => item.year.toString()}
          renderItem={renderYearGroupCard}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          ListEmptyComponent={
            <YStack padding={24} alignItems="center">
              <Calendar size={48} color="#9ca3af" />
              <Text color="#6b7280" fontSize={16} marginTop={16} textAlign="center">
                {searchQuery
                  ? t('directory.no_results')
                  : t('directory.no_results')}
              </Text>
            </YStack>
          }
        />

        {/* Year Group Detail Dialog */}
        <YearGroupDetailDialog
          visible={showYearGroupDialog}
          year={selectedYear}
          onClose={() => {
            setShowYearGroupDialog(false);
            setSelectedYear(null);
          }}
        />
      </YStack>
    </MembershipGate>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: CARD_MARGIN,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: CARD_WIDTH,
  },
  placeholderContainer: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
});
