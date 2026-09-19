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
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { GlassCard } from '@/components/ui/GlassCard';

interface CircleMemberCardProps {
  member: FamilyMember;
  onPress?: () => void;
  onCall?: (phone: string, name: string) => void;
  onAsk?: (member: FamilyMember) => void;
}

export const CircleMemberCard: React.FC<CircleMemberCardProps> = ({
  member,
  onPress,
  onCall,
  onAsk,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const isSelf = member.isSelf || member.relation === 'Self';
  const locationLabel = member.humanLocation || 'At Home';

  // Battery status configuration
  const batteryLevel = member.batteryLevel ?? 87;
  const batteryColor =
    batteryLevel > 50 || member.isCharging
      ? colors.green
      : batteryLevel > 20
      ? colors.yellow
      : colors.red;
  const batteryBg =
    batteryLevel > 50 || member.isCharging
      ? colors.greenSoft
      : batteryLevel > 20
      ? colors.yellowSoft
      : colors.redSoft;
  const batteryBorder =
    batteryLevel > 50 || member.isCharging
      ? colors.greenBorder
      : batteryLevel > 20
      ? colors.yellowBorder
      : colors.redBorder;

  // Sound / Ringer status configuration
  const ringerMode = member.ringerMode || 'sound';
  const ringerColor =
    ringerMode === 'silent'
      ? colors.red
      : ringerMode === 'vibrate'
      ? colors.yellow
      : colors.blue;
  const ringerBg =
    ringerMode === 'silent'
      ? colors.redSoft
      : ringerMode === 'vibrate'
      ? colors.yellowSoft
      : colors.blueSoft;
  const ringerBorder =
    ringerMode === 'silent'
      ? colors.redBorder
      : ringerMode === 'vibrate'
      ? colors.yellowBorder
      : colors.blueBorder;
  const ringerLabel =
    ringerMode === 'silent'
      ? 'Silent'
      : ringerMode === 'vibrate'
      ? 'Vibrate'
      : 'Sound On';

  // Device model
  const deviceLabel = member.deviceModel || 'Smartphone';

  // Last updated timestamp string
  const timestampText = member.lastUpdated?.includes(':')
    ? member.lastUpdated
    : `Updated 2026-09-18 20:07:22`;

  return (
    <GlassCard
      borderRadius={26}
      glowColor={isDark ? colors.blue : undefined}
      onPress={onPress}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      {/* 1. Header: Avatar with green online dot, Name + YOU badge, Relation, and Top-Right "At Home" Chip */}
      <View style={styles.topHeaderRow}>
        <View style={styles.avatarWithMeta}>
          {/* Avatar with Online Dot */}
          <View style={styles.avatarContainer}>
            <FamilyAvatar member={member} size={isElderly ? 'lg' : 'md'} showStatus={false} />
            <View style={[styles.onlineDot, { backgroundColor: colors.green }]} />
          </View>

          {/* Name, YOU badge, Relation */}
          <View style={styles.identityCol}>
            <View style={styles.nameBadgeRow}>
              <Text
                style={[
                  styles.nameText,
                  { color: colors.text, fontSize: isElderly ? 20 : 16.5 },
                ]}>
                {member.name}
              </Text>
              {isSelf && (
                <View
                  style={[
                    styles.youBadge,
                    {
                      backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                      borderColor: isDark ? 'rgba(139, 124, 246, 0.35)' : 'rgba(124, 92, 224, 0.25)',
                    },
                  ]}>
                  <Text style={[styles.youBadgeText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>YOU</Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.relationText,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              {member.relation || 'Self'}
            </Text>
          </View>
        </View>

        {/* Top-Right Green "At Home" Chip with House Icon */}
        <View
          style={[
            styles.atHomeChip,
            {
              backgroundColor: isDark ? 'rgba(34, 197, 139, 0.18)' : 'rgba(46, 191, 142, 0.12)',
              borderColor: isDark ? 'rgba(34, 197, 139, 0.40)' : 'rgba(46, 191, 142, 0.25)',
            },
          ]}>
          <Ionicons name="home" size={12} color={colors.green} />
          <Text style={[styles.atHomeChipText, { color: colors.green }]}>
            {locationLabel}
          </Text>
        </View>
      </View>

      {/* 2. Info Chips: "Sound On" (blue), Battery "87%" (green), Device "Smartphone" (purple/neutral) */}
      <View style={styles.infoChipsRow}>
        {/* Sound On / Ringer Pill */}
        <View
          style={[
            styles.telemetryChip,
            {
              backgroundColor: ringerBg,
              borderColor: ringerBorder,
            },
          ]}>
          <Ionicons
            name={
              ringerMode === 'silent'
                ? 'volume-mute'
                : ringerMode === 'vibrate'
                ? 'radio'
                : 'volume-high'
            }
            size={12}
            color={ringerColor}
          />
          <Text style={[styles.telemetryChipText, { color: ringerColor }]}>
            {ringerLabel}
          </Text>
        </View>

        {/* Battery Percentage Pill */}
        <View
          style={[
            styles.telemetryChip,
            {
              backgroundColor: batteryBg,
              borderColor: batteryBorder,
            },
          ]}>
          <Ionicons
            name={member.isCharging ? 'flash' : 'battery-charging'}
            size={12}
            color={batteryColor}
          />
          <Text style={[styles.telemetryChipText, { color: batteryColor }]}>
            {member.isCharging ? `⚡ ${batteryLevel}%` : `${batteryLevel}%`}
          </Text>
        </View>

        {/* Device Model Pill */}
        <View
          style={[
            styles.telemetryChip,
            {
              backgroundColor: isDark ? 'rgba(124, 92, 224, 0.18)' : 'rgba(124, 92, 224, 0.10)',
              borderColor: isDark ? 'rgba(124, 92, 224, 0.35)' : 'rgba(124, 92, 224, 0.20)',
            },
          ]}>
          <Ionicons name="phone-portrait-outline" size={11.5} color={colors.purple} />
          <Text style={[styles.telemetryChipText, { color: colors.purple }]}>
            {deviceLabel}
          </Text>
        </View>
      </View>

      {/* 3. Footer: "Updated 2026-09-18 20:07:22", green dot + "Live GPS"; right-aligned "Call" and "Ask" */}
      <View
        style={[
          styles.footerRow,
          {
            borderTopColor: isDark ? 'rgba(150, 150, 150, 0.12)' : 'rgba(124, 92, 224, 0.12)',
          },
        ]}>
        {/* Left: Timestamp + Live GPS */}
        <View style={styles.footerLeft}>
          <Text
            style={[
              styles.updatedTimeText,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            {timestampText}
          </Text>
          <View style={styles.liveGpsTag}>
            <View style={[styles.liveGpsDot, { backgroundColor: colors.green }]} />
            <Text style={[styles.liveGpsText, { color: colors.green }]}>
              Live GPS
            </Text>
          </View>
        </View>

        {/* Right: Call & Ask Buttons */}
        <View style={styles.actionButtonsCluster}>
          {/* "Call" (Teal / Green filled pill with phone icon) */}
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              if (onCall) {
                onCall(member.phone || '+1 555-0100', member.name);
              }
            }}
            style={({ pressed }) => [
              styles.callButton,
              {
                backgroundColor: isDark ? colors.green : '#2EBF8E',
                shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#2EBF8E',
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons name="call" size={12} color="#FFFFFF" />
            <Text style={styles.callButtonText}>Call</Text>
          </Pressable>

          {/* "Ask" (Outlined blue/violet pill with chat icon) */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              if (onAsk) {
                onAsk(member);
              }
            }}
            style={({ pressed }) => [
              styles.askButton,
              {
                borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : colors.blue,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(79, 142, 247, 0.08)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={isDark ? '#8B7CF6' : colors.blue} />
            <Text style={[styles.askButtonText, { color: isDark ? '#8B7CF6' : colors.blue }]}>Ask</Text>
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    padding: 0,
    marginHorizontal: 18,
    marginVertical: 4,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWithMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  identityCol: {
    gap: 2,
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  youBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  relationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  atHomeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  atHomeChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Info chips
  infoChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  telemetryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  telemetryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
    gap: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  updatedTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  liveGpsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveGpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveGpsText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Action Buttons
  actionButtonsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  askButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
