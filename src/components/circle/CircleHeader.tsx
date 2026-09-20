import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { CircleTokens } from '@/constants/theme';

interface CircleHeaderProps {
  onBack?: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
}

export const CircleHeader: React.FC<CircleHeaderProps> = ({
  onBack,
  onOpenSettings,
  onOpenNotifications,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { profile, members, unreadCount } = useFamily();
  const { user } = useAuth();

  const familyName = profile?.name || user?.familyName || 'Ritu Raj\'s Family';
  const memberCount = members?.length || 1;
  const memberText = memberCount === 1 ? '1 member connected' : `${memberCount} members connected`;

  // Green dot pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(style); } catch (e) {}
    }
  };

  const handleBack = () => {
    triggerHaptic();
    if (onBack) onBack();
    else router.navigate('/(tabs)');
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 4, Platform.OS === 'ios' ? 12 : 8) }]}>
      <View style={styles.contentRow}>
        
        {/* Left: Simple Arrow Back Button */}
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.75 : 1 }]}>
          <Ionicons name="arrow-back" size={24} color="#C9CEFF" />
        </Pressable>

        {/* Center: Group Icon + Titles */}
        <View style={styles.titleCluster}>
          <View style={styles.groupIconCircle}>
            <Ionicons name="people" size={20} color="#FFFFFF" />
          </View>

          <View style={styles.textColumn}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: '#FFFFFF' }]}>
              Family Circle
            </Text>
            <View style={styles.subtitleRow}>
              <Animated.View
                style={[
                  styles.pulsingGreenDot,
                  { backgroundColor: '#10B981', opacity: pulseAnim },
                ]}
              />
              <Text numberOfLines={1} style={styles.subtitleText}>
                {familyName} • {memberText}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Icon Buttons */}
        <View style={styles.actionCluster}>
          {/* Bell with badge */}
          <Pressable onPress={onOpenNotifications || (() => router.push('/modal/notifications'))} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#C9CEFF" />
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{unreadCount > 0 ? unreadCount : 1}</Text>
            </View>
          </Pressable>

          {/* Theme Toggle */}
          <Pressable onPress={toggleTheme} style={styles.iconBtn}>
            <Ionicons name="moon" size={18} color="#C9CEFF" />
          </Pressable>

          {/* Settings Gear */}
          <Pressable onPress={onOpenSettings || (() => router.push('/modal/family-settings'))} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={18} color="#C9CEFF" />
          </Pressable>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  titleCluster: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  groupIconCircle: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2568', // matching reference color for icon bg
    borderWidth: 1,
    borderColor: 'rgba(139, 124, 246, 0.5)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B6CF0', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },
  textColumn: { flex: 1, justifyContent: 'center', gap: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulsingGreenDot: { width: 8, height: 8, borderRadius: 4 },
  subtitleText: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  actionCluster: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -2, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  badgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});
