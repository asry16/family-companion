import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { MemoryItem } from '@/types';

interface MemoryCardProps {
  memory: MemoryItem;
  onPress?: () => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onPress }) => {
  const { colors, isElderly } = useAppTheme();

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <Text style={{ fontSize: isElderly ? 24 : 20 }}>{memory.emoji || '📌'}</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: isElderly ? 20 : 16,
                },
              ]}>
              {memory.title}
            </Text>
            <Text
              style={[
                styles.categoryText,
                {
                  color: colors.textMuted,
                  fontSize: isElderly ? 14 : 11,
                },
              ]}>
              {memory.category.toUpperCase()} • Verified {memory.lastVerified}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.locationBanner,
          {
            backgroundColor: isElderly ? colors.separator : colors.blueSoft,
            borderColor: isElderly ? colors.border : colors.blueBorder,
          },
        ]}>
        <Ionicons name="location" size={16} color={colors.blue} />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.locationLabel,
              { color: colors.blue, fontSize: isElderly ? 13 : 11 },
            ]}>
            SAVED PHYSICAL LOCATION
          </Text>
          <Text
            style={[
              styles.locationValue,
              { color: colors.text, fontSize: isElderly ? 17 : 14 },
            ]}>
            {memory.savedLocation}
          </Text>
        </View>
      </View>

      {memory.notes && (
        <Text
          style={[
            styles.notes,
            { color: colors.textSecondary, fontSize: isElderly ? 16 : 13 },
          ]}>
          {memory.notes}
        </Text>
      )}

      {memory.tags.length > 0 && (
        <View style={styles.tagRow}>
          {memory.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tagPill,
                { backgroundColor: colors.separator },
              ]}>
              <Text
                style={[
                  styles.tagText,
                  { color: colors.textSecondary, fontSize: isElderly ? 13 : 11 },
                ]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  categoryText: {
    fontWeight: '600',
    marginTop: 2,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  locationLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  locationValue: {
    fontWeight: '600',
    marginTop: 2,
  },
  notes: {
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagText: {
    fontWeight: '600',
  },
});
