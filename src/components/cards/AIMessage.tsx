import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useVoice } from '@/context/VoiceContext';
import { AIActionCard } from '@/services/aiService';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

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
  const { colors, isElderly } = useAppTheme();
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
          <View style={[styles.botIcon, { backgroundColor: colors.brandAccent }]}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.botName,
              { color: colors.textSecondary, fontSize: isElderly ? 15 : 12 },
            ]}>
            FamilyOS AI
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
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser
              ? isElderly
                ? '#FDE047'
                : colors.brand
              : colors.cardBackground,
            borderColor: isUser ? 'transparent' : colors.border,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
          },
        ]}>
        {message.highlight && (
          <View
            style={[
              styles.highlightPill,
              {
                backgroundColor: isElderly ? colors.separator : colors.blueSoft,
              },
            ]}>
            <Text
              style={[
                styles.highlightText,
                { color: colors.blue, fontSize: isElderly ? 14 : 12 },
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
              backgroundColor: colors.cardBackground,
              borderColor: colors.yellowBorder,
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
                { color: colors.textSecondary, fontSize: isElderly ? 15 : 13 },
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
            color: colors.textMuted,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botName: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  speakBtn: {
    padding: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  highlightPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
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
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 8,
    gap: 8,
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
  },
});
