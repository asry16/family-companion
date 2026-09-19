import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';

export interface PlansEmptyStateCardProps {
  onAddPlan: () => void;
  title?: string;
  body?: string;
  badgeLabel?: string;
  buttonLabel?: string;
}

export const PlansEmptyStateCard: React.FC<PlansEmptyStateCardProps> = ({
  onAddPlan,
  title = 'No Plans Scheduled',
  body = 'Your family schedule is completely open. Add a task or speak a reminder above.',
  badgeLabel = 'FRESH SLATE',
  buttonLabel = '+ Add Household Plan',
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  // Floating ambient pulse animation for the icon glow
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <GlassCard
      borderRadius={28}
      glowColor={isDark ? colors.blue : undefined}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      {/* Soft Ambient Background Blobs */}
      <View style={styles.ambientBlobWrap} pointerEvents="none">
        <View
          style={[
            styles.blobTopLeft,
            {
              backgroundColor: isDark
                ? 'rgba(59, 111, 240, 0.18)'
                : 'rgba(59, 111, 240, 0.12)',
            },
          ]}
        />
        <View
          style={[
            styles.blobBottomRight,
            {
              backgroundColor: isDark
                ? 'rgba(124, 92, 224, 0.20)'
                : 'rgba(124, 92, 224, 0.10)',
            },
          ]}
        />
      </View>

      {/* Center Content Cluster */}
      <View style={styles.centerCluster}>
        {/* Calendar Icon in Glowing Circle with Sparkles */}
        <View style={styles.iconCircleContainer}>
          {/* Sparkle 1 */}
          <Ionicons
            name="sparkles"
            size={14}
            color={isDark ? '#38BDF8' : colors.blue}
            style={styles.sparkleTopRight}
          />
          {/* Sparkle 2 */}
          <Ionicons
            name="sparkles"
            size={11}
            color={isDark ? '#C084FC' : '#7C5CE0'}
            style={styles.sparkleBottomLeft}
          />

          {/* Animated Glowing Halo */}
          <Animated.View
            style={[
              styles.iconHalo,
              {
                backgroundColor: isDark
                  ? 'rgba(59, 111, 240, 0.25)'
                  : 'rgba(59, 111, 240, 0.18)',
                transform: [
                  {
                    scale: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.16],
                    }),
                  },
                ],
                opacity: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.65, 0.2],
                }),
              },
            ]}
          />

          {/* Core Calendar Circle */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(59, 111, 240, 0.45)', 'rgba(124, 92, 224, 0.35)']
                : ['#EFF6FF', '#DBEAFE']
            }
            style={[
              styles.coreCalendarCircle,
              {
                borderColor: isDark ? 'rgba(59, 111, 240, 0.50)' : '#93C5FD',
                shadowColor: isDark ? colors.blue : colors.blue,
              },
            ]}>
            <Ionicons
              name="calendar"
              size={32}
              color={isDark ? '#38BDF8' : colors.blue}
            />
          </LinearGradient>
        </View>

        {/* "FRESH SLATE" Label in Blue */}
        <View
          style={[
            styles.freshSlatePill,
            {
              backgroundColor: isDark
                ? 'rgba(59, 111, 240, 0.20)'
                : 'rgba(59, 111, 240, 0.10)',
              borderColor: isDark
                ? 'rgba(59, 111, 240, 0.40)'
                : 'rgba(59, 111, 240, 0.22)',
            },
          ]}>
          <Text
            style={[
              styles.freshSlateText,
              { color: isDark ? '#38BDF8' : colors.blue },
            ]}>
            {badgeLabel}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.emptyTitle,
            { color: colors.text, fontSize: isElderly ? 23 : 20 },
          ]}>
          {title}
        </Text>

        {/* Body Text */}
        <Text
          style={[
            styles.emptyBody,
            { color: isDark ? colors.textMuted : colors.textSecondary },
          ]}>
          {body}
        </Text>

        {/* Primary Gradient Button: "+ Add Household Plan" */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            onAddPlan();
          }}
          accessibilityLabel={buttonLabel}
          style={({ pressed }) => [
            styles.gradientButtonWrap,
            {
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}>
          <LinearGradient
            colors={['#3B6FF0', '#7C5CE0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradientButtonInner,
              {
                shadowColor: isDark ? colors.purple : colors.blue,
              },
            ]}>
            <Text
              style={[
                styles.gradientButtonText,
                { color: isDark ? '#000000' : '#FFFFFF' },
              ]}>
              {buttonLabel}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    padding: 0,
    marginHorizontal: 18,
    marginVertical: 8,
  },
  cardContent: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientBlobWrap: {
    ...StyleSheet.absoluteFill,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  centerCluster: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 2,
  },
  iconCircleContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: 4,
    left: 2,
  },
  iconHalo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  coreCalendarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  freshSlatePill: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  freshSlateText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptyTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 290,
  },
  gradientButtonWrap: {
    borderRadius: 24,
    marginTop: 6,
  },
  gradientButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});
