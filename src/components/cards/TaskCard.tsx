import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { Task } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Radius } from '@/constants/theme';

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onDelete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members } = useFamily();

  const assignee = members.find((m) => m.id === task.assignedToMemberId);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(
          task.isCompleted
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success
        );
      } catch (e) {}
    }
    onToggle();
  };

  const getPriorityVariant = () => {
    if (task.priority === 'urgent') return 'red';
    if (task.priority === 'important') return 'yellow';
    return 'neutral';
  };

  const getCategoryEmoji = () => {
    switch (task.category) {
      case 'groceries':
        return '🛒';
      case 'bills':
        return '💡';
      case 'health':
        return '💊';
      case 'chores':
        return '🌿';
      case 'kids':
        return '🎒';
      default:
        return '📝';
    }
  };

  return (
    <GlassCard
      borderRadius={22}
      onPress={handleToggle}
      glowColor={task.isCompleted ? (isDark ? 'rgba(52, 211, 153, 0.20)' : undefined) : undefined}
      style={[
        styles.cardWrapper,
        {
          opacity: task.isCompleted ? 0.65 : 1,
        },
      ]}
      contentStyle={styles.cardContent}>
      <Pressable
        onPress={handleToggle}
        hitSlop={12}
        style={[
          styles.checkbox,
          {
            backgroundColor: task.isCompleted
              ? colors.green
              : isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(124, 92, 224, 0.06)',
            borderColor: task.isCompleted
              ? colors.green
              : isDark
              ? 'rgba(130, 140, 255, 0.35)'
              : 'rgba(124, 92, 224, 0.25)',
            width: isElderly ? 36 : 28,
            height: isElderly ? 36 : 28,
            borderRadius: isElderly ? 18 : 14,
            shadowColor: task.isCompleted ? colors.green : undefined,
            shadowOpacity: task.isCompleted ? 0.45 : 0,
            shadowRadius: 8,
          },
        ]}>
        {task.isCompleted && (
          <Ionicons name="checkmark" size={isElderly ? 22 : 17} color="#FFFFFF" />
        )}
      </Pressable>

      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <Text style={{ fontSize: isElderly ? 20 : 16 }}>{getCategoryEmoji()}</Text>
          <Text
            style={[
              styles.titleText,
              {
                color: task.isCompleted ? (isDark ? colors.textMuted : colors.textSecondary) : colors.text,
                fontSize: isElderly ? 20 : 15,
                textDecorationLine: task.isCompleted ? 'line-through' : 'none',
              },
            ]}>
            {task.title}
          </Text>
        </View>

        {task.note && !task.isCompleted && (
          <Text
            style={[
              styles.noteText,
              { color: isDark ? colors.textMuted : colors.textSecondary, fontSize: isElderly ? 15 : 12 },
            ]}>
            {task.note}
          </Text>
        )}

        <View style={styles.metaRow}>
          {assignee && (
            <View
              style={[
                styles.assigneePill,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isDark
                    ? 'rgba(140, 150, 255, 0.20)'
                    : 'rgba(124, 92, 224, 0.16)',
                },
              ]}>
              <FamilyAvatar member={assignee} size="sm" showStatus={false} />
              <Text
                style={[
                  styles.assigneeName,
                  { color: isDark ? colors.textSecondary : colors.text, fontSize: isElderly ? 14 : 12 },
                ]}>
                {assignee.name}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.dueDateText,
              { color: isDark ? colors.textTertiary : colors.textSecondary, fontSize: isElderly ? 14 : 12 },
            ]}>
            • {task.dueDate} {task.dueTime ? `(${task.dueTime})` : ''}
          </Text>

          {task.priority !== 'normal' && !task.isCompleted && (
            <StatusBadge
              label={task.priority}
              variant={getPriorityVariant()}
              size="sm"
            />
          )}
        </View>
      </View>

      {onDelete && (
        <Pressable
          onPress={onDelete}
          hitSlop={12}
          style={({ pressed }) => [
            styles.deleteBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <Ionicons name="trash-outline" size={16} color={isDark ? colors.textTertiary : colors.textMuted} />
        </Pressable>
      )}
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
  checkbox: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.1,
  },
  noteText: {
    lineHeight: 16,
    marginLeft: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  assigneePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  assigneeName: {
    fontWeight: '600',
  },
  dueDateText: {
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 6,
  },
});
