import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary & background tokens
    background: '#F8F7FF',            // soft lavender gradient start
    backgroundBottom: '#EFEDFB',      // soft lavender gradient end
    backgroundBlobs: 'rgba(228, 224, 250, 0.40)', // large blurred pale-violet blobs
    cardBackground: 'rgba(255, 255, 255, 0.72)', // white at 70-75% opacity
    cardSolid: '#FFFFFF',
    elevatedBackground: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(124, 92, 224, 0.14)', // 1px lavender border rgba(124,92,224,0.14)
    borderSubtle: 'rgba(124, 92, 224, 0.08)',
    separator: 'rgba(124, 92, 224, 0.10)',

    // Typography
    text: '#1F1B6D',                  // deep indigo
    textSecondary: '#7A7DB0',         // muted lavender-gray
    textMuted: '#7A7DB0',
    textTertiary: '#7A7DB0',
    textInverse: '#FFFFFF',

    // Exact reference accents
    accentViolet: '#7C5CE0',          // Accent violet
    accentVioletLinks: '#6D5BD0',     // Links, "See all", section eyebrow labels, inactive icon tints

    // Primary gradient tokens
    primaryGradientStart: '#4F8EF7',
    primaryGradientEnd: '#8A6BF2',
    primaryGradient: ['#4F8EF7', '#8A6BF2'] as const,

    blue: '#4F8EF7',
    blueSoft: 'rgba(124, 92, 224, 0.10)', // violet-tinted fill
    blueBorder: 'rgba(124, 92, 224, 0.20)',

    green: '#2EBF8E',                 // safe green #2EBF8E
    greenSoft: 'rgba(46, 191, 142, 0.12)',
    greenBorder: 'rgba(46, 191, 142, 0.25)',
    greenGlow: 'rgba(46, 191, 142, 0.35)',

    red: '#E11D48',                   // SOS/alert rose
    redSoft: 'rgba(255, 77, 122, 0.12)',
    redBorder: '#F9CFE0',
    sosCardBg: ['#FFEFF4', '#FFE6F0'] as const,
    sosBorder: '#F9CFE0',
    sosGradient: ['#FF4D7A', '#E11D48'] as const,

    purple: '#7C5CE0',
    purpleSoft: 'rgba(124, 92, 224, 0.10)',
    purpleBorder: 'rgba(124, 92, 224, 0.20)',

    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.12)',
    pinkBorder: 'rgba(236, 72, 153, 0.25)',

    yellow: '#F59E0B',                // amber for warnings
    yellowSoft: 'rgba(245, 158, 11, 0.12)',
    yellowBorder: 'rgba(245, 158, 11, 0.25)',

    // Brand accent
    brand: '#1F1B6D',
    brandAccent: '#7C5CE0',
    brandWarm: '#F97316',
    brandSoft: '#F3F1FD',

    // Interactive states
    activeTab: '#7C5CE0',
    inactiveTab: '#6D5BD0',
    tabBarBackground: 'rgba(255, 255, 255, 0.78)',
    tabBarBorder: 'rgba(124, 92, 224, 0.14)',
    tabBarShadow: 'rgba(110, 90, 220, 0.12)',
    ripple: 'rgba(124, 92, 224, 0.08)',

    // High-contrast button typography tokens
    buttonTextOnAccent: '#FFFFFF',
    buttonTextOnBright: '#1F1B6D',
    buttonTextOnDanger: '#FFFFFF',
  },
  dark: {
    // Primary & background tokens
    background: '#0B1030',            // deep indigo gradient start
    backgroundGradient: ['#0B1030', '#101540', '#151A52'] as const,
    backgroundRadialTopGlow: 'rgba(59, 63, 168, 0.15)', // faint indigo radial glow at top center
    cardBackground: 'rgba(20, 27, 74, 0.72)', // calm glass
    cardSolid: '#141B4A',
    elevatedBackground: 'rgba(28, 36, 92, 0.85)',
    border: 'rgba(130, 140, 255, 0.22)', // 1px calm glass border
    borderSubtle: 'rgba(130, 140, 255, 0.12)',
    separator: 'rgba(130, 140, 255, 0.12)',
    cardInnerHighlight: 'rgba(255, 255, 255, 0.04)',
    cardShadow: 'rgba(0, 0, 10, 0.35)',

    // Typography
    text: '#F2F4FF',                  // primary
    textSecondary: '#A6ADE0',         // secondary
    textMuted: '#7C84C0',             // tertiary
    textTertiary: '#7C84C0',
    textInverse: '#0B1030',

    // Accents
    violet: '#8B7CF6',                // links, counts, "You" badge
    violetSoft: 'rgba(139, 124, 246, 0.18)',
    violetBorder: 'rgba(139, 124, 246, 0.50)',
    accentViolet: '#8B7CF6',
    accentVioletLinks: '#8B7CF6',

    blue: '#4F8EF7',
    blueSoft: 'rgba(79, 142, 247, 0.16)',
    blueBorder: 'rgba(79, 142, 247, 0.32)',

    teal: '#2DD4BF',
    tealSoft: 'rgba(45, 212, 191, 0.16)',
    tealBorder: 'rgba(45, 212, 191, 0.35)',

    purple: '#A855F7',
    purpleSoft: 'rgba(168, 85, 247, 0.16)',
    purpleBorder: 'rgba(168, 85, 247, 0.35)',

    green: '#34D399',                 // safe / success green
    headlineGreen: '#4ADE9A',
    greenSoft: 'rgba(52, 211, 153, 0.16)',
    greenBorder: 'rgba(52, 211, 153, 0.35)',
    greenGlow: 'rgba(52, 211, 153, 0.40)',

    red: '#F0524D',
    redSoft: 'rgba(240, 82, 77, 0.18)',
    redBorder: 'rgba(240, 82, 77, 0.35)',
    notificationBadge: '#FF4D6A',

    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.16)',
    pinkBorder: 'rgba(236, 72, 153, 0.35)',

    yellow: '#FBBF24',
    yellowSoft: 'rgba(251, 191, 36, 0.16)',
    yellowBorder: 'rgba(251, 191, 36, 0.35)',

    // Primary gradient
    primaryGradient: ['#4F8EF7', '#8B6CF0'] as const,
    primaryGradientStart: '#4F8EF7',
    primaryGradientEnd: '#8B6CF0',

    // Shared input & header button tokens
    inputBg: 'rgba(255, 255, 255, 0.05)',
    inputBorder: 'rgba(140, 150, 255, 0.25)',
    inputFocusBorder: '#8B7CF6',
    headerBtnBg: 'rgba(255, 255, 255, 0.05)',
    headerBtnBorder: 'rgba(140, 150, 255, 0.25)',
    headerBtnIcon: '#C9CEFF',

    // Dark Map Style tokens
    mapLand: '#141A4A',
    mapRoads: '#2A3080',
    mapParks: '#1C4B4A',
    mapWater: '#23388A',

    // Brand accent
    brand: '#F2F4FF',
    brandAccent: '#8B7CF6',
    brandWarm: '#FB923C',
    brandSoft: '#141B4A',

    activeTab: '#8B7CF6',
    inactiveTab: '#7C84C0',
    ripple: 'rgba(139, 124, 246, 0.10)',

    // High-contrast button typography tokens
    buttonTextOnAccent: '#FFFFFF',
    buttonTextOnBright: '#0B1030',
    buttonTextOnDanger: '#FFFFFF',
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
    textTertiary: '#CBD5E1',
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
      shadowColor: '#6E5ADC',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 10,
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
      shadowColor: '#6E5ADC',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 24,
    },
    hover: {
      shadowColor: '#6E5ADC',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 26,
    },
    floating: {
      shadowColor: '#6E5ADC',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
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

export const TabBarTokens = {
  height: 58,
  sideMargin: 16,
  bottomOffsetBase: 8, // bottom offset = safe-area inset + 8
  borderRadius: 29,    // fully rounded capsule (58 / 2)
  backdropBlur: 20,
  minTouchTarget: 48,
  iconSize: 22,
  labelFontSize: 11,

  // Assistant Orb Geometry
  orbSize: 50,
  orbOverlap: 17,       // ~1/3 of 50px sits above the bar
  orbHaloPadding: 6,    // 6px halo ring

  light: {
    barBg: 'rgba(255, 255, 255, 0.80)',
    barBorder: 'rgba(124, 92, 224, 0.14)',
    barShadow: 'rgba(110, 90, 220, 0.14)',
    activeColor: '#5B7CF6',
    inactiveColor: '#7A7DB0',
    orbGradient: ['#4F8EF7', '#8A6BF2'] as const,
    orbHalo: 'rgba(138, 107, 242, 0.18)',
    orbGlow: 'rgba(138, 107, 242, 0.35)',
    orbGlowActive: 'rgba(91, 124, 246, 0.55)',
  },
  dark: {
    barBg: 'rgba(16, 22, 64, 0.85)',
    barBorder: 'rgba(130, 140, 255, 0.28)',
    barShadow: 'rgba(0, 0, 10, 0.40)',
    barTopHighlight: 'rgba(255, 255, 255, 0.06)',
    activeColor: '#8B7CF6',
    activeGlow: 'rgba(139, 124, 246, 0.40)',
    inactiveColor: '#7C84C0',
    orbBorderGradient: ['#4F8EF7', '#8B6CF0'] as const,
    orbRadialBg: ['#4F8EF7', '#8B6CF0'] as const,
    orbGradient: ['#4F8EF7', '#8B6CF0'] as const,
    orbHalo: 'rgba(139, 124, 246, 0.18)',
    orbGlow: 'rgba(139, 124, 246, 0.45)',
    orbGlowActive: 'rgba(79, 142, 247, 0.65)',
  },

  /**
   * Layout calculation helper:
   * bar height (58) + orb overlap (17) + bottom offset (insets.bottom + 8) + 16
   */
  getScrollBottomPadding: (insetsBottom: number = 0) => {
    return TabBarTokens.height + TabBarTokens.orbOverlap + (insetsBottom + TabBarTokens.bottomOffsetBase) + 16;
  },
} as const;

export const HomeCardTokens = {
  familyPulse: {
    height: 160,
    radius: 28,
    padding: 16,
    headerIconSize: 48,
    memberPanelHeight: 64,
    memberPanelRadius: 32,
    avatarSize: 40,
    mapThumbnailRadius: 24,
    viewLiveMapHeight: 32,
    viewLiveMapPaddingH: 14,
    viewLiveMapFontSize: 13,
  },
  needHelp: {
    height: 112,
    radius: 28,
    padding: 16,
    warningIconSize: 36,
    rightColumnWidth: 88,
    sosSize: 56, // core diameter 56px (range 52-60)
    holdDurationMs: 2000,
    cancelSheetTimeoutMs: 5000,
  },
  colors: {
    sosLightBg: ['#FFEDEE', '#FFE3E6'] as const,
    sosLightBorder: '#F7C6CF',
    sosLightTitle: '#7A1230',
    sosLightSubtitle: '#8A4A5A',
    sosLightCore: ['#FF4D5E', '#E11D48'] as const,

    sosDarkBg: 'rgba(20, 27, 74, 0.72)',
    sosDarkBorder: 'rgba(130, 140, 255, 0.22)',
    sosDarkTitle: '#FF8A8A',
    sosDarkSubtitle: '#A6ADE0',
    sosDarkCore: ['#FF334B', '#C81E32'] as const,
    sosDarkRing: '#FF6B81',
    sosDarkGlow: 'rgba(255, 42, 69, 0.55)',

    pulseGreenGlow: 'rgba(52, 211, 153, 0.40)',
    pulseDotHalo: 'rgba(52, 211, 153, 0.50)',
    roseRing1: 'rgba(244, 63, 94, 0.35)',
    roseRing2: 'rgba(244, 63, 94, 0.22)',
  },
} as const;

export const FrontPageTokens = {
  appName: 'KinLy',
  tagline: "Don't make the family manage the app. Make the app understand the family.",
  logoSize: 72,
  haloSize: 96,
  iconSize: 36,
  brandTopPercent: 0.12,
  logoNameGap: 16,
  nameTaglineGap: 8,
  taglineMaxWidth: 300,
  brandCardGap: 32,
  cardRadius: 28,
  cardPadding: 24,
  cardMaxWidth: 440,
  buttonHeight: 48,
  inputHeight: 48,
  colors: {
    light: {
      nameText: '#1E1B6B',
      taglineText: '#7B7DAF',
      cardBg: 'rgba(255, 255, 255, 0.65)',
      cardBorder: 'rgba(124, 92, 224, 0.16)',
      cardShadow: 'rgba(124, 92, 224, 0.12)',
      cardGlow: 'rgba(124, 92, 224, 0.18)',
      cardInnerHighlight: 'rgba(255, 255, 255, 0.60)',
      haloBorder: 'rgba(124, 92, 224, 0.28)',
      haloBg: 'rgba(124, 92, 224, 0.12)',
      logoBg: '#7C5CE0',
      inputBg: 'rgba(255, 255, 255, 0.70)',
      inputBorder: 'rgba(124, 92, 224, 0.18)',
      inputFocusBorder: '#7C5CE0',
      inputPlaceholder: '#A0A3BD',
      linkViolet: '#7C5CE0',
      dividerText: '#8A8EB2',
    },
    dark: {
      nameText: '#F2F4FF',
      taglineText: '#A6ADE0',
      cardBg: 'rgba(20, 27, 74, 0.72)',
      cardBorder: 'rgba(130, 140, 255, 0.22)',
      cardShadow: 'rgba(0, 0, 10, 0.35)',
      cardGlow: 'rgba(130, 140, 255, 0.15)',
      cardInnerHighlight: 'rgba(255, 255, 255, 0.04)',
      haloBorder: 'rgba(140, 150, 255, 0.25)',
      haloBg: 'rgba(139, 124, 246, 0.14)',
      logoBg: '#8B7CF6',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      inputBorder: 'rgba(140, 150, 255, 0.25)',
      inputFocusBorder: '#8B7CF6',
      inputPlaceholder: '#7C84C0',
      linkViolet: '#8B7CF6',
      dividerText: '#7C84C0',
    },
  },
  timings: {
    phase1LogoFadeScale: 500,
    phase1HaloPulseLoop: 2600,
    phase1TextFadeUpDelay: 150,
    phase1Hold: 900,
    phase2BrandGlide: 600,
    phase2CardDelay: 200,
    phase2CardSpring: 450,
    phase2ChildStagger: 80,
    cardStateCrossfade: 250,
    keyboardBrandScale: 0.7,
    phase2LogoFinalScale: 0.85,
  },
} as const;

export const CircleTokens = {
  mapCardRadius: 28,
  mapHeightMin: 320,
  mapHeightMax: 440,
  mapHeightRatio: 0.42,
  memberRowHeight: 72,
  memberRowRadius: 24,
  memberRowGap: 10,
  memberAvatarSize: 48,
  mapPinAvatarSize: 36,
  headerButtonSize: 40,
  headerGroupIconSize: 44,
  safetyBannerHeight: 72,
  safetyShieldSize: 48,
} as const;
