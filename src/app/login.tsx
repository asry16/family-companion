import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    requestOtp,
    signInWithOtp,
    sendPasswordResetEmail,
  } = useAuth();

  // Screen View Mode: 'gateway' (hero welcome) or 'signIn' (focused sign in form)
  const [viewMode, setViewMode] = useState<'gateway' | 'signIn'>('gateway');

  // Sign In Method: 'password' | 'otp'
  const [signInMethod, setSignInMethod] = useState<'password' | 'otp'>('password');

  // Sign In Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Login States
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [isOtpDelivered, setIsOtpDelivered] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // OTP Cooldown countdown
  React.useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Haptic feedback helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleSendOtp = async () => {
    if (otpLoading || otpCooldown > 0) return;
    setErrorMessage(null);
    setOtpSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address to receive an OTP code.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setOtpLoading(true);

    try {
      const res = await requestOtp(cleanEmail, 'login');
      if (res.success) {
        setOtpSent(true);
        setOtpCooldown(60);
        setIsOtpDelivered(Boolean(res.delivered));
        setOtpSuccessMessage(res.message || 'A 6-digit verification code was sent to your email.');
        if (res.devCode) {
          setDevOtpCode(res.devCode);
        }
      } else {
        setErrorMessage(res.error || 'Failed to dispatch verification code. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtpAndLogin = async () => {
    if (loading) return;
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const result = await signInWithOtp(cleanEmail, cleanCode);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(result.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (loading) return;
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const result = await signInWithEmail(cleanEmail, password, rememberMe);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(result.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage('Google authentication could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (loading) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage('Apple authentication could not be completed.');
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotStatus({
        success: false,
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await sendPasswordResetEmail(forgotEmail);
      setForgotStatus({
        success: true,
        message: res.message,
      });
    } catch (e) {
      setForgotStatus({
        success: false,
        message: 'Could not send reset link. Please try again.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ========================================================================= */}
        {/* VIEW 1: GATEWAY (Welcome / Hero / Action Choices without Form Clutter)    */}
        {/* ========================================================================= */}
        {viewMode === 'gateway' && (
          <View style={styles.gatewayContainer}>
            {/* Ambient Aura & Brand Emblem */}
            <View style={styles.brandHeroBlock}>
              <View style={styles.emblemAuraWrap}>
                <View
                  style={[
                    styles.emblemOuterRing,
                    {
                      borderColor: colors.brandAccent + '30',
                      backgroundColor: colors.brandAccent + '12',
                    },
                  ]}>
                  <View
                    style={[
                      styles.emblemCore,
                      {
                        backgroundColor: colors.brandAccent,
                        shadowColor: colors.brandAccent,
                      },
                    ]}>
                    <Ionicons name="people" size={36} color="#FFFFFF" />
                  </View>
                </View>
              </View>

              <View style={styles.brandBadge}>
                <Text style={[styles.brandBadgeText, { color: colors.brandAccent }]}>
                  FAMILYOS • PRIVATE COMPANION
                </Text>
              </View>

              <Text
                style={[
                  styles.brandName,
                  { color: colors.text, fontSize: isElderly ? 38 : 34 },
                ]}>
                Kinly
              </Text>

              <Text
                style={[
                  styles.heroPhilosophy,
                  { color: colors.textSecondary, fontSize: isElderly ? 16 : 14 },
                ]}>
                "Don't make the family manage the app.{'\n'}Make the app understand the family."
              </Text>
            </View>

            {/* Curated Value Highlights */}
            <View style={styles.highlightsContainer}>
              <View
                style={[
                  styles.highlightCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.highlightIconWrap,
                    { backgroundColor: colors.blueSoft },
                  ]}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.blue} />
                </View>
                <View style={styles.highlightTextWrap}>
                  <Text style={[styles.highlightTitle, { color: colors.text }]}>
                    Private Family Vault
                  </Text>
                  <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                    Zero plaintext data. Passwords encrypted with SHA-256 isolation.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.highlightCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.highlightIconWrap,
                    { backgroundColor: colors.greenSoft },
                  ]}>
                  <Ionicons name="location" size={18} color={colors.green} />
                </View>
                <View style={styles.highlightTextWrap}>
                  <Text style={[styles.highlightTitle, { color: colors.text }]}>
                    Live Coordination
                  </Text>
                  <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                    Battery-efficient presence, safety alerts, and reach detection.
                  </Text>
                </View>
              </View>
            </View>

            {/* The 3 Core Actions on 1st Page: Sign In, Sign Up, Create Family */}
            <View style={styles.gatewayCardsStack}>
              {/* Option 1: Sign In */}
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setErrorMessage(null);
                  setViewMode('signIn');
                }}
                style={({ pressed }) => [
                  styles.gatewayActionCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}>
                <View style={[styles.gatewayActionIconBox, { backgroundColor: colors.blueSoft }]}>
                  <Ionicons name="log-in-outline" size={22} color={colors.blue} />
                </View>
                <View style={styles.gatewayActionTextWrap}>
                  <Text style={[styles.gatewayActionTitle, { color: colors.text, fontSize: isElderly ? 18 : 16 }]}>
                    Sign In
                  </Text>
                  <Text style={[styles.gatewayActionSub, { color: colors.textSecondary }]}>
                    Access your existing family space or member account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              {/* Option 2: Sign Up */}
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/register?mode=signup');
                }}
                style={({ pressed }) => [
                  styles.gatewayActionCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}>
                <View style={[styles.gatewayActionIconBox, { backgroundColor: colors.greenSoft }]}>
                  <Ionicons name="person-add-outline" size={22} color={colors.green} />
                </View>
                <View style={styles.gatewayActionTextWrap}>
                  <Text style={[styles.gatewayActionTitle, { color: colors.text, fontSize: isElderly ? 18 : 16 }]}>
                    Sign Up
                  </Text>
                  <Text style={[styles.gatewayActionSub, { color: colors.textSecondary }]}>
                    Register your personal account to join your family
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              {/* Option 3: Create Family Space */}
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/register?mode=create_family');
                }}
                style={({ pressed }) => [
                  styles.gatewayActionCardFeatured,
                  {
                    backgroundColor: colors.brandAccent + '12',
                    borderColor: colors.brandAccent + '50',
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}>
                <View style={[styles.gatewayActionIconBox, { backgroundColor: colors.brandAccent + '25' }]}>
                  <Ionicons name="home-outline" size={22} color={colors.brandAccent} />
                </View>
                <View style={styles.gatewayActionTextWrap}>
                  <View style={styles.titleBadgeRow}>
                    <Text style={[styles.gatewayActionTitle, { color: colors.brandAccent, fontSize: isElderly ? 18 : 16 }]}>
                      Create Family Space
                    </Text>
                    <View style={[styles.miniJewelBadge, { backgroundColor: colors.brandAccent }]}>
                      <Text style={styles.miniJewelBadgeText}>NEW SPACE</Text>
                    </View>
                  </View>
                  <Text style={[styles.gatewayActionSub, { color: colors.textSecondary }]}>
                    Establish a brand-new encrypted sanctuary for your whole household
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={colors.brandAccent} />
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                OR CONTINUE WITH
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* 1-Tap Social Authentications */}
            <View style={styles.socialStack}>
              <Pressable
                onPress={handleAppleSignIn}
                disabled={loading}
                style={({ pressed }) => [
                  styles.appleButton,
                  { opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
                ]}>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </Pressable>

              <Pressable
                onPress={handleGoogleSignIn}
                disabled={loading}
                style={({ pressed }) => [
                  styles.googleButton,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    opacity: loading ? 0.7 : pressed ? 0.85 : 1,
                  },
                ]}>
                <View style={styles.googleIconCircle}>
                  <Ionicons name="logo-google" size={17} color="#EA4335" />
                </View>
                <Text style={[styles.googleButtonText, { color: colors.text }]}>
                  Continue with Google
                </Text>
              </Pressable>
            </View>

            {/* Security Assurance Footer */}
            <View style={styles.securityFooter}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.green} />
              <Text style={[styles.securityFooterText, { color: colors.textMuted }]}>
                Zero Plaintext Passwords • SHA-256 Cryptographic Vault
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FOCUSED SIGN IN (Appears ONLY when user taps "Sign In with Email") */}
        {/* ========================================================================= */}
        {viewMode === 'signIn' && (
          <View style={styles.signInContainer}>
            {/* Top Navigation Bar with Back Button */}
            <View style={styles.topNavRow}>
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setViewMode('gateway');
                  setErrorMessage(null);
                }}
                hitSlop={12}
                style={styles.backNavButton}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
                <Text style={[styles.backNavText, { color: colors.textSecondary }]}>
                  Back
                </Text>
              </Pressable>
              <Text style={[styles.navBrandTitle, { color: colors.textMuted }]}>
                Kinly
              </Text>
            </View>

            {/* Editorial Heading */}
            <View style={styles.formHeader}>
              <Text
                style={[
                  styles.formTitle,
                  { color: colors.text, fontSize: isElderly ? 32 : 28 },
                ]}>
                Welcome back
              </Text>
              <Text
                style={[
                  styles.formSubtitle,
                  { color: colors.textSecondary, fontSize: isElderly ? 16 : 14 },
                ]}>
                {signInMethod === 'password'
                  ? "Sign in with your email and password to access your family's vault."
                  : "Sign in instantly with a secure 6-digit one-time code sent to your email."}
              </Text>
            </View>

            {/* Authentication Method Segmented Switcher */}
            <View
              style={[
                styles.methodTabsRow,
                { backgroundColor: colors.borderSubtle, borderColor: colors.border },
              ]}>
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setSignInMethod('password');
                  setErrorMessage(null);
                }}
                style={[
                  styles.methodTab,
                  signInMethod === 'password' && [
                    styles.methodTabActive,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  ],
                ]}>
                <Ionicons
                  name="key-outline"
                  size={16}
                  color={signInMethod === 'password' ? colors.brandAccent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    {
                      color: signInMethod === 'password' ? colors.text : colors.textSecondary,
                      fontWeight: signInMethod === 'password' ? '700' : '500',
                    },
                  ]}>
                  Password
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setSignInMethod('otp');
                  setErrorMessage(null);
                }}
                style={[
                  styles.methodTab,
                  signInMethod === 'otp' && [
                    styles.methodTabActive,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  ],
                ]}>
                <Ionicons
                  name="mail-unread-outline"
                  size={16}
                  color={signInMethod === 'otp' ? colors.brandAccent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    {
                      color: signInMethod === 'otp' ? colors.text : colors.textSecondary,
                      fontWeight: signInMethod === 'otp' ? '700' : '500',
                    },
                  ]}>
                  Email OTP Code
                </Text>
                <View style={[styles.methodJewel, { backgroundColor: colors.brandAccent + '1E' }]}>
                  <Text style={[styles.methodJewelText, { color: colors.brandAccent }]}>Instant</Text>
                </View>
              </Pressable>
            </View>

            {/* Form Card */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}>
              {/* Error Alert Box */}
              {errorMessage && (
                <View
                  style={[
                    styles.alertBox,
                    { backgroundColor: colors.redSoft, borderColor: colors.redBorder },
                  ]}>
                  <Ionicons name="alert-circle" size={18} color={colors.red} />
                  <Text style={[styles.alertText, { color: colors.red }]}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* OTP Success / Delivery Info Banner */}
              {signInMethod === 'otp' && otpSuccessMessage && (
                <View
                  style={[
                    styles.alertBox,
                    isOtpDelivered
                      ? { backgroundColor: colors.greenSoft, borderColor: colors.greenBorder }
                      : { backgroundColor: colors.yellowSoft, borderColor: colors.yellowBorder },
                  ]}>
                  <Ionicons
                    name={isOtpDelivered ? "checkmark-circle" : "information-circle"}
                    size={18}
                    color={isOtpDelivered ? colors.green : colors.yellow}
                  />
                  <Text
                    style={[
                      styles.alertText,
                      { color: isOtpDelivered ? colors.green : colors.yellow },
                    ]}>
                    {otpSuccessMessage}
                  </Text>
                </View>
              )}

              {/* Dev Code Banner (for quick local testing without active mailbox) */}
              {signInMethod === 'otp' && devOtpCode && (
                <View
                  style={[
                    styles.alertBox,
                    { backgroundColor: colors.brandAccent + '15', borderColor: colors.brandAccent + '40' },
                  ]}>
                  <Ionicons name="flash-outline" size={18} color={colors.brandAccent} />
                  <Text style={[styles.alertText, { color: colors.brandAccent }]}>
                    Verification Code: <Text style={{ fontWeight: '800' }}>{devOtpCode}</Text>
                  </Text>
                  <Pressable
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setOtpCode(devOtpCode);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: colors.brandAccent,
                    }}>
                    <Text style={{ color: colors.buttonTextOnAccent, fontSize: 12, fontWeight: '700' }}>Auto-Fill</Text>
                  </Pressable>
                </View>
              )}

              {/* Email Input (Common to both methods) */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                    Email Address
                  </Text>
                  {signInMethod === 'otp' && otpSent && (
                    <Pressable
                      onPress={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setDevOtpCode(null);
                        setOtpSuccessMessage(null);
                      }}>
                      <Text style={{ fontSize: 12, color: colors.brandAccent, fontWeight: '600' }}>
                        Change email
                      </Text>
                    </Pressable>
                  )}
                </View>
                <View
                  style={[
                    styles.inputFieldContainer,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.textSecondary}
                    style={styles.inputLeadingIcon}
                  />
                  <TextInput
                    value={email}
                    editable={signInMethod !== 'otp' || !otpSent}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="name@family.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.textInput,
                      { color: colors.text },
                      signInMethod === 'otp' && otpSent && { opacity: 0.7 },
                    ]}
                  />
                </View>
              </View>

              {/* METHOD 1: PASSWORD FORM */}
              {signInMethod === 'password' && (
                <>
                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Password
                    </Text>
                    <View
                      style={[
                        styles.inputFieldContainer,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={colors.textSecondary}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        value={password}
                        onChangeText={(val) => {
                          setPassword(val);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[styles.textInput, { color: colors.text }]}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={10}
                        style={styles.trailingAction}>
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Remember Me & Forgot Password */}
                  <View style={styles.optionsRow}>
                    <Pressable
                      onPress={() => setRememberMe(!rememberMe)}
                      style={styles.rememberMeRow}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: rememberMe ? colors.brandAccent : colors.border,
                            backgroundColor: rememberMe ? colors.brandAccent : 'transparent',
                          },
                        ]}>
                        {rememberMe && (
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.rememberMeText,
                          { color: colors.text, fontSize: isElderly ? 15 : 13 },
                        ]}>
                        Remember me
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setForgotEmail(email);
                        setForgotStatus(null);
                        setForgotModalVisible(true);
                      }}
                      hitSlop={8}>
                      <Text
                        style={[
                          styles.forgotText,
                          { color: colors.brandAccent, fontSize: isElderly ? 15 : 13 },
                        ]}>
                        Forgot Password?
                      </Text>
                    </Pressable>
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleSignIn}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.primaryActionButton,
                      {
                        backgroundColor: colors.brandAccent,
                        shadowColor: colors.brandAccent,
                        opacity: loading ? 0.7 : pressed ? 0.9 : 1,
                      },
                    ]}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={styles.buttonContentRow}>
                        <Text
                          style={[
                            styles.primaryActionText,
                            { color: colors.buttonTextOnAccent, fontSize: isElderly ? 18 : 16 },
                          ]}>
                          Sign In with Password
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.buttonTextOnAccent} />
                      </View>
                    )}
                  </Pressable>
                </>
              )}

              {/* METHOD 2: OTP / CODE SECTION */}
              {signInMethod === 'otp' && (
                <>
                  {!otpSent ? (
                    <Pressable
                      onPress={handleSendOtp}
                      disabled={otpLoading}
                      style={({ pressed }) => [
                        styles.primaryActionButton,
                        {
                          backgroundColor: colors.brandAccent,
                          shadowColor: colors.brandAccent,
                          marginTop: 8,
                          opacity: otpLoading ? 0.7 : pressed ? 0.9 : 1,
                        },
                      ]}>
                      {otpLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <View style={styles.buttonContentRow}>
                          <Ionicons name="paper-plane-outline" size={18} color={colors.buttonTextOnAccent} />
                          <Text
                            style={[
                              styles.primaryActionText,
                              { color: colors.buttonTextOnAccent, fontSize: isElderly ? 18 : 16 },
                            ]}>
                            Send Verification Code
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  ) : (
                    <>
                      {/* OTP Code Input */}
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                          6-Digit Verification Code
                        </Text>
                        <View
                          style={[
                            styles.inputFieldContainer,
                            { backgroundColor: colors.background, borderColor: colors.border },
                          ]}>
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={18}
                            color={colors.textSecondary}
                            style={styles.inputLeadingIcon}
                          />
                          <TextInput
                            value={otpCode}
                            onChangeText={(val) => {
                              setOtpCode(val);
                              if (errorMessage) setErrorMessage(null);
                            }}
                            placeholder="123456"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={[
                              styles.textInput,
                              styles.otpTextInput,
                              { color: colors.text },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Resend OTP Row */}
                      <View style={styles.otpResendRow}>
                        <Text style={[styles.otpResendText, { color: colors.textSecondary }]}>
                          Didn't receive email code?
                        </Text>
                        {otpCooldown > 0 ? (
                          <Text style={[styles.otpCooldownBadge, { color: colors.textMuted }]}>
                            Resend in {otpCooldown}s
                          </Text>
                        ) : (
                          <Pressable
                            onPress={handleSendOtp}
                            disabled={otpLoading}
                            hitSlop={8}>
                            <Text style={[styles.otpResendAction, { color: colors.brandAccent }]}>
                              {otpLoading ? 'Sending...' : 'Resend Code'}
                            </Text>
                          </Pressable>
                        )}
                      </View>

                      {/* Verify & Sign In Button */}
                      <Pressable
                        onPress={handleVerifyOtpAndLogin}
                        disabled={loading}
                        style={({ pressed }) => [
                          styles.primaryActionButton,
                          {
                            backgroundColor: colors.brandAccent,
                            shadowColor: colors.brandAccent,
                            opacity: loading ? 0.7 : pressed ? 0.9 : 1,
                          },
                        ]}>
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <View style={styles.buttonContentRow}>
                            <Text
                              style={[
                                styles.primaryActionText,
                                { color: colors.buttonTextOnAccent, fontSize: isElderly ? 18 : 16 },
                              ]}>
                              Verify & Sign In
                            </Text>
                            <Ionicons name="checkmark-done" size={18} color={colors.buttonTextOnAccent} />
                          </View>
                        )}
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </View>

            {/* Switch to Sign Up or Create Family */}
            <View style={styles.switchPromptColumn}>
              <View style={styles.switchPromptRow}>
                <Text style={[styles.switchPromptText, { color: colors.textSecondary }]}>
                  Need a personal member account?
                </Text>
                <Pressable
                  onPress={() => router.push('/register?mode=signup')}
                  hitSlop={8}>
                  <Text style={[styles.switchPromptAction, { color: colors.brandAccent }]}>
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.switchPromptRow, { marginTop: 8 }]}>
                <Text style={[styles.switchPromptText, { color: colors.textSecondary }]}>
                  Want to establish a new household?
                </Text>
                <Pressable
                  onPress={() => router.push('/register?mode=create_family')}
                  hitSlop={8}>
                  <Text style={[styles.switchPromptAction, { color: colors.green }]}>
                    Create Family Space →
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: FORGOT PASSWORD                                                  */}
      {/* ========================================================================= */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setForgotModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrap,
                  { backgroundColor: colors.brandSoft },
                ]}>
                <Ionicons name="key-outline" size={24} color={colors.brandAccent} />
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontSize: isElderly ? 22 : 18 },
                ]}>
                Reset Your Password
              </Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Enter the email address associated with your Kinly account to receive a reset link.
              </Text>
            </View>

            {forgotStatus && (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: forgotStatus.success ? colors.greenSoft : colors.redSoft,
                    borderColor: forgotStatus.success ? colors.greenBorder : colors.redBorder,
                  },
                ]}>
                <Ionicons
                  name={forgotStatus.success ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={forgotStatus.success ? colors.green : colors.red}
                />
                <Text
                  style={[
                    styles.alertText,
                    { color: forgotStatus.success ? colors.green : colors.red },
                  ]}>
                  {forgotStatus.message}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email Address
              </Text>
              <View
                style={[
                  styles.inputFieldContainer,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textSecondary}
                  style={styles.inputLeadingIcon}
                />
                <TextInput
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  placeholder="name@family.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={handleForgotPasswordSubmit}
                disabled={forgotLoading}
                style={[
                  styles.primaryActionButton,
                  { backgroundColor: colors.brandAccent },
                ]}>
                {forgotLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionText}>Send Reset Link</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setForgotModalVisible(false)}
                style={styles.modalCancelButton}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>



    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 44,
    paddingBottom: 48,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Gateway Layout
  gatewayContainer: {
    gap: 22,
  },
  brandHeroBlock: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  emblemAuraWrap: {
    marginBottom: 4,
  },
  emblemOuterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  brandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginTop: 4,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandName: {
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroPhilosophy: {
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    maxWidth: 320,
  },

  // Highlights
  highlightsContainer: {
    gap: 10,
    marginVertical: 4,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  highlightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTextWrap: {
    flex: 1,
    gap: 2,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  highlightSub: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Actions & Gateway 3-Choice Stack
  gatewayCardsStack: {
    gap: 12,
    marginTop: 4,
  },
  gatewayActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gatewayActionCardFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  gatewayActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatewayActionTextWrap: {
    flex: 1,
    gap: 2,
  },
  gatewayActionTitle: {
    fontWeight: '700',
  },
  gatewayActionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniJewelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniJewelBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionsBlock: {
    gap: 10,
    marginTop: 6,
  },
  switchPromptColumn: {
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryActionText: {
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Social
  socialStack: {
    gap: 10,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#000000',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  googleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },

  // Security Footer
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  securityFooterText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Sign In Focused View
  signInContainer: {
    gap: 20,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backNavText: {
    fontSize: 15,
    fontWeight: '600',
  },
  navBrandTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formHeader: {
    gap: 6,
  },
  formTitle: {
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  formSubtitle: {
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  trailingAction: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeText: {
    fontWeight: '500',
  },
  forgotText: {
    fontWeight: '600',
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  switchPromptText: {
    fontSize: 14,
  },
  switchPromptAction: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Alert Box
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 8,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSub: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    gap: 10,
    marginTop: 4,
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Sheet
  bottomSheetCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxWidth: 480,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 22,
    gap: 14,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    gap: 4,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  memberName: {
    fontWeight: '700',
    fontSize: 14,
  },
  memberMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  sheetCloseButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Segmented Method Tabs
  methodTabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  methodTabActive: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 13,
  },
  methodJewel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodJewelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  otpTextInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  otpResendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  otpResendText: {
    fontSize: 13,
  },
  otpCooldownBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  otpResendAction: {
    fontSize: 13,
    fontWeight: '700',
  },
});
