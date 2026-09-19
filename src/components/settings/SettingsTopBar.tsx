import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

export interface SettingsTopBarProps {
  title?: string;
  familyName?: string;
  memberCount?: number;
  onBack?: () => void;
}

export const SettingsTopBar: React.FC<SettingsTopBarProps> = ({
  title = 'Family Settings',
  familyName = 'The A Family',
  memberCount = 1,
  onBack,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleBack = () => {
    triggerHaptic();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const memberLabel = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 4, Platform.OS === 'ios' ? 12 : 8),
        },
      ]}>
      {/* Light Mode Faint Sparkles / Accents */}
      {!isDark && (
        <View style={styles.sparkleWrap} pointerEvents="none">
          <Ionicons
            name="sparkles"
            size={12}
            color="rgba(124, 92, 224, 0.28)"
            style={styles.sparkleLeft}
          />
          <Ionicons
            name="sparkles"
            size={10}
            color="rgba(79, 142, 247, 0.28)"
            style={styles.sparkleRight}
          />
        </View>
      )}

      <View style={styles.barRow}>
        {/* Left: Back Arrow Button */}
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.72)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(124, 92, 224, 0.15)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        {/* Center: Title & Subtitle */}
        <View style={styles.titleColumn}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text
            style={[
              styles.screenSubtitle,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            {familyName} • {memberLabel}
          </Text>
        </View>

        {/* Right Spacer for optical centering */}
        <View style={styles.rightSpacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    position: 'relative',
  },
  sparkleWrap: {
    ...StyleSheet.absoluteFill,
  },
  sparkleLeft: {
    position: 'absolute',
    top: 20,
    left: 45,
  },
  sparkleRight: {
    position: 'absolute',
    top: 15,
    right: 50,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightSpacer: {
    width: 38,
    height: 38,
  },
});
