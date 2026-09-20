import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

interface VaultCategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSaveLocationPress: () => void;
}

const CATEGORIES = [
  { id: 'all',       label: 'All Saved' },
  { id: 'documents', label: 'Documents' },
  { id: 'household', label: 'Household' },
];

export const VaultCategoryFilters: React.FC<VaultCategoryFiltersProps> = ({
  selectedCategory, onSelectCategory, onSaveLocationPress,
}) => {
  const { colors, isDark } = useAppTheme();

  const tap = () => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {} }
  };

  const unselBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,91,208,0.07)';
  const unselBorder = isDark ? 'rgba(140,150,255,0.20)' : 'rgba(109,91,208,0.18)';

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>

        {CATEGORIES.map((cat) => {
          const sel = selectedCategory === cat.id;
          if (sel) {
            return (
              <Pressable key={cat.id} onPress={() => { tap(); onSelectCategory(cat.id); }}>
                <LinearGradient
                  colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.selPill}>
                  <Text style={styles.selText}>{cat.label}</Text>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={cat.id}
              onPress={() => { tap(); onSelectCategory(cat.id); }}
              style={({ pressed }) => [
                styles.unselPill,
                { backgroundColor: unselBg, borderColor: unselBorder, opacity: pressed ? 0.75 : 1 },
              ]}>
              <Text style={[styles.unselText, { color: colors.text }]}>{cat.label}</Text>
            </Pressable>
          );
        })}

        {/* + Save Location pill */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {} }
            onSaveLocationPress();
          }}
          style={({ pressed }) => [
            styles.savePill,
            {
              borderColor: isDark ? 'rgba(139,124,246,0.45)' : 'rgba(124, 92, 224, 0.28)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="add" size={14} color={isDark ? '#8B7CF6' : '#6D5BD0'} />
          <Text style={[styles.saveTxt, { color: isDark ? '#8B7CF6' : '#6D5BD0' }]}>
            Save Location
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingVertical: 2 },
  row: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  selPill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 9999,
    shadowColor: '#8A6BF2', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30, shadowRadius: 4, elevation: 3,
  },
  selText: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  unselPill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 9999, borderWidth: 1,
  },
  unselText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  savePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 9999, borderWidth: 1.2,
  },
  saveTxt: { fontSize: 13, fontWeight: '700' },
});
