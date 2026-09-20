import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'brand' | 'green' | 'red' | 'blue';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'normal' | 'large' | 'elderly';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  icon,
  variant = 'brand',
  disabled = false,
  loading = false,
  style,
  textStyle,
  size = 'normal',
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(
          variant === 'red'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        );
      } catch (e) {}
    }
    onPress();
  };

  const isLarge = size === 'large' || isElderly;

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (disabled) {
      return isDark
        ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)']
        : ['rgba(124, 92, 224, 0.12)', 'rgba(124, 92, 224, 0.08)'];
    }
    if (isElderly && variant === 'brand') {
      return ['#FDE047', '#FACC15'];
    }
    switch (variant) {
      case 'green':
        return ['#2DD4BF', '#22C58B'];
      case 'red':
        return ['#FF4D7A', '#E11D48'];
      case 'blue':
      case 'brand':
      default:
        return ['#4F8EF7', '#8A6BF2'];
    }
  };

  const getGlowColor = (): string | undefined => {
    if (disabled) return undefined;
    if (isElderly && variant === 'brand') return '#FDE047';
    switch (variant) {
      case 'green':
        return isDark ? 'rgba(45, 212, 191, 0.40)' : 'rgba(46, 191, 142, 0.35)';
      case 'red':
        return isDark ? 'rgba(255, 77, 122, 0.45)' : 'rgba(225, 29, 72, 0.30)';
      case 'blue':
      case 'brand':
      default:
        return isDark ? 'rgba(79, 142, 247, 0.40)' : '#8A6BF2';
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? 'rgba(255, 255, 255, 0.35)' : colors.textMuted;
    if (isElderly && variant === 'brand') return '#000000';
    return '#FFFFFF';
  };

  const glow = getGlowColor();
  const glowStyle: ViewStyle = glow
    ? {
        shadowColor: glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.40 : 0.28,
        shadowRadius: 10,
        elevation: 4,
      }
    : {};

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: isLarge ? 56 : 46,
          borderRadius: Radius.full,
          opacity: disabled ? 0.6 : pressed ? 0.90 : 1,
          transform: [{ scale: pressed && !disabled ? 0.975 : 1 }],
          ...glowStyle,
        },
        style,
      ]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: Radius.full }]}
      />
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: isLarge ? 17 : 15,
                fontWeight: '700',
              },
              textStyle,
            ]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    position: 'relative',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
