import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { MemoryItem } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusChip, StatusChipVariant } from '@/components/ui/StatusChip';

interface VaultItemCardProps {
  item: MemoryItem;
  onPress?: () => void;
}

export const VaultItemCard: React.FC<VaultItemCardProps> = ({ item, onPress }) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  // Resolve category colors & icons
  const categoryConfig = (() => {
    switch (item.category) {
      case 'documents':
        return {
          icon: 'document-text' as const,
          color: colors.blue,
          bg: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(59, 111, 240, 0.10)',
          border: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(59, 111, 240, 0.18)',
          chipLabel: 'Documents',
          chipVariant: 'Vault' as StatusChipVariant,
          colorScheme: 'blue' as const,
        };
      case 'household':
        return {
          icon: 'home' as const,
          color: colors.green,
          bg: isDark ? 'rgba(34, 197, 139, 0.20)' : 'rgba(34, 197, 139, 0.10)',
          border: isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(34, 197, 139, 0.18)',
          chipLabel: 'Household',
          chipVariant: 'Safe' as StatusChipVariant,
          colorScheme: 'green' as const,
        };
      case 'health':
        return {
          icon: 'medkit' as const,
          color: colors.purple,
          bg: isDark ? 'rgba(124, 92, 224, 0.20)' : 'rgba(124, 92, 224, 0.10)',
          border: isDark ? 'rgba(124, 92, 224, 0.35)' : 'rgba(124, 92, 224, 0.18)',
          chipLabel: 'Health',
          chipVariant: 'Vault' as StatusChipVariant,
          colorScheme: 'purple' as const,
        };
      default:
        return {
          icon: 'bookmark' as const,
          color: colors.yellow,
          bg: isDark ? 'rgba(251, 191, 36, 0.20)' : 'rgba(245, 158, 11, 0.10)',
          border: isDark ? 'rgba(251, 191, 36, 0.35)' : 'rgba(245, 158, 11, 0.18)',
          chipLabel: 'Vault',
          chipVariant: 'Vault' as StatusChipVariant,
          colorScheme: 'yellow' as const,
        };
    }
  })();

  return (
    <GlassCard
      borderRadius={24}
      glowColor={isDark ? categoryConfig.color : undefined}
      onPress={() => {
        triggerHaptic();
        if (onPress) onPress();
      }}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      <View style={styles.cardRow}>
        {/* Left: Category-Colored Icon Circle */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: categoryConfig.bg,
              borderColor: categoryConfig.border,
            },
          ]}>
          <Ionicons
            name={categoryConfig.icon}
            size={18}
            color={categoryConfig.color}
          />
        </View>

        {/* Middle: Item Name & Location Text */}
        <View style={styles.textColumn}>
          <Text
            numberOfLines={1}
            style={[
              styles.itemTitle,
              { color: colors.text, fontSize: isElderly ? 17 : 15 },
            ]}>
            {item.title}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.locationText,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              {item.savedLocation}
            </Text>
          </View>
        </View>

        {/* Right: Category StatusChip, "Saved By" Avatar, Chevron */}
        <View style={styles.rightActionsGroup}>
          <StatusChip
            label={categoryConfig.chipLabel}
            variant={categoryConfig.chipVariant}
            colorScheme={categoryConfig.colorScheme}
            size="sm"
            showDot={false}
          />

          {/* Saved By Initial Avatar */}
          <View
            style={[
              styles.savedByAvatar,
              {
                backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59, 111, 240, 0.3)' : 'rgba(59, 111, 240, 0.15)',
              },
            ]}>
            <Text
              style={[
                styles.savedByText,
                { color: isDark ? '#38BDF8' : colors.blue },
              ]}>
              A
            </Text>
          </View>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDark ? colors.textMuted : colors.textSecondary}
          />
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    padding: 0,
    marginHorizontal: 18,
    marginVertical: 4,
  },
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  rightActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedByAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedByText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
