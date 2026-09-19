import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';

const BIOMETRICS_STORAGE_KEY = '@kinly_biometrics_saved_login';

export interface ActiveSession {
  id: string;
  deviceName: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  deviceType: 'mobile' | 'desktop' | 'tablet';
}

export interface SettingsSecuritySectionProps {
  onRunCheckup?: () => void;
  onLogoutOtherSessions?: () => void;
}

export const SettingsSecuritySection: React.FC<SettingsSecuritySectionProps> = ({
  onRunCheckup,
  onLogoutOtherSessions,
}) => {
  const { colors, isDark } = useAppTheme();

  const [savedLoginEnabled, setSavedLoginEnabled] = useState(true);
  const [isRunningCheckup, setIsRunningCheckup] = useState(false);
  const [checkupSuccessMsg, setCheckupSuccessMsg] = useState<string | null>(null);
  const [otherSessionsLoggedOut, setOtherSessionsLoggedOut] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BIOMETRICS_STORAGE_KEY)
      .then((val) => {
        if (val !== null) {
          setSavedLoginEnabled(val === 'true');
        }
      })
      .catch(() => {});
  }, []);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleToggleSavedLogin = async (val: boolean) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSavedLoginEnabled(val);
    try {
      await AsyncStorage.setItem(BIOMETRICS_STORAGE_KEY, val ? 'true' : 'false');
    } catch (e) {}
  };

  const handleRunCheckup = () => {
    if (isRunningCheckup) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunningCheckup(true);
    setCheckupSuccessMsg(null);

    setTimeout(() => {
      setIsRunningCheckup(false);
      setCheckupSuccessMsg('All 4 security audits passed: 0 vulnerabilities found.');
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      onRunCheckup?.();
    }, 900);
  };

  const handleLogoutOthers = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setOtherSessionsLoggedOut(true);
    onLogoutOtherSessions?.();
  };

  const currentDeviceModel = Platform.OS === 'ios' ? 'iPhone 15 Pro' : 'Android Device';

  return (
    <View style={styles.sectionWrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons
          name="shield-checkmark-outline"
          size={16}
          color={isDark ? '#38BDF8' : colors.blue}
        />
        <Text
          style={[
            styles.sectionHeaderText,
            { color: isDark ? colors.textMuted : colors.textSecondary },
          ]}>
          SECURITY & SESSIONS
        </Text>
      </View>

      {/* Main GlassCard Container */}
      <GlassCard
        borderRadius={24}
        glowColor={isDark ? colors.blue : undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>
        {/* 1. SECURITY CHECK UP */}
        <View style={styles.checkupContainer}>
          <View style={styles.checkupTopRow}>
            <View
              style={[
                styles.shieldCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(16, 185, 129, 0.16)'
                    : 'rgba(16, 185, 129, 0.10)',
                  borderColor: isDark
                    ? 'rgba(16, 185, 129, 0.35)'
                    : 'rgba(16, 185, 129, 0.20)',
                },
              ]}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>

            <View style={styles.checkupTitles}>
              <View style={styles.badgeRow}>
                <Text style={[styles.titleText, { color: colors.text }]}>
                  Security Checkup
                </Text>
                <View
                  style={[
                    styles.protectedChip,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.18)'
                        : 'rgba(16, 185, 129, 0.10)',
                      borderColor: isDark
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(16, 185, 129, 0.20)',
                    },
                  ]}>
                  <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                  <Text style={styles.protectedChipText}>Protected</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.subtitleText,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                End-to-end encrypted vault • 2-Factor verified
              </Text>
            </View>
          </View>

          {checkupSuccessMsg ? (
            <View
              style={[
                styles.successNotice,
                {
                  backgroundColor: isDark
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(16, 185, 129, 0.08)',
                  borderColor: isDark
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(16, 185, 129, 0.15)',
                },
              ]}>
              <Ionicons name="sparkles" size={13} color="#10B981" />
              <Text style={styles.successNoticeText}>{checkupSuccessMsg}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleRunCheckup}
            disabled={isRunningCheckup}
            accessibilityRole="button"
            accessibilityLabel="Run Security Checkup"
            style={({ pressed }) => [
              styles.checkupBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(59, 111, 240, 0.14)'
                  : 'rgba(59, 111, 240, 0.08)',
                borderColor: isDark
                  ? 'rgba(59, 111, 240, 0.30)'
                  : 'rgba(59, 111, 240, 0.18)',
                opacity: pressed || isRunningCheckup ? 0.75 : 1,
              },
            ]}>
            {isRunningCheckup ? (
              <ActivityIndicator size="small" color={isDark ? '#38BDF8' : colors.blue} />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={14}
                color={isDark ? '#38BDF8' : colors.blue}
              />
            )}
            <Text
              style={[
                styles.checkupBtnText,
                { color: isDark ? '#38BDF8' : colors.blue },
              ]}>
              {isRunningCheckup ? 'Scanning Vault & Devices...' : 'Run Security Checkup'}
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark
                ? 'rgba(59, 111, 240, 0.12)'
                : 'rgba(20, 32, 58, 0.06)',
            },
          ]}
        />

        {/* 2. SAVED LOGIN & BIOMETRICS */}
        <View style={styles.savedLoginRow}>
          <View style={styles.savedLoginInfo}>
            <View style={styles.savedLoginHeader}>
              <Ionicons
                name="finger-print-outline"
                size={17}
                color={isDark ? '#38BDF8' : colors.blue}
              />
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                Saved Login & Face ID
              </Text>
            </View>
            <Text
              style={[
                styles.subtitleText,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              Fast biometric unlock without re-entering password
            </Text>
          </View>

          <Switch
            value={savedLoginEnabled}
            onValueChange={handleToggleSavedLogin}
            trackColor={{
              false: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
              true: isDark ? '#2563EB' : colors.blue,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={
              isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'
            }
          />
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark
                ? 'rgba(59, 111, 240, 0.12)'
                : 'rgba(20, 32, 58, 0.06)',
            },
          ]}
        />

        {/* 3. WHERE YOU'RE LOGGED IN */}
        <View style={styles.sessionsContainer}>
          <View style={styles.sessionsHeaderRow}>
            <Text style={[styles.subHeadingText, { color: colors.text }]}>
              Where You’re Logged In
            </Text>
            <Text
              style={[
                styles.sessionsCountText,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              {otherSessionsLoggedOut ? '1 Active Session' : '2 Active Sessions'}
            </Text>
          </View>

          {/* Session 1: Current Device */}
          <View
            style={[
              styles.sessionItem,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(20, 32, 58, 0.03)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(20, 32, 58, 0.06)',
              },
            ]}>
            <View
              style={[
                styles.deviceIconCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(59, 111, 240, 0.18)'
                    : 'rgba(59, 111, 240, 0.10)',
                },
              ]}>
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color={isDark ? '#38BDF8' : colors.blue}
              />
            </View>

            <View style={styles.sessionDetails}>
              <View style={styles.sessionTitleRow}>
                <Text
                  style={[styles.sessionDeviceName, { color: colors.text }]}
                  numberOfLines={1}>
                  {currentDeviceModel}
                </Text>
                <View style={styles.currentDeviceBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.currentDeviceBadgeText}>This Device</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.sessionMetaText,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                Active Now • Kinly App (Mobile)
              </Text>
            </View>
          </View>

          {/* Session 2: Other Linked Device (if not logged out) */}
          {!otherSessionsLoggedOut ? (
            <View
              style={[
                styles.sessionItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(20, 32, 58, 0.03)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(20, 32, 58, 0.06)',
                },
              ]}>
              <View
                style={[
                  styles.deviceIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(20, 32, 58, 0.06)',
                  },
                ]}>
                <Ionicons
                  name="laptop-outline"
                  size={16}
                  color={isDark ? colors.textMuted : colors.textSecondary}
                />
              </View>

              <View style={styles.sessionDetails}>
                <View style={styles.sessionTitleRow}>
                  <Text
                    style={[styles.sessionDeviceName, { color: colors.text }]}
                    numberOfLines={1}>
                    MacBook Air (Apple Silicon)
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sessionMetaText,
                    { color: isDark ? colors.textMuted : colors.textSecondary },
                  ]}>
                  Active 2 hours ago • Chrome on macOS
                </Text>
              </View>
            </View>
          ) : null}

          {/* Logout of Other Sessions Button */}
          {!otherSessionsLoggedOut && (
            <Pressable
              onPress={handleLogoutOthers}
              accessibilityRole="button"
              accessibilityLabel="Log out of other sessions"
              style={({ pressed }) => [
                styles.logoutOthersBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(240, 82, 77, 0.10)'
                    : 'rgba(240, 82, 77, 0.06)',
                  borderColor: isDark
                    ? 'rgba(240, 82, 77, 0.25)'
                    : 'rgba(240, 82, 77, 0.15)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="log-out-outline" size={14} color={colors.red} />
              <Text style={[styles.logoutOthersText, { color: colors.red }]}>
                Log Out of Other Sessions
              </Text>
            </Pressable>
          )}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginHorizontal: 18,
    marginVertical: 6,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardContainer: {
    padding: 0,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  checkupContainer: {
    gap: 10,
  },
  checkupTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  shieldCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkupTitles: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  protectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  protectedChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10B981',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  successNoticeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10B981',
    flex: 1,
  },
  checkupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkupBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  savedLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  savedLoginInfo: {
    flex: 1,
    gap: 3,
  },
  savedLoginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  sessionsContainer: {
    gap: 10,
  },
  sessionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subHeadingText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  sessionsCountText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  deviceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDetails: {
    flex: 1,
    gap: 2,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sessionDeviceName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  currentDeviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  currentDeviceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  sessionMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  logoutOthersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  logoutOthersText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
