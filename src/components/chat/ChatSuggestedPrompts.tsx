import React from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

export interface SuggestedPromptItem {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface ChatSuggestedPromptsProps {
  prompts?: SuggestedPromptItem[];
  onSelectPrompt: (promptText: string) => void;
  collapsed?: boolean;
}

const DEFAULT_PROMPTS: SuggestedPromptItem[] = [
  { text: 'Where is everyone?', icon: 'chatbubble-ellipses-outline' },
  { text: "How is everyone's battery?", icon: 'battery-charging-outline' },
  { text: 'Are all family members safe?', icon: 'chatbubble-ellipses-outline' },
];

export const ChatSuggestedPrompts: React.FC<ChatSuggestedPromptsProps> = ({
  prompts = DEFAULT_PROMPTS,
  onSelectPrompt,
  collapsed = false,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  if (collapsed) return null;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {prompts.map((item, index) => {
        return (
          <Pressable
            key={`${item.text}-${index}`}
            onPress={() => {
              triggerHaptic();
              onSelectPrompt(item.text);
            }}
            accessibilityRole="button"
            accessibilityLabel={item.text}
            style={({ pressed }) => [
              styles.pillChip,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(124, 92, 224, 0.08)',
                borderColor: isDark
                  ? 'rgba(130, 140, 255, 0.22)'
                  : 'rgba(124, 92, 224, 0.16)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons
              name={item.icon}
              size={13}
              color={isDark ? '#8B7CF6' : '#7C5CE0'}
            />
            <Text
              style={[
                styles.pillText,
                {
                  color: colors.text,
                  fontSize: isElderly ? 14 : 12.5,
                },
              ]}>
              {item.text}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    gap: 8,
  },
  pillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  pillText: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
