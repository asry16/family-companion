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

  // 1px translucent border
  const borderColor = borderAccentColor || (isDark ? 'rgba(59, 111, 240, 0.22)' : 'rgba(20, 32, 58, 0.08)');

  // Soft colored glow
  const resolvedGlowColor = glowColor || (isDark ? colors.blue : '#14203A');
  const glowStyle: ViewStyle = isDark
    ? {
        shadowColor: glowColor ? glowColor : 'rgba(59, 111, 240, 0.35)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: glowColor ? 0.38 : 0.25,
        shadowRadius: 16,
        elevation: 5,
      }
    : {
        shadowColor: glowColor ? glowColor : '#14203A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: glowColor ? 0.12 : 0.05,
        shadowRadius: 14,
        elevation: 2,
      };

  // Glass card gradient colors (70-80% opacity)
  const gradientColors = isDark
    ? (['rgba(15, 26, 58, 0.85)', 'rgba(11, 20, 48, 0.80)'] as const)
    : (['rgba(255, 255, 255, 0.85)', 'rgba(251, 248, 246, 0.75)'] as const);

  const cardBaseStyle: ViewStyle = {
    borderRadius,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
    padding: Spacing.cardPadding,
    backgroundColor: isDark ? colors.cardBackground : colors.cardBackground,
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
});
