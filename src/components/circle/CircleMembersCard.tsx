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
import { FamilyMember } from '@/types';
import { CircleMemberRow } from './CircleMemberRow';
import { CircleTokens } from '@/constants/theme';

interface CircleMembersCardProps {
  members: FamilyMember[];
  currentUserId?: string;
  selectedMemberId?: string | null;
  onSelectMember: (member: FamilyMember) => void;
  onAddMember: () => void;
  isLoading?: boolean;
  isOffline?: boolean;
  onRetryConnection?: () => void;
}

const MEMBER_ACCENT_COLORS = ['#4F8EF7', '#8B6CF0', '#2DD4BF', '#F59E0B'];

export const CircleMembersCard: React.FC<CircleMembersCardProps> = ({
  members,
  currentUserId,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  isLoading = false,
  isOffline = false,
  onRetryConnection,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleAddPress = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onAddMember();
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="people"
            size={18}
            color="#C9CEFF"
          />
          <Text
            style={[
              styles.sectionTitle,
              {
                color: '#FFFFFF',
                fontSize: isElderly ? 18 : 16,
              },
            ]}>
            Family Members
          </Text>
          <Text
            style={[
              styles.countMuted,
              { color: '#94A3B8' },
            ]}>
            ({members.length})
          </Text>
        </View>

        {/* Outlined Violet "+ Add Member" Pill */}
        <Pressable
          onPress={handleAddPress}
          hitSlop={6}
          accessibilityLabel="Add Family Member"
          style={({ pressed }) => [
            styles.addMemberPill,
            {
              backgroundColor: 'rgba(20, 27, 74, 0.4)',
              borderColor: 'rgba(130, 140, 255, 0.3)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons
            name="add"
            size={15}
            color="#C9CEFF"
          />
          <Text
            style={[
              styles.addMemberText,
              { color: '#C9CEFF' },
            ]}>
            Add Member
          </Text>
        </Pressable>
      </View>

      {/* Offline or Location Permission Denied Alert Banner */}
      {isOffline && (
        <View
          style={[
            styles.offlineBanner,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FCD34D',
            },
          ]}>
          <Ionicons name="cloud-offline" size={18} color="#D97706" />
          <View style={styles.offlineTextCol}>
            <Text style={[styles.offlineTitle, { color: isDark ? '#FBBF24' : '#B45309' }]}>
              Live Sync Paused
            </Text>
            <Text style={[styles.offlineSubtitle, { color: isDark ? colors.textMuted : '#92400E' }]}>
              Location permissions or offline mode active.
            </Text>
          </View>
          {onRetryConnection && (
            <Pressable
              onPress={() => {
                triggerHaptic();
                onRetryConnection();
              }}
              style={[
                styles.retryBtn,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#F59E0B',
                },
              ]}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <View style={styles.listStack}>
          {[1, 2, 3].map((key) => (
            <View
              key={key}
              style={[
                styles.skeletonRow,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.50)' : 'rgba(20, 32, 58, 0.05)',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.12)' : 'rgba(124, 92, 224, 0.08)',
                },
              ]}
            />
          ))}
        </View>
      ) : (
        /* Member Row Cards */
        <View style={styles.listStack}>
          {members.map((member, index) => {
            const isSelf = member.isSelf || member.id === currentUserId;
            const accentColor = MEMBER_ACCENT_COLORS[index % MEMBER_ACCENT_COLORS.length];
            const isSelected = selectedMemberId === member.id;

            return (
              <CircleMemberRow
                key={member.id}
                member={member}
                isSelf={isSelf}
                accentColor={accentColor}
                isSelected={isSelected}
                onPress={() => onSelectMember(member)}
              />
            );
          })}

          {/* Single Member Prompt if only 1 member exists */}
          {members.length === 1 && (
            <Pressable
              onPress={handleAddPress}
              style={({ pressed }) => [
                styles.singleMemberPrompt,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                  borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.30)',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View
                style={[
                  styles.promptIconWrap,
                  { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.20)' : 'rgba(99, 102, 241, 0.12)' },
                ]}>
                <Ionicons
                  name="share-social-outline"
                  size={19}
                  color={isDark ? '#818CF8' : '#4F46E5'}
                />
              </View>
              <View style={styles.singlePromptCol}>
                <Text
                  style={[
                    styles.singlePromptTitle,
                    { color: colors.text },
                  ]}>
                  Invite Household Members
                </Text>
                <Text
                  style={[
                    styles.singlePromptSub,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}>
                  Share your family code so partners, kids, or grandparents can join.
                </Text>
              </View>
              <View style={styles.promptActionBadge}>
                <Text style={styles.promptActionText}>Share</Text>
                <Ionicons
                  name="arrow-forward"
                  size={13}
                  color="#818CF8"
                />
              </View>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 6,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  countMuted: {
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false,
  },
  addMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  addMemberText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    includeFontPadding: false,
  },
  listStack: {
    gap: CircleTokens.memberRowGap,
  },
  skeletonRow: {
    height: CircleTokens.memberRowHeight,
    borderRadius: CircleTokens.memberRowRadius,
    borderWidth: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  offlineTextCol: {
    flex: 1,
    gap: 2,
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  offlineSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  singleMemberPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: CircleTokens.memberRowRadius,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  singlePromptCol: {
    flex: 1,
    gap: 2,
  },
  singlePromptTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  singlePromptSub: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  promptIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  promptActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818CF8',
  },
});
