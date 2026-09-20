import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';

interface CircleSafetyBannerProps {
  onPress?: () => void;
}

export const CircleSafetyBanner: React.FC<CircleSafetyBannerProps> = ({ onPress }) => {
  const { colors, isDark } = useAppTheme();
  const { members, sosAlert } = useFamily();

  // Subtle continuous pulse for shield halo
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(style); } catch (e) {} }
  };

  // Safety state logic
  const isEmergency = Boolean(sosAlert?.active);
  const memberNeedingAttention = members.find(
    (m) => (m.batteryLevel && m.batteryLevel < 15 && !m.isCharging) || m.availability === 'busy'
  );
  const isAlertState = isEmergency || Boolean(memberNeedingAttention);
  const activeCount = members.length > 0 ? members.length : 1;

  const bannerTitle = isEmergency
    ? 'EMERGENCY SOS ALERT ACTIVE'
    : isAlertState
    ? `${memberNeedingAttention?.name?.toUpperCase() || 'MEMBER'} MAY NEED ASSISTANCE`
    : 'ALL FAMILY MEMBERS SAFE';

  const bannerSubtitle = isEmergency
    ? (sosAlert?.message || 'Emergency assistance requested by family')
    : isAlertState
    ? (memberNeedingAttention?.batteryLevel && memberNeedingAttention.batteryLevel < 15
        ? `${memberNeedingAttention.name}'s battery critically low (${memberNeedingAttention.batteryLevel}%)`
        : `${memberNeedingAttention?.name || 'Member'} is currently busy • Locations synced`)
    : `${activeCount} active family ${activeCount === 1 ? 'member' : 'members'} • Location encrypted`;

  const bannerColor = isEmergency ? '#EF4444' : isAlertState ? '#F59E0B' : isDark ? '#34D399' : '#10B981';
  const shieldGradient: [string, string] = isEmergency
    ? ['#EF4444', '#DC2626']
    : isAlertState
    ? ['#F59E0B', '#D97706']
    : isDark
    ? ['#34D399', '#059669']
    : ['#10B981', '#059669'];
  const haloBg = isEmergency
    ? 'rgba(239, 68, 68, 0.15)'
    : isAlertState
    ? 'rgba(245, 158, 11, 0.15)'
    : isDark
    ? 'rgba(52, 211, 153, 0.15)'
    : 'rgba(16, 185, 129, 0.15)';

  return (
    <Pressable
      onPress={() => { triggerHaptic(); if (onPress) onPress(); }}
      style={({ pressed }) => [
        styles.cardWrapper,
        {
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          backgroundColor: isDark ? 'rgba(20, 27, 74, 0.6)' : '#FFFFFF',
          borderColor: isEmergency
            ? 'rgba(239, 68, 68, 0.4)'
            : isAlertState
            ? 'rgba(245, 158, 11, 0.4)'
            : isDark
            ? 'rgba(52, 211, 153, 0.3)'
            : 'rgba(16, 185, 129, 0.20)',
          shadowColor: isDark ? bannerColor : '#64748B',
          shadowOpacity: isDark ? 0.2 : 0.06,
        },
      ]}>
      <View style={styles.bannerRow}>
        
        {/* Shield Icon with glowing ring */}
        <View style={styles.shieldWrap}>
          <Animated.View
            style={[
              styles.shieldHalo,
              {
                backgroundColor: haloBg,
                transform: [
                  { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
                ],
                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              },
            ]}
          />
          <View
            style={[
              styles.shieldOuterRing,
              {
                borderColor: isDark ? bannerColor : '#A7F3D0',
                backgroundColor: isDark ? 'transparent' : '#DCFCE7',
              },
            ]}>
            <LinearGradient colors={shieldGradient} style={styles.shieldInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons
                name={isEmergency ? 'alert' : isAlertState ? 'warning' : 'shield-checkmark'}
                size={18}
                color="#FFFFFF"
              />
            </LinearGradient>
          </View>
        </View>

        {/* Text */}
        <View style={styles.textColumn}>
          <Text numberOfLines={1} style={[styles.titleText, { color: bannerColor }]}>
            {bannerTitle}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitleText, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
            {bannerSubtitle}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#C9CEFF' : '#9CA3AF'} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shieldWrap: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  shieldHalo: {
    position: 'absolute',
    width: 44, height: 44,
    borderRadius: 22,
  },
  shieldOuterRing: {
    width: 38, height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  shieldInner: {
    width: 28, height: 28,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  textColumn: { flex: 1, gap: 3 },
  titleText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  subtitleText: { fontSize: 12, fontWeight: '500' },
});
