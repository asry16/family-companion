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
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PriorityLevel } from '@/types';

export default function NewPlanModal() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const { members, addTask, addEvent, addReminder } = useFamily();
  const { speak } = useVoice();

  const [type, setType] = useState<'task' | 'event' | 'reminder'>('task');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(members[1]?.id || 'member_dad');
  const [dueDate, setDueDate] = useState('Tomorrow');
  const [time, setTime] = useState('10:00 AM');
  const [priority, setPriority] = useState<PriorityLevel>('urgent');

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
        createdByMemberId: 'member_ritu',
        dueDate,
        dueTime: time,
        isCompleted: false,
        priority,
      });
      speak(`Task added for ${members.find((m) => m.id === assigneeId)?.name || 'Dad'}`);
    } else if (type === 'event') {
      addEvent({
        title: title.trim(),
        date: dueDate,
        time,
        durationMinutes: 45,
        location: 'Home / Clinic',
        category: 'family',
        attendeeMemberIds: [assigneeId, 'member_ritu'],
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
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.borderSubtle,
          },
        ]}>
        <Text
          style={[
            styles.navTitle,
            { color: colors.text, fontSize: isElderly ? 22 : 17 },
          ]}>
          Create Family Plan
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
                onPress={() => setType(t.id as any)}
                style={({ pressed }) => [
                  styles.typeBtn,
                  {
                    backgroundColor: isSelected ? colors.brand : colors.cardBackground,
                    borderColor: isSelected ? colors.brand : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Ionicons
                  name={t.icon as any}
                  size={16}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontSize: isElderly ? 16 : 13,
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
              { color: colors.textSecondary, fontSize: isElderly ? 16 : 13 },
            ]}>
            WHAT NEEDS TO BE DONE?
          </Text>
          <TextInput
            placeholder="e.g. Buy milk & vegetables, Mom doctor consult..."
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                color: colors.text,
                fontSize: isElderly ? 18 : 15,
              },
            ]}
          />
        </View>

        {/* Assignee Picker */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.fieldLabel,
              { color: colors.textSecondary, fontSize: isElderly ? 16 : 13 },
            ]}>
            ASSIGN TO FAMILY MEMBER
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {members.map((m) => {
              const isSelected = assigneeId === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setAssigneeId(m.id)}
                  style={({ pressed }) => [
                    styles.memberPickCard,
                    {
                      backgroundColor: isSelected ? colors.brand : colors.cardBackground,
                      borderColor: isSelected ? colors.brand : colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <FamilyAvatar member={m} size="sm" showStatus={false} />
                  <Text
                    style={[
                      styles.memberName,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: isElderly ? 15 : 13,
                      },
                    ]}>
                    {m.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Timing options */}
        <View style={styles.timingRow}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              DATE
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['Today', 'Tomorrow'].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDueDate(d)}
                  style={[
                    styles.timingPill,
                    {
                      backgroundColor: dueDate === d ? colors.brand : colors.cardBackground,
                      borderColor: dueDate === d ? colors.brand : colors.border,
                    },
                  ]}>
                  <Text style={{ color: dueDate === d ? '#FFFFFF' : colors.text, fontWeight: '600', fontSize: 13 }}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              PRIORITY
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { id: 'urgent', label: 'Urgent', color: colors.red },
                { id: 'important', label: 'Normal', color: colors.blue },
              ].map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setPriority(p.id as any)}
                  style={[
                    styles.timingPill,
                    {
                      backgroundColor: priority === p.id ? colors.brand : colors.cardBackground,
                      borderColor: priority === p.id ? colors.brand : colors.border,
                    },
                  ]}>
                  <Text style={{ color: priority === p.id ? '#FFFFFF' : colors.text, fontWeight: '600', fontSize: 13 }}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Submit */}
        <View style={{ marginTop: 14 }}>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
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
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  typeBtnText: {
    fontWeight: '700',
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '500',
  },
  memberPickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  memberName: {
    fontWeight: '700',
  },
  timingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timingPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
