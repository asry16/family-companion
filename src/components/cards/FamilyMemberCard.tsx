import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyMember } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
  const { colors, isElderly } = useAppTheme();

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
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
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
                  { backgroundColor: colors.separator },
                ]}>
                <Text style={[styles.selfText, { color: colors.textSecondary }]}>
                  You
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.relationText,
              {
                color: colors.textSecondary,
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
              backgroundColor: colors.separator,
              borderColor: colors.borderSubtle,
            },
          ]}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            style={[
              styles.nextTaskLabel,
              {
                color: colors.textSecondary,
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
                  : colors.blueSoft,
              borderColor:
                member.ringerMode === 'silent'
                  ? colors.redBorder
                  : member.ringerMode === 'vibrate'
                  ? colors.yellowBorder
                  : colors.blueBorder,
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
                : colors.blue
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
                    : colors.blue,
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
              { backgroundColor: colors.separator, borderColor: colors.border },
            ]}>
            <Ionicons name="phone-portrait-outline" size={11} color={colors.textSecondary} />
            <Text style={[styles.phonePillText, { color: colors.textSecondary }]}>
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
              { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
            ]}>
            Updated {member.lastUpdated}
          </Text>
          {member.isSharingLocation && (
            <Text
              style={[
                styles.sharingDurationPill,
                { color: colors.blue, fontSize: isElderly ? 13 : 11 },
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
                  backgroundColor: colors.greenSoft,
                  borderColor: colors.greenBorder,
                  opacity: pressed ? 0.7 : 1,
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
                  backgroundColor: colors.blueSoft,
                  borderColor: colors.blueBorder,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Ionicons name="chatbubble-ellipses" size={13} color={colors.blue} />
              <Text style={[styles.actionPillText, { color: colors.blue }]}>
                Ask
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
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
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  selfText: {
    fontSize: 10,
    fontWeight: '700',
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  nextTaskLabel: {
    fontWeight: '600',
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
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
