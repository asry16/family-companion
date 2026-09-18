import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';

export const HeaderAmbientArt: React.FC = () => {
  const { isDark } = useAppTheme();

  if (isDark) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Distant Twinkling Stars */}
        <View style={[styles.star, { top: 16, left: '12%', opacity: 0.7, width: 2.5, height: 2.5 }]} />
        <View style={[styles.star, { top: 28, left: '26%', opacity: 0.5, width: 2, height: 2 }]} />
        <View style={[styles.star, { top: 12, left: '42%', opacity: 0.85, width: 3, height: 3 }]} />
        <View style={[styles.star, { top: 32, left: '58%', opacity: 0.45, width: 2, height: 2 }]} />
        <View style={[styles.star, { top: 18, left: '72%', opacity: 0.9, width: 3, height: 3, backgroundColor: '#BAE6FD' }]} />
        <View style={[styles.star, { top: 36, left: '84%', opacity: 0.6, width: 2.5, height: 2.5 }]} />
        <View style={[styles.star, { top: 10, left: '92%', opacity: 0.8, width: 2, height: 2 }]} />
        <View style={[styles.star, { top: 48, left: '65%', opacity: 0.4, width: 2, height: 2 }]} />

        {/* Shooting Star Streak */}
        <View style={styles.shootingStarContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(56, 189, 248, 0.6)', 'rgba(56, 189, 248, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shootingStarTail}
          />
          <View style={styles.shootingStarHead} />
        </View>

        {/* Faint Mountain Silhouette at the top-right / horizon */}
        <View style={styles.mountainCluster}>
          <LinearGradient
            colors={['rgba(21, 36, 78, 0.45)', 'rgba(6, 11, 31, 0.85)']}
            style={[styles.mountainPeak, styles.peak1]}
          />
          <LinearGradient
            colors={['rgba(15, 26, 58, 0.55)', 'rgba(6, 11, 31, 0.92)']}
            style={[styles.mountainPeak, styles.peak2]}
          />
          <LinearGradient
            colors={['rgba(25, 45, 95, 0.35)', 'rgba(6, 11, 31, 0.80)']}
            style={[styles.mountainPeak, styles.peak3]}
          />
        </View>
      </View>
    );
  }

  // Light Mode: Faint Leaf Illustration top-right
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.leafCluster}>
        {/* Main Leaf */}
        <LinearGradient
          colors={['rgba(34, 197, 139, 0.22)', 'rgba(59, 111, 240, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.leafBase, styles.leafMain]}
        >
          <View style={styles.leafSpine} />
        </LinearGradient>

        {/* Secondary Overlapping Leaf */}
        <LinearGradient
          colors={['rgba(34, 197, 139, 0.18)', 'rgba(16, 185, 129, 0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.leafBase, styles.leafSecondary]}
        >
          <View style={styles.leafSpine} />
        </LinearGradient>

        {/* Small Delicate Accent Leaf */}
        <LinearGradient
          colors={['rgba(34, 197, 139, 0.15)', 'rgba(59, 111, 240, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.leafBase, styles.leafTertiary]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Dark mode stars
  star: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
  },
  shootingStarContainer: {
    position: 'absolute',
    top: 14,
    right: 50,
    width: 65,
    height: 35,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transform: [{ rotate: '-32deg' }],
  },
  shootingStarTail: {
    width: 55,
    height: 2,
    borderRadius: 1,
  },
  shootingStarHead: {
    position: 'absolute',
    left: 0,
    top: -1.5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  mountainCluster: {
    position: 'absolute',
    bottom: -15,
    right: 0,
    width: 220,
    height: 70,
    overflow: 'hidden',
  },
  mountainPeak: {
    position: 'absolute',
    borderRadius: 14,
  },
  peak1: {
    width: 130,
    height: 130,
    bottom: -65,
    right: -20,
    transform: [{ rotate: '45deg' }],
  },
  peak2: {
    width: 110,
    height: 110,
    bottom: -55,
    right: 60,
    transform: [{ rotate: '45deg' }],
  },
  peak3: {
    width: 90,
    height: 90,
    bottom: -45,
    right: 140,
    transform: [{ rotate: '45deg' }],
  },

  // Light mode leaf cluster
  leafCluster: {
    position: 'absolute',
    top: -12,
    right: -10,
    width: 140,
    height: 100,
    overflow: 'hidden',
  },
  leafBase: {
    position: 'absolute',
    borderTopLeftRadius: 60,
    borderBottomRightRadius: 60,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 139, 0.25)',
  },
  leafMain: {
    width: 75,
    height: 48,
    top: 6,
    right: 6,
    transform: [{ rotate: '-25deg' }],
  },
  leafSecondary: {
    width: 58,
    height: 36,
    top: 36,
    right: 32,
    transform: [{ rotate: '-48deg' }],
  },
  leafTertiary: {
    width: 38,
    height: 24,
    top: 52,
    right: 80,
    transform: [{ rotate: '-15deg' }],
  },
  leafSpine: {
    position: 'absolute',
    top: '48%',
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: 'rgba(34, 197, 139, 0.28)',
  },
});
