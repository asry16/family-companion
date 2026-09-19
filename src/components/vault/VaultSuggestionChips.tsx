import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from '@/components/ui';

interface VaultSuggestionChipsProps {
  onSelectSuggestion: (query: string) => void;
  activeQuery?: string;
}

export const VaultSuggestionChips: React.FC<VaultSuggestionChipsProps> = ({
  onSelectSuggestion,
  activeQuery = '',
}) => {
  const suggestions = [
    "Dad's Passport",
    'Wi-Fi Password',
    "Dadi's Glasses",
    'Car Insurance',
    'Spare Keys',
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {suggestions.map((item) => {
        const isSelected = activeQuery.toLowerCase() === item.toLowerCase();

        return (
          <Button
            key={item}
            variant="chip"
            size="sm"
            selected={isSelected}
            icon="search-outline"
            title={item}
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
});
