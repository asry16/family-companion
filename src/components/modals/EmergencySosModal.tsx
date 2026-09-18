import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';

interface EmergencySosModalProps {
  visible: boolean;
  onClose: () => void;
  onTriggerSos: (reason: string, details?: any) => Promise<void> | void;
}

const EMERGENCY_PRESETS = [
  { id: 'medical', label: 'Medical Emergency', icon: 'medical' as const, emoji: '🩺' },
  { id: 'safety', label: 'Personal Safety / Threat', icon: 'shield-alert' as const, emoji: '🛡️' },
  { id: 'accident', label: 'Accident / Stranded', icon: 'car-sport' as const, emoji: '🚗' },
  { id: 'urgent', label: 'Urgent Help Needed', icon: 'alert-circle' as const, emoji: '🆘' },
];

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  visible,
  onClose,
  onTriggerSos,
}) => {
  const { colors, isDark } = useAppTheme();
  const { activeUser } = useFamily();

  const [selectedPreset, setSelectedPreset] = useState<string>('urgent');
  const [customNote, setCustomNote] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedPreset('urgent');
      setCustomNote('');
      setCountdown(5);
      setIsSending(false);
      setIsPaused(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
    }
  }, [visible]);

  // Countdown timer for auto-dispatch or abort
  useEffect(() => {
    if (!visible || isPaused || isSending) return;

    if (countdown <= 0) {
      handleConfirmDispatch();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [visible, countdown, isPaused, isSending]);

  const handleConfirmDispatch = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}

    const preset = EMERGENCY_PRESETS.find((p) => p.id === selectedPreset);
    const reasonText = customNote.trim()
      ? `${preset?.label}: ${customNote.trim()}`
      : (preset?.label || 'Emergency distress alert');

    try {
      await onTriggerSos(reasonText, {
        batteryLevel: activeUser?.batteryLevel || 88,
        humanLocation: activeUser?.humanLocation || 'Current Device Location',
        coords: activeUser?.coords,
      });
      onClose();
    } catch (err) {
      console.warn('Emergency dispatch error:', err);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.red,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.sosBadge, { backgroundColor: colors.red + '22' }]}>
              <Ionicons name="warning" size={28} color={colors.red} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              EMERGENCY SOS
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Dispatches an immediate high-priority alarm, location, and battery level to every family member.
            </Text>
          </View>

          {/* Countdown Abort Bar */}
          <View style={[styles.countdownContainer, { backgroundColor: colors.separator }]}>
            <View style={styles.countdownRow}>
              <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
                {isPaused ? 'Auto-send paused' : 'Auto-sending in:'}
              </Text>
              <Text style={[styles.countdownTimer, { color: colors.red }]}>
                {isPaused ? 'PAUSED' : `${countdown}s`}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.pauseBtn, { borderColor: colors.border }]}
              onPress={() => {
                setIsPaused(!isPaused);
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }}>
              <Text style={[styles.pauseBtnText, { color: colors.text }]}>
                {isPaused ? 'Resume Auto-Send' : 'Pause Timer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset Reasons */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Emergency Type
          </Text>
          <View style={styles.presetsGrid}>
            {EMERGENCY_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? colors.red + '20' : colors.separator,
                      borderColor: isSelected ? colors.red : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedPreset(preset.id);
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                  }}>
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                  <Text
                    style={[
                      styles.presetLabel,
                      {
                        color: isSelected ? colors.red : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Message Field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.separator,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Add short note (e.g. at Central Park entrance)..."
              placeholderTextColor={colors.textMuted}
              value={customNote}
              onChangeText={(text) => {
                setCustomNote(text);
                if (!isPaused) setIsPaused(true); // pause countdown when user starts typing note
              }}
              maxLength={120}
            />
          </View>

          {/* Location & Battery Info Pill */}
          <View style={[styles.infoPill, { backgroundColor: colors.separator }]}>
            <Ionicons name="location-sharp" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {activeUser?.humanLocation || 'GPS Location Attached'} • 🔋 {activeUser?.batteryLevel || 88}%
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.broadcastBtn,
                {
                  backgroundColor: colors.red,
                },
              ]}
              disabled={isSending}
              onPress={handleConfirmDispatch}>
              {isSending ? (
                <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} />
              ) : (
                <>
                  <Ionicons
                    name="megaphone"
                    size={20}
                    color={isDark ? colors.buttonTextOnDanger || '#000000' : '#FFFFFF'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.broadcastBtnText,
                      { color: isDark ? colors.buttonTextOnDanger || '#000000' : '#FFFFFF' },
                    ]}>
                    BROADCAST SOS NOW
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
              }}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancel / I am Safe
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sosBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  countdownContainer: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  countdownTimer: {
    fontSize: 16,
    fontWeight: '800',
  },
  pauseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '46%',
  },
  presetEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  presetLabel: {
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 10,
  },
  broadcastBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
