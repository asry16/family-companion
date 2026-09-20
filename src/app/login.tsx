import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Keyboard,
  AppState,
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { FrontPageTokens } from '@/constants/theme';
import { authService } from '@/services/authService';
import { LightBackdrop, DarkBackdrop } from '@/components/ui';
import { AuthCard, AuthCardState } from '@/components/auth/AuthCard';
import { JoinFamilyModal } from '@/components/modals/JoinFamilyModal';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

// Module-level flag: intro plays once per app launch
let hasPlayedIntroGlobal = false;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, isLoading, sendPasswordResetEmail } = useAuth();

  // Screen height reference
  const [screenHeight, setScreenHeight] = useState(WINDOW_HEIGHT);

  // Current Auth Form state ('choose' | 'signIn' | 'signUp' | 'verifySignUpOtp')
  const [authState, setAuthState] = useState<AuthCardState>('choose');

  // Animation Phase: 'phase1' (centered brand intro) | 'phase2' (brand at top, card visible)
  const [phase, setPhase] = useState<'phase1' | 'phase2'>(
    hasPlayedIntroGlobal ? 'phase2' : 'phase1'
  );
  const [isCardInteractive, setIsCardInteractive] = useState(true);

  // Modals
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotTab, setForgotTab] = useState<'link' | 'otp'>('link');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpStep, setForgotOtpStep] = useState<'request' | 'verify'>('request');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotShowNewPassword, setForgotShowNewPassword] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);
  const [forgotOtpError, setForgotOtpError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');

  // Animation Values
  const brandTranslateY = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(hasPlayedIntroGlobal ? FrontPageTokens.timings.phase2LogoFinalScale : 1)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const isKeyboardActive = isKeyboardVisible || isInputFocused;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Phase 1 Intro Elements
  const logoOpacity = useRef(new Animated.Value(hasPlayedIntroGlobal ? 1 : 0)).current;
  const logoScale = useRef(new Animated.Value(hasPlayedIntroGlobal ? 1 : 0.85)).current;
  const nameOpacity = useRef(new Animated.Value(hasPlayedIntroGlobal ? 1 : 0)).current;
  const nameTranslateY = useRef(new Animated.Value(hasPlayedIntroGlobal ? 0 : 12)).current;
  const taglineOpacity = useRef(new Animated.Value(hasPlayedIntroGlobal ? 1 : 0)).current;
  const taglineTranslateY = useRef(new Animated.Value(hasPlayedIntroGlobal ? 0 : 12)).current;

  // Halo pulse loop
  const haloPulseAnim = useRef(new Animated.Value(0)).current;
  const haloPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Phase 2 Card Entrance
  const cardOpacity = useRef(new Animated.Value(hasPlayedIntroGlobal ? 1 : 0)).current;
  const cardTranslateY = useRef(new Animated.Value(hasPlayedIntroGlobal ? 0 : 60)).current;

  // Timing references for cleanup
  const holdTimerRef = useRef<any>(null);
  const brandHeightRef = useRef<number>(180);

  // Top position calculation: ~12% of screen height from the top
  const finalTopY = Math.round(screenHeight * FrontPageTokens.brandTopPercent);

  // Compute delta to vertically center brand group during Phase 1
  const computeCenterDeltaY = useCallback(
    (h: number) => {
      const centerY = (screenHeight - (insets.top + insets.bottom) - h) / 2;
      return Math.max(0, centerY - finalTopY);
    },
    [screenHeight, insets.top, insets.bottom, finalTopY]
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

  // Halo pulsing animation loop (scale 1 to 1.15, opacity 0.5 to 0, 2600ms loop)
  const startHaloPulse = useCallback(() => {
    haloPulseAnim.setValue(0);
    haloPulseLoopRef.current = Animated.loop(
      Animated.timing(haloPulseAnim, {
        toValue: 1,
        duration: FrontPageTokens.timings.phase1HaloPulseLoop,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    haloPulseLoopRef.current.start();
  }, [haloPulseAnim]);

  const stopHaloPulse = useCallback(() => {
    if (haloPulseLoopRef.current) {
      haloPulseLoopRef.current.stop();
      haloPulseLoopRef.current = null;
    }
  }, []);

  // Transition to Phase 2: Glide brand group up & slide card in
  const triggerPhase2 = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setPhase('phase2');

    // Glide brand group up and scale logo to 0.85
    Animated.parallel([
      Animated.timing(brandTranslateY, {
        toValue: 0,
        duration: FrontPageTokens.timings.phase2BrandGlide,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(brandScale, {
        toValue: FrontPageTokens.timings.phase2LogoFinalScale,
        duration: FrontPageTokens.timings.phase2BrandGlide,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // 200ms delay then slide card up from bottom
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: FrontPageTokens.timings.phase2CardSpring,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 52,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setIsCardInteractive(true);
        hasPlayedIntroGlobal = true;
      });
    }, FrontPageTokens.timings.phase2CardDelay);
  }, [brandTranslateY, brandScale, cardOpacity, cardTranslateY]);

  // Execute Phase 1 on mount
  useEffect(() => {
    if (hasPlayedIntroGlobal) {
      setIsCardInteractive(true);
      return;
    }

    // Check reduced motion
    let isMounted = true;
    const checkMotion = async () => {
      try {
        const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
        const prefersReduceWeb =
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if ((isReduced || prefersReduceWeb) && isMounted) {
          hasPlayedIntroGlobal = true;
          setPhase('phase2');
          brandTranslateY.setValue(0);
          brandScale.setValue(FrontPageTokens.timings.phase2LogoFinalScale);
          logoOpacity.setValue(1);
          logoScale.setValue(1);
          nameOpacity.setValue(1);
          nameTranslateY.setValue(0);
          taglineOpacity.setValue(1);
          taglineTranslateY.setValue(0);
          cardOpacity.setValue(1);
          cardTranslateY.setValue(0);
          setIsCardInteractive(true);
          return;
        }
      } catch (e) {}

      if (!isMounted) return;

      // Calculate vertical center delta for brand
      const deltaY = computeCenterDeltaY(brandHeightRef.current);
      brandTranslateY.setValue(deltaY);

      // Start halo pulse loop
      startHaloPulse();

      // Logo fade & scale in (0.85 to 1, 500ms)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: FrontPageTokens.timings.phase1LogoFadeScale,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: FrontPageTokens.timings.phase1LogoFadeScale,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        if (!isMounted) return;

        // Name fade up 12px (350ms)
        Animated.parallel([
          Animated.timing(nameOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(nameTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();

        // Staggered 150ms: Tagline fade up 12px (350ms)
        setTimeout(() => {
          if (!isMounted) return;
          Animated.parallel([
            Animated.timing(taglineOpacity, {
              toValue: 1,
              duration: 350,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(taglineTranslateY, {
              toValue: 0,
              duration: 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]).start(() => {
            if (!isMounted) return;
            // Hold for ~900ms then automatically glide to Phase 2
            holdTimerRef.current = setTimeout(() => {
              if (isMounted) triggerPhase2();
            }, FrontPageTokens.timings.phase1Hold);
          });
        }, FrontPageTokens.timings.phase1TextFadeUpDelay);
      });
    };

    checkMotion();

    return () => {
      isMounted = false;
      stopHaloPulse();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, [computeCenterDeltaY, startHaloPulse, stopHaloPulse, triggerPhase2]);

  // AppState listener: pause animation when app is backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState.match(/inactive|background/)) {
        stopHaloPulse();
      } else if (nextState === 'active' && phase === 'phase1') {
        startHaloPulse();
      }
    });
    return () => sub.remove();
  }, [phase, startHaloPulse, stopHaloPulse]);

  // Keyboard listeners: adapt layout when keyboard appears to push credentials card upward
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const kh = e?.endCoordinates?.height || 300;
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (err) {}
      setKeyboardHeight(kh);
      setIsKeyboardVisible(true);
    };

    const onHide = () => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (err) {}
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Synchronous focus listener: fires the millisecond user taps any text bar
  const handleFocusChange = useCallback((focused: boolean) => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {}
    setIsInputFocused(focused);
    if (focused) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 70, animated: true });
      }, 60);
    } else {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, []);

  // Handle tap anywhere during Phase 1 to skip straight to Phase 2
  const handlePhase1Tap = () => {
    if (phase === 'phase1') {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
      logoOpacity.setValue(1);
      logoScale.setValue(1);
      nameOpacity.setValue(1);
      nameTranslateY.setValue(0);
      taglineOpacity.setValue(1);
      taglineTranslateY.setValue(0);
      triggerPhase2();
    }
  };

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (forgotCooldown > 0) {
      timer = setInterval(() => {
        setForgotCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [forgotCooldown]);

  // Password reset via email link handler
  const handleSendReset = async () => {
    const clean = (forgotEmail || forgotIdentifier).trim();
    if (!clean || !clean.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await sendPasswordResetEmail(clean);
      setForgotSuccess(res.message || 'Password reset instructions have been sent.');
    } catch (err: any) {
      alert(err.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Password reset via OTP - Request Code
  const handleRequestOtp = async () => {
    const cleanId = (forgotIdentifier || forgotEmail).trim();
    if (!cleanId) {
      setForgotOtpError('Please enter your email address or phone number.');
      return;
    }
    setForgotOtpError(null);
    setForgotLoading(true);
    try {
      const res = await authService.requestPasswordResetOtp(cleanId);
      if (res.success) {
        setForgotDevCode(res.devCode || null);
        setForgotOtpStep('verify');
        setForgotCooldown(60);
      } else {
        setForgotOtpError(res.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setForgotOtpError(err.message || 'Failed to send verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Password reset via OTP - Verify Code & Set New Password
  const handleVerifyAndReset = async () => {
    const cleanId = (forgotIdentifier || forgotEmail).trim();
    if (!forgotOtpCode || forgotOtpCode.trim().length !== 6) {
      setForgotOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotOtpError('New password must be at least 8 characters.');
      return;
    }
    setForgotOtpError(null);
    setForgotLoading(true);
    try {
      const res = await authService.verifyAndResetPasswordWithOtp(
        cleanId,
        forgotOtpCode.trim(),
        forgotNewPassword
      );
      if (res.success) {
        setForgotSuccess(res.message || 'Password successfully reset!');
      } else {
        setForgotOtpError(res.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setForgotOtpError(err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Theme-tailored tokens
  const themeTokens = isDark ? FrontPageTokens.colors.dark : FrontPageTokens.colors.light;

  // Pulsing halo scale & opacity interpolation
  const haloScale = haloPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const haloOpacity = haloPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  // Plain splash while checking session or if already authenticated
  if (isLoading || isAuthenticated) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
        {isDark ? <DarkBackdrop /> : <LightBackdrop />}
        <View style={styles.splashContent}>
          <View
            style={[
              styles.logoHalo,
              {
                borderColor: themeTokens.haloBorder,
                backgroundColor: themeTokens.haloBg,
              },
            ]}>
            <View style={[styles.logoCore, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: '100%', height: '100%', borderRadius: 36 }}
                resizeMode="cover"
              />
            </View>
          </View>
          <ActivityIndicator
            size="small"
            color={themeTokens.linkViolet}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.rootContainer, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Background Backdrops: Light (lavender + botanicals) & Dark (deep indigo + faint feathers) */}
      {isDark ? <DarkBackdrop /> : <LightBackdrop />}

      {/* Screen container: safe-area aware, centered column max width 440 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.rootContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (isKeyboardActive ? 10 : finalTopY),
            paddingBottom: isKeyboardActive ? Math.max(keyboardHeight, 280) + 120 : insets.bottom + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* BRAND GROUP: LOGO + APP NAME + TAGLINE                                     */}
        {/* ========================================================================= */}
        {isKeyboardActive ? (
          <View style={styles.brandGroupCompact}>
            <View style={styles.compactLogo}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
            <Text style={[styles.compactAppName, { color: themeTokens.nameText }]}>
              {FrontPageTokens.appName}
            </Text>
          </View>
        ) : (
          <Animated.View
            onLayout={(e) => {
              brandHeightRef.current = e.nativeEvent.layout.height;
            }}
            style={[
              styles.brandGroup,
              {
                transform: [
                  { translateY: brandTranslateY },
                  { scale: brandScale },
                ],
              },
            ]}>
            {/* 1. LOGO: 72px violet circle with white family icon in 96px halo ring */}
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}>
              {/* Animated Pulsing Outer Halo Layer */}
              <Animated.View
                style={[
                  styles.logoHaloPulse,
                  {
                    pointerEvents: 'none',
                    borderColor: themeTokens.haloBorder,
                    backgroundColor: themeTokens.haloBg,
                    opacity: haloOpacity,
                    transform: [{ scale: haloScale }],
                  },
                ]}
              />

              {/* Static Halo Ring (96px) */}
              <View
                style={[
                  styles.logoHalo,
                  {
                    borderColor: themeTokens.haloBorder,
                    backgroundColor: themeTokens.haloBg,
                  },
                ]}>
                {/* Luminous Brand Logo (72px) */}
                <View
                  style={[
                    styles.logoCore,
                    {
                      backgroundColor: 'transparent',
                      overflow: 'hidden',
                    },
                  ]}>
                  <Image
                    source={require('../../assets/images/logo.png')}
                    style={{ width: '100%', height: '100%', borderRadius: 36 }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </Animated.View>

            {/* 2. APP NAME: 40px, heavy weight, -1 letter spacing */}
            <Animated.Text
              style={[
                styles.appNameText,
                {
                  color: themeTokens.nameText,
                  opacity: nameOpacity,
                  transform: [{ translateY: nameTranslateY }],
                },
              ]}>
              {FrontPageTokens.appName}
            </Animated.Text>

            {/* 3. TAGLINE: italic 16px, muted lavender-gray, max width 300, in quotes */}
            <Animated.Text
              style={[
                styles.taglineText,
                {
                  color: themeTokens.taglineText,
                  opacity: taglineOpacity,
                  transform: [{ translateY: taglineTranslateY }],
                },
              ]}>
              "{FrontPageTokens.tagline}"
            </Animated.Text>
          </Animated.View>
        )}

        {/* ========================================================================= */}
        {/* AUTH CARD: 3-State Glassmorphism Card                                     */}
        {/* ========================================================================= */}
        <Animated.View
          style={[
            styles.cardAnimatedWrapper,
            {
              marginTop: isKeyboardActive ? 10 : FrontPageTokens.brandCardGap,
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}>
          <AuthCard
            interactive={true}
            onFocusChange={handleFocusChange}
            onStateChange={(nextState) => {
              setAuthState(nextState);
              if (nextState === 'choose') {
                handleFocusChange(false);
              }
            }}
            onSuccess={() => {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {}
              }
              router.replace('/(tabs)');
            }}
            onJoinWithCode={() => setJoinModalVisible(true)}
            onForgotPassword={(prefilledIdentifier) => {
              if (prefilledIdentifier) {
                setForgotEmail(prefilledIdentifier);
                setForgotIdentifier(prefilledIdentifier);
              }
              setForgotSuccess(null);
              setForgotOtpError(null);
              setForgotOtpStep('request');
              setForgotOtpCode('');
              setForgotNewPassword('');
              setForgotModalVisible(true);
            }}
            onOpenTerms={() => {
              setTermsType('terms');
              setTermsModalVisible(true);
            }}
            onOpenPrivacy={() => {
              setTermsType('privacy');
              setTermsModalVisible(true);
            }}
          />
        </Animated.View>
      </ScrollView>

      {/* Phase 1 Skip Overlay: Tap anywhere during intro to glide up to Phase 2 */}
      {phase === 'phase1' && authState === 'choose' && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handlePhase1Tap}
          accessibilityLabel="Tap anywhere to skip intro"
        />
      )}

      {/* ========================================================================= */}
      {/* JOIN WITH INVITE CODE MODAL                                               */}
      {/* ========================================================================= */}
      <JoinFamilyModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={(_familyName) => {
          setJoinModalVisible(false);
          router.replace('/(tabs)');
        }}
      />

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL (EMAIL LINK + OTP)                                  */}
      {/* ========================================================================= */}
      <Modal
        visible={forgotModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setForgotModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? 'rgba(15, 26, 58, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: themeTokens.cardBorder,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Reset Password</Text>
              <Pressable onPress={() => setForgotModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            {forgotSuccess ? (
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <Ionicons name="checkmark-circle" size={52} color={colors.green} />
                <Text style={[styles.modalText, { color: colors.text, marginTop: 14, fontWeight: '600' }]}>
                  {forgotSuccess}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginTop: 6, textAlign: 'center' }]}>
                  You can now sign in to your KinLy space.
                </Text>
                <Pressable
                  onPress={() => {
                    setForgotModalVisible(false);
                    setForgotSuccess(null);
                  }}
                  style={[styles.modalDoneButton, { backgroundColor: themeTokens.linkViolet, marginTop: 18 }]}>
                  <Text style={styles.modalDoneButtonText}>Back to Sign in</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Segmented Option Switcher: Email Link vs Reset via OTP */}
                <View style={styles.segmentedContainer}>
                  <Pressable
                    onPress={() => {
                      setForgotTab('link');
                      setForgotOtpError(null);
                    }}
                    style={[
                      styles.segmentedTab,
                      forgotTab === 'link' && [styles.segmentedTabActive, { backgroundColor: themeTokens.linkViolet }],
                    ]}>
                    <Ionicons
                      name="mail-outline"
                      size={15}
                      color={forgotTab === 'link' ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentedTabText,
                        { color: forgotTab === 'link' ? '#FFFFFF' : colors.textSecondary },
                      ]}>
                      Email Link
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setForgotTab('otp');
                      setForgotOtpError(null);
                    }}
                    style={[
                      styles.segmentedTab,
                      forgotTab === 'otp' && [styles.segmentedTabActive, { backgroundColor: themeTokens.linkViolet }],
                    ]}>
                    <Ionicons
                      name="key-outline"
                      size={15}
                      color={forgotTab === 'otp' ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentedTabText,
                        { color: forgotTab === 'otp' ? '#FFFFFF' : colors.textSecondary },
                      ]}>
                      Reset via OTP
                    </Text>
                  </Pressable>
                </View>

                {/* TAB 1: EMAIL LINK OPTION */}
                {forgotTab === 'link' && (
                  <View>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Enter your email address and we will send you a secure link to reset your password.
                    </Text>

                    <View
                      style={[
                        styles.modalInputWrap,
                        {
                          borderColor: themeTokens.inputBorder,
                          backgroundColor: themeTokens.inputBg,
                        },
                      ]}>
                      <Ionicons name="mail-outline" size={18} color={themeTokens.inputPlaceholder} style={{ marginRight: 10 }} />
                      <TextInput
                        value={forgotEmail}
                        onChangeText={setForgotEmail}
                        placeholder="Email address"
                        placeholderTextColor={themeTokens.inputPlaceholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[styles.modalTextInput, { color: colors.text }]}
                      />
                    </View>

                    <Pressable
                      onPress={handleSendReset}
                      disabled={forgotLoading}
                      style={[styles.modalActionButton, { backgroundColor: themeTokens.linkViolet }]}>
                      {forgotLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalActionButtonText}>Send reset link</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {/* TAB 2: OTP OPTION */}
                {forgotTab === 'otp' && (
                  <View>
                    {/* Error Banner */}
                    {forgotOtpError ? (
                      <View style={[styles.modalErrorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
                        <Ionicons name="alert-circle" size={16} color={isDark ? '#F87171' : '#DC2626'} />
                        <Text style={[styles.modalErrorText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                          {forgotOtpError}
                        </Text>
                      </View>
                    ) : null}

                    {/* Step 1: Request OTP */}
                    {forgotOtpStep === 'request' && (
                      <View>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                          Enter your registered email address or phone number to receive a 6-digit OTP code.
                        </Text>

                        <View
                          style={[
                            styles.modalInputWrap,
                            {
                              borderColor: themeTokens.inputBorder,
                              backgroundColor: themeTokens.inputBg,
                            },
                          ]}>
                          <Ionicons
                            name="call-outline"
                            size={18}
                            color={themeTokens.inputPlaceholder}
                            style={{ marginRight: 10 }}
                          />
                          <TextInput
                            value={forgotIdentifier}
                            onChangeText={(t) => {
                              setForgotIdentifier(t);
                              if (forgotOtpError) setForgotOtpError(null);
                            }}
                            placeholder="Email address or phone number"
                            placeholderTextColor={themeTokens.inputPlaceholder}
                            autoCapitalize="none"
                            style={[styles.modalTextInput, { color: colors.text }]}
                          />
                        </View>

                        <Pressable
                          onPress={handleRequestOtp}
                          disabled={forgotLoading}
                          style={[styles.modalActionButton, { backgroundColor: themeTokens.linkViolet }]}>
                          {forgotLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.modalActionButtonText}>Send 6-digit OTP</Text>
                          )}
                        </Pressable>
                      </View>
                    )}

                    {/* Step 2: Verify OTP & Enter New Password */}
                    {forgotOtpStep === 'verify' && (
                      <View>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                          Enter the 6-digit code sent to <Text style={{ fontWeight: '600', color: colors.text }}>{forgotIdentifier || forgotEmail}</Text>
                        </Text>

                        {/* Dev Code Quick Fill Chip */}
                        {forgotDevCode && (
                          <Pressable
                            onPress={() => setForgotOtpCode(forgotDevCode)}
                            style={[styles.devCodeBadge, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(124, 92, 224, 0.10)' }]}>
                            <Ionicons name="flash" size={14} color={themeTokens.linkViolet} />
                            <Text style={[styles.devCodeBadgeText, { color: themeTokens.linkViolet }]}>
                              Simulated Code: <Text style={{ fontWeight: '800' }}>{forgotDevCode}</Text> (tap to autofill)
                            </Text>
                          </Pressable>
                        )}

                        {/* 6-digit OTP input */}
                        <View
                          style={[
                            styles.modalInputWrap,
                            {
                              borderColor: themeTokens.inputBorder,
                              backgroundColor: themeTokens.inputBg,
                              marginBottom: 10,
                            },
                          ]}>
                          <Ionicons name="key-outline" size={18} color={themeTokens.inputPlaceholder} style={{ marginRight: 10 }} />
                          <TextInput
                            value={forgotOtpCode}
                            onChangeText={(t) => {
                              setForgotOtpCode(t);
                              if (forgotOtpError) setForgotOtpError(null);
                            }}
                            placeholder="6-digit OTP code"
                            placeholderTextColor={themeTokens.inputPlaceholder}
                            keyboardType="number-pad"
                            maxLength={6}
                            style={[styles.modalTextInput, { color: colors.text, letterSpacing: 3, fontWeight: '700' }]}
                          />
                        </View>

                        {/* New Password input */}
                        <View
                          style={[
                            styles.modalInputWrap,
                            {
                              borderColor: themeTokens.inputBorder,
                              backgroundColor: themeTokens.inputBg,
                              marginBottom: 10,
                            },
                          ]}>
                          <Ionicons name="lock-closed-outline" size={18} color={themeTokens.inputPlaceholder} style={{ marginRight: 10 }} />
                          <TextInput
                            value={forgotNewPassword}
                            onChangeText={(t) => {
                              setForgotNewPassword(t);
                              if (forgotOtpError) setForgotOtpError(null);
                            }}
                            placeholder="New password (min 8 chars)"
                            placeholderTextColor={themeTokens.inputPlaceholder}
                            secureTextEntry={!forgotShowNewPassword}
                            autoCapitalize="none"
                            style={[styles.modalTextInput, { color: colors.text }]}
                          />
                          <Pressable
                            onPress={() => setForgotShowNewPassword(!forgotShowNewPassword)}
                            hitSlop={8}
                            style={{ padding: 4 }}>
                            <Ionicons
                              name={forgotShowNewPassword ? 'eye-off-outline' : 'eye-outline'}
                              size={18}
                              color={themeTokens.inputPlaceholder}
                            />
                          </Pressable>
                        </View>

                        {/* Resend row */}
                        <View style={styles.resendRow}>
                          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                            Didn't receive code?{' '}
                          </Text>
                          <Pressable
                            disabled={forgotCooldown > 0 || forgotLoading}
                            onPress={handleRequestOtp}
                            hitSlop={8}>
                            <Text
                              style={[
                                styles.resendLink,
                                {
                                  color: forgotCooldown > 0 ? colors.textMuted : themeTokens.linkViolet,
                                },
                              ]}>
                              {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend code'}
                            </Text>
                          </Pressable>
                        </View>

                        <Pressable
                          onPress={handleVerifyAndReset}
                          disabled={forgotLoading}
                          style={[styles.modalActionButton, { backgroundColor: themeTokens.linkViolet, marginTop: 12 }]}>
                          {forgotLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.modalActionButtonText}>Reset Password</Text>
                          )}
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* TERMS / PRIVACY POLICY MODAL                                              */}
      {/* ========================================================================= */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTermsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? 'rgba(15, 26, 58, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderColor: themeTokens.cardBorder,
                maxHeight: '80%',
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {termsType === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </Text>
              <Pressable onPress={() => setTermsModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ marginTop: 12 }}>
              <Text style={[styles.modalPolicyText, { color: colors.textSecondary }]}>
                {termsType === 'terms'
                  ? `Welcome to KinLy. By accessing or using our application, you agree to be bound by these Terms of Service. KinLy is designed exclusively for private family coordination, document vaulting, and emergency assistance.\n\nAll personal data, locations, and family records are encrypted end-to-end and stored securely. You retain full ownership of all family content uploaded to the platform.`
                  : `KinLy respects your private family sanctuary. We never sell, rent, or monetize your location data, family communications, or private documents.\n\nYour biometric authentication and vault data remain strictly localized or zero-knowledge encrypted. Emergency SOS location sharing is only triggered by explicit user activation.`}
              </Text>
            </ScrollView>

            <Pressable
              onPress={() => setTermsModalVisible(false)}
              style={[styles.modalDoneButton, { backgroundColor: themeTokens.linkViolet, marginTop: 16 }]}>
              <Text style={styles.modalDoneButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: FrontPageTokens.cardMaxWidth,
    alignSelf: 'center',
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGroup: {
    alignItems: 'center',
    width: '100%',
  },
  brandGroupCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
    height: 38,
  },
  compactLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  compactAppName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoWrapper: {
    width: FrontPageTokens.haloSize,
    height: FrontPageTokens.haloSize,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: FrontPageTokens.logoNameGap,
  },
  logoHaloPulse: {
    position: 'absolute',
    width: FrontPageTokens.haloSize,
    height: FrontPageTokens.haloSize,
    borderRadius: FrontPageTokens.haloSize / 2,
    borderWidth: 1.5,
  },
  logoHalo: {
    width: FrontPageTokens.haloSize,
    height: FrontPageTokens.haloSize,
    borderRadius: FrontPageTokens.haloSize / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCore: {
    width: FrontPageTokens.logoSize,
    height: FrontPageTokens.logoSize,
    borderRadius: FrontPageTokens.logoSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  appNameText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: FrontPageTokens.nameTaglineGap,
  },
  taglineText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: FrontPageTokens.taglineMaxWidth,
    lineHeight: 22,
  },
  cardAnimatedWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: FrontPageTokens.brandCardGap,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    margin: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  modalActionButton: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalDoneButton: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    alignSelf: 'stretch',
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalPolicyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(124, 92, 224, 0.08)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 6,
  },
  segmentedTabActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  modalErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  devCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  devCodeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  resendText: {
    fontSize: 13,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
  },
});
