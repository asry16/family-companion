import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Share,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyQRCode } from '@/components/ui/FamilyQRCode';
import { MemberRelation } from '@/types';

interface FamilyInviteModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'invite' | 'join';
  onSuccess?: (familyName: string) => void;
}

const ROLES_OPTIONS: MemberRelation[] = [
  'Mother',
  'Father',
  'Partner',
  'Daughter',
  'Son',
  'Grandmother',
  'Grandfather',
  'Other',
];

export const FamilyInviteModal: React.FC<FamilyInviteModalProps> = ({
  visible,
  onClose,
  initialTab = 'invite',
  onSuccess,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { profile, joinFamilyByCode } = useFamily();

  const [activeTab, setActiveTab] = useState<'invite' | 'join'>(initialTab);
  const [copied, setCopied] = useState(false);

  // Join form state
  const [inviteCode, setInviteCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRelation>('Daughter');
  const [customRole, setCustomRole] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);

  // Animated laser scan effect
  const [laserAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setCopied(false);
      setErrorMessage(null);
      setIsJoining(false);
      setScannerActive(false);
    }
  }, [visible, initialTab]);

  useEffect(() => {
    if (scannerActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [scannerActive, laserAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  const familyHandle = profile.username ? (profile.username.startsWith('@') ? profile.username : `@${profile.username}`) : (profile.code || '');

  const handleCopyCode = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const code = familyHandle;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareInvite = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const code = familyHandle;
    try {
      await Share.share({
        title: `Join ${profile.name} on Kinly!`,
        message: `Join our private family circle "${profile.name}" on Kinly using our Family ID: ${code}\n\nStay connected with real-time presence, safe battery status, and shared family plans.`,
      });
    } catch {}
  };

  const handleJoinSubmit = async () => {
    const cleanCode = inviteCode.trim();
    if (!cleanCode) {
      setErrorMessage('Please enter a Family ID (e.g. @therfamily) or code.');
      return;
    }
    setErrorMessage(null);
    setIsJoining(true);

    const effectiveRole =
      selectedRole === 'Other' && customRole.trim()
        ? customRole.trim()
        : selectedRole;

    try {
      const res = await joinFamilyByCode(cleanCode, effectiveRole);
      if (res.success) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        onSuccess?.(res.familyName || 'Family Space');
        onClose();
      } else {
        setErrorMessage(res.error || 'Invalid or expired code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect with family.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSimulateScan = (codeToUse: string) => {
    setScannerActive(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setScannerActive(false);
      setInviteCode(codeToUse);
      setActiveTab('join');
    }, 1800);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? 'rgba(16, 22, 60, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.28)' : 'rgba(124, 92, 224, 0.18)',
              shadowColor: isDark ? '#000' : '#6E5ADC',
            },
          ]}>
          {/* Sheet Handle */}
          <View
            style={[
              styles.handleBar,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 0, 0, 0.15)' },
            ]}
          />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text, fontSize: isElderly ? 22 : 18 }]}>
                {activeTab === 'invite' ? 'Share Family Access' : 'Join Family Circle'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                {activeTab === 'invite'
                  ? `${profile.name} • Private Encrypted Vault`
                  : 'Enter code or scan QR to link with family'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.14)',
                },
              ]}>
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Segmented Switcher */}
          <View
            style={[
              styles.segmentedRow,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 92, 224, 0.08)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)',
              },
            ]}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setActiveTab('invite');
              }}
              style={[
                styles.segmentTab,
                activeTab === 'invite' && {
                  backgroundColor: isDark ? 'rgba(138, 107, 242, 0.28)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(138, 107, 242, 0.50)' : 'rgba(124, 92, 224, 0.22)',
                  borderWidth: 1,
                  shadowColor: isDark ? '#8A6BF2' : '#6E5ADC',
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}>
              <Ionicons
                name="qr-code-outline"
                size={15}
                color={activeTab === 'invite' ? (isDark ? '#A594FD' : '#7C5CE0') : (isDark ? colors.textMuted : colors.textSecondary)}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: activeTab === 'invite' ? (isDark ? '#FFFFFF' : '#1E1B4B') : (isDark ? colors.textMuted : colors.textSecondary),
                    fontWeight: activeTab === 'invite' ? '700' : '500',
                  },
                ]}>
                QR & Invite Code
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                setActiveTab('join');
              }}
              style={[
                styles.segmentTab,
                activeTab === 'join' && {
                  backgroundColor: isDark ? 'rgba(138, 107, 242, 0.28)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(138, 107, 242, 0.50)' : 'rgba(124, 92, 224, 0.22)',
                  borderWidth: 1,
                  shadowColor: isDark ? '#8A6BF2' : '#6E5ADC',
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}>
              <Ionicons
                name="enter-outline"
                size={16}
                color={activeTab === 'join' ? (isDark ? '#A594FD' : '#7C5CE0') : (isDark ? colors.textMuted : colors.textSecondary)}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: activeTab === 'join' ? (isDark ? '#FFFFFF' : '#1E1B4B') : (isDark ? colors.textMuted : colors.textSecondary),
                    fontWeight: activeTab === 'join' ? '700' : '500',
                  },
                ]}>
                Join with Code / QR
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: INVITE CONTENT */}
          {activeTab === 'invite' && (
            <View style={styles.tabContent}>
              {/* QR Code Presentation Frame */}
              <View style={styles.qrPresentationWrap}>
                <FamilyQRCode
                  familyCode={profile.code}
                  familyName={profile.name}
                  size={180}
                />
              </View>

              {/* Code Display & Action Row */}
              <View
                style={[
                  styles.codeDisplayCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(245, 247, 255, 0.85)',
                    borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
                  },
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.codeCardLabel, { color: isDark ? '#A594FD' : '#7C5CE0' }]}>
                    HOUSEHOLD FAMILY ID
                  </Text>
                  <Text style={[styles.codeCardValue, { color: isDark ? '#FFFFFF' : '#1E1B4B' }]}>
                    {familyHandle}
                  </Text>
                </View>

                <Pressable
                  onPress={handleCopyCode}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    {
                      backgroundColor: copied
                        ? (isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.15)')
                        : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF'),
                      borderColor: copied
                        ? '#10B981'
                        : (isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)'),
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color={copied ? '#10B981' : (isDark ? '#A594FD' : '#7C5CE0')}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      { color: copied ? '#10B981' : colors.text },
                    ]}>
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Text>
                </Pressable>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={handleShareInvite}
                  style={({ pressed }) => [
                    styles.primaryBtnWrap,
                    {
                      opacity: pressed ? 0.88 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}>
                  <LinearGradient
                    colors={['#4F8EF7', '#8A6BF2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}>
                    <Ionicons name="share-social" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      Share Invite Link
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setActiveTab('join');
                  }}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.80)',
                      borderColor: isDark ? 'rgba(130, 140, 255, 0.28)' : 'rgba(124, 92, 224, 0.22)',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons name="scan-outline" size={16} color={isDark ? '#A594FD' : '#7C5CE0'} />
                  <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#1E1B4B' }]}>
                    Join Circle
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* TAB 2: JOIN CONTENT */}
          {activeTab === 'join' && (
            <View style={styles.tabContent}>
              {/* Camera Scanner Simulation Viewfinder */}
              <View
                style={[
                  styles.viewfinderCard,
                  {
                    backgroundColor: isDark ? 'rgba(10, 15, 35, 0.90)' : '#0F172A',
                    borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
                  },
                ]}>
                {scannerActive ? (
                  <View style={styles.scannerActiveArea}>
                    <Animated.View
                      style={[
                        styles.scannerLaser,
                        {
                          backgroundColor: '#8A6BF2',
                          transform: [
                            {
                              translateY: laserAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 110],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <Text style={styles.scanningText}>Scanning QR Code...</Text>
                  </View>
                ) : (
                  <View style={styles.viewfinderEmpty}>
                    <Ionicons name="scan" size={36} color="#A594FD" />
                    <Text style={styles.viewfinderPrompt}>Point camera at another phone's QR code</Text>
                    <Pressable
                      onPress={() => handleSimulateScan(familyHandle)}
                      style={[
                        styles.simScanBtn,
                        {
                          backgroundColor: 'rgba(138, 107, 242, 0.18)',
                          borderColor: '#8A6BF2',
                        },
                      ]}>
                      <Text style={styles.simScanBtnText}>
                        Tap to Scan QR Code
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Code Input Field */}
              <View style={styles.inputBlock}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Or Enter Family ID / Invite Code
                </Text>
                <TextInput
                  value={inviteCode}
                  onChangeText={(val) => {
                    setInviteCode(val.trim());
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. @therfamily"
                  placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                      borderColor: errorMessage
                        ? '#EF4444'
                        : (isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)'),
                      color: colors.text,
                    },
                  ]}
                />
                {errorMessage && (
                  <Text style={[styles.errorText, { color: '#EF4444' }]}>
                    {errorMessage}
                  </Text>
                )}
              </View>

              {/* Role Selection */}
              <View style={styles.roleBlock}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Your Role in this Circle
                </Text>
                <View style={styles.roleGrid}>
                  {ROLES_OPTIONS.map((r) => {
                    const isSelected = selectedRole === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => {
                          triggerHaptic();
                          setSelectedRole(r);
                        }}
                        style={[
                          styles.roleChip,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? '#8A6BF2' : '#7C5CE0')
                              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)'),
                            borderColor: isSelected
                              ? 'transparent'
                              : (isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)'),
                          },
                        ]}>
                        <Text
                          style={[
                            styles.roleChipText,
                            {
                              color: isSelected ? '#FFFFFF' : (isDark ? '#C7CEEA' : '#4E5375'),
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}>
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {selectedRole === 'Other' && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#A594FD' : '#7C5CE0' }]}>
                      CUSTOM CATEGORY / RELATIONSHIP
                    </Text>
                    <TextInput
                      value={customRole}
                      onChangeText={setCustomRole}
                      placeholder="e.g. Uncle, Aunt, Roommate, Nanny, Pet..."
                      placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
                      style={[
                        styles.inputField,
                        {
                          color: colors.text,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                          borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
                          marginBottom: 4,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>

              {/* Join Submit Action */}
              <Pressable
                onPress={handleJoinSubmit}
                disabled={isJoining}
                style={({ pressed }) => [
                  styles.primaryBtnWrap,
                  {
                    opacity: pressed || isJoining ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}>
                <LinearGradient
                  colors={['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryGradient}>
                  {isJoining ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                      <Text style={styles.primaryBtnText}>
                        Connect & Join Family
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 26, 0.72)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 10,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    marginBottom: 14,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 999,
  },
  segmentLabel: {
    fontSize: 12,
  },
  tabContent: {
    gap: 12,
  },
  qrPresentationWrap: {
    alignItems: 'center',
    marginVertical: 2,
  },
  codeDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  codeCardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  codeCardValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryBtnWrap: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#6E5ADC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryGradient: {
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 0.85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  viewfinderCard: {
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  viewfinderEmpty: {
    alignItems: 'center',
    gap: 5,
  },
  viewfinderPrompt: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  simScanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  simScanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A594FD',
  },
  scannerActiveArea: {
    width: '80%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scannerLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowColor: '#8A6BF2',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputField: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleBlock: {
    gap: 6,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
  },
});

