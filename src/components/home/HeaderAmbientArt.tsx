import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';

export const HeaderAmbientArt: React.FC = () => {
  const { isDark } = useAppTheme();

  if (isDark) {
    // Replaced earlier stars, shooting star, and mountain silhouette.
    // DarkBackdrop now provides the tranquil full-screen indigo backdrop & faint leaf silhouettes.
    return null;
  }

  // Light Mode: Faint Leaf Illustration top-right
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
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
    shadowColor: '#8B7CF6',
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
