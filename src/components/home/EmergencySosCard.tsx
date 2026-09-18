import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';

interface EmergencySosCardProps {
  onTriggerSos: (reason: string, details: string) => void;
  onOpenSosModal: () => void;
}

export const EmergencySosCard: React.FC<EmergencySosCardProps> = ({
  onTriggerSos,
  onOpenSosModal,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members } = useFamily();

  // Hold-to-confirm animation state (2 seconds hold)
  const [isHolding, setIsHolding] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ambient gentle pulse on the SOS button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Start hold-to-confirm (2000ms)
  const handlePressIn = () => {
    setIsHolding(true);
    setHoldSuccess(false);

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    // Interval haptics during hold
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
    }, 450);

    // Animate progress 0 -> 1 over 2000ms
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
      onTriggerSos('Urgent Emergency', 'Hold-to-confirm triggered from Home Screen');
      setTimeout(() => {
        setHoldSuccess(false);
        setIsHolding(false);
        holdProgress.setValue(0);
      }, 3500);
    }, 2000);
  };

  // Cancel hold if released early
  const handlePressOut = () => {
    if (holdSuccess) return;
    clearTimers();
    setIsHolding(false);

    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 220,
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

  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(239, 68, 68, 0.16)', 'rgba(136, 19, 55, 0.22)', 'rgba(15, 23, 42, 0.85)']
          : ['#FFF1F2', '#FFE4E6', '#FFF5F5']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.cardContainer,
        {
          borderColor: isDark ? 'rgba(244, 63, 94, 0.32)' : '#FECDD3',
          shadowColor: isDark ? '#EF4444' : '#E11D48',
        },
      ]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.headingCol}>
          <View style={styles.titleWithIcon}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#FFE4E6',
                  borderColor: isDark ? 'rgba(244, 63, 94, 0.4)' : '#FDA4AF',
                },
              ]}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
            </View>
            <Text
              style={[
                styles.titleText,
                { color: isDark ? '#F8FAFC' : '#881337', fontSize: isElderly ? 20 : 17 },
              ]}>
              Need Help?
            </Text>
          </View>
          <Text
            style={[
              styles.instructionText,
              { color: isDark ? '#FDA4AF' : '#9F1239' },
            ]}>
            Hold for 2 seconds to alert your circle
          </Text>
        </View>

        {/* Options / Preset Modal trigger */}
        <Pressable
          onPress={onOpenSosModal}
          hitSlop={8}
          style={({ pressed }) => [
            styles.optionsBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#FECDD3',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Text style={[styles.optionsText, { color: isDark ? '#F8FAFC' : '#9F1239' }]}>
            Options ▾
          </Text>
        </Pressable>
      </View>

      {/* Center Interactive Circular SOS Button */}
      <View style={styles.sosButtonArea}>
        <View style={styles.buttonPositioner}>
          {/* Animated Ambient Pulse Rings */}
          <Animated.View
            style={[
              styles.ambientHalo,
              {
                borderColor: '#EF4444',
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.35],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.65, 0],
                }),
              },
            ]}
          />

          {/* Hold Progress Background Ring */}
          <View style={styles.progressRingBg} />

          {/* Main Pressable SOS Circular Button */}
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityLabel="Emergency SOS Button. Hold for 2 seconds to broadcast alarm."
            style={({ pressed }) => [
              styles.sosCircle,
              {
                transform: [{ scale: pressed || isHolding ? 0.94 : 1 }],
              },
            ]}>
            <LinearGradient
              colors={
                holdSuccess
                  ? ['#10B981', '#059669']
                  : isHolding
                  ? ['#DC2626', '#991B1B']
                  : ['#EF4444', '#DC2626']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sosCircleGradient}>
              {holdSuccess ? (
                <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="warning" size={24} color="#FFFFFF" />
                  <Text style={styles.sosButtonText}>SOS</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Dynamic Status / Progress Bar Indicator */}
        <View style={styles.progressTrackWrap}>
          <View
            style={[
              styles.progressTrackBg,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(225, 29, 72, 0.12)' },
            ]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: holdSuccess ? '#10B981' : '#EF4444',
                  width: holdProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={[styles.holdFeedbackText, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
            {holdSuccess
              ? '🚨 Emergency Broadcast Sent to Circle!'
              : isHolding
              ? 'Hold tight... confirming emergency'
              : 'Press & hold 2s for instant dispatch'}
          </Text>
        </View>
      </View>

      {/* Supporting Telemetry Information Row */}
      <View
        style={[
          styles.telemetryCard,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(225, 29, 72, 0.1)',
          },
        ]}>
        <View style={styles.telemetryItem}>
          <Ionicons name="navigate-circle" size={15} color={colors.green} />
          <Text style={[styles.telemetryItemText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            GPS Live • ±4m accuracy
          </Text>
        </View>

        <View style={[styles.telemetryDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#FECDD3' }]} />

        <View style={styles.telemetryItem}>
          <Ionicons name="people" size={14} color="#38BDF8" />
          <Text style={[styles.telemetryItemText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Alerts {members.length} members
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 26,
    borderWidth: 1.2,
    padding: 18,
    gap: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headingCol: {
    flex: 1,
    gap: 4,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  optionsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionsText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // SOS Button Area
  sosButtonArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  buttonPositioner: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ambientHalo: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  progressRingBg: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  sosCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  sosCircleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  // Progress Feedback
  progressTrackWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  progressTrackBg: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  holdFeedbackText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Telemetry Card
  telemetryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  telemetryItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  telemetryDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 8,
  },
});
