import React from 'react';
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
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { VoiceButton } from '@/components/ui/VoiceButton';

export const ElderlyDashboard: React.FC = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const {
    activeUser,
    members,
    events,
    reminders,
    toggleReminder,
    setSimpleMode,
  } = useFamily();
  const { startListening, speak } = useVoice();

  const handleCall = (name: string, phone: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
    speak(`Calling ${name}`);
    Linking.openURL(`tel:${phone}`).catch(() => {
      // In web simulator fallback
      alert(`Calling ${name} at ${phone}...`);
    });
  };

  const handleVoicePress = () => {
    startListening((recognizedText) => {
      if (recognizedText) {
        speak(`You asked: ${recognizedText}. All family members are safe at home and office.`);
      }
    });
  };

  const handleExitSimple = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    setSimpleMode(false);
    router.replace('/');
  };

  const todayDoctor = events.find((e) => e.category === 'doctor');
  const todayMedicine = reminders.find(
    (r) => r.category === 'medicine' && !r.isDone
  ) || reminders[0];

  const callContacts = members.length > 1
    ? members.filter((m) => !m.isSelf).slice(0, 2)
    : members.slice(0, 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#0F172A' }]}
      contentContainerStyle={styles.content}>
      {/* Header with Exit Simple Mode */}
      <View style={styles.topBar}>
        <Text style={styles.greetingTitle}>Good Evening ❤️</Text>
        <Pressable
          onPress={handleExitSimple}
          style={styles.exitPill}>
          <Text style={styles.exitText}>Standard Mode</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Your family is doing well. Here is today's care list:
      </Text>

      {/* Card 1: Doctor Consultation */}
      {todayDoctor && (
        <View style={styles.largeCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 32 }}>🩺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardCategory}>DOCTOR APPOINTMENT</Text>
              <Text style={styles.cardMainText}>
                {todayDoctor.title}
              </Text>
              <Text style={styles.cardSubText}>
                {todayDoctor.time} • {todayDoctor.location}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Card 2: Medicine Reminder */}
      {todayMedicine && (
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (e) {}
            }
            toggleReminder(todayMedicine.id);
            speak(todayMedicine.isDone ? 'Medicine reset.' : 'Medicine marked as taken. Good job!');
          }}
          style={[
            styles.largeCard,
            { borderColor: todayMedicine.isDone ? '#22C55E' : '#EAB308' },
          ]}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 32 }}>💊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardCategory}>TODAY'S MEDICINE</Text>
              <Text
                style={[
                  styles.cardMainText,
                  todayMedicine.isDone && { textDecorationLine: 'line-through' },
                ]}>
                {todayMedicine.title}
              </Text>
              <Text style={styles.cardSubText}>
                Due at {todayMedicine.time}
              </Text>
            </View>
            <View
              style={[
                styles.largeCheckButton,
                { backgroundColor: todayMedicine.isDone ? '#22C55E' : '#334155' },
              ]}>
              <Ionicons
                name="checkmark"
                size={28}
                color="#FFFFFF"
              />
            </View>
          </View>
          <Text style={styles.tapToMark}>
            {todayMedicine.isDone ? '✅ Taken' : 'Tap to mark as taken'}
          </Text>
        </Pressable>
      )}

      {/* Quick Contact Buttons */}
      <Text style={styles.sectionHeader}>CALL FAMILY</Text>
      <View style={styles.contactsGrid}>
        {callContacts.map((contact, idx) => (
          <Pressable
            key={contact.id}
            onPress={() => handleCall(contact.name, contact.phone)}
            style={styles.callCard}>
            <View style={[styles.callIconWrapper, { backgroundColor: contact.avatarColor || (idx === 0 ? '#3B82F6' : '#6366F1') }]}>
              <Ionicons name="call" size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.callName}>Call {contact.relation || 'Family'} ({contact.name})</Text>
              <Text style={styles.callSub}>{contact.humanLocation}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Giant Voice Button */}
      <View style={styles.voiceSection}>
        <VoiceButton
          variant="elderly"
          label="TALK TO FAMILYOS"
          onPress={handleVoicePress}
        />
        <Text style={styles.voiceHint}>
          Ask anything: "Where is Dad?" or "What medicine do I take?"
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 22,
    paddingBottom: 60,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  greetingTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  exitPill: {
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  exitText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 13,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 26,
    fontWeight: '500',
  },
  largeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 20,
    borderWidth: 2,
    borderColor: '#475569',
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardCategory: {
    color: '#FDE047',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardMainText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  cardSubText: {
    fontSize: 17,
    color: '#CBD5E1',
    marginTop: 4,
    fontWeight: '500',
  },
  largeCheckButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToMark: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 10,
  },
  contactsGrid: {
    gap: 12,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334155',
    gap: 14,
  },
  callIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callSub: {
    fontSize: 15,
    color: '#CBD5E1',
    marginTop: 2,
  },
  voiceSection: {
    marginTop: 18,
    gap: 10,
  },
  voiceHint: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 20,
  },
});
