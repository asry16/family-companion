import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BotanicalSprig = ({ size = 120, color = '#DDD6FE' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Main stem */}
    <Path d="M 12 88 C 26 68 46 38 86 14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    {/* Leaves fanning along stem */}
    <Path d="M 86 14 C 80 8 72 7 66 12 C 60 17 64 25 86 14 Z" fill={color} />
    <Path d="M 68 28 C 55 22 45 25 46 33 C 47 41 58 39 68 28 Z" fill={color} />
    <Path d="M 72 26 C 75 16 85 18 86 26 C 87 34 78 35 72 26 Z" fill={color} />
    <Path d="M 52 44 C 38 38 30 43 32 51 C 34 59 45 56 52 44 Z" fill={color} />
    <Path d="M 56 42 C 63 32 73 35 73 43 C 73 51 63 51 56 42 Z" fill={color} />
    <Path d="M 36 62 C 22 58 16 65 19 72 C 22 79 32 74 36 62 Z" fill={color} />
    <Path d="M 40 60 C 48 52 57 56 56 64 C 55 72 46 70 40 60 Z" fill={color} />
  </Svg>
);

export const LightBackdrop: React.FC = () => {
  const { isDark } = useAppTheme();

  // Strictly hidden in dark mode
  if (isDark) return null;

  return (
    <View style={[styles.backdropContainer, { pointerEvents: 'none' }]}>
      {/* 1. Base Soft Lavender Gradient */}
      <LinearGradient
        colors={['#F8F9FE', '#F4F3FC', '#EEECFA']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Large Blurred Pale-Violet Ambient Blobs */}
      <View style={[styles.ambientBlob, styles.blobTopRight]} />
      <View style={[styles.ambientBlob, styles.blobMidLeft]} />
      <View style={[styles.ambientBlob, styles.blobBottomRight]} />

      {/* 3. Corner Botanical Leaf Sprigs matching reference picture */}
      <View style={styles.sprigTopLeft}>
        <BotanicalSprig size={135} color="#C4B5FD" />
      </View>

      <View style={styles.sprigBottomRight}>
        <BotanicalSprig size={145} color="#C4B5FD" />
      </View>

      {/* Subtle Mid-Left Petal Bloom Watermark */}
      <View style={styles.petalBloomMidLeft} />

      {/* Sparkles */}
      <View style={styles.sparkleTopRight}>
        <Ionicons name="sparkles" size={16} color="#A78BFA" />
      </View>
      <View style={styles.sparkleBottomCenter}>
        <Ionicons name="sparkles" size={14} color="#C4B5FD" />
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
    top: -10,
    left: -10,
    transform: [{ rotate: '-15deg' }],
    opacity: 0.45,
  },
  sprigBottomRight: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    transform: [{ rotate: '165deg' }],
    opacity: 0.45,
  },
  petalBloomMidLeft: {
    position: 'absolute',
    top: '42%',
    left: -60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(221, 214, 254, 0.28)',
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 85,
    right: 56,
    opacity: 0.38,
  },
  sparkleBottomCenter: {
    position: 'absolute',
    bottom: 100,
    left: SCREEN_WIDTH * 0.44,
    opacity: 0.35,
  },
});
