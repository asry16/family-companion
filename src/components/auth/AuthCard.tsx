import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { FrontPageTokens, Colors } from '@/constants/theme';
import { authService } from '@/services/authService';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AuthCardState = 'choose' | 'signIn' | 'signUp';

export interface AuthCardProps {
  initialState?: AuthCardState;
  showSocialSignIn?: boolean;
  onSuccess: () => void;
  onJoinWithCode: () => void;
  onForgotPassword?: (email?: string) => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
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
}) => {
  const { colors, isDark } = useAppTheme();

  // State Management
  const [cardState, setCardState] = useState<AuthCardState>(initialState);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form Fields - Sign In
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Form Fields - Sign Up
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpDob, setSignUpDob] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [inviteCodeExpanded, setInviteCodeExpanded] = useState(false);
  const [signUpInviteCode, setSignUpInviteCode] = useState('');

  // Field Focus States
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 250ms crossfade between card states
  const switchState = (nextState: AuthCardState) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setErrors({});
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (e) {}
      setCardState(nextState);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 130,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
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
      const res = await authService.signIn(cleanEmail, signInPassword);
      if (res.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
        onSuccess();
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
    const cleanEmail = signUpEmail.trim();
    const cleanPhone = signUpPhone.trim();
    const cleanDob = signUpDob.trim();

    if (!cleanName) {
      newErrors.name = 'Full name is required.';
    }

    // Rule: Email and Phone number section mandatory - user must give one or both
    if (!cleanEmail && !cleanPhone) {
      newErrors.email = 'Email or phone number is required.';
      newErrors.phone = 'Email or phone number is required.';
      newErrors.general = 'Please provide an email address or a phone number (or both).';
    } else {
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        newErrors.email = 'Please enter a valid email address.';
      }
      if (cleanPhone) {
        const digits = cleanPhone.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          newErrors.phone = 'Please enter a valid phone number (at least 7 digits).';
        }
      }
    }

    if (cleanDob) {
      const dobPattern = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$|^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/;
      if (!dobPattern.test(cleanDob)) {
        newErrors.dob = 'Please use format YYYY-MM-DD (e.g. 1995-08-24).';
      }
    }

    if (!signUpPassword) {
      newErrors.password = 'Password is required.';
    } else if (signUpPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
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
      const res = await authService.signUp({
        name: cleanName,
        email: cleanEmail || undefined,
        phone: cleanPhone || undefined,
        dateOfBirth: cleanDob || undefined,
        password: signUpPassword,
        inviteCode: signUpInviteCode,
      });
      if (res.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
        onSuccess();
      } else {
        setErrors({ general: res.error || 'Registration failed. Please try again.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  // Theme-tailored styles & colors
  const themeTokens = isDark ? FrontPageTokens.colors.dark : FrontPageTokens.colors.light;

  const cardContainerStyle: ViewStyle = {
    backgroundColor: themeTokens.cardBg,
    borderColor: themeTokens.cardBorder,
    borderWidth: 1,
    borderRadius: FrontPageTokens.cardRadius,
    padding: FrontPageTokens.cardPadding,
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
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[cardContainerStyle, style]}>
      {/* Subtle Inner Top Highlight for glass depth */}
      <View
        pointerEvents="none"
        style={[
          styles.innerTopHighlight,
          { backgroundColor: themeTokens.cardInnerHighlight },
        ]}
      />

      <Animated.View style={{ opacity: fadeAnim }}>
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
                colors={isDark ? ['#38BDF8', '#6366F1'] : ['#4F8EF7', '#8A6BF2']}
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
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.45)' : '#7C5CE0',
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(124, 92, 224, 0.05)',
                },
                pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
              ]}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: isDark ? '#38BDF8' : '#7C5CE0' },
                ]}>
                Sign up
              </Text>
            </Pressable>

            {/* Divider with "or" */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.20)' : 'rgba(124, 92, 224, 0.14)' }]} />
              <Text style={[styles.dividerLabel, { color: themeTokens.dividerText }]}>
                or
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.20)' : 'rgba(124, 92, 224, 0.14)' }]} />
            </View>

            {/* Join with Invite Code Action Link */}
            <Pressable
              onPress={onJoinWithCode}
              style={({ pressed }) => [
                styles.joinCodeLink,
                pressed && { opacity: 0.8 },
              ]}>
              <Ionicons
                name="qr-code-outline"
                size={18}
                color={themeTokens.linkViolet}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.joinCodeText, { color: themeTokens.linkViolet }]}>
                Join with invite code
              </Text>
            </Pressable>

            {/* Optional Social Sign-In Row */}
            {showSocialSignIn && (
              <View style={styles.socialRow}>
                <Pressable style={[styles.socialButton, { borderColor: themeTokens.inputBorder }]}>
                  <Ionicons name="logo-google" size={18} color={colors.text} />
                </Pressable>
                <Pressable style={[styles.socialButton, { borderColor: themeTokens.inputBorder }]}>
                  <Ionicons name="logo-apple" size={20} color={colors.text} />
                </Pressable>
              </View>
            )}
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
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary, textAlign: 'left' }]}>
                  Sign in to your family space
                </Text>
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
                <View style={inputStyle('email')}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={focusedField === 'email' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
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
                    style={[styles.textInput, { color: colors.text }]}
                  />
                </View>
                {errors.email ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              {/* Password Field */}
              <View>
                <View style={inputStyle('password')}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'password' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
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
                    style={[styles.textInput, { color: colors.text }]}
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
                </View>
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
                  colors={isDark ? ['#38BDF8', '#6366F1'] : ['#4F8EF7', '#8A6BF2']}
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
                  Create your account
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary, textAlign: 'left' }]}>
                  Set up your private family space
                </Text>
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
              {/* Full Name */}
              <View>
                <View style={inputStyle('name')}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={focusedField === 'name' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    value={signUpName}
                    onChangeText={(t) => {
                      setSignUpName(t);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Full name"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    autoCapitalize="words"
                    style={[styles.textInput, { color: colors.text }]}
                  />
                </View>
                {errors.name ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.name}
                  </Text>
                ) : null}
              </View>

              {/* Email */}
              <View>
                <View style={inputStyle('email')}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={focusedField === 'email' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    value={signUpEmail}
                    onChangeText={(t) => {
                      setSignUpEmail(t);
                      if (errors.email || errors.general) {
                        setErrors((prev) => ({ ...prev, email: '', general: '' }));
                      }
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Email address (or enter phone)"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.textInput, { color: colors.text }]}
                  />
                </View>
                {errors.email ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              {/* Phone Number */}
              <View>
                <View style={inputStyle('phone')}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={focusedField === 'phone' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    value={signUpPhone}
                    onChangeText={(t) => {
                      setSignUpPhone(t);
                      if (errors.phone || errors.general) {
                        setErrors((prev) => ({ ...prev, phone: '', general: '' }));
                      }
                    }}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Phone number (or enter email)"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    style={[styles.textInput, { color: colors.text }]}
                  />
                </View>
                {errors.phone ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.phone}
                  </Text>
                ) : null}
              </View>

              {/* Date of Birth */}
              <View>
                <View style={inputStyle('dob')}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={focusedField === 'dob' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    value={signUpDob}
                    onChangeText={(t) => {
                      setSignUpDob(t);
                      if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }));
                    }}
                    onFocus={() => setFocusedField('dob')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Date of birth (YYYY-MM-DD)"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    autoCapitalize="none"
                    style={[styles.textInput, { color: colors.text }]}
                  />
                </View>
                {errors.dob ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.dob}
                  </Text>
                ) : null}
              </View>

              {/* Password */}
              <View>
                <View style={inputStyle('password')}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'password' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    value={signUpPassword}
                    onChangeText={(t) => {
                      setSignUpPassword(t);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Password (minimum 8 characters)"
                    placeholderTextColor={themeTokens.inputPlaceholder}
                    secureTextEntry={!showSignUpPassword}
                    autoCapitalize="none"
                    style={[styles.textInput, { color: colors.text }]}
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
                </View>
                {errors.password ? (
                  <Text style={[styles.fieldError, { color: isDark ? '#F87171' : '#E11D48' }]}>
                    {errors.password}
                  </Text>
                ) : null}

                {/* Password Strength Meter */}
                {signUpPassword.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <PasswordStrengthMeter password={signUpPassword} />
                  </View>
                )}
              </View>

              {/* Collapsible "Have an invite code?" */}
              <View style={styles.collapsibleContainer}>
                <Pressable
                  onPress={() => {
                    try {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    } catch (e) {}
                    setInviteCodeExpanded(!inviteCodeExpanded);
                  }}
                  style={styles.collapsibleTrigger}>
                  <View style={styles.collapsibleTriggerLeft}>
                    <Ionicons
                      name="ticket-outline"
                      size={16}
                      color={themeTokens.linkViolet}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.collapsibleTriggerText, { color: themeTokens.linkViolet }]}>
                      Have an invite code?
                    </Text>
                  </View>
                  <Ionicons
                    name={inviteCodeExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={themeTokens.linkViolet}
                  />
                </Pressable>

                {inviteCodeExpanded && (
                  <View style={{ marginTop: 8 }}>
                    <View style={inputStyle('inviteCode')}>
                      <Ionicons
                        name="qr-code-outline"
                        size={18}
                        color={focusedField === 'inviteCode' ? themeTokens.inputFocusBorder : themeTokens.inputPlaceholder}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        value={signUpInviteCode}
                        onChangeText={setSignUpInviteCode}
                        onFocus={() => setFocusedField('inviteCode')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="e.g. KIN-9428"
                        placeholderTextColor={themeTokens.inputPlaceholder}
                        autoCapitalize="characters"
                        style={[styles.textInput, { color: colors.text }]}
                      />
                    </View>
                  </View>
                )}
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
                  colors={isDark ? ['#38BDF8', '#6366F1'] : ['#4F8EF7', '#8A6BF2']}
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
    marginTop: -2,
  },
  headerTextWrap: {
    flex: 1,
  },
  fieldsContainer: {
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
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
    marginBottom: 12,
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
    marginTop: 4,
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
    marginTop: 10,
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
    marginVertical: 18,
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
    marginTop: 8,
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
});
