import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/theme';

export type PillButtonVariant = 'primary' | 'glass' | 'outline' | 'danger' | 'success';
export type PillButtonSize = 'sm' | 'md' | 'lg';

export interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: PillButtonVariant;
  size?: PillButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  glowColor?: string;
  accessibilityLabel?: string;
}

export const PillButton: React.FC<PillButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  glowColor,
  accessibilityLabel,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(
          variant === 'danger'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        );
      } catch (e) {}
    }
    onPress();
  };

  // Resolve Colors & Glow per variant
  const config = (() => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.blue,
          border: colors.blue,
          textColor: isDark ? '#000000' : '#FFFFFF',
          iconColor: isDark ? '#000000' : '#FFFFFF',
          glow: glowColor || colors.blue,
        };
      case 'danger':
        return {
          bg: colors.red,
          border: colors.red,
          textColor: isDark ? '#000000' : '#FFFFFF',
          iconColor: isDark ? '#000000' : '#FFFFFF',
          glow: glowColor || colors.red,
        };
      case 'success':
        return {
          bg: colors.green,
          border: colors.green,
          textColor: isDark ? '#000000' : '#FFFFFF',
          iconColor: isDark ? '#000000' : '#FFFFFF',
          glow: glowColor || colors.green,
        };
      case 'glass':
        return {
          bg: isDark ? 'rgba(15, 26, 58, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          border: isDark ? 'rgba(59, 111, 240, 0.28)' : 'rgba(20, 32, 58, 0.12)',
          textColor: colors.text,
          iconColor: colors.text,
          glow: glowColor || (isDark ? colors.blue : undefined),
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: isDark ? 'rgba(59, 111, 240, 0.45)' : colors.blue,
          textColor: isDark ? colors.blue : colors.blue,
          iconColor: isDark ? colors.blue : colors.blue,
          glow: glowColor || (isDark ? colors.blue : undefined),
        };
    }
  })();

  // Outer glow in dark mode
  const glowStyle: ViewStyle = isDark && config.glow
    ? {
        shadowColor: config.glow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 4,
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.06,
        shadowRadius: 5,
        elevation: 2,
      };

  // Sizing
  const sizeStyles: ViewStyle = (() => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          minHeight: 32,
        };
      case 'lg':
        return {
          paddingHorizontal: 22,
          paddingVertical: 14,
          minHeight: isElderly ? 58 : 50,
        };
      case 'md':
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 10,
          minHeight: 40,
        };
    }
  })();

  const fontSize = (() => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return isElderly ? 18 : 16;
      case 'md':
      default:
        return 13.5;
    }
  })();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={({ pressed }) => [
        styles.baseButton,
        sizeStyles,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
          ...glowStyle,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={config.textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={fontSize + 2}
              color={config.iconColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                color: config.textColor,
                fontSize,
                fontWeight: '700',
              },
              textStyle,
            ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={fontSize + 2}
              color={config.iconColor}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: -0.1,
  },
});
