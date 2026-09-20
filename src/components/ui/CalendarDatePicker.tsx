import React, { useState, useMemo } from 'react';
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

interface CalendarDatePickerProps {
  selectedDate: string; // e.g. "Today", "Tomorrow", or "2026-09-22" / "Sep 22, 2026"
  onSelectDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { colors, isDark } = useAppTheme();

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handlePrevMonth = () => {
    triggerHaptic();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isToday: boolean;
    }> = [];

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr: `${MONTH_NAMES[(currentMonth + 11) % 12].slice(0, 3)} ${d}`,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        todayYear === currentYear && todayMonth === currentMonth && todayDate === d;
      const monthAbbr = MONTH_NAMES[currentMonth].slice(0, 3);
      days.push({
        day: d,
        isCurrentMonth: true,
        dateStr: `${monthAbbr} ${d}, ${currentYear}`,
        isToday,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          dateStr: `${MONTH_NAMES[(currentMonth + 1) % 12].slice(0, 3)} ${i}`,
          isToday: false,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  const quickPresets = [
    { label: 'Today', value: 'Today' },
    { label: 'Tomorrow', value: 'Tomorrow' },
    {
      label: 'This Weekend',
      getValue: () => {
        const d = new Date();
        const diff = (6 - d.getDay() + 7) % 7 || 7;
        const sat = new Date(d.setDate(d.getDate() + diff));
        return `${MONTH_NAMES[sat.getMonth()].slice(0, 3)} ${sat.getDate()}`;
      },
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(20, 27, 74, 0.75)' : 'rgba(255, 255, 255, 0.90)',
          borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
        },
      ]}>
      {/* Quick Presets Bar */}
      <View style={styles.presetsRow}>
        {quickPresets.map((preset) => {
          const val = preset.getValue ? preset.getValue() : preset.value;
          const isSelected = selectedDate === preset.label || selectedDate === val;

          return (
            <Pressable
              key={preset.label}
              onPress={() => {
                triggerHaptic();
                onSelectDate(val);
              }}
              style={({ pressed }) => [
                styles.presetPill,
                {
                  backgroundColor: isSelected
                    ? (isDark ? '#8B7CF6' : '#7C5CE0')
                    : isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(20, 32, 58, 0.05)',
                  borderColor: isSelected
                    ? 'transparent'
                    : isDark
                    ? 'rgba(130, 140, 255, 0.20)'
                    : 'rgba(124, 92, 224, 0.14)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.presetText,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isDark
                      ? colors.textMuted
                      : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Month Navigation Header */}
      <View style={styles.monthHeader}>
        <Pressable
          onPress={handlePrevMonth}
          hitSlop={10}
          style={({ pressed }) => [
            styles.navArrow,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 92, 224, 0.08)',
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Ionicons name="chevron-back" size={16} color={colors.text} />
        </Pressable>

        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>

        <Pressable
          onPress={handleNextMonth}
          hitSlop={10}
          style={({ pressed }) => [
            styles.navArrow,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 92, 224, 0.08)',
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Ionicons name="chevron-forward" size={16} color={colors.text} />
        </Pressable>
      </View>

      {/* Weekdays Row */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((w, idx) => (
          <Text
            key={idx}
            style={[
              styles.weekdayText,
              { color: isDark ? 'rgba(170, 180, 220, 0.6)' : '#8E95AA' },
            ]}>
            {w}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {calendarDays.map((item, idx) => {
          const isSelected =
            selectedDate === item.dateStr ||
            (item.isToday && selectedDate === 'Today');

          return (
            <Pressable
              key={idx}
              disabled={!item.isCurrentMonth}
              onPress={() => {
                triggerHaptic();
                onSelectDate(item.dateStr);
              }}
              style={({ pressed }) => [
                styles.dayCell,
                isSelected && {
                  backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0',
                  borderRadius: 12,
                  shadowColor: isDark ? '#8B7CF6' : '#7C5CE0',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 5,
                  elevation: 4,
                },
                item.isToday &&
                  !isSelected && {
                    borderColor: isDark ? '#8B7CF6' : '#7C5CE0',
                    borderWidth: 1,
                    borderRadius: 12,
                  },
                { opacity: pressed ? 0.8 : item.isCurrentMonth ? 1 : 0.22 },
              ]}>
              <Text
                style={[
                  styles.dayText,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : item.isToday
                      ? isDark
                        ? '#A594FD'
                        : '#7C5CE0'
                      : colors.text,
                    fontWeight: isSelected || item.isToday ? '700' : '500',
                  },
                ]}>
                {item.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  presetPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  navArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekdayText: {
    width: 34,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  dayCell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
  },
});
