import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  LayoutAnimation,
  UIManager,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { FrontPageTokens, Colors } from '@/constants/theme';
import { authService } from '@/services/authService';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';

export type AuthCardState = 'choose' | 'signIn' | 'signUp' | 'verifySignUpOtp';

export interface AuthCardProps {
  initialState?: AuthCardState;
  showSocialSignIn?: boolean;
  onSuccess: (params?: { isNewSignUp?: boolean }) => void;
  onJoinWithCode?: () => void;
  onForgotPassword?: (prefilledIdentifier?: string) => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  onStateChange?: (state: AuthCardState) => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialState = 'choose',
  showSocialSignIn = false,
  onSuccess,
  onJoinWithCode,
  onForgotPassword,
  onOpenTerms,
  onOpenPrivacy,
  style,
  interactive = true,
  onStateChange,
}) => {
  const { colors, isDark } = useAppTheme();
  const { setSimpleMode } = useFamily();
  const { signIn, signUp, verifyEmailCode, resendVerificationCode } = useAuth();

  // State Management
  const [cardState, setCardState] = useState<AuthCardState>(initialState);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form Fields - Sign In
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Form Fields - Sign Up (name, email, phone, age, password, confirm password)
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAge, setSignUpAge] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // OTP Verification States for Sign Up
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [pendingVerificationCode, setPendingVerificationCode] = useState<string | null>(null);
  const [isCodeDelivered, setIsCodeDelivered] = useState(false);
  const [signUpOtp, setSignUpOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // OTP Resend Cooldown Timer
  React.useEffect(() => {
    let timer: any;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Field Focus States
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Field Input Refs for direct touch response and keyboard navigation
  const signInEmailRef = useRef<TextInput>(null);
  const signInPasswordRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const ageInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Sliding transition between card states
  const switchState = (nextState: AuthCardState) => {
    Keyboard.dismiss();
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setErrors({});
    onStateChange?.(nextState);

    // Determine slide direction (right-to-left for SignUp, left-to-right for SignIn)
    const direction = nextState === 'signUp' ? -50 : 50;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: direction,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setCardState(nextState);
      slideAnim.setValue(-direction); // reset to opposite side
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    });
  };

  // Sign In Handler
  const handleSignIn = async () => {
    const newErrors: Record<string, string> = {};
    const cleanEmail = signInEmail.trim();

    if (!cleanEmail) {
      newErrors.email = 'Email address or phone is required.';
    }

    if (!signInPassword) {
      newErrors.password = 'Password is required.';
    } else if (signInPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {}
      }
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await signIn(cleanEmail, signInPassword);
      if (res.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
        onSuccess({ isNewSignUp: false });
      } else {
        setErrors({ general: res.error || 'Sign in failed. Please check your credentials.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async () => {
    const newErrors: Record<string, string> = {};
    const cleanName = signUpName.trim();
    const cleanEmail = signUpEmail.trim().toLowerCase();
    const cleanPhone = signUpPhone.trim();
    const cleanAge = signUpAge.trim();
    const parsedAge = parseInt(cleanAge, 10);

    if (!cleanName) {
      newErrors.name = 'Full name is required.';
    }

    if (!cleanEmail) {
      newErrors.email = 'Email address (Mail ID) is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required.';
    } else {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        newErrors.phone = 'Please enter a valid phone number (at least 7 digits).';
      }
    }

    if (!cleanAge) {
      newErrors.age = 'Age is required.';
    } else if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      newErrors.age = 'Please enter a valid age (1-120).';
    }

    if (!signUpPassword) {
      newErrors.password = 'Password is required.';
    } else if (signUpPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    // Confirmation Password
    if (!signUpConfirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (signUpPassword !== signUpConfirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {}
      }
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await signUp({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        age: parsedAge,
        password: signUpPassword,
      });

      if (res.success) {
        if (parsedAge > 50) {
          setSimpleMode(true);
        }
        setPendingVerificationEmail(res.email || cleanEmail);
        setPendingVerificationCode(res.verificationCode || null);
        setIsCodeDelivered(Boolean(res.delivered));
        setSignUpOtp('');
        setOtpError(null);
        setOtpCooldown(30);
        switchState('verifySignUpOtp');
      } else {
        setErrors({ general: res.error || 'Registration failed. Please try again.' });
      }
    } catch (err: any) {
      setErrors({ general: err?.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  // Verify Sign Up OTP Handler
  const handleVerifySignUpOtp = async (codeToVerify?: string) => {
    if (otpLoading) return;
    const code = (codeToVerify || signUpOtp).trim();
    if (!code) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    if (code.length < 6) {
      setOtpError('Please enter all 6 digits of the code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await verifyEmailCode(pendingVerificationEmail, code);
      if (res.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
        onSuccess({ isNewSignUp: true });
      } else {
        setOtpError(res.error || 'Invalid verification code. Please check and try again.');
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch (e) {}
        }
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend Sign Up OTP Handler
  const handleResendSignUpOtp = async () => {
    if (otpCooldown > 0 || !pendingVerificationEmail) return;
    setOtpError(null);
    try {
      const res = await resendVerificationCode(pendingVerificationEmail);
      if (res.success) {
        setOtpCooldown(30);
        if (res.code) {
          setPendingVerificationCode(res.code);
        }
        setIsCodeDelivered(Boolean(res.delivered));
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
      } else {
        setOtpError('Failed to resend code. Please try again shortly.');
      }
    } catch {
      setOtpError('Failed to resend code. Please try again shortly.');
    }
  };

  // Theme-tailored styles & colors
  const themeTokens = isDark ? FrontPageTokens.colors.dark : FrontPageTokens.colors.light;

  const cardContainerStyle: ViewStyle = {
    backgroundColor: themeTokens.cardBg,
    borderColor: themeTokens.cardBorder,
    borderWidth: 1,
    borderRadius: cardState === 'signUp' ? 24 : FrontPageTokens.cardRadius,
    padding: cardState === 'signUp' ? 20 : FrontPageTokens.cardPadding,
    maxWidth: FrontPageTokens.cardMaxWidth,
    width: '100%',
    shadowColor: isDark ? themeTokens.cardGlow : themeTokens.cardShadow,
    shadowOffset: { width: 0, height: isDark ? 8 : 12 },
    shadowOpacity: isDark ? 0.35 : 0.15,
    shadowRadius: 24,
    elevation: 6,
    overflow: 'hidden',
  };

  const inputStyle = (fieldName: string): ViewStyle => {
    const isFocused = focusedField === fieldName;
    const hasError = !!errors[fieldName];

    return {
      flexDirection: 'row',
      alignItems: 'center',
      height: FrontPageTokens.inputHeight,
      borderRadius: 16,
      borderWidth: isFocused ? 1.5 : 1,
      borderColor: hasError
        ? isDark
          ? '#F87171'
          : '#E11D48'
        : isFocused
        ? themeTokens.inputFocusBorder
        : themeTokens.inputBorder,
      backgroundColor: themeTokens.inputBg,
      paddingHorizontal: 14,
      shadowColor: isFocused ? themeTokens.inputFocusBorder : 'transparent',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isFocused ? 0.2 : 0,
      shadowRadius: 6,
      elevation: isFocused ? 2 : 0,
    };
  };

  return (
    <View
      style={[cardContainerStyle, { pointerEvents: 'auto' }, style]}>
      {/* Subtle Inner Top Highlight for glass depth */}
      <View
        style={[
          styles.innerTopHighlight,
          { pointerEvents: 'none', backgroundColor: themeTokens.cardInnerHighlight },
        ]}
      />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
        {/* ========================================================================= */}
        {/* 1. CHOOSE STATE (DEFAULT)                                                 */}
        {/* ========================================================================= */}
        {cardState === 'choose' && (
          <View style={styles.stateWrapper}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Welcome to {FrontPageTokens.appName}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Sign in or create your family space
            </Text>

            {/* Primary Sign In Button */}
            <Pressable
              onPress={() => switchState('signIn')}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
              ]}>
              <LinearGradient
                colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientFill}>
                <Text style={styles.primaryButtonText}>Sign in</Text>
              </LinearGradient>
            </Pressable>

            {/* Secondary Sign Up Button */}
            <Pressable
              onPress={() => switchState('signUp')}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : '#7C5CE0',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(124, 92, 224, 0.05)',
                },
                pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
              ]}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: isDark ? '#8B7CF6' : '#7C5CE0' },
                ]}>
                Sign up
              </Text>
            </Pressable>

          </View>
        )}

        {/* ========================================================================= */}
        {/* 2. SIGN IN FORM                                                           */}
        {/* ========================================================================= */}
        {cardState === 'signIn' && (
          <View style={styles.stateWrapper}>
            {/* Header with Back Chevron */}
            <View style={styles.formHeader}>
              <Pressable
                onPress={() => switchState('choose')}
                hitSlop={12}
                style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'left' }]}>
                  Welcome back
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary, textAlign: 'left', marginBottom: 0 }]}>
                  Sign in to your family space
                </Text>
              </View>
              <View
                style={[
                  styles.headerBrandBadge,
                  { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(124, 92, 224, 0.10)' },
                ]}>
                <Ionicons name="people" size={15} color={themeTokens.linkViolet} />
                <Text style={[styles.headerBrandBadgeText, { color: themeTokens.linkViolet }]}>KinLy</Text>
              </View>
            </View>

            {/* General Error Banner */}
            {errors.general && (
              <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={16} color={isDark ? '#F87171' : '#DC2626'} />
                <Text style={[styles.errorBannerText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {/* Email Field */}
              <View>
                <Pressable
                  onPress={() => signInEmailRef.current?.focus()}
                  style={inputStyle('email')}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={focusedField === 'email' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={signInEmailRef}
                    value={signInEmail}
                    onChangeText={(t) => {
                      setSignInEmail(t);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Email address"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => signInPasswordRef.current?.focus()}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                </Pressable>
                {errors.email ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              {/* Password Field */}
              <View>
                <Pressable
                  onPress={() => signInPasswordRef.current?.focus()}
                  style={inputStyle('password')}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'password' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={signInPasswordRef}
                    value={signInPassword}
                    onChangeText={(t) => {
                      setSignInPassword(t);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Password"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    secureTextEntry={!showSignInPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                  <Pressable
                    onPress={() => setShowSignInPassword(!showSignInPassword)}
                    hitSlop={8}
                    style={{ padding: 4 }}>
                    <Ionicons
                      name={showSignInPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={themeTokens.inputPlaceholder}
                    />
                  </Pressable>
                </Pressable>
                {errors.password ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.password}
                  </Text>
                ) : null}
              </View>

              {/* Forgot Password Link */}
              <Pressable
                onPress={() => onForgotPassword?.(signInEmail)}
                hitSlop={8}
                style={styles.forgotPasswordRow}>
                <Text style={[styles.forgotPasswordText, { color: themeTokens.linkViolet }]}>
                  Forgot password?
                </Text>
              </Pressable>

              {/* Submit Primary Button */}
              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
                ]}>
                <LinearGradient
                  colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientFill}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign in</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Switch to Sign Up link */}
              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                  New here?{' '}
                </Text>
                <Pressable onPress={() => switchState('signUp')} hitSlop={8}>
                  <Text style={[styles.switchLink, { color: themeTokens.linkViolet }]}>
                    Sign up
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Legal Footer */}
            <View style={styles.footerWrap}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                By continuing you agree to the{' '}
                <Text onPress={onOpenTerms} style={[styles.footerLink, { color: themeTokens.linkViolet }]}>
                  Terms
                </Text>{' '}
                and{' '}
                <Text onPress={onOpenPrivacy} style={[styles.footerLink, { color: themeTokens.linkViolet }]}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 3. SIGN UP FORM                                                           */}
        {/* ========================================================================= */}
        {cardState === 'signUp' && (
          <View style={styles.stateWrapper}>
            {/* Header with Back Chevron and compact KinLy badge */}
            <View style={styles.formHeader}>
              <Pressable
                onPress={() => switchState('choose')}
                hitSlop={12}
                style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'left' }]}>
                  Create your account
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary, textAlign: 'left', marginBottom: 0 }]}>
                  Set up your private family space
                </Text>
              </View>
              <View
                style={[
                  styles.headerBrandBadge,
                  { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(124, 92, 224, 0.10)' },
                ]}>
                <Ionicons name="people" size={15} color={themeTokens.linkViolet} />
                <Text style={[styles.headerBrandBadgeText, { color: themeTokens.linkViolet }]}>KinLy</Text>
              </View>
            </View>

            {/* General Error Banner */}
            {errors.general && (
              <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={16} color={isDark ? '#F87171' : '#DC2626'} />
                <Text style={[styles.errorBannerText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={[styles.fieldsContainer, { gap: 10 }]}>
              {/* 1. Full Name */}
              <View>
                <Pressable
                  onPress={() => nameInputRef.current?.focus()}
                  style={inputStyle('name')}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={focusedField === 'name' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={nameInputRef}
                    value={signUpName}
                    onChangeText={(t) => {
                      setSignUpName(t);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Full name *"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                </Pressable>
                {errors.name ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.name}
                  </Text>
                ) : null}
              </View>

              {/* 2. Email Address (Mail ID) */}
              <View>
                <Pressable
                  onPress={() => emailInputRef.current?.focus()}
                  style={inputStyle('email')}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={focusedField === 'email' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={emailInputRef}
                    value={signUpEmail}
                    onChangeText={(t) => {
                      setSignUpEmail(t);
                      if (errors.email || errors.general) {
                        setErrors((prev) => ({ ...prev, email: '', general: '' }));
                      }
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Email address (Mail ID) *"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneInputRef.current?.focus()}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                </Pressable>
                {errors.email ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              {/* 3. Phone Number */}
              <View>
                <Pressable
                  onPress={() => phoneInputRef.current?.focus()}
                  style={inputStyle('phone')}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={focusedField === 'phone' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={phoneInputRef}
                    value={signUpPhone}
                    onChangeText={(t) => {
                      setSignUpPhone(t);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Phone number *"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => ageInputRef.current?.focus()}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                </Pressable>
                {errors.phone ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.phone}
                  </Text>
                ) : null}
              </View>

              {/* 4. Age */}
              <View>
                <Pressable
                  onPress={() => ageInputRef.current?.focus()}
                  style={inputStyle('age')}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={focusedField === 'age' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={ageInputRef}
                    value={signUpAge}
                    onChangeText={(t) => {
                      const numeric = t.replace(/[^0-9]/g, '');
                      setSignUpAge(numeric);
                      if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                      const val = parseInt(numeric, 10);
                      if (!isNaN(val) && val > 50) {
                        setSimpleMode(true);
                      } else if (!isNaN(val) && val <= 50) {
                        setSimpleMode(false);
                      }
                    }}
                    onFocus={() => setFocusedField('age')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Age *"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    keyboardType="number-pad"
                    maxLength={3}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                </Pressable>
                {parseInt(signUpAge, 10) > 50 ? (
                  <View style={styles.elderlyBadgeWrap}>
                    <Ionicons name="heart" size={13} color="#F59E0B" />
                    <Text style={styles.elderlyBadgeText}>
                      Elderly Mode Activated (Age 50+)
                    </Text>
                  </View>
                ) : null}
                {errors.age ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.age}
                  </Text>
                ) : null}
              </View>

              {/* 5. Password */}
              <View>
                <Pressable
                  onPress={() => passwordInputRef.current?.focus()}
                  style={inputStyle('password')}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'password' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    value={signUpPassword}
                    onChangeText={(t) => {
                      setSignUpPassword(t);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Password (minimum 8 characters) *"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    secureTextEntry={!showSignUpPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                  <Pressable
                    onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                    hitSlop={8}
                    style={{ padding: 4 }}>
                    <Ionicons
                      name={showSignUpPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={themeTokens.inputPlaceholder}
                    />
                  </Pressable>
                </Pressable>
                {errors.password ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.password}
                  </Text>
                ) : null}

                {/* Password Strength Meter */}
                {signUpPassword.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <PasswordStrengthMeter password={signUpPassword} />
                  </View>
                )}
              </View>

              {/* 6. Confirmation Password */}
              <View>
                <Pressable
                  onPress={() => confirmPasswordInputRef.current?.focus()}
                  style={inputStyle('confirmPassword')}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'confirmPassword' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={confirmPasswordInputRef}
                    value={signUpConfirmPassword}
                    onChangeText={(t) => {
                      setSignUpConfirmPassword(t);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Confirm password *"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    secureTextEntry={!showSignUpConfirmPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    style={[styles.textInput, { color: colors.text }]}
                    selectionColor={themeTokens.linkViolet}
                  />
                  <Pressable
                    onPress={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                    hitSlop={8}
                    style={{ padding: 4 }}>
                    <Ionicons
                      name={showSignUpConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={themeTokens.inputPlaceholder}
                    />
                  </Pressable>
                </Pressable>
                {errors.confirmPassword ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.confirmPassword}
                  </Text>
                ) : null}
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSignUp}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
                ]}>
                <LinearGradient
                  colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientFill}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create account</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Switch to Sign In link */}
              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                  Already have an account?{' '}
                </Text>
                <Pressable onPress={() => switchState('signIn')} hitSlop={8}>
                  <Text style={[styles.switchLink, { color: themeTokens.linkViolet }]}>
                    Sign in
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Legal Footer */}
            <View style={styles.footerWrap}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                By continuing you agree to the{' '}
                <Text onPress={onOpenTerms} style={[styles.footerLink, { color: themeTokens.linkViolet }]}>
                  Terms
                </Text>{' '}
                and{' '}
                <Text onPress={onOpenPrivacy} style={[styles.footerLink, { color: themeTokens.linkViolet }]}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* State: verifySignUpOtp */}
        {cardState === 'verifySignUpOtp' && (
          <View style={styles.stateWrapper}>
            {/* Form Header */}
            <View style={styles.formHeader}>
              <Pressable
                onPress={() => switchState('signUp')}
                style={styles.backButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back to sign up details">
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'left' }]}>
                  Verify Your Account
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary, textAlign: 'left', marginBottom: 0 }]}>
                  Enter the 6-digit code sent to{' '}
                  <Text style={{ fontWeight: '700', color: colors.text }}>
                    {pendingVerificationEmail || signUpEmail}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Security Shield Icon Badge */}
            <View style={styles.otpShieldBadgeWrap}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(79, 142, 247, 0.25)', 'rgba(139, 124, 246, 0.20)']
                    : ['rgba(79, 142, 247, 0.15)', 'rgba(138, 107, 242, 0.10)']
                }
                style={styles.otpShieldBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={32}
                  color={isDark ? '#8B7CF6' : '#4F8EF7'}
                />
              </LinearGradient>
            </View>

            {/* Error Banner */}
            {otpError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                    borderWidth: 1,
                  },
                ]}>
                <Ionicons name="alert-circle" size={18} color={isDark ? '#F87171' : '#E11D48'} />
                <Text style={[styles.errorBannerText, { color: isDark ? '#F87171' : '#E11D48' }]}>
                  {otpError}
                </Text>
              </View>
            ) : null}

            {/* Simulated/Dev Code Helper Banner (if available) */}
            {pendingVerificationCode && !isCodeDelivered && (
              <Pressable
                onPress={() => {
                  setSignUpOtp(pendingVerificationCode);
                  handleVerifySignUpOtp(pendingVerificationCode);
                }}
                style={[
                  styles.devCodeBadge,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.10)',
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)',
                  },
                ]}>
                <Ionicons name="flash-outline" size={14} color={isDark ? '#FBBF24' : '#D97706'} />
                <Text style={[styles.devCodeBadgeText, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                  Demo Code: <Text style={{ fontWeight: '800' }}>{pendingVerificationCode}</Text> (tap to fill & verify)
                </Text>
              </Pressable>
            )}

            {/* 6-digit OTP input */}
            <Pressable
              onPress={() => otpInputRef.current?.focus()}
              style={[
                inputStyle('otp'),
                {
                  justifyContent: 'center',
                  height: 54,
                  marginTop: 6,
                  marginBottom: 12,
                },
              ]}>
              <Ionicons
                name="key-outline"
                size={20}
                color={focusedField === 'otp' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={otpInputRef}
                value={signUpOtp}
                onChangeText={(t) => {
                  const clean = t.replace(/\D/g, '').slice(0, 6);
                  setSignUpOtp(clean);
                  if (otpError) setOtpError(null);
                  if (clean.length === 6) {
                    handleVerifySignUpOtp(clean);
                  }
                }}
                onFocus={() => setFocusedField('otp')}
                onBlur={() => setFocusedField(null)}
                placeholder="• • • • • •"
                placeholderTextColor={themeTokens.inputPlaceholder}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                selectionColor={themeTokens.linkViolet}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    letterSpacing: 8,
                    fontSize: 20,
                    fontWeight: '700',
                  },
                ]}
              />
            </Pressable>

            {/* Resend Code row */}
            <View style={styles.otpResendRow}>
              <Text style={[styles.otpResendText, { color: colors.textSecondary }]}>
                Didn't receive the code?{' '}
              </Text>
              {otpCooldown > 0 ? (
                <Text style={[styles.otpResendLink, { color: colors.textSecondary, fontWeight: '500' }]}>
                  Resend in {otpCooldown}s
                </Text>
              ) : (
                <Pressable onPress={handleResendSignUpOtp} hitSlop={8}>
                  <Text style={[styles.otpResendLink, { color: themeTokens.linkViolet }]}>
                    Resend Code
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={() => handleVerifySignUpOtp()}
              disabled={otpLoading || signUpOtp.trim().length < 6}
              style={({ pressed }) => [
                styles.primaryButton,
                (signUpOtp.trim().length < 6 || otpLoading) && { opacity: 0.6 },
                pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
                { marginTop: 16 },
              ]}>
              <LinearGradient
                colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientFill}>
                {otpLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Complete Registration</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Back to Edit Details Link */}
            <View style={[styles.switchRow, { marginTop: 14 }]}>
              <Pressable onPress={() => switchState('signUp')} hitSlop={8}>
                <Text style={[styles.switchLink, { color: themeTokens.linkViolet }]}>
                  ← Edit registration details
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  innerTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  stateWrapper: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBrandBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fieldsContainer: {
    gap: 16,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  fieldError: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    height: FrontPageTokens.buttonHeight,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  gradientFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    height: FrontPageTokens.buttonHeight,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  joinCodeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  joinCodeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  collapsibleContainer: {
    marginVertical: 2,
  },
  collapsibleTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  collapsibleTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsibleTriggerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modeOptionContainer: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    backgroundColor: 'rgba(124, 92, 224, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 224, 0.15)',
  },
  modeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  modeOptionSubtitle: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  modeChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    justifyContent: 'space-between',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modeCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeCardDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  footerWrap: {
    marginTop: 18,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLink: {
    fontWeight: '600',
  },
  otpShieldBadgeWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  otpShieldBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 6,
  },
  devCodeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  otpResendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  otpResendText: {
    fontSize: 13,
  },
  otpResendLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  elderlyBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  elderlyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
