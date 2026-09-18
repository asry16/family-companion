import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets, ThemeType } from '@/constants/theme';
import { useFamily } from '@/context/FamilyContext';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@kinly_theme_preference';

interface ThemeContextValue {
  theme: ThemeType;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
  isDark: boolean;
  colors: typeof Colors.light;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows;
  touchTargets: typeof TouchTargets;
  isElderly: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const { simpleMode } = useFamily();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemePreferenceState(saved);
        }
      })
      .catch((err) => console.warn('Failed to load theme preference:', err))
      .finally(() => setIsLoaded(true));
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch (err) {
      console.warn('Failed to persist theme preference:', err);
    }
  }, []);

  const theme: ThemeType = useMemo(() => {
    if (simpleMode) return 'elderly';
    if (themePreference === 'dark') return 'dark';
    if (themePreference === 'light') return 'light';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [simpleMode, themePreference, systemScheme]);

  const toggleTheme = useCallback(() => {
    const nextPref: ThemePreference = theme === 'dark' ? 'light' : 'dark';
    setThemePreference(nextPref);
  }, [theme, setThemePreference]);

  const isDark = useMemo(() => theme === 'dark' || theme === 'elderly', [theme]);

  const colors = useMemo(() => {
    if (theme === 'elderly') return Colors.elderly as unknown as typeof Colors.light;
    if (theme === 'dark') return Colors.dark as unknown as typeof Colors.light;
    return Colors.light;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      themePreference,
      setThemePreference,
      toggleTheme,
      isDark,
      colors,
      typography: Typography,
      spacing: Spacing,
      radius: Radius,
      shadows: Shadows,
      touchTargets: TouchTargets,
      isElderly: simpleMode,
    }),
    [theme, themePreference, setThemePreference, toggleTheme, isDark, colors, simpleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
};
