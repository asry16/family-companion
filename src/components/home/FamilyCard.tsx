import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  AccessibilityInfo,
  AppState,
  AppStateStatus,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { HomeCardTokens } from '@/constants/theme';

interface FamilyCardProps {
  onViewLiveMap: () => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ onViewLiveMap }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser } = useFamily();

  const primaryMember = activeUser || members[0] || {
    id: 'self',
    name: 'Asmita',
    relation: 'Self',
    availability: 'available',
    isSharingLocation: true,
    humanLocation: 'Home',
    photoUrl: undefined,
    lastUpdated: '2 min ago',
  };

  // Accessibility: reduced motion
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  // Relative time counter: updates every minute
  const [minutesAgo, setMinutesAgo] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setIsReducedMotion(enabled))
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) =>
      setIsReducedMotion(enabled)
    );
    return () => {
      if (sub && typeof sub.remove === 'function') sub.remove();
    };
  }, []);

  // Animations:
  // 1. Shield green glow ring: scale 1 to 1.35, opacity 0.4 to 0, 2400ms loop
  const shieldPulseAnim = useRef(new Animated.Value(0)).current;
  // 2. Green status dot halo pulse: scale 1 to 2.2, opacity 0.5 to 0, 1600ms loop
  const dotHaloAnim = useRef(new Animated.Value(0)).current;

  const shieldLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const dotLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startAnimations = () => {
    if (isReducedMotion) {
      shieldPulseAnim.setValue(0.5);
      dotHaloAnim.setValue(0.5);
      return;
    }

    shieldPulseAnim.setValue(0);
    shieldLoopRef.current = Animated.loop(
      Animated.timing(shieldPulseAnim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    shieldLoopRef.current.start();

    dotHaloAnim.setValue(0);
    dotLoopRef.current = Animated.loop(
      Animated.timing(dotHaloAnim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    dotLoopRef.current.start();
  };

  const stopAnimations = () => {
    if (shieldLoopRef.current) shieldLoopRef.current.stop();
    if (dotLoopRef.current) dotLoopRef.current.stop();
  };

  useEffect(() => {
    startAnimations();

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        startAnimations();
      } else {
        stopAnimations();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      stopAnimations();
      sub.remove();
    };
  }, [isReducedMotion]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Interpolated animation values
  const shieldScale = isReducedMotion
    ? 1.05
    : shieldPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.35],
      });
  const shieldOpacity = isReducedMotion
    ? 0.25
    : shieldPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 0],
      });

  const dotScale = isReducedMotion
    ? 1.1
    : dotHaloAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.2],
      });
  const dotOpacity = isReducedMotion
    ? 0.3
    : dotHaloAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 0],
      });

  const initial = (primaryMember.name?.charAt(0) || 'A').toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Family Pulse Card, tap to view live map"
      onPress={() => {
        triggerHaptic();
        onViewLiveMap();
      }}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          borderColor: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(124, 92, 224, 0.14)',
          shadowColor: isDark ? '#3B6FF0' : '#6E5ADC',
          shadowOpacity: isDark ? 0.30 : 0.10,
          opacity: pressed ? 0.96 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(15, 26, 58, 0.92)', 'rgba(10, 18, 42, 0.88)']
            : ['rgba(255, 255, 255, 0.85)', 'rgba(247, 245, 255, 0.78)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {/* 48px Glowing Green Circle with White Shield-Check Outline */}
          <View style={styles.shieldWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shieldPulseRing,
                {
                  transform: [{ scale: shieldScale }],
                  opacity: shieldOpacity,
                },
              ]}
            />
            <LinearGradient
              colors={['#2EBF8E', '#22C58B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Titles */}
          <View style={styles.headerTitles}>
            <Text
              numberOfLines={1}
              style={[
                styles.cardTitle,
                { color: colors.text, fontSize: isElderly ? 20 : 18 },
              ]}>
              Family Pulse
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.cardSubtitle,
                { color: isDark ? colors.textMuted : '#7A7DB0' },
              ]}>
              Live Presence Active • Vault Synced
            </Text>
          </View>
        </View>

        {/* Chevron at Far Right */}
        <View style={styles.chevronWrap}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? colors.textMuted : '#7A7DB0'}
          />
        </View>
      </View>

      {/* 2. Lower Content Section: Member Capsule Panel (~60%) & Map Thumbnail (~40%) */}
      <View style={styles.lowerRow}>
        {/* Member Panel (Height 64, Radius 32) */}
        <View
          style={[
            styles.memberPanel,
            {
              backgroundColor: isDark
                ? 'rgba(15, 26, 58, 0.75)'
                : 'rgba(255, 255, 255, 0.82)',
              borderColor: isDark
                ? 'rgba(59, 111, 240, 0.22)'
                : 'rgba(124, 92, 224, 0.14)',
            },
          ]}>
          {/* 40px Circular Avatar */}
          <View style={styles.avatarWrap}>
            {primaryMember.photoUrl ? (
              <Image source={{ uri: primaryMember.photoUrl }} style={styles.avatarImg} />
            ) : (
              <LinearGradient
                colors={['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Member Name + Location */}
          <View style={styles.memberTextCol}>
            <View style={styles.nameWithDot}>
              {/* Green dot with animated halo */}
              <View style={styles.dotWrap}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.dotHalo,
                    {
                      transform: [{ scale: dotScale }],
                      opacity: dotOpacity,
                    },
                  ]}
                />
                <View style={styles.dotCore} />
              </View>
              <Text numberOfLines={1} style={[styles.memberName, { color: colors.text }]}>
                {primaryMember.name || 'Asmita'}
              </Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color="#22C58B" />
              <Text
                numberOfLines={1}
                style={[
                  styles.locationLabel,
                  { color: isDark ? colors.textMuted : '#7A7DB0' },
                ]}>
                {primaryMember.humanLocation || 'Home'}
              </Text>
            </View>
          </View>

          {/* Thin Vertical Divider */}
          <View
            style={[
              styles.verticalDivider,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.10)'
                  : 'rgba(124, 92, 224, 0.14)',
              },
            ]}
          />

          {/* Last Active Column */}
          <View style={styles.lastActiveCol}>
            <Text
              numberOfLines={1}
              style={[
                styles.lastActiveLabel,
                { color: isDark ? colors.textMuted : '#7A7DB0' },
              ]}>
              Last active
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.lastActiveValue, { color: colors.text }]}>
              {minutesAgo} min ago
            </Text>
          </View>
        </View>

        {/* Map Thumbnail (~40% width, height 64, radius 24) */}
        <View
          style={[
            styles.mapThumbnailWrap,
            {
              borderColor: isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          {/* Stylized Vector Map Illustration (no live tiles, no watermark) */}
          <View
            style={[
              styles.staticMapCanvas,
              { backgroundColor: isDark ? '#0A1432' : '#EAE8FC' },
            ]}>
            {/* Street Line 1 */}
            <View
              style={[
                styles.mapRoad1,
                { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(124, 92, 224, 0.22)' },
              ]}
            />
            {/* Street Line 2 */}
            <View
              style={[
                styles.mapRoad2,
                { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(79, 142, 247, 0.25)' },
              ]}
            />
            {/* Street Line 3 */}
            <View
              style={[
                styles.mapRoad3,
                { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(138, 107, 242, 0.20)' },
              ]}
            />

            {/* Glowing Green Pin */}
            <View style={styles.mapPinWrap}>
              <View style={styles.pinGlowHalo} />
              <View style={styles.pinCoreCircle}>
                <Ionicons name="location" size={11} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Left-edge soft fade gradient */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(15, 26, 58, 0.95)', 'rgba(15, 26, 58, 0.0)']
                : ['rgba(255, 255, 255, 0.90)', 'rgba(255, 255, 255, 0.0)']
            }
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.mapLeftEdgeFade}
          />
        </View>
      </View>

      {/* 4. "View Live Map →" Pill Indicator (Anchored bottom-right with 12px inset, overlapping map thumbnail) */}
      <View
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
        style={[
          styles.viewLiveMapPill,
          {
            backgroundColor: isDark ? '#0F1A3A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.40)' : 'transparent',
            borderWidth: isDark ? 1 : 0,
            shadowColor: isDark ? '#38BDF8' : '#6E5ADC',
            shadowOpacity: isDark ? 0.25 : 0.15,
          },
        ]}>
        <Text
          numberOfLines={1}
          style={[
            styles.viewLiveMapText,
            { color: isDark ? '#38BDF8' : '#5B4BC4' },
          ]}>
          View Live Map →
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: HomeCardTokens.familyPulse.height,
    borderRadius: HomeCardTokens.familyPulse.radius,
    padding: HomeCardTokens.familyPulse.padding,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shieldWrap: {
    width: HomeCardTokens.familyPulse.headerIconSize,
    height: HomeCardTokens.familyPulse.headerIconSize,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shieldPulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(46, 191, 142, 0.40)',
  },
  shieldCircle: {
    width: HomeCardTokens.familyPulse.headerIconSize,
    height: HomeCardTokens.familyPulse.headerIconSize,
    borderRadius: HomeCardTokens.familyPulse.headerIconSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2EBF8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  chevronWrap: {
    flexShrink: 0,
    paddingLeft: 8,
  },

  // Lower Section
  lowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    position: 'relative',
  },
  memberPanel: {
    flex: 6,
    height: HomeCardTokens.familyPulse.memberPanelHeight,
    borderRadius: HomeCardTokens.familyPulse.memberPanelRadius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    zIndex: 2,
  },
  avatarWrap: {
    width: HomeCardTokens.familyPulse.avatarSize,
    height: HomeCardTokens.familyPulse.avatarSize,
    borderRadius: HomeCardTokens.familyPulse.avatarSize / 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: HomeCardTokens.familyPulse.avatarSize,
    height: HomeCardTokens.familyPulse.avatarSize,
    borderRadius: HomeCardTokens.familyPulse.avatarSize / 2,
  },
  avatarFallback: {
    width: HomeCardTokens.familyPulse.avatarSize,
    height: HomeCardTokens.familyPulse.avatarSize,
    borderRadius: HomeCardTokens.familyPulse.avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  memberTextCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  nameWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  dotHalo: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(34, 197, 139, 0.50)',
  },
  dotCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C58B',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  verticalDivider: {
    width: 1,
    height: 28,
    flexShrink: 0,
  },
  lastActiveCol: {
    justifyContent: 'center',
    gap: 2,
    paddingRight: 4,
    flexShrink: 0,
  },
  lastActiveLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  lastActiveValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Map Thumbnail
  mapThumbnailWrap: {
    flex: 4,
    height: HomeCardTokens.familyPulse.memberPanelHeight,
    borderRadius: HomeCardTokens.familyPulse.mapThumbnailRadius,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  staticMapCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapRoad1: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 6,
    transform: [{ rotate: '-12deg' }],
  },
  mapRoad2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '45%',
    width: 5,
    transform: [{ rotate: '25deg' }],
  },
  mapRoad3: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    height: 4,
    transform: [{ rotate: '8deg' }],
  },
  mapPinWrap: {
    position: 'absolute',
    top: 14,
    left: '52%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinGlowHalo: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(34, 197, 139, 0.40)',
  },
  pinCoreCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C58B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLeftEdgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 24,
    pointerEvents: 'none',
  },

  // View Live Map Pill
  viewLiveMapPill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    height: HomeCardTokens.familyPulse.viewLiveMapHeight,
    paddingHorizontal: HomeCardTokens.familyPulse.viewLiveMapPaddingH,
    borderRadius: HomeCardTokens.familyPulse.viewLiveMapHeight / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    flexShrink: 0,
  },
  viewLiveMapText: {
    fontSize: HomeCardTokens.familyPulse.viewLiveMapFontSize,
    fontWeight: '600',
  },
});
