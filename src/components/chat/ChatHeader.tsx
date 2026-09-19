import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { IconCircleButton } from '@/components/ui/IconCircleButton';

export interface ChatHeaderProps {
  onOpenSettings?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme, isElderly } = useAppTheme();
  const { profile, unreadCount } = useFamily();
  const { user } = useAuth();

  const initial = (user?.name?.charAt(0) || profile?.name?.charAt(0) || 'A').toUpperCase();

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 4, Platform.OS === 'ios' ? 12 : 8) }]}>
      <View style={styles.topRow}>
        {/* Left: Circular Avatar "A" with Green Online Dot + Title "Kinly AI" & Subtitle */}
        <View style={styles.leftIdentityCluster}>
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
              Kinly AI
            </Text>
            <Text
              style={[
                styles.screenSubtitle,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              Right by your side
            </Text>
          </View>
        </View>

        {/* Right: Actions (Theme Toggle, Bell with Badge '1', Settings Gear) */}
        <View style={styles.rightActionCluster}>
          {/* Theme Toggle Button (Moon in Light mode, Sun in Dark mode) */}
          <IconCircleButton
            name={isDark ? 'sunny' : 'moon'}
            size={36}
            iconSize={17}
            color={isDark ? '#FBBF24' : '#7C5CE0'}
            glowColor={isDark ? '#FBBF24' : undefined}
            onPress={toggleTheme}
            accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          />

          {/* Bell with Red Badge "1" */}
          <IconCircleButton
            name="notifications-outline"
            size={36}
            iconSize={17}
            color={isDark ? colors.text : '#6D5BD0'}
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
            color={isDark ? colors.text : '#6D5BD0'}
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
