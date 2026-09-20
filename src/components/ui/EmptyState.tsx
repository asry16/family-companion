import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'sparkles-outline',
  badge,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.75)',
          borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.14)',
          shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
          shadowOpacity: isDark ? 0.35 : 0.10,
        },
        style,
      ]}>
      {badge ? (
        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: isDark ? 'rgba(251, 146, 60, 0.18)' : 'rgba(249, 115, 22, 0.10)',
              borderColor: isDark ? 'rgba(251, 146, 60, 0.35)' : 'rgba(249, 115, 22, 0.22)',
            },
          ]}>
          <Text style={[styles.badgeText, { color: isDark ? '#FB923C' : '#EA580C' }]}>{badge}</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(124, 92, 224, 0.10)',
            borderColor: isDark ? 'rgba(139, 124, 246, 0.35)' : 'rgba(124, 92, 224, 0.22)',
            shadowColor: isDark ? '#8B7CF6' : '#7C5CE0',
          },
        ]}>
        <Ionicons name={icon} size={32} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
      </View>

      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: isElderly ? 22 : 18,
          },
        ]}>
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          {
            color: isDark ? colors.textMuted : colors.textSecondary,
            fontSize: isElderly ? 16 : 14,
          },
        ]}>
        {description}
      </Text>

      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          style={styles.button}
        />
      ) : null}

      {secondaryActionLabel && onSecondaryAction ? (
        <Text
          onPress={onSecondaryAction}
          style={[styles.secondaryButtonText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>
          {secondaryActionLabel}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 3,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 290,
  },
  button: {
    marginTop: 20,
    minWidth: 180,
  },
  secondaryButtonText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
