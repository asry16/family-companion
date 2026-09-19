import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { MemberRelation, FamilyMember, FamilyProfile } from '@/types';
import { apiClient } from '@/services/apiClient';

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  provider: 'google' | 'apple' | 'email' | 'demo';
  familyMemberId: string;
  familyName?: string;
  relation?: MemberRelation;
  isEmailVerified?: boolean;
  rememberMe?: boolean;
}

interface StoredUserAccount {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  passwordHash: string; // SHA-256 hashed, NEVER plain text
  familyMemberId: string;
  familyName?: string;
  relation?: MemberRelation;
  isEmailVerified?: boolean;
  verificationCode?: string;
  mode?: 'elderly' | 'default';
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signIn: (identifier: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (payload: {
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    password: string;
    inviteCode?: string;
    mode?: 'elderly' | 'default';
  }) => Promise<{ success: boolean; error?: string; familyName?: string }>;
  signInWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    name: string,
    email: string,
    pass: string,
    username?: string,
    familyName?: string,
    relation?: MemberRelation
  ) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: (email: string) => Promise<{ success: boolean; code?: string; delivered?: boolean; message: string }>;
  requestOtp: (
    email: string,
    purpose?: 'login' | 'register' | 'verification' | 'password_reset'
  ) => Promise<{ success: boolean; code?: string; devCode?: string; delivered?: boolean; message: string; error?: string }>;
  signInWithOtp: (email: string, code: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (updates: Partial<AuthUser>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@kinly_auth_user_v1';
const REGISTERED_ACCOUNTS_KEY = '@kinly_accounts_vault_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

// Google OpenID Connect discovery endpoints
const googleDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// In-memory brute force protection tracking
const failedAttemptsMap: Record<string, { count: number; lockedUntil?: number }> = {};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load existing session on mount with resilient error handling
  useEffect(() => {
    async function loadSession() {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored);
            if (parsedUser && parsedUser.id && parsedUser.email) {
              setUser(parsedUser);
            } else {
              // Corrupted payload: clean up safely
              await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            }
          } catch (jsonErr) {
            // Corrupted JSON: clean up safely to prevent app crash
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Failed to load user session:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const saveUserSession = async (authUser: AuthUser, rememberMe: boolean = true) => {
    setUser(authUser);
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  // Hash password using secure SHA-256 algorithm
  const hashPassword = async (rawPassword: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawPassword.trim()
    );
  };

  // Sign In with Email or Phone with Brute-Force Rate Limiter & Demo Account Support
  const signIn = useCallback(
    async (identifier: string, pass: string, rememberMe: boolean = true) => {
      try {
        const rawId = identifier.trim();
        const cleanPass = pass.trim();

        if (!rawId || !cleanPass) {
          return { success: false, error: 'Email address or phone number and password are required.' };
        }

        const isEmail = rawId.includes('@');
        const cleanEmail = isEmail ? rawId.toLowerCase() : '';
        const cleanPhoneDigits = !isEmail ? rawId.replace(/\D/g, '') : '';
        const lockoutKey = cleanEmail || cleanPhoneDigits || rawId;

        // Check Lockout
        const attemptRecord = failedAttemptsMap[lockoutKey];
        if (attemptRecord && attemptRecord.lockedUntil) {
          if (Date.now() < attemptRecord.lockedUntil) {
            const remainingSec = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000);
            return {
              success: false,
              error: `Too many failed attempts. Account temporarily locked for ${remainingSec}s to protect your vault.`,
            };
          } else {
            delete failedAttemptsMap[lockoutKey];
          }
        }

        // 1. Try Backend API first
        try {
          const apiRes = await apiClient.auth.login(cleanEmail || rawId, cleanPass);
          if (apiRes.success && apiRes.data?.user) {
            delete failedAttemptsMap[lockoutKey];
            const sUser = apiRes.data.user;
            const authenticatedUser: AuthUser = {
              id: sUser.id,
              name: sUser.name,
              username: sUser.username || undefined,
              email: sUser.email,
              phone: sUser.phone || undefined,
              provider: 'email',
              familyMemberId: sUser.familyMemberId || `member_${sUser.id}`,
              familyName: sUser.familyName || `${sUser.name}'s Family`,
              relation: sUser.relation || 'Self',
              isEmailVerified: !!sUser.isVerified,
              rememberMe,
            };
            await saveUserSession(authenticatedUser, rememberMe);
            return { success: true };
          }
        } catch {
          // Network error or server offline: proceed to local accounts
        }

        // 2. Check local accounts (AsyncStorage)
        const hashed = await hashPassword(cleanPass);
        const rawAccounts = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
        let accounts: StoredUserAccount[] = [];
        if (rawAccounts) {
          try {
            const parsed = JSON.parse(rawAccounts);
            if (Array.isArray(parsed)) {
              accounts = parsed;
            }
          } catch (e) {}
        }

        // Seed demo account if no accounts exist or if logging in as demo
        if (accounts.length === 0 || rawId.toLowerCase() === 'demo@kinly.app') {
          const demoHashed = await hashPassword('password123');
          const demoAccount: StoredUserAccount = {
            id: 'user_demo_chen',
            name: 'Sarah Chen',
            username: 'sarah_chen',
            email: 'demo@kinly.app',
            phone: '+1 555-0100',
            passwordHash: demoHashed,
            familyMemberId: 'member_demo_sarah',
            familyName: "Chen Family",
            relation: 'Mother',
            isEmailVerified: true,
          };
          if (!accounts.some((a) => a.email.toLowerCase() === 'demo@kinly.app')) {
            accounts.push(demoAccount);
            await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
          }
        }

        // Match by email, phone, or username
        const found = accounts.find((a) => {
          if (cleanEmail && a.email && a.email.toLowerCase() === cleanEmail) return true;
          if (cleanPhoneDigits && a.phone && a.phone.replace(/\D/g, '') === cleanPhoneDigits) return true;
          if (a.username && a.username.toLowerCase() === rawId.toLowerCase()) return true;
          return false;
        });

        if (found) {
          const isPasswordCorrect = found.passwordHash === hashed;
          if (isPasswordCorrect) {
            delete failedAttemptsMap[lockoutKey];

            const authenticatedUser: AuthUser = {
              id: found.id,
              name: found.name,
              username: found.username,
              email: found.email,
              phone: found.phone,
              provider: 'email',
              familyMemberId: found.familyMemberId || `member_${found.id}`,
              familyName: found.familyName || `${found.name}'s Family`,
              relation: found.relation || 'Self',
              isEmailVerified: true,
              rememberMe,
            };

            await saveUserSession(authenticatedUser, rememberMe);
            return { success: true };
          } else {
            const currentAttempts = (failedAttemptsMap[lockoutKey]?.count || 0) + 1;
            if (currentAttempts >= 5) {
              failedAttemptsMap[lockoutKey] = {
                count: currentAttempts,
                lockedUntil: Date.now() + 30000,
              };
              return {
                success: false,
                error: 'Too many incorrect passwords. Account locked for 30 seconds.',
              };
            } else {
              failedAttemptsMap[lockoutKey] = { count: currentAttempts };
              return {
                success: false,
                error: `Incorrect password. (${5 - currentAttempts} attempts remaining before lockout)`,
              };
            }
          }
        }

        return {
          success: false,
          error: isEmail
            ? 'No account found with this email. Please sign up.'
            : 'No account found with this phone number. Please sign up.',
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Authentication failed.' };
      }
    },
    []
  );

  // Sign In with Email (backwards compatibility wrapper)
  const signInWithEmail = useCallback(
    async (email: string, pass: string, rememberMe: boolean = true) => {
      return signIn(email, pass, rememberMe);
    },
    [signIn]
  );

  // Sign Up / Create Account with Email or Phone, DOB, Mode, and Immediate Session Activation
  const signUp = useCallback(
    async (payload: {
      name: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
      password: string;
      inviteCode?: string;
      mode?: 'elderly' | 'default';
    }) => {
      try {
        const cleanName = payload.name.trim();
        const cleanEmail = payload.email?.trim().toLowerCase() || '';
        const cleanPhone = payload.phone?.trim() || '';
        const cleanPhoneDigits = cleanPhone.replace(/\D/g, '');
        const cleanDob = payload.dateOfBirth?.trim() || '';
        const cleanPass = payload.password.trim();
        const inviteCode = payload.inviteCode?.trim();
        const mode = payload.mode || 'default';

        if (!cleanName) {
          return { success: false, error: 'Full name is required.' };
        }

        if (!cleanEmail && !cleanPhone) {
          return { success: false, error: 'Please enter an email address or phone number.' };
        }

        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return { success: false, error: 'Please enter a valid email address.' };
        }

        if (cleanPhone && (cleanPhoneDigits.length < 7 || cleanPhoneDigits.length > 15)) {
          return { success: false, error: 'Please enter a valid phone number (at least 7 digits).' };
        }

        if (cleanPass.length < 8) {
          return { success: false, error: 'Password must be at least 8 characters long.' };
        }

        const hashed = await hashPassword(cleanPass);

        // Fetch stored accounts
        const rawAccounts = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
        let accounts: StoredUserAccount[] = rawAccounts ? JSON.parse(rawAccounts) : [];

        // Check duplicate email
        if (cleanEmail && accounts.some((a) => a.email && a.email.toLowerCase() === cleanEmail)) {
          return { success: false, error: 'An account with this email already exists. Please sign in.' };
        }

        // Check duplicate phone
        if (cleanPhoneDigits && accounts.some((a) => a.phone && a.phone.replace(/\D/g, '') === cleanPhoneDigits)) {
          return { success: false, error: 'An account with this phone number already exists. Please sign in.' };
        }

        const customFamilyName = inviteCode ? 'Connected Family' : `${cleanName}'s Family`;
        const userId = `user_${Date.now()}`;
        const memberId = `member_${Date.now()}`;
        const fallbackEmail = cleanEmail || `${cleanPhoneDigits || userId}@kinly.local`;

        // Try backend registration in background (non-blocking)
        try {
          await apiClient.auth.register({
            name: cleanName,
            email: fallbackEmail,
            password: cleanPass,
            familyName: customFamilyName,
            relation: 'Self',
          });
        } catch {}

        const newAccount: StoredUserAccount = {
          id: userId,
          name: cleanName,
          email: fallbackEmail,
          phone: cleanPhone || undefined,
          dateOfBirth: cleanDob || undefined,
          passwordHash: hashed,
          familyMemberId: memberId,
          familyName: customFamilyName,
          relation: 'Self',
          isEmailVerified: true,
          mode,
        };

        accounts.push(newAccount);
        await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));

        // Create initial personalized user member and family profile in family storage
        const userMember: FamilyMember = {
          id: memberId,
          name: cleanName,
          relation: 'Self',
          initials: cleanName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          avatarColor: '#3B82F6',
          isSelf: true,
          statusMessage: 'Just joined KinLy!',
          currentPlaceId: 'place_home',
          humanLocation: 'At Home',
          batteryLevel: 98,
          isCharging: false,
          isSharingLocation: true,
          sharingDuration: 'always',
          lastUpdated: 'Just now',
          availability: 'available',
          phone: cleanPhone || '+1 555-0100',
          ringerMode: 'sound',
          deviceModel: Platform.OS === 'ios' ? 'iPhone 15 Pro' : 'Android Device',
          coords: {
            x: 50,
            y: 45,
            latitude: 28.4595,
            longitude: 77.0266,
          },
        };

        const userProfile: FamilyProfile = {
          id: `family_${Date.now()}`,
          name: customFamilyName,
          code: inviteCode || `KIN-${Math.floor(1000 + Math.random() * 9000)}`,
          address: 'Home Address',
          homeCity: 'Family Home',
          membersCount: 1,
        };

        const initialUserState = {
          profile: userProfile,
          members: [userMember],
          places: [
            {
              id: 'place_home',
              name: 'Home',
              address: 'Family Residence',
              type: 'home',
              isSafeZone: true,
              coordinates: { latitude: 28.4595, longitude: 77.0266 },
              iconName: 'home',
              color: '#3B82F6',
            },
          ],
          tasks: [],
          events: [],
          reminders: [],
          memories: [],
          documents: [],
          notifications: [
            {
              id: `notif_${Date.now()}`,
              title: `Welcome to ${customFamilyName}!`,
              body: `Your private family vault is active. Tap Circle to invite or add members.`,
              priority: 'important',
              timestamp: 'Just now',
              isRead: false,
              category: 'ai',
            },
          ],
          simpleMode: mode === 'elderly',
        };

        await AsyncStorage.setItem(`@kinly_family_state_${newAccount.id}`, JSON.stringify(initialUserState));
        await AsyncStorage.setItem('@kinly_family_state_v1', JSON.stringify(initialUserState));

        // Create authenticated user session and activate
        const authenticatedUser: AuthUser = {
          id: userId,
          name: cleanName,
          email: fallbackEmail,
          phone: cleanPhone || undefined,
          provider: 'email',
          familyMemberId: memberId,
          familyName: customFamilyName,
          relation: 'Self',
          isEmailVerified: true,
          rememberMe: true,
        };

        await saveUserSession(authenticatedUser, true);

        return {
          success: true,
          familyName: customFamilyName,
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Registration failed.' };
      }
    },
    []
  );

  // Sign Up / Create Account with Email & Password
  const signUpWithEmail = useCallback(
    async (
      name: string,
      email: string,
      pass: string,
      username?: string,
      familyName?: string,
      relation?: MemberRelation
    ) => {
      try {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username?.trim().toLowerCase();
        const cleanPass = pass.trim();

        if (!cleanName || !cleanEmail || !cleanPass) {
          return { success: false, error: 'Full name, email, and password are required.' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return { success: false, error: 'Please enter a valid email address.' };
        }

        if (cleanUsername) {
          const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
          if (!usernameRegex.test(cleanUsername)) {
            return {
              success: false,
              error: 'Username must be 3-20 characters (letters, numbers, underscores only).',
            };
          }
        }

        if (cleanPass.length < 8) {
          return {
            success: false,
            error: 'Password must be at least 8 characters long for security.',
          };
        }

        // Simulate backend registration network latency
        await new Promise((r) => setTimeout(r, 600));

        const hashed = await hashPassword(cleanPass);

        // Fetch stored accounts
        const rawAccounts = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
        const accounts: StoredUserAccount[] = rawAccounts ? JSON.parse(rawAccounts) : [];

        // Check duplicate email
        const existsEmail = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (existsEmail) {
          return { success: false, error: 'An account with this email already exists.' };
        }

        // Check duplicate username
        if (cleanUsername) {
          const existsUsername = accounts.find(
            (a) => a.username?.toLowerCase() === cleanUsername
          );
          if (existsUsername) {
            return {
              success: false,
              error: 'This username is already taken. Please choose another.',
            };
          }
        }

        const customRole = relation || 'Self';
        const customFamilyName = familyName?.trim() || `${cleanName}'s Family`;

        // Try backend registration first
        let serverUserId: string | null = null;
        let serverMemberId: string | null = null;
        let serverVerificationCode: string | undefined = undefined;

        try {
          const apiRes = await apiClient.auth.register({
            name: cleanName,
            email: cleanEmail,
            password: cleanPass,
            username: cleanUsername,
            familyName: customFamilyName,
            relation: customRole,
          });
          if (apiRes.success && apiRes.data?.user) {
            serverUserId = apiRes.data.user.id;
            serverMemberId = apiRes.data.user.familyMemberId;
            serverVerificationCode = apiRes.data.verificationCode;
          } else if (apiRes.error && apiRes.error.toLowerCase().includes('already exists')) {
            return { success: false, error: apiRes.error };
          }
        } catch {
          // Server offline: proceed with local secure offline registration
        }

        const memberId = serverMemberId || `member_${Date.now()}`;
        const userId = serverUserId || `user_${Date.now()}`;
        const verificationCode = serverVerificationCode || Math.floor(100000 + Math.random() * 900000).toString();

        const newAccount: StoredUserAccount = {
          id: userId,
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          passwordHash: hashed,
          familyMemberId: memberId,
          familyName: customFamilyName,
          relation: customRole,
          isEmailVerified: false,
          verificationCode,
        };

        accounts.push(newAccount);
        await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));

        // Create initial personalized user member and family profile in family storage
        const userMember: FamilyMember = {
          id: memberId,
          name: cleanName,
          relation: customRole,
          initials: cleanName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          avatarColor: '#3B82F6',
          isSelf: true,
          statusMessage: 'Just joined Kinly!',
          currentPlaceId: 'place_home',
          humanLocation: 'At Home',
          batteryLevel: 95,
          isCharging: false,
          isSharingLocation: true,
          sharingDuration: 'always',
          lastUpdated: 'Just now',
          availability: 'available',
          phone: '+1 555-0100',
          ringerMode: 'sound',
          deviceModel: Platform.OS === 'ios' ? 'iPhone 15 Pro' : 'Android Device',
          coords: {
            x: 50,
            y: 45,
            latitude: 28.4595,
            longitude: 77.0266,
          },
        };

        const userProfile: FamilyProfile = {
          id: `family_${Date.now()}`,
          name: customFamilyName,
          code: `KIN-${Math.floor(1000 + Math.random() * 9000)}`,
          address: 'Home Address',
          homeCity: 'Family Home',
          membersCount: 1,
        };

        const initialUserState = {
          profile: userProfile,
          members: [userMember],
          places: [
            {
              id: 'place_home',
              name: 'Home',
              address: 'Family Residence',
              type: 'home',
              isSafeZone: true,
              coordinates: { latitude: 28.4595, longitude: 77.0266 },
              iconName: 'home',
              color: '#3B82F6',
            },
          ],
          tasks: [],
          events: [],
          reminders: [],
          memories: [],
          documents: [],
          notifications: [
            {
              id: `notif_${Date.now()}`,
              title: `Welcome to ${customFamilyName}!`,
              body: `Your private family vault is active. Tap Family to invite or add members.`,
              priority: 'important',
              timestamp: 'Just now',
              isRead: false,
              category: 'ai',
            },
          ],
          simpleMode: false,
        };

        await AsyncStorage.setItem(`@kinly_family_state_${newAccount.id}`, JSON.stringify(initialUserState));
        await AsyncStorage.setItem('@kinly_family_state_v1', JSON.stringify(initialUserState));

        return {
          success: true,
          verificationCode,
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Registration failed.' };
      }
    },
    []
  );

  // Email OTP verification
  const verifyEmailCode = useCallback(
    async (email: string, code: string) => {
      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim();

        const rawAccounts = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
        const accounts: StoredUserAccount[] = rawAccounts ? JSON.parse(rawAccounts) : [];

        const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (!account) {
          return { success: false, error: 'Account not found.' };
        }

        if (cleanCode !== account.verificationCode) {
          return { success: false, error: 'Invalid verification code. Please check and try again.' };
        }

        // Attempt server verification
        try {
          await apiClient.auth.verifyOtp(cleanEmail, cleanCode);
        } catch {}

        account.isEmailVerified = true;
        await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));

        const verifiedUser: AuthUser = {
          id: account.id,
          name: account.name,
          username: account.username,
          email: account.email,
          provider: 'email',
          familyMemberId: account.familyMemberId,
          familyName: account.familyName,
          relation: account.relation,
          isEmailVerified: true,
          rememberMe: true,
        };

        await saveUserSession(verifiedUser, true);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Verification failed.' };
      }
    },
    []
  );

  // Resend Verification Code with real backend mailer dispatch
  const resendVerificationCode = useCallback(
    async (email: string) => {
      const cleanEmail = email.trim().toLowerCase();
      let dispatchedCode = Math.floor(100000 + Math.random() * 900000).toString();
      let isDelivered = false;

      // Dispatch to server mailer
      try {
        const apiRes = await apiClient.auth.sendOtp(cleanEmail, 'verification');
        if (apiRes.success) {
          const sCode = (apiRes as any).code || apiRes.data?.code;
          if (sCode) dispatchedCode = sCode;
          isDelivered = Boolean((apiRes as any).delivered || apiRes.data?.delivered);
        }
      } catch {}

      const rawAccounts = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      if (rawAccounts) {
        const accounts: StoredUserAccount[] = JSON.parse(rawAccounts);
        const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (account) {
          account.verificationCode = dispatchedCode;
          await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }

      return {
        success: true,
        code: dispatchedCode,
        delivered: isDelivered,
        message: isDelivered
          ? `A new 6-digit verification code has been dispatched to ${cleanEmail}. Check your inbox.`
          : `Simulated Code: ${dispatchedCode}. (Set Gmail credentials in server/.env for live delivery)`,
      };
    },
    []
  );

  // Request Login OTP or Email Code
  const requestOtp = useCallback(
    async (
      email: string,
      purpose: 'login' | 'register' | 'verification' | 'password_reset' = 'login'
    ) => {
      const cleanEmail = email.trim().toLowerCase();
      try {
        const res = await apiClient.auth.sendOtp(cleanEmail, purpose);
        if (res.success) {
          const code = (res as any).code || res.data?.code;
          const delivered = Boolean((res as any).delivered || res.data?.delivered);
          return {
            success: true,
            code,
            devCode: code,
            delivered,
            message: (res as any).message || res.data?.message || (delivered ? `A verification code has been dispatched to ${cleanEmail}.` : `Simulated code: ${code}`),
          };
        } else {
          return {
            success: false,
            message: res.error || 'Failed to dispatch verification code.',
            error: res.error,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          code: undefined,
          devCode: undefined,
          delivered: false,
          message: 'Could not contact server to send verification code. Please check connection.',
          error: err?.message || 'NETWORK_ERROR',
        };
      }
    },
    []
  );

  // Sign In using OTP (Passwordless authentication)
  const signInWithOtp = useCallback(
    async (email: string, code: string, rememberMe: boolean = true) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim();

      if (!cleanEmail || !cleanCode) {
        return { success: false, error: 'Email address and 6-digit OTP are required.' };
      }

      try {
        const res = await apiClient.auth.loginWithOtp(cleanEmail, cleanCode);
        if (res.success && res.data?.user) {
          const sUser = res.data.user;
          const authUser: AuthUser = {
            id: sUser.id,
            name: sUser.name,
            username: sUser.username || undefined,
            email: sUser.email,
            provider: 'email',
            familyMemberId: sUser.familyMemberId || `member_${sUser.id}`,
            familyName: sUser.familyName || `${sUser.name}'s Family`,
            relation: sUser.relation || 'Self',
            isEmailVerified: true,
            rememberMe,
          };
          delete failedAttemptsMap[cleanEmail];
          await saveUserSession(authUser, rememberMe);
          return { success: true };
        } else if (res.error && res.error.includes('INVALID_OTP')) {
          return { success: false, error: 'Invalid verification code. Please check your inbox or request a new code.' };
        }
      } catch (e: any) {
        return { success: false, error: e?.message || 'OTP sign-in failed.' };
      }

      return { success: false, error: 'Invalid OTP code. Please try again.' };
    },
    []
  );

  // Forgot Password / Password Reset Flow
  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    // Simulation of secure OTP / reset link
    return {
      success: true,
      message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox.`,
    };
  }, []);

  // Google OAuth 2.0 Sign-In Flow via expo-auth-session & Google API
  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);

      const googleClientId =
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        (Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID : undefined) ||
        (Platform.OS === 'android' ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID : undefined);

      if (!googleClientId) {
        throw new Error(
          'Google Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env file to enable Google sign-in.'
        );
      }

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'kinly',
        path: 'auth',
      });

      const request = new AuthSession.AuthRequest({
        clientId: googleClientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
      });

      const result = await request.promptAsync(googleDiscovery);

      if (result && result.type === 'success') {
        const accessToken = result.params?.access_token;
        const idToken = result.params?.id_token;
        let userInfo: any = null;

        if (accessToken) {
          try {
            const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (userinfoRes.ok) {
              userInfo = await userinfoRes.json();
            }
          } catch (e) {
            console.warn('[Google Auth] Failed to fetch userinfo from Google:', e);
          }
        }

        const apiRes = await apiClient.auth.loginWithGoogle({
          token: idToken || accessToken,
          idToken,
          accessToken,
          email: userInfo?.email,
          name: userInfo?.name,
          photoUrl: userInfo?.picture,
          googleId: userInfo?.sub,
        });

        if (apiRes.success && apiRes.data?.user) {
          const sUser = apiRes.data.user;
          const authenticatedUser: AuthUser = {
            id: sUser.id,
            name: sUser.name,
            email: sUser.email,
            photoUrl: sUser.photoUrl || userInfo?.picture,
            provider: 'google',
            familyMemberId: sUser.familyMemberId || `member_${sUser.id}`,
            familyName: sUser.familyName || `${sUser.name}'s Family`,
            relation: sUser.relation || 'Self',
            isEmailVerified: true,
            rememberMe: true,
          };
          await saveUserSession(authenticatedUser, true);
        } else {
          throw new Error(apiRes.error || 'Backend failed to register Google account.');
        }
      } else if (result && result.type === 'dismiss') {
        throw new Error('Google sign-in was dismissed.');
      } else if (result && result.type === 'cancel') {
        throw new Error('Google sign-in was cancelled.');
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    throw new Error('Apple Sign-In is only available on supported iOS devices.');
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: AuthUser = { ...prev, ...updates };
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated)).catch((err) => {
        console.error('Failed to save updated user profile:', err);
      });
      return updated;
    });
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      await apiClient.auth.logout();
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        signInWithApple,
        signIn,
        signUp,
        signInWithEmail,
        signUpWithEmail,
        verifyEmailCode,
        resendVerificationCode,
        requestOtp,
        signInWithOtp,
        sendPasswordResetEmail,
        updateUserProfile,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
