import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Share,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyQRCode } from '@/components/ui/FamilyQRCode';
import { MemberRelation } from '@/types';

export interface CircleAddMemberOptionsSheetProps {
  visible: boolean;
  inviteCode?: string;
  initialMode?: 'share' | 'enter';
  onClose: () => void;
  onSuccess?: (familyName: string) => void;
  // Legacy optional props kept for strict interface backwards compatibility
  onSelectQR?: () => void;
  onSelectCode?: () => void;
  onSelectManual?: () => void;
}

const RELATION_CHIPS: MemberRelation[] = [
  'Partner',
  'Daughter',
  'Son',
  'Mother',
  'Father',
  'Grandmother',
  'Grandfather',
  'Other',
];

export const CircleAddMemberOptionsSheet: React.FC<CircleAddMemberOptionsSheetProps> = ({
  visible,
  inviteCode: propInviteCode,
  initialMode = 'share',
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, isElderly } = useAppTheme();
  const { profile, joinFamilyByCode } = useFamily();

  const [activeTab, setActiveTab] = useState<'share' | 'enter'>(initialMode);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Enter code state
  const [inputCode, setInputCode] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<MemberRelation>('Partner');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setInputCode('');
    }
  }, [visible, initialMode]);

  const activeFamilyCode = profile?.code || propInviteCode || 'KIN-4402';
  const activeFamilyName = profile?.name || 'Kinly Family';

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  // 1. Copy Family Code Handler
  const handleCopyCode = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(activeFamilyCode);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  // 2. Native Share Handler
  const handleShareInvite = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        title: `Join ${activeFamilyName} on Kinly`,
        message: `Join our private family circle on Kinly! Use invite code: ${activeFamilyCode}\n\nDownload Kinly or open the app to stay connected in real-time.`,
      });
    } catch {}
  };

  // 3. Enter Code Join Handler
  const handleJoinFamily = async () => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter an 8-character family invite code (e.g. KIN-4402).');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsJoining(true);
    setErrorMessage(null);

    try {
      const res = await joinFamilyByCode(cleanCode, selectedRelation);
      if (res.success) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setSuccessMessage(`Connected to ${res.familyName || activeFamilyName}!`);
        setTimeout(() => {
          onSuccess?.(res.familyName || activeFamilyName);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(
          res.error === 'Invalid invite code. No family found.'
            ? `No family circle found matching "${cleanCode}". Please check with your household organizer, or share your own code (${activeFamilyCode}) to invite them.`
            : res.error || `Could not find a family matching code "${cleanCode}". Please verify with the organizer.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to connect. Please verify the family code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Dismiss Backdrop */}
        <Pressable
          style={styles.backdropPressable}
          onPress={() => {
            triggerHaptic();
            onClose();
          }}
        />

        {/* Executive Bottom Sheet Container */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#0D1126' : '#FFFFFF',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}>
          {/* iOS Handle Indicator */}
          <View style={styles.handleWrap}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)' },
              ]}
            />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <LinearGradient
                colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIconGradient}>
                <Ionicons name="people" size={18} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.sheetTitle,
                  { color: colors.text, fontSize: isElderly ? 20 : 18 },
                ]}>
                Family Circle Access
              </Text>
              <Text
                style={[
                  styles.sheetSubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}>
                {activeFamilyName} • Secure Household Network
              </Text>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              hitSlop={12}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}>
              <Ionicons
                name="close"
                size={18}
                color={isDark ? '#CBD5E1' : '#475569'}
              />
            </Pressable>
          </View>

          {/* Executive Two-Option Segmented Control */}
          <View
            style={[
              styles.segmentedContainer,
              {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(241, 245, 249, 0.90)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            {/* Option 1: Share Family Code */}
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('share');
                setErrorMessage(null);
              }}
              style={[
                styles.segmentItem,
                activeTab === 'share' && styles.segmentItemActive,
              ]}>
              {activeTab === 'share' && (
                <LinearGradient
                  colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Ionicons
                name="share-outline"
                size={16}
                color={activeTab === 'share' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: activeTab === 'share' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                    fontWeight: activeTab === 'share' ? '700' : '600',
                  },
                ]}>
                Share Family Code
              </Text>
            </Pressable>

            {/* Option 2: Enter Family Code */}
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('enter');
                setErrorMessage(null);
              }}
              style={[
                styles.segmentItem,
                activeTab === 'enter' && styles.segmentItemActive,
              ]}>
              {activeTab === 'enter' && (
                <LinearGradient
                  colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Ionicons
                name="key-outline"
                size={16}
                color={activeTab === 'enter' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: activeTab === 'enter' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                    fontWeight: activeTab === 'enter' ? '700' : '600',
                  },
                ]}>
                Enter Family Code
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* ============================================================== */}
            {/* TAB 1: SHARE FAMILY CODE */}
            {/* ============================================================== */}
            {activeTab === 'share' ? (
              <View style={styles.tabContent}>
                {/* Code Hero Presentation Card */}
                <View
                  style={[
                    styles.heroCard,
                    {
                      backgroundColor: isDark ? 'rgba(17, 24, 62, 0.70)' : 'rgba(248, 250, 252, 0.95)',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.30)' : 'rgba(99, 102, 241, 0.20)',
                    },
                  ]}>
                  <View style={styles.heroBadgeRow}>
                    <Text style={styles.heroBadgeLabel}>HOUSEHOLD ACCESS KEY</Text>
                    <View style={styles.activePill}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activePillText}>Ready to Share</Text>
                    </View>
                  </View>

                  {/* Big Monospace Code Display */}
                  <View
                    style={[
                      styles.codeDisplayBox,
                      {
                        backgroundColor: isDark ? 'rgba(10, 14, 39, 0.90)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.25)',
                      },
                    ]}>
                    <Ionicons
                      name="key"
                      size={20}
                      color="#818CF8"
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.codeDisplayText,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                      selectable>
                      {activeFamilyCode}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.codeDescription,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}>
                    Give this 8-character key to family members to invite them into your circle.
                  </Text>

                  {/* Two Executive Action Buttons: Copy and Share */}
                  <View style={styles.actionButtonsRow}>
                    {/* 1-Tap Copy */}
                    <Pressable
                      onPress={handleCopyCode}
                      style={({ pressed }) => [
                        styles.executiveBtn,
                        styles.copyBtn,
                        copied && styles.copiedBtnState,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}>
                      <Ionicons
                        name={copied ? 'checkmark-circle' : 'copy-outline'}
                        size={17}
                        color={copied ? '#FFFFFF' : isDark ? '#FFFFFF' : '#1E293B'}
                      />
                      <Text
                        style={[
                          styles.executiveBtnText,
                          { color: copied ? '#FFFFFF' : isDark ? '#FFFFFF' : '#1E293B' },
                        ]}>
                        {copied ? 'Copied to Clipboard!' : 'Copy Code'}
                      </Text>
                    </Pressable>

                    {/* Native Share */}
                    <Pressable
                      onPress={handleShareInvite}
                      style={({ pressed }) => [
                        styles.executiveBtn,
                        styles.shareBtn,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}>
                      <LinearGradient
                        colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Ionicons name="share-social" size={17} color="#FFFFFF" />
                      <Text style={[styles.executiveBtnText, { color: '#FFFFFF' }]}>
                        Share Invite
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* QR Code Collapsible Section */}
                <View
                  style={[
                    styles.qrContainerCard,
                    {
                      backgroundColor: isDark ? 'rgba(17, 24, 62, 0.50)' : 'rgba(248, 250, 252, 0.85)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      setShowQR((prev) => !prev);
                    }}
                    style={styles.qrToggleRow}>
                    <View style={styles.qrToggleLeft}>
                      <Ionicons name="qr-code-outline" size={20} color="#818CF8" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.qrToggleTitle, { color: colors.text }]}>
                          Household QR Code
                        </Text>
                        <Text style={[styles.qrToggleSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          Point camera to join instantly
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={showQR ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={isDark ? '#94A3B8' : '#64748B'}
                    />
                  </Pressable>

                  {showQR && (
                    <View style={styles.qrBody}>
                      <View style={styles.qrFrame}>
                        <FamilyQRCode
                          familyCode={activeFamilyCode}
                          familyName={activeFamilyName}
                          size={180}
                        />
                      </View>
                      <Text style={[styles.qrPrompt, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Scan using another phone's camera or Kinly app to link immediately
                      </Text>
                    </View>
                  )}
                </View>

                {/* Trust & Security Badge */}
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark" size={15} color="#10B981" />
                  <Text style={[styles.securityText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    End-to-end encrypted family circle • Only people with this key can connect
                  </Text>
                </View>
              </View>
            ) : (
              /* ============================================================== */
              /* TAB 2: ENTER FAMILY CODE */
              /* ============================================================== */
              <View style={styles.tabContent}>
                {/* Error Banner */}
                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#EF4444" />
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.successBannerText}>{successMessage}</Text>
                  </View>
                )}

                {/* Code Input Card */}
                <View
                  style={[
                    styles.inputCard,
                    {
                      backgroundColor: isDark ? 'rgba(17, 24, 62, 0.70)' : 'rgba(248, 250, 252, 0.95)',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.30)' : 'rgba(99, 102, 241, 0.20)',
                    },
                  ]}>
                  <Text style={styles.inputSectionLabel}>ENTER HOUSEHOLD INVITE CODE</Text>

                  <View
                    style={[
                      styles.textInputWrap,
                      {
                        backgroundColor: isDark ? 'rgba(10, 14, 39, 0.90)' : '#FFFFFF',
                        borderColor: errorMessage
                          ? '#EF4444'
                          : isDark
                          ? 'rgba(129, 140, 248, 0.35)'
                          : 'rgba(99, 102, 241, 0.25)',
                      },
                    ]}>
                    <Ionicons name="key-outline" size={18} color="#818CF8" />
                    <TextInput
                      value={inputCode}
                      onChangeText={(val) => {
                        let formatted = val.toUpperCase().replace(/\s/g, '');
                        // Auto-hyphenate KIN prefix
                        if (formatted.length === 3 && !formatted.includes('-')) {
                          formatted = formatted + '-';
                        }
                        setInputCode(formatted);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="e.g. KIN-4402"
                      placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={12}
                      style={[styles.textInputField, { color: colors.text }]}
                    />
                    {inputCode.length > 0 && (
                      <Pressable
                        onPress={() => setInputCode('')}
                        hitSlop={8}
                        style={{ padding: 4 }}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={isDark ? '#64748B' : '#94A3B8'}
                        />
                      </Pressable>
                    )}
                  </View>
                  <Text style={[styles.inputHint, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Enter the 8-character invite code provided by your family organizer.
                  </Text>
                </View>

                {/* Relation Selector */}
                <View style={styles.relationSection}>
                  <Text style={styles.inputSectionLabel}>YOUR RELATION IN THIS HOUSEHOLD</Text>
                  <View style={styles.chipsWrap}>
                    {RELATION_CHIPS.map((relation) => {
                      const isSelected = selectedRelation === relation;
                      return (
                        <Pressable
                          key={relation}
                          onPress={() => {
                            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedRelation(relation);
                          }}
                          style={[
                            styles.relationChip,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? 'rgba(99, 102, 241, 0.22)'
                                  : 'rgba(99, 102, 241, 0.12)'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.04)'
                                : 'rgba(0, 0, 0, 0.03)',
                              borderColor: isSelected
                                ? '#818CF8'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.08)',
                            },
                          ]}>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color="#818CF8"
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text
                            style={[
                              styles.relationChipText,
                              {
                                color: isSelected ? '#818CF8' : isDark ? '#94A3B8' : '#475569',
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}>
                            {relation}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Submit Join CTA */}
                <Pressable
                  onPress={handleJoinFamily}
                  disabled={isJoining || !!successMessage}
                  style={({ pressed }) => [
                    styles.joinCtaBtn,
                    { opacity: isJoining ? 0.75 : pressed ? 0.90 : 1 },
                  ]}>
                  <LinearGradient
                    colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {isJoining ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="link-outline" size={19} color="#FFFFFF" />
                      <Text style={styles.joinCtaText}>Join Family Circle</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerIconWrap: {
    marginRight: 12,
  },
  headerIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 9999,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  segmentItemActive: {
    shadowColor: '#8A6BF2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabContent: {
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  heroBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 1.2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  codeDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    width: '100%',
    marginBottom: 10,
  },
  codeDisplayText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  executiveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    overflow: 'hidden',
  },
  copyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  copiedBtnState: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  shareBtn: {
    shadowColor: '#8A6BF2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  executiveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  qrContainerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  qrToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  qrToggleSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  qrBody: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 6,
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
  },
  qrPrompt: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  inputCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  textInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  textInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputHint: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  relationSection: {
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  relationChipText: {
    fontSize: 12,
  },
  joinCtaBtn: {
    height: 48,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    overflow: 'hidden',
    shadowColor: '#8A6BF2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  joinCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  successBannerText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
