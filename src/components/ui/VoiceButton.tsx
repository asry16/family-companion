import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useVoice } from '@/context/VoiceContext';

interface VoiceButtonProps {
  onPress: () => void;
  label?: string;
  variant?: 'floating' | 'docked' | 'elderly';
  style?: ViewStyle;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress,
  label = 'Ask FamilyOS',
  variant = 'docked',
  style,
}) => {
  const { colors, isElderly } = useAppTheme();
  const { isListening } = useVoice();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
    }
    onPress();
  };

  const isElderlyMode = variant === 'elderly' || isElderly;

  if (isElderlyMode) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.elderlyButton,
          {
            backgroundColor: isListening ? colors.red : '#FDE047',
            borderColor: '#FFFFFF',
            opacity: pressed ? 0.9 : 1,
          },
          style,
        ]}>
        <Ionicons
          name={isListening ? 'radio' : 'mic'}
          size={32}
          color={isListening ? '#FFFFFF' : '#000000'}
        />
        <Text
          style={[
            styles.elderlyText,
            { color: isListening ? '#FFFFFF' : '#000000' },
          ]}>
          {isListening ? 'LISTENING...' : 'TALK TO FAMILYOS'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.dockedButton,
        {
          backgroundColor: isListening ? colors.red : colors.brand,
          borderColor: isListening ? colors.redBorder : colors.border,
          shadowColor: colors.brandAccent,
          opacity: pressed ? 0.88 : 1,
        },
        style,
      ]}>
      <View
        style={[
          styles.micCircle,
          {
            backgroundColor: isListening
              ? 'rgba(255, 255, 255, 0.25)'
              : colors.brandAccent,
          },
        ]}>
        <Ionicons
          name={isListening ? 'pulse' : 'mic'}
          size={18}
          color="#FFFFFF"
        />
      </View>
      <Text style={styles.dockedText}>
        {isListening ? 'Listening to you...' : label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  dockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    gap: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  micCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  elderlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 14,
    borderWidth: 3,
    minHeight: 74,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  elderlyText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
