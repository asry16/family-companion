import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui';

interface VaultCategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSaveLocationPress: () => void;
  isPreviewEmpty: boolean;
  onTogglePreview: () => void;
}

export const VaultCategoryFilters: React.FC<VaultCategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  onSaveLocationPress,
  isPreviewEmpty,
  onTogglePreview,
}) => {
  const { colors, isDark } = useAppTheme();

  const categories = [
    { id: 'all', label: 'All Saved' },
    { id: 'documents', label: 'Documents' },
    { id: 'household', label: 'Household' },
  ];

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };
  const previewMode = isPreviewEmpty ? 'empty' : 'populated';

  return (
    <View style={styles.outerWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, { gap: 8 }]}>
        {/* Category Filter Pills (chips) */}
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant="chip"
            size="sm"
            title={cat.label}
            selected={selectedCategory === cat.id}
            onPress={() => onSelectCategory(cat.id)}
          />
        ))}

        {/* "+ Save Location" Button (secondary) */}
        <Button
          variant="secondary"
          size="sm"
          icon="add"
          title="Save Location"
          onPress={onSaveLocationPress}
        />

        {/* State Preview Toggle Pill */}
        <Button
          variant="secondary"
          size="sm"
          icon="swap-horizontal"
          title={previewMode === 'populated' ? 'Empty Preview' : 'Populated'}
          onPress={onTogglePreview}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    paddingVertical: 4,
  },
  container: {
    paddingHorizontal: 18,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
