import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onPress,
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  const { colors, isElderly } = useAppTheme();

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isElderly ? colors.cardBackground : colors.separator,
          borderColor: colors.border,
          minHeight: isElderly ? 54 : 44,
          borderRadius: isElderly ? 16 : 12,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {icon && <>{icon}</>}
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: isElderly ? 17 : 14,
            fontWeight: isElderly ? '700' : '600',
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
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 6,
  },
  text: {
    textAlign: 'center',
  },
});
