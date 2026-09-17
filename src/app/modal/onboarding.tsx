import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

export default function OnboardingModal() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('The Sharma Family');
  const [locationPref, setLocationPref] = useState<'tonight' | 'always'>('tonight');

  const totalSteps = 6;

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Progress Bar & Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.brandAccent,
                  width: `${(step / totalSteps) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>
            {step}/{totalSteps}
          </Text>
        </View>

        {/* Step Content */}
        <View style={styles.stepBody}>
          {step === 1 && (
            <View style={styles.cardStep}>
              <View style={[styles.heroIcon, { backgroundColor: colors.brandSoft }]}>
                <Text style={{ fontSize: 44 }}>❤️</Text>
              </View>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontSize: isElderly ? 30 : 26 },
                ]}>
                Welcome to Kinly
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textSecondary, fontSize: isElderly ? 18 : 15 },
                ]}>
                A private, intelligent companion designed for everyday family life.
                {'\n\n'}
                "Don't make the family manage the app. Make the app understand the family."
              </Text>
            </View>
          )}

          {step === 2 && (
            <View style={styles.cardStep}>
              <View style={[styles.heroIcon, { backgroundColor: colors.brandSoft }]}>
                <Text style={{ fontSize: 40 }}>🏡</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Name Your Family Circle
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Give your family space a warm name that everyone recognizes.
              </Text>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="e.g. The Sharma Family"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.cardStep}>
              <View style={[styles.heroIcon, { backgroundColor: colors.brandSoft }]}>
                <Text style={{ fontSize: 40 }}>👨‍👩‍👦</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Add Family Members
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                We initialized your space with 5 members:
              </Text>
              <View style={styles.membersReview}>
                {['Dad (Father)', 'Mom (Mother)', 'Aman (Brother)', 'Dadi (Grandmother)'].map((m) => (
                  <View
                    key={m}
                    style={[
                      styles.memberItem,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={[styles.memberItemText, { color: colors.text }]}>
                      {m}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.cardStep}>
              <View style={[styles.heroIcon, { backgroundColor: colors.brandSoft }]}>
                <Text style={{ fontSize: 40 }}>🛡️</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Member Access & Roles
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Each member can view tasks, calendar, and shared documents. Sensitive medical records require explicit sharing.
              </Text>
              <View style={[styles.pillCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.green} />
                <Text style={[styles.pillCardText, { color: colors.text }]}>
                  Family Privacy By Design Enabled
                </Text>
              </View>
            </View>
          )}

          {step === 5 && (
            <View style={styles.cardStep}>
              <View style={[styles.heroIcon, { backgroundColor: colors.brandSoft }]}>
                <Text style={{ fontSize: 40 }}>📍</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Location Sharing Preference
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Location sharing is completely opt-in. Choose how your location is shared:
              </Text>
              <View style={{ gap: 10, width: '100%' }}>
                {[
                  { id: 'tonight', title: 'Share Until Tonight (Recommended)', desc: 'Automatically pauses at midnight.' },
                  { id: 'always', title: 'Always Share with Family', desc: 'Continuous human-readable place status.' },
                ].map((opt) => {
                  const isSelected = locationPref === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setLocationPref(opt.id as any)}
                      style={[
                        styles.prefCard,
                        {
                          backgroundColor: isSelected ? colors.brand : colors.cardBackground,
                          borderColor: isSelected ? colors.brand : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.prefTitle,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}>
                        {opt.title}
                      </Text>
                      <Text
                        style={[
                          styles.prefDesc,
                          { color: isSelected ? '#E2E8F0' : colors.textSecondary },
                        ]}>
                        {opt.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 6 && (
            <View style={styles.cardStep}>
              <View style={[styles.heroIcon, { backgroundColor: colors.greenSoft }]}>
                <Ionicons name="checkmark-circle" size={54} color={colors.green} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                All Set for Your Family!
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Kinly is ready to understand your family, answer questions, coordinate tasks, and surface proactive suggestions.
              </Text>
            </View>
          )}
        </View>

        {/* Footer Navigation Button */}
        <View style={styles.footer}>
          <PrimaryButton
            label={step === totalSteps ? 'Enter Kinly' : 'Continue'}
            onPress={handleNext}
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  stepText: {
    fontWeight: '700',
    fontSize: 13,
  },
  stepBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardStep: {
    alignItems: 'center',
    width: '100%',
    gap: 14,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '600',
    fontSize: 16,
    marginTop: 10,
  },
  membersReview: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  memberItemText: {
    fontWeight: '600',
    fontSize: 14,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
  },
  pillCardText: {
    fontWeight: '700',
    fontSize: 14,
  },
  prefCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  prefTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  prefDesc: {
    fontSize: 12,
  },
  footer: {
    paddingTop: 12,
  },
});
