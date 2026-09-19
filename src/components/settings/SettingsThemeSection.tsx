import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme, ThemePreference } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';

export interface SettingsThemeSectionProps {
  onPreferenceChange?: (pref: ThemePreference) => void;
}

interface ThemeOption {
  key: ThemePreference;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'light',
    title: 'Light',
    subtitle: 'Crisp & bright',
    icon: 'sunny',
  },
  {
    key: 'dark',
    title: 'Dark',
    subtitle: 'Deep contrast',
    icon: 'moon',
  },
  {
    key: 'system',
    title: 'Mobile Default',
    subtitle: 'Follows device',
    icon: 'phone-portrait-outline',
  },
];

export const SettingsThemeSection: React.FC<SettingsThemeSectionProps> = ({
  onPreferenceChange,
}) => {
  const { colors, isDark, themePreference, setThemePreference } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleSelect = (pref: ThemePreference) => {
    if (pref === themePreference) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setThemePreference(pref);
    onPreferenceChange?.(pref);
  };

  return (
    <View style={styles.sectionWrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons
          name="color-palette-outline"
          size={16}
          color={isDark ? '#38BDF8' : '#6D5BD0'}
        />
        <Text
          style={[
            styles.sectionHeaderText,
            { color: isDark ? colors.textMuted : '#6D5BD0' },
          ]}>
          APPEARANCE & THEME MODE
        </Text>
      </View>

      {/* Theme Cards Glass Card */}
      <GlassCard
        borderRadius={24}
        glowColor={isDark ? colors.blue : undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>
        {/* Row of 3 Mode Options */}
        <View style={styles.optionsRow}>
          {THEME_OPTIONS.map((opt) => {
            const isSelected = themePreference === opt.key;

            return (
              <Pressable
                key={opt.key}
                onPress={() => handleSelect(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${opt.title} mode`}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(59, 111, 240, 0.22)'
                        : 'rgba(124, 92, 224, 0.10)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(255, 255, 255, 0.55)',
                    borderColor: isSelected
                      ? isDark
                        ? '#38BDF8'
                        : '#7C5CE0'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.10)'
                      : 'rgba(124, 92, 224, 0.12)',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                {/* Active Checkmark Pill in corner */}
                {isSelected && (
                  <View
                    style={[
                      styles.selectedBadge,
                      { backgroundColor: isDark ? '#38BDF8' : '#7C5CE0' },
                    ]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}

                {/* Mode Icon */}
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(56, 189, 248, 0.25)'
                          : 'rgba(124, 92, 224, 0.16)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(124, 92, 224, 0.06)',
                    },
                  ]}>
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={
                      isSelected
                        ? isDark
                          ? '#38BDF8'
                          : '#7C5CE0'
                        : isDark
                        ? colors.textMuted
                        : colors.textSecondary
                    }
                  />
                </View>

                {/* Title */}
                <Text
                  style={[
                    styles.optionTitle,
                    {
                      color: isSelected ? colors.text : colors.textSecondary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                  numberOfLines={1}>
                  {opt.title}
                </Text>

                {/* Subtitle */}
                <Text
                  style={[
                    styles.optionSubtitle,
                    { color: isDark ? colors.textMuted : colors.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {opt.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Informational Subtext */}
        <View style={styles.footerNoteRow}>
          <Ionicons
            name="information-circle-outline"
            size={13}
            color={isDark ? colors.textMuted : colors.textSecondary}
          />
          <Text
            style={[
              styles.footerNoteText,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            Adapts smoothly across your phone with calibrated glassmorphism.
          </Text>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginHorizontal: 18,
    marginVertical: 6,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardContainer: {
    padding: 0,
  },
  cardContent: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  optionCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
    gap: 6,
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  optionTitle: {
    fontSize: 12.5,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  footerNoteText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
