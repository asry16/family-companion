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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LightBackdrop, DarkBackdrop, GlassCard } from '@/components/ui';

export default function OnboardingModal() {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();
  const { profile, members, updateFamilyProfile } = useFamily();
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState(profile?.name || 'My Family');
  const [locationPref, setLocationPref] = useState<'tonight' | 'always'>('tonight');

  const totalSteps = 6;

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    if (step === 2 && familyName.trim() && familyName !== profile?.name) {
      updateFamilyProfile({ name: familyName.trim() });
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {isDark ? <DarkBackdrop /> : <LightBackdrop />}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Progress Bar & Header */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
                },
              ]}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>

            <View
              style={[
                styles.progressContainer,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(124, 92, 224, 0.12)',
                },
              ]}>
              <LinearGradient
                colors={['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBar,
                  { width: `${(step / totalSteps) * 100}%` },
                ]}
              />
            </View>

            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: isDark ? 'rgba(130, 140, 255, 0.14)' : 'rgba(124, 92, 224, 0.10)',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
                },
              ]}>
              <Text style={[styles.stepText, { color: isDark ? '#C7CEEA' : '#4E5375' }]}>
                {step}/{totalSteps}
              </Text>
            </View>
          </View>

          {/* Step Content */}
          <View style={styles.stepBody}>
            <GlassCard
              borderRadius={28}
              style={styles.stepGlassCard}
              contentStyle={styles.cardStep}>
              {step === 1 && (
                <>
                  <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.10)' }]}>
                    <Text style={{ fontSize: 38 }}>❤️</Text>
                  </View>
                  <Text
                    style={[
                      styles.title,
                      { color: colors.text, fontSize: isElderly ? 28 : 24 },
                    ]}>
                    Welcome to Kinly
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: isDark ? colors.textMuted : colors.textSecondary, fontSize: isElderly ? 17 : 14 },
                    ]}>
                    A private, intelligent companion designed for everyday family life.
                    {'\n\n'}
                    "Don't make the family manage the app. Make the app understand the family."
                  </Text>
                </>
              )}

              {step === 2 && (
                <>
                  <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(138, 107, 242, 0.18)' : 'rgba(124, 92, 224, 0.12)' }]}>
                    <Text style={{ fontSize: 36 }}>🏡</Text>
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Name Your Family Circle
                  </Text>
                  <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Give your family space a warm name that everyone recognizes.
                  </Text>
                  <TextInput
                    value={familyName}
                    onChangeText={setFamilyName}
                    placeholder="e.g. The R Family"
                    placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                        borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
                        color: colors.text,
                      },
                    ]}
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(79, 142, 247, 0.18)' : 'rgba(79, 142, 247, 0.12)' }]}>
                    <Text style={{ fontSize: 36 }}>👨‍👩‍👦</Text>
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Family Members
                  </Text>
                  <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    {members.length === 1
                      ? 'Your family space currently has 1 member:'
                      : `Your family space currently has ${members.length} members:`}
                  </Text>
                  <View style={styles.membersReview}>
                    {members.map((m) => (
                      <View
                        key={m.id}
                        style={[
                          styles.memberItem,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(245, 247, 255, 0.85)',
                            borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.14)',
                          },
                        ]}>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        <Text style={[styles.memberItemText, { color: colors.text }]}>
                          {m.name} ({m.relation || (m.isSelf ? 'Self' : 'Member')})
                        </Text>
                      </View>
                    ))}
                  </View>

                  {profile?.username ? (
                    <View
                      style={[
                        styles.pillCard,
                        {
                          backgroundColor: isDark ? 'rgba(138, 107, 242, 0.15)' : 'rgba(124, 92, 224, 0.10)',
                          borderColor: isDark ? 'rgba(138, 107, 242, 0.35)' : 'rgba(124, 92, 224, 0.22)',
                          marginTop: 6,
                        },
                      ]}>
                      <Ionicons name="at-circle-outline" size={20} color={isDark ? '#A594FD' : '#7C5CE0'} />
                      <Text style={[styles.pillCardText, { color: isDark ? colors.textMuted : colors.textSecondary, fontSize: 13 }]}>
                        Family Username: <Text style={{ color: isDark ? '#A594FD' : '#7C5CE0', fontWeight: '800' }}>@{profile.username}</Text>
                      </Text>
                    </View>
                  ) : null}
                </>
              )}

              {step === 4 && (
                <>
                  <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' }]}>
                    <Text style={{ fontSize: 36 }}>🛡️</Text>
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Member Access & Roles
                  </Text>
                  <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Each member can view tasks, calendar, and shared documents. Sensitive medical records require explicit sharing.
                  </Text>
                  <View
                    style={[
                      styles.pillCard,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.22)',
                      },
                    ]}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    <Text style={[styles.pillCardText, { color: colors.text }]}>
                      Family Privacy By Design Enabled
                    </Text>
                  </View>
                </>
              )}

              {step === 5 && (
                <>
                  <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(138, 107, 242, 0.18)' : 'rgba(124, 92, 224, 0.12)' }]}>
                    <Text style={{ fontSize: 36 }}>📍</Text>
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Location Sharing Preference
                  </Text>
                  <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
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
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                            }
                            setLocationPref(opt.id as any);
                          }}
                          style={({ pressed }) => [
                            styles.prefCard,
                            {
                              backgroundColor: isSelected
                                ? (isDark ? 'rgba(138, 107, 242, 0.22)' : 'rgba(124, 92, 224, 0.12)')
                                : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(245, 247, 255, 0.85)'),
                              borderColor: isSelected
                                ? (isDark ? '#8A6BF2' : '#7C5CE0')
                                : (isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.14)'),
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons
                              name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                              size={18}
                              color={isSelected ? (isDark ? '#8A6BF2' : '#7C5CE0') : colors.textMuted}
                            />
                            <Text
                              style={[
                                styles.prefTitle,
                                { color: isSelected ? (isDark ? '#FFFFFF' : '#1E1B4B') : colors.text },
                              ]}>
                              {opt.title}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.prefDesc,
                              { color: isDark ? colors.textMuted : colors.textSecondary, paddingLeft: 26 },
                            ]}>
                            {opt.desc}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {step === 6 && (
                <>
                  <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' }]}>
                    <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    All Set for Your Family!
                  </Text>
                  <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Kinly is ready to understand your family, answer questions, coordinate tasks, and surface proactive suggestions.
                  </Text>
                </>
              )}
            </GlassCard>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepText: {
    fontWeight: '800',
    fontSize: 12,
  },
  stepBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  stepGlassCard: {
    width: '100%',
  },
  cardStep: {
    alignItems: 'center',
    padding: 24,
    gap: 14,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 340,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '600',
    fontSize: 15,
    marginTop: 6,
  },
  membersReview: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    gap: 10,
    marginTop: 6,
  },
  pillCardText: {
    fontWeight: '700',
    fontSize: 13,
  },
  prefCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 4,
  },
  prefTitle: {
    fontWeight: '800',
    fontSize: 14,
  },
  prefDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    paddingTop: 12,
  },
});
