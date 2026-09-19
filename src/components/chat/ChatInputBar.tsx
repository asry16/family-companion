import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

export interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = 'Ask anything…',
  disabled = false,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const canSend = !disabled && value.trim().length > 0;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleSendPress = () => {
    if (!canSend) return;
    triggerHaptic();
    onSend();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(15, 26, 58, 0.88)'
            : 'rgba(255, 255, 255, 0.78)',
          borderColor: isDark
            ? 'rgba(59, 111, 240, 0.28)'
            : 'rgba(124, 92, 224, 0.18)',
          shadowColor: isDark ? colors.blue : '#6E5ADC',
        },
      ]}>
      {/* Sparkle Icon */}
      <Ionicons
        name="sparkles"
        size={18}
        color={isDark ? '#38BDF8' : '#7C5CE0'}
        style={styles.sparkleIcon}
      />

      {/* Input Field */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={handleSendPress}
        returnKeyType="send"
        placeholder={placeholder}
        placeholderTextColor={isDark ? colors.textMuted : colors.textSecondary}
        style={[
          styles.textInput,
          {
            color: colors.text,
            fontSize: isElderly ? 16 : 14,
          },
        ]}
      />

      {/* Circular Send Button */}
      <Pressable
        onPress={handleSendPress}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: canSend
              ? isDark
                ? colors.blue
                : undefined
              : isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(124, 92, 224, 0.08)',
            opacity: !canSend ? 0.45 : pressed ? 0.85 : 1,
            shadowColor: isDark ? colors.blue : '#6E5ADC',
            overflow: 'hidden',
          },
        ]}>
        {!isDark && canSend && (
          <LinearGradient
            colors={['#4F8EF7', '#8A6BF2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Ionicons
          name="arrow-up"
          size={18}
          color={canSend ? (isDark ? '#000000' : '#FFFFFF') : colors.textMuted}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  sparkleIcon: {
    marginLeft: 2,
  },
  textInput: {
    flex: 1,
    fontWeight: '500',
    paddingVertical: 6,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
});
