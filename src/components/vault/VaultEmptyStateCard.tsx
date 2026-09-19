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

interface VaultEmptyStateCardProps {
  onSaveFirstLocation: () => void;
  title?: string;
  body?: string;
  badgeLabel?: string;
  buttonLabel?: string;
  isSearchEmpty?: boolean;
}

export const VaultEmptyStateCard: React.FC<VaultEmptyStateCardProps> = ({
  onSaveFirstLocation,
  title = 'No Saved Memories',
  body = 'Start by cataloging physical drawers, important documents, or home supplies.',
  badgeLabel = 'VAULT READY',
  buttonLabel = 'Save First Location',
  isSearchEmpty = false,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  // Floating ambient pulse animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
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
      glowColor={isDark ? (isSearchEmpty ? colors.blue : colors.purple) : undefined}
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
                : 'rgba(251, 146, 60, 0.18)',
            },
          ]}
        />
        <View
          style={[
            styles.blobBottomRight,
            {
              backgroundColor: isDark
                ? 'rgba(124, 92, 224, 0.20)'
                : 'rgba(59, 111, 240, 0.12)',
            },
          ]}
        />
      </View>

      {/* Center: Folder Icon in Glowing Circle with Sparkles */}
      <View style={styles.centerCluster}>
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
            color={isDark ? '#C084FC' : '#F97316'}
            style={styles.sparkleBottomLeft}
          />

          {/* Animated Glowing Halo */}
          <Animated.View
            style={[
              styles.iconHalo,
              {
                backgroundColor: isDark
                  ? 'rgba(124, 92, 224, 0.25)'
                  : 'rgba(251, 146, 60, 0.20)',
                transform: [
                  {
                    scale: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.15],
                    }),
                  },
                ],
                opacity: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0.2],
                }),
              },
            ]}
          />

          {/* Core Folder Circle */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(124, 92, 224, 0.45)', 'rgba(59, 111, 240, 0.35)']
                : ['#FFF7ED', '#FFEDD5']
            }
            style={[
              styles.coreFolderCircle,
              {
                borderColor: isDark ? 'rgba(124, 92, 224, 0.50)' : '#FDBA74',
                shadowColor: isDark ? colors.purple : '#EA580C',
              },
            ]}>
            <Ionicons
              name={isSearchEmpty ? 'search' : 'folder'}
              size={32}
              color={isDark ? '#C084FC' : '#EA580C'}
            />
          </LinearGradient>
        </View>

        {/* "VAULT READY" Pill (coral in light, purple in dark) */}
        <View
          style={[
            styles.vaultReadyPill,
            {
              backgroundColor: isDark
                ? 'rgba(124, 92, 224, 0.20)'
                : '#FFEDD5',
              borderColor: isDark
                ? 'rgba(124, 92, 224, 0.40)'
                : '#FED7AA',
            },
          ]}>
          <Text
            style={[
              styles.vaultReadyText,
              { color: isDark ? '#C084FC' : '#EA580C' },
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

        {/* Primary Gradient Button: "Save First Location" with Folder Icon */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            onSaveFirstLocation();
          }}
          style={({ pressed }) => [
            styles.gradientButtonWrap,
            {
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}>
          <LinearGradient
            colors={isDark ? ['#3B6FF0', '#7C5CE0'] : ['#4F8EF7', '#8A6BF2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradientButtonInner,
              {
                shadowColor: isDark ? colors.purple : '#6E5ADC',
              },
            ]}>
            <Ionicons
              name={isSearchEmpty ? 'refresh' : 'folder'}
              size={17}
              color={isDark ? '#000000' : '#FFFFFF'}
            />
            <Text
              style={[
                styles.gradientButtonText,
                { color: '#FFFFFF' },
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
  coreFolderCircle: {
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
  vaultReadyPill: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  vaultReadyText: {
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
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});
