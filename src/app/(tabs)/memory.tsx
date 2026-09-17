import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { Header } from '@/components/ui/Header';
import { MemoryCard } from '@/components/cards/MemoryCard';
import { MemoryCategory } from '@/types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MemoryScreen() {
  const { colors, isElderly } = useAppTheme();
  const { memories, searchMemories, addMemory } = useFamily();
  const { startListening, speak } = useVoice();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);

  // New Memory Form State
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filteredMemories = searchMemories(searchQuery).filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  const handleVoiceSearch = () => {
    startListening((recognized) => {
      if (recognized) {
        setSearchQuery(recognized);
        speak(`Searching memories for ${recognized}`);
      }
    });
  };

  const handleQuickChip = (term: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setSearchQuery(term);
  };

  const handleSaveMemory = () => {
    if (!newTitle.trim() || !newLocation.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    addMemory({
      title: newTitle.trim(),
      category: 'household',
      savedLocation: newLocation.trim(),
      lastVerified: 'Just now',
      notes: newNotes.trim() || 'Saved to family vault',
      tags: ['saved', 'location'],
      relatedMemberIds: ['member_ritu'],
      emoji: '📦',
    });

    speak(`Saved ${newTitle} to Family Memory.`);
    setNewTitle('');
    setNewLocation('');
    setNewNotes('');
    setAddModalVisible(false);
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Saved' },
    { id: 'documents', label: 'Documents' },
    { id: 'household', label: 'Household' },
    { id: 'health', label: 'Health' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title="Family Memory" subtitle="Searchable physical locations & knowledge" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Natural Language Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}>
          <Ionicons name="search" size={20} color={colors.brandAccent} />
          <TextInput
            placeholder="Ask e.g. 'Where is Dad's passport?' or 'Wi-Fi'"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              {
                color: colors.text,
                fontSize: isElderly ? 18 : 14,
              },
            ]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : (
            <Pressable onPress={handleVoiceSearch} hitSlop={8}>
              <Ionicons name="mic" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Quick Suggested Search Queries */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestedChipsRow}>
          {['Dad\'s Passport', 'Wi-Fi Password', 'Dadi\'s Glasses', 'Car Insurance', 'Spare Keys'].map((chip) => (
            <Pressable
              key={chip}
              onPress={() => handleQuickChip(chip)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Text style={{ fontSize: 13 }}>🔍</Text>
              <Text
                style={[
                  styles.chipText,
                  { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
                ]}>
                {chip}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Categories Pills & Add Button */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={({ pressed }) => [
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected ? colors.brand : colors.cardBackground,
                      borderColor: isSelected ? colors.brand : colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textSecondary,
                        fontSize: isElderly ? 15 : 12,
                      },
                    ]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => setAddModalVisible(true)}
            style={({ pressed }) => [
              styles.addMemoryButton,
              {
                backgroundColor: colors.brand,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addMemoryText}>Save Location</Text>
          </Pressable>
        </View>

        {/* Memory Items List */}
        <View style={styles.memoriesList}>
          {filteredMemories.length > 0 ? (
            filteredMemories.map((mem) => (
              <MemoryCard key={mem.id} memory={mem} />
            ))
          ) : (
            <EmptyState
              icon={searchQuery ? 'search-outline' : 'folder-open-outline'}
              badge={searchQuery ? 'Search Query' : 'Vault Ready'}
              title={searchQuery ? `No results for "${searchQuery}"` : 'No Saved Memories'}
              description={
                searchQuery
                  ? 'Try searching for passports, Wi-Fi password, car keys, or medical documents.'
                  : 'Start by cataloging physical drawers, important documents, or home supplies.'
              }
              actionLabel={searchQuery ? 'Clear Search' : 'Save First Location'}
              onAction={
                searchQuery
                  ? () => setSearchQuery('')
                  : () => setAddModalVisible(true)
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Quick Add Memory Modal */}
      <ConfirmationModal
        visible={addModalVisible}
        title="Save New Location or Memory"
        description="Record physical cupboard, drawer, or household info so any family member can find it instantly."
        confirmLabel="Save to Family Memory"
        onConfirm={handleSaveMemory}
        onCancel={() => setAddModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontWeight: '500',
  },
  suggestedChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  chipText: {
    fontWeight: '600',
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  categoryPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontWeight: '700',
  },
  addMemoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  addMemoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  memoriesList: {
    gap: 4,
  },
  emptyBox: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
