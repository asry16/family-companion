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
import { initialMembers } from '@/data/mockFamilyData';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    sendPasswordResetEmail,
    signInAsFamilyMember,
  } = useAuth();

  // Screen View Mode: 'gateway' (hero welcome) or 'signIn' (focused sign in form)
  const [viewMode, setViewMode] = useState<'gateway' | 'signIn'>('gateway');

  // Sign In Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Demo members bottom drawer sheet
  const [demoSheetVisible, setDemoSheetVisible] = useState(false);

  // Haptic feedback helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
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

  const handleMemberSelect = async (memberId: string) => {
    if (loading) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await signInAsFamilyMember(memberId);
      setDemoSheetVisible(false);
      router.replace('/(tabs)');
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

            {/* Clear, High-Conviction Action Buttons */}
            <View style={styles.actionsBlock}>
              {/* Primary CTA: Create Account */}
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/register');
                }}
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  {
                    backgroundColor: colors.brandAccent,
                    shadowColor: colors.brandAccent,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text
                  style={[
                    styles.primaryActionText,
                    { fontSize: isElderly ? 18 : 16 },
                  ]}>
                  Create Family Space
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>

              {/* Secondary CTA: Sign In */}
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setErrorMessage(null);
                  setViewMode('signIn');
                }}
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Ionicons name="mail-outline" size={18} color={colors.text} />
                <Text
                  style={[
                    styles.secondaryActionText,
                    { color: colors.text, fontSize: isElderly ? 17 : 15 },
                  ]}>
                  Sign In with Email
                </Text>
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

            {/* Demo Exploration Sheet Trigger */}
            <View style={styles.demoSheetTriggerRow}>
              <Pressable
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setDemoSheetVisible(true);
                }}
                style={styles.demoPillButton}>
                <Ionicons name="eye-outline" size={15} color={colors.brandAccent} />
                <Text style={[styles.demoPillText, { color: colors.brandAccent }]}>
                  Quick Demo: Explore as Sharma Family →
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
                Sign in with your email and password to access your family's vault.
              </Text>
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

              {/* Email Input */}
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
                        { fontSize: isElderly ? 18 : 16 },
                      ]}>
                      Sign In to Kinly
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </View>

            {/* Switch to Create Account */}
            <View style={styles.switchPromptRow}>
              <Text style={[styles.switchPromptText, { color: colors.textSecondary }]}>
                Don't have a family space yet?
              </Text>
              <Pressable
                onPress={() => router.push('/register')}
                hitSlop={8}>
                <Text style={[styles.switchPromptAction, { color: colors.brandAccent }]}>
                  Create Account
                </Text>
              </Pressable>
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

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK DEMO FAMILY SELECTOR SHEET                                 */}
      {/* ========================================================================= */}
      <Modal
        visible={demoSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDemoSheetVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDemoSheetVisible(false)}>
          <Pressable
            style={[
              styles.bottomSheetCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Ionicons name="sparkles" size={20} color={colors.brandAccent} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  Explore The Sharma Family
                </Text>
              </View>
              <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                Select any member profile to evaluate Kinly's full feature suite instantly:
              </Text>
            </View>

            <ScrollView
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {initialMembers.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => handleMemberSelect(member.id)}
                  style={({ pressed }) => [
                    styles.memberCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <FamilyAvatar member={member} size="sm" showStatus={false} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberMeta, { color: colors.textSecondary }]}>
                      {member.relation} • {member.name.toLowerCase().replace(/\s+/g, '')}@family.com
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward-circle"
                    size={22}
                    color={colors.brandAccent}
                  />
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setDemoSheetVisible(false)}
              style={styles.sheetCloseButton}>
              <Text style={[styles.sheetCloseText, { color: colors.textSecondary }]}>
                Close
              </Text>
            </Pressable>
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

  // Actions
  actionsBlock: {
    gap: 10,
    marginTop: 6,
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

  // Demo Trigger & Security
  demoSheetTriggerRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  demoPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  demoPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
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
});
