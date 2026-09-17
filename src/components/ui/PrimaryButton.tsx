import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

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
  const { colors, isElderly } = useAppTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    onPress();
  };

  const getBgColor = () => {
    if (disabled) return colors.separator;
    switch (variant) {
      case 'green':
        return colors.green;
      case 'red':
        return colors.red;
      case 'blue':
        return colors.blue;
      case 'brand':
      default:
        return isElderly ? '#FDE047' : colors.brand;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (isElderly && variant === 'brand') return '#000000';
    return '#FFFFFF';
  };

  const isLarge = size === 'large' || isElderly;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBgColor(),
          minHeight: isLarge ? 58 : 48,
          borderRadius: isLarge ? 18 : 14,
          opacity: pressed ? 0.88 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: isLarge ? 18 : 15,
                fontWeight: isLarge ? '700' : '600',
              },
              textStyle,
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
