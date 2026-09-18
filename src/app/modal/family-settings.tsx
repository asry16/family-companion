import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { FamilyMember, MemberRelation } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';

const AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

const ROLES_LIST: MemberRelation[] = [
  'Mother',
  'Father',
  'Partner',
  'Daughter',
  'Son',
  'Grandmother',
  'Grandfather',
  'Other',
];

export default function FamilySettingsModal() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const { user, signOut } = useAuth();
  const {
    profile,
    members,
    updateFamilyProfile,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    resetToDefaults,
  } = useFamily();

  // Family details state
  const [familyName, setFamilyName] = useState(profile.name);
  const [address, setAddress] = useState(profile.address || 'B-42 Palm Grove');
  const [city, setCity] = useState(profile.homeCity || 'Gurgaon, NCR');
  const [profileSaved, setProfileSaved] = useState(false);

  // Add member modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState<MemberRelation>('Daughter');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#10B981');
  const [newMemberRingerMode, setNewMemberRingerMode] = useState<'sound' | 'silent' | 'vibrate' | 'dnd'>('sound');
  const [newMemberDeviceModel, setNewMemberDeviceModel] = useState('iPhone 15');
  const [newMemberBattery, setNewMemberBattery] = useState('85');
  const [newMemberError, setNewMemberError] = useState<string | null>(null);

  // Edit member modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRelation, setEditRelation] = useState<MemberRelation>('Mother');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Delete confirmation modal state
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<FamilyMember | null>(null);

  const handleSaveProfile = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
    updateFamilyProfile({
      name: familyName.trim() || profile.name,
      address: address.trim(),
      homeCity: city.trim(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleOpenAddModal = () => {
    setNewMemberName('');
    setNewMemberRelation('Daughter');
    setNewMemberPhone('');
    setNewMemberColor(AVATAR_COLORS[members.length % AVATAR_COLORS.length]);
    setNewMemberRingerMode('sound');
    setNewMemberDeviceModel(Platform.OS === 'ios' ? 'iPhone 15' : 'Android Device');
    setNewMemberBattery('85');
    setNewMemberError(null);
    setAddModalVisible(true);
  };

  const handleCreateMember = () => {
    if (!newMemberName.trim()) {
      setNewMemberError('Please enter a name.');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    const cleanName = newMemberName.trim();
    const initials = cleanName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    addFamilyMember({
      name: cleanName,
      relation: newMemberRelation,
      initials,
      avatarColor: newMemberColor,
      isSelf: false,
      statusMessage: 'Connected & syncing',
      currentPlaceId: 'place_home',
      humanLocation: 'At Home',
      batteryLevel: parseInt(newMemberBattery, 10) || 85,
      isCharging: false,
      isSharingLocation: true,
      sharingDuration: 'always',
      lastUpdated: 'Just now',
      availability: 'available',
      phone: newMemberPhone.trim() || '+1 555-0100',
      ringerMode: newMemberRingerMode,
      deviceModel: newMemberDeviceModel.trim() || 'Mobile Device',
    });

    setAddModalVisible(false);
  };

  const handleOpenEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditRelation(member.relation);
    setEditPhone(member.phone);
    setEditLocation(member.humanLocation);
    setEditModalVisible(true);
  };

  const handleSaveEditMember = () => {
    if (!editingMember) return;
    if (!editName.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    updateFamilyMember(editingMember.id, {
      name: editName.trim(),
      relation: editRelation,
      phone: editPhone.trim(),
      humanLocation: editLocation.trim() || editingMember.humanLocation,
    });

    setEditModalVisible(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (member: FamilyMember) => {
    if (member.isSelf) {
      if (Platform.OS === 'web') {
        window.alert('You cannot delete your own primary account.');
      } else {
        Alert.alert('Cannot Delete', 'You cannot delete your own primary family profile.');
      }
      return;
    }
    setDeleteConfirmMember(member);
  };

  const confirmDeleteMember = () => {
    if (!deleteConfirmMember) return;
    deleteFamilyMember(deleteConfirmMember.id);
    setDeleteConfirmMember(null);
  };

  const handleResetDemo = () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Reset all family members and tasks back to the default Sharma family demo dataset?')
      : true;

    if (confirm) {
      resetToDefaults();
      setFamilyName('The Sharma Family');
      setAddress('B-42 Palm Grove, Phase 5');
      setCity('Gurgaon, NCR');
      router.back();
    }
  };

  const handleLogout = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to log out of Kinly?')
      : true;

    if (confirmed) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
      }
      await signOut();
      router.replace('/login');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.borderSubtle,
          },
        ]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.headerIconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: isElderly ? 22 : 18 },
            ]}>
            Family Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {profile.name} • {members.length} members
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Household Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="home" size={18} color={colors.brandAccent} />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontSize: isElderly ? 18 : 15 },
              ]}>
              HOUSEHOLD PROFILE
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Family Name
              </Text>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="e.g. The Miller Family"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Home Address
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. 142 Elm Street"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                City / Region
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Seattle, WA"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <Pressable
              onPress={handleSaveProfile}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: profileSaved ? colors.green : colors.brandAccent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons
                name={profileSaved ? 'checkmark-circle' : 'save-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.saveButtonText}>
                {profileSaved ? 'Household Saved!' : 'Save Household Details'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Members Roster Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="people" size={18} color={colors.brandAccent} />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontSize: isElderly ? 18 : 15 },
              ]}>
              FAMILY MEMBERS ({members.length})
            </Text>
            <Pressable
              onPress={handleOpenAddModal}
              style={({ pressed }) => [
                styles.addMemberPill,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="person-add" size={14} color="#FFFFFF" />
              <Text style={styles.addMemberPillText}>Add Member</Text>
            </Pressable>
          </View>

          <View style={styles.membersList}>
            {members.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberRowCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}>
                <FamilyAvatar member={member} size="md" />

                <View style={styles.memberInfoCol}>
                  <View style={styles.memberNameLine}>
                    <Text
                      style={[
                        styles.memberNameText,
                        { color: colors.text, fontSize: isElderly ? 18 : 15 },
                      ]}>
                      {member.name}
                    </Text>
                    {member.isSelf && (
                      <View
                        style={[
                          styles.selfTag,
                          { backgroundColor: colors.separator },
                        ]}>
                        <Text style={[styles.selfTagText, { color: colors.textSecondary }]}>
                          You
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.memberSubText,
                      { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
                    ]}>
                    {member.relation} • {member.phone}
                  </Text>
                  <Text
                    style={[
                      styles.memberLocationStatus,
                      { color: colors.green, fontSize: isElderly ? 13 : 11 },
                    ]}>
                    📍 {member.humanLocation}
                  </Text>
                </View>

                {/* Member Row Actions */}
                <View style={styles.memberActionsWrap}>
                  <Pressable
                    onPress={() => handleOpenEditModal(member)}
                    hitSlop={8}
                    style={[
                      styles.actionIconBtn,
                      { backgroundColor: colors.separator, borderColor: colors.border },
                    ]}>
                    <Ionicons name="pencil-outline" size={16} color={colors.text} />
                  </Pressable>

                  {!member.isSelf && (
                    <Pressable
                      onPress={() => handleDeleteMember(member)}
                      hitSlop={8}
                      style={[
                        styles.actionIconBtn,
                        { backgroundColor: colors.redSoft, borderColor: colors.redBorder },
                      ]}>
                      <Ionicons name="trash-outline" size={16} color={colors.red} />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Account & Session Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-circle-outline" size={18} color={colors.brandAccent} />
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontSize: isElderly ? 18 : 15 },
              ]}>
              ACCOUNT & SESSION
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.accountRow}>
              <View style={styles.accountInfoCol}>
                <Text style={[styles.accountName, { color: colors.text }]}>
                  {user?.name || 'Active Family User'}
                </Text>
                <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                  {user?.email || 'Authenticated User'}
                </Text>
              </View>
              <View
                style={[
                  styles.providerBadge,
                  { backgroundColor: colors.blueSoft, borderColor: colors.blueBorder },
                ]}>
                <Ionicons
                  name={user?.provider === 'google' ? 'logo-google' : 'mail-outline'}
                  size={12}
                  color={colors.blue}
                />
                <Text style={[styles.providerText, { color: colors.blue }]}>
                  {user?.provider === 'google' ? 'Google' : 'Email'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  backgroundColor: colors.redSoft,
                  borderColor: colors.redBorder,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Ionicons name="log-out-outline" size={18} color={colors.red} />
              <Text style={[styles.logoutButtonText, { color: colors.red }]}>
                Log Out of Kinly
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Demo Reset Tool */}
        <View style={styles.resetSection}>
          <Pressable
            onPress={handleResetDemo}
            style={({ pressed }) => [
              styles.resetButton,
              {
                backgroundColor: colors.separator,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
              Reset to Demo Sharma Family
            </Text>
          </Pressable>
          <Text style={[styles.resetHint, { color: colors.textMuted }]}>
            Restores the 5-member Sharma family demo data with full sample calendar and tasks.
          </Text>
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAddModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrap,
                  { backgroundColor: colors.brandSoft },
                ]}>
                <Ionicons name="person-add" size={24} color={colors.brandAccent} />
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontSize: isElderly ? 22 : 18 },
                ]}>
                Add Family Member
              </Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Add a spouse, child, parent, or companion to your family space.
              </Text>
            </View>

            {newMemberError && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.redSoft, borderColor: colors.redBorder },
                ]}>
                <Ionicons name="alert-circle" size={16} color={colors.red} />
                <Text style={[styles.alertText, { color: colors.red }]}>
                  {newMemberError}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Full Name
              </Text>
              <TextInput
                value={newMemberName}
                onChangeText={(v) => {
                  setNewMemberName(v);
                  if (newMemberError) setNewMemberError(null);
                }}
                placeholder="e.g. John Miller"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Relation / Role
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rolesRow}>
                {ROLES_LIST.map((r) => {
                  const selected = newMemberRelation === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setNewMemberRelation(r)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: selected ? colors.brandAccent : colors.separator,
                          borderColor: selected ? colors.brandAccent : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.roleChipText,
                          {
                            color: selected ? '#FFFFFF' : colors.text,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}>
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Phone Number
              </Text>
              <TextInput
                value={newMemberPhone}
                onChangeText={setNewMemberPhone}
                placeholder="+1 555-0199"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Phone Ringer Mode */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Phone Ringer Mode
              </Text>
              <View style={styles.rolesRow}>
                {[
                  { id: 'sound', label: '🔔 Sound' },
                  { id: 'silent', label: '🔕 Silent' },
                  { id: 'vibrate', label: '📳 Vibrate' },
                ].map((mode) => {
                  const selected = newMemberRingerMode === mode.id;
                  return (
                    <Pressable
                      key={mode.id}
                      onPress={() => setNewMemberRingerMode(mode.id as any)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: selected ? colors.brandAccent : colors.separator,
                          borderColor: selected ? colors.brandAccent : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.roleChipText,
                          {
                            color: selected ? '#FFFFFF' : colors.text,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}>
                        {mode.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Device Model */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Device Model
              </Text>
              <TextInput
                value={newMemberDeviceModel}
                onChangeText={setNewMemberDeviceModel}
                placeholder="e.g. iPhone 15, Galaxy S24"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Avatar Accent Color
              </Text>
              <View style={styles.colorPaletteRow}>
                {AVATAR_COLORS.map((c) => {
                  const selected = newMemberColor === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setNewMemberColor(c)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        selected && styles.colorCircleSelected,
                      ]}>
                      {selected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalActionStack}>
              <Pressable
                onPress={handleCreateMember}
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.brandAccent },
                ]}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Add to Family</Text>
              </Pressable>

              <Pressable
                onPress={() => setAddModalVisible(false)}
                style={styles.cancelButton}>
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEditModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontSize: isElderly ? 22 : 18 },
                ]}>
                Edit Member: {editingMember?.name}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Name
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Relation
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rolesRow}>
                {ROLES_LIST.map((r) => {
                  const selected = editRelation === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setEditRelation(r)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: selected ? colors.brandAccent : colors.separator,
                          borderColor: selected ? colors.brandAccent : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.roleChipText,
                          {
                            color: selected ? '#FFFFFF' : colors.text,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}>
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Phone Number
              </Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Current Status Location
              </Text>
              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="e.g. At Home, At Work"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.modalActionStack}>
              <Pressable
                onPress={handleSaveEditMember}
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.brandAccent },
                ]}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>

              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={styles.cancelButton}>
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        visible={!!deleteConfirmMember}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmMember(null)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDeleteConfirmMember(null)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrap,
                  { backgroundColor: colors.redSoft },
                ]}>
                <Ionicons name="warning" size={24} color={colors.red} />
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontSize: isElderly ? 22 : 18 },
                ]}>
                Remove {deleteConfirmMember?.name}?
              </Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                This will remove {deleteConfirmMember?.name} from your family circle, map, and task assignments.
              </Text>
            </View>

            <View style={styles.modalActionStack}>
              <Pressable
                onPress={confirmDeleteMember}
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.red },
                ]}>
                <Ionicons name="trash" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Remove Member</Text>
              </Pressable>

              <Pressable
                onPress={() => setDeleteConfirmMember(null)}
                style={styles.cancelButton}>
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Keep Member
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 48,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  addMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addMemberPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  membersList: {
    gap: 10,
  },
  memberRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  memberInfoCol: {
    flex: 1,
    gap: 2,
  },
  memberNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberNameText: {
    fontWeight: '700',
  },
  selfTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selfTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberSubText: {
    fontWeight: '500',
  },
  memberLocationStatus: {
    fontWeight: '600',
    marginTop: 2,
  },
  memberActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  roleChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 13,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  accountInfoCol: {
    gap: 2,
    flex: 1,
  },
  accountName: {
    fontWeight: '700',
    fontSize: 16,
  },
  accountEmail: {
    fontSize: 13,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  providerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  logoutButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  resetSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetHint: {
    fontSize: 11,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    gap: 14,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 6,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionStack: {
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
