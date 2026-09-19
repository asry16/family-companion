import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui';

export interface SettingsInviteCardProps {
  inviteCode?: string;
  familyName?: string;
  onViewQR: () => void;
  onShareInvite: () => void;
  onJoinOtherFamily: () => void;
}

export const SettingsInviteCard: React.FC<SettingsInviteCardProps> = ({
  inviteCode = 'KIN-2041',
  familyName = 'The A Family',
  onViewQR,
  onShareInvite,
  onJoinOtherFamily,
}) => {
  const { colors, isDark } = useAppTheme();

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  return (
    <View style={styles.sectionWrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons
          name="qr-code-outline"
          size={14}
          color={isDark ? '#38BDF8' : '#6D5BD0'}
        />
        <Text
          style={[
            styles.sectionHeaderText,
            { color: isDark ? colors.textMuted : '#6D5BD0' },
          ]}>
          FAMILY INVITATION & QR CODE
        </Text>
      </View>

      {/* Invitation Glass Card */}
      <GlassCard
        borderRadius={24}
        glowColor={isDark ? colors.blue : undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>
        {/* Top Row: Label & View QR Pill Button */}
        <View style={styles.codeHeaderRow}>
          <View style={styles.labelCol}>
            <Text
              style={[
                styles.codeLabel,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              Household Private Invite Code
            </Text>

            {/* Invite Code in Large Bold Type */}
            <Text
              style={[
                styles.codeText,
                isDark
                  ? {
                      color: '#38BDF8',
                      textShadowColor: 'rgba(56, 189, 248, 0.75)',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 10,
                    }
                  : {
                      color: '#7C5CE0',
                    },
              ]}>
              {inviteCode}
            </Text>
          </View>

          {/* "View QR" Tonal Button */}
          <Button
            variant="tonal"
            size="sm"
            icon="qr-code-outline"
            title="View QR"
            onPress={onViewQR}
          />
        </View>


        {/* Description */}
        <Text
          style={[
            styles.descriptionText,
            { color: isDark ? colors.textMuted : colors.textSecondary },
          ]}>
          Anyone with this QR code or 8-character invite code can instantly join {familyName} and sync real-time safety status.
        </Text>

        {/* Two Buttons Side by Side */}
        <View style={[styles.actionButtonsRow, { gap: 10 }]}>
          {/* "Share QR Invite" (primary) */}
          <Button
            variant="primary"
            size="md"
            icon="share-outline"
            title="Share QR Invite"
            onPress={onShareInvite}
            style={{ flex: 1 }}
          />

          {/* "Join Other Family" (secondary) */}
          <Button
            variant="secondary"
            size="md"
            icon="scan-outline"
            title="Join Other Family"
            onPress={onJoinOtherFamily}
            style={{ flex: 1 }}
          />
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
    paddingHorizontal: 18,
    gap: 12,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  labelCol: {
    gap: 4,
  },
  codeLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
});
