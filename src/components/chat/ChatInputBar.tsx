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
import { Button } from '@/components/ui';

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

      {/* Circular Send Button: Primary Circular */}
      <Button
        variant="primary"
        size="sm"
        circular
        icon="arrow-up"
        disabled={!canSend}
        onPress={handleSendPress}
        accessibilityLabel="Send message"
      />
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
});
