import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { HeaderIconCapsule, StatusDot } from '@/components/ui';

interface PlansHeaderProps {
  onOpenSettings?: () => void;
}

export const PlansHeader: React.FC<PlansHeaderProps> = ({
  onOpenSettings,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme, isElderly } = useAppTheme();
  const { profile, unreadCount } = useFamily();
  const { user } = useAuth();

  const initial = (user?.name?.charAt(0) || profile?.name?.charAt(0) || 'A').toUpperCase();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 4, Platform.OS === 'ios' ? 12 : 8) }]}>
      <View style={styles.topRow}>
        {/* Left: Avatar "A" with Green Online Dot + Title "Family Planner" & Subtitle */}
        <View style={styles.leftIdentityCluster}>
          {/* Circular Avatar with Green Online Dot */}
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F3F0FC',
                  borderColor: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(124, 92, 224, 0.20)',
                },
              ]}>
              <Text
                style={[
                  styles.avatarText,
                  { color: isDark ? '#38BDF8' : '#7C5CE0' },
                ]}>
                {initial}
              </Text>
            </View>
            {/* Green Online Dot with pulsing halo */}
            <StatusDot
              size={12}
              color={colors.green}
              style={styles.onlineDotWrap}
              dotStyle={{ borderWidth: 2, borderColor: '#FFFFFF' }}
            />
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleColumn}>
            <Text
              style={[
                styles.screenTitle,
                { color: colors.text, fontSize: isElderly ? 22 : 19.5 },
              ]}>
              Family Planner
            </Text>
            <Text
              style={[
                styles.screenSubtitle,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              Your family's shared space
            </Text>
          </View>
        </View>

        {/* Right: Actions Grouped in HeaderIconCapsule */}
        <HeaderIconCapsule
          items={[
            {
              id: 'notifications',
              name: 'notifications-outline',
              accessibilityLabel: 'Notifications',
              badgeCount: unreadCount > 0 ? unreadCount : 1,
              badgeColor: colors.red,
              onPress: () => router.push('/modal/notifications'),
            },
            {
              id: 'theme',
              name: isDark ? 'sunny' : 'moon',
              accessibilityLabel: `Switch to ${isDark ? 'Light' : 'Dark'} mode`,
              isActive: !isDark,
              color: isDark ? '#FBBF24' : '#4B3FBF',
              onPress: toggleTheme,
            },
            {
              id: 'settings',
              name: 'settings-outline',
              accessibilityLabel: 'Family Settings',
              onPress: () => {
                if (onOpenSettings) onOpenSettings();
                else router.push('/modal/family-settings');
              },
            },
          ]}
        />
      </View>
    </View>

  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 6,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftIdentityCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  onlineDotWrap: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleColumn: {
    gap: 2,
    justifyContent: 'center',
  },
  screenTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
