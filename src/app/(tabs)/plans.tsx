import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
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
import { LayoutTokens } from '@/constants/theme';

const MOCK_DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'plan-1',
    title: 'Dr. Sharma Cardiology Checkup',
    time: 'Today, 10:30 AM',
    category: 'Health',
    categoryVariant: 'Safe',
    categoryColorScheme: 'blue',
    assigneeName: 'Dadi',
    assigneeInitial: 'D',
    notes: 'City Care Hospital • Routine monthly visit',
    type: 'event',
    isCompleted: false,
  },
  {
    id: 'plan-2',
    title: 'Pay Household Electricity Bill',
    time: 'Today, 2:00 PM',
    category: 'Utilities',
    categoryVariant: 'View',
    categoryColorScheme: 'yellow',
    assigneeName: 'Asmita',
    assigneeInitial: 'A',
    notes: 'Due today • Net banking / UPI',
    type: 'task',
    isCompleted: false,
  },
  {
    id: 'plan-3',
    title: "Dad's 60th Birthday Celebration",
    time: 'Tonight, 7:30 PM',
    category: 'Family',
    categoryVariant: 'Vault',
    categoryColorScheme: 'purple',
    assigneeName: 'All Family',
    assigneeInitial: 'F',
    notes: 'Family dinner reservations at The Grand Olive',
    type: 'event',
    isCompleted: false,
  },
  {
    id: 'plan-4',
    title: 'Evening Blood Pressure Check',
    time: 'Tonight, 8:00 PM',
    category: 'Care',
    categoryVariant: 'Safe',
    categoryColorScheme: 'green',
    assigneeName: 'Dad',
    assigneeInitial: 'D',
    notes: 'Post-dinner dosage: Amlodipine 5mg',
    type: 'reminder',
    isCompleted: false,
  },
];

const MOCK_DEFAULT_SUGGESTIONS = [
  'Doctor appointment',
  'Electricity bill',
  "Dad's birthday",
  'Grocery run',
  'Car service',
];

interface PlansScreenProps {
  initialPlans?: PlanItem[];
  suggestions?: string[];
  initialEmptyState?: boolean;
}

export default function PlansScreen({
  initialPlans = MOCK_DEFAULT_PLANS,
  suggestions = MOCK_DEFAULT_SUGGESTIONS,
  initialEmptyState = true,
}: PlansScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated } = useAuth();
  const { addTask } = useFamily();
  const { startListening, speak, isListening } = useVoice();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  // State management
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans);
  const [quickAddText, setQuickAddText] = useState<string>('');
  const [isPreviewEmpty, setIsPreviewEmpty] = useState<boolean>(initialEmptyState);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'event' | 'task' | 'reminder'>('all');

  const displayedPlans = categoryFilter === 'all'
    ? plans
    : plans.filter((p) => p.type === categoryFilter);

  const handleCategoryPress = (type: 'event' | 'task' | 'reminder') => {
    triggerHaptic();
    if (categoryFilter === type) {
      setCategoryFilter('all');
    } else {
      setCategoryFilter(type);
      setIsPreviewEmpty(false);
    }
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Toggle between previewing Empty state and Populated state
  const handleTogglePreview = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsPreviewEmpty((prev) => !prev);
  };

  // Submit or voice adds a draft plan or reminder
  const handleAddDraftPlan = () => {
    const trimmed = quickAddText.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    const newPlan: PlanItem = {
      id: `plan-${Date.now()}`,
      title: trimmed,
      time: 'Today, 11:00 AM',
      category: trimmed.toLowerCase().includes('doctor') || trimmed.toLowerCase().includes('medicine')
        ? 'Health'
        : trimmed.toLowerCase().includes('bill')
        ? 'Utilities'
        : 'General',
      categoryVariant: 'All good',
      categoryColorScheme: 'blue',
      assigneeName: 'Asmita',
      assigneeInitial: 'A',
      type: 'task',
      isCompleted: false,
    };

    setPlans((prev) => [newPlan, ...prev]);
    setIsPreviewEmpty(false);
    setQuickAddText('');

    // Also dispatch to FamilyContext for global sync
    addTask({
      title: trimmed,
      category: 'general',
      assignedToMemberId: '1',
      createdByMemberId: '1',
      dueDate: 'Today',
      dueTime: '11:00 AM',
      isCompleted: false,
      priority: 'urgent',
    });

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

  // Toggle plan completion
  const handleTogglePlan = (id: string) => {
    setPlans((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  // Tapping "+ Add Household Plan"
  const handleAddHouseholdPlan = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setQuickAddText('Doctor appointment with Dr. Sharma');
    setIsPreviewEmpty(false);
  };

  if (!isAuthenticated) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LightBackdrop />
      {/* 1. Header: Avatar 'A' with green online dot, title, subtitle, Bell, Theme toggle, Settings */}
      <PlansHeader
        onOpenSettings={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'plans' } })}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: LayoutTokens.tabBarHeight + LayoutTokens.tabBarBottomOffset + insets.bottom + 8 },
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

        {/* State Preview Switcher Bar (Empty ⇋ Populated) */}
        <View style={styles.previewToggleRow}>
          <Pressable
            onPress={handleTogglePreview}
            accessibilityLabel="Toggle state preview"
            style={({ pressed }) => [
              styles.previewTogglePill,
              {
                backgroundColor: isDark
                  ? 'rgba(59, 111, 240, 0.16)'
                  : 'rgba(124, 92, 224, 0.08)',
                borderColor: isDark
                  ? 'rgba(59, 111, 240, 0.35)'
                  : 'rgba(124, 92, 224, 0.20)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name={isPreviewEmpty ? 'layers-outline' : 'sparkles-outline'}
              size={13}
              color={isDark ? '#38BDF8' : '#7C5CE0'}
            />
            <Text
              style={[
                styles.previewToggleText,
                { color: isDark ? '#38BDF8' : '#7C5CE0' },
              ]}>
              State Preview: {isPreviewEmpty ? 'Empty State' : 'Populated State'} (Tap to switch)
            </Text>
          </Pressable>
        </View>

        {/* 4. Empty State Card OR 6. Populated State List */}
        {isPreviewEmpty ? (
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
          isPopulated={!isPreviewEmpty}
          scheduleStatus={
            !isPreviewEmpty
              ? '2 events • Next: Doctor 10:30 AM'
              : 'No scheduled calendar events for today.'
          }
          scheduleBadge={!isPreviewEmpty ? (categoryFilter === 'event' ? 'Active Filter' : '2 Events') : undefined}
          tasksStatus={
            !isPreviewEmpty
              ? '1 task • Next: Electricity bill 2:00 PM'
              : 'All family tasks have been completed.'
          }
          tasksBadge={!isPreviewEmpty ? (categoryFilter === 'task' ? 'Active Filter' : '1 Task') : undefined}
          remindersStatus={
            !isPreviewEmpty
              ? '1 reminder • Next: BP Check 8:00 PM'
              : 'Stay on top of important care, birthdays and more.'
          }
          remindersBadge={!isPreviewEmpty ? (categoryFilter === 'reminder' ? 'Active Filter' : '1 Reminder') : undefined}
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
  previewToggleRow: {
    paddingHorizontal: 18,
    paddingVertical: 2,
    alignItems: 'center',
  },
  previewTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  previewToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
