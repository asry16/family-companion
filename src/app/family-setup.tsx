import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  Share,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { apiClient } from '@/services/apiClient';
import { MemberRelation } from '@/types';
import { LightBackdrop, DarkBackdrop } from '@/components/ui';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

const RELATIONS: MemberRelation[] = [
  'Mother',
  'Father',
  'Daughter',
  'Son',
  'Partner',
  'Grandmother',
  'Grandfather',
  'Brother',
  'Sister',
  'Other',
];

function sanitizeUsername(input: string): string {
  return input
    .replace(/^@/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

function generateHandle(name: string, discriminator?: number): string {
  const base = name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/\s+(family|household|circle)$/, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'family';
  const num = discriminator || Math.floor(1000 + Math.random() * 9000);
  return `${base}_${num}`;
}

export default function FamilySetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, completeFamilySetup } = useAuth();
  const { createFamily, joinFamilyByCode } = useFamily();

  // Mode: 'create' | 'join'
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  // Form State - Create
  const [familyName, setFamilyName] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Success Celebration State for Create
  const [createdResult, setCreatedResult] = useState<{
    familyName: string;
    familyUsername: string;
    inviteCode: string;
  } | null>(null);
  const [copiedHandle, setCopiedHandle] = useState(false);

  // Form State - Join
  const [joinInput, setJoinInput] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<MemberRelation>('Other');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Live Lookup Preview for Join
  const [isSearching, setIsSearching] = useState(false);
  const [foundFamily, setFoundFamily] = useState<{
    id: string;
    name: string;
    username: string | null;
    inviteCode: string;
    membersCount: number;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Success Celebration State for Join
  const [joinedResult, setJoinedResult] = useState<{
    familyName: string;
  } | null>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0.9)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation on logo badge
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Auto-redirect if user already has an active family connection
  useEffect(() => {
    let isCancelled = false;
    async function checkExistingFamily() {
      try {
        const res = await apiClient.family.getFamily();
        const famData = (res.data || res) as any;
        const prof = famData?.profile;
        if (!isCancelled && res.success && prof?.name && prof.name !== 'My Family' && prof.id !== 'fam_empty') {
          if (completeFamilySetup) {
            await completeFamilySetup({
              familyId: prof.id,
              familyName: prof.name,
              familyUsername: prof.username,
              familyInviteCode: prof.code,
            });
          }
          router.replace('/(tabs)');
        }
      } catch {}
    }
    checkExistingFamily();
    return () => {
      isCancelled = true;
    };
  }, [completeFamilySetup, router]);

  // Handle Tab Switch
  const handleTabSwitch = (tab: 'create' | 'join') => {
    if (tab === activeTab) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setActiveTab(tab);
    setCreateError(null);
    setJoinError(null);
  };

  // Live Debounced Lookup when typing in Join tab
  useEffect(() => {
    if (activeTab !== 'join') return;
    const clean = joinInput.replace(/^@\s*/, '').trim();
    if (!clean || clean.length < 2) {
      setFoundFamily(null);
      setLookupError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setLookupError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.family.lookupFamily(clean);
        const familyData = res.data?.family || (res as any).family;
        if (res.success && familyData) {
          setFoundFamily(familyData);
          setLookupError(null);
        } else {
          setFoundFamily(null);
          setLookupError(res.error || 'No family found with this username or code.');
        }
      } catch (err: any) {
        setFoundFamily(null);
        setLookupError(err?.message || 'Unable to connect to server. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [joinInput, activeTab]);

  // Handle Create Family
  const handleCreateSubmit = async () => {
    const cleanName = familyName.trim();
    const cleanHandle = familyId.replace(/^@/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanName) {
      setCreateError('Please enter a family name (e.g. "The Robinson Family").');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      }
      return;
    }

    if (!cleanHandle || cleanHandle.length < 3) {
      setCreateError('Please enter a valid Family ID of format @familyid (e.g. @therfamily).');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      }
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await createFamily(cleanName, cleanHandle);
      if (res.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }
        setCreatedResult({
          familyName: res.familyName || cleanName,
          familyUsername: res.familyUsername || cleanHandle,
          inviteCode: res.inviteCode || '',
        });

        Animated.parallel([
          Animated.timing(successOpacityAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(successScaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();

        // Automatically transition to the home dashboard
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 800);
      } else {
        setCreateError(res.error || 'Failed to create family circle. Please try again.');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'An unexpected error occurred.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Join Family
  const handleJoinSubmit = async () => {
    const cleanInput = joinInput.replace(/^@\s*/, '').trim();
    if (!cleanInput) {
      setJoinError('Please enter the family username or invite code.');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      }
      return;
    }

    setJoinLoading(true);
    setJoinError(null);

    try {
      const res = await joinFamilyByCode(cleanInput, selectedRelation);
      if (res.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }
        setJoinedResult({
          familyName: res.familyName || foundFamily?.name || 'Your Family Circle',
        });

        if (completeFamilySetup) {
          await completeFamilySetup({
            familyId: res.familyId || foundFamily?.id || '',
            familyName: res.familyName || foundFamily?.name || 'Your Family Circle',
            familyUsername: (res.familyUsername || foundFamily?.username) || undefined,
            relation: selectedRelation,
          });
        }

        Animated.parallel([
          Animated.timing(successOpacityAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(successScaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();

        // Automatically transition to the home dashboard
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 800);
      } else {
        setJoinError(res.error || 'Failed to join family circle. Please verify the username.');
      }
    } catch (err: any) {
      setJoinError(err.message || 'An error occurred while joining.');
    } finally {
      setJoinLoading(false);
    }
  };

  // Copy Username
  const handleCopyUsername = async (handle: string) => {
    const textToCopy = handle.startsWith('@') ? handle : `@${handle}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(textToCopy);
    }
    setCopiedHandle(true);
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    setTimeout(() => setCopiedHandle(false), 2500);
  };

  // Share Username / Invite
  const handleShare = async (handle: string, familyName: string) => {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    try {
      await Share.share({
        message: `Join our family circle on Kinly! Use our family username "${cleanHandle}" during sign-up to join ${familyName}.`,
      });
    } catch {}
  };

  // Navigate to tabs
  const handleProceedToApp = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Background Decor */}
      {isDark ? <DarkBackdrop /> : <LightBackdrop />}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              {
                paddingTop: Math.max(insets.top + 16, 32),
                paddingBottom: Math.max(insets.bottom + 24, 40),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.cardContainer}>
              {/* Header Branding */}
              <View style={styles.headerGroup}>
                <Animated.View
                  style={[
                    styles.haloCircle,
                    {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.10)',
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}>
                  <Text style={styles.heroEmoji}>
                    {createdResult || joinedResult ? '🎉' : activeTab === 'create' ? '🏡' : '👥'}
                  </Text>
                </Animated.View>

                <Text style={[styles.title, { color: colors.text }]}>
                  {createdResult
                    ? 'Family Space Ready!'
                    : joinedResult
                    ? 'Welcome to the Circle!'
                    : `Welcome, ${user?.name?.split(' ')[0] || 'there'}!`}
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {createdResult
                    ? 'Your private family vault is created with zero presets.'
                    : joinedResult
                    ? 'You have successfully connected to your household.'
                    : 'Set up your private household space or connect with an existing circle.'}
                </Text>
              </View>

              {/* SUCCESS CELEBRATION VIEW - CREATE */}
              {createdResult ? (
                <Animated.View
                  style={[
                    styles.celebrationCard,
                    {
                      backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                      borderColor: isDark ? 'rgba(45, 212, 191, 0.40)' : 'rgba(46, 191, 142, 0.35)',
                      opacity: successOpacityAnim,
                      transform: [{ scale: successScaleAnim }],
                    },
                  ]}>
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={isDark ? '#34D399' : '#2EBF8E'} />
                    <Text style={[styles.successBadgeText, { color: isDark ? '#34D399' : '#2EBF8E' }]}>Household Created</Text>
                  </View>

                  <Text style={[styles.celebrationFamilyName, { color: colors.text }]}>
                    {createdResult.familyName}
                  </Text>

                  {/* Generated Handle Card */}
                  <View
                    style={[
                      styles.handleDisplayCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 92, 224, 0.06)',
                        borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                      },
                    ]}>
                    <Text style={[styles.handleLabel, { color: colors.textSecondary }]}>
                      Family Username for Members to Join:
                    </Text>
                    <Text style={[styles.handleValueText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>
                      @{createdResult.familyUsername}
                    </Text>

                    <View style={styles.handleActionRow}>
                      <Pressable
                        style={[styles.handleActionBtn, { backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0' }]}
                        onPress={() => handleCopyUsername(createdResult.familyUsername)}>
                        <Ionicons
                          name={copiedHandle ? 'checkmark' : 'copy-outline'}
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.handleActionBtnText}>
                          {copiedHandle ? 'Copied!' : 'Copy Username'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.handleActionBtn,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 92, 224, 0.12)',
                            borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.22)',
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() =>
                          handleShare(createdResult.familyUsername, createdResult.familyName)
                        }>
                        <Ionicons
                          name="share-social-outline"
                          size={16}
                          color={isDark ? '#F2F4FF' : '#1F1B6D'}
                        />
                        <Text
                          style={[
                            styles.handleActionBtnText,
                            { color: isDark ? '#F2F4FF' : '#1F1B6D' },
                          ]}>
                          Share Invite
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
                    💡 Share this username with family members. When they sign up, they choose "Join a
                    Family" and enter this username.
                  </Text>

                  <Pressable style={styles.primaryCta} onPress={handleProceedToApp}>
                    <LinearGradient
                      colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.primaryCtaText}>Enter Family Vault</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Pressable>
                </Animated.View>
              ) : joinedResult ? (
                /* SUCCESS CELEBRATION VIEW - JOIN */
                <Animated.View
                  style={[
                    styles.celebrationCard,
                    {
                      backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                      borderColor: isDark ? 'rgba(45, 212, 191, 0.40)' : 'rgba(46, 191, 142, 0.35)',
                      opacity: successOpacityAnim,
                      transform: [{ scale: successScaleAnim }],
                    },
                  ]}>
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={isDark ? '#34D399' : '#2EBF8E'} />
                    <Text style={[styles.successBadgeText, { color: isDark ? '#34D399' : '#2EBF8E' }]}>Connected Successfully</Text>
                  </View>

                  <Text style={[styles.celebrationFamilyName, { color: colors.text }]}>
                    {joinedResult.familyName}
                  </Text>

                  <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
                    You have been linked to this family workspace. All tasks, safe places, and circle
                    updates are now synced with your team.
                  </Text>

                  <Pressable style={styles.primaryCta} onPress={handleProceedToApp}>
                    <LinearGradient
                      colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.primaryCtaText}>Continue to Home</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Pressable>
                </Animated.View>
              ) : (
                /* MAIN FORM: TAB SWITCHER + TABS */
                <View style={styles.formContainer}>
                  {/* Segmented Control */}
                  <View
                    style={[
                      styles.segmentedContainer,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 92, 224, 0.10)',
                        borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                      },
                    ]}>
                    <Pressable
                      style={[
                        styles.segmentButton,
                        activeTab === 'create' && [
                          styles.segmentButtonActive,
                          {
                            backgroundColor: isDark ? 'rgba(20, 27, 74, 0.90)' : '#FFFFFF',
                            shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
                          },
                        ],
                      ]}
                      onPress={() => handleTabSwitch('create')}>
                      <Ionicons
                        name="add-circle"
                        size={18}
                        color={activeTab === 'create' ? (isDark ? '#8B7CF6' : '#7C5CE0') : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentButtonText,
                          {
                            color: activeTab === 'create' ? colors.text : colors.textSecondary,
                            fontWeight: activeTab === 'create' ? '700' : '500',
                          },
                        ]}>
                        Create a Family
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.segmentButton,
                        activeTab === 'join' && [
                          styles.segmentButtonActive,
                          {
                            backgroundColor: isDark ? 'rgba(20, 27, 74, 0.90)' : '#FFFFFF',
                            shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
                          },
                        ],
                      ]}
                      onPress={() => handleTabSwitch('join')}>
                      <Ionicons
                        name="people"
                        size={18}
                        color={activeTab === 'join' ? (isDark ? '#8B7CF6' : '#7C5CE0') : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentButtonText,
                          {
                            color: activeTab === 'join' ? colors.text : colors.textSecondary,
                            fontWeight: activeTab === 'join' ? '700' : '500',
                          },
                        ]}>
                        Join a Family
                      </Text>
                    </Pressable>
                  </View>

                  {/* TAB 1: CREATE A FAMILY */}
                  {activeTab === 'create' ? (
                    <View
                      style={[
                        styles.innerCard,
                        {
                          backgroundColor: isDark ? 'rgba(20, 27, 74, 0.76)' : 'rgba(255, 255, 255, 0.85)',
                          borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.14)',
                        },
                      ]}>
                      <Text style={[styles.cardHeading, { color: colors.text }]}>
                        Create a Family Space
                      </Text>
                      <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                        Set up your private household circle. Enter a family name and choose a unique Family ID.
                      </Text>

                      {/* Family Name Input */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                          Family Name *
                        </Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.70)',
                              borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                            },
                          ]}>
                          <Ionicons name="home-outline" size={20} color={isDark ? '#8B7CF6' : '#7C5CE0'} style={styles.inputIcon} />
                          <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="e.g. The R Family"
                            placeholderTextColor={isDark ? '#7C84C0' : '#A0A3BD'}
                            value={familyName}
                            onChangeText={(val) => {
                              setFamilyName(val);
                              if (createError) setCreateError(null);
                            }}
                            autoFocus={false}
                            maxLength={50}
                          />
                          {familyName.length > 0 && (
                            <Pressable onPress={() => setFamilyName('')} hitSlop={8}>
                              <Ionicons
                                name="close-circle"
                                size={18}
                                color={isDark ? '#7C84C0' : '#A0A3BD'}
                              />
                            </Pressable>
                          )}
                        </View>
                      </View>

                      {/* Family ID Input (Format: @familyid) */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                          Family ID * (format: @familyid)
                        </Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.70)',
                              borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                            },
                          ]}>
                          <Text style={[styles.atSymbolInput, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>@</Text>
                          <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="therfamily"
                            placeholderTextColor={isDark ? '#7C84C0' : '#A0A3BD'}
                            value={familyId.replace(/^@/, '')}
                            onChangeText={(val) => {
                              const sanitized = val.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
                              setFamilyId(sanitized ? `@${sanitized}` : '');
                              if (createError) setCreateError(null);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            maxLength={30}
                          />
                          {familyId.length > 0 && (
                            <Pressable onPress={() => setFamilyId('')} hitSlop={8}>
                              <Ionicons
                                name="close-circle"
                                size={18}
                                color={isDark ? '#7C84C0' : '#A0A3BD'}
                              />
                            </Pressable>
                          )}
                        </View>
                        <Text style={[styles.handleHelperText, { color: colors.textSecondary, marginTop: 6 }]}>
                          Example: @therfamily — other members will use this ID to join your family.
                        </Text>
                      </View>

                      {/* Zero Presets Assurance Note */}
                      <View
                        style={[
                          styles.privacyNote,
                          {
                            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(46, 191, 142, 0.08)',
                            borderColor: isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(46, 191, 142, 0.25)',
                          },
                        ]}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? '#34D399' : '#2EBF8E'} />
                        <Text style={[styles.privacyNoteText, { color: isDark ? '#34D399' : '#059669' }]}>
                          Clean slate: Zero preset members or mock data. Only you will be in this family circle.
                        </Text>
                      </View>

                      {createError && (
                        <View style={styles.errorBanner}>
                          <Ionicons name="alert-circle" size={16} color="#EF4444" />
                          <Text style={styles.errorText}>{createError}</Text>
                        </View>
                      )}

                      {/* Create Button */}
                      <Pressable
                        style={[
                          styles.primaryCta,
                          { opacity: createLoading || !familyName.trim() || !familyId.trim() ? 0.7 : 1 },
                        ]}
                        disabled={createLoading || !familyName.trim() || !familyId.trim()}
                        onPress={handleCreateSubmit}>
                        <LinearGradient
                          colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                        {createLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.primaryCtaText}>Create Family Space</Text>
                            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                          </>
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    /* TAB 2: JOIN AN EXISTING FAMILY */
                    <View
                      style={[
                        styles.innerCard,
                        {
                          backgroundColor: isDark ? 'rgba(20, 27, 74, 0.76)' : 'rgba(255, 255, 255, 0.85)',
                          borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.14)',
                        },
                      ]}>
                      <Text style={[styles.cardHeading, { color: colors.text }]}>
                        Connect to Your Family
                      </Text>
                      <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                        Enter the Family Code or Family ID (@familyid) shared by your family admin to join.
                      </Text>

                      {/* Handle / Code Input */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                          Family Code or Family ID
                        </Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.70)',
                              borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                            },
                          ]}>
                          <Text style={[styles.atSymbolInput, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>@</Text>
                          <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="e.g. therfamily or family code"
                            placeholderTextColor={isDark ? '#7C84C0' : '#A0A3BD'}
                            value={joinInput}
                            onChangeText={(val) => {
                              setJoinInput(val);
                              if (joinError) setJoinError(null);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          {isSearching ? (
                            <ActivityIndicator size="small" color={isDark ? '#8B7CF6' : '#7C5CE0'} />
                          ) : joinInput.length > 0 ? (
                            <Pressable onPress={() => setJoinInput('')} hitSlop={8}>
                              <Ionicons
                                name="close-circle"
                                size={18}
                                color={isDark ? '#7C84C0' : '#A0A3BD'}
                              />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>

                      {/* Live Family Verification Preview */}
                      {foundFamily ? (
                        <View style={styles.verifiedFamilyCard}>
                          <View style={styles.verifiedTopRow}>
                            <Ionicons name="checkmark-circle" size={20} color={isDark ? '#34D399' : '#2EBF8E'} />
                            <Text style={[styles.verifiedLabel, { color: isDark ? '#34D399' : '#2EBF8E' }]}>Verified Household</Text>
                          </View>
                          <Text style={[styles.verifiedFamilyName, { color: colors.text }]}>
                            {foundFamily.name}
                          </Text>
                          <Text style={[styles.verifiedFamilyMeta, { color: colors.textSecondary }]}>
                            👥 {foundFamily.membersCount}{' '}
                            {foundFamily.membersCount === 1 ? 'member' : 'members'} currently in
                            circle
                          </Text>
                        </View>
                      ) : lookupError ? (
                        <View style={styles.lookupErrorCard}>
                          <Ionicons name="information-circle" size={18} color="#EF4444" />
                          <Text style={styles.lookupErrorText}>{lookupError}</Text>
                        </View>
                      ) : null}

                      {/* Role in Family Selector */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                          Your Role in the Family
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.relationChipScroll}>
                          {RELATIONS.map((rel) => {
                            const isSelected = selectedRelation === rel;
                            return (
                              <Pressable
                                key={rel}
                                style={[
                                  styles.relationChip,
                                  {
                                    backgroundColor: isSelected
                                      ? (isDark ? '#8B7CF6' : '#7C5CE0')
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.05)'
                                      : 'rgba(255, 255, 255, 0.75)',
                                    borderColor: isSelected
                                      ? (isDark ? '#8B7CF6' : '#7C5CE0')
                                      : isDark
                                      ? 'rgba(140, 150, 255, 0.25)'
                                      : 'rgba(124, 92, 224, 0.18)',
                                  },
                                ]}>
                                <Text
                                  style={[
                                    styles.relationChipText,
                                    {
                                      color: isSelected
                                      ? '#FFFFFF'
                                      : isDark
                                      ? '#A6ADE0'
                                      : '#1F1B6D',
                                      fontWeight: isSelected ? '700' : '500',
                                    },
                                  ]}
                                  onPress={() => {
                                    if (Platform.OS !== 'web') {
                                      try {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      } catch {}
                                    }
                                    setSelectedRelation(rel);
                                  }}>
                                  {rel}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {joinError && (
                        <View style={styles.errorBanner}>
                          <Ionicons name="alert-circle" size={16} color="#EF4444" />
                          <Text style={styles.errorText}>{joinError}</Text>
                        </View>
                      )}

                      {/* Join CTA */}
                      <Pressable
                        style={[
                          styles.primaryCta,
                          { opacity: joinLoading || !joinInput.trim() ? 0.7 : 1 },
                        ]}
                        disabled={joinLoading || !joinInput.trim()}
                        onPress={handleJoinSubmit}>
                        <LinearGradient
                          colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                        {joinLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.primaryCtaText}>Join Family Team</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  headerGroup: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  haloCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
  },
  formContainer: {
    width: '100%',
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  segmentButtonActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 14,
  },
  innerCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#6E5ADC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  atSymbolInput: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  handlePreviewCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  handleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  handleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  handleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  refreshHandleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  refreshHandleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  handleDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  handleDisplayText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  editHandleBtn: {
    padding: 6,
  },
  customHandleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 8,
  },
  atSymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  customHandleInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  customHandleDone: {
    padding: 6,
  },
  handleHelperText: {
    fontSize: 12,
    lineHeight: 16,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  relationChipScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  relationChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
  },
  relationChipText: {
    fontSize: 13,
  },
  verifiedFamilyCard: {
    backgroundColor: 'rgba(46, 191, 142, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46, 191, 142, 0.35)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  verifiedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  verifiedLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  verifiedFamilyName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  verifiedFamilyMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  lookupErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  lookupErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  primaryCta: {
    height: 52,
    borderRadius: 9999,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8A6BF2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 6,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  celebrationCard: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#6E5ADC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  successBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  celebrationFamilyName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: -0.4,
  },
  handleDisplayCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  handleLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  handleValueText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  handleActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  handleActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 9999,
  },
  handleActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoNote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
});
