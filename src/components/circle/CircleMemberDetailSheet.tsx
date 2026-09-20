import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyMember } from '@/types';

interface CircleMemberDetailSheetProps {
  visible: boolean;
  member: FamilyMember | null;
  isSelf?: boolean;
  onClose: () => void;
  onAskStatus?: (member: FamilyMember) => void;
}

export const CircleMemberDetailSheet: React.FC<CircleMemberDetailSheetProps> = ({
  visible,
  member,
  isSelf = false,
  onClose,
  onAskStatus,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, isElderly } = useAppTheme();

  if (!member) return null;

  const initials = member.name.charAt(0).toUpperCase();
  const batteryLevel = member.batteryLevel ?? 85;
  const isCharging = Boolean(member.isCharging);
  const ringerMode = member.ringerMode || 'normal';
  const deviceModel = member.deviceModel || 'Smartphone';
  const lastUpdated = member.lastUpdated || 'Just now';
  const place = member.humanLocation || 'At Home';
  const relation = member.relation || (isSelf ? 'Self' : 'Family');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleCall = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (member.phone) {
      Linking.openURL(`tel:${member.phone}`).catch(() => {
        Alert.alert('Unable to Call', `Could not dial ${member.phone}`);
      });
    } else {
      Alert.alert('Phone Call', `Calling ${member.name}...`, [{ text: 'OK' }]);
    }
  };

  const handleAsk = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (onAskStatus) {
      onAskStatus(member);
    } else {
      Alert.alert(
        'Status Ping Sent',
        `Sent a gentle check-in ping to ${member.name}.`,
        [{ text: 'Great' }]
      );
    }
  };

  const ringerLabel = ringerMode === 'silent' ? 'Silent' : ringerMode === 'vibrate' ? 'Vibrate' : 'Sound On';
  const ringerIcon = ringerMode === 'silent' ? 'volume-mute' : ringerMode === 'vibrate' ? 'radio' : 'volume-high';
  const ringerColor = ringerMode === 'silent' ? '#EF4444' : ringerMode === 'vibrate' ? '#F59E0B' : colors.blue;

  const batteryColor = batteryLevel <= 20 ? '#EF4444' : batteryLevel <= 50 ? '#F59E0B' : '#10B981';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Backdrop Tap */}
        <Pressable
          style={styles.backdropPressable}
          onPress={() => {
            triggerHaptic();
            onClose();
          }}
        />

        {/* Sheet Content */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#101540' : '#FFFFFF',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.28)' : 'rgba(124, 92, 224, 0.20)',
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}>
          
          {/* Top Handle Bar */}
          <View style={styles.handleBarWrap}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' },
              ]}
            />
          </View>

          {/* Member Header */}
          <View style={styles.memberHeader}>
            <View style={styles.avatarWrap}>
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F0FC',
                    borderColor: '#4F8EF7',
                  },
                ]}>
                {member.photoUrl ? (
                  <Image
                    source={{ uri: member.photoUrl }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={[styles.initialText, { color: '#4F8EF7' }]}>
                    {initials}
                  </Text>
                )}
              </View>
              <View style={[styles.onlineDot, { backgroundColor: colors.green }]} />
            </View>

            <View style={styles.headerInfoCol}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.memberName,
                    { color: colors.text, fontSize: isElderly ? 22 : 19 },
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

              <Text
                style={[
                  styles.relationText,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                {relation} • {place}
              </Text>
            </View>

            {/* Close Circle Button */}
            <Pressable
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              hitSlop={8}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.05)',
                  borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                },
              ]}>
              <Ionicons
                name="close"
                size={18}
                color={isDark ? '#C9CEFF' : '#5B628F'}
              />
            </Pressable>
          </View>

          {/* Telemetry Grid */}
          <View style={styles.telemetryGrid}>
            {/* 1. Sound Status */}
            <View
              style={[
                styles.telemetryCard,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.70)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                },
              ]}>
              <Ionicons name={ringerIcon} size={18} color={ringerColor} />
              <View style={styles.telemetryCol}>
                <Text style={[styles.telemetryLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                  Sound
                </Text>
                <Text style={[styles.telemetryVal, { color: colors.text }]}>
                  {ringerLabel}
                </Text>
              </View>
            </View>

            {/* 2. Battery */}
            <View
              style={[
                styles.telemetryCard,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.70)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                },
              ]}>
              <Ionicons
                name={isCharging ? 'flash' : 'battery-charging'}
                size={18}
                color={batteryColor}
              />
              <View style={styles.telemetryCol}>
                <Text style={[styles.telemetryLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                  Battery
                </Text>
                <Text style={[styles.telemetryVal, { color: colors.text }]}>
                  {isCharging ? `⚡ ${batteryLevel}%` : `${batteryLevel}%`}
                </Text>
              </View>
            </View>

            {/* 3. Device */}
            <View
              style={[
                styles.telemetryCard,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.70)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                },
              ]}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.purple} />
              <View style={styles.telemetryCol}>
                <Text style={[styles.telemetryLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                  Device
                </Text>
                <Text numberOfLines={1} style={[styles.telemetryVal, { color: colors.text }]}>
                  {deviceModel}
                </Text>
              </View>
            </View>

            {/* 4. Live GPS & Sync */}
            <View
              style={[
                styles.telemetryCard,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.70)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                },
              ]}>
              <Ionicons name="navigate-circle-outline" size={18} color={colors.green} />
              <View style={styles.telemetryCol}>
                <Text style={[styles.telemetryLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                  Live GPS
                </Text>
                <Text numberOfLines={1} style={[styles.telemetryVal, { color: colors.text }]}>
                  {lastUpdated}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons: "Call" and "Ask" */}
          <View style={styles.actionsRow}>
            {/* Call Button (Primary Gradient) */}
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [
                styles.actionBtnWrap,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <LinearGradient
                colors={['#4F8EF7', '#8B6CF0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradBtn}>
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.primaryGradBtnText}>Call</Text>
              </LinearGradient>
            </Pressable>

            {/* Ask / Ping Button (Outlined Violet) */}
            <Pressable
              onPress={handleAsk}
              style={({ pressed }) => [
                styles.outlinedBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(124, 92, 224, 0.05)',
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : 'rgba(124, 92, 224, 0.40)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color={isDark ? '#8B7CF6' : '#7C5CE0'}
              />
              <Text
                style={[
                  styles.outlinedBtnText,
                  { color: isDark ? '#8B7CF6' : '#7C5CE0' },
                ]}>
                Ask Status
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  initialText: {
    fontSize: 20,
    fontWeight: '700',
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
  headerInfoCol: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  youBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  relationText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  telemetryCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  telemetryCol: {
    flex: 1,
    gap: 1,
  },
  telemetryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  telemetryVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtnWrap: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryGradBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
  },
  primaryGradBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  outlinedBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  outlinedBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
