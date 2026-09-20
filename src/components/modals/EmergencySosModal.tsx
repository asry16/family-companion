import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  { id: 'safety', label: 'Safety / Threat', icon: 'shield-alert' as const, emoji: '🛡️' },
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
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: isDark ? 'rgba(22, 14, 38, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.28)',
              shadowColor: '#EF4444',
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.sosBadge}>
              <Ionicons name="warning" size={30} color="#EF4444" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              EMERGENCY SOS
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Dispatches an immediate high-priority alarm, live location, and battery level to your family circle.
            </Text>
          </View>

          {/* Countdown Abort Bar */}
          <View
            style={[
              styles.countdownContainer,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.28)' : 'rgba(239, 68, 68, 0.18)',
              },
            ]}>
            <View style={styles.countdownRow}>
              <Text style={[styles.countdownLabel, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                {isPaused ? 'Auto-send paused' : 'Auto-sending in:'}
              </Text>
              <Text style={styles.countdownTimer}>
                {isPaused ? 'PAUSED' : `${countdown}s`}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.pauseBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(220, 38, 38, 0.22)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                setIsPaused(!isPaused);
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }}>
              <Text style={[styles.pauseBtnText, { color: colors.text }]}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </Pressable>
          </View>

          {/* Preset Reasons */}
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#FCA5A5' : '#DC2626' },
            ]}>
            Emergency Type
          </Text>
          <View style={styles.presetsGrid}>
            {EMERGENCY_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  style={({ pressed }) => [
                    styles.presetChip,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.12)')
                        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)'),
                      borderColor: isSelected
                        ? '#EF4444'
                        : (isDark ? 'rgba(130, 140, 255, 0.18)' : 'rgba(124, 92, 224, 0.14)'),
                      opacity: pressed ? 0.85 : 1,
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
                        color: isSelected ? '#EF4444' : colors.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Optional Message Field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                  color: colors.text,
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.18)',
                },
              ]}
              placeholder="Add short note (e.g. at Central Park entrance)..."
              placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
              value={customNote}
              onChangeText={(text) => {
                setCustomNote(text);
                if (!isPaused) setIsPaused(true);
              }}
              maxLength={120}
            />
          </View>

          {/* Location & Battery Info Pill */}
          <View
            style={[
              styles.infoPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 92, 224, 0.06)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(124, 92, 224, 0.12)',
              },
            ]}>
            <Ionicons name="location-sharp" size={15} color={isDark ? '#8A6BF2' : '#7C5CE0'} />
            <Text style={[styles.infoText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              {activeUser?.humanLocation || 'GPS Location Attached'} • 🔋 {activeUser?.batteryLevel || 88}%
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Pressable
              disabled={isSending}
              onPress={handleConfirmDispatch}
              style={({ pressed }) => [
                styles.broadcastBtnWrap,
                {
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.broadcastGradient}>
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="megaphone"
                      size={19}
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.broadcastBtnText}>
                      BROADCAST SOS NOW
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
              }}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancel / I am Safe
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 26, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sosBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  countdownContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 14,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  countdownTimer: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EF4444',
  },
  pauseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '47%',
  },
  presetEmoji: {
    fontSize: 17,
    marginRight: 6,
  },
  presetLabel: {
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    borderWidth: 1,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 8,
  },
  broadcastBtnWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  broadcastGradient: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  cancelBtn: {
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

