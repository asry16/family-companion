import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StarConfig {
  top: number;
  left?: number;
  right?: number;
  size: number;
  opacity: number;
  color: string;
}

const STARS: StarConfig[] = [
  { top: 60, left: 36, size: 14, opacity: 0.45, color: '#38BDF8' },
  { top: 95, right: 48, size: 18, opacity: 0.55, color: '#A78BFA' },
  { top: 160, left: 110, size: 10, opacity: 0.35, color: '#FFFFFF' },
  { top: 210, right: 85, size: 12, opacity: 0.40, color: '#60A5FA' },
  { top: 290, left: 45, size: 16, opacity: 0.50, color: '#C084FC' },
  { top: 380, right: 35, size: 13, opacity: 0.35, color: '#38BDF8' },
  { top: 480, left: 80, size: 11, opacity: 0.30, color: '#FFFFFF' },
  { top: 560, right: 90, size: 15, opacity: 0.45, color: '#A78BFA' },
  { top: 640, left: 55, size: 14, opacity: 0.40, color: '#60A5FA' },
  { top: 720, right: 50, size: 16, opacity: 0.50, color: '#38BDF8' },
];

import { DarkBackdrop } from './DarkBackdrop';

export const DarkStarsBackdrop: React.FC = () => {
  return <DarkBackdrop />;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  nebulaBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  nebulaTopRight: {
    top: -60,
    right: -80,
    width: 280,
    height: 280,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  nebulaMidLeft: {
    top: '35%',
    left: -100,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(124, 92, 224, 0.09)',
  },
  nebulaBottomRight: {
    bottom: -80,
    right: -60,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(79, 142, 247, 0.07)',
  },
  starWrap: {
    position: 'absolute',
  },
});
