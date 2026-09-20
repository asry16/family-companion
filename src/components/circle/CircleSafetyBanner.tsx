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

  const bannerColor = isEmergency ? '#EF4444' : isAlertState ? '#F59E0B' : '#34D399';
  const shieldGradient: [string, string] = isEmergency ? ['#EF4444', '#DC2626'] : isAlertState ? ['#F59E0B', '#D97706'] : ['#34D399', '#059669'];
  const haloBg = isEmergency ? 'rgba(239, 68, 68, 0.15)' : isAlertState ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.15)';
  const glowColor = isEmergency ? 'rgba(239, 68, 68, 0.15)' : isAlertState ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.1)';

  return (
    <Pressable
      onPress={() => { triggerHaptic(); if (onPress) onPress(); }}
      style={({ pressed }) => [
        styles.cardWrapper,
        {
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          backgroundColor: 'rgba(20, 27, 74, 0.6)',
          borderColor: isEmergency ? 'rgba(239, 68, 68, 0.4)' : isAlertState ? 'rgba(245, 158, 11, 0.4)' : 'rgba(52, 211, 153, 0.3)',
          shadowColor: bannerColor,
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
                  { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
                ],
                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              },
            ]}
          />
          <View style={[styles.shieldOuterRing, { borderColor: bannerColor }]}>
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
          <Text numberOfLines={1} style={[styles.subtitleText, { color: '#94A3B8' }]}>
            {bannerSubtitle}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color="#C9CEFF" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shieldWrap: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  shieldHalo: {
    position: 'absolute',
    width: 44, height: 44,
    borderRadius: 22,
  },
  shieldOuterRing: {
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shieldInner: {
    width: 26, height: 26,
    borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  textColumn: { flex: 1, gap: 4 },
  titleText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  subtitleText: { fontSize: 12, fontWeight: '500' },
});
