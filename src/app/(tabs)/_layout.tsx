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
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: isDark ? colors.textMuted : colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.select({ ios: 20, default: 14 }),
          left: 14,
          right: 14,
          backgroundColor: isDark ? 'rgba(15, 26, 58, 0.88)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark ? 'rgba(59, 111, 240, 0.25)' : 'rgba(20, 32, 58, 0.08)',
          borderWidth: 1,
          borderRadius: 28,
          height: Platform.select({ ios: 68, default: 64 }),
          paddingBottom: Platform.select({ ios: 10, default: 8 }),
          paddingTop: 6,
          shadowColor: isDark ? colors.blue : '#14203A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.35 : 0.08,
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
      {/* 1. Home Tab (Active Blue) */}
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
                  { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(59, 111, 240, 0.10)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? colors.blue : color}
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
                  { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(59, 111, 240, 0.10)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={20}
                color={focused ? colors.blue : color}
              />
            </View>
          ),
        }}
      />

      {/* 3. Center Assistant Tab (Raised Gradient Orb Blue-to-Purple with Sparkle Icon and Soft Glow) */}
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
                  ? colors.purple
                  : isDark
                  ? colors.textMuted
                  : colors.textSecondary,
                marginTop: 2,
              }}>
              Assistant
            </Text>
          ),
          tabBarIcon: () => (
            <View style={styles.centerAssistantWrap}>
              <LinearGradient
                colors={['#3B6FF0', '#7C5CE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.centerAssistantCircle}>
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
                  { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(59, 111, 240, 0.10)' },
                ],
              ]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={focused ? colors.blue : color}
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

