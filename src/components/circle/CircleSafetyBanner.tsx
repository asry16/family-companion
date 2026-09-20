import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { CircleTokens } from '@/constants/theme';

interface CircleSafetyBannerProps {
  onPress?: () => void;
}

export const CircleSafetyBanner: React.FC<CircleSafetyBannerProps> = ({ onPress }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, sosAlert } = useFamily();

  // Subtle continuous pulse for shield halo
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
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

  const bannerColor = isEmergency
    ? colors.red
    : isAlertState
    ? colors.yellow
    : isDark
    ? '#4ADE9A'
    : '#059669';

  const shieldGradient: [string, string] = isEmergency
    ? ['#FF4D7A', '#E11D48']
    : isAlertState
    ? ['#F59E0B', '#D97706']
    : ['#34D399', '#10B981'];

  const haloBg = isEmergency
    ? 'rgba(239, 68, 68, 0.28)'
    : isAlertState
    ? 'rgba(245, 158, 11, 0.28)'
    : 'rgba(52, 211, 153, 0.25)';

  return (
    <GlassCard
      borderRadius={24}
      glowColor={isDark ? (isEmergency ? colors.red : isAlertState ? colors.yellow : 'rgba(52, 211, 153, 0.2)') : undefined}
      borderAccentColor={
        isDark
          ? isEmergency
            ? 'rgba(240, 82, 77, 0.45)'
            : isAlertState
            ? 'rgba(245, 158, 11, 0.45)'
            : 'rgba(52, 211, 153, 0.35)'
          : undefined
      }
      onPress={() => {
        triggerHaptic();
        if (onPress) onPress();
      }}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      {/* Light Mode tint gradient */}
      {!isDark && (
        <LinearGradient
          colors={
            isEmergency
              ? ['#FFF1F4', '#FFE6F0']
              : isAlertState
              ? ['#FEF3C7', '#FDE68A']
              : ['rgba(240, 253, 244, 0.95)', 'rgba(236, 253, 245, 0.85)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={styles.bannerRow}>
        {/* 48px Glowing Shield Icon */}
        <View style={styles.shieldWrap}>
          <Animated.View
            style={[
              styles.shieldHalo,
              {
                backgroundColor: haloBg,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.25],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 0.2],
                }),
              },
            ]}
          />
          <LinearGradient
            colors={shieldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shieldCircle}>
            <Ionicons
              name={isEmergency ? 'alert-circle' : isAlertState ? 'warning' : 'shield-checkmark'}
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>

        {/* Title & Subtitle Column */}
        <View style={styles.textColumn}>
          <Text
            numberOfLines={1}
            style={[
              styles.titleText,
              {
                color: bannerColor,
                fontSize: isElderly ? 16 : 14,
              },
            ]}>
            {bannerTitle}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.subtitleText,
              {
                color: isDark ? colors.textMuted : isAlertState ? '#92400E' : isEmergency ? '#BE123C' : '#475569',
                fontSize: isElderly ? 13 : 11.5,
              },
            ]}>
            {bannerSubtitle}
          </Text>
        </View>

        {/* Chevron Forward */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDark ? colors.textMuted : '#64748B'}
          style={styles.chevronIcon}
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    padding: 0,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  cardContent: {
    paddingHorizontal: 14,
    minHeight: CircleTokens.safetyBannerHeight,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldWrap: {
    width: CircleTokens.safetyShieldSize,
    height: CircleTokens.safetyShieldSize,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  shieldHalo: {
    position: 'absolute',
    width: CircleTokens.safetyShieldSize + 8,
    height: CircleTokens.safetyShieldSize + 8,
    borderRadius: (CircleTokens.safetyShieldSize + 8) / 2,
  },
  shieldCircle: {
    width: CircleTokens.safetyShieldSize,
    height: CircleTokens.safetyShieldSize,
    borderRadius: CircleTokens.safetyShieldSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleText: {
    fontWeight: '800',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
  subtitleText: {
    fontWeight: '500',
    includeFontPadding: false,
  },
  chevronIcon: {
    flexShrink: 0,
  },
});
