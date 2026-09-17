import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { CalendarEvent } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';

interface EventCardProps {
  event: CalendarEvent;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { colors, isElderly } = useAppTheme();
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
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderLeftColor: colors.blue,
          borderLeftWidth: 4,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <View style={styles.timeColumn}>
        <Text
          style={[
            styles.timeText,
            {
              color: colors.blue,
              fontSize: isElderly ? 18 : 14,
            },
          ]}>
          {event.time}
        </Text>
        <Text style={{ fontSize: isElderly ? 22 : 18, marginTop: 4 }}>
          {getEventIcon()}
        </Text>
      </View>

      <View style={styles.detailsColumn}>
        <Text
          style={[
            styles.titleText,
            {
              color: colors.text,
              fontSize: isElderly ? 20 : 15,
            },
          ]}>
          {event.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <Text
            style={[
              styles.locationText,
              {
                color: colors.textSecondary,
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
                color: colors.textMuted,
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
                color: colors.textSecondary,
                fontSize: isElderly ? 13 : 11,
                marginLeft: 12,
              },
            ]}>
            {attendees.map((a) => a.name).join(', ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
    gap: 14,
  },
  timeColumn: {
    alignItems: 'center',
    width: 60,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
  },
  timeText: {
    fontWeight: '700',
  },
  detailsColumn: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontWeight: '600',
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
    fontWeight: '500',
  },
});
