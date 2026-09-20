import React, { useState, useEffect } from 'react';
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

interface TimeDialerPickerProps {
  selectedTime: string; // e.g. "10:00 AM" or "6:30 PM"
  onSelectTime: (timeStr: string) => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '15', '30', '45'];

export const TimeDialerPicker: React.FC<TimeDialerPickerProps> = ({
  selectedTime,
  onSelectTime,
}) => {
  const { colors, isDark } = useAppTheme();

  // Parse initial time
  const parseTime = (str: string) => {
    const match = str.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      return {
        hour: parseInt(match[1], 10) || 10,
        minute: match[2] || '00',
        period: (match[3]?.toUpperCase() as 'AM' | 'PM') || 'AM',
      };
    }
    return { hour: 10, minute: '00', period: 'AM' as const };
  };

  const [parsed, setParsed] = useState(parseTime(selectedTime));

  useEffect(() => {
    setParsed(parseTime(selectedTime));
  }, [selectedTime]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const updateTime = (hour: number, minute: string, period: 'AM' | 'PM') => {
    triggerHaptic();
    setParsed({ hour, minute, period });
    onSelectTime(`${hour}:${minute} ${period}`);
  };

  const quickTimes = [
    { label: 'Morning', time: '9:00 AM', icon: 'sunny-outline' },
    { label: 'Afternoon', time: '1:00 PM', icon: 'partly-sunny-outline' },
    { label: 'Evening', time: '6:00 PM', icon: 'moon-outline' },
    { label: 'Night', time: '9:00 PM', icon: 'bed-outline' },
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
      {/* Time Display Header with AM/PM Switcher */}
      <View style={styles.headerDisplay}>
        <View style={styles.timeValueBox}>
          <Text style={[styles.timeDigits, { color: colors.text }]}>
            {parsed.hour.toString().padStart(2, '0')}:{parsed.minute}
          </Text>
        </View>

        {/* AM / PM Segmented Control */}
        <View
          style={[
            styles.periodToggle,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.05)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.15)',
            },
          ]}>
          {(['AM', 'PM'] as const).map((p) => {
            const isSelected = parsed.period === p;
            return (
              <Pressable
                key={p}
                onPress={() => updateTime(parsed.hour, parsed.minute, p)}
                style={({ pressed }) => [
                  styles.periodBtn,
                  isSelected && {
                    backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0',
                  },
                  { opacity: pressed ? 0.8 : 1 },
                ]}>
                <Text
                  style={[
                    styles.periodBtnText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isDark
                        ? colors.textMuted
                        : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Quick Time Presets */}
      <View style={styles.quickPresetsRow}>
        {quickTimes.map((q) => {
          const isSelected = selectedTime.toUpperCase() === q.time;
          return (
            <Pressable
              key={q.label}
              onPress={() => {
                const p = parseTime(q.time);
                updateTime(p.hour, p.minute, p.period);
              }}
              style={({ pressed }) => [
                styles.quickTimeBtn,
                {
                  backgroundColor: isSelected
                    ? (isDark ? '#8B7CF6' : '#7C5CE0')
                    : isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(20, 32, 58, 0.04)',
                  borderColor: isSelected
                    ? 'transparent'
                    : isDark
                    ? 'rgba(130, 140, 255, 0.18)'
                    : 'rgba(124, 92, 224, 0.12)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Ionicons
                name={q.icon as any}
                size={13}
                color={
                  isSelected
                    ? '#FFFFFF'
                    : isDark
                    ? '#A594FD'
                    : '#7C5CE0'
                }
              />
              <Text
                style={[
                  styles.quickTimeText,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isDark
                      ? colors.textMuted
                      : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {q.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Interactive Hours Dialer / Grid */}
      <View style={styles.sectionBlock}>
        <Text
          style={[
            styles.sectionLabel,
            { color: isDark ? '#A594FD' : '#7C5CE0' },
          ]}>
          HOUR
        </Text>
        <View style={styles.hoursGrid}>
          {HOURS.map((h) => {
            const isSelected = parsed.hour === h;
            return (
              <Pressable
                key={h}
                onPress={() => updateTime(h, parsed.minute, parsed.period)}
                style={({ pressed }) => [
                  styles.hourCell,
                  isSelected && {
                    backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0',
                    borderRadius: 12,
                    shadowColor: isDark ? '#8B7CF6' : '#7C5CE0',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.35,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                  {
                    borderColor: isSelected
                      ? 'transparent'
                      : isDark
                      ? 'rgba(130, 140, 255, 0.14)'
                      : 'rgba(124, 92, 224, 0.10)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.cellText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  {h}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Interactive Minutes Selector */}
      <View style={styles.sectionBlock}>
        <Text
          style={[
            styles.sectionLabel,
            { color: isDark ? '#A594FD' : '#7C5CE0' },
          ]}>
          MINUTE
        </Text>
        <View style={styles.minutesRow}>
          {MINUTES.map((m) => {
            const isSelected = parsed.minute === m;
            return (
              <Pressable
                key={m}
                onPress={() => updateTime(parsed.hour, m, parsed.period)}
                style={({ pressed }) => [
                  styles.minuteCell,
                  isSelected && {
                    backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0',
                    shadowColor: isDark ? '#8B7CF6' : '#7C5CE0',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.35,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                  {
                    borderColor: isSelected
                      ? 'transparent'
                      : isDark
                      ? 'rgba(130, 140, 255, 0.14)'
                      : 'rgba(124, 92, 224, 0.10)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.cellText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  :{m}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  headerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeDigits: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  periodToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  periodBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  periodBtnText: {
    fontSize: 12.5,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  quickTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickTimeText: {
    fontSize: 11,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  hourCell: {
    width: '15%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  minuteCell: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
  },
});
