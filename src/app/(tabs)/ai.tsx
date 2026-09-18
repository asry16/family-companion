import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { Header } from '@/components/ui/Header';
import { AIMessage, AIMessageItem } from '@/components/cards/AIMessage';
import { AIActionCard } from '@/services/aiService';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function AIScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isElderly } = useAppTheme();
  const {
    askFamilyAI,
    addTask,
    addReminder,
    sendFamilyPing,
    activeUser,
    members,
  } = useFamily();
  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    speak,
  } = useVoice();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState<AIMessageItem[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: 'Good evening! I am FamilyOS AI, your private family assistant. I can help coordinate schedules, find saved items, and follow up on bills and tasks.',
      highlight: 'Family system active & synced',
      timestamp: 'Just now',
    },
  ]);

  const [confirmModal, setConfirmModal] = useState<{
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

  // Handle passed initial query from home screen or voice button
  useEffect(() => {
    if (params.initialQuery && typeof params.initialQuery === 'string') {
      handleSend(params.initialQuery);
    }
  }, [params.initialQuery]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    const userMsg: AIMessageItem = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    const aiRes = askFamilyAI(query);

    const aiMsg: AIMessageItem = {
      id: `ai_${Date.now()}`,
      sender: 'assistant',
      text: aiRes.answer,
      highlight: aiRes.highlight,
      actionCard: aiRes.actionCard,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputText('');

    // Speak aloud AI response
    speak(aiRes.answer);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((result) => {
        if (result) {
          handleSend(result);
        }
      });
    }
  };

  const handleActionConfirm = (action: AIActionCard) => {
    setConfirmModal({
      visible: true,
      title: `Confirm: ${action.title}`,
      description: `FamilyOS will execute: ${action.subtitle || action.confirmLabel}. Are you sure?`,
      confirmLabel: action.confirmLabel,
      onConfirm: () => {
        if (action.type === 'call' && action.payload?.phone) {
          Linking.openURL(`tel:${action.payload.phone}`).catch(() => {
            alert(`Calling ${action.payload.phone}...`);
          });
        } else if (action.type === 'create_task' && action.payload) {
          const fallbackAssignee = members.find(m => !m.isSelf)?.id || activeUser.id;
          addTask({
            title: action.payload.title,
            category: action.payload.category || 'general',
            assignedToMemberId: action.payload.assignee || fallbackAssignee,
            createdByMemberId: activeUser.id,
            dueDate: action.payload.dueDate || 'Tomorrow',
            dueTime: action.payload.dueTime || '10:00 AM',
            isCompleted: false,
            priority: action.payload.priority || 'important',
          });
          speak('Task confirmed and added to Family Planner.');
        } else if (action.type === 'remind' && action.payload) {
          const targetMemberId = action.payload.memberId || members.find(m => !m.isSelf)?.id || activeUser.id;
          const targetMember = members.find(m => m.id === targetMemberId);
          sendFamilyPing(
            targetMemberId,
            `Reminder: Please pay pending bill of ₹${action.payload.amount}`
          );
          speak(`Reminder sent to ${targetMember?.name || 'family member'}.`);
        } else if (action.type === 'navigate') {
          router.push('/(tabs)/plans');
        }

        setConfirmModal((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const suggestedQuestions = [
    'Where is Dad?',
    'Did we pay the electricity bill?',
    'Where is Dad\'s passport?',
    'When is Mom\'s appointment?',
    'Who can pick Aman up?',
    'What do I need to do today?',
    'Remind Dad to buy vegetables tomorrow morning',
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title="FamilyOS AI" subtitle="Private embedded family intelligence" />

      {/* Suggested Questions Horizontal Bar */}
      <View
        style={[
          styles.suggestionsHeader,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.borderSubtle,
          },
        ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScroll}>
          {suggestedQuestions.map((q) => (
            <Pressable
              key={q}
              onPress={() => handleSend(q)}
              style={({ pressed }) => [
                styles.questionPill,
                {
                  backgroundColor: colors.separator,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.brandAccent} />
              <Text
                style={[
                  styles.questionText,
                  { color: colors.text, fontSize: isElderly ? 14 : 12 },
                ]}>
                {q}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Messages Scroll Feed */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}>
        {messages.map((msg) => (
          <AIMessage
            key={msg.id}
            message={msg}
            onActionConfirm={handleActionConfirm}
            onActionCancel={() => {}}
          />
        ))}
      </ScrollView>

      {/* Bottom Voice & Text Input Dock */}
      <View
        style={[
          styles.inputDock,
          {
            backgroundColor: colors.cardBackground,
            borderTopColor: colors.borderSubtle,
          },
        ]}>
        {isListening && (
          <View
            style={[
              styles.listeningWave,
              { backgroundColor: colors.redSoft, borderColor: colors.redBorder },
            ]}>
            <Ionicons name="pulse" size={18} color={colors.red} />
            <Text style={[styles.listeningText, { color: colors.red }]}>
              {transcript || 'Listening to your question...'}
            </Text>
          </View>
        )}

        <View style={styles.inputControlsRow}>
          <Pressable
            onPress={handleVoiceToggle}
            style={({ pressed }) => [
              styles.voiceMicBtn,
              {
                backgroundColor: isListening ? colors.red : colors.brand,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons
              name={isListening ? 'stop' : 'mic'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          <TextInput
            placeholder="Ask FamilyOS anything..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.separator,
                color: colors.text,
                fontSize: isElderly ? 18 : 15,
              },
            ]}
          />

          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: inputText.trim()
                  ? colors.brandAccent
                  : colors.separator,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name="arrow-up"
              size={18}
              color={inputText.trim() ? '#FFFFFF' : colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* Action Confirmation Decision Modal */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  suggestionsHeader: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  questionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  questionText: {
    fontWeight: '600',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  listeningWave: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  listeningText: {
    fontWeight: '600',
    fontSize: 13,
  },
  inputControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceMicBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
