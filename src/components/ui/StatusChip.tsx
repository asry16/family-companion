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
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

export type StatusChipVariant = 'Safe' | 'All good' | 'View' | 'Vault';

export interface StatusChipProps {
  variant?: StatusChipVariant;
  label?: string;
  showDot?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  variant = 'Safe',
  label,
  showDot = true,
  onPress,
  style,
  size = 'md',
}) => {
  const { colors, isDark } = useAppTheme();

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
      onPress();
    }
  };

  const config = (() => {
    switch (variant) {
      case 'Safe':
        return {
          defaultText: 'Safe',
          accent: colors.green,
          softBg: isDark ? 'rgba(34, 197, 139, 0.18)' : 'rgba(34, 197, 139, 0.12)',
          border: isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(34, 197, 139, 0.22)',
          glow: colors.green,
        };
      case 'All good':
        return {
          defaultText: 'All good',
          accent: colors.blue,
          softBg: isDark ? 'rgba(59, 111, 240, 0.18)' : 'rgba(59, 111, 240, 0.12)',
          border: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(59, 111, 240, 0.22)',
          glow: colors.blue,
        };
      case 'Vault':
        return {
          defaultText: 'Vault',
          accent: colors.purple,
          softBg: isDark ? 'rgba(124, 92, 224, 0.18)' : 'rgba(124, 92, 224, 0.12)',
          border: isDark ? 'rgba(124, 92, 224, 0.35)' : 'rgba(124, 92, 224, 0.22)',
          glow: colors.purple,
        };
      case 'View':
        return {
          defaultText: 'View',
          accent: isDark ? colors.yellow : '#D97706',
          softBg: isDark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(245, 158, 11, 0.12)',
          border: isDark ? 'rgba(251, 191, 36, 0.35)' : 'rgba(245, 158, 11, 0.22)',
          glow: colors.yellow,
        };
      default:
        return {
          defaultText: 'Safe',
          accent: colors.green,
          softBg: isDark ? 'rgba(34, 197, 139, 0.18)' : 'rgba(34, 197, 139, 0.12)',
          border: isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(34, 197, 139, 0.22)',
          glow: colors.green,
        };
    }
  })();

  const textToDisplay = label || config.defaultText;
  const isSmall = size === 'sm';

  const glowShadow: ViewStyle = isDark
    ? {
        shadowColor: config.glow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.32,
        shadowRadius: 6,
        elevation: 3,
      }
    : {
        shadowColor: '#14203A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      };

  const chipBaseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmall ? 4 : 5,
    paddingHorizontal: isSmall ? 7 : 9,
    paddingVertical: isSmall ? 3 : 4.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: config.border,
    backgroundColor: config.softBg,
    ...glowShadow,
  };

  const content = (
    <>
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: config.accent,
              width: isSmall ? 5 : 6,
              height: isSmall ? 5 : 6,
              borderRadius: isSmall ? 2.5 : 3,
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: config.accent,
            fontSize: isSmall ? 10.5 : 12,
          },
        ]}>
        {textToDisplay}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          chipBaseStyle,
          {
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
          style,
        ]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[chipBaseStyle, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  dot: {},
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
