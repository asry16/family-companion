import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { FamilyAvatar } from './FamilyAvatar';
import { StatusDot } from './StatusDot';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { EmergencySosModal } from '@/components/modals/EmergencySosModal';
import { FamilyQRModal } from '@/components/modals/FamilyQRModal';
import { JoinFamilyModal } from '@/components/modals/JoinFamilyModal';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSimpleToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showSimpleToggle = true,
}) => {
  const router = useRouter();
  const { colors, isElderly, theme, themePreference, setThemePreference, toggleTheme, isDark } = useAppTheme();
  const {
    profile,
    activeUser,
    members,
    tasks,
    unreadCount,
    simpleMode,
    setSimpleMode,
    sosAlert,
    dismissSosAlert,
    sendEmergencySos,
  } = useFamily();
  const { user, isAuthenticated, signOut } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const rawName = user?.name || activeUser?.name || 'Family';
    const firstName = rawName.split(' ')[0] || 'Family';
    if (hour < 12) return `Good morning, ${firstName} ☀️`;
    if (hour < 17) return `Good afternoon, ${firstName} 🌤️`;
    return `Good evening, ${firstName} 🌙`;
  };

  const handleToggleSimpleMode = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
    }
    const nextMode = !simpleMode;
    setSimpleMode(nextMode);
    if (nextMode) {
      router.push('/modal/simple-mode');
    }
  };

  const handleSignOut = async () => {
    setProfileModalVisible(false);
    await signOut();
    router.replace('/login');
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted).length;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.borderSubtle,
          },
        ]}>
        {/* Left Section: User Avatar & Space Info */}
        <Pressable
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/login');
            } else {
              setProfileModalVisible(true);
            }
          }}
          style={({ pressed }) => [
            styles.leftSection,
            { opacity: pressed ? 0.85 : 1 },
          ]}>
          <View style={styles.avatarHaloWrapper}>
            <FamilyAvatar member={activeUser} size="md" />
            <StatusDot
              size={11}
              color={colors.green}
              style={styles.avatarOnlineDot}
              dotStyle={{ borderWidth: 2, borderColor: '#FFFFFF' }}
            />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.greetingText,
                {
                  color: colors.text,
                  fontSize: isElderly ? 22 : 17,
                },
              ]}>
              {title || getGreeting()}
            </Text>

            {/* Interactive Space Badge with Sync Indicator */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                router.push('/modal/family-settings');
              }}
              style={({ pressed }) => [
                styles.spacePill,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <View style={[styles.pulseDot, { backgroundColor: colors.green }]} />
              <Text
                style={[
                  styles.spacePillText,
                  { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
                ]}>
                {subtitle || (isAuthenticated ? `${profile.name}` : 'Guest Preview')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textMuted}
                style={{ marginLeft: -2 }}
              />
            </Pressable>
          </View>
        </Pressable>

        {/* Right Section: Controls & Modals */}
        <View style={styles.rightSection}>
          {!isAuthenticated ? (
            <Pressable
              onPress={() => router.push('/login')}
              style={({ pressed }) => [
                styles.signInHeaderButton,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="log-in-outline" size={15} color={colors.buttonTextOnAccent} />
              <Text style={[styles.signInHeaderText, { color: colors.buttonTextOnAccent }]}>Sign In</Text>
            </Pressable>
          ) : (
            <>
              {/* Emergency SOS Button */}
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    try {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    } catch (e) {}
                  }
                  setSosModalVisible(true);
                }}
                accessibilityLabel="Trigger Emergency SOS"
                style={({ pressed }) => [
                  styles.sosHeaderButton,
                  {
                    backgroundColor: colors.red + '22',
                    borderColor: colors.red,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Ionicons name="warning" size={13} color={colors.red} />
                <Text style={[styles.sosHeaderText, { color: colors.red }]}>SOS</Text>
              </Pressable>

              {showSimpleToggle && (
                <Pressable
                  onPress={handleToggleSimpleMode}
                  style={({ pressed }) => [
                    styles.simpleModePill,
                    {
                      backgroundColor: simpleMode ? colors.yellowSoft : colors.separator,
                      borderColor: simpleMode ? colors.yellowBorder : colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Ionicons
                    name={simpleMode ? 'heart' : 'heart-outline'}
                    size={15}
                    color={simpleMode ? colors.yellow : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.simpleModeText,
                      {
                        color: simpleMode ? colors.yellow : colors.textSecondary,
                      },
                    ]}>
                    {simpleMode ? 'Simple' : 'Elderly'}
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {/* Quick Dark / Light Mode Toggle */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
              }
              toggleTheme();
            }}
            accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.cardBackground,
                borderColor: isDark ? colors.brandAccent + '40' : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? '#FBBF24' : colors.brandAccent}
            />
          </Pressable>

          {/* Notifications Bell */}
          <Pressable
            onPress={() => router.push('/modal/notifications')}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="notifications-outline" size={19} color={colors.text} />
            {unreadCount > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.red, borderColor: colors.cardBackground },
                ]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>

          {/* Family Settings Gear Shortcut */}
          {isAuthenticated && (
            <Pressable
              onPress={() => router.push('/modal/family-settings')}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="settings-outline" size={18} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Active SOS Global Alert Banner */}
      {sosAlert?.active && (
        <View style={[styles.sosBannerContainer, { backgroundColor: colors.red }]}>
          <View style={styles.sosBannerRow}>
            <View style={styles.sosBeaconDot}>
              <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosBannerTitle}>
                🚨 SOS ALERT: {sosAlert.senderName?.toUpperCase() || 'FAMILY MEMBER'}
              </Text>
              <Text style={styles.sosBannerSub} numberOfLines={1}>
                {sosAlert.humanLocation || 'Location shared'} • 🔋 {sosAlert.batteryLevel ?? 88}% • {sosAlert.message}
              </Text>
            </View>
            <Pressable
              onPress={dismissSosAlert}
              style={styles.sosDismissButton}>
              <Text style={styles.sosDismissText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Luxury User Profile & Session Modal Sheet */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setProfileModalVisible(false)}>
          <Pressable
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            
            <View style={styles.profileAvatarCenter}>
              <View style={styles.largeAvatarWrap}>
                <FamilyAvatar member={activeUser} size="lg" />
                <View
                  style={[
                    styles.largeAvatarRoleTag,
                    { backgroundColor: colors.brandAccent },
                  ]}>
                  <Text style={styles.largeAvatarRoleText}>
                    {activeUser?.relation || 'Self'}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.profileModalName,
                  { color: colors.text, fontSize: isElderly ? 24 : 20 },
                ]}>
                {user?.name || activeUser?.name || 'You'}
              </Text>

              <View
                style={[
                  styles.accountProviderTag,
                  { backgroundColor: colors.blueSoft, borderColor: colors.blueBorder },
                ]}>
                <Ionicons
                  name={
                    user?.provider === 'google'
                      ? 'logo-google'
                      : user?.provider === 'apple'
                      ? 'logo-apple'
                      : 'mail-outline'
                  }
                  size={14}
                  color={colors.blue}
                />
                <Text style={[styles.accountProviderEmail, { color: colors.blue }]}>
                  {user?.email || (activeUser?.name ? `${activeUser.name.toLowerCase().replace(/\s+/g, '')}@family.com` : 'you@family.com')}
                </Text>
              </View>
            </View>

            {/* Quick Family Metrics Overview */}
            <View
              style={[
                styles.metricsGrid,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.text }]}>
                  {members.length}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Members
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.yellow }]}>
                  {pendingTasks}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Pending Plans
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.green }]}>
                  100%
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Vault Synced
                </Text>
              </View>
            </View>

            {/* Theme & Appearance Segmented Selector */}
            <View
              style={[
                styles.appearanceBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}>
              <View style={styles.appearanceTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={14}
                    color={colors.brandAccent}
                  />
                  <Text style={[styles.appearanceTitle, { color: colors.text }]}>
                    Theme & Appearance
                  </Text>
                </View>
                <Text style={[styles.appearanceActiveBadge, { color: colors.textSecondary }]}>
                  {themePreference === 'system' ? 'System Default' : isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>

              <View
                style={[
                  styles.themeSegmentRow,
                  { backgroundColor: colors.cardBackground, borderColor: colors.borderSubtle },
                ]}>
                {(['light', 'dark', 'system'] as const).map((pref) => {
                  const isSelected = themePreference === pref;
                  return (
                    <Pressable
                      key={pref}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch (e) {}
                        }
                        setThemePreference(pref);
                      }}
                      style={[
                        styles.themeSegmentBtn,
                        isSelected && {
                          backgroundColor: isDark ? '#38BDF8' : colors.brandAccent,
                          borderColor: isDark ? '#38BDF8' : colors.brandAccent,
                        },
                      ]}>
                      <Ionicons
                        name={
                          pref === 'light'
                            ? 'sunny'
                            : pref === 'dark'
                            ? 'moon'
                            : 'phone-portrait-outline'
                        }
                        size={13}
                        color={isSelected ? (isDark ? '#000000' : colors.buttonTextOnAccent) : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.themeSegmentText,
                          {
                            color: isSelected ? (isDark ? '#000000' : colors.buttonTextOnAccent) : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {pref === 'light' ? 'Light' : pref === 'dark' ? 'Dark' : 'System'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonStack}>
              <PrimaryButton
                label="⚙️ Manage Family Members & Space"
                onPress={() => {
                  setProfileModalVisible(false);
                  router.push('/modal/family-settings');
                }}
              />
              <SecondaryButton
                label="📲 Share Family QR Code"
                onPress={() => {
                  setProfileModalVisible(false);
                  setQrModalVisible(true);
                }}
              />
              <SecondaryButton
                label="🔍 Join Family with Code / QR"
                onPress={() => {
                  setProfileModalVisible(false);
                  setJoinModalVisible(true);
                }}
              />
              <SecondaryButton
                label="Switch Account / Sign In"
                onPress={() => {
                  setProfileModalVisible(false);
                  router.push('/login');
                }}
              />
              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.logoutPillButton,
                  {
                    backgroundColor: colors.redSoft,
                    borderColor: colors.redBorder,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Ionicons name="log-out-outline" size={17} color={colors.red} />
                <Text style={[styles.logoutPillText, { color: colors.red }]}>
                  Log Out of Kinly
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Emergency & QR Modals */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        onTriggerSos={async (reason, details) => {
          await sendEmergencySos(reason, details);
        }}
      />
      <FamilyQRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        familyCode={profile.code}
        familyName={profile.name}
      />
      <JoinFamilyModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarHaloWrapper: {
    position: 'relative',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
    gap: 3,
  },
  greetingText: {
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  spacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  spacePillText: {
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  signInHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  simpleModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  simpleModeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  profileCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  profileAvatarCenter: {
    alignItems: 'center',
    gap: 8,
  },
  largeAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  largeAvatarRoleTag: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  largeAvatarRoleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  profileModalName: {
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  accountProviderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  accountProviderEmail: {
    fontWeight: '700',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  buttonStack: {
    gap: 8,
  },
  logoutPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 2,
  },
  logoutPillText: {
    fontWeight: '700',
    fontSize: 14,
  },
  appearanceBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  appearanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appearanceTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  appearanceActiveBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  themeSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  themeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
  },
  themeSegmentText: {
    fontSize: 12,
  },
  sosHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  sosHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosBannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  sosBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosBeaconDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosBannerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  sosDismissButton: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sosDismissText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
