import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { FamilyProvider, useFamily } from '@/context/FamilyContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { VoiceProvider } from '@/context/VoiceContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { colors, theme } = useAppTheme();
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

    // Gate unauthenticated users to start on the 1st page (/login)
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect authenticated users to appropriate Dashboard/Home screen
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor:
            Platform.OS === 'web'
              ? theme === 'light'
                ? '#E2E8F0'
                : '#070A12'
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
                ? theme === 'light'
                  ? '#CBD5E1'
                  : '#1E293B'
                : 'transparent',
          },
        ]}>
        <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
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
              presentation: 'modal',
              animation: 'slide_from_bottom',
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
