import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Easing,
  Modal,
  AccessibilityInfo,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { HomeCardTokens } from '@/constants/theme';

interface EmergencySosCardProps {
  onTriggerSos: (reason: string, details: string) => void;
  onOpenSosModal?: () => void;
  accuracy?: string;
}

export const EmergencySosCard: React.FC<EmergencySosCardProps> = ({
  onTriggerSos,
  accuracy = '1m',
}) => {
  const { isDark, isElderly } = useAppTheme();

  // Accessibility: reduced motion
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Holding state (2 seconds hold)
  const [isHolding, setIsHolding] = useState(false);
  // 5-second countdown sheet state
  const [showCountdownSheet, setShowCountdownSheet] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [alertSentSuccess, setAlertSentSuccess] = useState(false);

  // Animated values
  // Dual concentric rose pulse rings
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  // Core breathing: scale 1 to 1.04 over 1600ms
  const coreBreatheAnim = useRef(new Animated.Value(0)).current;
  // Hold progress: 0 to 1 over 2000ms
  const holdProgress = useRef(new Animated.Value(0)).current;
  // Hold button scale: 1 to 0.96
  const holdScaleAnim = useRef(new Animated.Value(1)).current;

  // Timers
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hapticTickRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ring1LoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const ring2LoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const breatheLoopRef = useRef<Animated.CompositeAnimation | null>(null);

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

  const startPulse = () => {
    if (isReducedMotion) {
      ring1Anim.setValue(0.5);
      ring2Anim.setValue(0.5);
      coreBreatheAnim.setValue(0.5);
      return;
    }

    // Ring 1: 2000ms loop
    ring1Anim.setValue(0);
    ring1LoopRef.current = Animated.loop(
      Animated.timing(ring1Anim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    ring1LoopRef.current.start();

    // Ring 2: 2000ms loop with 700ms initial delay
    ring2Anim.setValue(0);
    setTimeout(() => {
      ring2LoopRef.current = Animated.loop(
        Animated.timing(ring2Anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        })
      );
      ring2LoopRef.current.start();
    }, 700);

    // Core breathing: scale 1 to 1.04 over 1600ms loop
    coreBreatheAnim.setValue(0);
    breatheLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(coreBreatheAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(coreBreatheAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    breatheLoopRef.current.start();
  };

  const stopPulse = () => {
    if (ring1LoopRef.current) ring1LoopRef.current.stop();
    if (ring2LoopRef.current) ring2LoopRef.current.stop();
    if (breatheLoopRef.current) breatheLoopRef.current.stop();
  };

  useEffect(() => {
    if (!isHolding && !showCountdownSheet) {
      startPulse();
    } else {
      stopPulse();
    }

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && !isHolding && !showCountdownSheet) {
        startPulse();
      } else {
        stopPulse();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      stopPulse();
      sub.remove();
    };
  }, [isHolding, showCountdownSheet, isReducedMotion]);

  // Press In: start 2-second hold
  const handlePressIn = () => {
    setIsHolding(true);
    stopPulse();

    // Scale to 0.96
    Animated.timing(holdScaleAnim, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Progress 0 to 1 over 2000ms
    holdProgress.setValue(0);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HomeCardTokens.needHelp.holdDurationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Light haptic ticks every 500ms
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    let ticks = 0;
    hapticTickRef.current = setInterval(() => {
      ticks++;
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
    }, 500);

    // Trigger after 2000ms
    holdTimerRef.current = setTimeout(() => {
      clearHoldTimers();
      setIsHolding(false);
      holdProgress.setValue(0);
      Animated.spring(holdScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      // Strong haptic on trigger
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {}
      }

      // Show 5-second "Sending alert… Cancel" sheet
      triggerCountdownSheet();
    }, HomeCardTokens.needHelp.holdDurationMs);
  };

  // Press Out: cancel if released before 2s
  const handlePressOut = () => {
    if (!isHolding) return;
    clearHoldTimers();
    setIsHolding(false);

    // Spring back
    Animated.spring(holdScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const clearHoldTimers = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (hapticTickRef.current) {
      clearInterval(hapticTickRef.current);
      hapticTickRef.current = null;
    }
  };

  // 5-second countdown sheet logic
  const triggerCountdownSheet = () => {
    setShowCountdownSheet(true);
    setCountdownSeconds(5);
    setAlertSentSuccess(false);

    let remaining = 5;
    countdownTimerRef.current = setInterval(() => {
      remaining--;
      setCountdownSeconds(remaining);
      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        // Alert is actually sent!
        setAlertSentSuccess(true);
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch (e) {}
        }
        onTriggerSos('Emergency SOS', 'Hold-to-confirm triggered from Home Screen');
        setTimeout(() => {
          setShowCountdownSheet(false);
          setAlertSentSuccess(false);
        }, 2000);
      }
    }, 1000);
  };

  const handleCancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setShowCountdownSheet(false);
    setAlertSentSuccess(false);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
  };

  // Interpolated animation values
  const ring1Scale = isReducedMotion
    ? 1.15
    : ring1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
      });
  const ring1Opacity = isReducedMotion
    ? 0.25
    : ring1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0],
      });

  const ring2Scale = isReducedMotion
    ? 1.25
    : ring2Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
      });
  const ring2Opacity = isReducedMotion
    ? 0.18
    : ring2Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.22, 0],
      });

  const coreScale = isReducedMotion
    ? 1
    : coreBreatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.04],
      });

  const progressStroke = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      <View
        style={[
          styles.cardContainer,
          {
            borderColor: isDark
              ? HomeCardTokens.colors.sosDarkBorder
              : HomeCardTokens.colors.sosLightBorder,
            shadowColor: isDark ? '#FF5C6C' : '#FF4D7A',
            shadowOpacity: isDark ? 0.35 : 0.12,
          },
        ]}>
        {/* Background Gradient */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(32, 10, 22, 0.95)', 'rgba(22, 8, 16, 0.92)']
              : HomeCardTokens.colors.sosLightBg
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Left Column */}
        <View style={styles.leftColumn}>
          <View style={styles.headerStack}>
            {/* 36px circle with warning triangle */}
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.warningIconCircle,
                  {
                    backgroundColor: isDark ? '#FF8A80' : '#E5384F',
                  },
                ]}>
                <Ionicons
                  name="warning"
                  size={18}
                  color={isDark ? '#1E0A14' : '#FFFFFF'}
                />
              </View>

              {/* Title "Need Help?" bold 18 */}
              <Text
                numberOfLines={1}
                style={[
                  styles.titleText,
                  {
                    color: isDark
                      ? HomeCardTokens.colors.sosDarkTitle
                      : HomeCardTokens.colors.sosLightTitle,
                    fontSize: isElderly ? 20 : 18,
                  },
                ]}>
                Need Help?
              </Text>
            </View>

            {/* Subtitle: switches to "Keep holding to send alert" during hold */}
            <Text
              numberOfLines={1}
              style={[
                styles.subtitleText,
                {
                  color: isHolding
                    ? '#E11D48'
                    : isDark
                    ? HomeCardTokens.colors.sosDarkSubtitle
                    : HomeCardTokens.colors.sosLightSubtitle,
                  fontWeight: isHolding ? '700' : '500',
                },
              ]}>
              {isHolding
                ? 'Keep holding to send alert…'
                : 'Hold for 2 seconds to alert your circle'}
            </Text>
          </View>

          {/* Bottom row: GPS • 1m accuracy • Circle notified */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="location-sharp"
                size={12}
                color={isDark ? '#FF8A8A' : '#64748B'}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.metaText,
                  { color: isDark ? '#FFB4B4' : '#64748B' },
                ]}>
                GPS
              </Text>
            </View>

            <View style={styles.dotSeparator} />

            <View style={styles.metaItem}>
              <Ionicons
                name="locate"
                size={12}
                color={isDark ? '#FF8A8A' : '#64748B'}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.metaText,
                  { color: isDark ? '#FFB4B4' : '#64748B' },
                ]}>
                {accuracy} accuracy
              </Text>
            </View>

            <View style={styles.dotSeparator} />

            <View style={styles.metaItem}>
              <Ionicons
                name="people"
                size={12}
                color={isDark ? '#FF8A8A' : '#64748B'}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.metaText,
                  { color: isDark ? '#FFB4B4' : '#64748B' },
                ]}>
                Circle notified
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column: Fixed Width 88px, Vertically Centered SOS Button */}
        <View style={styles.rightColumn}>
          {/* Pulsing Dual Rings (Active only when NOT holding) */}
          {!isHolding && (
            <>
              {/* Ring 1 */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.haloRing,
                  {
                    transform: [{ scale: ring1Scale }],
                    opacity: ring1Opacity,
                  },
                ]}
              />
              {/* Ring 2 (delayed 700ms) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.haloRing,
                  {
                    transform: [{ scale: ring2Scale }],
                    opacity: ring2Opacity,
                  },
                ]}
              />
            </>
          )}

          {/* Active Hold Progress Ring (4px stroke around 56px core) */}
          {isHolding && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.holdProgressRing,
                {
                  opacity: progressStroke,
                  transform: [
                    {
                      scale: holdProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.96, 1.12],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}

          {/* SOS Core Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS button, press and hold for 2 seconds"
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={({ pressed }) => [
              styles.sosPressArea,
              {
                opacity: pressed ? 0.96 : 1,
              },
            ]}>
            <Animated.View
              style={{
                transform: [
                  { scale: isHolding ? holdScaleAnim : coreScale },
                ],
              }}>
              {isDark ? (
                // Dark mode: Dark navy fill with 3px rose ring (#FF5C6C), white "SOS", and rose glow
                <View style={styles.darkSosCore}>
                  <Text style={styles.sosText}>SOS</Text>
                </View>
              ) : (
                // Light mode: filled coral-red radial gradient (#FF7A7A center to #EF4444 edge) with soft red shadow
                <LinearGradient
                  colors={HomeCardTokens.colors.sosLightCore}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.9, y: 0.9 }}
                  style={styles.lightSosCore}>
                  <Text style={styles.sosText}>SOS</Text>
                </LinearGradient>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>

      {/* 5-Second "Sending alert… Cancel" Sheet Modal */}
      <Modal
        visible={showCountdownSheet}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCountdown}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.countdownSheet,
              {
                backgroundColor: isDark ? '#1E0A14' : '#FFFFFF',
                borderColor: '#FF5C6C',
              },
            ]}>
            <View style={styles.countdownWarningIcon}>
              <Ionicons
                name={alertSentSuccess ? 'checkmark-circle' : 'alert-circle'}
                size={40}
                color={alertSentSuccess ? '#22C58B' : '#FF5C6C'}
              />
            </View>

            <Text
              style={[
                styles.countdownTitle,
                { color: isDark ? '#FFFFFF' : '#1E293B' },
              ]}>
              {alertSentSuccess
                ? 'Alert Sent to Your Circle!'
                : `Sending SOS in ${countdownSeconds}s…`}
            </Text>

            <Text
              style={[
                styles.countdownSubtitle,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}>
              {alertSentSuccess
                ? 'Emergency GPS and telemetry dispatched.'
                : 'Broadcasting emergency GPS to family members and emergency contacts.'}
            </Text>

            {!alertSentSuccess && (
              <Pressable
                onPress={handleCancelCountdown}
                style={styles.cancelAlertButton}>
                <Text style={styles.cancelAlertButtonText}>Cancel SOS</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: HomeCardTokens.needHelp.height,
    borderRadius: HomeCardTokens.needHelp.radius,
    padding: HomeCardTokens.needHelp.padding,
    borderWidth: 1,
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    elevation: 3,
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 8,
  },
  headerStack: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIconCircle: {
    width: HomeCardTokens.needHelp.warningIconSize,
    height: HomeCardTokens.needHelp.warningIconSize,
    borderRadius: HomeCardTokens.needHelp.warningIconSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(148, 163, 184, 0.6)',
  },

  // Right Column & SOS
  rightColumn: {
    width: HomeCardTokens.needHelp.rightColumnWidth,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
    flexShrink: 0,
  },
  haloRing: {
    position: 'absolute',
    width: HomeCardTokens.needHelp.sosSize + 28,
    height: HomeCardTokens.needHelp.sosSize + 28,
    borderRadius: (HomeCardTokens.needHelp.sosSize + 28) / 2,
    backgroundColor: 'rgba(244, 63, 94, 0.35)',
  },
  holdProgressRing: {
    position: 'absolute',
    width: HomeCardTokens.needHelp.sosSize + 14,
    height: HomeCardTokens.needHelp.sosSize + 14,
    borderRadius: (HomeCardTokens.needHelp.sosSize + 14) / 2,
    borderWidth: 4,
    borderColor: '#FF5C6C',
  },
  sosPressArea: {
    width: HomeCardTokens.needHelp.sosSize,
    height: HomeCardTokens.needHelp.sosSize,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  lightSosCore: {
    width: HomeCardTokens.needHelp.sosSize,
    height: HomeCardTokens.needHelp.sosSize,
    borderRadius: HomeCardTokens.needHelp.sosSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  darkSosCore: {
    width: HomeCardTokens.needHelp.sosSize,
    height: HomeCardTokens.needHelp.sosSize,
    borderRadius: HomeCardTokens.needHelp.sosSize / 2,
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#FF5C6C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5C6C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Countdown Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  countdownSheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FF5C6C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 12,
  },
  countdownWarningIcon: {
    marginBottom: 4,
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  countdownSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cancelAlertButton: {
    marginTop: 8,
    backgroundColor: '#FF5C6C',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelAlertButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
