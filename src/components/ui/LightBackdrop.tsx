import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      {/* Top-Right Soft Ambient Blob */}
      <View style={[styles.ambientBlob, styles.blobTopRight]} />
      {/* Mid-Left Soft Ambient Blob */}
      <View style={[styles.ambientBlob, styles.blobMidLeft]} />
      {/* Bottom-Right Soft Ambient Blob */}
      <View style={[styles.ambientBlob, styles.blobBottomRight]} />

      {/* 3. Decorative Botanical Sprigs, Butterfly, and 4-Point Sparkles (30-40% Opacity) */}
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}>
        
        {/* Top-Left Lavender Botanical Sprig */}
        <G opacity={0.36} transform="translate(4, 18)">
          {/* Main Stem */}
          <Path
            d="M 12 10 Q 38 45 42 110"
            stroke="#8A6BF2"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Leaflets */}
          <Path
            d="M 16 26 Q 30 20 28 32 Q 22 34 16 26 Z"
            fill="#A78BFA"
          />
          <Path
            d="M 22 46 Q 38 40 34 52 Q 28 54 22 46 Z"
            fill="#8A6BF2"
          />
          <Path
            d="M 28 68 Q 44 64 40 76 Q 34 78 28 68 Z"
            fill="#A78BFA"
          />
          <Path
            d="M 36 90 Q 52 86 48 98 Q 42 100 36 90 Z"
            fill="#8A6BF2"
          />
          {/* Little lavender buds */}
          <Circle cx="13" cy="11" r="2.4" fill="#7C5CE0" />
          <Circle cx="29" cy="28" r="2" fill="#8A6BF2" />
          <Circle cx="35" cy="48" r="2" fill="#7C5CE0" />
        </G>

        {/* Bottom-Right Lavender Botanical Sprig */}
        <G
          opacity={0.34}
          transform={`translate(${SCREEN_WIDTH - 65}, ${SCREEN_HEIGHT - 170})`}>
          {/* Main Stem curved upward */}
          <Path
            d="M 45 130 Q 15 75 22 10"
            stroke="#8A6BF2"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Leaflets */}
          <Path
            d="M 38 105 Q 18 100 24 90 Q 32 92 38 105 Z"
            fill="#A78BFA"
          />
          <Path
            d="M 30 80 Q 10 76 16 66 Q 24 68 30 80 Z"
            fill="#8A6BF2"
          />
          <Path
            d="M 24 55 Q 6 50 12 40 Q 20 42 24 55 Z"
            fill="#A78BFA"
          />
          {/* Little lavender buds */}
          <Circle cx="22" cy="10" r="2.5" fill="#7C5CE0" />
          <Circle cx="14" cy="42" r="2" fill="#8A6BF2" />
        </G>

        {/* Small Butterfly on the Right Edge (around y: 240) */}
        <G
          opacity={0.35}
          transform={`translate(${SCREEN_WIDTH - 36}, 245) scale(0.9)`}>
          {/* Upper Wings */}
          <Path
            d="M 12 14 C 4 2 20 -4 28 6 C 26 12 18 14 12 14 Z"
            fill="#8A6BF2"
          />
          <Path
            d="M 12 14 C 18 6 32 4 30 18 C 24 20 18 18 12 14 Z"
            fill="#A78BFA"
          />
          {/* Lower Wings */}
          <Path
            d="M 12 14 C 6 22 16 28 22 22 C 20 16 16 14 12 14 Z"
            fill="#C4B5FD"
          />
          {/* Body */}
          <Path
            d="M 10 10 Q 12 16 11 22"
            stroke="#6D5BD0"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </G>

        {/* Tiny Four-Point Sparkle 1 (Top-Right) */}
        <G opacity={0.38} transform={`translate(${SCREEN_WIDTH - 68}, 85)`}>
          <Path
            d="M 8 0 Q 8 8 16 8 Q 8 8 8 16 Q 8 8 0 8 Q 8 8 8 0 Z"
            fill="#8A6BF2"
          />
        </G>

        {/* Tiny Four-Point Sparkle 2 (Mid-Left edge) */}
        <G opacity={0.32} transform="translate(18, 380)">
          <Path
            d="M 6 0 Q 6 6 12 6 Q 6 6 6 12 Q 6 6 0 6 Q 6 6 6 0 Z"
            fill="#7C5CE0"
          />
        </G>

        {/* Tiny Four-Point Sparkle 3 (Bottom-Center margin) */}
        <G opacity={0.35} transform={`translate(${SCREEN_WIDTH * 0.45}, ${SCREEN_HEIGHT - 110})`}>
          <Path
            d="M 6 0 Q 6 6 12 6 Q 6 6 6 12 Q 6 6 0 6 Q 6 6 6 0 Z"
            fill="#A78BFA"
          />
        </G>
      </Svg>
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
});
