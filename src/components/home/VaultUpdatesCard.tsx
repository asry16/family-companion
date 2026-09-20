import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip, StatusChipVariant } from '@/components/ui/StatusChip';
import { MemoryItem } from '@/types';

export const VaultUpdatesCard: React.FC = () => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();
  const { memories, addMemory, activeUser } = useFamily();
  const { user } = useAuth();

  // Quick log modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<'documents' | 'household' | 'health'>('household');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleSaveUpdate = () => {
    if (!title.trim() || !location.trim()) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    addMemory({
      title: title.trim(),
      category,
      savedLocation: location.trim(),
      lastVerified: 'Just now',
      notes: `Updated by ${activeUser?.name || user?.name || 'You'} from Home`,
      tags: ['update', category],
      relatedMemberIds: [activeUser?.id || 'self'],
      emoji: category === 'documents' ? '📄' : category === 'health' ? '🩺' : '📦',
    });

    setTitle('');
    setLocation('');
    setModalVisible(false);
  };

  // Resolve category configuration for items
  const getCategoryConfig = (itemCategory: string) => {
    switch (itemCategory) {
      case 'documents':
        return {
          icon: 'document-text' as const,
          color: isDark ? '#60A5FA' : '#3B82F6',
          bg: isDark ? 'rgba(59, 111, 240, 0.18)' : 'rgba(59, 111, 240, 0.10)',
          border: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(59, 111, 240, 0.20)',
          chipLabel: 'Documents',
          chipVariant: 'Vault' as StatusChipVariant,
          colorScheme: 'purple' as const,
        };
      case 'health':
        return {
          icon: 'medkit' as const,
          color: isDark ? '#C084FC' : '#9333EA',
          bg: isDark ? 'rgba(147, 51, 234, 0.18)' : 'rgba(147, 51, 234, 0.10)',
          border: isDark ? 'rgba(147, 51, 234, 0.35)' : 'rgba(147, 51, 234, 0.20)',
          chipLabel: 'Health',
          chipVariant: 'Vault' as StatusChipVariant,
          colorScheme: 'purple' as const,
        };
      case 'household':
      default:
        return {
          icon: 'home' as const,
          color: isDark ? '#34D399' : '#059669',
          bg: isDark ? 'rgba(34, 197, 139, 0.18)' : 'rgba(16, 185, 129, 0.10)',
          border: isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(16, 185, 129, 0.20)',
          chipLabel: 'Household',
          chipVariant: 'Safe' as StatusChipVariant,
          colorScheme: 'green' as const,
        };
    }
  };

  const recentUpdates = (memories || []).slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <SectionHeader
        title="Day-to-Day Vault Updates"
        categoryTag="VAULT"
        actionText="View Vault →"
        onActionPress={() => {
          triggerHaptic();
          router.push('/(tabs)/memory');
        }}
      />

      {/* Main Container */}
      <GlassCard
        borderRadius={24}
        glowColor={isDark ? 'rgba(139, 124, 246, 0.20)' : undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>
        
        {/* Top Header Row with "+ Update" button */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.vaultIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(124, 92, 224, 0.12)',
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.35)' : 'rgba(124, 92, 224, 0.25)',
                },
              ]}>
              <Ionicons name="cube-outline" size={18} color={isDark ? '#A78BFA' : '#7C5CE0'} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text, fontSize: isElderly ? 17 : 15 }]}>
                Recent Item & Storage Logs
              </Text>
              <Text style={[styles.cardSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                {memories.length} item{memories.length === 1 ? '' : 's'} cataloged in Family Hub
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              setModalVisible(true);
            }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.addUpdateButton,
              {
                backgroundColor: isDark ? 'rgba(139, 124, 246, 0.20)' : 'rgba(124, 92, 224, 0.12)',
                borderColor: isDark ? 'rgba(139, 124, 246, 0.45)' : 'rgba(124, 92, 224, 0.30)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="add" size={15} color={isDark ? '#C4B5FD' : '#7C5CE0'} />
            <Text style={[styles.addUpdateButtonText, { color: isDark ? '#C4B5FD' : '#7C5CE0' }]}>
              + Update
            </Text>
          </Pressable>
        </View>

        {/* Content Rows */}
        {recentUpdates.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="sparkles-outline"
              size={24}
              color={isDark ? '#8B7CF6' : '#7C5CE0'}
              style={{ opacity: 0.85 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Day-to-Day Updates Logged Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Catalog physical drawers, documents, or household items so your family knows where to find them.
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [
                styles.emptyActionBtn,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Log First Update</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.itemsStack}>
            {recentUpdates.map((item, idx) => {
              const cfg = getCategoryConfig(item.category);
              const isLast = idx === recentUpdates.length - 1;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    triggerHaptic();
                    router.push('/(tabs)/memory');
                  }}
                  style={({ pressed }) => [
                    styles.itemRow,
                    !isLast && styles.itemRowBorder,
                    {
                      borderBottomColor: isDark ? 'rgba(130, 140, 255, 0.12)' : 'rgba(124, 92, 224, 0.10)',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  {/* Category icon */}
                  <View
                    style={[
                      styles.itemIconBox,
                      {
                        backgroundColor: cfg.bg,
                        borderColor: cfg.border,
                      },
                    ]}>
                    <Ionicons name={cfg.icon} size={15} color={cfg.color} />
                  </View>

                  {/* Title and location */}
                  <View style={styles.itemTextCol}>
                    <Text
                      numberOfLines={1}
                      style={[styles.itemTitle, { color: colors.text, fontSize: isElderly ? 15.5 : 14 }]}>
                      {item.title}
                    </Text>
                    <View style={styles.itemLocRow}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={isDark ? colors.textMuted : colors.textSecondary}
                      />
                      <Text
                        numberOfLines={1}
                        style={[styles.itemLocText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                        {item.savedLocation}
                      </Text>
                    </View>
                  </View>

                  {/* Status chip & time */}
                  <View style={styles.itemRightWrap}>
                    <StatusChip
                      label={cfg.chipLabel}
                      variant={cfg.chipVariant}
                      colorScheme={cfg.colorScheme}
                      size="sm"
                      showDot={false}
                    />
                    <Text style={[styles.itemTimeText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                      {item.lastVerified || 'Active'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </GlassCard>

      {/* Quick Add Update Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}>
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
                <Ionicons name="cube" size={20} color={isDark ? '#A78BFA' : colors.brandAccent} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Log Vault Update
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Keep your circle updated on where household supplies, documents, or personal items are kept.
            </Text>

            {/* Input: Item Title */}
            <View style={styles.inputStack}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Item or Supply</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Wi-Fi router password, Spare Keys, Passports"
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
              <Text style={[styles.inputLabel, { color: colors.text }]}>Storage Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Kitchen island drawer, Filing cabinet #2"
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
                {(['household', 'documents', 'health'] as const).map((cat) => {
                  const isSel = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catSelectBtn,
                        {
                          backgroundColor: isSel
                            ? colors.brandAccent
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
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
                            fontWeight: isSel ? '700' : '600',
                          },
                        ]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSaveUpdate}
              disabled={!title.trim() || !location.trim()}
              style={({ pressed }) => [
                styles.saveSubmitBtn,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: !title.trim() || !location.trim() ? 0.45 : pressed ? 0.88 : 1,
                },
              ]}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveSubmitBtnText}>Save Update to Vault</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  cardContainer: {
    marginVertical: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vaultIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  addUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  addUpdateButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 6,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  itemsStack: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  itemLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemLocText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  itemRightWrap: {
    alignItems: 'flex-end',
    gap: 3,
  },
  itemTimeText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    gap: 14,
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
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  inputStack: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  formInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
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
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 6,
  },
  saveSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
