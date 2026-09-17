import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyDocument } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
  const { colors, isElderly } = useAppTheme();

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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.separator },
            ]}>
            <Ionicons name={getDocIcon()} size={20} color={colors.brand} />
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
                { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
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
              backgroundColor: colors.separator,
              borderColor: colors.borderSubtle,
            },
          ]}>
          <View>
            <Text
              style={[
                styles.amountLabel,
                { color: colors.textSecondary, fontSize: isElderly ? 13 : 11 },
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
                  { color: colors.textSecondary, fontSize: isElderly ? 13 : 11 },
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
                  { color: colors.textMuted, fontSize: isElderly ? 13 : 11 },
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
        <View style={styles.actionsContainer}>
          <Text
            style={[
              styles.suggestedActionsTitle,
              { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
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
                    backgroundColor: colors.separator,
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
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
                  color={colors.text}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: colors.text, fontSize: isElderly ? 14 : 12 },
                  ]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  amountLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
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
    fontWeight: '600',
  },
  fieldVal: {
    fontWeight: '600',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  suggestedActionsTitle: {
    fontWeight: '700',
    letterSpacing: 0.3,
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
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  actionButtonText: {
    fontWeight: '600',
  },
});
