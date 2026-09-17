import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';

export default function TabsLayout() {
  const { colors, isElderly } = useAppTheme();
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
        tabBarActiveTintColor: colors.brandAccent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.select({ ios: 84, android: 68, default: 68 }),
          paddingBottom: Platform.select({ ios: 24, android: 10, default: 10 }),
          paddingTop: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: isElderly ? 13 : 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}>
      {/* Home Tab */}
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
                  { backgroundColor: colors.brandAccent + '14' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={isElderly ? 24 : 21}
                color={focused ? colors.brandAccent : color}
              />
            </View>
          ),
        }}
      />

      {/* Family Circle Tab */}
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
                  { backgroundColor: colors.brandAccent + '14' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={isElderly ? 24 : 21}
                color={focused ? colors.brandAccent : color}
              />
            </View>
          ),
        }}
      />

      {/* Plans & Calendar Tab */}
      <Tabs.Screen
        name="plans"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Plans',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.yellow,
            color: '#000000',
            fontSize: 10,
            fontWeight: '800',
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 14,
          },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && [
                  styles.activePill,
                  { backgroundColor: colors.brandAccent + '14' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={isElderly ? 24 : 21}
                color={focused ? colors.brandAccent : color}
              />
            </View>
          ),
        }}
      />

      {/* Vault / Memory Tab */}
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
                  { backgroundColor: colors.brandAccent + '14' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
                size={isElderly ? 24 : 21}
                color={focused ? colors.brandAccent : color}
              />
            </View>
          ),
        }}
      />

      {/* AI Assistant Tab (Luxury Sparkle Highlight) */}
      <Tabs.Screen
        name="ai"
        listeners={{
          tabPress: triggerTabHaptic,
        }}
        options={{
          title: 'Assistant',
          tabBarBadge: activeSuggestions > 0 ? '•' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.brandAccent,
            color: '#FFFFFF',
            fontSize: 12,
            minWidth: 12,
            height: 12,
            borderRadius: 6,
          },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.aiTabWrap,
                {
                  backgroundColor: focused
                    ? colors.brandAccent
                    : colors.brandAccent + '18',
                },
              ]}>
              <Ionicons
                name="sparkles"
                size={18}
                color={focused ? '#FFFFFF' : colors.brandAccent}
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  aiTabWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
