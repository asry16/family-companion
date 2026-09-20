import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { Reminder } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GlassCard } from '@/components/ui/GlassCard';

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: () => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onToggle }) => {
  const { colors, isDark, isElderly } = useAppTheme();
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

  const isUrgentActive = reminder.urgency === 'urgent' && !reminder.isDone;

  return (
    <GlassCard
      borderRadius={22}
      onPress={handleToggle}
      glowColor={
        isUrgentActive
          ? isDark ? 'rgba(240, 82, 77, 0.25)' : 'rgba(225, 29, 72, 0.15)'
          : reminder.isDone
          ? isDark ? 'rgba(52, 211, 153, 0.20)' : undefined
          : undefined
      }
      style={[
        styles.cardWrapper,
        {
          opacity: reminder.isDone ? 0.65 : 1,
        },
      ]}
      contentStyle={styles.cardContent}>
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
        <Text style={{ fontSize: isElderly ? 22 : 17 }}>{getCategoryEmoji()}</Text>
      </View>

      <View style={styles.contentSection}>
        <Text
          style={[
            styles.titleText,
            {
              color: reminder.isDone
                ? isDark ? colors.textMuted : colors.textSecondary
                : colors.text,
              fontSize: isElderly ? 20 : 15.5,
              textDecorationLine: reminder.isDone ? 'line-through' : 'none',
            },
          ]}>
          {reminder.title}
        </Text>

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timeText,
              {
                color: isUrgentActive
                  ? colors.red
                  : isDark ? colors.textTertiary : colors.textSecondary,
                fontSize: isElderly ? 15 : 12,
              },
            ]}>
            {reminder.dueDate} • {reminder.time}
          </Text>

          {targetMember && (
            <View style={styles.targetMemberRow}>
              <FamilyAvatar member={targetMember} size="sm" showStatus={false} />
              <Text
                style={[
                  styles.targetName,
                  { color: isDark ? colors.textSecondary : colors.text, fontSize: isElderly ? 14 : 12 },
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
            backgroundColor: reminder.isDone
              ? colors.green
              : isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(124, 92, 224, 0.06)',
            borderColor: reminder.isDone
              ? colors.green
              : isDark
              ? 'rgba(130, 140, 255, 0.35)'
              : 'rgba(124, 92, 224, 0.25)',
            width: isElderly ? 36 : 28,
            height: isElderly ? 36 : 28,
            borderRadius: isElderly ? 18 : 14,
            shadowColor: reminder.isDone ? colors.green : undefined,
            shadowOpacity: reminder.isDone ? 0.45 : 0,
            shadowRadius: 8,
          },
        ]}>
        {reminder.isDone && (
          <Ionicons name="checkmark" size={isElderly ? 22 : 16} color="#FFFFFF" />
        )}
      </Pressable>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: -0.1,
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
    gap: 5,
  },
  targetName: {
    fontWeight: '600',
  },
  checkButton: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
