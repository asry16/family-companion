import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { TabBarTokens } from '@/constants/theme';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { MemoryItem } from '@/types';
import { LightBackdrop, DarkBackdrop } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';

// Vault Components
import { VaultHeader } from '@/components/vault/VaultHeader';
import { VaultSearchBar } from '@/components/vault/VaultSearchBar';
import { VaultSuggestionChips } from '@/components/vault/VaultSuggestionChips';
import { VaultCategoryFilters } from '@/components/vault/VaultCategoryFilters';
import { VaultEmptyStateCard } from '@/components/vault/VaultEmptyStateCard';
import { VaultItemCard } from '@/components/vault/VaultItemCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function MemoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, user } = useAuth();
  const { memories, searchMemories, addMemory, deleteMemory, activeUser } = useFamily();
  const { startListening, speak } = useVoice();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Add Location Modal State
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<'documents' | 'household' | 'health'>('household');
  const [selectedDetailItem, setSelectedDetailItem] = useState<MemoryItem | null>(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState<MemoryItem | null>(null);

  // Use live memories if available
  const baseMemories = memories || [];

  // Filter items by category and query
  const filteredMemories = baseMemories.filter((m) => {
    const matchesCategory =
      selectedCategory === 'all' || m.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      m.title.toLowerCase().includes(query) ||
      m.savedLocation.toLowerCase().includes(query) ||
      m.notes.toLowerCase().includes(query) ||
      m.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const handleVoiceSearch = () => {
    startListening((recognized) => {
      if (recognized) {
        setSearchQuery(recognized);
        speak(`Searching vault for ${recognized}`);
      }
    });
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
      category: newCategory,
      savedLocation: newLocation.trim(),
      lastVerified: 'Just now',
      notes: `Saved by ${activeUser?.name || user?.name || 'You'} to family vault`,
      tags: ['saved', newCategory],
      relatedMemberIds: [activeUser?.id || 'self'],
      emoji: newCategory === 'documents' ? '📄' : newCategory === 'health' ? '🩺' : '📦',
    });

    speak(`Saved ${newTitle} to Family Hub.`);
    setNewTitle('');
    setNewLocation('');
    setAddModalVisible(false);
  };

  if (!isAuthenticated) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Ambient Backdrops (Light / Dark) */}
      <LightBackdrop />
      <DarkBackdrop />

      {/* 1. Vault Header */}
      <VaultHeader
        onOpenSettings={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'vault' } })}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TabBarTokens.getScrollBottomPadding(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Search Bar: Rounded Glass Field, Placeholder, Blue Mic Voice Button */}
        <VaultSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={() => {}}
          onVoicePress={handleVoiceSearch}
        />

        {/* 3. Suggestion Chips: Single Horizontally Scrollable Row */}
        <VaultSuggestionChips
          activeQuery={searchQuery}
          onSelectSuggestion={(term) => setSearchQuery(term)}
        />

        {/* 4. Category Filter Chips: "All Saved", "Documents", "Household", "+ Save Location" */}
        <VaultCategoryFilters
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSaveLocationPress={() => setAddModalVisible(true)}
        />

        {/* 5. Section Header for Saved Details */}
        <SectionHeader
          title="Saved Family Details"
          categoryTag="VAULT"
          actionText={filteredMemories.length > 0 ? `${filteredMemories.length} item${filteredMemories.length === 1 ? '' : 's'}` : undefined}
        />

        {/* 7. Empty State Card / Populated State Items List */}
        {filteredMemories.length === 0 ? (
          /* Search yielded no matches or empty vault */
          <VaultEmptyStateCard
            title={searchQuery ? `No matches for "${searchQuery}"` : 'No Saved Memories'}
            body={
              searchQuery
                ? 'Try searching for passports, Wi-Fi password, car keys, or medical papers.'
                : 'Start by cataloging physical drawers, important documents, or home supplies.'
            }
            badgeLabel={searchQuery ? 'SEARCH' : 'VAULT READY'}
            buttonLabel={searchQuery ? 'Clear Search' : 'Save First Location'}
            isSearchEmpty={Boolean(searchQuery)}
            onSaveFirstLocation={() => {
              if (searchQuery) {
                setSearchQuery('');
              } else {
                setAddModalVisible(true);
              }
            }}
          />
        ) : (
          /* Populated State List of Item Cards */
          <View style={styles.itemsListContainer}>
            {filteredMemories.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                onPress={() => setSelectedDetailItem(item)}
                onDelete={() => setDeleteTargetItem(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Save Location Custom Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAddModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.95)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(20, 32, 58, 0.12)',
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="folder" size={20} color={isDark ? colors.brandAccent : colors.blue} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Save New Location
                </Text>
              </View>
              <Pressable
                onPress={() => setAddModalVisible(false)}
                hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Catalog physical drawers, documents, or household items so your circle can find them instantly.
            </Text>

            {/* Input: Item Name */}
            <View style={styles.inputStack}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Item Name</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Dad's Passport, Extra Car Keys, Wi-Fi"
                placeholderTextColor={isDark ? colors.textMuted : '#94A3B8'}
                style={[
                  styles.formInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : '#E2E8F0',
                  },
                ]}
              />
            </View>

            {/* Input: Physical Location */}
            <View style={styles.inputStack}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Physical Location</Text>
              <TextInput
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="e.g. Master Bedroom > Top left drawer"
                placeholderTextColor={isDark ? colors.textMuted : '#94A3B8'}
                style={[
                  styles.formInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : '#E2E8F0',
                  },
                ]}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputStack}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
              <View style={styles.categorySelectRow}>
                {(['documents', 'household', 'health'] as const).map((cat) => {
                  const isSel = newCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setNewCategory(cat)}
                      style={[
                        styles.catSelectBtn,
                        {
                          backgroundColor: isSel
                            ? colors.brandAccent
                            : isDark
                            ? 'rgba(255, 255, 255, 0.03)'
                            : '#F1F5F9',
                          borderColor: isSel
                            ? colors.brandAccent
                            : isDark
                            ? 'rgba(130, 140, 255, 0.22)'
                            : '#E2E8F0',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.catSelectText,
                          {
                            color: isSel ? '#FFFFFF' : colors.text,
                            fontWeight: isSel ? '800' : '600',
                          },
                        ]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSaveMemory}
              disabled={!newTitle.trim() || !newLocation.trim()}
              style={({ pressed }) => [
                styles.saveSubmitBtn,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: !newTitle.trim() || !newLocation.trim() ? 0.45 : pressed ? 0.88 : 1,
                },
              ]}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={[styles.saveSubmitBtnText, { color: '#FFFFFF' }]}>
                Save to Family Vault
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Item Details Custom Modal with Delete Action */}
      {selectedDetailItem && (
        <Modal
          visible={Boolean(selectedDetailItem)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDetailItem(null)}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedDetailItem(null)}>
            <Pressable
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.96)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                },
              ]}
              onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <Text style={{ fontSize: 20 }}>{selectedDetailItem.emoji || '📌'}</Text>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedDetailItem.title}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedDetailItem(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.detailInfoBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
                  <Text style={[styles.detailRowText, { color: colors.text }]}>
                    {selectedDetailItem.savedLocation}
                  </Text>
                </View>

                {selectedDetailItem.notes ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                    <Text style={[styles.detailRowText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                      {selectedDetailItem.notes}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.detailRowText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Last verified: {selectedDetailItem.lastVerified}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Delete and Done */}
              <View style={styles.detailActionsRow}>
                <Pressable
                  onPress={() => {
                    const toDelete = selectedDetailItem;
                    setSelectedDetailItem(null);
                    setDeleteTargetItem(toDelete);
                  }}
                  style={[
                    styles.detailDeleteBtn,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.20)',
                    },
                  ]}>
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  <Text style={styles.detailDeleteBtnText}>Delete</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedDetailItem(null)}
                  style={[styles.detailDoneBtn, { backgroundColor: colors.brandAccent }]}>
                  <Text style={styles.detailDoneBtnText}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Delete Item Confirmation Modal */}
      <ConfirmationModal
        visible={Boolean(deleteTargetItem)}
        title="Delete Saved Detail?"
        description={`Are you sure you want to delete "${deleteTargetItem?.title}" from your family vault? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        iconName="trash-outline"
        variant="red"
        onConfirm={() => {
          if (deleteTargetItem) {
            deleteMemory(deleteTargetItem.id);
            setDeleteTargetItem(null);
          }
        }}
        onCancel={() => setDeleteTargetItem(null)}
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
    paddingTop: 4,
    paddingBottom: 110,
    gap: 8,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  itemsListContainer: {
    gap: 4,
  },
  floatingNavSpacer: {
    height: Platform.select({ ios: 36, default: 24 }),
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  inputStack: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  formInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  categorySelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catSelectText: {
    fontSize: 12,
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 6,
  },
  saveSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  detailInfoBox: {
    gap: 10,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRowText: {
    fontSize: 13.5,
    fontWeight: '500',
    flex: 1,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  detailDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailDeleteBtnText: {
    color: '#EF4444',
    fontSize: 13.5,
    fontWeight: '700',
  },
  detailDoneBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  detailDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
