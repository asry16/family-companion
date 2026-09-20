import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
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
  value, onChangeText, onSubmit, onVoicePress,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const tap = (fn: () => void) => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {} }
    fn();
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
          borderColor: isDark ? 'rgba(140,150,255,0.25)' : 'rgba(124,92,224,0.18)',
          shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
        },
      ]}>
      {/* Search icon */}
      <Ionicons
        name="search-outline"
        size={18}
        color={isDark ? '#8B7CF6' : '#7C5CE0'}
        style={styles.searchIcon}
      />

      {/* Text input */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder="Ask e.g. 'Where is Dad's passport?' or 'Wi-Fi'"
        placeholderTextColor={isDark ? '#7C84C0' : '#A0A3BD'}
        style={[styles.input, { color: colors.text, fontSize: isElderly ? 15 : 13 }]}
      />

      {/* Clear if typing */}
      {value.length > 0 && (
        <Pressable onPress={() => tap(() => onChangeText(''))} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={isDark ? colors.textMuted : '#A0A3BD'} />
        </Pressable>
      )}

      {/* Gradient mic button */}
      <Pressable
        onPress={() => tap(() => onVoicePress?.())}
        hitSlop={6}
        style={({ pressed }) => [styles.micBtn, { opacity: pressed ? 0.8 : 1 }]}>
        <LinearGradient
          colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="mic" size={15} color="#FFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14, paddingRight: 8,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderRadius: 26,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { flexShrink: 0 },
  input: { flex: 1, fontWeight: '500', paddingVertical: 0 },
  micBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
    shadowColor: '#8A6BF2', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 5, elevation: 3,
  },
});
