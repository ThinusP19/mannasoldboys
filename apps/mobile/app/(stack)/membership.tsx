import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../src/contexts';
import { membershipApi } from '../../src/services';
import { brandColors, colors } from '../../src/theme';

export default function MembershipScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    whatsapp: '',
    monthlyAmount: 75,
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof formData) => membershipApi.submitRequest(data),
    onSuccess: () => {
      Alert.alert(
        t('membership.request_submitted_title'),
        t('membership.request_submitted_message'),
        [{ text: t('common.done'), onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error?.error || t('errors.generic'));
    },
  });

  const handleSubmit = () => {
    // Validate full name (2-100 chars)
    if (!formData.fullName || formData.fullName.length < 2) {
      Alert.alert(t('common.error'), t('validation.full_name_min'));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      Alert.alert(t('common.error'), t('errors.invalid_email'));
      return;
    }

    // Validate phone number (10-20 digits, can include +, spaces, dashes)
    const phoneRegex = /^[+]?[\d\s-]{10,20}$/;
    const phoneDigits = formData.phone.replace(/[\s-]/g, '');
    if (!formData.phone || phoneDigits.length < 10 || !phoneRegex.test(formData.phone)) {
      Alert.alert(t('common.error'), t('validation.phone_min_digits'));
      return;
    }

    // Validate WhatsApp number (REQUIRED by backend)
    const whatsappDigits = formData.whatsapp.replace(/[\s-]/g, '');
    if (!formData.whatsapp || whatsappDigits.length < 10 || !phoneRegex.test(formData.whatsapp)) {
      Alert.alert(t('common.error'), t('validation.whatsapp_min_digits'));
      return;
    }

    // Validate monthly amount (min 75, max 100000)
    if (formData.monthlyAmount < 75) {
      Alert.alert(t('common.error'), t('validation.min_contribution'));
      return;
    }
    if (formData.monthlyAmount > 100000) {
      Alert.alert(t('common.error'), t('validation.max_contribution'));
      return;
    }

    submitMutation.mutate(formData);
  };

  const benefits = [
    t('membership.benefit_stories'),
    t('membership.benefit_memoriam'),
    t('membership.benefit_giveback'),
    t('membership.benefit_events'),
    t('membership.benefit_networking'),
    t('membership.benefit_directory'),
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1f2c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('membership.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            <Ionicons name="ribbon-outline" size={48} color="#f59e0b" />
          </View>
          <Text style={styles.heroTitle}>{t('membership.hero_title')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('membership.hero_subtitle')}
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('membership.benefits_title')}</Text>
          <View style={styles.benefitsList}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('membership.request_form_title')}</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('membership.full_name')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, fullName: value }))}
              placeholder={t('membership.full_name_placeholder')}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('membership.email')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, email: value }))}
              placeholder={t('membership.email_placeholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('membership.phone')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
              placeholder={t('membership.phone_placeholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('membership.whatsapp')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.whatsapp}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, whatsapp: value }))}
              placeholder={t('membership.whatsapp_placeholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('membership.monthly_contribution')}</Text>
            <TextInput
              style={styles.input}
              value={formData.monthlyAmount.toString()}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, monthlyAmount: parseInt(value) || 0 }))
              }
              placeholder="75"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
            <Text style={styles.helperText}>{t('membership.min_amount')}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitMutation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('membership.submit_request')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1f2c',
  },
  content: {
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1f2c',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2c',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    color: '#374151',
    fontSize: 14,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#1a1f2c',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: brandColors.potchGimNavy,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
