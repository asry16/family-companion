import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary & background tokens
    background: '#FBF8F6',            // warm off-white with a faint pastel gradient
    cardBackground: 'rgba(255, 255, 255, 0.78)', // white at 70-80% opacity
    cardSolid: '#FFFFFF',
    elevatedBackground: 'rgba(255, 255, 255, 0.90)',
    border: 'rgba(20, 32, 58, 0.08)', // 1px translucent border
    borderSubtle: 'rgba(20, 32, 58, 0.04)',
    separator: 'rgba(20, 32, 58, 0.06)',

    // Typography
    text: '#14203A',
    textSecondary: '#6B7690',
    textMuted: '#6B7690',
    textInverse: '#FFFFFF',

    // Exact user accents
    blue: '#3B6FF0',
    blueSoft: 'rgba(59, 111, 240, 0.12)',
    blueBorder: 'rgba(59, 111, 240, 0.25)',

    green: '#22C58B',
    greenSoft: 'rgba(34, 197, 139, 0.12)',
    greenBorder: 'rgba(34, 197, 139, 0.25)',

    red: '#F0524D',
    redSoft: 'rgba(240, 82, 77, 0.12)',
    redBorder: 'rgba(240, 82, 77, 0.25)',

    purple: '#7C5CE0',
    purpleSoft: 'rgba(124, 92, 224, 0.12)',
    purpleBorder: 'rgba(124, 92, 224, 0.25)',

    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.12)',
    pinkBorder: 'rgba(236, 72, 153, 0.25)',

    yellow: '#F59E0B',
    yellowSoft: 'rgba(245, 158, 11, 0.12)',
    yellowBorder: 'rgba(245, 158, 11, 0.25)',

    // Brand accent
    brand: '#14203A',
    brandAccent: '#3B6FF0',
    brandWarm: '#F97316',
    brandSoft: '#F1F5F9',

    // Interactive states
    activeTab: '#3B6FF0',
    inactiveTab: '#6B7690',
    ripple: 'rgba(20, 32, 58, 0.05)',

    // High-contrast button typography tokens
    buttonTextOnAccent: '#FFFFFF',
    buttonTextOnBright: '#14203A',
    buttonTextOnDanger: '#FFFFFF',
  },
  dark: {
    // Primary & background tokens
    background: '#060B1F',            // deep navy
    cardBackground: 'rgba(15, 26, 58, 0.80)', // navy #0F1A3A at 80% opacity
    cardSolid: '#0F1A3A',
    elevatedBackground: 'rgba(20, 35, 75, 0.85)',
    border: 'rgba(59, 111, 240, 0.22)', // 1px glowing border
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    separator: 'rgba(255, 255, 255, 0.08)',

    // Typography
    text: '#FFFFFF',
    textSecondary: '#9AA6C4',
    textMuted: '#9AA6C4',
    textInverse: '#060B1F',

    // Exact user accents (in dark mode, accents get a subtle outer glow)
    blue: '#3B6FF0',
    blueSoft: 'rgba(59, 111, 240, 0.20)',
    blueBorder: 'rgba(59, 111, 240, 0.40)',

    green: '#22C58B',
    greenSoft: 'rgba(34, 197, 139, 0.20)',
    greenBorder: 'rgba(34, 197, 139, 0.40)',

    red: '#F0524D',
    redSoft: 'rgba(240, 82, 77, 0.20)',
    redBorder: 'rgba(240, 82, 77, 0.40)',

    purple: '#7C5CE0',
    purpleSoft: 'rgba(124, 92, 224, 0.20)',
    purpleBorder: 'rgba(124, 92, 224, 0.40)',

    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.20)',
    pinkBorder: 'rgba(236, 72, 153, 0.40)',

    yellow: '#FBBF24',
    yellowSoft: 'rgba(251, 191, 36, 0.20)',
    yellowBorder: 'rgba(251, 191, 36, 0.40)',

    // Brand accent
    brand: '#FFFFFF',
    brandAccent: '#3B6FF0',
    brandWarm: '#FB923C',
    brandSoft: '#0F1A3A',

    activeTab: '#3B6FF0',
    inactiveTab: '#9AA6C4',
    ripple: 'rgba(255, 255, 255, 0.08)',

    // High-contrast button typography tokens (Black font on bright buttons in Night Mode!)
    buttonTextOnAccent: '#000000',
    buttonTextOnBright: '#000000',
    buttonTextOnDanger: '#000000',
  },
  elderly: {
    // High-contrast simple mode tokens
    background: '#060B1F',
    cardBackground: '#0F1A3A',
    cardSolid: '#0F1A3A',
    elevatedBackground: '#1E293B',
    border: '#3B6FF0',
    borderSubtle: '#334155',
    separator: '#334155',

    text: '#FFFFFF',
    textSecondary: '#F1F5F9',
    textMuted: '#CBD5E1',
    textInverse: '#000000',

    green: '#22C58B',
    greenSoft: 'rgba(34, 197, 139, 0.25)',
    greenBorder: '#22C58B',

    yellow: '#FDE047',
    yellowSoft: '#713F12',
    yellowBorder: '#EAB308',

    red: '#F0524D',
    redSoft: '#7F1D1D',
    redBorder: '#F0524D',

    blue: '#3B6FF0',
    blueSoft: '#1E3A8A',
    blueBorder: '#3B6FF0',

    purple: '#7C5CE0',
    purpleSoft: 'rgba(124, 92, 224, 0.25)',
    purpleBorder: '#7C5CE0',

    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.25)',
    pinkBorder: '#EC4899',

    brand: '#FFFFFF',
    brandAccent: '#FDE047',
    brandWarm: '#F97316',
    brandSoft: '#334155',

    activeTab: '#FDE047',
    inactiveTab: '#9AA6C4',
    ripple: 'rgba(255, 255, 255, 0.2)',

    // High-contrast button typography tokens
    buttonTextOnAccent: '#000000',
    buttonTextOnBright: '#000000',
    buttonTextOnDanger: '#FFFFFF',
  }
} as const;

export type ThemeType = 'light' | 'dark' | 'elderly';

export const Typography = {
  // Geometric sans for clean UI
  display: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontSize: 21, // Title 20-22 semibold
    lineHeight: 27,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  subheading: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontSize: 14.5, // Body 14-15
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'Inter, system-ui, -apple-system, sans-serif' }),
    fontSize: 12, // Caption 12
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  // Italic serif / deco script only for greeting
  greeting: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
    fontStyle: 'italic' as const,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
  },

  // Elderly / Simple Mode Typography (Huge, high-readability)
  elderlyGreeting: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800' as const,
  },
  elderlyTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  elderlyBody: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  elderlyButton: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
  // Generous spacing tokens (16-20px screen padding, 12-16px gaps)
  screenPadding: 18,
  cardPadding: 18,
  gap: 14,
  gapLg: 16,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  cardSm: 24,
  card: 26,
  cardLg: 28,
  full: 9999,
} as const;

export const TouchTargets = {
  min: 44,
  comfortable: 52,
  elderly: 68,
} as const;

export const getAccentGlow = (accentColor: string, isDark: boolean) => {
  if (!isDark) {
    return {
      shadowColor: '#14203A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    };
  }
  return {
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  };
};

export const Shadows = Platform.select({
  ios: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    hover: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    floating: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    }
  },
  default: {
    card: {
      elevation: 2,
    },
    hover: {
      elevation: 4,
    },
    floating: {
      elevation: 8,
    }
  },
});
