import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { PillButton } from '@/components/ui/PillButton';
import { IconCircleButton } from '@/components/ui/IconCircleButton';

interface CircleMembersHeaderProps {
  onOpenQr: () => void;
  onOpenJoin: () => void;
  onAddMember: () => void;
  onOpenSettings: () => void;
}

export const CircleMembersHeader: React.FC<CircleMembersHeaderProps> = ({
  onOpenQr,
  onOpenJoin,
  onAddMember,
  onOpenSettings,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontSize: isElderly ? 18 : 15 },
        ]}>
        MEMBERS & STATUS
      </Text>

      {/* Pill Actions Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}>
        {/* 1. QR Code Pill */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            onOpenQr();
          }}
          style={({ pressed }) => [
            styles.actionPill,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(20, 32, 58, 0.08)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons
            name="qr-code"
            size={13}
            color={colors.text}
          />
          <Text style={[styles.actionPillText, { color: colors.text }]}>
            QR Code
          </Text>
        </Pressable>

        {/* 2. Join Circle Pill */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            onOpenJoin();
          }}
          style={({ pressed }) => [
            styles.actionPill,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(20, 32, 58, 0.08)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons
            name="person-add-outline"
            size={13}
            color={colors.text}
          />
          <Text style={[styles.actionPillText, { color: colors.text }]}>
            Join Circle
          </Text>
        </Pressable>

        {/* 3. Add Member (Filled Blue Primary Button) */}
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            onAddMember();
          }}
          style={({ pressed }) => [
            styles.primaryAddPill,
            {
              backgroundColor: colors.blue,
              borderColor: colors.blue,
              opacity: pressed ? 0.88 : 1,
              shadowColor: colors.blue,
            },
          ]}>
          <Ionicons
            name="person-add"
            size={13}
            color={isDark ? '#000000' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.primaryAddPillText,
              { color: isDark ? '#000000' : '#FFFFFF' },
            ]}>
            Add Member
          </Text>
        </Pressable>

        {/* 4. Settings Icon Button */}
        <IconCircleButton
          name="settings-outline"
          size={32}
          iconSize={15}
          color={colors.text}
          onPress={onOpenSettings}
          accessibilityLabel="Circle Settings"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 2,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryAddPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
