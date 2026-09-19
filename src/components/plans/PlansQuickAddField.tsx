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

export interface PlansQuickAddFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onVoicePress?: () => void;
  placeholder?: string;
  isListening?: boolean;
}

export const PlansQuickAddField: React.FC<PlansQuickAddFieldProps> = ({
  value,
  onChangeText,
  onSubmit,
  onVoicePress,
  placeholder = 'Add a task or say a reminder…',
  isListening = false,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(15, 26, 58, 0.85)' : 'rgba(255, 255, 255, 0.78)',
          borderColor: isListening
            ? colors.red
            : isDark
            ? 'rgba(59, 111, 240, 0.28)'
            : 'rgba(124, 92, 224, 0.18)',
          shadowColor: isDark ? colors.blue : '#6E5ADC',
        },
      ]}>
      {/* Search Icon */}
      <Ionicons
        name="search-outline"
        size={19}
        color={isDark ? colors.textMuted : '#6D5BD0'}
        style={styles.searchIcon}
      />

      {/* Input Field */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          if (onSubmit) onSubmit();
        }}
        returnKeyType="done"
        placeholder={placeholder}
        placeholderTextColor={isDark ? colors.textMuted : colors.textSecondary}
        style={[
          styles.textInput,
          {
            color: colors.text,
            fontSize: isElderly ? 16 : 13.5,
          },
        ]}
      />

      {/* Clear Text Button if input not empty */}
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            triggerHaptic();
            onChangeText('');
          }}
          hitSlop={8}
          style={styles.clearBtn}>
          <Ionicons
            name="close-circle"
            size={16}
            color={isDark ? colors.textMuted : colors.textSecondary}
          />
        </Pressable>
      )}

      {/* Mic Button for Voice Input (circular primary) */}
      <Button
        variant={isListening ? 'danger' : 'primary'}
        size="sm"
        circular
        icon={isListening ? 'mic' : 'mic-outline'}
        onPress={onVoicePress}
        accessibilityLabel="Voice Input"
      />
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: {
    marginLeft: 2,
  },
  textInput: {
    flex: 1,
    fontWeight: '500',
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 2,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
});
