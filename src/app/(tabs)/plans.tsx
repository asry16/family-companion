import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { TabBarTokens } from '@/constants/theme';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import {
  PlansHeader,
  PlansQuickAddField,
  PlansSuggestionChips,
  PlansEmptyStateCard,
  PlansSummaryList,
  PlansPopulatedList,
  PlanItem,
} from '@/components/plans';
import { LightBackdrop } from '@/components/ui/LightBackdrop';
import { DarkBackdrop } from '@/components/ui/DarkBackdrop';

const DEFAULT_SUGGESTIONS = [
  'Doctor appointment',
  'Grocery run',
  'Pay utility bill',
  'Evening medicine',
  'Family dinner',
];

interface PlansScreenProps {
  suggestions?: string[];
}

export default function PlansScreen({
  suggestions = DEFAULT_SUGGESTIONS,
}: PlansScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isAuthenticated, user } = useAuth();
  const {
    tasks,
    events,
    reminders,
    members,
    addTask,
    toggleTask,
    toggleReminder,
  } = useFamily();
  const { startListening, speak, isListening } = useVoice();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  // Quick add and filter state
  const [quickAddText, setQuickAddText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'event' | 'task' | 'reminder'>('all');

  // Convert real live context data into PlanItems
  const allPlans: PlanItem[] = useMemo(() => {
    const eventPlans: PlanItem[] = (events || []).map((e) => ({
      id: e.id,
      title: e.title,
      time: e.date ? `${e.date}${e.time ? `, ${e.time}` : ''}` : 'Today',
      category: e.category ? e.category.charAt(0).toUpperCase() + e.category.slice(1) : 'Event',
      categoryVariant: 'Safe',
      categoryColorScheme: 'blue',
      assigneeName: 'Family',
      assigneeInitial: 'F',
      notes: e.notes || e.location || undefined,
      type: 'event',
      isCompleted: false,
    }));

    const taskPlans: PlanItem[] = (tasks || []).map((t) => {
      const assigned = members?.find((m) => m.id === t.assignedToMemberId);
      return {
        id: t.id,
        title: t.title,
        time: t.dueDate ? `${t.dueDate}${t.dueTime ? `, ${t.dueTime}` : ''}` : 'Today',
        category: t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'Task',
        categoryVariant: t.isCompleted ? 'Safe' : 'View',
        categoryColorScheme: t.priority === 'urgent' ? 'yellow' : 'green',
        assigneeName: assigned?.name || user?.name || 'You',
        assigneeInitial: (assigned?.name || user?.name || 'Y').charAt(0).toUpperCase(),
        notes: t.priority ? `Priority: ${t.priority}` : undefined,
        type: 'task',
        isCompleted: t.isCompleted,
      };
    });

    const reminderPlans: PlanItem[] = (reminders || []).map((r) => {
      const target = members?.find((m) => m.id === r.targetMemberId);
      return {
        id: r.id,
        title: r.title,
        time: `${r.time || 'Today'}${r.repeat && r.repeat !== 'none' ? ` • ${r.repeat}` : ''}`,
        category: 'Care',
        categoryVariant: 'Vault',
        categoryColorScheme: 'purple',
        assigneeName: target?.name || user?.name || 'You',
        assigneeInitial: (target?.name || user?.name || 'Y').charAt(0).toUpperCase(),
        notes: r.dueDate ? `Due: ${r.dueDate}` : undefined,
        type: 'reminder',
        isCompleted: r.isDone,
      };
    });

    return [...eventPlans, ...taskPlans, ...reminderPlans];
  }, [events, tasks, reminders, members, user]);

  const displayedPlans = useMemo(() => {
    if (categoryFilter === 'all') return allPlans;
    return allPlans.filter((p) => p.type === categoryFilter);
  }, [allPlans, categoryFilter]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleCategoryPress = (type: 'event' | 'task' | 'reminder') => {
    triggerHaptic();
    if (categoryFilter === type) {
      setCategoryFilter('all');
    } else {
      setCategoryFilter(type);
    }
  };

  // Submit or voice adds a real task to family context
  const handleAddDraftPlan = () => {
    const trimmed = quickAddText.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    const memberId = user?.familyMemberId || members?.[0]?.id || '1';
    const isDoc = trimmed.toLowerCase().includes('doctor') || trimmed.toLowerCase().includes('medicine');
    const isBill = trimmed.toLowerCase().includes('bill');
    const isGroc = trimmed.toLowerCase().includes('grocery') || trimmed.toLowerCase().includes('milk');

    addTask({
      title: trimmed,
      category: isDoc ? 'health' : isBill ? 'bills' : isGroc ? 'groceries' : 'general',
      assignedToMemberId: memberId,
      createdByMemberId: memberId,
      dueDate: 'Today',
      dueTime: '12:00 PM',
      isCompleted: false,
      priority: 'normal',
    });

    setQuickAddText('');
    speak(`Added plan: ${trimmed}`);
  };

  // Blue mic button triggers voice input
  const handleVoiceInput = () => {
    startListening((recognized) => {
      if (recognized) {
        setQuickAddText(recognized);
      }
    });
  };

  // Toggle plan completion for real tasks or reminders
  const handleTogglePlan = (id: string) => {
    triggerHaptic();
    const isTask = tasks?.some((t) => t.id === id);
    if (isTask) {
      toggleTask(id);
      return;
    }
    const isReminder = reminders?.some((r) => r.id === id);
    if (isReminder) {
      toggleReminder(id);
      return;
    }
  };

  // Tapping "+ Add Household Plan" navigates to new plan modal
  const handleAddHouseholdPlan = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/modal/new-plan');
  };

  if (!isAuthenticated) return null;

  const isScreenEmpty = allPlans.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LightBackdrop />
      <DarkBackdrop />
      {/* 1. Header: Avatar with dynamic initials, title, subtitle, Bell, Theme toggle, Settings */}
      <PlansHeader
        onOpenSettings={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'plans' } })}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TabBarTokens.getScrollBottomPadding(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Quick-add field: Rounded glass bar with search icon & blue mic voice button */}
        <PlansQuickAddField
          value={quickAddText}
          onChangeText={setQuickAddText}
          onSubmit={handleAddDraftPlan}
          onVoicePress={handleVoiceInput}
          placeholder="Add a task or say a reminder…"
          isListening={isListening}
        />

        {/* 3. Suggestion chips: Horizontally scrollable row */}
        <PlansSuggestionChips
          suggestions={suggestions}
          activeQuery={quickAddText}
          onSelectSuggestion={(suggestion) => {
            setQuickAddText(suggestion);
          }}
        />

        {/* 4. Empty State Card OR Populated State List */}
        {isScreenEmpty ? (
          <PlansEmptyStateCard
            title="No Plans Scheduled"
            body="Your family schedule is completely open. Add a task or speak a reminder above."
            badgeLabel="FRESH SLATE"
            buttonLabel="+ Add Household Plan"
            onAddPlan={handleAddHouseholdPlan}
          />
        ) : (
          <PlansPopulatedList
            plans={displayedPlans}
            onTogglePlan={handleTogglePlan}
            onPressPlan={(_plan) => {
              triggerHaptic();
              router.push('/modal/new-plan');
            }}
            onAddPlan={() => {
              triggerHaptic();
              router.push('/modal/new-plan');
            }}
          />
        )}

        {/* 5. Summary List: TODAY'S SCHEDULE, FAMILY TASKS, CARE & REMINDERS */}
        <PlansSummaryList
          isPopulated={!isScreenEmpty}
          scheduleStatus={
            events?.length > 0
              ? `${events.length} ${events.length === 1 ? 'event' : 'events'} • Next: ${events[0].title}`
              : 'No scheduled calendar events for today.'
          }
          scheduleBadge={events?.length > 0 ? (categoryFilter === 'event' ? 'Active Filter' : `${events.length} ${events.length === 1 ? 'Event' : 'Events'}`) : undefined}
          tasksStatus={
            tasks?.length > 0
              ? `${tasks.filter((t) => !t.isCompleted).length} pending • Next: ${tasks[0].title}`
              : 'All family tasks have been completed.'
          }
          tasksBadge={tasks?.length > 0 ? (categoryFilter === 'task' ? 'Active Filter' : `${tasks.length} ${tasks.length === 1 ? 'Task' : 'Tasks'}`) : undefined}
          remindersStatus={
            reminders?.length > 0
              ? `${reminders.filter((r) => !r.isDone).length} active • Next: ${reminders[0].title}`
              : 'Stay on top of important care, birthdays and more.'
          }
          remindersBadge={reminders?.length > 0 ? (categoryFilter === 'reminder' ? 'Active Filter' : `${reminders.length} ${reminders.length === 1 ? 'Reminder' : 'Reminders'}`) : undefined}
          onPressSchedule={() => handleCategoryPress('event')}
          onPressTasks={() => handleCategoryPress('task')}
          onPressReminders={() => handleCategoryPress('reminder')}
        />
      </ScrollView>
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
    paddingTop: 4,
    gap: 12,
  },
});

