import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { TabBarTokens } from '@/constants/theme';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { PersonalizedHeader } from '@/components/home/PersonalizedHeader';
import { FamilyCard } from '@/components/home/FamilyCard';
import { EmergencySosCard } from '@/components/home/EmergencySosCard';
import { VaultUpdatesCard } from '@/components/home/VaultUpdatesCard';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { CircleTimelineCard } from '@/components/home/CircleTimelineCard';
import { FamilyCommandCenter } from '@/components/home/FamilyCommandCenter';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LightBackdrop, DarkBackdrop } from '@/components/ui';
import { EmergencySosModal } from '@/components/modals/EmergencySosModal';
import { FamilyQRModal } from '@/components/modals/FamilyQRModal';
import { JoinFamilyModal } from '@/components/modals/JoinFamilyModal';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated } = useAuth();
  const {
    profile,
    sendEmergencySos,
  } = useFamily();

  // Modals state
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [fullMapModalVisible, setFullMapModalVisible] = useState(false);

  // Confirmation modal state for decisions
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
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}>
      {/* Ambient Backdrop (Theme-responsive) */}
      {isDark ? <DarkBackdrop /> : <LightBackdrop />}

      {/* 1. Personalized Header (Deco greeting, User avatar, Safety status, Action icons) */}
      <PersonalizedHeader
        onOpenSettings={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'home' } })}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TabBarTokens.getScrollBottomPadding(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}>

        {/* 2. Family Card (Shield icon, Family heading, Live Presence, Member avatar & status, Mini map preview, View Live Map button) */}
        <FamilyCard
          onViewLiveMap={() => {
            // Smoothly open full live map or navigate to Circle tab
            router.push('/(tabs)/family');
          }}
        />

        {/* 3. Emergency / SOS Card (Soft red/pink gradient, Need Help?, 2s Hold-to-confirm SOS button, GPS telemetry) */}
        <EmergencySosCard
          onTriggerSos={async (reason, details) => {
            await sendEmergencySos(reason, details);
          }}
          onOpenSosModal={() => setSosModalVisible(true)}
        />

        {/* 4. Quick Actions Grid (Plan, Scan, Check In, AI Brief) */}
        <QuickActionsGrid />

        {/* 5. Daily Tasks (Recent plans/tasks/reminders from the family) */}
        <VaultUpdatesCard />

        {/* 6. Activity / Timeline Card ("Today in your Circle" vertical timeline) */}
        <CircleTimelineCard />
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

      {/* Emergency SOS Presets Modal */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        onTriggerSos={async (reason, details) => {
          await sendEmergencySos(reason, details);
        }}
      />

      {/* Family QR Modal */}
      <FamilyQRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        familyCode={profile.code}
        familyName={profile.name}
      />

      {/* Join Family Modal */}
      <JoinFamilyModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
      />

      {/* Live Map Modal (keeps Live Family Map view completely intact as requested) */}
      <Modal
        visible={fullMapModalVisible}
        animationType="slide"
        onRequestClose={() => setFullMapModalVisible(false)}>
        <View style={[styles.fullMapScreen, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
          <Pressable
            onPress={() => setFullMapModalVisible(false)}
            style={styles.closeFullMapBtn}>
            <View style={[styles.closeFullMapCircle, { backgroundColor: isDark ? colors.cardBackground : '#FFFFFF', borderColor: isDark ? colors.border : 'rgba(0,0,0,0.1)' }]}>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110, // Generous padding so content is never hidden behind floating nav bar
    gap: 16,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  floatingNavSpacer: {
    height: Platform.select({ ios: 36, default: 24 }),
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
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
