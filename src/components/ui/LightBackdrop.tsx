import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LightBackdrop: React.FC = () => {
  const { isDark } = useAppTheme();

  // Strictly hidden in dark mode
  if (isDark) return null;

  return (
    <View style={styles.backdropContainer} pointerEvents="none">
      {/* 1. Base Soft Lavender Gradient: #F8F7FF at top to #EFEDFB at bottom */}
      <LinearGradient
        colors={['#F8F7FF', '#F3F0FC', '#EFEDFB']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Large Blurred Pale-Violet Ambient Blobs (#E4E0FA at 40% opacity) */}
      <View style={[styles.ambientBlob, styles.blobTopRight]} />
      <View style={[styles.ambientBlob, styles.blobMidLeft]} />
      <View style={[styles.ambientBlob, styles.blobBottomRight]} />

      {/* 3. Decorative Botanical Sprigs, Butterfly, and 4-Point Sparkles (30-40% Opacity) */}
      {/* Top-Left Lavender Botanical Sprig */}
      <View style={styles.sprigTopLeft}>
        <Ionicons name="leaf-outline" size={34} color="#8A6BF2" style={{ transform: [{ rotate: '-35deg' }] }} />
        <Ionicons name="flower-outline" size={16} color="#7C5CE0" style={styles.flowerTopLeft} />
      </View>

      {/* Bottom-Right Lavender Botanical Sprig */}
      <View style={styles.sprigBottomRight}>
        <Ionicons name="leaf-outline" size={38} color="#8A6BF2" style={{ transform: [{ rotate: '145deg' }] }} />
        <Ionicons name="flower-outline" size={18} color="#7C5CE0" style={styles.flowerBottomRight} />
      </View>

      {/* Small Butterfly on the Right Edge */}
      <View style={styles.butterflyContainer}>
        <MaterialCommunityIcons name="butterfly" size={24} color="#8A6BF2" style={{ transform: [{ rotate: '-15deg' }] }} />
      </View>

      {/* Sparkle 1: Top-Right */}
      <View style={styles.sparkleTopRight}>
        <Ionicons name="sparkles" size={18} color="#8A6BF2" />
      </View>

      {/* Sparkle 2: Mid-Left edge */}
      <View style={styles.sparkleMidLeft}>
        <Ionicons name="sparkles" size={15} color="#7C5CE0" />
      </View>

      {/* Sparkle 3: Bottom-Center margin */}
      <View style={styles.sparkleBottomCenter}>
        <Ionicons name="sparkles" size={16} color="#A78BFA" />
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
  },
  ambientBlob: {
    position: 'absolute',
    backgroundColor: 'rgba(228, 224, 250, 0.40)',
    borderRadius: 9999,
  },
  blobTopRight: {
    width: 280,
    height: 280,
    top: -40,
    right: -60,
  },
  blobMidLeft: {
    width: 320,
    height: 320,
    top: '35%',
    left: -110,
    backgroundColor: 'rgba(228, 224, 250, 0.32)',
  },
  blobBottomRight: {
    width: 260,
    height: 260,
    bottom: 50,
    right: -70,
  },
  sprigTopLeft: {
    position: 'absolute',
    top: 24,
    left: 10,
    opacity: 0.35,
  },
  flowerTopLeft: {
    position: 'absolute',
    top: -4,
    left: 20,
  },
  sprigBottomRight: {
    position: 'absolute',
    bottom: 120,
    right: 12,
    opacity: 0.34,
  },
  flowerBottomRight: {
    position: 'absolute',
    bottom: 24,
    right: 22,
  },
  butterflyContainer: {
    position: 'absolute',
    top: 235,
    right: 12,
    opacity: 0.35,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 85,
    right: 56,
    opacity: 0.38,
  },
  sparkleMidLeft: {
    position: 'absolute',
    top: 380,
    left: 18,
    opacity: 0.32,
  },
  sparkleBottomCenter: {
    position: 'absolute',
    bottom: 100,
    left: SCREEN_WIDTH * 0.44,
    opacity: 0.35,
  },
});
