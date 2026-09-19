import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { FamilyMember, MemberRelation } from '@/types';
import {
  SettingsTopBar,
  SettingsProfileSection,
  SettingsProfileEditModal,
  SettingsThemeSection,
  SettingsInviteCard,
  SettingsMembersSection,
  SettingsSecuritySection,
  SettingsAccountSection,
  SettingsMemberEditModal,
  SettingsFloatingTabBar,
  SettingsTabKey,
} from '@/components/settings';
import { FamilyQRModal } from '@/components/modals/FamilyQRModal';
import { JoinFamilyModal } from '@/components/modals/JoinFamilyModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LightBackdrop } from '@/components/ui/LightBackdrop';

const DEFAULT_MOCK_MEMBERS: FamilyMember[] = [
  {
    id: 'mem-1',
    name: 'Asmita Roy',
    relation: 'Self',
    initials: 'A',
    avatarColor: '#3B6FF0',
    isSelf: true,
    humanLocation: 'At Home',
    statusMessage: 'Online and safe',
    batteryLevel: 88,
    isCharging: false,
    phone: '+1 555-0100',
    currentPlaceId: 'home',
    isSharingLocation: true,
    sharingDuration: 'always',
    lastUpdated: 'Just now',
    availability: 'available',
  },
];

export interface FamilySettingsScreenProps {
  initialFamilyName?: string;
  initialInviteCode?: string;
  initialMembers?: FamilyMember[];
  account?: {
    name: string;
    email: string;
    signInMethod: string;
  };
  fromTab?: SettingsTabKey;
}

export default function FamilySettingsScreen({
  initialFamilyName,
  initialInviteCode,
  initialMembers,
  account,
  fromTab: fromTabProp,
}: FamilySettingsScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromTab?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user, signOut, updateUserProfile } = useAuth();
  const {
    profile,
    members: contextMembers,
    updateFamilyMember,
    addFamilyMember,
  } = useFamily();

  // Tab caller source: default to 'circle' if opened from Circle, or 'home', etc.
  const callerTab: SettingsTabKey = (
    fromTabProp ||
    (params.fromTab as SettingsTabKey) ||
    'circle'
  );

  // Dynamic Family Data
  const familyName = initialFamilyName || profile?.name || 'The A Family';
  const inviteCode = initialInviteCode || profile?.code || 'KIN-2041';

  // State
  const [memberList, setMemberList] = useState<FamilyMember[]>(() => {
    if (initialMembers && initialMembers.length > 0) return initialMembers;
    if (contextMembers && contextMembers.length > 0) return contextMembers;
    return DEFAULT_MOCK_MEMBERS;
  });

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [profileEditModalVisible, setProfileEditModalVisible] = useState(false);

  // Current user's member object
  const selfMember = memberList.find((m) => m.isSelf || m.id === user?.familyMemberId) || memberList[0];
  const userName = user?.name || selfMember?.name || 'Asmita Roy';
  const userEmail = user?.email || 'asmita@kinly.family';
  const userPhone = user?.phone || selfMember?.phone || '+1 555-0100';
  const userRelation = (user?.relation || selfMember?.relation || 'Self') as MemberRelation;
  const userStatus = selfMember?.statusMessage || 'Online and safe';

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Share QR Invite Code via Native Share Sheet
  const handleShareInvite = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join ${familyName} on Kinly! Use our household private invite code: ${inviteCode} or scan our family QR code to connect and sync live safety status.`,
        title: `Join ${familyName} on Kinly`,
      });
    } catch (e) {}
  };

  // Add Member
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setEditModalVisible(true);
  };

  // Edit Existing Member
  const handleOpenEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setEditModalVisible(true);
  };

  // Save Member (Add or Edit)
  const handleSaveMember = (data: {
    id?: string;
    name: string;
    relation: MemberRelation;
    phone: string;
    location?: string;
  }) => {
    if (data.id) {
      // Update existing
      setMemberList((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? {
                ...m,
                name: data.name,
                relation: data.relation,
                phone: data.phone,
                humanLocation: data.location || m.humanLocation,
              }
            : m
        )
      );
      updateFamilyMember(data.id, {
        name: data.name,
        relation: data.relation,
        phone: data.phone,
      });

      // If updating self member, also sync to auth profile
      if (data.id === selfMember?.id) {
        updateUserProfile({
          name: data.name,
          phone: data.phone,
          relation: data.relation,
        });
      }
    } else {
      // Add new
      const newMember: FamilyMember = {
        id: `mem-${Date.now()}`,
        name: data.name,
        relation: data.relation,
        initials: data.name.charAt(0).toUpperCase(),
        avatarColor: '#7C5CE0',
        humanLocation: data.location || 'At Home',
        statusMessage: 'Connected to Family',
        batteryLevel: 90,
        isCharging: false,
        phone: data.phone,
        currentPlaceId: 'home',
        isSharingLocation: true,
        sharingDuration: 'always',
        lastUpdated: 'Just now',
        availability: 'available',
      };
      setMemberList((prev) => [...prev, newMember]);
      const { id: _ignoredId, ...memberData } = newMember;
      addFamilyMember(memberData);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (data: {
    name: string;
    phone: string;
    relation: MemberRelation;
    statusMessage: string;
  }) => {
    // 1. Update Auth Context
    await updateUserProfile({
      name: data.name,
      phone: data.phone,
      relation: data.relation,
    });

    // 2. Update Self in local memberList state
    const targetId = selfMember?.id || user?.familyMemberId || 'mem-1';
    setMemberList((prev) =>
      prev.map((m) =>
        m.id === targetId
          ? {
              ...m,
              name: data.name,
              phone: data.phone,
              relation: data.relation,
              statusMessage: data.statusMessage,
              initials: data.name.charAt(0).toUpperCase(),
            }
          : m
      )
    );

    // 3. Sync to Family Context
    updateFamilyMember(targetId, {
      name: data.name,
      phone: data.phone,
      relation: data.relation,
      statusMessage: data.statusMessage,
    });
  };

  // Logout
  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    await signOut();
    router.replace('/login');
  };

  const accountInfo = account || {
    name: userName,
    email: userEmail,
    signInMethod: user?.provider === 'google' ? 'Google' : 'Email',
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LightBackdrop />
      {/* 1. Top Bar: Back Arrow, Centered "Family Settings" and Subtitle */}
      <SettingsTopBar
        title="Family Settings"
        familyName={familyName}
        memberCount={memberList.length}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 95, 115) },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Section: YOUR PROFILE DETAILS & EDITING */}
        <SettingsProfileSection
          name={userName}
          email={userEmail}
          phone={userPhone}
          relation={userRelation === 'Self' ? 'Self (Family Organizer)' : userRelation}
          statusMessage={userStatus}
          onEditProfile={() => setProfileEditModalVisible(true)}
        />

        {/* 3. Section: CHANGING MODES (Dark mode, Light mode, Mobile default) */}
        <SettingsThemeSection />

        {/* 4. Section: FAMILY INVITATION & QR CODE */}
        <SettingsInviteCard
          inviteCode={inviteCode}
          familyName={familyName}
          onViewQR={() => setQrModalVisible(true)}
          onShareInvite={handleShareInvite}
          onJoinOtherFamily={() => setJoinModalVisible(true)}
        />

        {/* 5. Section: FAMILY MEMBERS (count) */}
        <SettingsMembersSection
          members={memberList}
          currentUserId={selfMember?.id || memberList[0]?.id}
          onAddMember={handleOpenAddMember}
          onEditMember={handleOpenEditMember}
        />

        {/* 6. Section: SECURITY & SESSIONS (Where logged in, security checkup, saved login) */}
        <SettingsSecuritySection />

        {/* 7. Section: ACCOUNT & SESSION */}
        <SettingsAccountSection
          userName={accountInfo.name}
          userEmail={accountInfo.email}
          signInMethod={accountInfo.signInMethod}
          onLogout={() => setLogoutModalVisible(true)}
        />
      </ScrollView>

      {/* 8. Fixed Bottom Tab Bar: Highlight caller tab */}
      <SettingsFloatingTabBar activeTab={callerTab} />

      {/* Modals */}
      {/* 1. Profile Edit Modal */}
      <SettingsProfileEditModal
        visible={profileEditModalVisible}
        initialName={userName}
        initialPhone={userPhone}
        initialRelation={userRelation}
        initialStatusMessage={userStatus}
        onClose={() => setProfileEditModalVisible(false)}
        onSave={handleSaveProfile}
      />

      {/* 2. View QR Modal */}
      <FamilyQRModal
        visible={qrModalVisible}
        familyCode={inviteCode}
        familyName={familyName}
        onClose={() => setQrModalVisible(false)}
      />

      {/* 3. Join Family Scanner Modal */}
      <JoinFamilyModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={() => setJoinModalVisible(false)}
      />

      {/* 4. Member Edit / Add Modal */}
      <SettingsMemberEditModal
        visible={editModalVisible}
        member={editingMember}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveMember}
      />

      {/* 5. Logout Confirmation Modal */}
      <ConfirmationModal
        visible={logoutModalVisible}
        title="Log Out of Kinly?"
        description="Are you sure you want to log out? You will need to sign in again to view real-time family updates."
        confirmLabel="Log Out"
        cancelLabel="Stay Signed In"
        variant="red"
        iconName="log-out-outline"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    gap: 10,
  },
});
