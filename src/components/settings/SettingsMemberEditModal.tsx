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
import { FamilyMember, MemberRelation } from '@/types';
import { PillButton } from '@/components/ui/PillButton';

export interface SettingsMemberEditModalProps {
  visible: boolean;
  member: FamilyMember | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    relation: MemberRelation;
    phone: string;
    location?: string;
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

export const SettingsMemberEditModal: React.FC<SettingsMemberEditModalProps> = ({
  visible,
  member,
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState<MemberRelation>('Other');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('At Home');

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setRelation(member.relation || 'Other');
      setPhone(member.phone || '');
      setLocation(member.humanLocation || 'At Home');
    } else {
      setName('');
      setRelation('Other');
      setPhone('');
      setLocation('At Home');
    }
  }, [member, visible]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    triggerHaptic();
    onSave({
      id: member?.id,
      name: name.trim(),
      relation,
      phone: phone.trim() || '+1 555-0100',
      location: location.trim() || 'At Home',
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
                : 'rgba(20, 32, 58, 0.12)',
            },
          ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {member ? 'Edit Family Member' : 'Add Family Member'}
            </Text>
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
            {/* Name Input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                Full Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Alex Morgan"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(20, 32, 58, 0.10)',
                  },
                ]}
              />
            </View>

            {/* Relation Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                Family Relation
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relationsRow}>
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
                            color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.text,
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

            {/* Phone Number Input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                Phone Number
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+1 555-0100"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(20, 32, 58, 0.10)',
                  },
                ]}
              />
            </View>

            {/* Current Place */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                Current Place / Note
              </Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. At Home, At Office"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(20, 32, 58, 0.10)',
                  },
                ]}
              />
            </View>

            {/* Save Button */}
            <View style={styles.saveBtnWrap}>
              <PillButton
                title={member ? 'Save Changes' : 'Add Member'}
                variant="primary"
                size="md"
                onPress={handleSave}
                disabled={!name.trim()}
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dismissArea: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  formContent: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textInput: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  relationsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  relationChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  relationText: {
    fontSize: 12,
  },
  saveBtnWrap: {
    marginTop: 6,
  },
});
