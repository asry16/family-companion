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

interface VaultSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onVoicePress?: () => void;
}

export const VaultSearchBar: React.FC<VaultSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onVoicePress,
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
        styles.searchContainer,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.78)',
          borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(124, 92, 224, 0.18)',
          shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
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
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder="Ask e.g. 'Where is Dad's passport?' or 'Wi-Fi'"
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

      {/* Mic Button with Primary Gradient */}
      <Pressable
        onPress={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          if (onVoicePress) onVoicePress();
        }}
        hitSlop={6}
        style={({ pressed }) => [
          styles.micButton,
          {
            opacity: pressed ? 0.85 : 1,
            shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
            overflow: 'hidden',
          },
        ]}>
        <LinearGradient
          colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="mic" size={15} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
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
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
});
