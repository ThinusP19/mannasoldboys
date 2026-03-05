import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Crown,
  Users,
  BookOpen,
  Flower2,
  Calendar,
  Heart,
  Star,
  ChevronRight,
} from '@tamagui/lucide-icons';

import { brandColors, colors } from '../theme';

interface MembershipGateProps {
  isMember: boolean | undefined;
  pageTitle: string;
  pageDescription: string;
  children: React.ReactNode;
}

const benefits = [
  {
    icon: Users,
    text: 'Full alumni directory access',
    color: colors.light.accent,
  },
  {
    icon: BookOpen,
    text: 'Stories and memories',
    color: '#22c55e',
  },
  {
    icon: Flower2,
    text: 'In Memoriam section',
    color: '#ec4899',
  },
  {
    icon: Calendar,
    text: 'Reunion events and RSVP',
    color: '#8b5cf6',
  },
  {
    icon: Heart,
    text: 'Give back to school projects',
    color: '#f59e0b',
  },
  {
    icon: Star,
    text: 'Exclusive year group features',
    color: brandColors.potchGimNavy,
  },
];

export function MembershipGate({
  isMember,
  pageTitle,
  pageDescription,
  children,
}: MembershipGateProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // If member, render children normally
  if (isMember) {
    return <>{children}</>;
  }

  // Non-member: show membership promotion
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 20, paddingBottom: 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo/Crest */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/school-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Page Title */}
      <Text style={styles.pageTitle}>{pageTitle}</Text>

      {/* Lock Icon Badge */}
      <View style={styles.lockBadge}>
        <Crown size={20} color="#f59e0b" />
        <Text style={styles.lockBadgeText}>Members Only</Text>
      </View>

      {/* Description Card */}
      <View style={styles.card}>
        <Text style={styles.description}>{pageDescription}</Text>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Membership Benefits</Text>
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <View key={index} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: `${benefit.color}15` }]}>
                  <IconComponent size={16} color={benefit.color} />
                </View>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            );
          })}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/(stack)/membership')}
          activeOpacity={0.8}
        >
          <Crown size={18} color="#ffffff" />
          <Text style={styles.ctaButtonText}>Become a Member</Text>
          <ChevronRight size={18} color="#ffffff" />
        </TouchableOpacity>

        {/* Note */}
        <Text style={styles.note}>
          Join our alumni community and unlock full access to all features.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: brandColors.potchGimNavy,
    textAlign: 'center',
    marginBottom: 12,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
  },
  lockBadgeText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f2c',
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  ctaButton: {
    backgroundColor: brandColors.potchGimNavy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default MembershipGate;
