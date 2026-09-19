import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { Button, HeaderIconCapsule } from '@/components/ui';

interface CircleHeaderProps {
  onOpenFamilySwitcher?: () => void;
  onOpenSos?: () => void;
  onOpenSettings?: () => void;
}

export const CircleHeader: React.FC<CircleHeaderProps> = ({
  onOpenFamilySwitcher,
  onOpenSos,
  onOpenSettings,
}) => {

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme, isElderly } = useAppTheme();
  const { profile, members, unreadCount, simpleMode, setSimpleMode } = useFamily();
  const { user } = useAuth();

  const familyName = profile?.name || "The A Family";
  const memberCount = members?.length || 1;
  const initial = (user?.name?.charAt(0) || profile?.name?.charAt(0) || 'A').toUpperCase();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleToggleElderly = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSimpleMode(!simpleMode);
  };


  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 4, Platform.OS === 'ios' ? 12 : 8) }]}>
      {/* Top Row: Avatar & Title + Right Icon Actions */}
      <View style={styles.topRow}>
        {/* Left: Avatar with green online dot + Title and Family Switcher Pill */}
        <View style={styles.leftIdentityCluster}>
          {/* Circular Avatar "A" with Green Online Dot */}
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F3F0FC',
                  borderColor: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(124, 92, 224, 0.2)',
                },
              ]}>
              <Text
                style={[
                  styles.avatarInitialText,
                  { color: isDark ? '#38BDF8' : '#7C5CE0' },
                ]}>
                {initial}
              </Text>
            </View>
            <View style={[styles.onlineBeaconDot, { backgroundColor: colors.green }]} />
          </View>

          {/* Title & Switcher Pill */}
          <View style={styles.titleColumn}>
            <Text
              style={[
                styles.screenTitle,
                { color: colors.text, fontSize: isElderly ? 22 : 19 },
              ]}>
              Family Circle
            </Text>

            {/* Tappable Pill: green dot, "The A Family • 1 member connected", chevron */}
            <Pressable
              onPress={() => {
                triggerHaptic();
                if (onOpenFamilySwitcher) {
                  onOpenFamilySwitcher();
                } else {
                  router.push('/modal/family-settings');
                }
              }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.switcherPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 92, 224, 0.14)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <View style={[styles.pillGreenDot, { backgroundColor: colors.green }]} />
              <Text
                numberOfLines={1}
                style={[
                  styles.switcherPillText,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                {familyName} • {memberCount} {memberCount === 1 ? 'member' : 'members'} connected
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={isDark ? colors.textMuted : colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Right: Quick Action Controls Grouped in Capsule */}
        <HeaderIconCapsule
          items={[
            {
              id: 'theme',
              name: isDark ? 'sunny' : 'moon',
              accessibilityLabel: `Switch to ${isDark ? 'Light' : 'Dark'} mode`,
              isActive: !isDark,
              color: isDark ? '#FBBF24' : '#4B3FBF',
              onPress: toggleTheme,
            },
            {
              id: 'notifications',
              name: 'notifications-outline',
              accessibilityLabel: 'Notifications',
              badgeCount: unreadCount > 0 ? unreadCount : 1,
              badgeColor: colors.red,
              onPress: () => router.push('/modal/notifications'),
            },
            {
              id: 'settings',
              name: 'settings-outline',
              accessibilityLabel: 'Settings',
              onPress: () => {
                if (onOpenSettings) {
                  onOpenSettings();
                } else {
                  router.push('/modal/family-settings');
                }
              },
            },
          ]}
        />
      </View>

      {/* Chips Bar: SOS (secondary danger) and Elderly (secondary) */}
      <View style={styles.chipsBarRow}>
        <Button
          variant="secondary"
          colorScheme="danger"
          size="sm"
          icon="warning-outline"
          title="SOS"
          onPress={onOpenSos}
        />

        <Button
          variant="secondary"
          size="sm"
          icon="people-outline"
          title={simpleMode ? 'Elderly Active' : 'Elderly'}
          onPress={handleToggleElderly}
        />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 4,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftIdentityCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 18,
    fontWeight: '800',
  },
  onlineBeaconDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  switcherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  switcherPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rightActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipsBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
});

