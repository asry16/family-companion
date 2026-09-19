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
import { Button } from '@/components/ui';

export interface SettingsAccountSectionProps {
  userName?: string;
  userEmail?: string;
  signInMethod?: string;
  onLogout: () => void;
}

export const SettingsAccountSection: React.FC<SettingsAccountSectionProps> = ({
  userName = 'Asmita Roy',
  userEmail = 'asmita@kinly.family',
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

          {/* "Email" Tonal Chip */}
          <Button
            variant="tonal"
            size="sm"
            icon="mail-outline"
            title={signInMethod}
          />
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

        {/* Full-width Danger Button: "Log Out of Kinly" */}
        <Button
          variant="danger"
          fullWidth
          icon="log-out-outline"
          title="Log Out of Kinly"
          onPress={onLogout}
        />
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
  divider: {
    height: 1,
    width: '100%',
  },
});
