import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/ui/Header';
import { TaskCard } from '@/components/cards/TaskCard';
import { EventCard } from '@/components/cards/EventCard';
import { ReminderCard } from '@/components/cards/ReminderCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EmptyState } from '@/components/ui/EmptyState';

type FilterTab = 'all' | 'tasks' | 'events' | 'reminders';

export default function PlansScreen() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const { isAuthenticated } = useAuth();
  const {
    members,
    activeUser,
    tasks,
    events,
    reminders,
    toggleTask,
    deleteTask,
    toggleReminder,
    addTask,
  } = useFamily();
  const { startListening, speak } = useVoice();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const [filter, setFilter] = useState<FilterTab>('all');
  const [nlInput, setNlInput] = useState<string>('');

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const handleCreateFromNL = () => {
    if (!nlInput.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    const text = nlInput.trim();
    const textLower = text.toLowerCase();

    // Dynamically match assignee from user's current family members
    let assignee = activeUser.id;
    for (const m of members) {
      const firstName = m.name.toLowerCase().split(' ')[0];
      const relation = m.relation.toLowerCase();
      if (textLower.includes(firstName) || (relation && textLower.includes(relation))) {
        assignee = m.id;
        break;
      }
    }
    if (textLower.includes('me') || textLower.includes('myself')) {
      assignee = activeUser.id;
    }

    let category: any = 'general';
    if (textLower.includes('vegetable') || textLower.includes('grocery') || textLower.includes('milk')) category = 'groceries';
    if (textLower.includes('bill') || textLower.includes('pay')) category = 'bills';
    if (textLower.includes('medicine') || textLower.includes('doctor')) category = 'health';

    let dueDate = 'Tomorrow';
    if (textLower.includes('today') || textLower.includes('tonight')) dueDate = 'Today';

    addTask({
      title: text.replace(/^(remind|tell|ask)\s+\w+\s+to\s+/i, '').replace(/^(add|create)\s+task\s+/i, ''),
      category,
      assignedToMemberId: assignee,
      createdByMemberId: activeUser.id,
      dueDate,
      dueTime: '10:00 AM',
      isCompleted: false,
      priority: 'urgent',
    });

    speak(`Added plan: ${text}`);
    setNlInput('');
  };

  const handleVoiceInput = () => {
    startListening((recognized) => {
      if (recognized) {
        setNlInput(recognized);
      }
    });
  };

  const filterTabs: Array<{ id: FilterTab; label: string }> = [
    { id: 'all', label: 'All Plans' },
    { id: 'events', label: 'Schedule' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'reminders', label: 'Reminders' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title="Family Planner" subtitle="Unified calendar, tasks & reminders" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Natural Language Task Input Bar */}
        <View
          style={[
            styles.nlBox,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.nlInputRow}>
            <Ionicons name="sparkles" size={18} color={colors.brandAccent} />
            <TextInput
              placeholder="e.g. 'Remind Dad to buy vegetables tomorrow'"
              placeholderTextColor={colors.textMuted}
              value={nlInput}
              onChangeText={setNlInput}
              onSubmitEditing={handleCreateFromNL}
              style={[
                styles.nlTextInput,
                {
                  color: colors.text,
                  fontSize: isElderly ? 18 : 14,
                },
              ]}
            />
            <Pressable
              onPress={handleVoiceInput}
              hitSlop={8}
              style={({ pressed }) => [
                styles.micBtn,
                { backgroundColor: colors.separator, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Ionicons name="mic" size={16} color={colors.text} />
            </Pressable>
          </View>

          {nlInput.trim().length > 0 && (
            <Pressable
              onPress={handleCreateFromNL}
              style={({ pressed }) => [
                styles.nlSubmitBtn,
                {
                  backgroundColor: colors.brand,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              <Text style={styles.nlSubmitText}>AI Convert to Structured Plan</Text>
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id)}
                style={({ pressed }) => [
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.brand : colors.cardBackground,
                    borderColor: isSelected ? colors.brand : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontSize: isElderly ? 15 : 13,
                    },
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* All Plans Empty State */}
        {filter === 'all' && events.length === 0 && tasks.length === 0 && reminders.length === 0 && (
          <EmptyState
            icon="calendar-outline"
            badge="Fresh Slate"
            title="No Plans Scheduled"
            description="Your family schedule is completely open. Add a task or speak a reminder above."
            actionLabel="Add Household Plan"
            onAction={() => setNlInput('Remind Dad to pick up groceries at 6 PM')}
          />
        )}

        {/* Unified Feed: Schedule / Calendar */}
        {(filter === 'all' || filter === 'events') && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: isElderly ? 20 : 16 },
                ]}>
                TODAY'S SCHEDULE
              </Text>
            </View>
            {events.length > 0 ? (
              events.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))
            ) : filter === 'events' ? (
              <EmptyState
                icon="time-outline"
                badge="Schedule Clear"
                title="No Events Today"
                description="There are no family calendar events or appointments recorded for today."
                actionLabel="Schedule Event"
                onAction={() => setNlInput('Family dinner tonight at 8 PM')}
              />
            ) : (
              <Text style={[styles.emptyInlineText, { color: colors.textSecondary }]}>
                No scheduled calendar events for today.
              </Text>
            )}
          </View>
        )}

        {/* Unified Feed: Tasks */}
        {(filter === 'all' || filter === 'tasks') && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: isElderly ? 20 : 16 },
                ]}>
                FAMILY TASKS
              </Text>
            </View>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))
            ) : filter === 'tasks' ? (
              <EmptyState
                icon="checkmark-done-circle-outline"
                badge="All Caught Up"
                title="No Pending Tasks"
                description="Everything is complete! Add a new task using the input box above or your voice."
                actionLabel="Create First Task"
                onAction={() => setNlInput('Buy milk and fruits')}
              />
            ) : (
              <Text style={[styles.emptyInlineText, { color: colors.textSecondary }]}>
                All family tasks have been completed.
              </Text>
            )}
          </View>
        )}

        {/* Unified Feed: Reminders & Medication */}
        {(filter === 'all' || filter === 'reminders') && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: isElderly ? 20 : 16 },
                ]}>
                CARE & REMINDERS
              </Text>
            </View>
            {reminders.length > 0 ? (
              reminders.map((rem) => (
                <ReminderCard
                  key={rem.id}
                  reminder={rem}
                  onToggle={() => toggleReminder(rem.id)}
                />
              ))
            ) : filter === 'reminders' ? (
              <EmptyState
                icon="medical-outline"
                badge="Care Routine"
                title="No Reminders Active"
                description="No medication or care reminders are pending at this moment."
                actionLabel="Add Care Reminder"
                onAction={() => setNlInput('Give BP medicine to Dadi at 8 PM')}
              />
            ) : (
              <Text style={[styles.emptyInlineText, { color: colors.textSecondary }]}>
                No pending care reminders.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 14,
  },
  nlBox: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  nlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nlTextInput: {
    flex: 1,
    fontWeight: '500',
    paddingVertical: 6,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nlSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  nlSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontWeight: '700',
  },
  sectionWrapper: {
    gap: 6,
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 2,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyInlineText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
