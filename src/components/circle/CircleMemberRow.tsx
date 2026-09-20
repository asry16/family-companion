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
import { CircleTokens } from '@/constants/theme';

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
  const { colors, isDark, isElderly } = useAppTheme();

  const initials = member.name.charAt(0).toUpperCase();
  const relation = member.relation || (isSelf ? 'Self' : 'Family');
  const place = member.humanLocation || 'At Home';
  const time = member.lastUpdated || 'Just now';
  const subtitle = `${relation} • ${place} • ${time}`;

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
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
      accessibilityRole="button"
      accessibilityLabel={`View details for ${member.name}`}
      style={({ pressed }) => [
        styles.rowCard,
        {
          backgroundColor: isDark
            ? isSelected
              ? 'rgba(30, 39, 95, 0.85)'
              : 'rgba(20, 27, 74, 0.72)'
            : isSelected
            ? 'rgba(240, 237, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.80)',
          borderColor: isSelected
            ? accentColor
            : isDark
            ? 'rgba(130, 140, 255, 0.22)'
            : 'rgba(124, 92, 224, 0.16)',
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {/* 48px Avatar with member color & green online dot */}
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F0FC',
              borderColor: accentColor,
            },
          ]}>
          {member.photoUrl ? (
            <Image
              source={{ uri: member.photoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={[styles.initialText, { color: accentColor }]}>
              {initials}
            </Text>
          )}
        </View>
        <View style={[styles.onlineDot, { backgroundColor: colors.green }]} />
      </View>

      {/* Name, Badge, Relation, Place & Time */}
      <View style={styles.infoCol}>
        {/* Name Row */}
        <View style={styles.nameRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.nameText,
              {
                color: colors.text,
                fontSize: isElderly ? 17 : 15.5,
              },
            ]}>
            {member.name}
          </Text>
          {isSelf && (
            <View
              style={[
                styles.youBadge,
                {
                  backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : 'rgba(124, 92, 224, 0.30)',
                },
              ]}>
              <Text style={[styles.youBadgeText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>
                You
              </Text>
            </View>
          )}
        </View>

        {/* Subtitle Row: Pin icon + Relation • Place • Time */}
        <View style={styles.subtitleRow}>
          <Ionicons
            name="location-sharp"
            size={12}
            color={isDark ? colors.textMuted : colors.textSecondary}
            style={styles.pinIcon}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.subtitleText,
              {
                color: isDark ? colors.textMuted : colors.textSecondary,
                fontSize: isElderly ? 13 : 12,
              },
            ]}>
            {subtitle}
          </Text>
        </View>
      </View>

      {/* Right Chevron */}
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? colors.textMuted : '#8A8EB2'}
        style={styles.chevron}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowCard: {
    height: CircleTokens.memberRowHeight,
    borderRadius: CircleTokens.memberRowRadius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    width: CircleTokens.memberAvatarSize,
    height: CircleTokens.memberAvatarSize,
    flexShrink: 0,
  },
  avatarCircle: {
    width: CircleTokens.memberAvatarSize,
    height: CircleTokens.memberAvatarSize,
    borderRadius: CircleTokens.memberAvatarSize / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: CircleTokens.memberAvatarSize,
    height: CircleTokens.memberAvatarSize,
    borderRadius: CircleTokens.memberAvatarSize / 2,
  },
  initialText: {
    fontSize: 18,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 1,
    includeFontPadding: false,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  youBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  pinIcon: {
    flexShrink: 0,
  },
  subtitleText: {
    fontWeight: '500',
    flexShrink: 1,
    includeFontPadding: false,
  },
  chevron: {
    flexShrink: 0,
  },
});
