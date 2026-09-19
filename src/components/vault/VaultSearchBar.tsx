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
          backgroundColor: isDark ? 'rgba(15, 26, 58, 0.85)' : 'rgba(255, 255, 255, 0.78)',
          borderColor: isDark ? 'rgba(59, 111, 240, 0.28)' : 'rgba(124, 92, 224, 0.18)',
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

      {/* Mic Button with Primary Gradient (circular primary) */}
      <Button
        variant="primary"
        size="sm"
        circular
        icon="mic"
        onPress={onVoicePress}
        accessibilityLabel="Voice Search"
      />
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
});
