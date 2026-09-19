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
import { StatusChip, StatusChipVariant } from '@/components/ui/StatusChip';
import { PillButton } from '@/components/ui/PillButton';

export interface PlanItem {
  id: string;
  title: string;
  time: string;
  category: string;
  categoryVariant?: StatusChipVariant;
  categoryColorScheme?: 'green' | 'blue' | 'purple' | 'yellow';
  assigneeName: string;
  assigneeInitial: string;
  notes?: string;
  type: 'event' | 'task' | 'reminder';
  isCompleted?: boolean;
}

export interface PlansPopulatedListProps {
  plans: PlanItem[];
  onTogglePlan?: (id: string) => void;
  onPressPlan?: (plan: PlanItem) => void;
  onAddPlan: () => void;
}

export const PlansPopulatedList: React.FC<PlansPopulatedListProps> = ({
  plans,
  onTogglePlan,
  onPressPlan,
  onAddPlan,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row: Count & Add Plan quick action */}
      <View style={styles.headerBar}>
        <View style={styles.countBadge}>
          <Text style={[styles.countBadgeText, { color: isDark ? '#8B7CF6' : '#6D5BD0' }]}>
            {plans.length} SCHEDULED {plans.length === 1 ? 'PLAN' : 'PLANS'}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            onAddPlan();
          }}
          style={({ pressed }) => [
            styles.addPlanHeaderBtn,
            {
              backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(124, 92, 224, 0.08)',
              borderColor: isDark ? 'rgba(139, 124, 246, 0.35)' : 'rgba(124, 92, 224, 0.20)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="add" size={15} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
          <Text style={[styles.addPlanHeaderText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>
            Add Plan
          </Text>
        </Pressable>
      </View>

      {/* Plan Cards */}
      <View style={styles.cardList}>
        {plans.map((plan) => {
          const isDone = !!plan.isCompleted;

          return (
            <GlassCard
              key={plan.id}
              borderRadius={20}
              onPress={() => {
                if (onPressPlan) onPressPlan(plan);
              }}
              style={styles.planCard}
              contentStyle={styles.planCardContent}>
              {/* Top Row: Time Badge & Category StatusChip */}
              <View style={styles.cardTopRow}>
                {/* Time Badge */}
                <View
                  style={[
                    styles.timeBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(20, 32, 58, 0.05)',
                      borderColor: isDark
                        ? 'rgba(140, 150, 255, 0.20)'
                        : 'rgba(20, 32, 58, 0.08)',
                    },
                  ]}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={isDark ? colors.textMuted : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.timeBadgeText,
                      { color: isDark ? colors.textMuted : colors.textSecondary },
                    ]}>
                    {plan.time}
                  </Text>
                </View>

                {/* Category StatusChip */}
                <StatusChip
                  variant={plan.categoryVariant || 'All good'}
                  colorScheme={plan.categoryColorScheme}
                  label={plan.category}
                  size="sm"
                  showDot
                />
              </View>

              {/* Title & Notes */}
              <View style={styles.titleArea}>
                <Text
                  style={[
                    styles.planTitle,
                    {
                      color: isDone
                        ? isDark
                          ? colors.textMuted
                          : colors.textSecondary
                        : colors.text,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                      fontSize: isElderly ? 18 : 15.5,
                    },
                  ]}>
                  {plan.title}
                </Text>
                {plan.notes && (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.planNotes,
                      { color: isDark ? colors.textMuted : colors.textSecondary },
                    ]}>
                    {plan.notes}
                  </Text>
                )}
              </View>

              {/* Bottom Row: Assignee Avatar + Toggle Checkbox */}
              <View style={styles.cardBottomRow}>
                {/* Assignee Avatar & Name */}
                <View style={styles.assigneeWrap}>
                  <View
                    style={[
                      styles.assigneeAvatar,
                      {
                        backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : '#F3F0FC',
                        borderColor: isDark
                          ? 'rgba(139, 124, 246, 0.35)'
                          : 'rgba(124, 92, 224, 0.18)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.assigneeInitial,
                        { color: isDark ? '#8B7CF6' : '#7C5CE0' },
                      ]}>
                      {plan.assigneeInitial}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.assigneeName,
                      { color: isDark ? colors.textMuted : colors.textSecondary },
                    ]}>
                    {plan.assigneeName}
                  </Text>
                </View>

                {/* Completion Checkbox */}
                <Pressable
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    if (onTogglePlan) onTogglePlan(plan.id);
                  }}
                  hitSlop={8}
                  accessibilityLabel={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  style={({ pressed }) => [
                    styles.checkButton,
                    {
                      backgroundColor: isDone
                        ? colors.green
                        : isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(20, 32, 58, 0.05)',
                      borderColor: isDone
                        ? colors.green
                        : isDark
                        ? 'rgba(140, 150, 255, 0.25)'
                        : 'rgba(20, 32, 58, 0.15)',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  {isDone && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </Pressable>
              </View>
            </GlassCard>
          );
        })}
      </View>

      {/* Floating or bottom Add Plan Entry Point */}
      <View style={styles.addPlanBar}>
        <PillButton
          title="+ Add Household Plan"
          variant="primary"
          size="md"
          onPress={onAddPlan}
          style={styles.fullWidthBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginVertical: 4,
    gap: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  countBadge: {
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  addPlanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  addPlanHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardList: {
    gap: 8,
  },
  planCard: {
    padding: 0,
  },
  planCardContent: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  titleArea: {
    gap: 3,
  },
  planTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  planNotes: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  assigneeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  assigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitial: {
    fontSize: 11,
    fontWeight: '800',
  },
  assigneeName: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlanBar: {
    marginTop: 4,
  },
  fullWidthBtn: {
    width: '100%',
  },
});
