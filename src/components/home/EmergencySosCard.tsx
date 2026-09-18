import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

interface EmergencySosCardProps {
  onTriggerSos: (reason: string, details: string) => void;
  onOpenSosModal?: () => void;
}

export const EmergencySosCard: React.FC<EmergencySosCardProps> = ({
  onTriggerSos,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  // Hold-to-confirm animation state (2 seconds hold)
  const [isHolding, setIsHolding] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Concentric ambient pulse rings around SOS button
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

  // Press In: starts 2s hold timer and progress animation
  const handlePressIn = () => {
    setIsHolding(true);
    setHoldSuccess(false);

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    // Repeated haptic pulses while holding
    let ticks = 0;
    hapticIntervalRef.current = setInterval(() => {
      ticks++;
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(
            ticks > 3
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Light
          );
        } catch (e) {}
      }
    }, 400);

    // Progress animation 0 -> 1 over exactly 2000ms
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Trigger confirmation after 2000ms
    holdTimerRef.current = setTimeout(() => {
      clearTimers();
      setHoldSuccess(true);
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {}
      }
      onTriggerSos('Urgent Emergency', '2s Hold-to-confirm triggered from Home Screen');
      setTimeout(() => {
        setHoldSuccess(false);
        setIsHolding(false);
        holdProgress.setValue(0);
      }, 3500);
    }, 2000);
  };

  // Press Out: A tap alone does NOTHING. If released before 2s, cancel hold and reset smoothly.
  const handlePressOut = () => {
    if (holdSuccess) return;
    clearTimers();
    setIsHolding(false);

    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const clearTimers = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
  };

  // SVG circular progress calculations (Radius 36 -> circumference ~226)


  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(240, 82, 77, 0.18)', 'rgba(120, 20, 30, 0.22)', 'rgba(15, 26, 58, 0.85)']
          : ['#FFF1F2', '#FFE4E6', '#FFF5F5']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.cardContainer,
        {
          borderColor: isDark ? 'rgba(240, 82, 77, 0.35)' : 'rgba(240, 82, 77, 0.20)',
          shadowColor: isDark ? colors.red : '#F0524D',
        },
      ]}>
      <View style={styles.cardInnerRow}>
        {/* Left Content Column */}
        <View style={styles.leftCol}>
          {/* Header Row: Red Warning-Triangle Icon + "Need Help?" */}
          <View style={styles.titleRow}>
            <View style={[styles.triangleBadge, { backgroundColor: isDark ? 'rgba(240, 82, 77, 0.22)' : '#FFE4E6' }]}>
              <Ionicons name="warning" size={15} color={colors.red} />
            </View>
            <Text style={[styles.titleText, { color: isDark ? '#FFFFFF' : '#881337', fontSize: isElderly ? 20 : 17.5 }]}>
              Need Help?
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitleText, { color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#9F1239' }]}>
            Hold for 2 seconds to alert your circle
          </Text>

          {/* Bottom Row of Small Icon Chips: GPS • 1m accuracy • Circle notified */}
          <View style={styles.bottomChipsRow}>
            <View style={styles.chipItem}>
              <Ionicons name="navigate" size={11} color={colors.red} />
              <Text style={[styles.chipText, { color: isDark ? '#FDA4AF' : '#881337' }]}>
                GPS
              </Text>
            </View>

            <Text style={[styles.dotSeparator, { color: isDark ? '#FDA4AF' : '#FDA4AF' }]}>•</Text>

            <View style={styles.chipItem}>
              <Ionicons name="locate" size={11} color={colors.red} />
              <Text style={[styles.chipText, { color: isDark ? '#FDA4AF' : '#881337' }]}>
                1m accuracy
              </Text>
            </View>

            <Text style={[styles.dotSeparator, { color: isDark ? '#FDA4AF' : '#FDA4AF' }]}>•</Text>

            <View style={styles.chipItem}>
              <Ionicons name="people" size={11} color={colors.red} />
              <Text style={[styles.chipText, { color: isDark ? '#FDA4AF' : '#881337' }]}>
                Circle notified
              </Text>
            </View>
          </View>
        </View>

        {/* Right Content Column: Large Red Circular "SOS" Button with Two Soft Concentric Glow Rings */}
        <View style={styles.sosButtonArea}>
          {/* Ring 1 (Outer Glow Ring) */}
          <Animated.View
            style={[
              styles.outerGlowRing,
              {
                backgroundColor: 'rgba(240, 82, 77, 0.16)',
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.28],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 0.15],
                }),
              },
            ]}
          />

          {/* Ring 2 (Inner Glow Ring) */}
          <Animated.View
            style={[
              styles.innerGlowRing,
              {
                backgroundColor: 'rgba(240, 82, 77, 0.26)',
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.15],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 0.3],
                }),
              },
            ]}
          />

          {/* Animated Progress Ring (Active on hold) */}
          <Animated.View
            style={[
              styles.progressRing,
              {
                borderColor: holdSuccess ? '#22C58B' : '#FFFFFF',
                opacity: holdProgress.interpolate({
                  inputRange: [0, 0.05, 1],
                  outputRange: [0, 0.85, 1],
                }),
                borderWidth: holdProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.5, 3.5],
                }),
                transform: [
                  {
                    scale: holdProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1.15],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* The Circular Button Pressable */}
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS button. Hold for 2 seconds."
            style={({ pressed }) => [
              styles.sosCoreButton,
              {
                backgroundColor: holdSuccess ? '#22C58B' : colors.red,
                transform: [{ scale: pressed || isHolding ? 0.94 : 1 }],
              },
            ]}>
            <LinearGradient
              colors={
                holdSuccess
                  ? ['#22C58B', '#10B981']
                  : [colors.red, '#DC2626']
              }
              style={styles.sosButtonGradient}>
              {holdSuccess ? (
                <Ionicons name="checkmark" size={26} color="#FFFFFF" />
              ) : (
                <Text style={styles.sosText}>SOS</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftCol: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triangleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  bottomChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 9,
  },

  // SOS button right area
  sosButtonArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerGlowRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  innerGlowRing: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  progressRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  sosCoreButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  sosButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
