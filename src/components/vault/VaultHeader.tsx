import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';

interface VaultHeaderProps {
  onOpenSettings?: () => void;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { unreadCount } = useFamily();

  const tap = (fn: () => void, style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(style); } catch (_) {} }
    fn();
  };

  const iconBtnStyle = {
    backgroundColor: isDark ? 'rgba(30, 36, 68, 0.65)' : 'rgba(255, 255, 255, 0.85)',
    borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.18)',
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 2, Platform.OS === 'ios' ? 12 : 8) }]}>
      <View style={styles.row}>

        {/* Shield + Title */}
        <View style={styles.left}>
          <LinearGradient
            colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.shieldGradient}>
            <Ionicons name="shield-checkmark" size={21} color="#FFFFFF" />
          </LinearGradient>

          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Vault</Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Your family's shared space
            </Text>
          </View>
        </View>

        {/* Right icon buttons */}
        <View style={styles.right}>
          {/* Theme toggle */}
          <Pressable
            hitSlop={6}
            onPress={() => tap(toggleTheme)}
            style={({ pressed }) => [styles.iconBtn, iconBtnStyle, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={isDark ? '#FBBF24' : '#7C5CE0'} />
          </Pressable>

          {/* Bell */}
          <Pressable
            hitSlop={6}
            onPress={() => tap(() => router.push('/modal/notifications'))}
            style={({ pressed }) => [styles.iconBtn, iconBtnStyle, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="notifications-outline" size={16} color={isDark ? '#C9CEFF' : '#7C5CE0'} />
            <View style={[styles.badge, { borderColor: isDark ? '#141828' : '#FFFFFF' }]}>
              <Text style={styles.badgeTxt}>{unreadCount > 0 ? Math.min(unreadCount, 9) : 1}</Text>
            </View>
          </Pressable>

          {/* Settings */}
          <Pressable
            hitSlop={6}
            onPress={() => tap(() => onOpenSettings ? onOpenSettings() : router.push('/modal/family-settings'))}
            style={({ pressed }) => [styles.iconBtn, iconBtnStyle, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="settings-outline" size={16} color={isDark ? '#C9CEFF' : '#7C5CE0'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  shieldGradient: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8A6BF2', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  titleBlock: { flex: 1, gap: 1 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -3, right: -3,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: '#FF4D7A', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5,
  },
  badgeTxt: { color: '#FFF', fontSize: 8, fontWeight: '800' },
});
