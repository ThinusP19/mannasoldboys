import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, StyleSheet, Alert, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  ScrollView,
  Spinner,
} from 'tamagui';
import { Mail, Lock, Shield, ArrowLeft, Eye, EyeOff } from '@tamagui/lucide-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../../src/services';
import { setAdminToken, setAdminJustLoggedIn } from '../../src/services/adminApi';

// White card style for admin login (different from regular login)
const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 8,
  elevation: 2,
};

export default function AdminLoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      setError(t('errors.invalid_email'));
      return;
    }
    if (!password) {
      setError(t('validation.required'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.adminLogin(email, password);

      // Check if user is an admin
      if (!response?.user || response.user.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        setIsLoading(false);
        return;
      }

      // Store admin session separately
      // Use SecureStore via setAdminToken for the token (proper secure storage)
      console.log('[AdminLogin] Login successful, storing token...');
      await setAdminToken(response.token);
      await AsyncStorage.setItem('adminUser', JSON.stringify(response.user));
      await AsyncStorage.setItem('isAdminAuthenticated', 'true');

      // Set in-memory flag to skip verification on fresh login (more reliable than AsyncStorage)
      setAdminJustLoggedIn(true);
      console.log('[AdminLogin] Navigating to admin portal...');

      // Navigate to admin portal
      router.replace('/(admin)');
    } catch (err: any) {
      const errorMessage = err?.error || err?.details || t('errors.login_failed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f0e8' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack flex={1} padding="$4" justifyContent="center">
            {/* White Card Container */}
            <YStack {...cardStyle} padding="$5">
              {/* Header with Shield Icon */}
              <YStack alignItems="center" marginBottom="$5">
                <View style={styles.iconContainer}>
                  <Shield size={32} color="#d4a84b" />
                </View>
                <Text fontSize={24} fontWeight="bold" color="#1a1f2c" textAlign="center" marginTop="$3">
                  {t('auth.admin_login')}
                </Text>
                <Text color="#6b7280" textAlign="center" marginTop="$2" fontSize={14}>
                  {t('auth.admin_sign_in')}
                </Text>
              </YStack>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text color="#dc2626" textAlign="center" fontSize={14}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Form */}
              <YStack gap="$4">
                {/* Email Input */}
                <YStack gap="$2">
                  <Text color="#1a1f2c" fontWeight="500" fontSize={14}>
                    {t('auth.email')}
                  </Text>
                  <XStack
                    backgroundColor="#ffffff"
                    borderWidth={1}
                    borderColor="#e5e7eb"
                    borderRadius={8}
                    alignItems="center"
                    paddingHorizontal="$3"
                    height={48}
                  >
                    <Mail size={20} color="#9ca3af" />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 16,
                        paddingLeft: 8,
                        color: '#000000',
                      }}
                      placeholder={t('auth.email_placeholder')}
                      placeholderTextColor="#000000"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </XStack>
                </YStack>

                {/* Password Input */}
                <YStack gap="$2">
                  <Text color="#1a1f2c" fontWeight="500" fontSize={14}>
                    {t('auth.password')}
                  </Text>
                  <XStack
                    backgroundColor="#ffffff"
                    borderWidth={1}
                    borderColor="#e5e7eb"
                    borderRadius={8}
                    alignItems="center"
                    paddingHorizontal="$3"
                    height={48}
                  >
                    <Lock size={20} color="#9ca3af" />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 16,
                        paddingLeft: 8,
                        color: '#000000',
                      }}
                      placeholder={t('auth.password_placeholder')}
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <Button
                      chromeless
                      padding="$2"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9ca3af" />
                      ) : (
                        <Eye size={20} color="#9ca3af" />
                      )}
                    </Button>
                  </XStack>
                </YStack>

                {/* Login Button */}
                <Button
                  backgroundColor="#000000"
                  height={48}
                  borderRadius={8}
                  pressStyle={{ opacity: 0.9 }}
                  disabled={isLoading}
                  onPress={handleLogin}
                  marginTop="$2"
                >
                  {isLoading ? (
                    <XStack gap="$2" alignItems="center">
                      <Spinner color="white" size="small" />
                      <Text color="white">{t('auth.signing_in')}</Text>
                    </XStack>
                  ) : (
                    <Text color="white" fontWeight="600" fontSize={16}>
                      {t('auth.sign_in')}
                    </Text>
                  )}
                </Button>

                {/* Back to Login Link */}
                <Link href="/(auth)/login" asChild>
                  <Button
                    chromeless
                    marginTop="$2"
                  >
                    <XStack alignItems="center" gap="$2">
                      <ArrowLeft size={16} color="#6b7280" />
                      <Text color="#6b7280" fontSize={14}>{t('auth.back_to_login')}</Text>
                    </XStack>
                  </Button>
                </Link>
              </YStack>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
});
