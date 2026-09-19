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
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { StatusChip } from '@/components/ui/StatusChip';
import { ChatRichCardData } from '@/services/chat.service';

export interface ChatRichCardProps {
  cardData: ChatRichCardData;
  onActionPress?: () => void;
}

export const ChatRichCard: React.FC<ChatRichCardProps> = ({
  cardData,
  onActionPress,
}) => {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleAction = () => {
    triggerHaptic();
    if (onActionPress) {
      onActionPress();
    } else {
      router.push('/(tabs)/family');
    }
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark
            ? 'rgba(20, 27, 74, 0.72)'
            : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark
            ? 'rgba(130, 140, 255, 0.22)'
            : 'rgba(20, 32, 58, 0.10)',
        },
      ]}>
      {/* Optional Card Title */}
      {cardData.title && (
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.brandAccent : colors.blue }]}>
            {cardData.title.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Member Rows */}
      <View style={styles.memberList}>
        {cardData.members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            {/* Member Avatar */}
            <View
              style={[
                styles.memberAvatar,
                {
                  backgroundColor: member.avatarColor || (isDark ? 'rgba(255, 255, 255, 0.05)' : '#EFF6FF'),
                  borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(20, 32, 58, 0.15)',
                },
              ]}>
              <Text style={styles.avatarInitial}>{member.initials}</Text>
            </View>

            {/* Member Info */}
            <View style={styles.memberInfo}>
              <Text
                numberOfLines={1}
                style={[styles.memberName, { color: colors.text }]}>
                {member.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.memberLocation,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                {member.locationName}
              </Text>
            </View>

            {/* Battery Badge */}
            <View
              style={[
                styles.batteryBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(20, 32, 58, 0.05)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(20, 32, 58, 0.08)',
                },
              ]}>
              <Ionicons
                name={member.isCharging ? 'battery-charging' : 'battery-half'}
                size={12}
                color={
                  member.batteryLevel < 20
                    ? colors.red
                    : isDark
                    ? '#8B7CF6'
                    : colors.blue
                }
              />
              <Text
                style={[
                  styles.batteryText,
                  {
                    color:
                      member.batteryLevel < 20
                        ? colors.red
                        : isDark
                        ? colors.textMuted
                        : colors.textSecondary,
                  },
                ]}>
                {member.batteryLevel}%
              </Text>
            </View>

            {/* Status Chip */}
            <StatusChip
              variant={member.statusVariant}
              colorScheme={member.statusColorScheme}
              label={member.statusText}
              size="sm"
              showDot
            />
          </View>
        ))}
      </View>

      {/* Action Pill: "View on map →" */}
      {cardData.actionLabel && (
        <Pressable
          onPress={handleAction}
          style={({ pressed }) => [
            styles.actionPill,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(59, 111, 240, 0.12)',
              borderColor: isDark
                ? 'rgba(139, 124, 246, 0.50)'
                : 'rgba(59, 111, 240, 0.25)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Text
            style={[
              styles.actionPillText,
              { color: isDark ? '#8B7CF6' : colors.blue },
            ]}>
            {cardData.actionLabel}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={13}
            color={isDark ? '#8B7CF6' : colors.blue}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    paddingBottom: 2,
  },
  cardTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  memberList: {
    gap: 9,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
    gap: 1,
  },
  memberName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  memberLocation: {
    fontSize: 11,
    fontWeight: '500',
  },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  batteryText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
