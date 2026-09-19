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

export interface SettingsAccountSectionProps {
  userName?: string;
  userEmail?: string;
  signInMethod?: string;
  onLogout: () => void;
}

export const SettingsAccountSection: React.FC<SettingsAccountSectionProps> = ({
  userName = 'Family Member',
  userEmail = '',
  signInMethod = 'Email',
  onLogout,
}) => {
  const { colors, isDark } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <View style={styles.sectionWrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons
          name="person-circle-outline"
          size={16}
          color={isDark ? '#38BDF8' : '#6D5BD0'}
        />
        <Text
          style={[
            styles.sectionHeaderText,
            { color: isDark ? colors.textMuted : '#6D5BD0' },
          ]}>
          ACCOUNT & SESSION
        </Text>
      </View>

      {/* Account Glass Card */}
      <GlassCard
        borderRadius={24}
        glowColor={isDark ? colors.blue : undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>
        {/* Top Row: User details on left, Sign-in method chip on right */}
        <View style={styles.userRow}>
          <View style={styles.userColumn}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName}
            </Text>
            <Text
              style={[
                styles.userEmail,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              {userEmail}
            </Text>
          </View>

          {/* Small non-tappable "Email" chip with envelope icon */}
          <View
            style={[
              styles.methodChip,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(124, 92, 224, 0.08)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <Ionicons
              name="mail-outline"
              size={12}
              color={isDark ? colors.textMuted : '#7C5CE0'}
            />
            <Text
              style={[
                styles.methodChipText,
                { color: isDark ? colors.textMuted : '#7C5CE0' },
              ]}>
              {signInMethod}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark
                ? 'rgba(59, 111, 240, 0.12)'
                : 'rgba(124, 92, 224, 0.10)',
            },
          ]}
        />

        {/* Full-width Red-Tinted Button: "Log Out of Kinly" */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            onLogout();
          }}
          accessibilityRole="button"
          accessibilityLabel="Log Out of Kinly"
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: isDark
                ? 'rgba(240, 82, 77, 0.16)'
                : 'rgba(225, 29, 72, 0.06)',
              borderColor: isDark
                ? 'rgba(240, 82, 77, 0.35)'
                : 'rgba(225, 29, 72, 0.18)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="log-out-outline" size={17} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>
            Log Out of Kinly
          </Text>
        </Pressable>
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
    paddingHorizontal: 18,
    gap: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userColumn: {
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
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});
