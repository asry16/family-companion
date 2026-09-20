import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyMember } from '@/types';

interface CircleMemberRowProps {
  member: FamilyMember;
  isSelf?: boolean;
  accentColor?: string;
  isSelected?: boolean;
  onPress: () => void;
}

export const CircleMemberRow: React.FC<CircleMemberRowProps> = ({
  member,
  isSelf = false,
  accentColor = '#4F8EF7',
  isSelected = false,
  onPress,
}) => {
  const { colors, isDark } = useAppTheme();

  const initials = member.name.charAt(0).toUpperCase();
  const relation = member.relation || (isSelf ? 'Self' : 'Family');
  const place = member.humanLocation || 'At Home';
  const time = member.lastUpdated || 'Just now';
  const subtitle = isSelf
    ? `Self • ${place} • ${time}`
    : `${place} • ${time}`;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handlePress = () => {
    triggerHaptic();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.rowCard,
        {
          backgroundColor: isDark
            ? isSelected
              ? 'rgba(30, 39, 95, 0.6)'
              : 'rgba(20, 27, 74, 0.4)'
            : isSelected
            ? '#F5F3FF'
            : '#FFFFFF',
          borderColor: isDark
            ? isSelected
              ? accentColor
              : 'rgba(130, 140, 255, 0.2)'
            : isSelected
            ? '#7C5CE0'
            : 'rgba(20, 32, 58, 0.06)',
          shadowColor: '#64748B',
          shadowOpacity: isDark ? 0 : 0.04,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {/* Avatar with solid accent color */}
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: member.avatarColor || accentColor,
              borderColor: isDark ? accentColor : '#FFFFFF',
            },
          ]}>
          {member.photoUrl ? (
            <Image source={{ uri: member.photoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.initialText}>{initials}</Text>
          )}
        </View>
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: '#10B981',
              borderColor: isDark ? '#141A4A' : '#FFFFFF',
            },
          ]}
        />
      </View>

      {/* Info Column */}
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[styles.nameText, { color: isDark ? '#FFFFFF' : '#1E1B4B' }]}>
            {member.name}
          </Text>
          {isSelf && (
            <View
              style={[
                styles.youBadge,
                { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.2)' : '#EDE9FE' },
              ]}>
              <Text
                style={[
                  styles.youBadgeText,
                  { color: isDark ? '#8B7CF6' : '#7C5CE0' },
                ]}>
                You
              </Text>
            </View>
          )}
        </View>

        <View style={styles.subtitleRow}>
          <Ionicons
            name="location-sharp"
            size={11.5}
            color={isDark ? '#8B7CF6' : '#7C5CE0'}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.subtitleText,
              { color: isDark ? '#94A3B8' : '#6B7280' },
            ]}>
            {subtitle}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color={isDark ? '#C9CEFF' : '#9CA3AF'} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowCard: {
    height: 70,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 14,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  initialText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  youBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  youBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
