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

interface VaultSuggestionChipsProps {
  onSelectSuggestion: (query: string) => void;
  activeQuery?: string;
}

export const VaultSuggestionChips: React.FC<VaultSuggestionChipsProps> = ({
  onSelectSuggestion,
  activeQuery = '',
}) => {
  const { colors, isDark } = useAppTheme();

  const suggestions = [
    "Dad's Passport",
    'Wi-Fi Password',
    "Dadi's Glasses",
    'Car Insurance',
    'Spare Keys',
  ];

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
        const isSelected = activeQuery.toLowerCase() === item.toLowerCase();

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
                    ? 'rgba(59, 111, 240, 0.22)'
                    : 'rgba(59, 111, 240, 0.12)'
                  : isDark
                  ? 'rgba(15, 26, 58, 0.80)'
                  : 'rgba(255, 255, 255, 0.80)',
                borderColor: isSelected
                  ? colors.blue
                  : isDark
                  ? 'rgba(59, 111, 240, 0.22)'
                  : 'rgba(20, 32, 58, 0.08)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name="search-outline"
              size={12}
              color={isSelected ? colors.blue : isDark ? colors.textMuted : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? colors.blue : colors.text,
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
