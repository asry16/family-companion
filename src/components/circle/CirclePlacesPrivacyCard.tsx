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
import { GlassCard } from '@/components/ui/GlassCard';

interface CirclePlacesPrivacyCardProps {
  onSeeMap?: () => void;
  onPressPlaces?: () => void;
  onPressHome?: () => void;
  onPressPrivacy?: () => void;
}

export const CirclePlacesPrivacyCard: React.FC<CirclePlacesPrivacyCardProps> = ({
  onSeeMap,
  onPressPlaces,
  onPressHome,
  onPressPrivacy,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const tiles = [
    {
      id: 'places',
      title: 'Privacy-First Family Places',
      subtitle: 'Your location is shared (always)',
      icon: 'navigate' as const,
      accentColor: colors.blue,
      bg: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(59, 111, 240, 0.10)',
      border: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(59, 111, 240, 0.18)',
      onPress: onPressPlaces,
    },
    {
      id: 'home',
      title: 'Home Location',
      subtitle: 'Home Residence',
      icon: 'home' as const,
      accentColor: colors.green,
      bg: isDark ? 'rgba(34, 197, 139, 0.20)' : 'rgba(34, 197, 139, 0.10)',
      border: isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(34, 197, 139, 0.18)',
      onPress: onPressHome,
    },
    {
      id: 'privacy',
      title: 'Privacy Controls',
      subtitle: 'Location, battery & notifications',
      icon: 'lock-closed' as const,
      accentColor: colors.purple,
      bg: isDark ? 'rgba(124, 92, 224, 0.20)' : 'rgba(124, 92, 224, 0.10)',
      border: isDark ? 'rgba(124, 92, 224, 0.35)' : 'rgba(124, 92, 224, 0.18)',
      onPress: onPressPrivacy,
    },
  ];

  return (
    <GlassCard
      borderRadius={26}
      glowColor={isDark ? colors.blue : undefined}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      {/* 1. Header: Pin Icon, Title, Subtitle, "See Map →" at right */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftCol}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="location-sharp" size={17} color={colors.blue} />
            <Text
              style={[
                styles.mainTitle,
                { color: colors.text, fontSize: isElderly ? 17 : 14.5 },
              ]}>
              FAMILY PLACES & PRIVACY CONTROLS
            </Text>
          </View>
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            Manage your home, places and privacy settings
          </Text>
        </View>

        {/* "See Map →" Action */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            if (onSeeMap) onSeeMap();
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.seeMapPressable,
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.seeMapText, { color: colors.blue }]}>
            See Map →
          </Text>
        </Pressable>
      </View>

      {/* 2. Three Tappable Tiles */}
      <View style={styles.tilesStack}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            onPress={() => {
              triggerHaptic();
              if (tile.onPress) {
                tile.onPress();
              } else if (onSeeMap) {
                onSeeMap();
              }
            }}
            style={({ pressed }) => [
              styles.tileItem,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(20, 32, 58, 0.02)',
                borderColor: tile.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            {/* Colored Circle Icon */}
            <View style={[styles.iconCircle, { backgroundColor: tile.bg }]}>
              <Ionicons name={tile.icon} size={16} color={tile.accentColor} />
            </View>

            {/* Text Stack */}
            <View style={styles.tileTextCol}>
              <Text
                style={[
                  styles.tileTitle,
                  { color: colors.text, fontSize: isElderly ? 15 : 13.5 },
                ]}>
                {tile.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.tileSubtitle,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                {tile.subtitle}
              </Text>
            </View>

            {/* Chevron Right */}
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
        ))}
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
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeftCol: {
    flex: 1,
    gap: 3,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainTitle: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  seeMapPressable: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  seeMapText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  tilesStack: {
    gap: 8,
  },
  tileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTextCol: {
    flex: 1,
    gap: 2,
  },
  tileTitle: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  tileSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
