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
  const { colors, isElderly } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.borderSubtle,
        },
        style,
      ]}>
      {badge ? (
        <View style={[styles.badgePill, { backgroundColor: colors.brandWarm + '18' }]}>
          <Text style={[styles.badgeText, { color: colors.brandWarm }]}>{badge}</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.brandAccent + '15',
            borderColor: colors.brandAccent + '30',
          },
        ]}>
        <Ionicons name={icon} size={34} color={colors.brandAccent} />
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
            color: colors.textSecondary,
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
          style={[styles.secondaryButtonText, { color: colors.brandAccent }]}>
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
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '600',
    textAlign: 'center',
  },
});
