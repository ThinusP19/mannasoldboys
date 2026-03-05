import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, StyleSheet, Image as RNImage, TouchableOpacity, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  ScrollView,
  Spinner,

  TextArea,
} from 'tamagui';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, X, Upload, Phone } from '@tamagui/lucide-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../src/contexts';
import { brandColors } from '../../src/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const schoolLogo = require('../../assets/images/school-logo.png');

// Placeholder color - cast to satisfy Tamagui's ColorTokens type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const placeholderColor: any = "#6b7280";

// Dark card style matching web app
const cardStyle = {
  backgroundColor: '#000000',
  borderRadius: 12,
};

// Password validation - MUST match server requirements
const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 12;  // Server requires 12
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);  // Server only allows these

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  };
};

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <XStack justifyContent="center" alignItems="center" gap="$1" marginBottom="$4">
      {[0, 1, 2, 3].map((step) => (
        <XStack key={step} alignItems="center">
          <View
            style={[
              styles.stepCircle,
              currentStep === step && styles.stepCircleActive,
              currentStep > step && styles.stepCircleCompleted,
            ]}
          >
            <Text
              color={currentStep >= step ? 'white' : '#9ca3af'}
              fontSize={14}
              fontWeight="600"
            >
              {step + 1}
            </Text>
          </View>
          {step < 3 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive,
              ]}
            />
          )}
        </XStack>
      ))}
    </XStack>
  );
}

// Validation indicator component
function ValidationIndicator({ valid, text }: { valid: boolean; text: string }) {
  return (
    <XStack alignItems="center" gap="$2">
      {valid ? (
        <Check size={12} color="#4ade80" />
      ) : (
        <X size={12} color="#f87171" />
      )}
      <Text fontSize={12} color={valid ? '#4ade80' : '#f87171'}>
        {text}
      </Text>
    </XStack>
  );
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 0: Account info
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 1: Profile info
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [contactPermission, setContactPermission] = useState<'all' | 'year-group' | 'none'>('all');

  // Step 2: Photos
  const [thenPhoto, setThenPhoto] = useState<string | null>(null);
  const [nowPhoto, setNowPhoto] = useState<string | null>(null);

  // Step 3: Social links
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const passwordValidation = validatePassword(password);

  const canProceedStep0 = () => {
    if (!email || !email.includes('@')) return false;
    if (!name.trim()) return false;
    if (!surname.trim()) return false;
    if (!passwordValidation.isValid) return false;
    if (password !== confirmPassword) return false;
    if (!mobile || !/^0[0-9]{9}$/.test(mobile.replace(/\s+/g, ''))) return false;
    return true;
  };

  const pickImage = async (type: 'then' | 'now') => {
    try {
      setError(''); // Clear any previous errors

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,  // Returns base64 directly - more reliable than FileSystem
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        if (!asset.base64) {
          setError('Failed to process image. Please try again.');
          return;
        }

        // Determine mime type from URI or default to jpeg
        const uri = asset.uri || '';
        const extension = uri.split('.').pop()?.toLowerCase();
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        const base64WithPrefix = `data:${mimeType};base64,${asset.base64}`;

        if (type === 'then') {
          setThenPhoto(base64WithPrefix);
        } else {
          setNowPhoto(base64WithPrefix);
        }
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to access photo library. Please check permissions.');
    }
  };

  const handleNext = async () => {
    setError('');

    if (step === 0) {
      if (!canProceedStep0()) {
        setError('Please fill in all required fields correctly');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!year || parseInt(year) < 1940 || parseInt(year) > 2026) {
        setError('Please select a valid graduation year');
        return;
      }
      if (!bio.trim() || bio.length < 10) {
        setError('Please enter a bio (at least 10 characters)');
        return;
      }
      if (bio.length > 200) {
        setError('Bio must be 200 characters or less');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!thenPhoto) {
        setError('Please upload your Then photo (matric year)');
        return;
      }
      if (!nowPhoto) {
        setError('Please upload your Now photo (current)');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Final step - complete registration with all profile data in a single call
      setIsLoading(true);
      try {
        const fullName = `${name} ${surname}`;

        // Send ALL profile data in a single registration call
        // This eliminates the fragile two-step registration process
        await register({
          email,
          password,
          name: fullName,
          year: parseInt(year),
          bio,
          phone: mobile.replace(/\s+/g, ''),
          contactPermission,
          linkedin: linkedin || null,
          instagram: instagram || null,
          facebook: facebook || null,
          thenPhoto,
          nowPhoto,
        });

        router.replace('/(tabs)');
      } catch (err) {
        const error = err as { error?: string };
        setError(error?.error || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 0: return t('auth.step1');
      case 1: return t('auth.step2a');
      case 2: return t('auth.step2b');
      case 3: return t('auth.step2c');
      default: return '';
    }
  };

  const generateYearOptions = () => {
    const years = [];
    for (let y = 2026; y >= 1940; y--) {
      years.push(y);
    }
    return years;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f0e8' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack flex={1} padding="$4" justifyContent="center">
            {/* Dark Card Container */}
            <YStack {...cardStyle} padding="$5">
              {/* Header with Logo */}
              <YStack alignItems="center" marginBottom="$4" paddingBottom="$4" borderBottomWidth={1} borderBottomColor="#1f2937">
                <View style={styles.logoContainer}>
                  <RNImage
                    source={schoolLogo}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>

                {/* Step Indicator */}
                <StepIndicator currentStep={step} />

                <Text fontSize={14} color="#ffffff" textAlign="center">
                  {getStepDescription()}
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

              {/* Step 0: Account Creation */}
              {step === 0 && (
                <YStack gap="$4">
                  {/* Email */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('auth.email')} *</Text>
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
                        placeholderTextColor={placeholderColor}
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

                  {/* Name and Surname */}
                  <XStack gap="$3">
                    <YStack flex={1} gap="$2">
                      <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('auth.name')} *</Text>
                      <XStack
                        backgroundColor="#1a1a1a"
                        borderWidth={1}
                        borderColor="#1f2937"
                        borderRadius={8}
                        alignItems="center"
                        paddingHorizontal="$3"
                        height={48}
                      >
                        <Input
                          flex={1}
                          placeholder={t('auth.name_placeholder')}
                          placeholderTextColor={placeholderColor}
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                          borderWidth={0}
                          backgroundColor="transparent"
                          color="white"
                          fontSize={16}
                        />
                      </XStack>
                    </YStack>
                    <YStack flex={1} gap="$2">
                      <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('auth.surname')} *</Text>
                      <XStack
                        backgroundColor="#1a1a1a"
                        borderWidth={1}
                        borderColor="#1f2937"
                        borderRadius={8}
                        alignItems="center"
                        paddingHorizontal="$3"
                        height={48}
                      >
                        <Input
                          flex={1}
                          placeholder={t('auth.surname_placeholder')}
                          placeholderTextColor={placeholderColor}
                          value={surname}
                          onChangeText={setSurname}
                          autoCapitalize="words"
                          borderWidth={0}
                          backgroundColor="transparent"
                          color="white"
                          fontSize={16}
                        />
                      </XStack>
                    </YStack>
                  </XStack>

                  {/* Password */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('auth.password')} *</Text>
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
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="••••••••"
                        placeholderTextColor={placeholderColor}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete="off"
                        textContentType="oneTimeCode"
                        autoCorrect={false}
                        spellCheck={false}
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
                    {password && (
                      <YStack gap="$1" marginTop="$1">
                        <ValidationIndicator valid={passwordValidation.hasMinLength} text={t('auth.password_req')} />
                        <ValidationIndicator valid={passwordValidation.hasUpperCase} text={t('auth.one_upper')} />
                        <ValidationIndicator valid={passwordValidation.hasLowerCase} text={t('auth.one_lower')} />
                        <ValidationIndicator valid={passwordValidation.hasNumber} text={t('auth.one_number')} />
                        <ValidationIndicator valid={passwordValidation.hasSpecialChar} text={t('auth.one_special')} />
                      </YStack>
                    )}
                  </YStack>

                  {/* Confirm Password */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('auth.retype_password')} *</Text>
                    <XStack
                      backgroundColor="#1a1a1a"
                      borderWidth={1}
                      borderColor={confirmPassword ? (password === confirmPassword ? '#4ade80' : '#f87171') : '#1f2937'}
                      borderRadius={8}
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Lock size={20} color="#6b7280" />
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="••••••••"
                        placeholderTextColor={placeholderColor}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoComplete="off"
                        textContentType="oneTimeCode"
                        autoCorrect={false}
                        spellCheck={false}
                      />
                      <Button
                        chromeless
                        padding="$2"
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} color="#6b7280" />
                        ) : (
                          <Eye size={20} color="#6b7280" />
                        )}
                      </Button>
                    </XStack>
                    {confirmPassword && (
                      <ValidationIndicator
                        valid={password === confirmPassword}
                        text={password === confirmPassword ? t('auth.passwords_match') : t('auth.passwords_mismatch')}
                      />
                    )}
                  </YStack>

                  {/* Mobile */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('auth.mobile_number')} *</Text>
                    <XStack
                      backgroundColor="#1a1a1a"
                      borderWidth={1}
                      borderColor="#1f2937"
                      borderRadius={8}
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Phone size={20} color="#6b7280" />
                      <Input
                        flex={1}
                        placeholder={t('auth.mobile_placeholder')}
                        placeholderTextColor={placeholderColor}
                        value={mobile}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/\D/g, '').slice(0, 10);
                          if (cleaned === '' || cleaned.startsWith('0')) {
                            setMobile(cleaned);
                          }
                        }}
                        keyboardType="phone-pad"
                        borderWidth={0}
                        backgroundColor="transparent"
                        color="white"
                        fontSize={16}
                        paddingLeft="$2"
                      />
                    </XStack>
                    <Text fontSize={12} color="#9ca3af">{t('auth.sa_format')}: 0631234567</Text>
                  </YStack>

                  {/* Continue Button */}
                  <Button
                    backgroundColor={brandColors.potchGimNavy}
                    height={48}
                    borderRadius={8}
                    pressStyle={{ opacity: 0.8 }}
                    disabled={!canProceedStep0()}
                    opacity={canProceedStep0() ? 1 : 0.5}
                    onPress={handleNext}
                    marginTop="$2"
                  >
                    <Text color="white" fontWeight="600" fontSize={16}>
                      {t('auth.continue')}
                    </Text>
                  </Button>

                  {/* Login Link */}
                  <XStack justifyContent="center" marginTop="$2">
                    <Text color="#ffffff" fontSize={14}>{t('auth.have_account')} </Text>
                    <Link href="/(auth)/login" asChild>
                      <Text color="white" fontWeight="600" fontSize={14}>
                        {t('auth.sign_in')}
                      </Text>
                    </Link>
                  </XStack>
                </YStack>
              )}

              {/* Step 1: Profile Info */}
              {step === 1 && (
                <YStack gap="$4">
                  {/* Back Button */}
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={16} color="#ffffff" />
                    <Text color="#ffffff" marginLeft="$2">{t('nav.back')}</Text>
                  </TouchableOpacity>

                  {/* Graduation Year */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.graduation_year')} *</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.yearScrollView}
                    >
                      <XStack gap="$2" paddingVertical="$2">
                        {generateYearOptions().slice(0, 30).map((y) => (
                          <TouchableOpacity
                            key={y}
                            onPress={() => setYear(y.toString())}
                            style={[
                              styles.yearButton,
                              year === y.toString() && styles.yearButtonActive,
                            ]}
                          >
                            <Text color={year === y.toString() ? 'white' : '#d1d5db'} fontSize={14}>
                              {y}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </XStack>
                    </ScrollView>
                    {!year && (
                      <Text fontSize={12} color="#9ca3af">{t('profile.select_year')}</Text>
                    )}
                  </YStack>

                  {/* Bio */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.bio')} * (Max 200 characters)</Text>
                    <TextArea
                      backgroundColor="#1a1a1a"
                      borderWidth={1}
                      borderColor="#1f2937"
                      borderRadius={8}
                      color="white"
                      placeholder={t('profile.bio_placeholder')}
                      placeholderTextColor={placeholderColor}
                      value={bio}
                      onChangeText={(text) => text.length <= 200 && setBio(text)}
                      minHeight={100}
                      padding="$3"
                    />
                    <Text fontSize={12} color="#9ca3af" textAlign="right">
                      {bio.length}/200 characters
                    </Text>
                  </YStack>

                  {/* Contact Permission */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.contact_permission')} *</Text>
                    <YStack gap="$2">
                      {[
                        { value: 'all', label: t('profile.visible_all') },
                        { value: 'year-group', label: t('profile.visible_year') },
                        { value: 'none', label: t('profile.not_visible') },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setContactPermission(option.value as typeof contactPermission)}
                          style={[
                            styles.optionButton,
                            contactPermission === option.value && styles.optionButtonActive,
                          ]}
                        >
                          <Text color={contactPermission === option.value ? 'white' : '#d1d5db'}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </YStack>
                  </YStack>

                  {/* Continue Button */}
                  <Button
                    backgroundColor={brandColors.potchGimNavy}
                    height={48}
                    borderRadius={8}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={handleNext}
                    marginTop="$2"
                  >
                    <Text color="white" fontWeight="600" fontSize={16}>
                      {t('auth.continue')}
                    </Text>
                  </Button>
                </YStack>
              )}

              {/* Step 2: Photos */}
              {step === 2 && (
                <YStack gap="$4">
                  {/* Back Button */}
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={16} color="#ffffff" />
                    <Text color="#ffffff" marginLeft="$2">{t('nav.back')}</Text>
                  </TouchableOpacity>

                  {/* Then Photo */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.then_photo_label')} *</Text>
                    <TouchableOpacity onPress={() => pickImage('then')} style={styles.photoUpload}>
                      {thenPhoto ? (
                        <RNImage source={{ uri: thenPhoto }} style={styles.photoPreview} />
                      ) : (
                        <YStack alignItems="center">
                          <Upload size={24} color="#6b7280" />
                          <Text color="#9ca3af" fontSize={14} marginTop="$2">{t('profile.upload_then')}</Text>
                        </YStack>
                      )}
                    </TouchableOpacity>
                  </YStack>

                  {/* Now Photo */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.now_photo_label')} *</Text>
                    <TouchableOpacity onPress={() => pickImage('now')} style={styles.photoUpload}>
                      {nowPhoto ? (
                        <RNImage source={{ uri: nowPhoto }} style={styles.photoPreview} />
                      ) : (
                        <YStack alignItems="center">
                          <Upload size={24} color="#6b7280" />
                          <Text color="#9ca3af" fontSize={14} marginTop="$2">{t('profile.upload_now')}</Text>
                        </YStack>
                      )}
                    </TouchableOpacity>
                  </YStack>

                  {/* Continue Button */}
                  <Button
                    backgroundColor={brandColors.potchGimNavy}
                    height={48}
                    borderRadius={8}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={handleNext}
                    marginTop="$2"
                  >
                    <Text color="white" fontWeight="600" fontSize={16}>
                      {t('auth.continue')}
                    </Text>
                  </Button>
                </YStack>
              )}

              {/* Step 3: Social Links */}
              {step === 3 && (
                <YStack gap="$4">
                  {/* Back Button */}
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={16} color="#ffffff" />
                    <Text color="#ffffff" marginLeft="$2">{t('nav.back')}</Text>
                  </TouchableOpacity>

                  {/* LinkedIn */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.social_linkedin')} (Optional)</Text>
                    <XStack
                      backgroundColor="#1a1a1a"
                      borderWidth={1}
                      borderColor="#1f2937"
                      borderRadius={8}
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Input
                        flex={1}
                        placeholder="https://linkedin.com/in/yourprofile"
                        placeholderTextColor={placeholderColor}
                        value={linkedin}
                        onChangeText={setLinkedin}
                        autoCapitalize="none"
                        autoCorrect={false}
                        borderWidth={0}
                        backgroundColor="transparent"
                        color="white"
                        fontSize={14}
                      />
                    </XStack>
                  </YStack>

                  {/* Instagram */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.social_insta')} (Optional)</Text>
                    <XStack
                      backgroundColor="#1a1a1a"
                      borderWidth={1}
                      borderColor="#1f2937"
                      borderRadius={8}
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Input
                        flex={1}
                        placeholder="https://instagram.com/yourprofile"
                        placeholderTextColor={placeholderColor}
                        value={instagram}
                        onChangeText={setInstagram}
                        autoCapitalize="none"
                        autoCorrect={false}
                        borderWidth={0}
                        backgroundColor="transparent"
                        color="white"
                        fontSize={14}
                      />
                    </XStack>
                  </YStack>

                  {/* Facebook */}
                  <YStack gap="$2">
                    <Text color="#ffffff" fontWeight="500" fontSize={14}>{t('profile.social_fb')} (Optional)</Text>
                    <XStack
                      backgroundColor="#1a1a1a"
                      borderWidth={1}
                      borderColor="#1f2937"
                      borderRadius={8}
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Input
                        flex={1}
                        placeholder="https://facebook.com/yourprofile"
                        placeholderTextColor={placeholderColor}
                        value={facebook}
                        onChangeText={setFacebook}
                        autoCapitalize="none"
                        autoCorrect={false}
                        borderWidth={0}
                        backgroundColor="transparent"
                        color="white"
                        fontSize={14}
                      />
                    </XStack>
                  </YStack>

                  {/* Complete Registration Button */}
                  <Button
                    backgroundColor={brandColors.potchGimNavy}
                    height={48}
                    borderRadius={8}
                    pressStyle={{ opacity: 0.8 }}
                    disabled={isLoading}
                    onPress={handleNext}
                    marginTop="$2"
                  >
                    {isLoading ? (
                      <XStack gap="$2" alignItems="center">
                        <Spinner color="white" size="small" />
                        <Text color="white">{t('auth.loading')}</Text>
                      </XStack>
                    ) : (
                      <Text color="white" fontWeight="600" fontSize={16}>
                        {t('auth.signup')}
                      </Text>
                    )}
                  </Button>
                </YStack>
              )}
            </YStack>
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
    marginBottom: 16,
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
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#1e3a5f',
  },
  stepCircleCompleted: {
    backgroundColor: 'rgba(30, 58, 95, 0.3)',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#1f2937',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#1e3a5f',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  yearScrollView: {
    maxHeight: 50,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  yearButtonActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  optionButtonActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  photoUpload: {
    aspectRatio: 1,
    width: '85%',
    alignSelf: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#1f2937',
    borderRadius: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  passwordInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingLeft: 8,
    backgroundColor: 'transparent',
  },
});
