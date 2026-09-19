import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Keyboard,
  Animated,
  AccessibilityInfo,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { TabBarTokens } from '@/constants/theme';

export type TabKey = 'home' | 'circle' | 'ai' | 'vault' | 'plans';

export interface BottomTabBarProps {
  // Provided when rendered by Expo Router Tabs:
  state?: any;
  navigation?: any;
  descriptors?: any;
  insets?: any;
  // Provided when rendered standalone on pushed/modal screens:
  activeTab?: TabKey;
}

interface TabConfig {
  key: TabKey;
  routeName: string;
  label: string;
  outlineIcon: keyof typeof Ionicons.glyphMap;
  filledIcon: keyof typeof Ionicons.glyphMap;
  routePath: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    key: 'home',
    routeName: 'index',
    label: 'Home',
    outlineIcon: 'home-outline',
    filledIcon: 'home',
    routePath: '/(tabs)',
  },
  {
    key: 'circle',
    routeName: 'family',
    label: 'Circle',
    outlineIcon: 'people-outline',
    filledIcon: 'people',
    routePath: '/(tabs)/family',
  },
  {
    key: 'ai',
    routeName: 'ai',
    label: 'Assistant',
    outlineIcon: 'sparkles',
    filledIcon: 'sparkles',
    routePath: '/(tabs)/ai',
  },
  {
    key: 'vault',
    routeName: 'memory',
    label: 'Vault',
    outlineIcon: 'shield-checkmark-outline',
    filledIcon: 'shield-checkmark',
    routePath: '/(tabs)/memory',
  },
  {
    key: 'plans',
    routeName: 'plans',
    label: 'Plans',
    outlineIcon: 'calendar-outline',
    filledIcon: 'calendar',
    routePath: '/(tabs)/plans',
  },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
  activeTab: explicitActiveTab,
}) => {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // Keyboard visibility state (hide tab bar while keyboard is open)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  // Accessibility: reduced motion
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setIsReducedMotion(enabled))
      .catch(() => {});

    const motionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setIsReducedMotion(enabled)
    );

    return () => {
      if (motionSub && typeof motionSub.remove === 'function') {
        motionSub.remove();
      }
    };
  }, []);

  // Determine current active tab
  let currentTabKey: TabKey = 'home';
  if (explicitActiveTab) {
    currentTabKey = explicitActiveTab;
  } else if (state && state.routes && state.routes[state.index]) {
    const currentRouteName = state.routes[state.index].name;
    const match = TAB_CONFIGS.find((t) => t.routeName === currentRouteName);
    if (match) currentTabKey = match.key;
  }

  // Animation refs for standard tab icons (short spring on activation)
  const springAnims = useRef<Record<TabKey, Animated.Value>>({
    home: new Animated.Value(1),
    circle: new Animated.Value(1),
    ai: new Animated.Value(1),
    vault: new Animated.Value(1),
    plans: new Animated.Value(1),
  }).current;

  // Assistant Orb Animations
  const haloAnim = useRef(new Animated.Value(0)).current;
  const glowBreatheAnim = useRef(new Animated.Value(0)).current;
  const orbPressAnim = useRef(new Animated.Value(1)).current;
  const haloLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Trigger short spring animation on active tab
  const animateTabSpring = (tabKey: TabKey) => {
    const anim = springAnims[tabKey];
    anim.setValue(1);
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.12,
        duration: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  // Start / stop looping pulse & breathing animations
  const startAnimations = () => {
    if (isReducedMotion) {
      haloAnim.setValue(0.5);
      glowBreatheAnim.setValue(0.5);
      return;
    }

    // Halo pulse ring loop: scale 1 to 1.35, fade 0.35 to 0 over 2400ms
    haloAnim.setValue(0);
    haloLoopRef.current = Animated.loop(
      Animated.timing(haloAnim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    haloLoopRef.current.start();

    // Glow breathing loop: oscillates 0 to 1 to 0 over 3000ms
    glowBreatheAnim.setValue(0);
    glowLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowBreatheAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(glowBreatheAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    glowLoopRef.current.start();
  };

  const stopAnimations = () => {
    if (haloLoopRef.current) haloLoopRef.current.stop();
    if (glowLoopRef.current) glowLoopRef.current.stop();
  };

  useEffect(() => {
    startAnimations();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startAnimations();
      } else {
        stopAnimations();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      stopAnimations();
      appStateSub.remove();
    };
  }, [isReducedMotion]);

  // Handle Tab Press
  const handleTabPress = (config: TabConfig) => {
    // Light haptic
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    animateTabSpring(config.key);

    if (navigation && state && state.routes) {
      const route = state.routes.find((r: any) => r.name === config.routeName);
      if (route) {
        const isFocused = state.routes[state.index]?.key === route.key;
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      }
    } else {
      router.replace(config.routePath as any);
    }
  };

  if (isKeyboardVisible) {
    return null;
  }

  const themeTokens = isDark ? TabBarTokens.dark : TabBarTokens.light;
  const bottomOffset = safeAreaInsets.bottom + TabBarTokens.bottomOffsetBase;

  // Animated interpolations for Assistant Orb
  const haloScale = isReducedMotion
    ? 1.05
    : haloAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.35],
      });
  const haloOpacity = isReducedMotion
    ? 0.25
    : haloAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0],
      });

  const glowOpacity = isReducedMotion
    ? 0.7
    : glowBreatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.55, 0.90],
      });

  const isAssistantActive = currentTabKey === 'ai';

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.barContainer,
        {
          bottom: bottomOffset,
          backgroundColor: themeTokens.barBg,
          borderColor: themeTokens.barBorder,
          shadowColor: themeTokens.barShadow,
          shadowOpacity: isDark ? 0.35 : 0.14,
          shadowRadius: isDark ? 24 : 30,
        },
      ]}>
      {/* Dark mode: Faint inner top highlight line */}
      {isDark && <View style={styles.darkTopHighlight} pointerEvents="none" />}

      {TAB_CONFIGS.map((tab) => {
        const isActive = currentTabKey === tab.key;
        const isAssistant = tab.key === 'ai';

        if (isAssistant) {
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab)}
              onPressIn={() => {
                Animated.timing(orbPressAnim, {
                  toValue: 0.92,
                  duration: 80,
                  useNativeDriver: Platform.OS !== 'web',
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(orbPressAnim, {
                  toValue: 1,
                  friction: 6,
                  tension: 120,
                  useNativeDriver: Platform.OS !== 'web',
                }).start();
              }}
              accessibilityRole="tab"
              accessibilityLabel="Assistant Tab"
              accessibilityState={{ selected: isActive }}
              style={styles.tabItem}>
              {/* Center Assistant Orb (overlapping top edge by ~17px) */}
              <View style={styles.assistantOrbContainer}>
                {/* 1. Pulsing Halo Ring behind orb */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.haloRing,
                    {
                      backgroundColor: isDark
                        ? 'rgba(56, 189, 248, 0.25)'
                        : TabBarTokens.light.orbHalo,
                      transform: [{ scale: haloScale }],
                      opacity: haloOpacity,
                    },
                  ]}
                />

                {/* 2. Soft Breathing Outer Glow */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.orbGlowShadow,
                    {
                      shadowColor: isDark
                        ? isAssistantActive
                          ? TabBarTokens.dark.orbGlowActive
                          : TabBarTokens.dark.orbGlow
                        : isAssistantActive
                        ? TabBarTokens.light.orbGlowActive
                        : TabBarTokens.light.orbGlow,
                      shadowOpacity: glowOpacity as any,
                      shadowRadius: isDark ? 24 : 18,
                    },
                  ]}
                />

                {/* 3. Core Orb with Press Feedback */}
                <Animated.View
                  style={{
                    transform: [{ scale: orbPressAnim }],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {/* Primary gradient: linear-gradient(90deg, #4F8EF7, #8B6CF0) for Assistant orb */}
                  <LinearGradient
                    colors={['#4F8EF7', '#8B6CF0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.lightOrbCore}>
                    <Ionicons name="sparkles" size={23} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Label sitting on exact same baseline as other tab labels */}
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  styles.assistantLabel,
                  {
                    color: isActive
                      ? isDark
                        ? TabBarTokens.dark.activeColor
                        : TabBarTokens.light.activeColor
                      : colors.text,
                    fontWeight: '600',
                  },
                ]}>
                Assistant
              </Text>
            </Pressable>
          );
        }

        // Standard tabs (Home, Circle, Vault, Plans)
        const iconName = isActive ? tab.filledIcon : tab.outlineIcon;
        const iconColor = isActive ? themeTokens.activeColor : themeTokens.inactiveColor;
        const scaleAnim = springAnims[tab.key];

        return (
          <Pressable
            key={tab.key}
            onPress={() => handleTabPress(tab)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} Tab`}
            accessibilityState={{ selected: isActive }}
            style={styles.tabItem}>
            <Animated.View
              style={[
                styles.iconWrapper,
                { transform: [{ scale: scaleAnim }] },
              ]}>
              <Ionicons name={iconName} size={TabBarTokens.iconSize} color={iconColor} />
            </Animated.View>
            <Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                {
                  color: iconColor,
                  fontWeight: isActive ? '600' : '500',
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
    left: TabBarTokens.sideMargin,
    right: TabBarTokens.sideMargin,
    height: TabBarTokens.height,
    borderRadius: TabBarTokens.borderRadius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    zIndex: 9999,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${TabBarTokens.backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${TabBarTokens.backdropBlur}px)`,
        } as any)
      : {}),
  },
  darkTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: TabBarTokens.dark.barTopHighlight,
    borderRadius: 1,
  },
  tabItem: {
    flex: 1,
    height: TabBarTokens.height,
    minHeight: TabBarTokens.minTouchTarget,
    minWidth: TabBarTokens.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    overflow: 'visible',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as any)
      : {}),
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: TabBarTokens.labelFontSize,
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  // Assistant Orb Styling
  assistantOrbContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    top: -TabBarTokens.orbOverlap,
    height: TabBarTokens.orbSize,
    width: TabBarTokens.orbSize,
    marginBottom: -TabBarTokens.orbOverlap + 2,
    overflow: 'visible',
  },
  haloRing: {
    position: 'absolute',
    width: TabBarTokens.orbSize + TabBarTokens.orbHaloPadding * 2,
    height: TabBarTokens.orbSize + TabBarTokens.orbHaloPadding * 2,
    borderRadius: (TabBarTokens.orbSize + TabBarTokens.orbHaloPadding * 2) / 2,
  },
  orbGlowShadow: {
    position: 'absolute',
    width: TabBarTokens.orbSize,
    height: TabBarTokens.orbSize,
    borderRadius: TabBarTokens.orbSize / 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  lightOrbCore: {
    width: TabBarTokens.orbSize,
    height: TabBarTokens.orbSize,
    borderRadius: TabBarTokens.orbSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkOrbBorder: {
    width: TabBarTokens.orbSize + 4,
    height: TabBarTokens.orbSize + 4,
    borderRadius: (TabBarTokens.orbSize + 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  darkOrbInner: {
    width: TabBarTokens.orbSize,
    height: TabBarTokens.orbSize,
    borderRadius: TabBarTokens.orbSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantLabel: {
    marginTop: 0,
  },
});
