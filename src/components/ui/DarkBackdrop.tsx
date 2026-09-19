import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * DarkBackdrop component (dark mode only, behind all screens):
 * - Deep indigo gradient: #0B1030 at the top to #151A52 at the bottom.
 * - Faint indigo radial glow at the top center (#3B3FA8 at 15%).
 * - Large, very faint dark-violet leaf/feather silhouettes bleeding off the left edge
 *   (top and bottom) and the bottom-right corner, gradient #1B1F63 to transparent,
 *   25-35% opacity, pointerEvents none, never lowering text contrast.
 */
export const DarkBackdrop: React.FC = () => {
  const { isDark } = useAppTheme();

  if (!isDark) return null;

  return (
    <View style={styles.backdropContainer} pointerEvents="none">
      {/* 1. Base Deep Indigo Gradient (#0B1030 top to #151A52 bottom) */}
      <LinearGradient
        colors={['#0B1030', '#101542', '#151A52']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Faint Indigo Radial Glow at Top Center (#3B3FA8 at 15%) */}
      <View style={styles.topCenterGlowWrap}>
        <LinearGradient
          colors={['rgba(59, 63, 168, 0.20)', 'rgba(59, 63, 168, 0.08)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topCenterGlow}
        />
      </View>

      {/* 3. Large, Very Faint Dark-Violet Leaf/Feather Silhouettes (25-35% opacity, #1B1F63 to transparent) */}
      {/* Top-Left Leaf / Feather Bleeding Off Left Edge */}
      <View style={styles.featherTopLeftWrap}>
        <LinearGradient
          colors={['rgba(27, 31, 99, 0.35)', 'rgba(27, 31, 99, 0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.featherShape, styles.featherTopLeft]}
        >
          <View style={styles.featherSpine} />
          <View style={[styles.featherVane, { top: '25%', left: '15%', width: '45%' }]} />
          <View style={[styles.featherVane, { top: '45%', left: '20%', width: '50%' }]} />
          <View style={[styles.featherVane, { top: '65%', left: '25%', width: '40%' }]} />
        </LinearGradient>
      </View>

      {/* Bottom-Left Leaf / Feather Bleeding Off Left Edge */}
      <View style={styles.featherBottomLeftWrap}>
        <LinearGradient
          colors={['rgba(27, 31, 99, 0.32)', 'rgba(27, 31, 99, 0.10)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[styles.featherShape, styles.featherBottomLeft]}
        >
          <View style={[styles.featherSpine, { transform: [{ rotate: '12deg' }] }]} />
          <View style={[styles.featherVane, { top: '30%', left: '18%', width: '42%' }]} />
          <View style={[styles.featherVane, { top: '50%', left: '22%', width: '48%' }]} />
        </LinearGradient>
      </View>

      {/* Bottom-Right Corner Leaf / Feather Silhouette */}
      <View style={styles.featherBottomRightWrap}>
        <LinearGradient
          colors={['rgba(27, 31, 99, 0.30)', 'rgba(27, 31, 99, 0.08)', 'transparent']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={[styles.featherShape, styles.featherBottomRight]}
        >
          <View style={[styles.featherSpine, { transform: [{ rotate: '-18deg' }] }]} />
          <View style={[styles.featherVane, { top: '35%', right: '15%', width: '45%' }]} />
          <View style={[styles.featherVane, { top: '55%', right: '20%', width: '50%' }]} />
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdropContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  topCenterGlowWrap: {
    position: 'absolute',
    top: -120,
    left: '50%',
    marginLeft: -175,
    width: 350,
    height: 350,
    borderRadius: 175,
    overflow: 'hidden',
  },
  topCenterGlow: {
    width: '100%',
    height: '100%',
    borderRadius: 175,
  },
  featherTopLeftWrap: {
    position: 'absolute',
    top: -30,
    left: -70,
    width: 240,
    height: 320,
    overflow: 'hidden',
  },
  featherBottomLeftWrap: {
    position: 'absolute',
    bottom: 40,
    left: -80,
    width: 220,
    height: 280,
    overflow: 'hidden',
  },
  featherBottomRightWrap: {
    position: 'absolute',
    bottom: -40,
    right: -70,
    width: 260,
    height: 300,
    overflow: 'hidden',
  },
  featherShape: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  featherTopLeft: {
    borderTopRightRadius: 180,
    borderBottomLeftRadius: 120,
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 80,
    transform: [{ rotate: '25deg' }],
  },
  featherBottomLeft: {
    borderTopRightRadius: 160,
    borderBottomRightRadius: 140,
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 60,
    transform: [{ rotate: '-35deg' }],
  },
  featherBottomRight: {
    borderTopLeftRadius: 180,
    borderBottomLeftRadius: 140,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 70,
    transform: [{ rotate: '40deg' }],
  },
  featherSpine: {
    position: 'absolute',
    top: '15%',
    bottom: '15%',
    left: '48%',
    width: 1.5,
    backgroundColor: 'rgba(27, 31, 99, 0.40)',
  },
  featherVane: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(27, 31, 99, 0.25)',
    borderRadius: 1,
  },
});
