import { useState } from 'react';
import { RefreshControl, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Image,
  Spinner,
  H2,
  Button,
} from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Users } from '@tamagui/lucide-icons';
import * as WebBrowser from 'expo-web-browser';

import { yearGroupsApi } from '../../../src/services';
import { colors, brandColors } from '../../../src/theme';

export default function YearGroupDetailScreen() {
  const params = useLocalSearchParams<{ year: string }>();
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const yearNumber = parseInt(yearParam || '', 10);

  const { data: yearGroupData, isLoading: yearGroupLoading, refetch: refetchYearGroup } = useQuery({
    queryKey: ['yearGroup', yearNumber],
    queryFn: () => yearGroupsApi.getByYear(yearNumber),
    enabled: !isNaN(yearNumber),
  });

  const { data: membersData, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['yearGroupMembers', yearNumber],
    queryFn: () => yearGroupsApi.getMembersByYear(yearNumber),
    enabled: !isNaN(yearNumber),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchYearGroup(), refetchMembers()]);
    setRefreshing(false);
  };

  const handleWhatsAppPress = async () => {
    if (yearGroupData?.whatsappLink) {
      await WebBrowser.openBrowserAsync(yearGroupData.whatsappLink);
    }
  };

  const isLoading = yearGroupLoading || membersLoading;

  if (isLoading && !refreshing) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color={brandColors.potchGimNavy} />
        <Text marginTop="$4" color="$mutedForeground">Loading year group...</Text>
      </YStack>
    );
  }

  // Using correct backend field names
  const renderMemberCard = ({ item }: { item: any }) => (
    <Card
      elevate
      bordered
      marginBottom="$3"
      padding="$3"
      backgroundColor="$card"
      pressStyle={{ scale: 0.98 }}
      onPress={() => router.push(`/(stack)/alumni/${item.id}`)}
    >
      <XStack gap="$3" alignItems="center">
        <YStack
          width={50}
          height={50}
          borderRadius={25}
          backgroundColor="$muted"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          {item.nowPhoto ? (
            <Image
              source={{ uri: item.nowPhoto }}
              width={50}
              height={50}
              resizeMode="cover"
            />
          ) : (
            <Text color="$mutedForeground" fontSize={20} fontWeight="bold">
              {item.name?.[0] || '?'}
            </Text>
          )}
        </YStack>
        <YStack flex={1}>
          <Text color="$color" fontWeight="600" fontSize={16}>
            {item.name}
          </Text>
          {item.bio && (
            <Text color="$mutedForeground" fontSize={14} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </YStack>
      </XStack>
    </Card>
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <FlatList
        data={membersData?.members || []}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberCard}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <YStack marginBottom="$4">
            <Card elevate bordered padding="$4" backgroundColor="$card" marginBottom="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <H2 color="$color">Class of {yearNumber}</H2>
                  <Text color="$mutedForeground">
                    {membersData?.totalMembers || 0} members
                  </Text>
                </YStack>
                {yearGroupData?.whatsappLink && (
                  <Button
                    size="$3"
                    backgroundColor={colors.light.success}
                    circular
                    onPress={handleWhatsAppPress}
                  >
                    <MessageCircle size={20} color="white" />
                  </Button>
                )}
              </XStack>

              {yearGroupData?.yearInfo && (
                <Text color="$mutedForeground" marginTop="$3">
                  {yearGroupData.yearInfo}
                </Text>
              )}
            </Card>

            <Text color="$color" fontWeight="600" fontSize={18} marginBottom="$2">
              Members
            </Text>
          </YStack>
        }
        ListEmptyComponent={
          <YStack padding="$4" alignItems="center">
            <Users size={48} color={colors.light.mutedForeground} />
            <Text color="$mutedForeground" marginTop="$4">
              No members found in this year group.
            </Text>
          </YStack>
        }
      />
    </YStack>
  );
}
