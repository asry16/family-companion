import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { MemberRelation } from '@/types';

interface JoinFamilyModalProps {
  visible: boolean;
  onClose: () => void;
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

export const JoinFamilyModal: React.FC<JoinFamilyModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { joinFamilyByCode } = useFamily();

  const [activeTab, setActiveTab] = useState<'scan' | 'code'>('scan');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<MemberRelation>('Other');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scanner animation
  const [scanAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (activeTab === 'scan' && visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [activeTab, visible]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  const handleJoinWithCode = async (codeToUse?: string) => {
    const cleanCode = (codeToUse || inviteCode).trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter an 8-character family code (e.g. KIN-1234).');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await joinFamilyByCode(cleanCode, selectedRelation);
      if (res.success) {
        onSuccess?.(res.familyName || 'Family Space');
        onClose();
      } else {
        setErrorMessage(res.error || 'Could not find a family matching that code.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to join family space. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateScan = (scannedCode: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setInviteCode(scannedCode);
    handleJoinWithCode(scannedCode);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                Join Family Space
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Connect directly using an invite QR code or 8-digit code.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeIcon, { backgroundColor: colors.borderSubtle }]}>
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Mode Switcher Tabs */}
          <View
            style={[
              styles.tabsRow,
              { backgroundColor: colors.borderSubtle, borderColor: colors.border },
            ]}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setActiveTab('scan');
                setErrorMessage(null);
              }}
              style={[
                styles.tab,
                activeTab === 'scan' && [
                  styles.tabActive,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                ],
              ]}>
              <Ionicons
                name="qr-code-outline"
                size={16}
                color={activeTab === 'scan' ? colors.brandAccent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'scan' ? colors.text : colors.textSecondary,
                    fontWeight: activeTab === 'scan' ? '700' : '500',
                  },
                ]}>
                Scan QR Code
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                setActiveTab('code');
                setErrorMessage(null);
              }}
              style={[
                styles.tab,
                activeTab === 'code' && [
                  styles.tabActive,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                ],
              ]}>
              <Ionicons
                name="keypad-outline"
                size={16}
                color={activeTab === 'code' ? colors.brandAccent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'code' ? colors.text : colors.textSecondary,
                    fontWeight: activeTab === 'code' ? '700' : '500',
                  },
                ]}>
                Enter Code
              </Text>
            </Pressable>
          </View>

          {/* Error Alert */}
          {errorMessage && (
            <View
              style={[
                styles.alertBox,
                { backgroundColor: colors.redSoft, borderColor: colors.redBorder },
              ]}>
              <Ionicons name="alert-circle" size={16} color={colors.red} />
              <Text style={[styles.alertText, { color: colors.red }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* TAB 1: SCAN QR CODE VIEW */}
          {activeTab === 'scan' && (
            <View style={styles.scanSection}>
              {/* Viewfinder Frame */}
              <View
                style={[
                  styles.viewfinder,
                  { borderColor: colors.brandAccent, backgroundColor: '#0B0F19' },
                ]}>
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      backgroundColor: colors.brandAccent,
                      transform: [
                        {
                          translateY: scanAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 160],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Ionicons name="scan" size={48} color={colors.brandAccent + '40'} />
              </View>

              <Text style={[styles.viewfinderText, { color: colors.textSecondary }]}>
                Point camera at the Family QR Code shown on another member's screen
              </Text>

              {/* Quick Simulator Buttons for Testing */}
              <View style={styles.demoScanRow}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Quick Test Scans:</Text>
                <Pressable
                  onPress={() => handleSimulateScan('KIN-3043')}
                  style={[styles.demoScanChip, { backgroundColor: colors.borderSubtle, borderColor: colors.border }]}>
                  <Ionicons name="flash-outline" size={12} color={colors.brandAccent} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>Scan Sharma (KIN-3043)</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* TAB 2: DIRECT CODE INPUT */}
          {activeTab === 'code' && (
            <View style={styles.codeSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                8-Character Family Invite Code
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}>
                <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  value={inviteCode}
                  onChangeText={(val) => {
                    setInviteCode(val.toUpperCase());
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="KIN-1234"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                  style={[styles.codeTextInput, { color: colors.text }]}
                />
              </View>
            </View>
          )}

          {/* Select Member Relation / Role */}
          <View style={styles.roleSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Your Relation to this Household:
            </Text>
            <View style={styles.rolesGrid}>
              {ROLES_OPTIONS.map((role) => {
                const isSelected = selectedRelation === role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedRelation(role);
                    }}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: isSelected ? colors.brandAccent : colors.borderSubtle,
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
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Primary Action Button */}
          <Pressable
            onPress={() => handleJoinWithCode()}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.brandAccent,
                shadowColor: colors.brandAccent,
                opacity: loading ? 0.7 : pressed ? 0.9 : 1,
              },
            ]}>
            {loading ? (
              <ActivityIndicator color={colors.buttonTextOnAccent} />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="people" size={18} color={colors.buttonTextOnAccent} />
                <Text style={[styles.btnText, { color: colors.buttonTextOnAccent }]}>
                  Join Family Circle
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  scanSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  viewfinder: {
    width: 200,
    height: 180,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  laserLine: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  cornerTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3B82F6',
  },
  cornerTR: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3B82F6',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3B82F6',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3B82F6',
  },
  viewfinderText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  demoScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoScanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  codeSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 50,
    gap: 10,
  },
  codeTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  roleSection: {
    gap: 8,
  },
  rolesGrid: {
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
  primaryButton: {
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
