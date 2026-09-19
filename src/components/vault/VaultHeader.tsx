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

interface VaultHeaderProps {
  onOpenSettings?: () => void;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme, isElderly } = useAppTheme();
  const { profile, unreadCount, simpleMode, setSimpleMode } = useFamily();
  const { user } = useAuth();

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
      <View style={styles.topRow}>
        {/* Left: Avatar "A" with Green Check Badge + Title "Family Hub" & Subtitle */}
        <View style={styles.leftIdentityCluster}>
          {/* Circular Avatar with Green Check Badge */}
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
            {/* Green Check Badge */}
            <View style={[styles.checkBadgeWrap, { backgroundColor: colors.green }]}>
              <Ionicons name="checkmark" size={9} color="#FFFFFF" />
            </View>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleColumn}>
            <Text
              style={[
                styles.screenTitle,
                { color: colors.text, fontSize: isElderly ? 22 : 19.5 },
              ]}>
              Family Hub
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

        {/* Right: Actions (Elderly Outlined Pill, Theme Toggle, Bell, Settings) */}
        <View style={styles.rightActionCluster}>
          {/* "Elderly" Outlined Pill (people icon; toggles elderly mode) */}
          <Pressable
            onPress={handleToggleElderly}
            style={({ pressed }) => [
              styles.elderlyPill,
              {
                borderColor: simpleMode
                  ? colors.blue
                  : isDark
                  ? 'rgba(59, 111, 240, 0.45)'
                  : 'rgba(59, 111, 240, 0.35)',
                backgroundColor: simpleMode
                  ? isDark
                    ? 'rgba(59, 111, 240, 0.25)'
                    : 'rgba(59, 111, 240, 0.12)'
                  : isDark
                  ? 'rgba(59, 111, 240, 0.08)'
                  : 'rgba(59, 111, 240, 0.05)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name={simpleMode ? 'people' : 'people-outline'}
              size={13}
              color={colors.blue}
            />
            <Text style={[styles.elderlyPillText, { color: colors.blue }]}>
              Elderly
            </Text>
          </Pressable>

          {/* Theme Toggle Button (sun in light mode, moon in dark mode) */}
          <IconCircleButton
            name={isDark ? 'moon' : 'sunny'}
            size={36}
            iconSize={17}
            color={isDark ? '#FBBF24' : colors.blue}
            glowColor={isDark ? '#FBBF24' : undefined}
            onPress={toggleTheme}
            accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          />

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

          {/* Settings Gear */}
          <IconCircleButton
            name="settings-outline"
            size={36}
            iconSize={17}
            color={colors.text}
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
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leftIdentityCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarContainer: {
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
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  checkBadgeWrap: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  titleColumn: {
    flex: 1,
    gap: 1,
  },
  screenTitle: {
    fontWeight: '700',
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
  elderlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  elderlyPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
