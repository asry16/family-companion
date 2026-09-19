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
import { Button } from '@/components/ui';

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
      contentContainerStyle={[styles.container, { gap: 8 }]}>
      {suggestions.map((item) => {
        const isSelected = activeQuery.toLowerCase().includes(item.toLowerCase());

        return (
          <Button
            key={item}
            variant="chip"
            size="sm"
            icon="search-outline"
            title={item}
            selected={isSelected}
            onPress={() => onSelectSuggestion(item)}
          />
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
