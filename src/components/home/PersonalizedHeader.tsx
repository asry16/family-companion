import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';

interface PersonalizedHeaderProps {
  onOpenSettings?: () => void;
}

export const PersonalizedHeader: React.FC<PersonalizedHeaderProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const { colors, isElderly, themePreference, setThemePreference, toggleTheme, isDark } = useAppTheme();
  const { profile, activeUser, members, tasks, unreadCount, sosAlert, dismissSosAlert } = useFamily();
  const { user, isAuthenticated, signOut } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 18;
  const greetingText = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';
  const timeIcon = isNight ? '🌙' : hour < 12 ? '☀️' : '🌤️';

  const rawName = user?.name || activeUser?.name || 'Asmita';
  const firstName = rawName.split(' ')[0] || 'Asmita';

  const safeCount = members.filter((m) => m.availability !== 'offline').length;
  const totalCount = members.length || 1;
  const allSafe = safeCount >= totalCount;

  const handleSignOut = async () => {
    setProfileModalVisible(false);
    await signOut();
    router.replace('/login');
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted).length;

  return (
    <>
      <View style={styles.headerContainer}>
        {/* Top Profile & Greeting Row */}
        <View style={styles.topRow}>
          {/* Left: Avatar with Online Halo */}
          <Pressable
            onPress={() => {
              if (isAuthenticated) {
                setProfileModalVisible(true);
              } else {
                router.push('/login');
              }
            }}
            accessibilityLabel="Open User Profile"
            style={({ pressed }) => [
              styles.avatarPressable,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <View
              style={[
                styles.avatarRing,
                {
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.25)',
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                },
              ]}>
              <FamilyAvatar member={activeUser} size="md" showStatus={false} />
              <View style={[styles.avatarStatusBadge, { backgroundColor: colors.green }]} />
            </View>
          </Pressable>

          {/* Center: Deco Greeting & Name */}
          <View style={styles.greetingBlock}>
            <View style={styles.greetingLine}>
              <Text
                style={[
                  styles.decoGreeting,
                  {
                    color: isDark ? '#94A3B8' : '#64748B',
                  },
                ]}>
                {greetingText.toUpperCase()}
              </Text>
              <Text style={styles.timeEmoji}>{timeIcon}</Text>
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.userNameText,
                {
                  color: colors.text,
                  fontSize: isElderly ? 26 : 22,
                },
              ]}>
              {firstName}
            </Text>

            {/* Glowing Safety Status */}
            <View style={styles.safetyStatusRow}>
              <View
                style={[
                  styles.statusBeaconOuter,
                  { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)' },
                ]}>
                <View style={[styles.statusBeaconInner, { backgroundColor: colors.green }]} />
              </View>
              <Text style={[styles.safetyStatusText, { color: isDark ? '#34D399' : '#059669' }]}>
                {allSafe ? `All ${totalCount} members safe` : `${safeCount} of ${totalCount} safe`}
              </Text>
              <Text style={[styles.safetyDotSeparator, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.safetySubText, { color: colors.textSecondary }]}>
                Vault synced
              </Text>
            </View>
          </View>

          {/* Right: Frosted Circular Actions */}
          <View style={styles.actionsCluster}>
            {/* Theme Toggle Button */}
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
                styles.circleBtn,
                {
                  backgroundColor: isDark ? 'rgba(21, 31, 51, 0.85)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={17}
                color={isDark ? '#FBBF24' : '#2563EB'}
              />
            </Pressable>

            {/* Notifications Button */}
            <Pressable
              onPress={() => router.push('/modal/notifications')}
              accessibilityLabel="Notifications"
              style={({ pressed }) => [
                styles.circleBtn,
                {
                  backgroundColor: isDark ? 'rgba(21, 31, 51, 0.85)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="notifications-outline" size={17} color={colors.text} />
              {unreadCount > 0 && (
                <View style={[styles.unreadDot, { backgroundColor: colors.red }]}>
                  <Text style={styles.unreadDotText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>

            {/* Settings Gear */}
            <Pressable
              onPress={() => {
                if (onOpenSettings) {
                  onOpenSettings();
                } else {
                  router.push('/modal/family-settings');
                }
              }}
              accessibilityLabel="Settings"
              style={({ pressed }) => [
                styles.circleBtn,
                {
                  backgroundColor: isDark ? 'rgba(21, 31, 51, 0.85)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="settings-outline" size={17} color={colors.text} />
            </Pressable>
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
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            
            <View style={styles.profileAvatarCenter}>
              <View style={styles.largeAvatarWrap}>
                <FamilyAvatar member={activeUser} size="lg" />
                <View
                  style={[
                    styles.largeAvatarRoleTag,
                    { backgroundColor: isDark ? '#38BDF8' : colors.brandAccent },
                  ]}>
                  <Text style={[styles.largeAvatarRoleText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
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
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#EFF6FF',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BFDBFE',
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
                  color={isDark ? '#38BDF8' : '#2563EB'}
                />
                <Text style={[styles.accountProviderEmail, { color: isDark ? '#38BDF8' : '#2563EB' }]}>
                  {user?.email || (activeUser?.name ? `${activeUser.name.toLowerCase().replace(/\s+/g, '')}@family.com` : 'you@family.com')}
                </Text>
              </View>
            </View>

            {/* Quick Metrics Overview */}
            <View
              style={[
                styles.metricsGrid,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
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
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: colors.yellow }]}>
                  {pendingTasks}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Pending
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]} />
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
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                },
              ]}>
              <View style={styles.appearanceTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={14}
                    color={isDark ? '#38BDF8' : colors.brandAccent}
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
                    backgroundColor: isDark ? '#151F33' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
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
                        color={isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.themeSegmentText,
                          {
                            color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.text,
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
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 8,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    padding: 2.5,
    borderRadius: 30,
    borderWidth: 1.5,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  greetingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  // Art Deco styled typographic treatment
  decoGreeting: {
    fontFamily: Platform.select({ ios: 'Didot', android: 'serif', default: 'Didot, Georgia, serif' }),
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  timeEmoji: {
    fontSize: 12,
  },
  userNameText: {
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: -1,
  },
  safetyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
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
