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
                  colors={isDark ? ['#3B6FF0', '#2563EB'] : ['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.gradientPill,
                    {
                      shadowColor: isDark ? colors.blue : '#6E5ADC',
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
                  backgroundColor: isDark ? 'rgba(15, 26, 58, 0.85)' : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isDark ? 'rgba(59, 111, 240, 0.22)' : 'rgba(124, 92, 224, 0.16)',
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
              borderColor: isDark ? 'rgba(59, 111, 240, 0.50)' : '#7C5CE0',
              backgroundColor: isDark ? 'rgba(59, 111, 240, 0.12)' : 'rgba(124, 92, 224, 0.08)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="add" size={14} color={isDark ? colors.blue : '#7C5CE0'} />
          <Text style={[styles.saveLocationText, { color: isDark ? colors.blue : '#7C5CE0' }]}>
            + Save Location
          </Text>
        </Pressable>

        {/* State Preview Toggle Pill (Populated ⇋ Empty) */}
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            onTogglePreview();
          }}
          style={({ pressed }) => [
            styles.previewTogglePill,
            {
              backgroundColor: isDark ? 'rgba(124, 92, 224, 0.16)' : 'rgba(124, 92, 224, 0.10)',
              borderColor: isDark ? 'rgba(124, 92, 224, 0.35)' : 'rgba(124, 92, 224, 0.22)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons
            name={isPreviewEmpty ? 'folder-open-outline' : 'sparkles-outline'}
            size={12}
            color={isDark ? colors.purple : '#7C5CE0'}
          />
          <Text style={[styles.previewToggleText, { color: isDark ? colors.purple : '#7C5CE0' }]}>
            {isPreviewEmpty ? 'State: Empty' : 'State: Populated'}
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
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  unselectedPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedText: {
    fontSize: 12.5,
    fontWeight: '600',
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
  previewTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
