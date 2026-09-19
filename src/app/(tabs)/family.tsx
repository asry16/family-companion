import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { FamilyMember } from '@/types';

// Circle Screen Components (Design System)
import { CircleHeader } from '@/components/circle/CircleHeader';
import { CircleSafetyBanner } from '@/components/circle/CircleSafetyBanner';
import { CircleMembersHeader } from '@/components/circle/CircleMembersHeader';
import { CircleMemberCard } from '@/components/circle/CircleMemberCard';
import { CirclePlacesPrivacyCard } from '@/components/circle/CirclePlacesPrivacyCard';
import { CircleLiveMapCard } from '@/components/circle/CircleLiveMapCard';

// Modals
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EmergencySosModal } from '@/components/modals/EmergencySosModal';
import { FamilyQRModal } from '@/components/modals/FamilyQRModal';
import { JoinFamilyModal } from '@/components/modals/JoinFamilyModal';
import { FamilyCommandCenter } from '@/components/home/FamilyCommandCenter';
import { LightBackdrop } from '@/components/ui/LightBackdrop';
import { LayoutTokens } from '@/constants/theme';

export default function FamilyScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated } = useAuth();
  const { profile, members, activeUser, sendFamilyPing, sendEmergencySos } = useFamily();
  const { speak } = useVoice();
  const insets = useSafeAreaInsets();

  // Modals state
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [fullMapModalVisible, setFullMapModalVisible] = useState(false);

  // Confirmation modal state for decisions/pings
  const [modalState, setModalState] = useState<{
    visible: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const handleCall = (phone: string, name: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
    speak(`Calling ${name}`);
    Linking.openURL(`tel:${phone}`).catch(() => {
      alert(`Calling ${name} at ${phone}...`);
    });
  };

  const handleAsk = (member: FamilyMember) => {
    setModalState({
      visible: true,
      title: `Send quick ping to ${member.name}?`,
      description: `Ask ${member.name}: "Hey, where are you headed and do you need anything from home?"`,
      confirmLabel: 'Send Ping',
      onConfirm: () => {
        sendFamilyPing(
          member.id,
          `Quick ping from family: Checking in on your status.`
        );
        setModalState((prev) => ({ ...prev, visible: false }));
        speak(`Ping sent to ${member.name}`);
      },
    });
  };

  // Ensure primary user is rendered if members list is empty
  const displayMembers = members.length > 0 ? members : [activeUser];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Light Mode Decorative Ambient Backdrop */}
      <LightBackdrop />

      {/* 1. Header Row: Avatar "A", Title "Family Circle", Pill Switcher, Sun, Bell, Settings */}
      <CircleHeader
        onOpenFamilySwitcher={() => setQrModalVisible(true)}
        onOpenSos={() => setSosModalVisible(true)}
        onOpenSettings={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'circle' } })}
      />


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: LayoutTokens.tabBarHeight + LayoutTokens.tabBarBottomOffset + insets.bottom + 8 }]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Safety Banner (Tappable, Chevron, Glowing green shield, Leaf accent / Dark glow) */}
        <CircleSafetyBanner
          onPress={() => setFullMapModalVisible(true)}
        />

        {/* 3. "MEMBERS & STATUS" Section Header with Pill Buttons */}
        <CircleMembersHeader
          onOpenQr={() => setQrModalVisible(true)}
          onOpenJoin={() => setJoinModalVisible(true)}
          onAddMember={() => setQrModalVisible(true)}
          onOpenSettings={() => router.push('/modal/family-settings')}
        />

        {/* 4. Member Cards (One per member, list-rendered) */}
        <View style={styles.membersListContainer}>
          {displayMembers.map((member) => (
            <CircleMemberCard
              key={member.id}
              member={member}
              onPress={() => router.push('/modal/family-settings')}
              onCall={handleCall}
              onAsk={handleAsk}
            />
          ))}
        </View>

        {/* 5. "FAMILY PLACES & PRIVACY CONTROLS" Card */}
        <CirclePlacesPrivacyCard
          onSeeMap={() => setFullMapModalVisible(true)}
          onPressPlaces={() => router.push('/modal/family-settings')}
          onPressHome={() => setFullMapModalVisible(true)}
          onPressPrivacy={() => router.push('/modal/family-settings')}
        />

        {/* 6. "LIVE FAMILY MAP" Card */}
        <CircleLiveMapCard
          onFullScreen={() => setFullMapModalVisible(true)}
        />


      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={modalState.visible}
        title={modalState.title}
        description={modalState.description}
        confirmLabel={modalState.confirmLabel}
        onConfirm={modalState.onConfirm}
        onCancel={() => setModalState((prev) => ({ ...prev, visible: false }))}
      />

      {/* Emergency SOS Modal */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        onTriggerSos={async (reason, details) => {
          await sendEmergencySos(reason, details);
        }}
      />

      {/* Family QR & Join Modals */}
      <FamilyQRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        familyCode={profile.code}
        familyName={profile.name}
      />

      <JoinFamilyModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
      />

      {/* Full Screen Live Family Map Modal */}
      <Modal
        visible={fullMapModalVisible}
        animationType="slide"
        onRequestClose={() => setFullMapModalVisible(false)}>
        <View style={[styles.fullMapScreen, { backgroundColor: isDark ? '#060B1F' : '#FBF8F6' }]}>
          <Pressable
            onPress={() => setFullMapModalVisible(false)}
            style={styles.closeFullMapBtn}>
            <View
              style={[
                styles.closeFullMapCircle,
                {
                  backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(59, 111, 240, 0.3)' : 'rgba(0,0,0,0.1)',
                },
              ]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>✕ Close Map</Text>
            </View>
          </Pressable>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <FamilyCommandCenter />
          </ScrollView>
        </View>
      </Modal>
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
    gap: 8,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  membersListContainer: {
    gap: 8,
  },
  fullMapScreen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  closeFullMapBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  closeFullMapCircle: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
});
