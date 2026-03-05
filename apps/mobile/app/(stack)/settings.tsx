import { useState, useEffect } from 'react';
import { ScrollView, Alert, Switch, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Spinner,
} from 'tamagui';
import {
  Bell,
  Moon,
  Lock,
  Shield,
  Info,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
} from '@tamagui/lucide-icons';
import * as Device from 'expo-device';

import { useAuth } from '../../src/contexts';
import { authApi } from '../../src/services';
import { generalStorage } from '../../src/services/storage';
import { usePushNotifications } from '../../src/hooks';
import { colors, brandColors } from '../../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const {
    isEnabled: notificationsEnabled,
    isLoading: notificationsLoading,
    enableNotifications,
    disableNotifications,
  } = usePushNotifications();

  const [darkMode, setDarkMode] = useState(false);

  const currentLang = i18n.language?.startsWith('af') ? 'af' : 'en';

  const handleLanguageToggle = async () => {
    const newLang = currentLang === 'en' ? 'af' : 'en';
    await i18n.changeLanguage(newLang);
    await generalStorage.setLanguage(newLang);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (!Device.isDevice) {
      Alert.alert(
        'Physical Device Required',
        'Push notifications only work on physical devices, not simulators.'
      );
      return;
    }

    if (value) {
      const success = await enableNotifications();
      if (success) {
        Alert.alert('Notifications Enabled', 'You will now receive push notifications.');
      }
    } else {
      await disableNotifications();
      Alert.alert('Notifications Disabled', 'You will no longer receive push notifications.');
    }
  };

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('errors.passwords_mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), 'New password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Alert.alert(t('common.success'), 'Your password has been changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.error || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const SettingItem = ({ icon: Icon, label, value, onPress, toggle, toggleValue, onToggle, disabled }: any) => (
    <Button
      justifyContent="space-between"
      backgroundColor="transparent"
      pressStyle={{ backgroundColor: '$muted' }}
      height={60}
      paddingHorizontal="$4"
      onPress={onPress}
      disabled={toggle || disabled}
    >
      <XStack gap="$3" alignItems="center">
        <Icon size={20} color={colors.light.mutedForeground} />
        <Text color="$color">{label}</Text>
      </XStack>
      {toggle ? (
        <Switch
          value={toggleValue}
          disabled={disabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.light.muted, true: brandColors.potchGimNavy }}
          thumbColor="#ffffff"
        />
      ) : value ? (
        <Text color="$mutedForeground">{value}</Text>
      ) : (
        <ChevronRight size={20} color={colors.light.mutedForeground} />
      )}
    </Button>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.light.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack padding="$4" gap="$4">
        {/* Notifications */}
        <Card elevate bordered backgroundColor="$card">
          <Text color="$mutedForeground" fontSize={12} fontWeight="600" padding="$3" paddingBottom="$1">
            {t('settings.notifications').toUpperCase()}
          </Text>
          <SettingItem
            icon={Bell}
            label={t('settings.notifications')}
            toggle
            toggleValue={notificationsEnabled}
            onToggle={handleNotificationToggle}
            disabled={notificationsLoading}
          />
        </Card>

        {/* Appearance */}
        <Card elevate bordered backgroundColor="$card">
          <Text color="$mutedForeground" fontSize={12} fontWeight="600" padding="$3" paddingBottom="$1">
            {t('settings.appearance', 'APPEARANCE').toUpperCase()}
          </Text>
          <SettingItem
            icon={Moon}
            label={t('settings.dark_mode', 'Dark Mode')}
            toggle
            toggleValue={darkMode}
            onToggle={(value: boolean) => {
              setDarkMode(value);
              generalStorage.setTheme(value ? 'dark' : 'light');
            }}
          />
        </Card>

        {/* Language */}
        <Card elevate bordered backgroundColor="$card">
          <Text color="$mutedForeground" fontSize={12} fontWeight="600" padding="$3" paddingBottom="$1">
            {t('settings.language', 'LANGUAGE').toUpperCase()}
          </Text>
          <Button
            justifyContent="space-between"
            backgroundColor="transparent"
            pressStyle={{ backgroundColor: '$muted' }}
            height={60}
            paddingHorizontal="$4"
            onPress={handleLanguageToggle}
          >
            <XStack gap="$3" alignItems="center">
              <Globe size={20} color={colors.light.mutedForeground} />
              <Text color="$color">{t('settings.language', 'Language')}</Text>
            </XStack>
            <XStack gap="$2" alignItems="center">
              <Text color="$mutedForeground">{currentLang === 'en' ? 'English' : 'Afrikaans'}</Text>
              <ChevronRight size={20} color={colors.light.mutedForeground} />
            </XStack>
          </Button>
        </Card>

        {/* Security */}
        <Card elevate bordered backgroundColor="$card">
          <Text color="$mutedForeground" fontSize={12} fontWeight="600" padding="$3" paddingBottom="$1">
            {t('settings.security').toUpperCase()}
          </Text>
          <SettingItem
            icon={Lock}
            label={t('profile.update_password').replace('Update', 'Change')}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          />

          {showPasswordSection && (
            <YStack padding="$4" gap="$3" borderTopWidth={1} borderTopColor="$borderColor">
              <YStack gap="$2">
                <Text color="#1a1f2c" fontSize={14} fontWeight="500">{t('profile.current_password')}</Text>
                <XStack
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$3"
                  alignItems="center"
                  paddingRight="$2"
                >
                  <TextInput
                    style={{
                      flex: 1,
                      color: '#000000',
                      fontSize: 16,
                    }}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#000000"
                    secureTextEntry={!showPasswords}
                  />
                  <Button
                    chromeless
                    padding="$2"
                    onPress={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? (
                      <EyeOff size={18} color={colors.light.mutedForeground} />
                    ) : (
                      <Eye size={18} color={colors.light.mutedForeground} />
                    )}
                  </Button>
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Text color="#1a1f2c" fontSize={14} fontWeight="500">{t('profile.new_password')}</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#e0e5eb',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: '#000000',
                    fontSize: 16,
                  }}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#000000"
                  secureTextEntry={!showPasswords}
                />
              </YStack>

              <YStack gap="$2">
                <Text color="#1a1f2c" fontSize={14} fontWeight="500">{t('profile.confirm_password')}</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#e0e5eb',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: '#000000',
                    fontSize: 16,
                  }}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#000000"
                  secureTextEntry={!showPasswords}
                />
              </YStack>

              <Button
                backgroundColor={brandColors.potchGimNavy}
                marginTop="$2"
                onPress={handlePasswordChange}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <Spinner color="white" size="small" />
                ) : (
                  <Text color="white" fontWeight="600">{t('profile.update_password')}</Text>
                )}
              </Button>
            </YStack>
          )}

          <Separator />
          <SettingItem
            icon={Shield}
            label={t('settings.privacy')}
            onPress={() => Alert.alert(t('settings.privacy'), 'Privacy policy will be displayed here.')}
          />
        </Card>

        {/* About */}
        <Card elevate bordered backgroundColor="$card">
          <Text color="$mutedForeground" fontSize={12} fontWeight="600" padding="$3" paddingBottom="$1">
            ABOUT
          </Text>
          <SettingItem
            icon={Info}
            label={t('settings.version')}
            value="1.0.0"
          />
        </Card>

        {/* Account Info */}
        <Card elevate bordered padding="$4" backgroundColor="$card">
          <Text color="$mutedForeground" fontSize={12} marginBottom="$2">
            Signed in as
          </Text>
          <Text color="$color" fontWeight="600">
            {user?.email}
          </Text>
        </Card>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
