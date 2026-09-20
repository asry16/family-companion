import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { FamilyProvider, useFamily } from '@/context/FamilyContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { VoiceProvider } from '@/context/VoiceContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Filter out React Native / Expo CLI reconnection & deprecation noise in development
LogBox.ignoreLogs([
  /Cannot connect to Expo CLI/i,
  /Expo CLI/i,
  /"shadow\*" style props are deprecated/i,
  /props\.pointerEvents is deprecated/i,
  /setLayoutAnimationEnabledExperimental/i,
  /useNativeDriver.*not supported/i,
]);

if (typeof console !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    try {
      const msg = args
        .map((a) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return a.message + ' ' + (a.stack || '');
          if (typeof a === 'object' && a !== null) {
            try {
              return JSON.stringify(a);
            } catch {
              return String(a);
            }
          }
          return String(a);
        })
        .join(' ');

      if (
        /Cannot connect to Expo CLI/i.test(msg) ||
        /Expo CLI/i.test(msg) ||
        /"shadow\*" style props are deprecated/i.test(msg) ||
        /props\.pointerEvents is deprecated/i.test(msg) ||
        /setLayoutAnimationEnabledExperimental/i.test(msg) ||
        /useNativeDriver/i.test(msg)
      ) {
        return;
      }
    } catch {
      // Fallback to origWarn if matching fails
    }
    origWarn(...args);
  };

  const origError = console.error;
  console.error = (...args: any[]) => {
    try {
      const msg = args
        .map((a) => (typeof a === 'string' ? a : a?.message || ''))
        .join(' ');
      if (/Cannot connect to Expo CLI/i.test(msg)) {
        return;
      }
    } catch {}
    origError(...args);
  };
}

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark } = useAppTheme();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { setActiveMemberId } = useFamily();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Sync authenticated user with Family active member
  useEffect(() => {
    if (user?.familyMemberId) {
      setActiveMemberId(user.familyMemberId);
    }
  }, [user, setActiveMemberId]);

  // Protected route gating
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    const onSetupScreen = (segments[0] as string) === 'family-setup';

    const hasFamily = Boolean(user?.hasCompletedFamilySetup || (user?.familyName && user?.familyMemberId));

    // Gate unauthenticated users to start on the 1st page (/login)
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated) {
      // If user has not completed family setup yet, gate them to /family-setup
      if (!hasFamily) {
        if (!onSetupScreen) {
          router.replace('/family-setup' as any);
        }
      } else if (inAuthGroup || onSetupScreen) {
        // Redirect authenticated users with completed setup to tabs
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, user?.hasCompletedFamilySetup, user?.familyName, user?.familyMemberId, segments, router]);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor:
            Platform.OS === 'web'
              ? isDark
                ? '#070A12'
                : '#E2E8F0'
              : colors.background,
        },
      ]}>
      <View
        style={[
          styles.phoneFrame,
          {
            backgroundColor: colors.background,
            borderColor:
              Platform.OS === 'web'
                ? isDark
                  ? '#1E293B'
                  : '#CBD5E1'
                : 'transparent',
          },
        ]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="family-setup"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="modal/simple-mode"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="modal/scan-document"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="modal/notifications"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="modal/onboarding"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="modal/new-plan"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="modal/family-settings"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <ThemeProvider>
          <VoiceProvider>
            <RootNavigator />
          </VoiceProvider>
        </ThemeProvider>
      </FamilyProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.select({ web: 480, default: undefined }),
    overflow: 'hidden',
    borderLeftWidth: Platform.select({ web: 1, default: 0 }),
    borderRightWidth: Platform.select({ web: 1, default: 0 }),
    boxShadow: Platform.select({
      web: '0 12px 40px rgba(0, 0, 0, 0.4)',
      default: undefined,
    }) as any,
  },
});
