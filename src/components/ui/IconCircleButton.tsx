import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

export interface IconCircleButtonProps {
  name?: keyof typeof Ionicons.glyphMap;
  icon?: React.ReactNode;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  glowColor?: string;
  onPress?: () => void;
  badgeCount?: number;
  showBadgeDot?: boolean;
  badgeColor?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IconCircleButton: React.FC<IconCircleButtonProps> = ({
  name,
  icon,
  size = 40,
  iconSize = 18,
  color,
  backgroundColor,
  borderColor,
  glowColor,
  onPress,
  badgeCount = 0,
  showBadgeDot = false,
  badgeColor,
  accessibilityLabel,
  disabled = false,
  style,
}) => {
  const { colors, isDark } = useAppTheme();

  const handlePress = () => {
    if (disabled || !onPress) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    onPress();
  };

  const resolvedColor = color || (isDark ? colors.text : colors.text);
  const resolvedBg =
    backgroundColor ||
    (isDark ? 'rgba(15, 26, 58, 0.85)' : 'rgba(255, 255, 255, 0.85)');
  const resolvedBorder =
    borderColor ||
    (isDark ? 'rgba(59, 111, 240, 0.25)' : 'rgba(124, 92, 224, 0.14)');
  const resolvedBadgeColor = badgeColor || colors.red;

  const glowShadow: ViewStyle = glowColor
    ? isDark
      ? {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.45,
          shadowRadius: 8,
          elevation: 4,
        }
      : {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 2,
        }
    : {
        shadowColor: isDark ? '#000000' : '#6E5ADC',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 6,
        elevation: 2,
      };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: resolvedBg,
          borderColor: resolvedBorder,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
          transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
          ...glowShadow,
        },
        style,
      ]}>
      {icon ? (
        icon
      ) : name ? (
        <Ionicons name={name} size={iconSize} color={resolvedColor} />
      ) : null}

      {/* Numerical Badge or Notification Dot */}
      {badgeCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: resolvedBadgeColor }]}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      ) : showBadgeDot ? (
        <View style={[styles.dot, { backgroundColor: resolvedBadgeColor }]} />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  dot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
