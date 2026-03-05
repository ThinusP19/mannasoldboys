import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Image,
  Spinner,
  H2,
  Separator,
} from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Mail,
  GraduationCap,
  Phone,
  Linkedin,
  Instagram,
  Facebook,
} from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';

import { alumniApi, type Profile } from '../../../src/services';
import { colors, brandColors } from '../../../src/theme';
import { getImageUrl } from '../../../src/utils/imageUrl';

export default function AlumniDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: alumni, isLoading, isError } = useQuery<Profile>({
    queryKey: ['alumni', id],
    queryFn: () => alumniApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color={brandColors.potchGimNavy} />
        <Text marginTop="$4" color="$mutedForeground">{t('profile.loading')}</Text>
      </YStack>
    );
  }

  if (!alumni || isError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background" padding="$4">
        <User size={64} color={colors.light.mutedForeground} />
        <Text color="$mutedForeground" marginTop="$4" textAlign="center">
          {t('profile.not_found')}
        </Text>
      </YStack>
    );
  }

  const ProfileField = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <XStack gap="$3" alignItems="flex-start" paddingVertical="$2">
        <Icon size={20} color={colors.light.mutedForeground} />
        <YStack flex={1}>
          <Text color="$mutedForeground" fontSize={12}>{label}</Text>
          <Text color="$color" fontSize={16}>{value}</Text>
        </YStack>
      </XStack>
    );
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <YStack gap="$4">
          {/* Profile Header */}
          <Card elevate bordered padding="$4" backgroundColor="$card">
            <YStack alignItems="center" gap="$3">
              {/* Photos */}
              <XStack gap="$4" justifyContent="center">
                {alumni.thenPhoto && (
                  <YStack alignItems="center">
                    <YStack
                      width={80}
                      height={80}
                      borderRadius={8}
                      overflow="hidden"
                      backgroundColor="$muted"
                    >
                      <Image
                        source={{ uri: getImageUrl(alumni.thenPhoto)! }}
                        width={80}
                        height={80}
                        resizeMode="cover"
                      />
                    </YStack>
                    <Text color="$mutedForeground" fontSize={12} marginTop="$1">{t('profile.then')}</Text>
                  </YStack>
                )}

                <YStack alignItems="center">
                  <YStack
                    width={100}
                    height={100}
                    borderRadius={50}
                    backgroundColor="$muted"
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                  >
                    {alumni.nowPhoto ? (
                      <Image
                        source={{ uri: getImageUrl(alumni.nowPhoto)! }}
                        width={100}
                        height={100}
                        resizeMode="cover"
                      />
                    ) : (
                      <User size={48} color={colors.light.mutedForeground} />
                    )}
                  </YStack>
                  {alumni.thenPhoto && (
                    <Text color="$mutedForeground" fontSize={12} marginTop="$1">{t('profile.now')}</Text>
                  )}
                </YStack>
              </XStack>

              {/* Name */}
              <YStack alignItems="center">
                <H2 color="$color">{alumni.name}</H2>
                {alumni.year && (
                  <XStack
                    marginTop="$2"
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    backgroundColor={brandColors.potchGimNavy}
                    borderRadius="$4"
                  >
                    <Text color="white" fontSize={12} fontWeight="600">
                      {t('profile.class_of', { year: alumni.year })}
                    </Text>
                  </XStack>
                )}
              </YStack>
            </YStack>
          </Card>

          {/* Profile Details */}
          <Card elevate bordered padding="$4" backgroundColor="$card">
            <Text color="$color" fontWeight="600" fontSize={18} marginBottom="$3">
              {t('directory.about')}
            </Text>

            <Separator marginVertical="$2" />

            <YStack gap="$1">
              <ProfileField icon={GraduationCap} label={t('profile.matric_year')} value={alumni.year?.toString()} />
              <ProfileField icon={Phone} label={t('profile.phone')} value={alumni.phone} />
              <ProfileField icon={Mail} label={t('profile.email')} value={alumni.email} />
              <ProfileField icon={Linkedin} label={t('profile.social_linkedin')} value={alumni.linkedin} />
              <ProfileField icon={Instagram} label={t('profile.social_insta')} value={alumni.instagram} />
              <ProfileField icon={Facebook} label={t('profile.social_fb')} value={alumni.facebook} />
            </YStack>
          </Card>

          {/* Bio */}
          {alumni.bio && (
            <Card elevate bordered padding="$4" backgroundColor="$card">
              <Text color="$color" fontWeight="600" fontSize={18} marginBottom="$3">
                {t('profile.bio')}
              </Text>
              <Text color="$color">{alumni.bio}</Text>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
