import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/constants/theme';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  glowColor?: string;
  borderRadius?: number;
  variant?: 'default' | 'elevated' | 'subtle';
  gradient?: boolean;
  borderAccentColor?: string;
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  onPress,
  glowColor,
  borderRadius = Radius.card,
  variant = 'default',
  gradient = true,
  borderAccentColor,
  testID,
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

  // 1px translucent border (lavender in light mode, calm glass in dark mode)
  const borderColor =
    borderAccentColor ||
    (isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.14)');

  // Calm glass shadow: 0 8px 24px rgba(0,0,10,0.35); glow reserved for status elements
  const glowStyle: ViewStyle = isDark
    ? glowColor
      ? {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.38,
          shadowRadius: 16,
          elevation: 5,
        }
      : {
          shadowColor: 'rgba(0, 0, 10, 0.35)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 4,
        }
    : {
        shadowColor: glowColor ? glowColor : '#6E5ADC',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: glowColor ? 0.16 : 0.10,
        shadowRadius: 24,
        elevation: 2,
      };

  // Glass card gradient colors: rgba(20,27,74,0.72) glass in dark mode
  const gradientColors = isDark
    ? (['rgba(20, 27, 74, 0.76)', 'rgba(20, 27, 74, 0.68)'] as const)
    : (['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.70)'] as const);

  const cardBaseStyle: ViewStyle = {
    borderRadius,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
    padding: Spacing.cardPadding,
    backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : colors.cardBackground,
    ...glowStyle,
  };

  const innerContent = (
    <>
      {gradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {/* Faint inner top highlight rgba(255, 255, 255, 0.04) in dark mode */}
      {isDark && <View style={styles.innerTopHighlight} pointerEvents="none" />}
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={handlePress}
        style={({ pressed }) => [
          cardBaseStyle,
          {
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          style,
        ]}>
        {innerContent}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[cardBaseStyle, style]}>
      {innerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  innerContent: {
    position: 'relative',
    zIndex: 1,
  },
  innerTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    zIndex: 2,
  },
});
