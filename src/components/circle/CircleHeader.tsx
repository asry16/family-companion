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
        
        {/* Left: Circular Arrow Back Button */}
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.circularBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(140, 150, 255, 0.20)' : 'rgba(20, 32, 58, 0.08)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="arrow-back" size={20} color={isDark ? '#C9CEFF' : '#1E1B4B'} />
        </Pressable>

        {/* Center: Group Icon (Squircle) + Titles */}
        <View style={styles.titleCluster}>
          <View
            style={[
              styles.groupIconSquircle,
              {
                backgroundColor: isDark ? '#1E2568' : '#EDE9FE',
                borderColor: isDark ? 'rgba(139, 124, 246, 0.5)' : 'rgba(124, 92, 224, 0.16)',
              },
            ]}>
            <Ionicons name="people" size={20} color={isDark ? '#FFFFFF' : '#7C5CE0'} />
          </View>

          <View style={styles.textColumn}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1E1B4B' }]}>
              Family Circle
            </Text>
            <View style={styles.subtitleRow}>
              <Animated.View
                style={[
                  styles.pulsingGreenDot,
                  { backgroundColor: '#10B981', opacity: pulseAnim },
                ]}
              />
              <Text numberOfLines={1} style={[styles.subtitleText, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
                {familyName} • {memberText}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Circular Icon Action Buttons */}
        <View style={styles.actionCluster}>
          {/* Bell with badge */}
          <Pressable
            onPress={onOpenNotifications || (() => router.push('/modal/notifications'))}
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.circularBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(140, 150, 255, 0.20)' : 'rgba(20, 32, 58, 0.08)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="notifications-outline" size={19} color={isDark ? '#C9CEFF' : '#1E1B4B'} />
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{unreadCount > 0 ? unreadCount : 1}</Text>
            </View>
          </Pressable>

          {/* Theme Toggle */}
          <Pressable
            onPress={toggleTheme}
            accessibilityLabel="Toggle Theme"
            style={({ pressed }) => [
              styles.circularBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(140, 150, 255, 0.20)' : 'rgba(20, 32, 58, 0.08)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="moon" size={18} color={isDark ? '#C9CEFF' : '#1E1B4B'} />
          </Pressable>

          {/* Settings Gear */}
          <Pressable
            onPress={onOpenSettings || (() => router.push('/modal/family-settings'))}
            accessibilityLabel="Family Settings"
            style={({ pressed }) => [
              styles.circularBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(140, 150, 255, 0.20)' : 'rgba(20, 32, 58, 0.08)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="settings-outline" size={18} color={isDark ? '#C9CEFF' : '#1E1B4B'} />
          </Pressable>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circularBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  groupIconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
});
