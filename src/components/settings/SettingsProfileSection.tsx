import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';

export interface SettingsProfileSectionProps {
  name: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  relation?: string;
  statusMessage?: string;
  onEditProfile: () => void;
}

export const SettingsProfileSection: React.FC<SettingsProfileSectionProps> = ({
  name = 'Family Member',
  email = '',
  photoUrl,
  phone = '',
  relation = 'Self',
  statusMessage = 'Active on Kinly',
  onEditProfile,
}) => {
  const { colors, isDark } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const initial = (name.trim().charAt(0) || 'A').toUpperCase();

  return (
    <View style={styles.sectionWrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons
          name="person-outline"
          size={16}
          color={isDark ? '#8B7CF6' : '#6D5BD0'}
        />
        <Text
          style={[
            styles.sectionHeaderText,
            { color: isDark ? colors.textTertiary : '#6D5BD0' },
          ]}>
          YOUR PROFILE DETAILS
        </Text>
      </View>

      {/* Profile Glass Card */}
      <GlassCard
        borderRadius={24}
        glowColor={undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>
        {/* Top Row: Avatar, Details & Edit Pill Button */}
        <View style={styles.topRow}>
          {/* Avatar with live status dot */}
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircle,
                {
                  overflow: 'hidden',
                },
              ]}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <LinearGradient
                    colors={['#4F8EF7', '#8B6CF0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.avatarText}>{initial}</Text>
                </>
              )}
            </View>
            <View
              style={[
                styles.onlineBadge,
                {
                  backgroundColor: colors.green,
                  borderColor: isDark ? '#0B1030' : '#FFFFFF',
                },
              ]}
            />
          </View>

          {/* User Info Column */}
          <View style={styles.infoColumn}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <Text
              style={[
                styles.userEmail,
                { color: isDark ? colors.textTertiary : colors.textSecondary },
              ]}
              numberOfLines={1}>
              {email}
            </Text>
            <View style={styles.phoneRow}>
              <Ionicons
                name="call-outline"
                size={12}
                color={isDark ? colors.textTertiary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.phoneText,
                  { color: isDark ? colors.textTertiary : colors.textSecondary },
                ]}>
                {phone}
              </Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              onEditProfile();
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
            style={({ pressed }) => [
              styles.editButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(124, 92, 224, 0.08)',
                borderColor: isDark
                  ? 'rgba(139, 124, 246, 0.50)'
                  : '#7C5CE0',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="create-outline" size={14} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
            <Text style={[styles.editText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>
              Edit
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark
                ? 'rgba(130, 140, 255, 0.12)'
                : 'rgba(20, 32, 58, 0.06)',
            },
          ]}
        />

        {/* Bottom Attributes Strip */}
        <View style={styles.detailsStrip}>
          {/* Relation Tag */}
          <View
            style={[
              styles.tagPill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(20, 32, 58, 0.05)',
                borderColor: isDark
                  ? 'rgba(140, 150, 255, 0.20)'
                  : 'rgba(20, 32, 58, 0.08)',
              },
            ]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color={isDark ? '#8B7CF6' : colors.blue}
            />
            <Text
              style={[
                styles.tagText,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              {relation}
            </Text>
          </View>

          {/* Status Note */}
          <View
            style={[
              styles.tagPill,
              {
                backgroundColor: isDark
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(16, 185, 129, 0.08)',
                borderColor: isDark
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(16, 185, 129, 0.18)',
              },
            ]}>
            <View style={styles.statusDot} />
            <Text
              style={[
                styles.statusText,
                { color: isDark ? '#34D399' : '#059669' },
              ]}
              numberOfLines={1}>
              {statusMessage}
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginHorizontal: 18,
    marginVertical: 6,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardContainer: {
    padding: 0,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
  },
  infoColumn: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  editText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  detailsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
