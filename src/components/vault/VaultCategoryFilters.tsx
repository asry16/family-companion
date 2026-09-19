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

interface VaultCategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSaveLocationPress: () => void;
}

export const VaultCategoryFilters: React.FC<VaultCategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  onSaveLocationPress,
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

  return (
    <View style={styles.outerWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        {/* Category Filter Pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          if (isSelected) {
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  triggerHaptic();
                  onSelectCategory(cat.id);
                }}
                style={styles.selectedGradientWrap}>
                <LinearGradient
                  colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.gradientPill,
                    {
                      shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.selectedText,
                      { color: '#FFFFFF' },
                    ]}>
                    {cat.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                triggerHaptic();
                onSelectCategory(cat.id);
              }}
              style={({ pressed }) => [
                styles.unselectedPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Text style={[styles.unselectedText, { color: colors.text }]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}

        {/* Outlined "+ Save Location" Chip */}
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            onSaveLocationPress();
          }}
          style={({ pressed }) => [
            styles.saveLocationPill,
            {
              borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : '#7C5CE0',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(124, 92, 224, 0.08)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="add" size={14} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
          <Text style={[styles.saveLocationText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>
            + Save Location
          </Text>
        </Pressable>
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
  selectedGradientWrap: {
    borderRadius: 16,
  },
  gradientPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  unselectedPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  unselectedText: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  saveLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  saveLocationText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
