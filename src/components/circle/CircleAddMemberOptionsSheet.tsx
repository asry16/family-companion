import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

interface CircleAddMemberOptionsSheetProps {
  visible: boolean;
  inviteCode?: string;
  onClose: () => void;
  onSelectQR: () => void;
  onSelectCode: () => void;
  onSelectManual: () => void;
}

export const CircleAddMemberOptionsSheet: React.FC<CircleAddMemberOptionsSheetProps> = ({
  visible,
  inviteCode = 'KIN-0000',
  onClose,
  onSelectQR,
  onSelectCode,
  onSelectManual,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const options = [
    {
      id: 'qr',
      title: 'Family QR Code',
      subtitle: 'Display or scan household QR code for instant connect',
      badge: 'Fastest',
      icon: 'qr-code-outline' as const,
      gradient: ['#8B6CF0', '#6366F1'] as [string, string],
      iconBg: isDark ? 'rgba(139, 124, 246, 0.20)' : 'rgba(124, 92, 224, 0.12)',
      iconColor: isDark ? '#8B7CF6' : '#7C5CE0',
      onPress: () => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        onClose();
        onSelectQR();
      },
    },
    {
      id: 'code',
      title: 'Household Invite Code',
      subtitle: `Share code (${inviteCode}) or enter an existing invite code`,
      badge: 'Private',
      icon: 'key-outline' as const,
      gradient: ['#4F8EF7', '#3B82F6'] as [string, string],
      iconBg: isDark ? 'rgba(79, 142, 247, 0.20)' : 'rgba(59, 111, 240, 0.12)',
      iconColor: colors.blue,
      onPress: () => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        onClose();
        onSelectCode();
      },
    },
    {
      id: 'manual',
      title: 'Manual Detail Joining',
      subtitle: 'Directly add name, relationship, phone & starting place',
      badge: 'Direct',
      icon: 'person-add-outline' as const,
      gradient: ['#1E3A8A', '#2563EB'] as [string, string],
      iconBg: isDark ? 'rgba(30, 58, 138, 0.30)' : 'rgba(30, 58, 138, 0.12)',
      iconColor: isDark ? '#60A5FA' : '#1E3A8A',
      onPress: () => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        onClose();
        onSelectManual();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Backdrop Tap */}
        <Pressable
          style={styles.backdropPressable}
          onPress={() => {
            triggerHaptic();
            onClose();
          }}
        />

        {/* Sheet Content */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#101540' : '#FFFFFF',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.28)' : 'rgba(124, 92, 224, 0.20)',
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}>
          {/* Top Handle */}
          <View style={styles.handleWrap}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text
                style={[
                  styles.sheetTitle,
                  { color: colors.text, fontSize: isElderly ? 21 : 18 },
                ]}>
                Add Family Member
              </Text>
              <Text
                style={[
                  styles.sheetSubtitle,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                Select an option to connect your household
              </Text>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              hitSlop={8}
              style={[
                styles.closeCircle,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.05)',
                  borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
                },
              ]}>
              <Ionicons
                name="close"
                size={18}
                color={isDark ? '#C9CEFF' : '#5B628F'}
              />
            </Pressable>
          </View>

          {/* Option Cards */}
          <View style={styles.optionsStack}>
            {options.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={opt.onPress}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                {/* Icon Circle with Gradient */}
                <LinearGradient
                  colors={opt.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optIconCircle}>
                  <Ionicons name={opt.icon} size={22} color="#FFFFFF" />
                </LinearGradient>

                {/* Text Col */}
                <View style={styles.optTextCol}>
                  <View style={styles.titleBadgeRow}>
                    <Text
                      style={[
                        styles.optTitle,
                        { color: colors.text, fontSize: isElderly ? 16 : 15 },
                      ]}>
                      {opt.title}
                    </Text>
                    <View
                      style={[
                        styles.optBadge,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 92, 224, 0.08)',
                          borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.optBadgeText,
                          { color: isDark ? colors.textMuted : colors.textSecondary },
                        ]}>
                        {opt.badge}
                      </Text>
                    </View>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.optSubtitle,
                      { color: isDark ? colors.textMuted : colors.textSecondary },
                    ]}>
                    {opt.subtitle}
                  </Text>
                </View>

                {/* Arrow */}
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isDark ? colors.textMuted : '#8A8EB2'}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  sheetTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsStack: {
    gap: 10,
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  optIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  optBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  optSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
  },
});
