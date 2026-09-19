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
import { IconCircleButton } from '@/components/ui/IconCircleButton';

interface PlansHeaderProps {
  onOpenSos?: () => void;
  onOpenSettings?: () => void;
}

export const PlansHeader: React.FC<PlansHeaderProps> = ({
  onOpenSos,
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
                  backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(59, 111, 240, 0.2)',
                },
              ]}>
              <Text
                style={[
                  styles.avatarText,
                  { color: isDark ? '#38BDF8' : colors.blue },
                ]}>
                {initial}
              </Text>
            </View>
            {/* Green Online Dot */}
            <View style={[styles.onlineDotWrap, { backgroundColor: colors.green }]} />
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

        {/* Right: Actions (Red Outlined SOS, Bell with Badge '1', Theme Toggle, Settings Gear) */}
        <View style={styles.rightActionCluster}>
          {/* Red Outlined "SOS" Chip */}
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              if (onOpenSos) onOpenSos();
            }}
            hitSlop={6}
            accessibilityLabel="SOS Emergency Flow"
            style={({ pressed }) => [
              styles.sosChip,
              {
                borderColor: isDark ? 'rgba(240, 82, 77, 0.70)' : colors.red,
                backgroundColor: isDark ? 'rgba(240, 82, 77, 0.14)' : 'rgba(240, 82, 77, 0.08)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="warning-outline" size={13} color={colors.red} />
            <Text style={[styles.sosChipText, { color: colors.red }]}>SOS</Text>
          </Pressable>

          {/* Bell with Red Badge "1" */}
          <IconCircleButton
            name="notifications-outline"
            size={36}
            iconSize={17}
            color={colors.text}
            badgeCount={unreadCount > 0 ? unreadCount : 1}
            badgeColor={colors.red}
            onPress={() => router.push('/modal/notifications')}
            accessibilityLabel="Notifications"
          />

          {/* Single Theme Toggle Button (Moon in Light mode, Sun in Dark mode) */}
          <IconCircleButton
            name={isDark ? 'sunny' : 'moon'}
            size={36}
            iconSize={17}
            color={isDark ? '#FBBF24' : colors.blue}
            glowColor={isDark ? '#FBBF24' : undefined}
            onPress={toggleTheme}
            accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          />

          {/* Settings Gear */}
          <IconCircleButton
            name="settings-outline"
            size={36}
            iconSize={17}
            color={colors.text}
            onPress={() => {
              if (onOpenSettings) onOpenSettings();
              else router.push('/modal/family-settings');
            }}
            accessibilityLabel="Family Settings"
          />
        </View>
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
  sosChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  sosChipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
