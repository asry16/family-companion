import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LightBackdrop, DarkBackdrop, GlassCard, CalendarDatePicker, TimeDialerPicker } from '@/components/ui';
import { PriorityLevel } from '@/types';

export default function NewPlanModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser, addTask, addEvent, addReminder } = useFamily();
  const { speak } = useVoice();

  const [type, setType] = useState<'task' | 'event' | 'reminder'>('task');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(members.find(m => !m.isSelf)?.id || members[0]?.id || 'self');
  const [dueDate, setDueDate] = useState('Tomorrow');
  const [time, setTime] = useState('10:00 AM');
  const [priority, setPriority] = useState<PriorityLevel>('urgent');

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    router.back();
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    if (type === 'task') {
      addTask({
        title: title.trim(),
        category: 'general',
        assignedToMemberId: assigneeId,
        createdByMemberId: activeUser.id,
        dueDate,
        dueTime: time,
        isCompleted: false,
        priority,
      });
      speak(`Task added for ${members.find((m) => m.id === assigneeId)?.name || 'family'}`);
    } else if (type === 'event') {
      addEvent({
        title: title.trim(),
        date: dueDate,
        time,
        durationMinutes: 45,
        location: 'Home / Clinic',
        category: 'family',
        attendeeMemberIds: [assigneeId, activeUser.id],
      });
      speak(`Event scheduled: ${title}`);
    } else {
      addReminder({
        title: title.trim(),
        targetMemberId: assigneeId,
        time,
        dueDate,
        category: 'medicine',
        urgency: priority,
        isDone: false,
      });
      speak(`Reminder created for ${time}`);
    }

    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LightBackdrop />
      <DarkBackdrop />

      {/* Modern Frosted Header */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 16,
            borderBottomColor: isDark ? 'rgba(130, 140, 255, 0.14)' : 'rgba(124, 92, 224, 0.10)',
          },
        ]}>
        <View>
          <Text
            style={[
              styles.navTitle,
              { color: colors.text, fontSize: isElderly ? 22 : 18 },
            ]}>
            Create Family Plan
          </Text>
          <Text style={[styles.navSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
            Coordinate events, tasks, and care
          </Text>
        </View>

        <Pressable
          onPress={handleClose}
          hitSlop={8}
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 92, 224, 0.08)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          <Ionicons name="close" size={19} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}>
        {/* Type Selector (Task, Event, Reminder) */}
        <View style={styles.typeRow}>
          {[
            { id: 'task', label: 'Task', icon: 'checkbox-outline' },
            { id: 'event', label: 'Event', icon: 'calendar-outline' },
            { id: 'reminder', label: 'Reminder', icon: 'alarm-outline' },
          ].map((t) => {
            const isSelected = type === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                  }
                  setType(t.id as any);
                }}
                style={({ pressed }) => [
                  styles.typeBtn,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? '#8A6BF2' : '#7C5CE0')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.82)'),
                    borderColor: isSelected
                      ? 'transparent'
                      : (isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)'),
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}>
                <Ionicons
                  name={t.icon as any}
                  size={16}
                  color={isSelected ? '#FFFFFF' : (isDark ? '#A594FD' : '#6E5ADC')}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    {
                      color: isSelected ? '#FFFFFF' : (isDark ? '#C7CEEA' : '#4E5375'),
                      fontSize: isElderly ? 16 : 13.5,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Title Input */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.fieldLabel,
              { color: isDark ? '#A594FD' : '#7C5CE0', fontSize: isElderly ? 15 : 12 },
            ]}>
            WHAT NEEDS TO BE DONE?
          </Text>
          <TextInput
            placeholder="e.g. Buy milk & vegetables, Mom doctor consult..."
            placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
            value={title}
            onChangeText={setTitle}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
                color: colors.text,
                fontSize: isElderly ? 17 : 15,
              },
            ]}
          />
        </View>

        {/* Assignee Picker */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.fieldLabel,
              { color: isDark ? '#A594FD' : '#7C5CE0', fontSize: isElderly ? 15 : 12 },
            ]}>
            ASSIGN TO FAMILY MEMBER
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
            {members.map((m) => {
              const isSelected = assigneeId === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                    }
                    setAssigneeId(m.id);
                  }}
                  style={({ pressed }) => [
                    styles.memberPickCard,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? '#8A6BF2' : '#7C5CE0')
                        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.82)'),
                      borderColor: isSelected
                        ? 'transparent'
                        : (isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)'),
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}>
                  <FamilyAvatar member={m} size="sm" showStatus={false} />
                  <Text
                    style={[
                      styles.memberName,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: isElderly ? 15 : 13,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}>
                    {m.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Date Choosing from Calendar */}
        <View style={styles.formGroup}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={15} color={isDark ? '#A594FD' : '#7C5CE0'} />
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#A594FD' : '#7C5CE0', fontSize: isElderly ? 15 : 12 },
                ]}>
                DATE FROM CALENDAR
              </Text>
            </View>
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(124, 92, 224, 0.10)',
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.32)' : 'rgba(124, 92, 224, 0.20)',
                },
              ]}>
              <Text style={[styles.activeBadgeText, { color: isDark ? '#A594FD' : '#7C5CE0' }]}>
                {dueDate}
              </Text>
            </View>
          </View>
          <CalendarDatePicker
            selectedDate={dueDate}
            onSelectDate={(newDate) => setDueDate(newDate)}
          />
        </View>

        {/* Time Choosing from Dialer */}
        <View style={styles.formGroup}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="time-outline" size={15} color={isDark ? '#A594FD' : '#7C5CE0'} />
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#A594FD' : '#7C5CE0', fontSize: isElderly ? 15 : 12 },
                ]}>
                TIME FROM DIALER
              </Text>
            </View>
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(124, 92, 224, 0.10)',
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.32)' : 'rgba(124, 92, 224, 0.20)',
                },
              ]}>
              <Text style={[styles.activeBadgeText, { color: isDark ? '#A594FD' : '#7C5CE0' }]}>
                {time}
              </Text>
            </View>
          </View>
          <TimeDialerPicker
            selectedTime={time}
            onSelectTime={(newTime) => setTime(newTime)}
          />
        </View>

        {/* Priority Selector */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.fieldLabel,
              { color: isDark ? '#A594FD' : '#7C5CE0', fontSize: isElderly ? 15 : 12 },
            ]}>
            PRIORITY LEVEL
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { id: 'urgent', label: 'Urgent', color: '#EF4444' },
              { id: 'important', label: 'Normal', color: isDark ? '#4F8EF7' : '#3B82F6' },
            ].map((p) => {
              const isSelected = priority === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                    }
                    setPriority(p.id as any);
                  }}
                  style={[
                    styles.timingPill,
                    {
                      backgroundColor: isSelected
                        ? p.color
                        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.82)'),
                      borderColor: isSelected
                        ? 'transparent'
                        : (isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)'),
                    },
                  ]}>
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '600',
                      fontSize: 13,
                    }}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <View style={{ marginTop: 8 }}>
          <PrimaryButton
            label="Save to Family Planner"
            onPress={handleSave}
            disabled={!title.trim()}
            size={isElderly ? 'elderly' : 'large'}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 18,
    gap: 18,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  typeBtnText: {
    letterSpacing: 0.1,
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '500',
  },
  memberPickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    gap: 8,
  },
  memberName: {
    letterSpacing: 0.2,
  },
  timingRow: {
    flexDirection: 'row',
    gap: 14,
  },
  timingPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  activeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

