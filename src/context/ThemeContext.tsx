import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets, ThemeType } from '@/constants/theme';
import { useFamily } from '@/context/FamilyContext';

interface ThemeContextValue {
  theme: ThemeType;
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

  const theme: ThemeType = useMemo(() => {
    if (simpleMode) return 'elderly';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [simpleMode, systemScheme]);

  const colors = useMemo(() => {
    if (theme === 'elderly') return Colors.elderly as unknown as typeof Colors.light;
    if (theme === 'dark') return Colors.dark as unknown as typeof Colors.light;
    return Colors.light;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      colors,
      typography: Typography,
      spacing: Spacing,
      radius: Radius,
      shadows: Shadows,
      touchTargets: TouchTargets,
      isElderly: simpleMode,
    }),
    [theme, colors, simpleMode]
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
