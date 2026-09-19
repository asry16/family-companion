import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  ChatHeader,
  ChatSuggestedPrompts,
  ChatMessageBubble,
  ChatTypingIndicator,
  ChatInputBar,
  SuggestedPromptItem,
} from '@/components/chat';
import {
  ChatMessageItem,
  defaultChatService,
  IChatService,
} from '@/services/chat.service';

interface AIScreenProps {
  chatService?: IChatService;
  suggestedPrompts?: SuggestedPromptItem[];
}

export default function AIScreen({
  chatService = defaultChatService,
  suggestedPrompts,
}: AIScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, user } = useAuth();
  const { profile, members, activeUser } = useFamily();
  const { speak } = useVoice();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const familyName = profile?.name || 'The A Family';
  const userName = user?.name?.split(' ')[0] || activeUser?.name?.split(' ')[0] || 'Asmita';

  // Initial welcome message from assistant
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `${getTimeGreeting()}, ${userName}! I am Kinly AI, the family assistant for ${familyName}. I track live locations, coordinate schedules, and manage family documents and tasks.`,
      highlight: `${familyName} • Active & Synced`,
      timestamp: 'Just now',
    },
  ]);

  // Keep greeting text updated if user or family details load later
  useEffect(() => {
    if (userName) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === 'msg-welcome') {
          return [
            {
              id: 'msg-welcome',
              sender: 'assistant',
              text: `${getTimeGreeting()}, ${userName}! I am Kinly AI, the family assistant for ${familyName}. I track live locations, coordinate schedules, and manage family documents and tasks.`,
              highlight: `${familyName} • Active & Synced`,
              timestamp: 'Just now',
            },
          ];
        }
        return prev;
      });
    }
  }, [userName, familyName]);

  // Handle passed initial query param (e.g. from Home or Voice button)
  useEffect(() => {
    if (params.initialQuery && typeof params.initialQuery === 'string') {
      handleSendMessage(params.initialQuery);
    }
  }, [params.initialQuery]);

  const hasUserMessaged = messages.some((m) => m.sender === 'user');

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await chatService.sendMessage(query, {
        activeUser,
        members,
        familyName,
      });

      const assistantMessage: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        highlight: response.highlight,
        richCard: response.richCard,
        timestamp: 'Just now',
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMessage]);
      scrollToBottom();

      // Read reply aloud via voice
      speak(response.reply);
    } catch (e) {
      setIsTyping(false);
      const fallbackMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `I'm having trouble connecting right now, but your family presence remains safe and encrypted.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      scrollToBottom();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* 1. Header: Avatar 'A' with green online dot, 'Kinly AI', 'Right by your side', Theme, Bell, Settings */}
        <ChatHeader
          onOpenSettings={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'ai' } })}
        />

        {/* 2. Suggested Prompts: Horizontally scrollable row, collapses after first user message */}
        <ChatSuggestedPrompts
          prompts={suggestedPrompts}
          collapsed={hasUserMessaged}
          onSelectPrompt={(promptText) => handleSendMessage(promptText)}
        />

        {/* 3. Chat Panel: Large rounded glass card with ambient blobs */}
        <GlassCard
          borderRadius={28}
          gradient
          glowColor={isDark ? colors.blue : undefined}
          style={styles.chatCardWrapper}
          contentStyle={styles.chatCardContent}>
          {/* Ambient Background Blobs */}
          <View style={styles.ambientBlobWrap} pointerEvents="none">
            <View
              style={[
                styles.blobTopLeft,
                {
                  backgroundColor: isDark
                    ? 'rgba(59, 111, 240, 0.16)'
                    : 'rgba(59, 111, 240, 0.10)',
                },
              ]}
            />
            <View
              style={[
                styles.blobBottomRight,
                {
                  backgroundColor: isDark
                    ? 'rgba(124, 92, 224, 0.18)'
                    : 'rgba(124, 92, 224, 0.08)',
                },
              ]}
            />
          </View>

          {/* Messages Scroll List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}>
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onSpeak={(text) => speak(text)}
                onActionPress={() => router.push('/(tabs)/family')}
              />
            ))}

            {/* Animated Typing Indicator */}
            {isTyping && <ChatTypingIndicator />}

            {/* Empty Area Decorative Placeholder: Centered blue 4-point sparkle cluster */}
            {!hasUserMessaged && !isTyping && (
              <View style={styles.emptySparkleContainer}>
                <Ionicons
                  name="sparkles"
                  size={36}
                  color={isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(59, 111, 240, 0.22)'}
                />
              </View>
            )}
          </ScrollView>
        </GlassCard>

        {/* 5. Input Bar: Rounded glass pill with sparkle icon and blue circular send button */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: isKeyboardOpen
                ? Platform.OS === 'ios'
                  ? 10
                  : 8
                : Platform.select({
                    ios: Math.max(insets.bottom + 65, 84),
                    default: 76,
                  }),
            },
          ]}>
          <ChatInputBar
            value={inputText}
            onChangeText={setInputText}
            onSend={() => handleSendMessage()}
            placeholder="Ask anything…"
            disabled={isTyping}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatCardWrapper: {
    flex: 1,
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 4,
    padding: 0,
  },
  chatCardContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientBlobWrap: {
    ...StyleSheet.absoluteFill,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
    flexGrow: 1,
  },
  emptySparkleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    opacity: 0.85,
  },
  inputContainer: {
    paddingTop: 2,
  },
});
