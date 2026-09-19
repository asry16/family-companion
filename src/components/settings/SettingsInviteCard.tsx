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

export interface SettingsInviteCardProps {
  inviteCode?: string;
  familyName?: string;
  onViewQR: () => void;
  onShareInvite: () => void;
  onJoinOtherFamily: () => void;
}

export const SettingsInviteCard: React.FC<SettingsInviteCardProps> = ({
  inviteCode = 'KIN-0000',
  familyName = 'My Family',
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
          color={isDark ? '#8B7CF6' : '#6D5BD0'}
        />
        <Text
          style={[
            styles.sectionHeaderText,
            { color: isDark ? colors.textTertiary : '#6D5BD0' },
          ]}>
          FAMILY INVITATION & QR CODE
        </Text>
      </View>

      {/* Invitation Glass Card */}
      <GlassCard
        borderRadius={24}
        glowColor={undefined}
        style={styles.cardContainer}
        contentStyle={styles.cardContent}>
        {/* Top Row: Label & View QR Pill Button */}
        <View style={styles.codeHeaderRow}>
          <View style={styles.labelCol}>
            <Text
              style={[
                styles.codeLabel,
                { color: isDark ? colors.textTertiary : colors.textSecondary },
              ]}>
              Household Private Invite Code
            </Text>

            {/* Invite Code in Large Bold Type */}
            <Text
              style={[
                styles.codeText,
                isDark
                  ? {
                      color: '#8B7CF6',
                      textShadowColor: 'rgba(139, 124, 246, 0.40)',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 8,
                    }
                  : {
                      color: '#7C5CE0',
                    },
              ]}>
              {inviteCode}
            </Text>
          </View>

          {/* "View QR" Pill Button */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              onViewQR();
            }}
            accessibilityRole="button"
            accessibilityLabel="View QR Code"
            style={({ pressed }) => [
              styles.viewQrPill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(124, 92, 224, 0.10)',
                borderColor: isDark
                  ? 'rgba(139, 124, 246, 0.50)'
                  : 'rgba(124, 92, 224, 0.25)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name="qr-code-outline"
              size={13}
              color={isDark ? '#8B7CF6' : '#7C5CE0'}
            />
            <Text
              style={[
                styles.viewQrText,
                { color: isDark ? '#8B7CF6' : '#7C5CE0' },
              ]}>
              View QR
            </Text>
          </Pressable>
        </View>

        {/* Description */}
        <Text
          style={[
            styles.descriptionText,
            { color: isDark ? colors.textTertiary : colors.textSecondary },
          ]}>
          Anyone with this QR code or 8-character invite code can instantly join {familyName} and sync real-time safety status.
        </Text>

        {/* Two Buttons Side by Side */}
        <View style={styles.actionButtonsRow}>
          {/* "Share QR Invite" (Filled primary gradient, share icon) */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              onShareInvite();
            }}
            accessibilityRole="button"
            accessibilityLabel="Share QR Invite"
            style={({ pressed }) => [
              styles.btnFlex,
              styles.gradientBtnWrap,
              {
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <LinearGradient
              colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBtnInner}>
              <Ionicons
                name="share-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text
                style={[
                  styles.btnText,
                  { color: '#FFFFFF' },
                ]}>
                Share QR Invite
              </Text>
            </LinearGradient>
          </Pressable>

          {/* "Join Other Family" (Outlined, scan-frame icon) */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              onJoinOtherFamily();
            }}
            accessibilityRole="button"
            accessibilityLabel="Join Other Family"
            style={({ pressed }) => [
              styles.btnFlex,
              styles.outlinedBtn,
              {
                borderColor: isDark
                  ? 'rgba(139, 124, 246, 0.50)'
                  : '#7C5CE0',
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(124, 92, 224, 0.08)',
                opacity: pressed ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <Ionicons
              name="scan-outline"
              size={16}
              color={isDark ? '#8B7CF6' : '#7C5CE0'}
            />
            <Text
              style={[
                styles.btnText,
                { color: isDark ? '#8B7CF6' : '#7C5CE0' },
              ]}>
              Join Other Family
            </Text>
          </Pressable>
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
  viewQrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  viewQrText: {
    fontSize: 12,
    fontWeight: '700',
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
  btnFlex: {
    flex: 1,
  },
  gradientBtnWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  outlinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  btnText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});
