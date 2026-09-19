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
import { Button, HeaderIconCapsule } from '@/components/ui';

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
        {/* Right: Actions (Elderly Secondary Pill + HeaderIconCapsule) */}
        <View style={styles.rightActionCluster}>
          <Button
            variant="secondary"
            size="sm"
            icon="people-outline"
            title={simpleMode ? 'Elderly Active' : 'Elderly'}
            onPress={handleToggleElderly}
          />

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
});
