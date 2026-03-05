import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, StyleSheet, Image as RNImage, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  ScrollView,
  Spinner,
} from 'tamagui';
import { Mail, Lock, Eye, EyeOff, Shield } from '@tamagui/lucide-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../src/contexts';
import { brandColors } from '../../src/theme';

// Dark card style matching web app
const cardStyle = {
  backgroundColor: '#000000',
  borderRadius: 12,
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.error || 'Login failed. Please try again.');
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
          <YStack flex={1} padding="$4" justifyContent="center" position="relative">
            {/* Dark Card Container */}
            <YStack {...cardStyle} padding="$5">
              {/* Header with Logo */}
              <YStack alignItems="center" marginBottom="$5" paddingBottom="$4" borderBottomWidth={1} borderBottomColor="#1f2937">
                <View style={styles.logoContainer}>
                  <RNImage
                    source={require('../../assets/images/school-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <Text fontSize={16} color="#ffffff" textAlign="center" marginTop="$3">
                  {t('auth.welcome_back')}
                </Text>
              </YStack>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text color="#f87171" textAlign="center" fontSize={14}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Form */}
              <YStack gap="$4">
                {/* Email Input */}
                <YStack gap="$2">
                  <Text color="#ffffff" fontWeight="500" fontSize={14}>
                    {t('auth.email')}
                  </Text>
                  <XStack
                    backgroundColor="#1a1a1a"
                    borderWidth={1}
                    borderColor="#1f2937"
                    borderRadius={8}
                    alignItems="center"
                    paddingHorizontal="$3"
                    height={48}
                  >
                    <Mail size={20} color="#6b7280" />
                    <Input
                      flex={1}
                      placeholder={t('auth.email_placeholder')}
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      borderWidth={0}
                      backgroundColor="transparent"
                      color="white"
                      fontSize={16}
                      paddingLeft="$2"
                    />
                  </XStack>
                </YStack>

                {/* Password Input */}
                <YStack gap="$2">
                  <Text color="#ffffff" fontWeight="500" fontSize={14}>
                    {t('auth.password')}
                  </Text>
                  <XStack
                    backgroundColor="#1a1a1a"
                    borderWidth={1}
                    borderColor="#1f2937"
                    borderRadius={8}
                    alignItems="center"
                    paddingHorizontal="$3"
                    height={48}
                  >
                    <Lock size={20} color="#6b7280" />
                    <Input
                      flex={1}
                      placeholder="••••••••"
                      placeholderTextColor="#6b7280"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      borderWidth={0}
                      backgroundColor="transparent"
                      color="white"
                      fontSize={16}
                      paddingLeft="$2"
                    />
                    <Button
                      chromeless
                      padding="$2"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#6b7280" />
                      ) : (
                        <Eye size={20} color="#6b7280" />
                      )}
                    </Button>
                  </XStack>
                </YStack>

                {/* Forgot Password Links */}
                <XStack justifyContent="space-between">
                  <Link href="/(auth)/forgot-password" asChild>
                    <Text color="#ffffff" fontSize={14}>
                      {t('auth.forgot_details')}
                    </Text>
                  </Link>
                  <Link href="/(auth)/forgot-password" asChild>
                    <Text color="#ffffff" fontSize={14}>
                      {t('auth.forgot_password')}
                    </Text>
                  </Link>
                </XStack>

                {/* Login Button */}
                <Button
                  backgroundColor={brandColors.potchGimNavy}
                  height={48}
                  borderRadius={8}
                  pressStyle={{ opacity: 0.8 }}
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

                {/* Register Link */}
                <XStack justifyContent="center" marginTop="$2">
                  <Text color="#ffffff" fontSize={14}>{t('auth.no_account')} </Text>
                  <Link href="/(auth)/register" asChild>
                    <Text color="white" fontWeight="600" fontSize={14}>
                      {t('auth.signup')}
                    </Text>
                  </Link>
                </XStack>
              </YStack>
            </YStack>

            {/* Admin Login - Subtle button at bottom center */}
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/(auth)/admin-login')}
              activeOpacity={0.7}
            >
              <XStack alignItems="center" gap="$1.5">
                <Shield size={14} color="#9ca3af" />
                <Text color="#9ca3af" fontSize={12} fontWeight="500">
                  {t('auth.admin_login')}
                </Text>
              </XStack>
            </TouchableOpacity>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 72,
    height: 72,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  adminButton: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 20,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
  },
});
