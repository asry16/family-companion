import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';

export default function TabsLayout() {
  const { colors, isElderly, isDark } = useAppTheme();
  const { suggestions, tasks } = useFamily();

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
        tabBarActiveTintColor: isDark ? '#38BDF8' : colors.brandAccent,
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.select({ ios: 20, default: 14 }),
          left: 14,
          right: 14,
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(0, 0, 0, 0.08)',
          borderWidth: 1,
          borderRadius: 28,
          height: Platform.select({ ios: 68, default: 64 }),
          paddingBottom: Platform.select({ ios: 10, default: 8 }),
          paddingTop: 6,
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.45 : 0.08,
          shadowRadius: 18,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: isElderly ? 12 : 10,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 2,
        },
      }}>
      {/* 1. Home Tab */}
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
                  { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.1)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? (isDark ? '#38BDF8' : colors.brandAccent) : color}
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
                  { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.1)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={20}
                color={focused ? (isDark ? '#38BDF8' : colors.brandAccent) : color}
              />
            </View>
          ),
        }}
      />

      {/* 3. Center Assistant Tab (Elevated, Larger with Glowing Blue/Purple) */}
      <Tabs.Screen
        name="ai"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Assistant',
          tabBarBadge: activeSuggestions > 0 ? '•' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: isDark ? '#38BDF8' : '#2563EB',
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
                fontWeight: '800',
                color: focused
                  ? isDark
                    ? '#C084FC'
                    : '#7C3AED'
                  : isDark
                  ? '#94A3B8'
                  : '#64748B',
                marginTop: 1,
              }}>
              Assistant
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerAssistantWrap}>
              <LinearGradient
                colors={
                  focused
                    ? ['#38BDF8', '#8B5CF6']
                    : isDark
                    ? ['rgba(56, 189, 248, 0.28)', 'rgba(139, 92, 246, 0.35)']
                    : ['#EFF6FF', '#F3E8FF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.centerAssistantCircle,
                  {
                    borderColor: focused
                      ? '#FFFFFF'
                      : isDark
                      ? 'rgba(192, 132, 252, 0.4)'
                      : 'rgba(139, 92, 246, 0.25)',
                    shadowColor: isDark ? '#A855F7' : '#3B82F6',
                    shadowOpacity: focused ? 0.55 : 0.25,
                  },
                ]}>
                <Ionicons
                  name="sparkles"
                  size={19}
                  color={focused ? '#FFFFFF' : isDark ? '#C084FC' : '#7C3AED'}
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
                  { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.1)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
                size={20}
                color={focused ? (isDark ? '#38BDF8' : colors.brandAccent) : color}
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
                  { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.1)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={focused ? (isDark ? '#38BDF8' : colors.brandAccent) : color}
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
    top: -6,
  },
  centerAssistantCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
});

