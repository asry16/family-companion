import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/ui/Header';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SuggestionCard } from '@/components/cards/SuggestionCard';
import { TaskCard } from '@/components/cards/TaskCard';
import { EventCard } from '@/components/cards/EventCard';
import { VoiceButton } from '@/components/ui/VoiceButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EmergencySosModal } from '@/components/modals/EmergencySosModal';
import { FamilyQRModal } from '@/components/modals/FamilyQRModal';
import { JoinFamilyModal } from '@/components/modals/JoinFamilyModal';
import { FamilyCommandCenter } from '@/components/home/FamilyCommandCenter';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const { isAuthenticated } = useAuth();
  const {
    profile,
    members,
    tasks,
    events,
    suggestions,
    toggleTask,
    acceptSuggestion,
    dismissSuggestion,
    sendFamilyPing,
    sendEmergencySos,
  } = useFamily();
  const { startListening, speak } = useVoice();
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  // Confirmation modal state for user decision
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

  const activeSuggestions = suggestions.filter((s) => s.status === 'active');
  const otherMembers = members.filter((m) => !m.isSelf);
  const todayEvents = events.slice(0, 2);
  const pendingTasks = tasks.filter((t) => !t.isCompleted);

  // Helper for haptics
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleVoiceTrigger = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    startListening((text) => {
      if (text) {
        speak(`FamilyOS processing: ${text}`);
        router.push({ pathname: '/(tabs)/ai', params: { initialQuery: text } });
      }
    });
  };

  const handleAskMember = (suggestion: any) => {
    setModalState({
      visible: true,
      title: `Send request to ${suggestion.primaryPayload?.taskTitle || 'Family Member'}?`,
      description: `FamilyOS will dispatch: "${suggestion.primaryPayload?.message}"`,
      confirmLabel: 'Yes, Send Now',
      onConfirm: () => {
        acceptSuggestion(suggestion.id);
        setModalState((prev) => ({ ...prev, visible: false }));
        speak('Request sent to your family member.');
      },
    });
  };

  const handlePingMember = (member: any) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setModalState({
      visible: true,
      title: `Send status check to ${member.name}?`,
      description: `Send a lightweight ping: "Hey, checking in! Do you need anything before heading home?"`,
      confirmLabel: 'Send Ping',
      onConfirm: () => {
        sendFamilyPing(member.id, 'Status check from family circle.');
        setModalState((prev) => ({ ...prev, visible: false }));
        speak(`Ping sent to ${member.name}`);
      },
    });
  };

  // Safe count
  const safeCount = members.filter((m) => m.availability !== 'offline').length;
  const inTransitCount = members.filter((m) => m.availability === 'in_transit').length;
  const homeCount = members.filter((m) => m.humanLocation?.toLowerCase().includes('home')).length;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ========================================================================= */}
        {/* HERO WIDGET: FAMILY PULSE (Ambient Glass Card)                            */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.heroPulseCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.heroTopRow}>
            <View style={styles.pulseIndicatorRow}>
              <View style={[styles.beaconOuter, { backgroundColor: colors.greenSoft }]}>
                <View style={[styles.beaconInner, { backgroundColor: colors.green }]} />
              </View>
              <View>
                <Text style={[styles.pulseHeading, { color: colors.text, fontSize: isElderly ? 18 : 15 }]}>
                  {safeCount} of {members.length} Members Safe
                </Text>
                <Text style={[styles.pulseSub, { color: colors.textSecondary }]}>
                  Private Vault Synced • Live Presence Active
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/(tabs)/family')}
              style={({ pressed }) => [
                styles.mapShortcutBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Ionicons name="map-outline" size={14} color={colors.brandAccent} />
              <Text style={[styles.mapShortcutText, { color: colors.brandAccent }]}>
                Map
              </Text>
            </Pressable>
          </View>

          {/* Quick Snapshot Metrics */}
          <View style={styles.snapshotMetricsRow}>
            <View
              style={[
                styles.snapshotPill,
                { backgroundColor: colors.greenSoft, borderColor: colors.greenBorder },
              ]}>
              <Ionicons name="home" size={12} color={colors.green} />
              <Text style={[styles.snapshotPillText, { color: colors.green }]}>
                {homeCount} at Home
              </Text>
            </View>

            {inTransitCount > 0 && (
              <View
                style={[
                  styles.snapshotPill,
                  { backgroundColor: colors.yellowSoft, borderColor: colors.yellowBorder },
                ]}>
                <Ionicons name="car" size={12} color={colors.yellow} />
                <Text style={[styles.snapshotPillText, { color: colors.yellow }]}>
                  {inTransitCount} In Transit
                </Text>
              </View>
            )}

            {todayEvents.length > 0 && (
              <View
                style={[
                  styles.snapshotPill,
                  { backgroundColor: colors.blueSoft, borderColor: colors.blueBorder },
                ]}>
                <Ionicons name="time-outline" size={12} color={colors.blue} />
                <Text style={[styles.snapshotPillText, { color: colors.blue }]}>
                  Next: {todayEvents[0].time}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* EMERGENCY SOS QUICK BROADCAST BAR                                         */}
        {/* ========================================================================= */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch (e) {}
            }
            setSosModalVisible(true);
          }}
          accessibilityLabel="Trigger Emergency SOS"
          style={({ pressed }) => [
            styles.homeSosTriggerBar,
            {
              backgroundColor: colors.red + '15',
              borderColor: colors.red + '40',
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <View style={[styles.homeSosIconWrap, { backgroundColor: colors.red }]}>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.homeSosTitle, { color: colors.red }]}>
              🚨 Emergency SOS Broadcast
            </Text>
            <Text style={[styles.homeSosSub, { color: colors.textSecondary }]}>
              Instant alarm & live GPS location broadcast to entire family
            </Text>
          </View>
          <View style={[styles.homeSosBtnPill, { backgroundColor: colors.red }]}>
            <Text style={styles.homeSosBtnPillText}>SOS</Text>
          </View>
        </Pressable>

        {/* ========================================================================= */}
        {/* EXECUTIVE QUICK ACTION DOCK                                               */}
        {/* ========================================================================= */}
        <View style={styles.quickActionDock}>
          <Pressable
            onPress={() => router.push('/modal/new-plan')}
            style={({ pressed }) => [
              styles.dockPill,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <View style={[styles.dockIconCircle, { backgroundColor: colors.blueSoft }]}>
              <Ionicons name="add" size={16} color={colors.blue} />
            </View>
            <Text style={[styles.dockLabel, { color: colors.text }]}>Add Plan</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/modal/scan-document')}
            style={({ pressed }) => [
              styles.dockPill,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <View style={[styles.dockIconCircle, { backgroundColor: colors.greenSoft }]}>
              <Ionicons name="scan-outline" size={15} color={colors.green} />
            </View>
            <Text style={[styles.dockLabel, { color: colors.text }]}>Scan Doc</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/family')}
            style={({ pressed }) => [
              styles.dockPill,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <View style={[styles.dockIconCircle, { backgroundColor: colors.yellowSoft }]}>
              <Ionicons name="navigate-outline" size={15} color={colors.yellow} />
            </View>
            <Text style={[styles.dockLabel, { color: colors.text }]}>Check In</Text>
          </Pressable>

          <Pressable
            onPress={handleVoiceTrigger}
            style={({ pressed }) => [
              styles.dockPill,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <View style={[styles.dockIconCircle, { backgroundColor: colors.brandSoft }]}>
              <Ionicons name="sparkles" size={15} color={colors.brandAccent} />
            </View>
            <Text style={[styles.dockLabel, { color: colors.text }]}>AI Brief</Text>
          </Pressable>
        </View>

        {/* ========================================================================= */}
        {/* FAMILY COMMAND CENTER: LIVE CIRCLE + STATUS + LIVE FAMILY MAP + BOTTOM SHEET */}
        {/* ========================================================================= */}
        <FamilyCommandCenter />

        {/* ========================================================================= */}
        {/* SECTION 3: PROACTIVE AI MORNING BRIEF / DECISION CARD                     */}
        {/* ========================================================================= */}
        {activeSuggestions.length > 0 && (
          <View style={styles.suggestionWrap}>
            <SuggestionCard
              suggestion={activeSuggestions[0]}
              onAccept={() => handleAskMember(activeSuggestions[0])}
              onDismiss={() => dismissSuggestion(activeSuggestions[0].id)}
            />
          </View>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: TODAY'S TIMELINE & SCHEDULE                                    */}
        {/* ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderTitleBlock}>
            <Ionicons name="calendar-outline" size={16} color={colors.brandAccent} />
            <Text
              style={[
                styles.sectionHeaderTitle,
                { color: colors.text, fontSize: isElderly ? 19 : 15 },
              ]}>
              TODAY'S SCHEDULE & PLANS
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/modal/new-plan')}
            hitSlop={8}
            style={styles.addPlanHeaderBtn}>
            <Ionicons name="add-circle" size={16} color={colors.brandAccent} />
            <Text style={[styles.addPlanHeaderText, { color: colors.brandAccent }]}>
              + Plan
            </Text>
          </Pressable>
        </View>

        {/* Schedule Events */}
        {todayEvents.map((evt) => (
          <EventCard
            key={evt.id}
            event={evt}
            onPress={() => router.push('/(tabs)/plans')}
          />
        ))}

        {/* Priority Tasks */}
        {pendingTasks.slice(0, 3).map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onToggle={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              toggleTask(t.id);
            }}
          />
        ))}

        {/* Bottom Floating Voice Assistant Dock */}
        <View style={styles.bottomVoiceDock}>
          <VoiceButton
            onPress={handleVoiceTrigger}
            label="Ask FamilyOS Assistant"
          />
        </View>
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

      {/* Emergency SOS & QR Modals */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        onTriggerSos={async (reason, details) => {
          await sendEmergencySos(reason, details);
        }}
      />
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
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Hero Pulse
  heroPulseCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulseIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  beaconOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pulseHeading: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pulseSub: {
    fontSize: 11,
    marginTop: 1,
  },
  mapShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  mapShortcutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  snapshotMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  snapshotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  snapshotPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Quick Action Dock
  quickActionDock: {
    flexDirection: 'row',
    gap: 10,
  },
  dockPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  dockIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeaderTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSeeAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  addPlanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPlanHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Presence Carousel
  presenceScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  presenceCard: {
    width: 128,
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 30,
    borderWidth: 2,
    position: 'relative',
  },
  transitMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  presenceAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceStatusRing: {
    padding: 3,
    borderRadius: 32,
    borderWidth: 2,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  presenceName: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  presenceLocation: {
    textAlign: 'center',
    fontWeight: '500',
  },
  presenceRelation: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -4,
  },
  presenceLocationWrap: {
    marginVertical: 1,
  },
  presencePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 2,
  },
  presencePhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  presencePhoneText: {
    fontSize: 9,
    fontWeight: '700',
  },
  quickPingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  quickPingText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Suggestion
  suggestionWrap: {
    marginVertical: 2,
  },

  // Voice Dock
  bottomVoiceDock: {
    marginTop: 8,
  },
  addMemberPresenceCard: {
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  addMemberIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addMemberTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
  addMemberSub: {
    textAlign: 'center',
    lineHeight: 15,
  },
  familySetupBanner: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 4,
    gap: 12,
  },
  familySetupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  familySetupIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familySetupTitle: {
    fontWeight: '800',
  },
  familySetupSub: {
    marginTop: 2,
    lineHeight: 18,
  },
  familySetupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  familySetupBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  homeSosTriggerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 6,
    marginBottom: 4,
  },
  homeSosIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeSosTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  homeSosSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  homeSosBtnPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  homeSosBtnPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  familySetupBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  familySetupSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  familySetupSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
