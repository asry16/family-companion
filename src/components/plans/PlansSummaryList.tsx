import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';

export interface PlansSummaryListProps {
  isPopulated?: boolean;
  scheduleStatus?: string;
  scheduleBadge?: string;
  tasksStatus?: string;
  tasksBadge?: string;
  remindersStatus?: string;
  remindersBadge?: string;
  onPressSchedule?: () => void;
  onPressTasks?: () => void;
  onPressReminders?: () => void;
}

export const PlansSummaryList: React.FC<PlansSummaryListProps> = ({
  isPopulated = false,
  scheduleStatus,
  scheduleBadge,
  tasksStatus,
  tasksBadge,
  remindersStatus,
  remindersBadge,
  onPressSchedule,
  onPressTasks,
  onPressReminders,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const resolvedScheduleStatus =
    scheduleStatus ||
    (isPopulated
      ? 'Upcoming events scheduled for today'
      : 'No scheduled calendar events for today.');

  const resolvedTasksStatus =
    tasksStatus ||
    (isPopulated
      ? 'Active family tasks in progress'
      : 'All family tasks have been completed.');

  const resolvedRemindersStatus =
    remindersStatus ||
    (isPopulated
      ? 'Active care and household reminders'
      : 'Stay on top of important care, birthdays and more.');

  const dividerColor = isDark
    ? 'rgba(130, 140, 255, 0.12)'
    : 'rgba(20, 32, 58, 0.06)';

  return (
    <GlassCard
      borderRadius={24}
      glowColor={undefined}
      style={styles.cardContainer}
      contentStyle={styles.cardContent}>
      {/* 1. TODAY'S SCHEDULE Row */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          if (onPressSchedule) onPressSchedule();
        }}
        accessibilityLabel="Today's Schedule"
        style={({ pressed }) => [
          styles.rowItem,
          { opacity: pressed ? 0.75 : 1 },
        ]}>
        {/* Colored Circle Icon: Blue */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : '#EFF6FF',
              borderColor: isDark ? 'rgba(139, 124, 246, 0.30)' : 'rgba(59, 111, 240, 0.20)',
            },
          ]}>
          <Ionicons
            name="calendar"
            size={18}
            color={isDark ? '#8B7CF6' : colors.blue}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textCluster}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.rowTitle,
                { color: colors.text, fontSize: isElderly ? 14 : 12.5 },
              ]}>
              TODAY'S SCHEDULE
            </Text>
            {scheduleBadge && (
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isDark ? 'rgba(139, 124, 246, 0.20)' : 'rgba(59, 111, 240, 0.10)',
                  },
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    { color: isDark ? '#8B7CF6' : colors.blue },
                  ]}>
                  {scheduleBadge}
                </Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.rowStatus,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            {resolvedScheduleStatus}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? colors.textMuted : colors.textSecondary}
        />
      </Pressable>

      {/* Thin Divider */}
      <View style={[styles.thinDivider, { backgroundColor: dividerColor }]} />

      {/* 2. FAMILY TASKS Row */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          if (onPressTasks) onPressTasks();
        }}
        accessibilityLabel="Family Tasks"
        style={({ pressed }) => [
          styles.rowItem,
          { opacity: pressed ? 0.75 : 1 },
        ]}>
        {/* Colored Circle Icon: Green */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(34, 197, 139, 0.18)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(34, 197, 139, 0.20)',
            },
          ]}>
          <Ionicons
            name="checkbox-outline"
            size={18}
            color={colors.green}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textCluster}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.rowTitle,
                { color: colors.text, fontSize: isElderly ? 14 : 12.5 },
              ]}>
              FAMILY TASKS
            </Text>
            {tasksBadge && (
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isDark ? 'rgba(34, 197, 139, 0.25)' : 'rgba(34, 197, 139, 0.10)',
                  },
                ]}>
                <Text style={[styles.badgeText, { color: colors.green }]}>
                  {tasksBadge}
                </Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.rowStatus,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            {resolvedTasksStatus}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? colors.textMuted : colors.textSecondary}
        />
      </Pressable>

      {/* Thin Divider */}
      <View style={[styles.thinDivider, { backgroundColor: dividerColor }]} />

      {/* 3. CARE & REMINDERS Row */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          if (onPressReminders) onPressReminders();
        }}
        accessibilityLabel="Care & Reminders"
        style={({ pressed }) => [
          styles.rowItem,
          { opacity: pressed ? 0.75 : 1 },
        ]}>
        {/* Colored Circle Icon: Purple */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : '#F5F3FF',
              borderColor: isDark ? 'rgba(139, 124, 246, 0.30)' : 'rgba(124, 92, 224, 0.20)',
            },
          ]}>
          <Ionicons
            name="heart"
            size={18}
            color={isDark ? '#8B7CF6' : colors.purple}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textCluster}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.rowTitle,
                { color: colors.text, fontSize: isElderly ? 14 : 12.5 },
              ]}>
              CARE & REMINDERS
            </Text>
            {remindersBadge && (
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isDark ? 'rgba(139, 124, 246, 0.20)' : 'rgba(124, 92, 224, 0.10)',
                  },
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    { color: isDark ? '#8B7CF6' : colors.purple },
                  ]}>
                  {remindersBadge}
                </Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.rowStatus,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            {resolvedRemindersStatus}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? colors.textMuted : colors.textSecondary}
        />
      </Pressable>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 18,
    marginVertical: 6,
    padding: 0,
  },
  cardContent: {
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCluster: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  rowStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  thinDivider: {
    height: 1,
    width: '100%',
  },
});
