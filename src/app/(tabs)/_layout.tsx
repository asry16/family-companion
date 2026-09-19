import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Text, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { BreathingGlow } from '@/components/ui/PulseRing';

export default function TabsLayout() {
  const { colors, isElderly, isDark } = useAppTheme();
  const { suggestions, tasks } = useFamily();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;
  const activeSuggestions = suggestions.filter((s) => s.status === 'active').length;

  const triggerTabHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? colors.blue : '#7C5CE0',
        tabBarInactiveTintColor: isDark ? colors.textMuted : '#7A7DB0',
        tabBarStyle: {
          display: isKeyboardVisible ? 'none' : 'flex',
          position: 'absolute',
          bottom: Platform.select({ ios: 20, default: 14 }),
          left: 14,
          right: 14,
          backgroundColor: isDark ? 'rgba(15, 26, 58, 0.88)' : 'rgba(255, 255, 255, 0.78)',
          borderColor: isDark ? 'rgba(59, 111, 240, 0.25)' : 'rgba(124, 92, 224, 0.14)',
          borderWidth: 1,
          borderRadius: 28,
          height: Platform.select({ ios: 68, default: 64 }),
          paddingBottom: Platform.select({ ios: 10, default: 8 }),
          paddingTop: 6,
          shadowColor: isDark ? colors.blue : '#6E5ADC',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 24,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: isElderly ? 12 : 10,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 2,
        },
      }}>
      {/* 1. Home Tab (Active Blue/Violet) */}
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.activePill,
                  { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(124, 92, 224, 0.12)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? (isDark ? colors.blue : '#7C5CE0') : color}
              />
            </View>
          ),
        }}
      />

      {/* 2. Family Circle Tab */}
      <Tabs.Screen
        name="family"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Circle',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.activePill,
                  { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(124, 92, 224, 0.12)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={20}
                color={focused ? (isDark ? colors.blue : '#7C5CE0') : color}
              />
            </View>
          ),
        }}
      />

      {/* 3. Center Assistant Tab (Raised Primary Gradient Orb with Sparkle Icon and Soft Violet Glow) */}
      <Tabs.Screen
        name="ai"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Assistant',
          tabBarBadge: activeSuggestions > 0 ? '•' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.purple,
            color: '#FFFFFF',
            fontSize: 10,
            minWidth: 10,
            height: 10,
            borderRadius: 5,
            top: -6,
          },
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: focused
                  ? (isDark ? colors.blue : '#7C5CE0')
                  : isDark
                  ? colors.textMuted
                  : '#7A7DB0',
                marginTop: 2,
              }}>
              Assistant
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerAssistantWrap}>
              <BreathingGlow
                color={isDark ? colors.violetOrbGlow : colors.violetOrbGlow}
                size={56}
                minOpacity={0.5}
                maxOpacity={0.9}
                duration={3000}
              />
              <LinearGradient
                colors={isDark ? ['#3B6FF0', '#7C5CE0'] : ['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.centerAssistantCircle,
                  {
                    shadowColor: isDark ? colors.blue : '#8A6BF2',
                    shadowOpacity: focused ? 0.65 : 0.40,
                    shadowRadius: 16,
                    elevation: 10,
                  },
                  focused && {
                    borderColor: '#FFFFFF',
                  },
                ]}>
                <Ionicons
                  name="sparkles"
                  size={21}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* 4. Vault / Memory Tab */}
      <Tabs.Screen
        name="memory"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.activePill,
                  { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(124, 92, 224, 0.12)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
                size={20}
                color={focused ? (isDark ? '#38BDF8' : '#7C5CE0') : color}
              />
            </View>
          ),
        }}
      />

      {/* 5. Plans & Calendar Tab */}
      <Tabs.Screen
        name="plans"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Plans',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: isDark ? '#FBBF24' : '#F59E0B',
            color: '#000000',
            fontSize: 9,
            fontWeight: '800',
            minWidth: 15,
            height: 15,
            borderRadius: 7.5,
            lineHeight: 13,
          },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.activePill,
                  { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(124, 92, 224, 0.12)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={focused ? (isDark ? colors.blue : '#7C5CE0') : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  centerAssistantWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    top: -10,
  },
  centerAssistantCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});

