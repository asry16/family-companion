import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { ChatMessageItem } from '@/services/chat.service';
import { ChatRichCard } from './ChatRichCard';

export interface ChatMessageBubbleProps {
  message: ChatMessageItem;
  onSpeak?: (text: string) => void;
  onActionPress?: () => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onSpeak,
  onActionPress,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const isUser = message.sender === 'user';

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        {/* User Right-Aligned Blue/Violet Gradient Bubble */}
        <LinearGradient
          colors={isDark ? ['#3B6FF0', '#2563EB'] : ['#4F8EF7', '#8A6BF2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.userBubble,
            {
              shadowColor: isDark ? '#3B6FF0' : '#6E5ADC',
            },
          ]}>
          <Text
            style={[
              styles.userText,
              { fontSize: isElderly ? 16.5 : 14 },
            ]}>
            {message.text}
          </Text>
        </LinearGradient>

        {/* Timestamp */}
        <Text
          style={[
            styles.timestampRight,
            { color: isDark ? colors.textMuted : colors.textSecondary },
          ]}>
          {message.timestamp}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.assistantContainer}>
      {/* Assistant Message Header: Sparkle Avatar + "Kinly AI" + Speaker Button */}
      <View style={styles.assistantHeader}>
        <View style={styles.assistantLeftHeader}>
          {/* Violet/Blue Sparkle Avatar */}
          <View
            style={[
              styles.sparkleAvatar,
              {
                backgroundColor: isDark ? '#1E293B' : '#F3F0FC',
                borderColor: isDark ? 'rgba(59, 111, 240, 0.40)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Ionicons
              name="sparkles"
              size={12}
              color={isDark ? '#38BDF8' : '#7C5CE0'}
            />
          </View>
          <Text style={[styles.assistantName, { color: colors.text }]}>
            Kinly AI
          </Text>
        </View>

        {/* Speaker Icon Button (Reads message aloud) */}
        {onSpeak && (
          <Pressable
            onPress={() => {
              triggerHaptic();
              onSpeak(message.text);
            }}
            hitSlop={8}
            accessibilityLabel="Read message aloud"
            style={({ pressed }) => [
              styles.speakerButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 92, 224, 0.08)',
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <Ionicons
              name="volume-high-outline"
              size={14}
              color={isDark ? colors.textMuted : '#6D5BD0'}
            />
          </Pressable>
        )}
      </View>

      {/* Assistant Bubble: Soft Tinted Container */}
      <View
        style={[
          styles.assistantBubble,
          {
            backgroundColor: isDark
              ? 'rgba(15, 26, 58, 0.85)'
              : 'rgba(255, 255, 255, 0.75)',
            borderColor: isDark
              ? 'rgba(59, 111, 240, 0.25)'
              : 'rgba(124, 92, 224, 0.14)',
          },
        ]}>
        {/* Top Pill: "The A Family • Active & Synced" */}
        {message.highlight && (
          <View
            style={[
              styles.highlightPill,
              {
                backgroundColor: isDark
                  ? 'rgba(59, 111, 240, 0.20)'
                  : 'rgba(124, 92, 224, 0.08)',
                borderColor: isDark
                  ? 'rgba(59, 111, 240, 0.40)'
                  : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <Text
              style={[
                styles.highlightText,
                { color: isDark ? '#38BDF8' : '#7C5CE0' },
              ]}>
              {message.highlight}
            </Text>
          </View>
        )}

        {/* Message Text */}
        <Text
          style={[
            styles.assistantText,
            {
              color: colors.text,
              fontSize: isElderly ? 16.5 : 14,
            },
          ]}>
          {message.text}
        </Text>

        {/* Embedded Rich Card (Locations, Batteries, Safety) */}
        {message.richCard && (
          <ChatRichCard cardData={message.richCard} onActionPress={onActionPress} />
        )}
      </View>

      {/* Timestamp */}
      <Text
        style={[
          styles.timestampLeft,
          { color: isDark ? colors.textMuted : colors.textSecondary },
        ]}>
        {message.timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  userContainer: {
    marginVertical: 6,
    alignItems: 'flex-end',
    paddingLeft: 40,
  },
  userBubble: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
    shadowColor: '#3B6FF0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 20,
  },
  timestampRight: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    marginRight: 4,
  },
  assistantContainer: {
    marginVertical: 6,
    alignItems: 'flex-start',
    paddingRight: 10,
    width: '100%',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  assistantLeftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkleAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  speakerButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantBubble: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    gap: 10,
  },
  highlightPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  assistantText: {
    fontWeight: '500',
    lineHeight: 21,
  },
  timestampLeft: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
});
