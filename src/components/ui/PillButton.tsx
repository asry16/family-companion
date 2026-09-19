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
import { LinearGradient } from 'expo-linear-gradient';
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
          bg: 'transparent',
          border: 'transparent',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          glow: glowColor || (isDark ? 'rgba(79, 142, 247, 0.40)' : '#8A6BF2'),
        };
      case 'danger':
        return {
          bg: colors.red,
          border: colors.red,
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          glow: glowColor || colors.red,
        };
      case 'success':
        return {
          bg: colors.green,
          border: colors.green,
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          glow: glowColor || colors.green,
        };
      case 'glass':
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
          border: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.16)',
          textColor: isDark ? '#F2F4FF' : colors.text,
          iconColor: isDark ? '#C9CEFF' : colors.text,
          glow: glowColor,
        };
      case 'outline':
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
          border: isDark ? 'rgba(139, 124, 246, 0.50)' : '#7C5CE0',
          textColor: isDark ? '#8B7CF6' : '#7C5CE0',
          iconColor: isDark ? '#8B7CF6' : '#7C5CE0',
          glow: glowColor,
        };
    }
  })();

  // Outer glow in dark mode or soft violet shadow in light mode
  const glowStyle: ViewStyle = isDark && config.glow
    ? {
        shadowColor: config.glow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 4,
      }
    : variant === 'primary' && !isDark
    ? {
        shadowColor: '#8A6BF2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 3,
      }
    : {
        shadowColor: '#6E5ADC',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 6,
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
      {/* Primary Gradient Fill (90deg, #4F8EF7, #8B6CF0) */}
      {variant === 'primary' && (
        <LinearGradient
          colors={['#4F8EF7', '#8B6CF0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}

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
