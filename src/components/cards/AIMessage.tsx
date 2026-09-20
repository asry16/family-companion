import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useVoice } from '@/context/VoiceContext';
import { AIActionCard } from '@/services/aiService';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Radius } from '@/constants/theme';

export interface AIMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  highlight?: string;
  actionCard?: AIActionCard;
  timestamp: string;
}

interface AIMessageProps {
  message: AIMessageItem;
  onActionConfirm?: (action: AIActionCard) => void;
  onActionCancel?: (action: AIActionCard) => void;
}

export const AIMessage: React.FC<AIMessageProps> = ({
  message,
  onActionConfirm,
  onActionCancel,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { speak, isSpeaking, stopSpeaking } = useVoice();

  const isUser = message.sender === 'user';

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(message.text);
    }
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}>
      {!isUser && (
        <View style={styles.assistantHeader}>
          <View
            style={[
              styles.botIcon,
              {
                backgroundColor: isDark
                  ? 'rgba(139, 124, 246, 0.20)'
                  : 'rgba(124, 92, 224, 0.12)',
                borderColor: isDark
                  ? 'rgba(139, 124, 246, 0.40)'
                  : 'rgba(124, 92, 224, 0.22)',
              },
            ]}>
            <Ionicons name="sparkles" size={12} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
          </View>
          <Text
            style={[
              styles.botName,
              { color: isDark ? colors.textSecondary : colors.text, fontSize: isElderly ? 15 : 12 },
            ]}>
            Kinly AI
          </Text>
          <Pressable
            onPress={handleSpeak}
            hitSlop={8}
            style={({ pressed }) => [
              styles.speakBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}>
            <Ionicons
              name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
              size={15}
              color={isDark ? colors.textTertiary : colors.textSecondary}
            />
          </Pressable>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser
            ? {
                backgroundColor: isElderly ? '#FDE047' : undefined,
                borderBottomRightRadius: 4,
                borderBottomLeftRadius: 20,
                shadowColor: '#8A6BF2',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.35 : 0.20,
                shadowRadius: 8,
                elevation: 3,
              }
            : {
                backgroundColor: isDark
                  ? 'rgba(20, 27, 74, 0.78)'
                  : 'rgba(255, 255, 255, 0.78)',
                borderColor: isDark
                  ? 'rgba(130, 140, 255, 0.22)'
                  : 'rgba(124, 92, 224, 0.16)',
                borderWidth: 1,
                borderBottomRightRadius: 20,
                borderBottomLeftRadius: 4,
                shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 8,
                elevation: 2,
              },
        ]}>
        {isUser && !isElderly && (
          <LinearGradient
            colors={['#4F8EF7', '#8A6BF2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 20, borderBottomRightRadius: 4 }]}
          />
        )}

        {message.highlight && (
          <View
            style={[
              styles.highlightPill,
              {
                backgroundColor: isDark
                  ? 'rgba(139, 124, 246, 0.18)'
                  : 'rgba(124, 92, 224, 0.10)',
                borderColor: isDark
                  ? 'rgba(139, 124, 246, 0.35)'
                  : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Text
              style={[
                styles.highlightText,
                { color: isDark ? '#C9CEFF' : '#6D5BD0', fontSize: isElderly ? 14 : 11.5 },
              ]}>
              {message.highlight}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.messageText,
            {
              color: isUser
                ? isElderly
                  ? '#000000'
                  : '#FFFFFF'
                : colors.text,
              fontSize: isElderly ? 20 : 15,
              lineHeight: isElderly ? 28 : 22,
            },
          ]}>
          {message.text}
        </Text>
      </View>

      {message.actionCard && (
        <View
          style={[
            styles.actionCardWrapper,
            {
              backgroundColor: isDark
                ? 'rgba(20, 27, 74, 0.85)'
                : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark
                ? 'rgba(251, 191, 36, 0.40)'
                : 'rgba(245, 158, 11, 0.25)',
              shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
            },
          ]}>
          <View style={styles.actionCardHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.yellow} />
            <Text
              style={[
                styles.actionCardTitle,
                { color: colors.text, fontSize: isElderly ? 18 : 15 },
              ]}>
              {message.actionCard.title}
            </Text>
          </View>

          {message.actionCard.subtitle && (
            <Text
              style={[
                styles.actionCardSubtitle,
                { color: isDark ? colors.textMuted : colors.textSecondary, fontSize: isElderly ? 15 : 13 },
              ]}>
              {message.actionCard.subtitle}
            </Text>
          )}

          <View style={styles.actionCardButtons}>
            <PrimaryButton
              label={message.actionCard.confirmLabel}
              onPress={() => onActionConfirm && onActionConfirm(message.actionCard!)}
              size={isElderly ? 'elderly' : 'normal'}
            />
            {message.actionCard.cancelLabel && (
              <SecondaryButton
                label={message.actionCard.cancelLabel}
                onPress={() => onActionCancel && onActionCancel(message.actionCard!)}
              />
            )}
          </View>
        </View>
      )}

      <Text
        style={[
          styles.timestamp,
          {
            color: isDark ? colors.textTertiary : colors.textMuted,
            textAlign: isUser ? 'right' : 'left',
            fontSize: isElderly ? 13 : 11,
          },
        ]}>
        {message.timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    maxWidth: '88%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
  botIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botName: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  speakBtn: {
    padding: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  highlightPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  highlightText: {
    fontWeight: '700',
  },
  messageText: {
    letterSpacing: -0.1,
  },
  actionCardWrapper: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 8,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCardTitle: {
    fontWeight: '700',
  },
  actionCardSubtitle: {
    lineHeight: 18,
  },
  actionCardButtons: {
    gap: 8,
    marginTop: 4,
  },
  timestamp: {
    marginTop: 4,
    marginHorizontal: 6,
    fontWeight: '500',
  },
});
