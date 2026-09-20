import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyMember } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Radius } from '@/constants/theme';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onPress?: () => void;
  onCall?: () => void;
  onPing?: () => void;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onPress,
  onCall,
  onPing,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const handleCardPress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
      onPress();
    }
  };

  const getLocationVariant = () => {
    switch (member.availability) {
      case 'available':
        return 'green';
      case 'in_transit':
        return 'yellow';
      case 'busy':
        return 'blue';
      default:
        return 'neutral';
    }
  };

  return (
    <GlassCard
      borderRadius={24}
      onPress={handleCardPress}
      glowColor={member.availability === 'available' ? (isDark ? 'rgba(52, 211, 153, 0.20)' : undefined) : undefined}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      <View style={styles.headerRow}>
        <FamilyAvatar member={member} size={isElderly ? 'lg' : 'md'} />

        <View style={styles.identitySection}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.nameText,
                {
                  color: colors.text,
                  fontSize: isElderly ? 22 : 17,
                },
              ]}>
              {member.name}
            </Text>
            {member.isSelf && (
              <View
                style={[
                  styles.selfBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(139, 124, 246, 0.20)'
                      : 'rgba(124, 92, 224, 0.10)',
                    borderColor: isDark
                      ? 'rgba(139, 124, 246, 0.40)'
                      : 'rgba(124, 92, 224, 0.20)',
                  },
                ]}>
                <Text
                  style={[
                    styles.selfText,
                    { color: isDark ? '#C9CEFF' : '#7C5CE0' },
                  ]}>
                  You
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.relationText,
              {
                color: isDark ? colors.textMuted : colors.textSecondary,
                fontSize: isElderly ? 16 : 13,
              },
            ]}>
            {member.relation}
          </Text>
        </View>

        <StatusBadge
          label={member.humanLocation}
          variant={getLocationVariant()}
          size={isElderly ? 'lg' : 'md'}
        />
      </View>

      {member.nextTaskOrEvent && (
        <View
          style={[
            styles.nextTaskSection,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(124, 92, 224, 0.06)',
              borderColor: isDark
                ? 'rgba(130, 140, 255, 0.18)'
                : 'rgba(124, 92, 224, 0.12)',
            },
          ]}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={isDark ? '#8B7CF6' : colors.blue}
          />
          <Text
            style={[
              styles.nextTaskLabel,
              {
                color: isDark ? colors.textTertiary : colors.textSecondary,
                fontSize: isElderly ? 16 : 13,
              },
            ]}>
            Next:
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.nextTaskValue,
              {
                color: colors.text,
                fontSize: isElderly ? 16 : 13,
              },
            ]}>
            {member.nextTaskOrEvent}
          </Text>
        </View>
      )}

      {/* Phone Telemetry & Status Strip */}
      <View style={styles.phoneStatusStrip}>
        {/* Sound / Silent Ringer Status */}
        <View
          style={[
            styles.phonePill,
            {
              backgroundColor:
                member.ringerMode === 'silent'
                  ? colors.redSoft
                  : member.ringerMode === 'vibrate'
                  ? colors.yellowSoft
                  : isDark ? 'rgba(79, 142, 247, 0.12)' : colors.blueSoft,
              borderColor:
                member.ringerMode === 'silent'
                  ? colors.redBorder
                  : member.ringerMode === 'vibrate'
                  ? colors.yellowBorder
                  : isDark ? 'rgba(79, 142, 247, 0.28)' : colors.blueBorder,
            },
          ]}>
          <Ionicons
            name={
              member.ringerMode === 'silent'
                ? 'volume-mute'
                : member.ringerMode === 'vibrate'
                ? 'radio'
                : 'volume-high'
            }
            size={12}
            color={
              member.ringerMode === 'silent'
                ? colors.red
                : member.ringerMode === 'vibrate'
                ? colors.yellow
                : isDark ? '#8B7CF6' : colors.blue
            }
          />
          <Text
            style={[
              styles.phonePillText,
              {
                color:
                  member.ringerMode === 'silent'
                    ? colors.red
                    : member.ringerMode === 'vibrate'
                    ? colors.yellow
                    : isDark ? '#8B7CF6' : colors.blue,
              },
            ]}>
            {member.ringerMode === 'silent'
              ? 'Silent'
              : member.ringerMode === 'vibrate'
              ? 'Vibrate'
              : 'Sound On'}
          </Text>
        </View>

        {/* Battery Percentage & Charging Status */}
        <View
          style={[
            styles.phonePill,
            {
              backgroundColor:
                member.batteryLevel > 50 || member.isCharging
                  ? colors.greenSoft
                  : member.batteryLevel > 20
                  ? colors.yellowSoft
                  : colors.redSoft,
              borderColor:
                member.batteryLevel > 50 || member.isCharging
                  ? colors.greenBorder
                  : member.batteryLevel > 20
                  ? colors.yellowBorder
                  : colors.redBorder,
            },
          ]}>
          <Ionicons
            name={
              member.isCharging
                ? 'flash'
                : member.batteryLevel > 50
                ? 'battery-charging'
                : member.batteryLevel > 20
                ? 'battery-half'
                : 'battery-dead'
            }
            size={12}
            color={
              member.batteryLevel > 50 || member.isCharging
                ? colors.green
                : member.batteryLevel > 20
                ? colors.yellow
                : colors.red
            }
          />
          <Text
            style={[
              styles.phonePillText,
              {
                color:
                  member.batteryLevel > 50 || member.isCharging
                    ? colors.green
                    : member.batteryLevel > 20
                    ? colors.yellow
                    : colors.red,
              },
            ]}>
            {member.isCharging ? `⚡ ${member.batteryLevel}%` : `${member.batteryLevel}%`}
          </Text>
        </View>

        {/* Device Model */}
        {member.deviceModel && (
          <View
            style={[
              styles.phonePill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(124, 92, 224, 0.06)',
                borderColor: isDark
                  ? 'rgba(130, 140, 255, 0.18)'
                  : 'rgba(124, 92, 224, 0.14)',
              },
            ]}>
            <Ionicons
              name="phone-portrait-outline"
              size={11}
              color={isDark ? colors.textTertiary : colors.textSecondary}
            />
            <Text
              style={[
                styles.phonePillText,
                { color: isDark ? colors.textTertiary : colors.textSecondary },
              ]}>
              {member.deviceModel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.telemetrySection}>
          <Text
            style={[
              styles.telemetryText,
              { color: isDark ? colors.textTertiary : colors.textSecondary, fontSize: isElderly ? 14 : 12 },
            ]}>
            Updated {member.lastUpdated}
          </Text>
          {member.isSharingLocation && (
            <Text
              style={[
                styles.sharingDurationPill,
                { color: isDark ? '#8B7CF6' : colors.blue, fontSize: isElderly ? 13 : 11 },
              ]}>
              • {member.sharingDuration === 'always' ? 'Live GPS' : `Until ${member.sharingDuration}`}
            </Text>
          )}
        </View>

        <View style={styles.quickActions}>
          {onCall && (
            <Pressable
              onPress={onCall}
              hitSlop={10}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: isDark ? 'rgba(52, 211, 153, 0.16)' : colors.greenSoft,
                  borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : colors.greenBorder,
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}>
              <Ionicons name="call" size={13} color={colors.green} />
              <Text style={[styles.actionPillText, { color: colors.green }]}>
                Call
              </Text>
            </Pressable>
          )}

          {onPing && (
            <Pressable
              onPress={onPing}
              hitSlop={10}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: isDark ? 'rgba(139, 124, 246, 0.16)' : colors.blueSoft,
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.35)' : colors.blueBorder,
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}>
              <Ionicons name="chatbubble-ellipses" size={13} color={isDark ? '#8B7CF6' : colors.blue} />
              <Text style={[styles.actionPillText, { color: isDark ? '#8B7CF6' : colors.blue }]}>
                Ask
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 6,
  },
  cardContent: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identitySection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  selfBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  selfText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  relationText: {
    marginTop: 2,
    fontWeight: '500',
  },
  nextTaskSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  nextTaskLabel: {
    fontWeight: '700',
  },
  nextTaskValue: {
    flex: 1,
    fontWeight: '600',
  },
  phoneStatusStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  phonePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  telemetrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  telemetryText: {
    fontWeight: '500',
  },
  sharingDurationPill: {
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 5,
  },
  actionPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
