import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { AISuggestion } from '@/types';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onDismiss,
}) => {
  const { colors, isElderly } = useAppTheme();

  const handleAccept = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    onAccept();
  };

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    onDismiss();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isElderly ? colors.cardBackground : '#FFFDF7',
          borderColor: isElderly ? colors.yellowBorder : '#FDE68A',
        },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.badgeWrapper}>
          <View style={styles.sparkleIcon}>
            <Text style={{ fontSize: 16 }}>💡</Text>
          </View>
          <Text
            style={[
              styles.badgeLabel,
              {
                color: isElderly ? colors.yellow : '#B45309',
                fontSize: isElderly ? 16 : 13,
              },
            ]}>
            {suggestion.title.toUpperCase()}
          </Text>
        </View>

        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text
        style={[
          styles.bodyText,
          {
            color: colors.text,
            fontSize: isElderly ? 20 : 16,
            lineHeight: isElderly ? 28 : 23,
          },
        ]}>
        {suggestion.body}
      </Text>

      {suggestion.reasoning && (
        <Text
          style={[
            styles.reasoningText,
            {
              color: colors.textSecondary,
              fontSize: isElderly ? 15 : 12,
            },
          ]}>
          Context: {suggestion.reasoning}
        </Text>
      )}

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleAccept}
          style={({ pressed }) => [
            styles.primaryAction,
            {
              backgroundColor: isElderly ? colors.yellow : colors.brand,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <Ionicons
            name="paper-plane"
            size={15}
            color={isElderly ? '#000000' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.primaryActionText,
              { color: isElderly ? '#000000' : '#FFFFFF' },
            ]}>
            {suggestion.primaryActionLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => [
            styles.dismissAction,
            {
              backgroundColor: isElderly ? colors.separator : '#F1F5F9',
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Text style={[styles.dismissActionText, { color: colors.textSecondary }]}>
            {suggestion.secondaryActionLabel || 'Not now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    marginVertical: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  closeBtn: {
    padding: 4,
  },
  bodyText: {
    fontWeight: '600',
    marginBottom: 8,
  },
  reasoningText: {
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 6,
    flex: 1,
  },
  primaryActionText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  dismissAction: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissActionText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
