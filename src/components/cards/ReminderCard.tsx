import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { Reminder } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: () => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onToggle }) => {
  const { colors, isElderly } = useAppTheme();
  const { members } = useFamily();

  const targetMember = members.find((m) => m.id === reminder.targetMemberId);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
    onToggle();
  };

  const getUrgencyVariant = () => {
    if (reminder.urgency === 'urgent') return 'red';
    if (reminder.urgency === 'important') return 'yellow';
    return 'blue';
  };

  const getCategoryEmoji = () => {
    switch (reminder.category) {
      case 'medicine':
        return '💊';
      case 'bill':
        return '💡';
      case 'call':
        return '📞';
      case 'pickup':
        return '🚗';
      default:
        return '⏰';
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: reminder.isDone ? colors.separator : colors.cardBackground,
          borderColor: reminder.urgency === 'urgent' && !reminder.isDone ? colors.redBorder : colors.border,
          borderLeftColor: reminder.urgency === 'urgent' && !reminder.isDone ? colors.red : colors.border,
          borderLeftWidth: 4,
          opacity: reminder.isDone ? 0.6 : pressed ? 0.9 : 1,
        },
      ]}>
      <View style={styles.iconCircle}>
        <Text style={{ fontSize: isElderly ? 24 : 18 }}>{getCategoryEmoji()}</Text>
      </View>

      <View style={styles.contentSection}>
        <Text
          style={[
            styles.titleText,
            {
              color: reminder.isDone ? colors.textMuted : colors.text,
              fontSize: isElderly ? 20 : 15,
              textDecorationLine: reminder.isDone ? 'line-through' : 'none',
            },
          ]}>
          {reminder.title}
        </Text>

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timeText,
              { color: reminder.urgency === 'urgent' && !reminder.isDone ? colors.red : colors.textSecondary, fontSize: isElderly ? 15 : 12 },
            ]}>
            {reminder.dueDate} • {reminder.time}
          </Text>

          {targetMember && (
            <View style={styles.targetMemberRow}>
              <FamilyAvatar member={targetMember} size="sm" showStatus={false} />
              <Text
                style={[
                  styles.targetName,
                  { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
                ]}>
                For {targetMember.name}
              </Text>
            </View>
          )}

          {!reminder.isDone && (
            <StatusBadge
              label={reminder.urgency}
              variant={getUrgencyVariant()}
              size="sm"
            />
          )}
        </View>
      </View>

      <Pressable
        onPress={handleToggle}
        hitSlop={10}
        style={[
          styles.checkButton,
          {
            backgroundColor: reminder.isDone ? colors.green : colors.separator,
            borderColor: reminder.isDone ? colors.green : colors.border,
            width: isElderly ? 36 : 28,
            height: isElderly ? 36 : 28,
            borderRadius: isElderly ? 18 : 14,
          },
        ]}>
        {reminder.isDone && (
          <Ionicons name="checkmark" size={isElderly ? 22 : 16} color="#FFFFFF" />
        )}
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  contentSection: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeText: {
    fontWeight: '600',
  },
  targetMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetName: {
    fontWeight: '500',
  },
  checkButton: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
