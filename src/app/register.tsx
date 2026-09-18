import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { MemberRelation } from '@/types';
import { PasswordStrengthMeter, evaluatePasswordCriteria } from '@/components/ui/PasswordStrengthMeter';

const ROLES_LIST: MemberRelation[] = [
  'Mother',
  'Father',
  'Partner',
  'Daughter',
  'Son',
  'Grandmother',
  'Grandfather',
  'Self',
  'Other',
];

export default function RegisterScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isCreateFamily = mode === 'create_family';

  const { colors, isElderly } = useAppTheme();
  const {
    signUpWithEmail,
    verifyEmailCode,
    resendVerificationCode,
    signInWithGoogle,
    signInWithApple,
  } = useAuth();

  // Registration Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [role, setRole] = useState<MemberRelation>('Mother');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email Verification Step State
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('123456');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Haptic feedback helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Resend Timer Countdown
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Form Validation
  const validateForm = (): boolean => {
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return false;
    }

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return false;
    }

    if (cleanUsername) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(cleanUsername)) {
        setErrorMessage('Username must be 3-20 characters using letters, numbers, or underscores.');
        return false;
      }
    }

    if (!password) {
      setErrorMessage('Please create a password for your account.');
      return false;
    }

    const criteria = evaluatePasswordCriteria(password);
    if (!criteria.hasMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return false;
    }
    if (!(criteria.hasLower && criteria.hasUpper)) {
      setErrorMessage('Password must contain both uppercase and lowercase letters.');
      return false;
    }
    if (!criteria.hasNumber) {
      setErrorMessage('Password must contain at least one number (0-9).');
      return false;
    }

    if (!confirmPassword) {
      setErrorMessage('Please confirm your password.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entry.');
      return false;
    }

    return true;
  };

  const handleCreateAccount = async () => {
    if (loading) return;
    if (!validateForm()) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setErrorMessage(null);

    try {
      const finalFamilyName = familyName.trim() || `${name.trim()}'s Family`;
      const result = await signUpWithEmail(
        name,
        email,
        password,
        username,
        finalFamilyName,
        role
      );

      if (result.success) {
        if (result.verificationCode) {
          setSimulatedOtp(result.verificationCode);
        }
        setResendCooldown(30);
        setVerificationModalVisible(true);
      } else {
        setErrorMessage(result.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationLoading) return;
    if (!verificationCode.trim()) {
      setVerificationError('Please enter the 6-digit verification code.');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      const res = await verifyEmailCode(email, verificationCode);
      if (res.success) {
        setVerificationModalVisible(false);
        router.replace('/(tabs)');
      } else {
        setVerificationError(res.error || 'Invalid verification code. Please check and try again.');
      }
    } catch (e: any) {
      setVerificationError('Could not verify email. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    try {
      const res = await resendVerificationCode(email);
      if (res.code) {
        setSimulatedOtp(res.code);
      }
      setResendCooldown(30);
      setVerificationError(null);
    } catch (e) {
      setVerificationError('Failed to resend code. Please try again shortly.');
    }
  };

  const handleGoogleSignUp = async () => {
    if (loading) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (e) {
      setErrorMessage('Google Sign Up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    if (loading) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (e) {
      setErrorMessage('Apple Sign Up failed. Please try again.');
    } finally {
      setLoading(false);
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

        {/* Top Navigation Bar */}
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/login');
            }}
            hitSlop={12}
            style={styles.backNavButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backNavText, { color: colors.textSecondary }]}>
              Sign In
            </Text>
          </Pressable>

          <View
            style={[
              styles.stepBadge,
              { backgroundColor: colors.brandAccent + '15', borderColor: colors.brandAccent + '30' },
            ]}>
            <Text style={[styles.stepBadgeText, { color: colors.brandAccent }]}>
              {isCreateFamily ? '🏡 NEW FAMILY SPACE' : '👤 MEMBER REGISTRATION'}
            </Text>
          </View>
        </View>

        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text
            style={[
              styles.screenTitle,
              { color: colors.text, fontSize: isElderly ? 32 : 28 },
            ]}>
            {isCreateFamily ? 'Create your family space' : 'Create your account'}
          </Text>
          <Text
            style={[
              styles.screenSubtitle,
              { color: colors.textSecondary, fontSize: isElderly ? 16 : 14 },
            ]}>
            {isCreateFamily
              ? 'Establish a private, end-to-end encrypted hub for your whole household to coordinate daily life.'
              : 'Join Kinly to stay synchronized with your family schedules, tasks, and safety presence.'}
          </Text>
        </View>

        {/* Registration Card */}
        <View
          style={[
            styles.card,
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

          {/* SECTION 1: ACCOUNT & SECURITY */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={16} color={colors.brandAccent} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              ACCOUNT CREDENTIALS
            </Text>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Full Name
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={colors.textSecondary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage(null);
                  if (!familyName && val.trim()) {
                    const parts = val.trim().split(' ');
                    const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
                    setFamilyName(`The ${lastName} Family`);
                  }
                  if (!username && val.trim()) {
                    setUsername(val.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
                  }
                }}
                placeholder="e.g. Maya Miller"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputContainer,
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
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="name@family.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.textInput, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Username (Handle) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Username
              </Text>
              <Text style={[styles.optionalTag, { color: colors.textMuted }]}>
                Optional
              </Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}>
              <Ionicons
                name="at-outline"
                size={18}
                color={colors.textSecondary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                value={username}
                onChangeText={(val) => {
                  setUsername(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="maya_miller"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.textInput, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Password with Eye Toggle */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputContainer,
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
                placeholder="Minimum 8 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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
            {/* Redesigned Minimal Password Strength Meter */}
            <PasswordStrengthMeter password={password} />
          </View>

          {/* Confirm Password with Live Match Pill */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Confirm Password
              </Text>
              {confirmPassword.length > 0 && (
                <View
                  style={[
                    styles.matchBadge,
                    {
                      backgroundColor:
                        password === confirmPassword
                          ? colors.greenSoft
                          : colors.redSoft,
                      borderColor:
                        password === confirmPassword
                          ? colors.greenBorder
                          : colors.redBorder,
                    },
                  ]}>
                  <Ionicons
                    name={
                      password === confirmPassword
                        ? 'checkmark-circle'
                        : 'close-circle'
                    }
                    size={12}
                    color={
                      password === confirmPassword ? colors.green : colors.red
                    }
                  />
                  <Text
                    style={[
                      styles.matchBadgeText,
                      {
                        color:
                          password === confirmPassword
                            ? colors.green
                            : colors.red,
                      },
                    ]}>
                    {password === confirmPassword ? 'Matches' : 'Does not match'}
                  </Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.textSecondary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                style={[styles.textInput, { color: colors.text }]}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={10}
                style={styles.trailingAction}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* SECTION 2: FAMILY SPACE SETUP */}
          <View style={[styles.sectionHeader, { marginTop: 8 }]}>
            <Ionicons name="home-outline" size={16} color={colors.brandAccent} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              FAMILY SPACE SETUP
            </Text>
          </View>

          {/* Family Space Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Family Space Name
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}>
              <Ionicons
                name="home-outline"
                size={18}
                color={colors.textSecondary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                value={familyName}
                onChangeText={(val) => {
                  setFamilyName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. The Miller Family"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Role in Family */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Your Role in Family
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rolesRow}>
              {ROLES_LIST.map((r) => {
                const selected = role === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setRole(r);
                    }}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: selected
                          ? colors.brandAccent
                          : colors.separator,
                        borderColor: selected
                          ? colors.brandAccent
                          : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.roleChipText,
                        {
                          color: selected ? '#FFFFFF' : colors.text,
                          fontWeight: selected ? '700' : '500',
                        },
                      ]}>
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Primary Submit Button */}
          <Pressable
            onPress={handleCreateAccount}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.brandAccent,
                shadowColor: colors.brandAccent,
                opacity: loading ? 0.7 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContentRow}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {isCreateFamily ? 'Create Family Space & Continue' : 'Create Account & Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>

          {/* Switch to Sign In & Mode Toggle */}
          <View style={styles.switchColumn}>
            <View style={styles.switchRow}>
              <Text style={[styles.switchPrompt, { color: colors.textSecondary }]}>
                {isCreateFamily ? 'Just want a personal account?' : 'Want to establish a whole new family?'}
              </Text>
              <Pressable
                onPress={() => router.replace(isCreateFamily ? '/register?mode=signup' : '/register?mode=create_family')}
                hitSlop={8}>
                <Text style={[styles.switchAction, { color: colors.brandAccent }]}>
                  {isCreateFamily ? 'Sign Up as Member' : 'Create Family Space'}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.switchRow, { marginTop: 6 }]}>
              <Text style={[styles.switchPrompt, { color: colors.textSecondary }]}>
                Already have an account?
              </Text>
              <Pressable
                onPress={() => router.replace('/login')}
                hitSlop={8}>
                <Text style={[styles.switchAction, { color: colors.green }]}>
                  Sign In →
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Social Authentication Alternatives */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>
            OR CONTINUE WITH
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialButtonsStack}>
          <Pressable
            onPress={handleAppleSignUp}
            disabled={loading}
            style={({ pressed }) => [
              styles.appleButton,
              { opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
            ]}>
            <Ionicons name="logo-apple" size={19} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </Pressable>

          <Pressable
            onPress={handleGoogleSignUp}
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
              <Ionicons name="logo-google" size={16} color="#EA4335" />
            </View>
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </Pressable>
        </View>

        {/* Security & Privacy Assurance */}
        <View style={styles.privacyNoteBox}>
          <Ionicons name="shield-checkmark" size={14} color={colors.green} />
          <Text style={[styles.privacyNoteText, { color: colors.textMuted }]}>
            Passwords encrypted via SHA-256. Zero plaintext vault storage.
          </Text>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* EMAIL VERIFICATION MODAL SHEET                                            */}
      {/* ========================================================================= */}
      <Modal
        visible={verificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerificationModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {}}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrap,
                  { backgroundColor: colors.brandSoft },
                ]}>
                <Ionicons name="mail-open-outline" size={28} color={colors.brandAccent} />
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontSize: isElderly ? 24 : 20 },
                ]}>
                Verify Your Email
              </Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                We've sent a 6-digit verification code to{'\n'}
                <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>
              </Text>
            </View>

            {verificationError && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.redSoft, borderColor: colors.redBorder },
                ]}>
                <Ionicons name="alert-circle" size={16} color={colors.red} />
                <Text style={[styles.alertText, { color: colors.red }]}>
                  {verificationError}
                </Text>
              </View>
            )}

            {/* OTP Code Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Enter 6-Digit Code
                </Text>
                <View
                  style={[
                    styles.demoOtpBadge,
                    { backgroundColor: colors.blueSoft, borderColor: colors.blueBorder },
                  ]}>
                  <Text style={[styles.demoOtpText, { color: colors.blue }]}>
                    Verification Code: {simulatedOtp}
                  </Text>
                </View>
              </View>
              <TextInput
                value={verificationCode}
                onChangeText={(v) => {
                  setVerificationCode(v);
                  if (verificationError) setVerificationError(null);
                }}
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.brandAccent,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Verify & Enter Button */}
            <Pressable
              onPress={handleVerifyCode}
              disabled={verificationLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: colors.brandAccent,
                  shadowColor: colors.brandAccent,
                  opacity: verificationLoading ? 0.7 : pressed ? 0.9 : 1,
                },
              ]}>
              {verificationLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.buttonContentRow}>
                  <Text style={styles.primaryButtonText}>
                    Verify & Enter FamilyOS
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              )}
            </Pressable>

            {/* Resend Verification Code Button with Active Countdown */}
            <View style={styles.resendRow}>
              <Pressable
                onPress={handleResendVerification}
                disabled={resendCooldown > 0}
                hitSlop={8}>
                <Text
                  style={[
                    styles.resendText,
                    {
                      color:
                        resendCooldown > 0
                          ? colors.textMuted
                          : colors.brandAccent,
                      fontWeight: resendCooldown > 0 ? '500' : '700',
                    },
                  ]}>
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend Verification Code'}
                </Text>
              </Pressable>
            </View>
          </View>
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
    paddingTop: 40,
    paddingBottom: 48,
    gap: 18,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerBlock: {
    gap: 6,
  },
  screenTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    lineHeight: 20,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
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
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '500',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputContainer: {
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
    fontSize: 14,
    paddingVertical: 8,
  },
  trailingAction: {
    padding: 4,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  roleChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  switchColumn: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  switchPrompt: {
    fontSize: 13,
  },
  switchAction: {
    fontSize: 13,
    fontWeight: '700',
  },
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
    letterSpacing: 0.6,
  },
  socialButtonsStack: {
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
    shadowRadius: 4,
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
    shadowRadius: 4,
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
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  privacyNoteText: {
    fontSize: 11,
  },
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 6,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  demoOtpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  demoOtpText: {
    fontSize: 11,
    fontWeight: '700',
  },
  otpInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    paddingTop: 4,
  },
  resendText: {
    fontSize: 13,
  },
});
