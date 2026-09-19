import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { GlassCard } from '@/components/ui/GlassCard';

interface CircleSafetyBannerProps {
  onPress?: () => void;
}

export const CircleSafetyBanner: React.FC<CircleSafetyBannerProps> = ({ onPress }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, sosAlert } = useFamily();

  // Continuous subtle pulse animation for glowing shield circle
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

  // Check safety state (data-driven)
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
    : colors.green;

  return (
    <GlassCard
      borderRadius={24}
      glowColor={isDark ? bannerColor : undefined}
      borderAccentColor={
        isDark
          ? isEmergency
            ? 'rgba(240, 82, 77, 0.45)'
            : isAlertState
            ? 'rgba(245, 158, 11, 0.45)'
            : 'rgba(34, 197, 139, 0.40)'
          : undefined
      }
      onPress={() => {
        triggerHaptic();
        if (onPress) onPress();
      }}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      {/* Light Mode: Pale mint/lavender gradient */}
      {!isDark && (
        <LinearGradient
          colors={
            isEmergency
              ? ['#FFF1F4', '#FFE6F0']
              : isAlertState
              ? ['#FEF3C7', '#FDE68A']
              : ['rgba(242, 253, 249, 0.90)', 'rgba(235, 249, 244, 0.85)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Light Mode Faint Leaf Accent */}
      {!isDark && !isEmergency && (
        <View style={styles.leafAccentContainer} pointerEvents="none">
          <View style={styles.leafShapeMain}>
            <View style={styles.leafSpine} />
          </View>
          <View style={styles.leafShapeSub} />
        </View>
      )}

      <View style={styles.bannerRow}>
        {/* Glowing Shield Icon */}
        <View style={styles.shieldGlowWrap}>
          <Animated.View
            style={[
              styles.shieldHalo,
              {
                backgroundColor: isDark
                  ? isEmergency
                    ? 'rgba(240, 82, 77, 0.28)'
                    : isAlertState
                    ? 'rgba(245, 158, 11, 0.28)'
                    : 'rgba(34, 197, 139, 0.28)'
                  : isEmergency
                  ? 'rgba(255, 77, 122, 0.20)'
                  : isAlertState
                  ? 'rgba(245, 158, 11, 0.16)'
                  : 'rgba(46, 191, 142, 0.20)',
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.22],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.65, 0.2],
                }),
              },
            ]}
          />
          <LinearGradient
            colors={
              isEmergency
                ? ['#FF4D7A', '#E11D48']
                : isAlertState
                ? ['#F59E0B', '#D97706']
                : ['#2EBF8E', '#22C58B']
            }
            style={styles.shieldCircle}>
            <Ionicons
              name={isEmergency ? 'alert-circle' : isAlertState ? 'warning' : 'shield-checkmark'}
              size={18}
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textColumn}>
          <Text
            style={[
              styles.titleText,
              {
                color: isDark ? bannerColor : isAlertState ? '#B45309' : isEmergency ? '#E11D48' : '#2EBF8E',
                fontSize: isElderly ? 16 : 13.5,
              },
            ]}>
            {bannerTitle}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.subtitleText,
              {
                color: isDark ? colors.textMuted : isAlertState ? '#92400E' : isEmergency ? '#BE123C' : '#7A7DB0',
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
          color={isDark ? colors.textMuted : isAlertState ? '#92400E' : isEmergency ? '#E11D48' : '#6D5BD0'}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 13,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldGlowWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shieldHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shieldCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C58B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontWeight: '500',
  },

  // Faint Leaf Decoration (Light mode only)
  leafAccentContainer: {
    position: 'absolute',
    right: 24,
    top: -4,
    width: 60,
    height: 50,
  },
  leafShapeMain: {
    position: 'absolute',
    width: 38,
    height: 24,
    borderRadius: 12,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: 'rgba(34, 197, 139, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 139, 0.22)',
    transform: [{ rotate: '-35deg' }],
  },
  leafSpine: {
    position: 'absolute',
    top: '48%',
    left: '15%',
    right: '15%',
    height: 1,
    backgroundColor: 'rgba(34, 197, 139, 0.25)',
  },
  leafShapeSub: {
    position: 'absolute',
    top: 14,
    right: 8,
    width: 24,
    height: 15,
    borderRadius: 8,
    borderTopRightRadius: 1,
    borderBottomLeftRadius: 1,
    backgroundColor: 'rgba(34, 197, 139, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 139, 0.18)',
    transform: [{ rotate: '-55deg' }],
  },
});
