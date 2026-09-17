import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export type StatusVariant = 'green' | 'yellow' | 'red' | 'blue' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  icon?: React.ReactNode;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  showDot = true,
  size = 'md',
  style,
  textStyle,
}) => {
  const { colors, isElderly } = useAppTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'green':
        return {
          bg: colors.greenSoft,
          text: isElderly ? colors.green : colors.green,
          border: colors.greenBorder,
          dot: colors.green,
        };
      case 'yellow':
        return {
          bg: colors.yellowSoft,
          text: isElderly ? colors.yellow : colors.yellow,
          border: colors.yellowBorder,
          dot: colors.yellow,
        };
      case 'red':
        return {
          bg: colors.redSoft,
          text: isElderly ? colors.red : colors.red,
          border: colors.redBorder,
          dot: colors.red,
        };
      case 'blue':
        return {
          bg: colors.blueSoft,
          text: isElderly ? colors.blue : colors.blue,
          border: colors.blueBorder,
          dot: colors.blue,
        };
      case 'neutral':
      default:
        return {
          bg: colors.separator,
          text: colors.textSecondary,
          border: colors.border,
          dot: colors.textMuted,
        };
    }
  };

  const v = getVariantStyles();

  const padding = size === 'sm' ? { py: 3, px: 8, font: 12, dotSize: 6 }
    : size === 'lg' ? { py: 6, px: 14, font: 15, dotSize: 9 }
    : { py: 4, px: 10, font: 13, dotSize: 7 };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: padding.py,
          paddingHorizontal: padding.px,
        },
        style,
      ]}>
      {icon ? (
        <View style={styles.iconContainer}>{icon}</View>
      ) : showDot ? (
        <View
          style={[
            styles.dot,
            {
              width: padding.dotSize,
              height: padding.dotSize,
              borderRadius: padding.dotSize / 2,
              backgroundColor: v.dot,
            },
          ]}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          {
            fontSize: isElderly ? padding.font + 3 : padding.font,
            color: v.text,
          },
          textStyle,
        ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {
    marginRight: 1,
  },
  iconContainer: {
    marginRight: 2,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
