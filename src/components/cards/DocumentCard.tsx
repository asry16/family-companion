import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyDocument } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Radius } from '@/constants/theme';

interface DocumentCardProps {
  document: FamilyDocument;
  onActionPress: (actionId: string) => void;
  onPress?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onActionPress,
  onPress,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const handleAction = (actionId: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    onActionPress(actionId);
  };

  const getDocIcon = () => {
    switch (document.type) {
      case 'electricity_bill':
        return 'flash-outline';
      case 'medical_prescription':
        return 'medkit-outline';
      case 'receipt':
        return 'receipt-outline';
      default:
        return 'document-text-outline';
    }
  };

  return (
    <GlassCard
      borderRadius={24}
      onPress={onPress}
      glowColor={isDark ? (document.status === 'paid' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(240, 82, 77, 0.25)') : undefined}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(139, 124, 246, 0.15)'
                  : 'rgba(124, 92, 224, 0.10)',
                borderColor: isDark
                  ? 'rgba(139, 124, 246, 0.35)'
                  : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Ionicons
              name={getDocIcon()}
              size={20}
              color={isDark ? '#8B7CF6' : '#7C5CE0'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.titleText,
                { color: colors.text, fontSize: isElderly ? 20 : 16 },
              ]}>
              {document.title}
            </Text>
            <Text
              style={[
                styles.providerText,
                { color: isDark ? colors.textMuted : colors.textSecondary, fontSize: isElderly ? 14 : 12 },
              ]}>
              {document.provider || 'Verified Document'} • Scanned {document.scannedAt}
            </Text>
          </View>
        </View>

        <StatusBadge
          label={document.status.toUpperCase()}
          variant={document.status === 'paid' ? 'green' : 'red'}
          size="sm"
        />
      </View>

      {document.amount !== undefined && (
        <View
          style={[
            styles.amountBanner,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(124, 92, 224, 0.06)',
              borderColor: isDark
                ? 'rgba(130, 140, 255, 0.18)'
                : 'rgba(124, 92, 224, 0.14)',
            },
          ]}>
          <View>
            <Text
              style={[
                styles.amountLabel,
                { color: isDark ? colors.textTertiary : colors.textSecondary, fontSize: isElderly ? 13 : 11 },
              ]}>
              TOTAL AMOUNT
            </Text>
            <Text
              style={[
                styles.amountValue,
                { color: colors.text, fontSize: isElderly ? 26 : 22 },
              ]}>
              {document.currency || '₹'}{document.amount.toLocaleString()}
            </Text>
          </View>

          {document.dueDate && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={[
                  styles.amountLabel,
                  { color: isDark ? colors.textTertiary : colors.textSecondary, fontSize: isElderly ? 13 : 11 },
                ]}>
                DUE DATE
              </Text>
              <Text
                style={[
                  styles.dueDateValue,
                  { color: colors.red, fontSize: isElderly ? 18 : 15 },
                ]}>
                {document.dueDate}
              </Text>
            </View>
          )}
        </View>
      )}

      {document.fields.length > 0 && (
        <View style={styles.fieldGrid}>
          {document.fields.slice(0, 3).map((f) => (
            <View key={f.label} style={styles.fieldItem}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? colors.textTertiary : colors.textMuted, fontSize: isElderly ? 13 : 11 },
                ]}>
                {f.label}
              </Text>
              <Text
                style={[
                  styles.fieldVal,
                  { color: colors.text, fontSize: isElderly ? 15 : 13 },
                ]}>
                {f.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {document.status !== 'paid' && document.suggestedActions.length > 0 && (
        <View
          style={[
            styles.actionsContainer,
            {
              borderTopColor: isDark
                ? 'rgba(130, 140, 255, 0.12)'
                : 'rgba(124, 92, 224, 0.10)',
            },
          ]}>
          <Text
            style={[
              styles.suggestedActionsTitle,
              { color: isDark ? colors.textTertiary : colors.textSecondary, fontSize: isElderly ? 14 : 11.5 },
            ]}>
            SUGGESTED 1-TAP ACTIONS:
          </Text>
          <View style={styles.actionsRow}>
            {document.suggestedActions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handleAction(action.id)}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(124, 92, 224, 0.08)',
                    borderColor: isDark
                      ? 'rgba(139, 124, 246, 0.45)'
                      : 'rgba(124, 92, 224, 0.22)',
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}>
                <Ionicons
                  name={
                    action.actionType === 'add_reminder'
                      ? 'alarm-outline'
                      : action.actionType === 'assign_task'
                      ? 'person-outline'
                      : 'card-outline'
                  }
                  size={14}
                  color={isDark ? '#8B7CF6' : '#7C5CE0'}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: isDark ? '#8B7CF6' : '#7C5CE0', fontSize: isElderly ? 14 : 12 },
                  ]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 6,
  },
  cardContent: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  providerText: {
    marginTop: 2,
    fontWeight: '500',
  },
  amountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  amountLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontWeight: '800',
    marginTop: 2,
  },
  dueDateValue: {
    fontWeight: '700',
    marginTop: 2,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 2,
  },
  fieldItem: {
    minWidth: '45%',
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fieldVal: {
    fontWeight: '600',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  suggestedActionsTitle: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontWeight: '700',
  },
});
