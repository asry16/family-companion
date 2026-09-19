import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { IconCircleButton } from '@/components/ui/IconCircleButton';

import { HeaderAmbientArt } from './HeaderAmbientArt';

interface PersonalizedHeaderProps {
  onOpenSettings?: () => void;
}

export const PersonalizedHeader: React.FC<PersonalizedHeaderProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isElderly, themePreference, setThemePreference, toggleTheme, isDark } = useAppTheme();
  const { profile, activeUser, members, tasks, unreadCount, sosAlert, dismissSosAlert } = useFamily();
  const { user, isAuthenticated, signOut } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const rawName = user?.name || activeUser?.name || 'Friend';
  const firstName = rawName.split(' ')[0] || 'Friend';

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning,' : currentHour < 17 ? 'Good afternoon,' : 'Good evening,';

  const handleSignOut = async () => {
    setProfileModalVisible(false);
    await signOut();
    router.replace('/login');
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted).length;

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 6, Platform.OS === 'ios' ? 12 : 10) }]}>
        {/* Ambient Top Background Illustration (Light: Faint leaf / Dark: Stars, shooting star, mountain silhouette) */}
        <HeaderAmbientArt />

        {/* Top Profile & Greeting Row */}
        <View style={styles.topRow}>
          {/* Left: Greeting Block */}
          <View style={styles.greetingBlock}>
            <Text
              style={[
                styles.decoGreeting,
                {
                  color: isDark ? colors.textMuted : colors.textSecondary,
                },
              ]}>
              {timeGreeting}
            </Text>

            <View style={styles.nameRow}>
              <Text
                numberOfLines={1}
                style={[
                  styles.userNameText,
                  {
                    color: colors.text,
                    fontSize: isElderly ? 24 : 22,
                  },
                ]}>
                {firstName}
              </Text>
              <Text style={styles.moonEmoji}>🌙</Text>
            </View>

            {/* Below it: green dot + "Your family is safe" */}
            <View style={styles.safeStatusRow}>
              <View style={[styles.statusBeaconOuter, { backgroundColor: isDark ? 'rgba(34, 197, 139, 0.22)' : 'rgba(46, 191, 142, 0.16)' }]}>
                <View style={[styles.statusBeaconInner, { backgroundColor: colors.green }]} />
              </View>
              <Text style={[styles.safeStatusText, { color: isDark ? colors.green : '#2EBF8E' }]}>
                Your family is safe
              </Text>
            </View>
          </View>

          {/* Right: Three Circular Icon Buttons (bell with red dot, sun = theme toggle, settings gear) */}
          <View style={styles.actionsCluster}>
            {/* 1. Bell with Red Notification Dot */}
            <IconCircleButton
              name="notifications-outline"
              size={40}
              iconSize={18}
              color={isDark ? '#C9CEFF' : '#6D5BD0'}
              showBadgeDot={true}
              badgeColor={colors.red}
              onPress={() => router.push('/modal/notifications')}
              accessibilityLabel="Notifications"
            />

            {/* 2. Sun/Moon = Theme Toggle */}
            <IconCircleButton
              name={isDark ? 'sunny' : 'moon'}
              size={40}
              iconSize={18}
              color={isDark ? '#FBBF24' : '#6D5BD0'}
              glowColor={isDark ? '#FBBF24' : undefined}
              onPress={toggleTheme}
              accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            />

            {/* 3. Settings Gear */}
            <IconCircleButton
              name="settings-outline"
              size={40}
              iconSize={18}
              color={isDark ? '#C9CEFF' : '#6D5BD0'}
              onPress={() => {
                if (onOpenSettings) {
                  onOpenSettings();
                } else {
                  router.push('/modal/family-settings');
                }
              }}
              accessibilityLabel="Settings"
            />
          </View>
        </View>

        {/* Active Global SOS Alert Banner */}
        {sosAlert?.active && (
          <View style={[styles.sosBannerContainer, { backgroundColor: colors.red }]}>
            <View style={styles.sosBannerRow}>
              <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.sosBannerTitle}>
                  🚨 SOS ALERT: {sosAlert.senderName?.toUpperCase() || 'FAMILY MEMBER'}
                </Text>
                <Text style={styles.sosBannerSub} numberOfLines={1}>
                  {sosAlert.humanLocation || 'Location shared'} • 🔋 {sosAlert.batteryLevel ?? 88}% • {sosAlert.message}
                </Text>
              </View>
              <Pressable onPress={dismissSosAlert} style={styles.sosDismissButton}>
                <Text style={styles.sosDismissText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Luxury User Profile Modal */}
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
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.95)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            
            <View style={styles.profileAvatarCenter}>
              <View style={styles.largeAvatarWrap}>
                <FamilyAvatar member={activeUser} size="lg" />
                <View
                  style={[
                    styles.largeAvatarRoleTag,
                    { backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0' },
                  ]}>
                  <Text style={[styles.largeAvatarRoleText, { color: '#FFFFFF' }]}>
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
                  {
                    backgroundColor: isDark ? 'rgba(139, 124, 246, 0.12)' : 'rgba(124, 92, 224, 0.08)',
                    borderColor: isDark ? 'rgba(139, 124, 246, 0.30)' : 'rgba(124, 92, 224, 0.20)',
                  },
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
                  color={isDark ? '#8B7CF6' : '#7C5CE0'}
                />
                <Text style={[styles.accountProviderEmail, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>
                  {user?.email || (activeUser?.name ? `${activeUser.name.toLowerCase().replace(/\s+/g, '')}@family.com` : 'you@family.com')}
                </Text>
              </View>
            </View>

            {/* Quick Metrics Overview */}
            <View
              style={[
                styles.metricsGrid,
                {
                  backgroundColor: isDark ? 'rgba(11, 16, 48, 0.65)' : '#F8F7FF',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                },
              ]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.text }]}>
                  {members.length}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Members
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)' }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.yellow }]}>
                  {pendingTasks}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Pending
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)' }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.green }]}>
                  100%
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Synced
                </Text>
              </View>
            </View>

            {/* Theme & Appearance Segmented Selector */}
            <View
              style={[
                styles.appearanceBox,
                {
                  backgroundColor: isDark ? 'rgba(11, 16, 48, 0.65)' : '#F8F7FF',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                },
              ]}>
              <View style={styles.appearanceTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={14}
                    color={isDark ? '#8B7CF6' : '#7C5CE0'}
                  />
                  <Text style={[styles.appearanceTitle, { color: colors.text }]}>
                    Theme & Appearance
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.themeSegmentRow,
                  {
                    backgroundColor: isDark ? 'rgba(20, 27, 74, 0.8)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : '#E2E8F0',
                  },
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
                          backgroundColor: isDark ? '#8B7CF6' : colors.brandAccent,
                          borderColor: isDark ? '#8B7CF6' : colors.brandAccent,
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
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.themeSegmentText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontWeight: isSelected ? '800' : '500',
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
            <View style={styles.modalActionButtons}>
              <Pressable
                onPress={() => {
                  setProfileModalVisible(false);
                  router.push('/modal/family-settings');
                }}
                style={({ pressed }) => [
                  styles.modalSecondaryBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : '#E2E8F0',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Ionicons name="settings-outline" size={16} color={colors.text} />
                <Text style={[styles.modalSecondaryBtnText, { color: colors.text }]}>
                  Family Settings
                </Text>
              </Pressable>

              {isAuthenticated && (
                <Pressable
                  onPress={handleSignOut}
                  style={({ pressed }) => [
                    styles.signOutBtn,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons name="log-out-outline" size={16} color={colors.red} />
                  <Text style={[styles.signOutBtnText, { color: colors.red }]}>
                    Sign Out
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  greetingBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  decoGreeting: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
    fontStyle: 'italic',
    fontSize: 14,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  moonEmoji: {
    fontSize: 18,
    marginTop: -2,
  },
  safeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  safeStatusText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  statusBeaconOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBeaconInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safetyStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  safetyDotSeparator: {
    fontSize: 10,
  },
  safetySubText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  unreadDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // SOS Banner
  sosBannerContainer: {
    padding: 12,
    borderRadius: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  sosBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosBannerTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sosBannerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    marginTop: 1,
  },
  sosDismissButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sosDismissText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Profile Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  profileAvatarCenter: {
    alignItems: 'center',
    gap: 8,
  },
  largeAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarRoleTag: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  largeAvatarRoleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  profileModalName: {
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.3,
  },
  accountProviderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountProviderEmail: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  appearanceBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  appearanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appearanceTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeSegmentRow: {
    flexDirection: 'row',
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
    fontSize: 11.5,
  },
  modalActionButtons: {
    gap: 8,
    marginTop: 4,
  },
  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
