import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, StyleSheet } from 'react-native';
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
import { Mail, Check } from '@tamagui/lucide-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { authApi } from '../../src/services';
import { brandColors } from '../../src/theme';

// Dark card style matching web app
const cardStyle = {
  backgroundColor: '#000000',
  borderRadius: 12,
};

type Step = 'email' | 'success';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authApi.requestPasswordReset(email);
      setStep('success');
    } catch (err: any) {
      // Even if email not found, show success for security (don't reveal if email exists)
      setStep('success');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <YStack alignItems="center" marginBottom="$5">
        <View style={styles.iconContainer}>
          <Mail size={36} color="white" />
        </View>
        <Text fontSize={24} fontWeight="bold" color="white" textAlign="center">
          {t('auth.forgot_password_title')}
        </Text>
        <Text color="#ffffff" textAlign="center" marginTop="$2">
          {t('auth.forgot_password_desc')}
        </Text>
      </YStack>

      {error ? (
        <View style={styles.errorContainer}>
          <Text color="#f87171" textAlign="center" fontSize={14}>
            {error}
          </Text>
        </View>
      ) : null}

      <YStack gap="$4">
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

        <Button
          backgroundColor={brandColors.potchGimNavy}
          height={48}
          borderRadius={8}
          pressStyle={{ opacity: 0.8 }}
          disabled={isLoading}
          onPress={handleResetPassword}
        >
          {isLoading ? (
            <XStack gap="$2" alignItems="center">
              <Spinner color="white" size="small" />
              <Text color="white">{t('auth.sending')}</Text>
            </XStack>
          ) : (
            <Text color="white" fontWeight="600" fontSize={16}>
              {t('auth.send_reset')}
            </Text>
          )}
        </Button>
      </YStack>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <YStack alignItems="center" marginBottom="$5">
        <View style={[styles.iconContainer, { backgroundColor: '#22c55e' }]}>
          <Check size={40} color="white" />
        </View>
        <Text fontSize={24} fontWeight="bold" color="white" textAlign="center">
          {t('auth.check_email')}
        </Text>
        <Text color="#ffffff" textAlign="center" marginTop="$2">
          {t('auth.reset_email_sent')}
        </Text>
      </YStack>

      <Button
        backgroundColor={brandColors.potchGimNavy}
        height={48}
        borderRadius={8}
        pressStyle={{ opacity: 0.8 }}
        onPress={() => router.replace('/(auth)/login')}
      >
        <Text color="white" fontWeight="600" fontSize={16}>
          {t('auth.back_to_login')}
        </Text>
      </Button>
    </>
  );

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
            {/* Dark Card Container */}
            <YStack {...cardStyle} padding="$5">
              {step === 'email' && renderEmailStep()}
              {step === 'success' && renderSuccessStep()}

              {step === 'email' && (
                <XStack justifyContent="center" marginTop="$4">
                  <Text color="#ffffff" fontSize={14}>Remember your password? </Text>
                  <Link href="/(auth)/login" asChild>
                    <Text color="white" fontWeight="600" fontSize={14}>
                      {t('auth.sign_in')}
                    </Text>
                  </Link>
                </XStack>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
});
