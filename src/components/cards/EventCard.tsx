import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { CalendarEvent } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Radius } from '@/constants/theme';

interface EventCardProps {
  event: CalendarEvent;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members } = useFamily();

  const attendees = members.filter((m) =>
    event.attendeeMemberIds.includes(m.id)
  );

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
      onPress();
    }
  };

  const getEventIcon = () => {
    switch (event.category) {
      case 'doctor':
        return '🩺';
      case 'school':
        return '🎓';
      case 'work':
        return '💼';
      case 'celebration':
        return '🎉';
      case 'family':
      default:
        return '🍲';
    }
  };

  return (
    <GlassCard
      borderRadius={22}
      onPress={handlePress}
      glowColor={isDark ? 'rgba(79, 142, 247, 0.20)' : undefined}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      {/* Time & Category Pill Capsule */}
      <View
        style={[
          styles.timePill,
          {
            backgroundColor: isDark
              ? 'rgba(79, 142, 247, 0.12)'
              : 'rgba(124, 92, 224, 0.08)',
            borderColor: isDark
              ? 'rgba(79, 142, 247, 0.30)'
              : 'rgba(124, 92, 224, 0.18)',
          },
        ]}>
        <Text style={{ fontSize: isElderly ? 20 : 16 }}>
          {getEventIcon()}
        </Text>
        <Text
          style={[
            styles.timeText,
            {
              color: isDark ? '#8B7CF6' : colors.blue,
              fontSize: isElderly ? 16 : 13,
            },
          ]}>
          {event.time}
        </Text>
      </View>

      <View style={styles.detailsColumn}>
        <Text
          style={[
            styles.titleText,
            {
              color: colors.text,
              fontSize: isElderly ? 20 : 15.5,
            },
          ]}>
          {event.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={isDark ? colors.textTertiary : colors.textSecondary}
          />
          <Text
            style={[
              styles.locationText,
              {
                color: isDark ? colors.textMuted : colors.textSecondary,
                fontSize: isElderly ? 15 : 12,
              },
            ]}>
            {event.location}
          </Text>
        </View>

        {event.notes && (
          <Text
            style={[
              styles.notesText,
              {
                color: isDark ? colors.textTertiary : colors.textMuted,
                fontSize: isElderly ? 14 : 11,
              },
            ]}>
            {event.notes}
          </Text>
        )}

        <View style={styles.attendeesRow}>
          {attendees.map((attendee) => (
            <FamilyAvatar
              key={attendee.id}
              member={attendee}
              size="sm"
              showStatus={false}
              style={{ marginRight: -6 }}
            />
          ))}
          <Text
            style={[
              styles.attendeesCount,
              {
                color: isDark ? colors.textTertiary : colors.textSecondary,
                fontSize: isElderly ? 13 : 11,
                marginLeft: attendees.length > 0 ? 12 : 0,
              },
            ]}>
            {attendees.map((a) => a.name).join(', ')}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 64,
    gap: 4,
  },
  timeText: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  detailsColumn: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontWeight: '500',
  },
  notesText: {
    fontStyle: 'italic',
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  attendeesCount: {
    fontWeight: '600',
  },
});
