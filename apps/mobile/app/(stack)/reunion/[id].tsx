import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Spinner,
  H2,
  Paragraph,
} from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Check, X, HelpCircle, Users } from '@tamagui/lucide-icons';
import { format } from 'date-fns';

import { reunionsApi } from '../../../src/services';
import { colors, brandColors } from '../../../src/theme';

export default function ReunionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: reunion, isLoading } = useQuery({
    queryKey: ['reunion', id],
    queryFn: () => reunionsApi.getById(id),
    enabled: !!id,
  });

  const { data: registrationData } = useQuery({
    queryKey: ['reunionRegistration', id],
    queryFn: () => reunionsApi.checkRegistration(id),
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: (status: 'coming' | 'maybe' | 'not_coming') =>
      reunionsApi.register(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunion', id] });
      queryClient.invalidateQueries({ queryKey: ['reunionRegistration', id] });
      queryClient.invalidateQueries({ queryKey: ['reunions'] });
    },
  });

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color={brandColors.potchGimNavy} />
        <Text marginTop="$4" color="$mutedForeground">Loading reunion...</Text>
      </YStack>
    );
  }

  if (!reunion) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background" padding="$4">
        <Calendar size={64} color={colors.light.mutedForeground} />
        <Text color="$mutedForeground" marginTop="$4" textAlign="center">
          Reunion not found
        </Text>
      </YStack>
    );
  }

  const reunionDate = new Date(reunion.date);
  const isPast = reunionDate < new Date();
  const currentStatus = registrationData?.registration?.status;
  const isRegistering = registerMutation.isPending;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.light.background }}>
      <YStack padding="$4" gap="$4">
        {/* Header Card */}
        <Card elevate bordered padding="$4" backgroundColor="$card">
          <H2 color="$color" marginBottom="$3">{reunion.title}</H2>

          <YStack gap="$3">
            <XStack gap="$3" alignItems="center">
              <YStack
                width={40}
                height={40}
                borderRadius={8}
                backgroundColor="$muted"
                alignItems="center"
                justifyContent="center"
              >
                <Calendar size={20} color={brandColors.potchGimNavy} />
              </YStack>
              <YStack>
                <Text color="$mutedForeground" fontSize={12}>Date</Text>
                <Text color="$color" fontSize={16} fontWeight="500">
                  {format(reunionDate, 'EEEE, MMMM d, yyyy')}
                </Text>
                <Text color="$mutedForeground" fontSize={14}>
                  {format(reunionDate, 'h:mm a')}
                </Text>
              </YStack>
            </XStack>

            <XStack gap="$3" alignItems="center">
              <YStack
                width={40}
                height={40}
                borderRadius={8}
                backgroundColor="$muted"
                alignItems="center"
                justifyContent="center"
              >
                <MapPin size={20} color={brandColors.potchGimNavy} />
              </YStack>
              <YStack flex={1}>
                <Text color="$mutedForeground" fontSize={12}>Location</Text>
                <Text color="$color" fontSize={16} fontWeight="500">
                  {reunion.location}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Description */}
        {reunion.description && (
          <Card elevate bordered padding="$4" backgroundColor="$card">
            <Text color="$color" fontWeight="600" fontSize={18} marginBottom="$2">
              About This Reunion
            </Text>
            <Paragraph color="$color">{reunion.description}</Paragraph>
          </Card>
        )}

        {/* Target Year Groups */}
        {reunion.targetYearGroups && reunion.targetYearGroups.length > 0 && (
          <Card elevate bordered padding="$4" backgroundColor="$card">
            <XStack gap="$2" alignItems="center" marginBottom="$3">
              <Users size={18} color={brandColors.potchGimNavy} />
              <Text color="$color" fontWeight="600" fontSize={18}>
                For Year Groups
              </Text>
            </XStack>
            <XStack flexWrap="wrap" gap="$2">
              {reunion.targetYearGroups.map((year: number) => (
                <YStack
                  key={year}
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  backgroundColor="$muted"
                  borderRadius="$4"
                >
                  <Text color="$color" fontSize={14}>Class of {year}</Text>
                </YStack>
              ))}
            </XStack>
          </Card>
        )}

        {/* Registration */}
        {!isPast && (
          <Card elevate bordered padding="$4" backgroundColor="$card">
            <Text color="$color" fontWeight="600" fontSize={18} marginBottom="$3">
              Will you attend?
            </Text>

            {currentStatus && (
              <YStack
                backgroundColor={
                  currentStatus === 'coming' ? colors.light.success :
                  currentStatus === 'maybe' ? colors.light.warning :
                  colors.light.destructive
                }
                padding="$3"
                borderRadius="$3"
                marginBottom="$3"
              >
                <Text color="white" textAlign="center" fontWeight="600">
                  You responded: {currentStatus === 'coming' ? 'Yes, I\'m coming!' : currentStatus === 'maybe' ? 'Maybe' : 'Not coming'}
                </Text>
              </YStack>
            )}

            <XStack gap="$2">
              <Button
                flex={1}
                size="$4"
                backgroundColor={currentStatus === 'coming' ? colors.light.success : '$muted'}
                onPress={() => registerMutation.mutate('coming')}
                disabled={isRegistering}
              >
                <Check size={18} color={currentStatus === 'coming' ? 'white' : colors.light.success} />
                <Text color={currentStatus === 'coming' ? 'white' : '$color'} marginLeft="$1">
                  Yes
                </Text>
              </Button>
              <Button
                flex={1}
                size="$4"
                backgroundColor={currentStatus === 'maybe' ? colors.light.warning : '$muted'}
                onPress={() => registerMutation.mutate('maybe')}
                disabled={isRegistering}
              >
                <HelpCircle size={18} color={currentStatus === 'maybe' ? 'white' : colors.light.warning} />
                <Text color={currentStatus === 'maybe' ? 'white' : '$color'} marginLeft="$1">
                  Maybe
                </Text>
              </Button>
              <Button
                flex={1}
                size="$4"
                backgroundColor={currentStatus === 'not_coming' ? colors.light.destructive : '$muted'}
                onPress={() => registerMutation.mutate('not_coming')}
                disabled={isRegistering}
              >
                <X size={18} color={currentStatus === 'not_coming' ? 'white' : colors.light.destructive} />
                <Text color={currentStatus === 'not_coming' ? 'white' : '$color'} marginLeft="$1">
                  No
                </Text>
              </Button>
            </XStack>
          </Card>
        )}

        {isPast && (
          <Card elevate bordered padding="$4" backgroundColor="$muted">
            <Text color="$mutedForeground" textAlign="center">
              This reunion has already passed.
            </Text>
          </Card>
        )}
      </YStack>
    </ScrollView>
  );
}
