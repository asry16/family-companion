import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip, StatusChipVariant } from '@/components/ui/StatusChip';

interface DailyTaskItem {
  id: string;
  title: string;
  subtitle: string;
  icon: 'calendar-outline' | 'checkmark-circle-outline' | 'alarm-outline';
  color: string;
  bg: string;
  border: string;
  chipLabel: string;
  chipVariant: StatusChipVariant;
  colorScheme: 'green' | 'blue' | 'purple' | 'yellow';
  isCompleted: boolean;
  time: string;
  type: 'event' | 'task' | 'reminder';
}

export const VaultUpdatesCard: React.FC = () => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();
  const { tasks, events, reminders, addTask, members } = useFamily();
  const { user } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<'task' | 'reminder'>('task');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const memberId = user?.familyMemberId || members?.[0]?.id || '1';
    addTask({
      title: taskTitle.trim(),
      category: 'general',
      assignedToMemberId: memberId,
      createdByMemberId: memberId,
      dueDate: 'Today',
      dueTime: '12:00 PM',
      isCompleted: false,
      priority: 'normal',
    });
    setTaskTitle('');
    setModalVisible(false);
  };

  const dailyItems: DailyTaskItem[] = useMemo(() => {
    const result: DailyTaskItem[] = [];

    (events || []).slice(0, 2).forEach((e) => {
      result.push({
        id: e.id,
        title: e.title,
        subtitle: e.date ? `${e.date}${e.time ? ` at ${e.time}` : ''}` : 'Today',
        icon: 'calendar-outline',
        color: isDark ? '#60A5FA' : '#3B82F6',
        bg: isDark ? 'rgba(59, 111, 240, 0.18)' : 'rgba(59, 111, 240, 0.10)',
        border: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(59, 111, 240, 0.20)',
        chipLabel: 'Event',
        chipVariant: 'Safe' as StatusChipVariant,
        colorScheme: 'blue',
        isCompleted: false,
        time: e.time || e.date || 'Today',
        type: 'event',
      });
    });

    (tasks || []).slice(0, 2).forEach((t) => {
      result.push({
        id: t.id,
        title: t.title,
        subtitle: t.dueDate ? `Due ${t.dueDate}${t.dueTime ? ` at ${t.dueTime}` : ''}` : 'Due Today',
        icon: 'checkmark-circle-outline',
        color: t.isCompleted ? (isDark ? '#34D399' : '#059669') : (isDark ? '#FBBF24' : '#D97706'),
        bg: t.isCompleted
          ? (isDark ? 'rgba(34, 197, 139, 0.18)' : 'rgba(16, 185, 129, 0.10)')
          : (isDark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(217, 119, 6, 0.10)'),
        border: t.isCompleted
          ? (isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(16, 185, 129, 0.20)')
          : (isDark ? 'rgba(251, 191, 36, 0.35)' : 'rgba(217, 119, 6, 0.20)'),
        chipLabel: t.isCompleted ? 'Done' : 'Pending',
        chipVariant: t.isCompleted ? 'Safe' : 'View' as StatusChipVariant,
        colorScheme: t.isCompleted ? 'green' : 'yellow',
        isCompleted: t.isCompleted,
        time: t.dueTime || t.dueDate || 'Today',
        type: 'task',
      });
    });

    (reminders || []).slice(0, 1).forEach((r) => {
      result.push({
        id: r.id,
        title: r.title,
        subtitle: r.time ? `Reminder at ${r.time}` : 'Active Reminder',
        icon: 'alarm-outline',
        color: isDark ? '#C084FC' : '#9333EA',
        bg: isDark ? 'rgba(147, 51, 234, 0.18)' : 'rgba(147, 51, 234, 0.10)',
        border: isDark ? 'rgba(147, 51, 234, 0.35)' : 'rgba(147, 51, 234, 0.20)',
        chipLabel: 'Reminder',
        chipVariant: 'Vault' as StatusChipVariant,
        colorScheme: 'purple',
        isCompleted: r.isDone,
        time: r.time || 'Today',
        type: 'reminder',
      });
    });

    return result.slice(0, 3);
  }, [tasks, events, reminders, isDark]);

  const totalCount = (tasks?.length || 0) + (events?.length || 0) + (reminders?.length || 0);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Daily Tasks"
        categoryTag="PLANS"
        actionText="View Plans →"
        onActionPress={() => {
          triggerHaptic();
          router.push('/(tabs)/plans');
        }}
      />

      <GlassCard
        borderRadius={24}
        glowColor={isDark ? 'rgba(139, 124, 246, 0.20)' : undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>

        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.timerIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.35)' : 'rgba(124, 92, 224, 0.25)',
                },
              ]}>
              <Ionicons name="timer-outline" size={18} color={isDark ? '#A78BFA' : '#7C5CE0'} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text, fontSize: isElderly ? 17 : 15 }]}>
                Today's Schedule
              </Text>
              <Text style={[styles.cardSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                {totalCount > 0
                  ? `${totalCount} item${totalCount === 1 ? '' : 's'} across tasks, events & reminders`
                  : 'No tasks scheduled for today'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              setModalVisible(true);
            }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.addTaskButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
                borderColor: isDark ? 'rgba(139, 124, 246, 0.45)' : 'rgba(124, 92, 224, 0.28)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="add" size={15} color={isDark ? '#8B7CF6' : '#6D5BD0'} />
            <Text style={[styles.addTaskButtonText, { color: isDark ? '#8B7CF6' : '#6D5BD0' }]}>
              + Task
            </Text>
          </Pressable>
        </View>

        {dailyItems.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="timer-outline"
              size={24}
              color={isDark ? '#8B7CF6' : '#7C5CE0'}
              style={{ opacity: 0.85 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Tasks Scheduled Today
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Add tasks, events, or reminders from the Plans page to keep your family on track.
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [
                styles.emptyActionBtn,
                {
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <LinearGradient
                colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Add First Task</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.itemsStack}>
            {dailyItems.map((item, idx) => {
              const isLast = idx === dailyItems.length - 1;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    triggerHaptic();
                    router.push('/(tabs)/plans');
                  }}
                  style={({ pressed }) => [
                    styles.itemRow,
                    !isLast && styles.itemRowBorder,
                    {
                      borderBottomColor: isDark ? 'rgba(130, 140, 255, 0.12)' : 'rgba(124, 92, 224, 0.10)',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.itemIconBox,
                      {
                        backgroundColor: item.bg,
                        borderColor: item.border,
                      },
                    ]}>
                    <Ionicons name={item.icon} size={15} color={item.color} />
                  </View>

                  <View style={styles.itemTextCol}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.itemTitle,
                        {
                          color: item.isCompleted
                            ? isDark ? colors.textMuted : colors.textSecondary
                            : colors.text,
                          fontSize: isElderly ? 15.5 : 14,
                          textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                        },
                      ]}>
                      {item.title}
                    </Text>
                    <View style={styles.itemSubRow}>
                      <Ionicons
                        name="time-outline"
                        size={11}
                        color={isDark ? colors.textMuted : colors.textSecondary}
                      />
                      <Text
                        numberOfLines={1}
                        style={[styles.itemSubText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemRightWrap}>
                    <StatusChip
                      label={item.chipLabel}
                      variant={item.chipVariant}
                      colorScheme={item.colorScheme}
                      size="sm"
                      showDot={false}
                    />
                    <Ionicons
                      name="chevron-forward"
                      size={13}
                      color={isDark ? colors.textMuted : colors.textSecondary}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </GlassCard>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.96)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="timer-outline" size={20} color={isDark ? '#A78BFA' : colors.brandAccent} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Quick Add Task
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Add a task to your family's daily plan. It will appear in the Plans page.
            </Text>

            <View style={styles.inputStack}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Task or Reminder</Text>
              <TextInput
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="e.g. Doctor appointment, Pick up groceries"
                placeholderTextColor={isDark ? '#7C84C0' : '#A0A3BD'}
                style={[
                  styles.formInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.70)',
                    borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                  },
                ]}
              />
            </View>

            <View style={styles.inputStack}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Type</Text>
              <View style={styles.typeSelectRow}>
                {(['task', 'reminder'] as const).map((t) => {
                  const isSel = taskType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setTaskType(t)}
                      style={[
                        styles.typeSelectBtn,
                        {
                          backgroundColor: isSel
                            ? (isDark ? '#8B7CF6' : '#7C5CE0')
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.75)',
                          borderColor: isSel
                            ? (isDark ? '#8B7CF6' : '#7C5CE0')
                            : isDark
                            ? 'rgba(140, 150, 255, 0.25)'
                            : 'rgba(124, 92, 224, 0.18)',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.typeSelectText,
                          {
                            color: isSel ? '#FFFFFF' : colors.text,
                            fontWeight: isSel ? '700' : '600',
                          },
                        ]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={handleSaveTask}
              disabled={!taskTitle.trim()}
              style={({ pressed }) => [
                styles.saveSubmitBtn,
                {
                  opacity: !taskTitle.trim() ? 0.45 : pressed ? 0.88 : 1,
                },
              ]}>
              <LinearGradient
                colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveSubmitBtnText}>Add to Daily Tasks</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  cardContainer: {
    marginVertical: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  timerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  addTaskButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 9999,
    overflow: 'hidden',
    marginTop: 6,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  itemsStack: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  itemSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemSubText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  itemRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  inputStack: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  formInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  typeSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectText: {
    fontSize: 12,
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 9999,
    overflow: 'hidden',
    marginTop: 6,
  },
  saveSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
