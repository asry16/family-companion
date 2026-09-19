import React from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

export interface PlansSuggestionChipsProps {
  suggestions?: string[];
  onSelectSuggestion: (suggestion: string) => void;
  activeQuery?: string;
}

const DEFAULT_SUGGESTIONS = [
  'Doctor appointment',
  'Electricity bill',
  "Dad's birthday",
];

export const PlansSuggestionChips: React.FC<PlansSuggestionChipsProps> = ({
  suggestions = DEFAULT_SUGGESTIONS,
  onSelectSuggestion,
  activeQuery = '',
}) => {
  const { colors, isDark } = useAppTheme();

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {suggestions.map((item) => {
        const isSelected = activeQuery.toLowerCase().includes(item.toLowerCase());

        return (
          <Pressable
            key={item}
            onPress={() => {
              triggerHaptic();
              onSelectSuggestion(item);
            }}
            style={({ pressed }) => [
              styles.chipPill,
              {
                backgroundColor: isSelected
                  ? isDark
                    ? 'rgba(139, 124, 246, 0.20)'
                    : 'rgba(59, 111, 240, 0.12)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(255, 255, 255, 0.80)',
                borderColor: isSelected
                  ? isDark
                    ? '#8B7CF6'
                    : colors.blue
                  : isDark
                  ? 'rgba(130, 140, 255, 0.22)'
                  : 'rgba(20, 32, 58, 0.08)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name="search-outline"
              size={12}
              color={isSelected ? (isDark ? '#8B7CF6' : colors.blue) : isDark ? colors.textMuted : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? (isDark ? '#8B7CF6' : colors.blue) : colors.text,
                  fontWeight: isSelected ? '700' : '600',
                },
              ]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    gap: 8,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
