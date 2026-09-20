import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'normal' | 'large' | 'elderly';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onPress,
  icon,
  disabled = false,
  style,
  textStyle,
  size = 'normal',
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    onPress();
  };

  const isLarge = size === 'large' || isElderly;

  const resolvedBg = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.75)';

  const resolvedBorder = isDark
    ? 'rgba(139, 124, 246, 0.45)'
    : 'rgba(124, 92, 224, 0.28)';

  const resolvedText = isDark ? '#8B7CF6' : '#6D5BD0';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: resolvedBg,
          borderColor: resolvedBorder,
          minHeight: isLarge ? 54 : 44,
          borderRadius: Radius.full,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.975 : 1 }],
          shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.20 : 0.08,
          shadowRadius: 6,
          elevation: 2,
        },
        style,
      ]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: resolvedText,
            fontSize: isLarge ? 17 : 14.5,
            fontWeight: '700',
          },
          textStyle,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
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
