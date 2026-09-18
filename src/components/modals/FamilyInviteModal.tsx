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

  const handleCopyCode = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const code = profile.code || 'KIN-0000';
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
    const code = profile.code || 'KIN-0000';
    try {
      await Share.share({
        title: `Join ${profile.name} on Kinly!`,
        message: `Join our private family circle "${profile.name}" on Kinly using our invite code: ${code}\n\nStay connected with real-time presence, safe battery status, and shared family plans.`,
      });
    } catch {}
  };

  const handleJoinSubmit = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter an 8-character family code.');
      return;
    }
    setErrorMessage(null);
    setIsJoining(true);

    try {
      const res = await joinFamilyByCode(cleanCode, selectedRole);
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
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}>
          {/* Sheet Handle */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text, fontSize: isElderly ? 22 : 18 }]}>
                {activeTab === 'invite' ? 'Share Family Access' : 'Join Family Circle'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {activeTab === 'invite'
                  ? `${profile.name} • Private Encrypted Vault`
                  : 'Enter code or scan QR to link with family'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.separator }]}>
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Segmented Switcher */}
          <View style={[styles.segmentedRow, { backgroundColor: colors.separator }]}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setActiveTab('invite');
              }}
              style={[
                styles.segmentTab,
                activeTab === 'invite' && {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}>
              <Ionicons
                name="qr-code-outline"
                size={15}
                color={activeTab === 'invite' ? colors.brandAccent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: activeTab === 'invite' ? colors.text : colors.textSecondary,
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
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}>
              <Ionicons
                name="enter-outline"
                size={16}
                color={activeTab === 'join' ? colors.brandAccent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: activeTab === 'join' ? colors.text : colors.textSecondary,
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
                  size={190}
                />
              </View>

              {/* Code Display & Action Row */}
              <View style={[styles.codeDisplayCard, { backgroundColor: colors.separator, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.codeCardLabel, { color: colors.textSecondary }]}>
                    HOUSEHOLD INVITE CODE
                  </Text>
                  <Text style={[styles.codeCardValue, { color: colors.brandAccent }]}>
                    {profile.code || 'KIN-4892'}
                  </Text>
                </View>

                <Pressable
                  onPress={handleCopyCode}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    {
                      backgroundColor: copied ? colors.green : colors.cardBackground,
                      borderColor: copied ? colors.green : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color={copied ? '#FFFFFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      { color: copied ? '#FFFFFF' : colors.text },
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
                    styles.primaryBtn,
                    {
                      backgroundColor: colors.brandAccent,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons name="share-social" size={16} color={colors.buttonTextOnAccent} />
                  <Text style={[styles.primaryBtnText, { color: colors.buttonTextOnAccent }]}>
                    Share Invite Link
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setActiveTab('join');
                  }}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons name="scan-outline" size={16} color={colors.text} />
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                    Join Another Circle
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* TAB 2: JOIN CONTENT */}
          {activeTab === 'join' && (
            <View style={styles.tabContent}>
              {/* Camera Scanner Simulation Viewfinder */}
              <View style={[styles.viewfinderCard, { backgroundColor: '#0A0F1D' }]}>
                {scannerActive ? (
                  <View style={styles.scannerActiveArea}>
                    <Animated.View
                      style={[
                        styles.scannerLaser,
                        {
                          backgroundColor: colors.brandAccent,
                          transform: [
                            {
                              translateY: laserAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 120],
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
                    <Ionicons name="scan" size={40} color={colors.brandAccent} />
                    <Text style={styles.viewfinderPrompt}>Point camera at another phone's QR code</Text>
                    <Pressable
                      onPress={() => handleSimulateScan(profile.code || 'KIN-8756')}
                      style={[styles.simScanBtn, { backgroundColor: colors.brandAccent + '25', borderColor: colors.brandAccent }]}>
                      <Text style={[styles.simScanBtnText, { color: colors.brandAccent }]}>
                        Tap to Scan QR Code
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Code Input Field */}
              <View style={styles.inputBlock}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Or Enter 8-Digit Invite Code
                </Text>
                <TextInput
                  value={inviteCode}
                  onChangeText={(val) => {
                    setInviteCode(val.toUpperCase());
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. KIN-8756"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  maxLength={10}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.separator,
                      borderColor: errorMessage ? colors.red : colors.border,
                      color: colors.text,
                    },
                  ]}
                />
                {errorMessage && (
                  <Text style={[styles.errorText, { color: colors.red }]}>
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
                            backgroundColor: isSelected ? colors.brandAccent : colors.separator,
                            borderColor: isSelected ? colors.brandAccent : colors.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.roleChipText,
                            {
                              color: isSelected ? colors.buttonTextOnAccent : colors.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Join Submit Action */}
              <Pressable
                onPress={handleJoinSubmit}
                disabled={isJoining}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.brandAccent,
                    opacity: pressed || isJoining ? 0.85 : 1,
                  },
                ]}>
                {isJoining ? (
                  <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={17} color={colors.buttonTextOnAccent} />
                    <Text style={[styles.primaryBtnText, { color: colors.buttonTextOnAccent }]}>
                      Connect & Join Family
                    </Text>
                  </>
                )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  segmentLabel: {
    fontSize: 12,
  },
  tabContent: {
    gap: 14,
  },
  qrPresentationWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  codeDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  codeCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  codeCardValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewfinderCard: {
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  viewfinderEmpty: {
    alignItems: 'center',
    gap: 6,
  },
  viewfinderPrompt: {
    color: '#94A3B8',
    fontSize: 12,
  },
  simScanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  simScanBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scannerActiveArea: {
    width: '80%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scannerLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowColor: '#60A5FA',
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
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
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
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
  },
});
