import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { MemberRelation } from '@/types';
import { PillButton } from '@/components/ui/PillButton';

export interface SettingsProfileEditModalProps {
  visible: boolean;
  initialName: string;
  initialPhone?: string;
  initialRelation?: MemberRelation;
  initialStatusMessage?: string;
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    relation: MemberRelation;
    statusMessage: string;
  }) => void;
}

const RELATION_OPTIONS: MemberRelation[] = [
  'Self',
  'Father',
  'Mother',
  'Partner',
  'Daughter',
  'Son',
  'Grandmother',
  'Grandfather',
  'Other',
];

export const SettingsProfileEditModal: React.FC<SettingsProfileEditModalProps> = ({
  visible,
  initialName,
  initialPhone = '+1 555-0100',
  initialRelation = 'Self',
  initialStatusMessage = 'Online and safe',
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [relation, setRelation] = useState<MemberRelation>(initialRelation);
  const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

  useEffect(() => {
    if (visible) {
      setName(initialName || '');
      setPhone(initialPhone || '');
      setRelation(initialRelation || 'Self');
      setStatusMessage(initialStatusMessage || 'Online and safe');
    }
  }, [visible, initialName, initialPhone, initialRelation, initialStatusMessage]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      name: name.trim(),
      phone: phone.trim() || '+1 555-0100',
      relation,
      statusMessage: statusMessage.trim() || 'Online and safe',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlayBackdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark
                ? 'rgba(15, 26, 58, 0.96)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark
                ? 'rgba(59, 111, 240, 0.35)'
                : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={isDark ? '#38BDF8' : '#7C5CE0'}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Profile Details
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}>
            {/* Full Name Input */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                Full Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Asmita Roy"
                placeholderTextColor={isDark ? colors.textMuted : colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(124, 92, 224, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(124, 92, 224, 0.14)',
                  },
                ]}
              />
            </View>

            {/* Phone Number Input */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                Phone Number
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 555-0100"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(20, 32, 58, 0.10)',
                  },
                ]}
              />
            </View>

            {/* Family Relation Selector */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                Your Household Role
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relationsRow}>
                {RELATION_OPTIONS.map((opt) => {
                  const isSelected = relation === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        triggerHaptic();
                        setRelation(opt);
                      }}
                      style={[
                        styles.relationChip,
                        {
                          backgroundColor: isSelected
                            ? colors.blue
                            : isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(20, 32, 58, 0.04)',
                          borderColor: isSelected
                            ? colors.blue
                            : isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(20, 32, 58, 0.08)',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.relationText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Live Status Message Note */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                Live Status Note
              </Text>
              <TextInput
                value={statusMessage}
                onChangeText={setStatusMessage}
                placeholder="e.g. Online and safe, At Office, In a meeting"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(20, 32, 58, 0.10)',
                  },
                ]}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={onClose}
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(20, 32, 58, 0.12)',
                  },
                ]}>
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: isDark ? colors.textMuted : colors.textSecondary },
                  ]}>
                  Cancel
                </Text>
              </Pressable>

              <PillButton
                title="Save Changes"
                variant="primary"
                size="md"
                onPress={handleSave}
                style={styles.saveBtn}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
  },
  formContent: {
    gap: 16,
    paddingBottom: 10,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  relationsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  relationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  relationText: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    height: 46,
  },
});
