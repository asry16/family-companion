import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { Header } from '@/components/ui/Header';
import { FamilyMemberCard } from '@/components/cards/FamilyMemberCard';
import { StylizedFamilyMap } from '@/components/location/StylizedFamilyMap';
import { LiveFamilyMap } from '@/components/location/LiveFamilyMap';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function FamilyScreen() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const { profile, members, sendFamilyPing } = useFamily();
  const { speak } = useVoice();

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

  const handleCall = (name: string, phone: string) => {
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

  const handleAsk = (member: any) => {
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

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Family Circle"
        subtitle={`${profile.name} • ${members.length} members connected`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Family Circle Summary Bar */}
        <View
          style={[
            styles.safetyBanner,
            {
              backgroundColor: colors.greenSoft,
              borderColor: colors.greenBorder,
            },
          ]}>
          <View style={styles.safetyIcon}>
            <Ionicons name="shield-checkmark" size={20} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.safetyTitle,
                { color: colors.green, fontSize: isElderly ? 18 : 14 },
              ]}>
              ALL FAMILY MEMBERS SAFE
            </Text>
            <Text
              style={[
                styles.safetySub,
                { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
              ]}>
              {members.length} active family members • Location encrypted
            </Text>
          </View>
        </View>

        {/* Members Roster */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: isElderly ? 20 : 16 },
            ]}>
            MEMBERS & STATUS
          </Text>
          <View style={styles.headerActionsRow}>
            <Pressable
              onPress={() => router.push('/modal/family-settings')}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="person-add" size={12} color="#FFFFFF" />
              <Text style={styles.actionPillText}>Add Member</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/modal/family-settings')}
              style={({ pressed }) => [
                styles.iconActionBtn,
                {
                  backgroundColor: colors.separator,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="settings-outline" size={15} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {members.map((member) => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            onPress={() => router.push('/modal/family-settings')}
            onCall={() => handleCall(member.name, member.phone)}
            onPing={() => handleAsk(member)}
          />
        ))}

        {/* Real-Time Live Family Map Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: isElderly ? 20 : 16 },
            ]}>
            LIVE FAMILY MAP & PINS
          </Text>
        </View>

        <LiveFamilyMap />

        {/* Privacy Places & Check-In */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: isElderly ? 20 : 16 },
            ]}>
            FAMILY PLACES & PRIVACY CONTROLS
          </Text>
        </View>

        <StylizedFamilyMap />

        {/* Emergency Family Broadcast Alert Button */}
        <Pressable
          onPress={() => {
            setModalState({
              visible: true,
              title: 'Send Emergency Family Ping?',
              description:
                'This will alert all 5 family members with your live location and highest priority notification.',
              confirmLabel: 'Confirm Family Alert',
              onConfirm: () => {
                setModalState((prev) => ({ ...prev, visible: false }));
                speak('Family safety alert dispatched.');
              },
            });
          }}
          style={({ pressed }) => [
            styles.emergencyButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="radio-outline" size={18} color={colors.red} />
          <Text style={[styles.emergencyText, { color: colors.red }]}>
            Discreet Family Check-In Alert
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmationModal
        visible={modalState.visible}
        title={modalState.title}
        description={modalState.description}
        confirmLabel={modalState.confirmLabel}
        onConfirm={modalState.onConfirm}
        onCancel={() => setModalState((prev) => ({ ...prev, visible: false }))}
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  safetyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTitle: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  safetySub: {
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  emergencyText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
