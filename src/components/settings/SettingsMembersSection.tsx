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
import { FamilyMember } from '@/types';

export interface SettingsMembersSectionProps {
  members: FamilyMember[];
  currentUserId?: string;
  onAddMember: () => void;
  onEditMember: (member: FamilyMember) => void;
}

export const SettingsMembersSection: React.FC<SettingsMembersSectionProps> = ({
  members,
  currentUserId,
  onAddMember,
  onEditMember,
}) => {
  const { colors, isDark } = useAppTheme();

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  return (
    <View style={styles.sectionWrapper}>
      {/* Section Header Row: Title on Left, Add Member on Right */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerTitleWrap}>
          <Ionicons
            name="people-outline"
            size={16}
            color={isDark ? '#38BDF8' : '#6D5BD0'}
          />
          <Text
            style={[
              styles.sectionHeaderText,
              { color: isDark ? colors.textMuted : '#6D5BD0' },
            ]}>
            FAMILY MEMBERS ({members.length})
          </Text>
        </View>

        {/* "Add Member" Pill Button */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            onAddMember();
          }}
          accessibilityRole="button"
          accessibilityLabel="Add Family Member"
          style={({ pressed }) => [
            styles.addMemberPill,
            {
              backgroundColor: isDark
                ? 'rgba(59, 111, 240, 0.20)'
                : 'rgba(124, 92, 224, 0.08)',
              borderColor: isDark
                ? 'rgba(59, 111, 240, 0.40)'
                : 'rgba(124, 92, 224, 0.22)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons
            name="person-add-outline"
            size={13}
            color={isDark ? '#38BDF8' : '#7C5CE0'}
          />
          <Text
            style={[
              styles.addMemberText,
              { color: isDark ? '#38BDF8' : '#7C5CE0' },
            ]}>
            Add Member
          </Text>
        </Pressable>
      </View>

      {/* Member Cards */}
      <View style={styles.cardsList}>
        {members.map((member) => {
          const isCurrentUser = member.isSelf || member.id === currentUserId;
          const initial = (member.initials || member.name.charAt(0) || 'M').toUpperCase();
          const placeText = member.humanLocation || 'At Home';
          const relation = member.relation || (isCurrentUser ? 'Self' : 'Member');
          const phone = member.phone || '+1 555-0100';

          return (
            <GlassCard
              key={member.id}
              borderRadius={20}
              glowColor={isDark ? colors.blue : undefined}
              style={styles.memberCard}
              contentStyle={styles.memberCardContent}>
              {/* Left: Avatar with green online beacon dot */}
              <View style={styles.avatarContainer}>
                <View
                  style={[
                    styles.avatarCircle,
                    {
                      backgroundColor: member.avatarColor || (isDark ? '#1E293B' : '#7C5CE0'),
                      borderColor: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(124, 92, 224, 0.20)',
                    },
                  ]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                {/* Green Online Dot */}
                <View style={[styles.onlineDot, { backgroundColor: colors.green }]} />
              </View>

              {/* Middle: Details Column */}
              <View style={styles.detailsColumn}>
                {/* Name & "You" Badge */}
                <View style={styles.nameRow}>
                  <Text
                    numberOfLines={1}
                    style={[styles.memberName, { color: colors.text }]}>
                    {member.name}
                  </Text>
                  {isCurrentUser && (
                    <View
                      style={[
                        styles.youBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(59, 111, 240, 0.25)'
                            : 'rgba(124, 92, 224, 0.12)',
                          borderColor: isDark
                            ? 'rgba(59, 111, 240, 0.45)'
                            : 'rgba(124, 92, 224, 0.25)',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.youBadgeText,
                          { color: isDark ? '#38BDF8' : '#7C5CE0' },
                        ]}>
                        You
                      </Text>
                    </View>
                  )}
                </View>

                {/* Subtitle: Relation • Phone */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.subText,
                    { color: isDark ? colors.textMuted : colors.textSecondary },
                  ]}>
                  {relation} • {phone}
                </Text>

                {/* Location Row: Red Pin Icon + Green Location Label */}
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={13} color={colors.red} />
                  <Text style={[styles.locationText, { color: colors.green }]}>
                    {placeText}
                  </Text>
                </View>
              </View>

              {/* Right: Circular Pencil Icon Button (Opens Edit Sheet) */}
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  onEditMember(member);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${member.name}`}
                style={({ pressed }) => [
                  styles.editButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(124, 92, 224, 0.08)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(124, 92, 224, 0.15)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={isDark ? colors.textMuted : '#6D5BD0'}
                />
              </Pressable>
            </GlassCard>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginHorizontal: 18,
    marginVertical: 6,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  addMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  addMemberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardsList: {
    gap: 8,
  },
  memberCard: {
    padding: 0,
  },
  memberCardContent: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailsColumn: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  youBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
