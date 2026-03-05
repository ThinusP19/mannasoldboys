import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  Spinner,
  Label,
} from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';

import { alumniApi, type Profile } from '../../src/services';
import { colors, brandColors } from '../../src/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Using correct backend field names
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => alumniApi.getMyProfile(),
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setYear(profile.year?.toString() || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
      setBio(profile.bio || '');
      setLinkedin(profile.linkedin || '');
      setInstagram(profile.instagram || '');
      setFacebook(profile.facebook || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => alumniApi.createOrUpdateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myUser'] });
      Alert.alert(t('common.success'), 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (err: any) => {
      Alert.alert(t('common.error'), err?.error || 'Failed to update profile.');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Name is required.');
      return;
    }

    const yearNum = parseInt(year, 10);
    if (!year || isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      Alert.alert(t('common.error'), 'Please enter a valid matric year.');
      return;
    }

    updateMutation.mutate({
      name: name.trim(),
      year: yearNum,
      phone: phone.trim() || null,
      email: email.trim() || null,
      bio: bio.trim() || null,
      linkedin: linkedin.trim() || null,
      instagram: instagram.trim() || null,
      facebook: facebook.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color={brandColors.potchGimNavy} />
        <Text marginTop="$4" color="$mutedForeground">{t('common.loading')}</Text>
      </YStack>
    );
  }

  if (isError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background" padding="$4">
        <Text color="$destructive" textAlign="center">
          {(error as any)?.error || 'Failed to load profile'}
        </Text>
        <Button marginTop="$4" onPress={() => router.back()}>
          <Text>{t('common.back')}</Text>
        </Button>
      </YStack>
    );
  }

  const FormField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }: any) => (
    <YStack gap="$2">
      <Label color="#1a1f2c" fontWeight="500">{label}</Label>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#e0e5eb',
          borderRadius: 8,
          paddingHorizontal: 12,
          height: multiline ? 100 : 50,
          color: '#000000',
          fontSize: 16,
          textAlignVertical: multiline ? 'top' : 'center',
          backgroundColor: '#ffffff',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#000000"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </YStack>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <YStack flex={1} backgroundColor="$background">
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack gap="$4">
            <FormField
              label={`${t('auth.name')} *`}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.name_placeholder')}
            />

            <FormField
              label={`${t('profile.graduation_year')} *`}
              value={year}
              onChangeText={setYear}
              placeholder="e.g., 1995"
              keyboardType="number-pad"
            />

            <FormField
              label={t('auth.mobile_number')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('auth.mobile_placeholder')}
              keyboardType="phone-pad"
            />

            <FormField
              label={t('profile.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email_placeholder')}
              keyboardType="email-address"
            />

            <FormField
              label={t('profile.bio')}
              value={bio}
              onChangeText={setBio}
              placeholder={t('profile.bio_placeholder')}
              multiline
            />

            <Text color="$color" fontWeight="600" fontSize={16} marginTop="$2">
              Social Links
            </Text>

            <FormField
              label={t('profile.social_linkedin')}
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder="https://linkedin.com/in/yourprofile"
              keyboardType="url"
            />

            <FormField
              label={t('profile.social_insta')}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="https://instagram.com/yourprofile"
              keyboardType="url"
            />

            <FormField
              label={t('profile.social_fb')}
              value={facebook}
              onChangeText={setFacebook}
              placeholder="https://facebook.com/yourprofile"
              keyboardType="url"
            />
          </YStack>
        </ScrollView>

        {/* Save Button */}
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          padding="$4"
          backgroundColor="$background"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          <Button
            backgroundColor={brandColors.potchGimNavy}
            color="white"
            height={50}
            borderRadius="$3"
            pressStyle={{ opacity: 0.8 }}
            disabled={updateMutation.isPending}
            onPress={handleSave}
          >
            {updateMutation.isPending ? (
              <XStack gap="$2" alignItems="center">
                <Spinner color="white" size="small" />
                <Text color="white">{t('profile.saving')}</Text>
              </XStack>
            ) : (
              <XStack gap="$2" alignItems="center">
                <Save size={20} color="white" />
                <Text color="white" fontWeight="600" fontSize={16}>
                  {t('profile.save_changes')}
                </Text>
              </XStack>
            )}
          </Button>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
