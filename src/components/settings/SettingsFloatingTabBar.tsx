import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

export type SettingsTabKey = 'home' | 'circle' | 'ai' | 'vault' | 'plans';

export interface SettingsFloatingTabBarProps {
  activeTab?: SettingsTabKey;
}

export const SettingsFloatingTabBar: React.FC<SettingsFloatingTabBarProps> = ({
  activeTab = 'home',
}) => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleTabPress = (tab: SettingsTabKey) => {
    triggerHaptic();
    switch (tab) {
      case 'home':
        router.replace('/(tabs)');
        break;
      case 'circle':
        router.replace('/(tabs)/family');
        break;
      case 'ai':
        router.replace('/(tabs)/ai');
        break;
      case 'vault':
        router.replace('/(tabs)/memory');
        break;
      case 'plans':
        router.replace('/(tabs)/plans');
        break;
    }
  };

  const tabs: Array<{
    key: SettingsTabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    outlineIcon: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'home', label: 'Home', icon: 'home', outlineIcon: 'home-outline' },
    { key: 'circle', label: 'Circle', icon: 'people', outlineIcon: 'people-outline' },
    { key: 'ai', label: 'Assistant', icon: 'sparkles', outlineIcon: 'sparkles' },
    { key: 'vault', label: 'Vault', icon: 'shield-checkmark', outlineIcon: 'shield-checkmark-outline' },
    { key: 'plans', label: 'Plans', icon: 'calendar', outlineIcon: 'calendar-outline' },
  ];

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: isDark
            ? 'rgba(15, 26, 58, 0.88)'
            : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark
            ? 'rgba(59, 111, 240, 0.25)'
            : 'rgba(20, 32, 58, 0.08)',
          shadowColor: isDark ? colors.blue : '#14203A',
        },
      ]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const isAssistant = tab.key === 'ai';

        if (isAssistant) {
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress('ai')}
              accessibilityRole="tab"
              accessibilityLabel="Assistant Tab"
              accessibilityState={{ selected: isActive }}
              style={styles.tabItem}>
              {/* Center Assistant Orb (Raised Gradient Orb) */}
              <View style={styles.centerAssistantWrap}>
                <LinearGradient
                  colors={['#3B6FF0', '#7C5CE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.centerAssistantCircle,
                    isActive && {
                      borderColor: '#FFFFFF',
                      shadowColor: colors.blue,
                      shadowOpacity: 0.65,
                      shadowRadius: 16,
                      elevation: 10,
                    },
                  ]}>
                  <Ionicons name="sparkles" size={21} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? colors.blue
                      : isDark
                      ? colors.textMuted
                      : colors.textSecondary,
                    fontSize: isElderly ? 12 : 10,
                  },
                ]}>
                Assistant
              </Text>
            </Pressable>
          );
        }

        const iconName = isActive ? tab.icon : tab.outlineIcon;
        const iconColor = isActive ? colors.blue : isDark ? colors.textMuted : colors.textSecondary;

        return (
          <Pressable
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} Tab`}
            accessibilityState={{ selected: isActive }}
            style={styles.tabItem}>
            <View
              style={[
                styles.iconWrap,
                isActive && [
                  styles.activePill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(59, 111, 240, 0.20)'
                      : 'rgba(59, 111, 240, 0.10)',
                  },
                ],
              ]}>
              <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive
                    ? colors.blue
                    : isDark
                    ? colors.textMuted
                    : colors.textSecondary,
                  fontSize: isElderly ? 12 : 10,
                },
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: Platform.select({ ios: 20, default: 14 }),
    left: 14,
    right: 14,
    borderWidth: 1,
    borderRadius: 28,
    height: Platform.select({ ios: 68, default: 64 }),
    paddingBottom: Platform.select({ ios: 10, default: 8 }),
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
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
  tabLabel: {
    fontWeight: '700',
    letterSpacing: 0.1,
    marginTop: 2,
  },
});
