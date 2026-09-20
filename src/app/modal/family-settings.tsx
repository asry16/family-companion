import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
  Pressable,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  SettingsPrivacySection,
} from '@/components/settings';
import { BottomTabBar, TabKey } from '@/components/navigation';
import { TabBarTokens } from '@/constants/theme';
import { FamilyQRModal } from '@/components/modals/FamilyQRModal';
import { JoinFamilyModal } from '@/components/modals/JoinFamilyModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LightBackdrop } from '@/components/ui/LightBackdrop';
import { DarkBackdrop } from '@/components/ui/DarkBackdrop';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface FamilySettingsScreenProps {
  initialFamilyName?: string;
  initialInviteCode?: string;
  initialMembers?: FamilyMember[];
  account?: {
    name: string;
    email: string;
    signInMethod: string;
  };
  fromTab?: TabKey;
}

interface SectionItem {
  id: string;
  title: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'profile', title: 'Profile Details', shortLabel: 'Profile', icon: 'person-outline', badge: 'Organizer' },
  { id: 'theme', title: 'Appearance & Theme', shortLabel: 'Theme', icon: 'color-palette-outline', badge: 'Active' },
  { id: 'invite', title: 'Family Invitation & QR', shortLabel: 'Invite', icon: 'qr-code-outline', badge: 'Private' },
  { id: 'members', title: 'Family Members', shortLabel: 'Members', icon: 'people-outline' },
  { id: 'privacy', title: 'Places & Privacy Controls', shortLabel: 'Privacy', icon: 'shield-checkmark-outline', badge: 'Encrypted' },
  { id: 'security', title: 'Security & Sessions', shortLabel: 'Security', icon: 'lock-closed-outline', badge: 'Protected' },
  { id: 'account', title: 'Account & Sign Out', shortLabel: 'Account', icon: 'log-out-outline' },
];

export default function FamilySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fromTab?: string }>();
  const callerTab: TabKey = (params?.fromTab as TabKey) || 'circle';

  const { colors, isDark, isElderly } = useAppTheme();
  const { user, signOut } = useAuth();
  const {
    profile,
    members: contextMembers,
    updateFamilyProfile,
    updateFamilyMember,
    addFamilyMember,
  } = useFamily();

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<{ [key: string]: number }>({});

  const [activeSectionId, setActiveSectionId] = useState<string>('profile');
  
  // Keep sections collapsed by default so user can scroll down accordingly
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    profile: false,
    theme: false,
    invite: false,
    members: false,
    privacy: false,
    security: false,
    account: false,
  });

  const familyName = profile?.name || user?.familyName || 'The Anderson Family';
  const inviteCode = profile?.code || 'KIN-4829';

  const [memberList, setMemberList] = useState<FamilyMember[]>(() => {
    if (contextMembers && contextMembers.length > 0) return contextMembers;
    if (user) {
      return [
        {
          id: user.familyMemberId || 'self-1',
          name: user.name || 'Family Organizer',
          relation: (user.relation || 'Self') as MemberRelation,
          initials: (user.name?.charAt(0) || 'F').toUpperCase(),
          avatarColor: colors.brandAccent || '#7C5CE0',
          photoUrl: user.photoUrl,
          phone: user.phone || '+1 (555) 019-2834',
          isSelf: true,
          statusMessage: 'Family Organizer',
          batteryLevel: 94,
          isCharging: false,
          humanLocation: 'Home',
          currentPlaceId: 'home',
          isSharingLocation: true,
          sharingDuration: 'always',
          lastUpdated: 'Just now',
          availability: 'available',
        },
      ];
    }
    return [];
  });

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [profileEditModalVisible, setProfileEditModalVisible] = useState(false);

  const selfMember = memberList.find((m) => m.isSelf || m.id === user?.familyMemberId) || memberList[0];
  const userName = user?.name || selfMember?.name || 'Family Member';
  const userEmail = user?.email || '';
  const userPhotoUrl = user?.photoUrl || selfMember?.photoUrl;
  const userPhone = user?.phone || selfMember?.phone || '';
  const userRelation = (user?.relation || selfMember?.relation || 'Self') as MemberRelation;
  const userStatus = selfMember?.statusMessage || 'Active on Kinly';

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Smooth scrolling opening of any section
  const handleScrollOpenSection = (id: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setActiveSectionId(id);

    // Open the section
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {}

    // Scroll directly to position
    setTimeout(() => {
      const targetY = sectionPositions.current[id];
      if (targetY !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, targetY - 70),
          animated: true,
        });
      }
    }, 60);
  };

  // Toggle individual section expansion in place without jumping scroll
  const toggleSection = (id: string) => {
    triggerHaptic();
    const willOpen = !openSections[id];
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {}
    setOpenSections((prev) => ({ ...prev, [id]: willOpen }));
  };

  const handleShareInvite = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join ${familyName} on Kinly! Use our household private invite code: ${inviteCode} or scan our family QR code to connect and sync live safety status.`,
        title: `Join ${familyName} on Kinly`,
      });
    } catch (e) {}
  };

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setEditModalVisible(true);
  };

  const handleOpenEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setEditModalVisible(true);
  };

  const handleSaveMember = (data: {
    id?: string;
    name: string;
    relation: MemberRelation;
    phone: string;
    location?: string;
  }) => {
    if (data.id) {
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
        humanLocation: data.location || 'Home',
      });
    } else {
      const newMember = addFamilyMember({
        name: data.name,
        relation: data.relation,
        initials: data.name.charAt(0).toUpperCase(),
        avatarColor: colors.purple || '#8B7CF6',
        isSelf: false,
        phone: data.phone,
        humanLocation: data.location || 'At Home',
        statusMessage: 'Recently joined family circle',
        currentPlaceId: 'home',
        batteryLevel: 96,
        isSharingLocation: true,
        sharingDuration: 'always',
        lastUpdated: 'Just now',
        availability: 'available',
      });
      setMemberList((prev) => [...prev, newMember]);
    }
    setEditModalVisible(false);
  };

  const handleSaveProfile = (data: {
    name: string;
    photoUrl?: string;
    phone: string;
    relation: MemberRelation;
    statusMessage: string;
  }) => {
    setProfileEditModalVisible(false);
    updateFamilyProfile({ name: familyName });
    const targetId = selfMember?.id || 'self-1';
    setMemberList((prev) =>
      prev.map((m) =>
        m.id === targetId
          ? {
              ...m,
              name: data.name,
              photoUrl: data.photoUrl,
              phone: data.phone,
              relation: data.relation,
              statusMessage: data.statusMessage,
              initials: data.name.charAt(0).toUpperCase(),
            }
          : m
      )
    );

    updateFamilyMember(targetId, {
      name: data.name,
      photoUrl: data.photoUrl,
      phone: data.phone,
      relation: data.relation,
      statusMessage: data.statusMessage,
    });
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    await signOut();
    router.replace('/login');
  };

  const accountInfo = {
    name: userName,
    email: userEmail,
    signInMethod: user?.provider === 'google' ? 'Google' : 'Email',
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LightBackdrop />
      <DarkBackdrop />

      {/* 1. Top Bar */}
      <SettingsTopBar
        title="Family Settings"
        familyName={familyName}
        memberCount={memberList.length}
        onBack={() => router.back()}
      />

      {/* 2. Top Horizontal Scrolling Section Navigation Pills */}
      <View style={styles.quickNavWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickNavContent}>
          {SECTIONS.map((sec) => {
            const isActive = activeSectionId === sec.id;
            return (
              <Pressable
                key={sec.id}
                onPress={() => handleScrollOpenSection(sec.id)}
                style={({ pressed }) => [
                  styles.quickPill,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(139, 124, 246, 0.22)'
                        : 'rgba(124, 92, 224, 0.15)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(20, 32, 58, 0.04)',
                    borderColor: isActive
                      ? isDark
                        ? '#8B7CF6'
                        : '#7C5CE0'
                      : isDark
                      ? 'rgba(130, 140, 255, 0.20)'
                      : 'rgba(124, 92, 224, 0.15)',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Ionicons
                  name={sec.icon}
                  size={13}
                  color={isActive ? (isDark ? '#8B7CF6' : '#7C5CE0') : (isDark ? colors.textMuted : colors.textSecondary)}
                />
                <Text
                  style={[
                    styles.quickPillText,
                    {
                      color: isActive ? (isDark ? '#F2F4FF' : '#1E1B6B') : (isDark ? colors.textMuted : colors.textSecondary),
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}>
                  {sec.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TabBarTokens.getScrollBottomPadding(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}>

        {/* Section 1: PROFILE */}
        <View
          onLayout={(e) => {
            sectionPositions.current['profile'] = e.nativeEvent.layout.y;
          }}
          style={styles.sectionContainer}>
          <Pressable
            onPress={() => toggleSection('profile')}
            style={[
              styles.sectionCardHeader,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <View style={styles.headerLeftCol}>
              <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(79, 142, 247, 0.15)' : 'rgba(59, 111, 240, 0.12)' }]}>
                <Ionicons name="person-circle-outline" size={20} color={colors.blue} />
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Profile Details</Text>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(124, 92, 224, 0.12)' }]}>
                    <Text style={[styles.badgePillText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>Organizer</Text>
                  </View>
                </View>
                {!openSections['profile'] && (
                  <Text numberOfLines={1} style={[styles.summaryText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    {userName} • {userRelation === 'Self' ? 'Family Organizer' : userRelation}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={openSections['profile'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
          {openSections['profile'] && (
            <SettingsProfileSection
              name={userName}
              email={userEmail}
              photoUrl={userPhotoUrl}
              phone={userPhone}
              relation={userRelation === 'Self' ? 'Self (Family Organizer)' : userRelation}
              statusMessage={userStatus}
              onEditProfile={() => setProfileEditModalVisible(true)}
            />
          )}
        </View>

        {/* Section 2: THEME */}
        <View
          onLayout={(e) => {
            sectionPositions.current['theme'] = e.nativeEvent.layout.y;
          }}
          style={styles.sectionContainer}>
          <Pressable
            onPress={() => toggleSection('theme')}
            style={[
              styles.sectionCardHeader,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <View style={styles.headerLeftCol}>
              <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(124, 92, 224, 0.12)' }]}>
                <Ionicons name="color-palette-outline" size={20} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Appearance & Theme</Text>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(20, 32, 58, 0.06)' }]}>
                    <Text style={[styles.badgePillText, { color: isDark ? colors.text : colors.textSecondary }]}>
                      {isDark ? 'Dark' : 'Light'}
                    </Text>
                  </View>
                </View>
                {!openSections['theme'] && (
                  <Text numberOfLines={1} style={[styles.summaryText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    {isDark ? 'Deep Indigo Theme' : 'Lavender Theme'} • Tap to customize
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={openSections['theme'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
          {openSections['theme'] && <SettingsThemeSection />}
        </View>

        {/* Section 3: INVITATION & QR */}
        <View
          onLayout={(e) => {
            sectionPositions.current['invite'] = e.nativeEvent.layout.y;
          }}
          style={styles.sectionContainer}>
          <Pressable
            onPress={() => toggleSection('invite')}
            style={[
              styles.sectionCardHeader,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <View style={styles.headerLeftCol}>
              <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(34, 197, 139, 0.12)' }]}>
                <Ionicons name="qr-code-outline" size={20} color={colors.green} />
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Family Invitation & QR</Text>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(34, 197, 139, 0.12)' }]}>
                    <Text style={[styles.badgePillText, { color: isDark ? '#34D399' : '#059669' }]}>Private</Text>
                  </View>
                </View>
                {!openSections['invite'] && (
                  <Text numberOfLines={1} style={[styles.summaryText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Invite Code: {inviteCode} • Scan or share QR
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={openSections['invite'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
          {openSections['invite'] && (
            <SettingsInviteCard
              inviteCode={inviteCode}
              familyName={familyName}
              onViewQR={() => setQrModalVisible(true)}
              onShareInvite={handleShareInvite}
              onJoinOtherFamily={() => setJoinModalVisible(true)}
            />
          )}
        </View>

        {/* Section 4: MEMBERS */}
        <View
          onLayout={(e) => {
            sectionPositions.current['members'] = e.nativeEvent.layout.y;
          }}
          style={styles.sectionContainer}>
          <Pressable
            onPress={() => toggleSection('members')}
            style={[
              styles.sectionCardHeader,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <View style={styles.headerLeftCol}>
              <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(79, 142, 247, 0.15)' : 'rgba(59, 111, 240, 0.12)' }]}>
                <Ionicons name="people-outline" size={20} color={colors.blue} />
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Family Members</Text>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(20, 32, 58, 0.06)' }]}>
                    <Text style={[styles.badgePillText, { color: isDark ? colors.text : colors.textSecondary }]}>
                      {memberList.length} Connected
                    </Text>
                  </View>
                </View>
                {!openSections['members'] && (
                  <Text numberOfLines={1} style={[styles.summaryText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    {memberList.length} household members connected • Tap to view & edit
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={openSections['members'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
          {openSections['members'] && (
            <SettingsMembersSection
              members={memberList}
              currentUserId={selfMember?.id || memberList[0]?.id}
              onAddMember={handleOpenAddMember}
              onEditMember={handleOpenEditMember}
            />
          )}
        </View>

        {/* Section 5: PRIVACY CONTROLS */}
        <View
          onLayout={(e) => {
            sectionPositions.current['privacy'] = e.nativeEvent.layout.y;
          }}
          style={styles.sectionContainer}>
          <Pressable
            onPress={() => toggleSection('privacy')}
            style={[
              styles.sectionCardHeader,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <View style={styles.headerLeftCol}>
              <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : 'rgba(30, 58, 138, 0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={isDark ? '#60A5FA' : '#1E3A8A'} />
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Places & Privacy Controls</Text>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : 'rgba(30, 58, 138, 0.12)' }]}>
                    <Text style={[styles.badgePillText, { color: isDark ? '#60A5FA' : '#1E3A8A' }]}>Encrypted</Text>
                  </View>
                </View>
                {!openSections['privacy'] && (
                  <Text numberOfLines={1} style={[styles.summaryText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Ghost Mode, Precise GPS & Geofencing alerts
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={openSections['privacy'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
          {openSections['privacy'] && <SettingsPrivacySection />}
        </View>

        {/* Section 6: SECURITY & SESSIONS */}
        <View
          onLayout={(e) => {
            sectionPositions.current['security'] = e.nativeEvent.layout.y;
          }}
          style={styles.sectionContainer}>
          <Pressable
            onPress={() => toggleSection('security')}
            style={[
              styles.sectionCardHeader,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <View style={styles.headerLeftCol}>
              <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(124, 92, 224, 0.12)' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Security & Sessions</Text>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(34, 197, 139, 0.12)' }]}>
                    <Text style={[styles.badgePillText, { color: isDark ? '#34D399' : '#059669' }]}>Protected</Text>
                  </View>
                </View>
                {!openSections['security'] && (
                  <Text numberOfLines={1} style={[styles.summaryText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Vault Encrypted • Biometrics & active devices
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={openSections['security'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
          {openSections['security'] && <SettingsSecuritySection />}
        </View>

        {/* Section 7: ACCOUNT & LOGOUT */}
        <View
          onLayout={(e) => {
            sectionPositions.current['account'] = e.nativeEvent.layout.y;
          }}
          style={styles.sectionContainer}>
          <Pressable
            onPress={() => toggleSection('account')}
            style={[
              styles.sectionCardHeader,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.20)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <View style={styles.headerLeftCol}>
              <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.10)' }]}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.accordionTitle, { color: colors.text }]}>Account & Sign Out</Text>
                </View>
                {!openSections['account'] && (
                  <Text numberOfLines={1} style={[styles.summaryText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    {accountInfo.email || userName} • Manage active session
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={openSections['account'] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? colors.textMuted : colors.textSecondary}
            />
          </Pressable>
          {openSections['account'] && (
            <SettingsAccountSection
              userName={accountInfo.name}
              userEmail={accountInfo.email}
              signInMethod={accountInfo.signInMethod}
              onLogout={() => setLogoutModalVisible(true)}
            />
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Tab Bar */}
      <BottomTabBar activeTab={callerTab} />

      {/* Modals */}
      <SettingsProfileEditModal
        visible={profileEditModalVisible}
        initialName={userName}
        initialPhotoUrl={userPhotoUrl}
        initialPhone={userPhone}
        initialRelation={userRelation}
        initialStatusMessage={userStatus}
        onClose={() => setProfileEditModalVisible(false)}
        onSave={handleSaveProfile}
      />

      <FamilyQRModal
        visible={qrModalVisible}
        familyCode={inviteCode}
        familyName={familyName}
        onClose={() => setQrModalVisible(false)}
      />

      <JoinFamilyModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={() => setJoinModalVisible(false)}
      />

      <SettingsMemberEditModal
        visible={editModalVisible}
        member={editingMember}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveMember}
      />

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
  quickNavWrap: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130, 140, 255, 0.12)',
  },
  quickNavContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    gap: 10,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  sectionContainer: {
    gap: 6,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  summaryText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
