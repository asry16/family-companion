import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

interface VaultEmptyStateCardProps {
  onSaveFirstLocation: () => void;
  title?: string;
  body?: string;
  badgeLabel?: string;
  buttonLabel?: string;
  isSearchEmpty?: boolean;
}

// Illustrated stacked folder component
const FolderIllustration: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  // Folder colors for light and dark modes - matching reference
  const back  = isDark ? { bg: '#1E2063', tab: '#252870', border: 'rgba(99,102,241,0.30)' }
                       : { bg: '#C7CAF5', tab: '#D2D5F8', border: 'rgba(99,102,241,0.25)' };
  const mid   = isDark ? { bg: '#2A2D7A', tab: '#323594', border: 'rgba(99,102,241,0.35)' }
                       : { bg: '#A5A9ED', tab: '#B4B8F2', border: 'rgba(99,102,241,0.30)' };
  const front = isDark
    ? ['#4F46E5', '#6366F1'] as const
    : ['#6366F1', '#8B5CF6'] as const;

  const sparkleColor = isDark ? '#818CF8' : '#6366F1';

  return (
    <View style={folderStyles.outerContainer}>
      {/* Decorative leaf — left */}
      <View style={[folderStyles.leaf, folderStyles.leafLeft]}>
        <Ionicons name="leaf" size={52} color={isDark ? '#1A1D54' : '#C7CAF5'} style={{ transform: [{ rotate: '-30deg' }] }} />
        <Ionicons name="leaf" size={36} color={isDark ? '#1C1F5C' : '#D2D5F8'} style={{ transform: [{ rotate: '-60deg' }, { translateX: 8 }] }} />
      </View>

      {/* Decorative leaf — right */}
      <View style={[folderStyles.leaf, folderStyles.leafRight]}>
        <Ionicons name="leaf" size={52} color={isDark ? '#1A1D54' : '#C7CAF5'} style={{ transform: [{ rotate: '30deg' }] }} />
        <Ionicons name="leaf" size={36} color={isDark ? '#1C1F5C' : '#D2D5F8'} style={{ transform: [{ rotate: '60deg' }, { translateX: -8 }] }} />
      </View>

      {/* Floating illustrated folder cluster */}
      <Animated.View style={[folderStyles.cluster, { transform: [{ translateY }] }]}>
        {/* Sparkle decorations */}
        <Text style={[folderStyles.spark, folderStyles.sparkTL, { color: sparkleColor }]}>✦</Text>
        <Text style={[folderStyles.spark, folderStyles.sparkTR, { color: sparkleColor, opacity: 0.6 }]}>✧</Text>
        <Text style={[folderStyles.spark, folderStyles.sparkBL, { color: sparkleColor, opacity: 0.5 }]}>✦</Text>
        <Text style={[folderStyles.spark, folderStyles.sparkBR, { color: sparkleColor, opacity: 0.7 }]}>✧</Text>

        {/* Back folder */}
        <View style={[folderStyles.folderWrap, { left: 0, bottom: 0, zIndex: 1 }]}>
          <View style={[folderStyles.folderTab, { backgroundColor: back.tab, borderColor: back.border }]} />
          <View style={[folderStyles.folderBody, { backgroundColor: back.bg, borderColor: back.border }]} />
        </View>

        {/* Middle folder */}
        <View style={[folderStyles.folderWrap, { left: 12, bottom: 8, zIndex: 2 }]}>
          <View style={[folderStyles.folderTab, { backgroundColor: mid.tab, borderColor: mid.border }]} />
          <View style={[folderStyles.folderBody, { backgroundColor: mid.bg, borderColor: mid.border }]} />
        </View>

        {/* Front folder with shield */}
        <View style={[folderStyles.folderWrap, { left: 24, bottom: 16, zIndex: 3 }]}>
          {/* Tab */}
          <LinearGradient
            colors={front}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[folderStyles.folderTab, folderStyles.frontTab]} />
          {/* Body */}
          <LinearGradient
            colors={front}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[folderStyles.folderBody, folderStyles.frontBody]}>
            {/* Shield icon */}
            <View style={folderStyles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={26} color="rgba(255,255,255,0.92)" />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
};

export const VaultEmptyStateCard: React.FC<VaultEmptyStateCardProps> = ({
  onSaveFirstLocation,
  title = 'No Saved Memories',
  body = 'Start by cataloging physical drawers, important documents, or home supplies.',
  badgeLabel = 'VAULT READY',
  buttonLabel = 'Save First Location',
  isSearchEmpty = false,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const tap = () => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {} }
    onSaveFirstLocation();
  };

  return (
    <View style={styles.outerWrap}>
      {/* Folder Illustration */}
      <FolderIllustration isDark={isDark} />

      {/* Title */}
      <Text style={[styles.title, { color: colors.text, fontSize: isElderly ? 22 : 19 }]}>
        {title}
      </Text>

      {/* Body */}
      <Text style={[styles.body, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
        {body}
      </Text>

      {/* Full-width gradient button */}
      <Pressable
        onPress={tap}
        style={({ pressed }) => [styles.btnWrap, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <LinearGradient
          colors={isDark ? ['#4F46E5', '#7C3AED'] : ['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.btnInner}>
          <Ionicons name={isSearchEmpty ? 'refresh' : 'folder'} size={17} color="#FFF" />
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

// Folder illustration styles
const folderStyles = StyleSheet.create({
  outerContainer: {
    width: '100%', height: 180,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginBottom: 4,
  },
  leaf: { position: 'absolute', bottom: 0 },
  leafLeft: { left: 0, alignItems: 'flex-start' },
  leafRight: { right: 0, alignItems: 'flex-end' },
  cluster: {
    width: 200, height: 150,
    position: 'relative',
  },
  // Sparkles
  spark: { position: 'absolute', fontSize: 14, fontWeight: '900' },
  sparkTL: { top: 10, left: 18 },
  sparkTR: { top: 8, right: 30, fontSize: 11 },
  sparkBL: { bottom: 25, left: 30, fontSize: 11 },
  sparkBR: { bottom: 35, right: 20, fontSize: 16 },
  // Folder pieces
  folderWrap: { position: 'absolute' },
  folderTab: {
    width: 50, height: 14,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    marginBottom: -1,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  folderBody: {
    width: 130, height: 92,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frontTab: { borderWidth: 0, width: 52, height: 15 },
  frontBody: {
    width: 134, height: 96, borderRadius: 13, borderWidth: 0,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40, shadowRadius: 16, elevation: 8,
  },
  shieldWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  outerWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 10,
    marginHorizontal: 16,
  },
  title: { fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  body: { fontSize: 13.5, fontWeight: '500', lineHeight: 20, textAlign: 'center', maxWidth: 300 },
  btnWrap: { width: '100%', borderRadius: 28, marginTop: 6 },
  btnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 28,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: -0.1 },
});
