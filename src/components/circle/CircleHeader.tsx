import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { IconCircleButton } from '@/components/ui/IconCircleButton';
import { CircleTokens } from '@/constants/theme';

interface CircleHeaderProps {
  onBack?: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
}

export const CircleHeader: React.FC<CircleHeaderProps> = ({
  onBack,
  onOpenSettings,
  onOpenNotifications,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { profile, members, unreadCount } = useFamily();
  const { user } = useAuth();

  const familyName = profile?.name || user?.familyName || 'Family';
  const memberCount = members?.length || 1;
  const memberText = memberCount === 1 ? '1 member' : `${memberCount} members`;

  // Green dot pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleBack = () => {
    triggerHaptic();
    if (onBack) {
      onBack();
    } else {
      router.navigate('/(tabs)');
    }
  };

  const handleSettings = () => {
    triggerHaptic();
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      router.push('/modal/family-settings');
    }
  };

  const handleNotifications = () => {
    triggerHaptic();
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      router.push('/modal/notifications');
    }
  };

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: Math.max(insets.top + 4, Platform.OS === 'ios' ? 12 : 8) },
      ]}>
      <View style={styles.contentRow}>
        {/* Left: 40px Circular Back Button */}
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityLabel="Back to Home"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(20, 32, 58, 0.04)',
              borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDark ? '#C9CEFF' : '#475569'}
          />
        </Pressable>

        {/* Center-Left Cluster: 44px Circular Group Icon + Titles */}
        <View style={styles.titleCluster}>
          <LinearGradient
            colors={['#4F8EF7', '#8B6CF0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.groupIconCircle,
              {
                borderColor: isDark ? 'rgba(140, 150, 255, 0.35)' : 'rgba(124, 92, 224, 0.25)',
              },
            ]}>
            <Ionicons name="people" size={22} color="#FFFFFF" />
          </LinearGradient>

          <View style={styles.textColumn}>
            <Text
              numberOfLines={1}
              style={[styles.headerTitle, { color: colors.text }]}>
              Family Circle
            </Text>
            <View style={styles.subtitleRow}>
              <Animated.View
                style={[
                  styles.pulsingGreenDot,
                  {
                    backgroundColor: colors.green,
                    opacity: pulseAnim,
                  },
                ]}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.subtitleText,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                {familyName} • {memberText}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Three 40px Circular Buttons */}
        <View style={styles.actionCluster}>
          {/* Bell with red badge */}
          <IconCircleButton
            name="notifications-outline"
            size={CircleTokens.headerButtonSize}
            iconSize={18}
            color={isDark ? '#C9CEFF' : '#5B628F'}
            badgeCount={unreadCount > 0 ? unreadCount : 1}
            badgeColor="#FF4D6A"
            onPress={handleNotifications}
            accessibilityLabel="Notifications"
          />

          {/* Theme Toggle: Moon in dark, Sun in light */}
          <IconCircleButton
            name={isDark ? 'moon' : 'sunny'}
            size={CircleTokens.headerButtonSize}
            iconSize={18}
            color={isDark ? '#C9CEFF' : '#F59E0B'}
            onPress={toggleTheme}
            accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          />

          {/* Settings Gear */}
          <IconCircleButton
            name="settings-outline"
            size={CircleTokens.headerButtonSize}
            iconSize={18}
            color={isDark ? '#C9CEFF' : '#5B628F'}
            onPress={handleSettings}
            accessibilityLabel="Family Settings"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: CircleTokens.headerButtonSize,
    height: CircleTokens.headerButtonSize,
    borderRadius: CircleTokens.headerButtonSize / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  groupIconCircle: {
    width: CircleTokens.headerGroupIconSize,
    height: CircleTokens.headerGroupIconSize,
    borderRadius: CircleTokens.headerGroupIconSize / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#8B6CF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulsingGreenDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
    includeFontPadding: false,
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
});
