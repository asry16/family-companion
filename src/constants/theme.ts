import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary & background tokens
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    elevatedBackground: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#EDF2F7',
    separator: '#F1F5F9',

    // Typography
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    // Semantic colors (strictly as mandated by FamilyOS design guidelines)
    green: '#10B981',       // Safe / Completed / Available
    greenSoft: '#ECFDF5',
    greenBorder: '#A7F3D0',

    yellow: '#F59E0B',      // Attention / Pending soon / In transit
    yellowSoft: '#FFFBEB',
    yellowBorder: '#FDE68A',

    red: '#EF4444',         // Urgent / Overdue / High Priority
    redSoft: '#FEF2F2',
    redBorder: '#FECACA',

    blue: '#2563EB',        // Information / Calendar / Events
    blueSoft: '#EFF6FF',
    blueBorder: '#BFDBFE',

    // Brand accent
    brand: '#1E293B',
    brandAccent: '#3B82F6',
    brandWarm: '#F97316',
    brandSoft: '#F1F5F9',

    // Interactive states
    activeTab: '#1E293B',
    inactiveTab: '#94A3B8',
    ripple: 'rgba(0, 0, 0, 0.05)',

    // High-contrast button typography tokens
    buttonTextOnAccent: '#FFFFFF',
    buttonTextOnBright: '#0F172A',
    buttonTextOnDanger: '#FFFFFF',
  },
  dark: {
    background: '#0B0F19',
    cardBackground: '#131B2E',
    elevatedBackground: '#1E293B',
    border: '#1E293B',
    borderSubtle: '#182235',
    separator: '#1E293B',

    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0F172A',

    green: '#34D399',
    greenSoft: 'rgba(16, 185, 129, 0.15)',
    greenBorder: 'rgba(16, 185, 129, 0.3)',

    yellow: '#FBBF24',
    yellowSoft: 'rgba(245, 158, 11, 0.15)',
    yellowBorder: 'rgba(245, 158, 11, 0.3)',

    red: '#F87171',
    redSoft: 'rgba(239, 68, 68, 0.15)',
    redBorder: 'rgba(239, 68, 68, 0.3)',

    blue: '#60A5FA',
    blueSoft: 'rgba(37, 99, 235, 0.15)',
    blueBorder: 'rgba(37, 99, 235, 0.3)',

    brand: '#F8FAFC',
    brandAccent: '#60A5FA',
    brandWarm: '#FB923C',
    brandSoft: '#1E293B',

    activeTab: '#60A5FA',
    inactiveTab: '#64748B',
    ripple: 'rgba(255, 255, 255, 0.08)',

    // High-contrast button typography tokens (Black font on bright buttons in Night Mode!)
    buttonTextOnAccent: '#000000',
    buttonTextOnBright: '#000000',
    buttonTextOnDanger: '#000000',
  },
  elderly: {
    // High-contrast simple mode tokens
    background: '#0F172A',
    cardBackground: '#1E293B',
    elevatedBackground: '#334155',
    border: '#475569',
    borderSubtle: '#334155',
    separator: '#334155',

    text: '#FFFFFF',
    textSecondary: '#F1F5F9',
    textMuted: '#CBD5E1',
    textInverse: '#000000',

    green: '#4ADE80',
    greenSoft: '#14532D',
    greenBorder: '#22C55E',

    yellow: '#FDE047',
    yellowSoft: '#713F12',
    yellowBorder: '#EAB308',

    red: '#FCA5A5',
    redSoft: '#7F1D1D',
    redBorder: '#EF4444',

    blue: '#93C5FD',
    blueSoft: '#1E3A8A',
    blueBorder: '#3B82F6',

    brand: '#FFFFFF',
    brandAccent: '#FDE047',
    brandWarm: '#F97316',
    brandSoft: '#334155',

    activeTab: '#FDE047',
    inactiveTab: '#94A3B8',
    ripple: 'rgba(255, 255, 255, 0.2)',

    // High-contrast button typography tokens
    buttonTextOnAccent: '#000000',
    buttonTextOnBright: '#000000',
    buttonTextOnDanger: '#FFFFFF',
  }
} as const;

export type ThemeType = 'light' | 'dark' | 'elderly';

export const Typography = {
  display: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
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
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export const TouchTargets = {
  min: 44,
  comfortable: 52,
  elderly: 68,
} as const;

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
