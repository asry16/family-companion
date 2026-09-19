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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { MemberRelation } from '@/types';
import { PillButton } from '@/components/ui/PillButton';

export interface SettingsProfileEditModalProps {
  visible: boolean;
  initialName: string;
  initialPhotoUrl?: string;
  initialPhone?: string;
  initialRelation?: MemberRelation;
  initialStatusMessage?: string;
  onClose: () => void;
  onSave: (data: {
    name: string;
    photoUrl?: string;
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

export const PRESET_AVATARS = [
  {
    id: 'p1',
    name: 'Warm Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'p2',
    name: 'Modern Professional',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'p3',
    name: 'Active Smile',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'p4',
    name: 'Casual',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'p5',
    name: 'Family Father',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'p6',
    name: 'Youth',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
  },
];

export const SettingsProfileEditModal: React.FC<SettingsProfileEditModalProps> = ({
  visible,
  initialName,
  initialPhotoUrl,
  initialPhone = '+1 555-0100',
  initialRelation = 'Self',
  initialStatusMessage = 'Online and safe',
  onClose,
  onSave,
}) => {
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState(initialName);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [relation, setRelation] = useState<MemberRelation>(initialRelation);
  const [statusMessage, setStatusMessage] = useState(initialStatusMessage);

  useEffect(() => {
    if (visible) {
      setName(initialName || '');
      setPhotoUrl(initialPhotoUrl || '');
      setCustomUrlInput(initialPhotoUrl || '');
      setShowUrlInput(false);
      setPhone(initialPhone || '');
      setRelation(initialRelation || 'Self');
      setStatusMessage(initialStatusMessage || 'Online and safe');
    }
  }, [visible, initialName, initialPhotoUrl, initialPhone, initialRelation, initialStatusMessage]);

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
      photoUrl: photoUrl.trim() || undefined,
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
                ? 'rgba(20, 27, 74, 0.96)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark
                ? 'rgba(130, 140, 255, 0.25)'
                : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={isDark ? '#8B7CF6' : '#7C5CE0'}
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
            {/* Profile Picture & Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarPreviewRow}>
                <View
                  style={[
                    styles.previewCircle,
                    {
                      borderColor: isDark
                        ? 'rgba(139, 124, 246, 0.40)'
                        : 'rgba(124, 92, 224, 0.30)',
                      backgroundColor: isDark ? 'rgba(20, 27, 74, 0.80)' : '#F1EFFF',
                    },
                  ]}>
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}>
                      <View style={styles.initialsCenter}>
                        <Text style={styles.initialsText}>
                          {(name.trim().charAt(0) || 'A').toUpperCase()}
                        </Text>
                      </View>
                    </LinearGradient>
                  )}
                  {/* Camera indicator */}
                  <View
                    style={[
                      styles.cameraBadge,
                      { backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0' },
                    ]}>
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.avatarMetaColumn}>
                  <Text style={[styles.avatarSectionHeading, { color: colors.text }]}>
                    Profile Photo & Avatar
                  </Text>
                  <Text
                    style={[
                      styles.avatarSectionSub,
                      { color: isDark ? colors.textTertiary : colors.textSecondary },
                    ]}>
                    {photoUrl ? 'Custom photo selected' : 'Initials avatar active'}
                  </Text>
                  <View style={styles.avatarActionButtons}>
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setPhotoUrl('');
                      }}
                      style={[
                        styles.avatarOptionPill,
                        !photoUrl && styles.avatarOptionPillActive,
                        {
                          borderColor: !photoUrl
                            ? isDark
                              ? '#8B7CF6'
                              : '#7C5CE0'
                            : isDark
                            ? 'rgba(140, 150, 255, 0.20)'
                            : 'rgba(0,0,0,0.1)',
                          backgroundColor: !photoUrl
                            ? isDark
                              ? 'rgba(139, 124, 246, 0.20)'
                              : 'rgba(124, 92, 224, 0.12)'
                            : 'transparent',
                        },
                      ]}>
                      <Ionicons
                        name="person"
                        size={12}
                        color={
                          !photoUrl
                            ? isDark
                              ? '#8B7CF6'
                              : '#7C5CE0'
                            : isDark
                            ? colors.textTertiary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.avatarOptionPillText,
                          {
                            color: !photoUrl
                              ? isDark
                                ? '#8B7CF6'
                                : '#7C5CE0'
                              : isDark
                              ? colors.textTertiary
                              : colors.textSecondary,
                            fontWeight: !photoUrl ? '700' : '500',
                          },
                        ]}>
                        Use Initials
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setShowUrlInput(!showUrlInput);
                      }}
                      style={[
                        styles.avatarOptionPill,
                        showUrlInput && styles.avatarOptionPillActive,
                        {
                          borderColor: showUrlInput
                            ? isDark
                              ? '#8B7CF6'
                              : '#7C5CE0'
                            : isDark
                            ? 'rgba(140, 150, 255, 0.20)'
                            : 'rgba(0,0,0,0.1)',
                          backgroundColor: showUrlInput
                            ? isDark
                              ? 'rgba(139, 124, 246, 0.20)'
                              : 'rgba(124, 92, 224, 0.12)'
                            : 'transparent',
                        },
                      ]}>
                      <Ionicons
                        name="link-outline"
                        size={12}
                        color={
                          showUrlInput
                            ? isDark
                              ? '#8B7CF6'
                              : '#7C5CE0'
                            : isDark
                            ? colors.textTertiary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.avatarOptionPillText,
                          {
                            color: showUrlInput
                              ? isDark
                                ? '#8B7CF6'
                                : '#7C5CE0'
                              : isDark
                              ? colors.textTertiary
                              : colors.textSecondary,
                            fontWeight: showUrlInput ? '700' : '500',
                          },
                        ]}>
                        Custom URL
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Preset Avatars Scroll */}
              <View style={styles.presetsWrapper}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? colors.textTertiary : colors.textSecondary },
                  ]}>
                  Choose from Preset Avatars
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetsRow}>
                  {PRESET_AVATARS.map((p) => {
                    const isChosen = photoUrl === p.url;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          triggerHaptic();
                          setPhotoUrl(p.url);
                          setShowUrlInput(false);
                        }}
                        style={[
                          styles.presetThumbCircle,
                          {
                            borderColor: isChosen
                              ? isDark
                                ? '#8B7CF6'
                                : '#7C5CE0'
                              : isDark
                              ? 'rgba(140, 150, 255, 0.20)'
                              : 'rgba(0,0,0,0.08)',
                            borderWidth: isChosen ? 2.5 : 1,
                          },
                        ]}>
                        <Image source={{ uri: p.url }} style={styles.presetImage} />
                        {isChosen && (
                          <View
                            style={[
                              styles.presetCheckBadge,
                              { backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0' },
                            ]}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Custom URL Input if toggled */}
              {showUrlInput && (
                <View style={styles.urlInputRow}>
                  <TextInput
                    value={customUrlInput}
                    onChangeText={setCustomUrlInput}
                    placeholder="Paste image URL (https://...)"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.textInput,
                      {
                        flex: 1,
                        height: 42,
                        fontSize: 13,
                        color: colors.text,
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(124, 92, 224, 0.04)',
                        borderColor: isDark
                          ? 'rgba(140, 150, 255, 0.25)'
                          : 'rgba(124, 92, 224, 0.14)',
                      },
                    ]}
                  />
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      if (customUrlInput.trim()) {
                        setPhotoUrl(customUrlInput.trim());
                      }
                    }}
                    style={[
                      styles.applyUrlBtn,
                      { backgroundColor: isDark ? '#8B7CF6' : '#7C5CE0' },
                    ]}>
                    <Text style={styles.applyUrlBtnText}>Apply</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Full Name Input */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? colors.textTertiary : colors.textSecondary },
                ]}>
                Full Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Alex Morgan"
                placeholderTextColor={isDark ? colors.textMuted : colors.textSecondary}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(124, 92, 224, 0.04)',
                    borderColor: isDark
                      ? 'rgba(140, 150, 255, 0.25)'
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
                  { color: isDark ? colors.textTertiary : colors.textSecondary },
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
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark
                      ? 'rgba(140, 150, 255, 0.25)'
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
                  { color: isDark ? colors.textTertiary : colors.textSecondary },
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
                            ? isDark
                              ? 'rgba(139, 124, 246, 0.22)'
                              : colors.blue
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(20, 32, 58, 0.04)',
                          borderColor: isSelected
                            ? isDark
                              ? '#8B7CF6'
                              : colors.blue
                            : isDark
                            ? 'rgba(140, 150, 255, 0.20)'
                            : 'rgba(20, 32, 58, 0.08)',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.relationText,
                          {
                            color: isSelected ? (isDark ? '#8B7CF6' : '#FFFFFF') : colors.text,
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
                  { color: isDark ? colors.textTertiary : colors.textSecondary },
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
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark
                      ? 'rgba(140, 150, 255, 0.25)'
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
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isDark
                      ? 'rgba(140, 150, 255, 0.25)'
                      : 'rgba(20, 32, 58, 0.12)',
                  },
                ]}>
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: isDark ? colors.textTertiary : colors.textSecondary },
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
  avatarSection: {
    gap: 12,
    paddingBottom: 4,
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  initialsCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarMetaColumn: {
    flex: 1,
    gap: 4,
  },
  avatarSectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  avatarSectionSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  avatarActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  avatarOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  avatarOptionPillActive: {},
  avatarOptionPillText: {
    fontSize: 11.5,
  },
  presetsWrapper: {
    gap: 6,
  },
  presetsRow: {
    gap: 10,
    paddingVertical: 2,
  },
  presetThumbCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  presetImage: {
    width: 46,
    height: 46,
  },
  presetCheckBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  applyUrlBtn: {
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyUrlBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
