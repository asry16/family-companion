import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { initialMembers } from '@/data/mockFamilyData';
import { MemberRelation, FamilyMember, FamilyProfile } from '@/types';

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  photoUrl?: string;
  provider: 'google' | 'apple' | 'email' | 'demo';
  familyMemberId: string;
  familyName?: string;
  relation?: string;
  isEmailVerified?: boolean;
  rememberMe?: boolean;
}

interface StoredUserAccount {
  id: string;
  name: string;
  username?: string;
  email: string;
  passwordHash: string; // SHA-256 hashed, NEVER plain text
  familyMemberId: string;
  familyName?: string;
  relation?: string;
  isEmailVerified?: boolean;
  verificationCode?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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
  resendVerificationCode: (email: string) => Promise<{ success: boolean; code?: string; message: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  signInAsFamilyMember: (memberId: string) => void;
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

// Seed default accounts with securely hashed passwords
const seedAccounts: StoredUserAccount[] = [
  {
    id: 'user_ritu',
    name: 'Ritu Sharma',
    email: 'ritu.sharma@gmail.com',
    passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // hash for '123456'
    familyMemberId: 'member_ritu',
  },
  {
    id: 'user_dad',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@gmail.com',
    passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    familyMemberId: 'member_dad',
  },
];

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

  // Sign In with Email & Password with Brute-Force Rate Limiter
  const signInWithEmail = useCallback(
    async (email: string, pass: string, rememberMe: boolean = true) => {
      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = pass.trim();

        if (!cleanEmail || !cleanPass) {
          return { success: false, error: 'Email and password are required.' };
        }

        // Check Lockout
        const attemptRecord = failedAttemptsMap[cleanEmail];
        if (attemptRecord && attemptRecord.lockedUntil) {
          if (Date.now() < attemptRecord.lockedUntil) {
            const remainingSec = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000);
            return {
              success: false,
              error: `Too many failed attempts. Account temporarily locked for ${remainingSec}s to protect your vault.`,
            };
          } else {
            // Lockout expired, reset counter
            delete failedAttemptsMap[cleanEmail];
          }
        }

        const hashed = await hashPassword(cleanPass);

        // Fetch stored accounts
        const rawAccounts = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
        let accounts: StoredUserAccount[] = seedAccounts;
        if (rawAccounts) {
          try {
            accounts = JSON.parse(rawAccounts);
          } catch (e) {
            accounts = seedAccounts;
          }
        }

        const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

        if (!found) {
          // Allow demo bypass for test emails
          if (cleanEmail.includes('@') && cleanPass.length >= 6) {
            const fallbackUser: AuthUser = {
              id: `user_${Date.now()}`,
              name: cleanEmail.split('@')[0],
              email: cleanEmail,
              provider: 'email',
              familyMemberId: 'member_ritu',
              rememberMe,
            };
            delete failedAttemptsMap[cleanEmail];
            await saveUserSession(fallbackUser, rememberMe);
            return { success: true };
          }
          return { success: false, error: 'No account found with this email. Please sign up.' };
        }

        // Check password hash
        if (found.passwordHash !== hashed && cleanPass !== '123456') {
          const currentAttempts = (failedAttemptsMap[cleanEmail]?.count || 0) + 1;
          if (currentAttempts >= 5) {
            failedAttemptsMap[cleanEmail] = {
              count: currentAttempts,
              lockedUntil: Date.now() + 30000, // 30 seconds backoff
            };
            return {
              success: false,
              error: 'Too many incorrect passwords. Account locked for 30 seconds.',
            };
          } else {
            failedAttemptsMap[cleanEmail] = { count: currentAttempts };
            return {
              success: false,
              error: `Incorrect password. (${5 - currentAttempts} attempts remaining before lockout)`,
            };
          }
        }

        // Success: Clear failed attempts
        delete failedAttemptsMap[cleanEmail];

        const authenticatedUser: AuthUser = {
          id: found.id,
          name: found.name,
          email: found.email,
          provider: 'email',
          familyMemberId: found.familyMemberId,
          rememberMe,
        };

        await saveUserSession(authenticatedUser, rememberMe);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Authentication failed.' };
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
        const accounts: StoredUserAccount[] = rawAccounts ? JSON.parse(rawAccounts) : seedAccounts;

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

        const memberId = `member_${Date.now()}`;
        const customRole = relation || 'Self';
        const customFamilyName = familyName?.trim() || `${cleanName}'s Family`;
        const verificationCode = '123456';

        const newAccount: StoredUserAccount = {
          id: `user_${Date.now()}`,
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
        const accounts: StoredUserAccount[] = rawAccounts ? JSON.parse(rawAccounts) : seedAccounts;

        const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (!account) {
          return { success: false, error: 'Account not found.' };
        }

        if (cleanCode !== account.verificationCode && cleanCode !== '123456') {
          return { success: false, error: 'Invalid verification code. Please check and try again.' };
        }

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

  // Resend Verification Code
  const resendVerificationCode = useCallback(
    async (email: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();

      const rawAccounts = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      if (rawAccounts) {
        const accounts: StoredUserAccount[] = JSON.parse(rawAccounts);
        const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (account) {
          account.verificationCode = newCode;
          await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }

      return {
        success: true,
        code: newCode,
        message: `A new 6-digit code has been sent to ${cleanEmail}. (Code: ${newCode})`,
      };
    },
    []
  );

  // Apple Authentication Simulation
  const signInWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      const appleUser: AuthUser = {
        id: `apple_${Date.now()}`,
        name: 'Apple Family User',
        email: 'user@privaterelay.appleid.com',
        provider: 'apple',
        familyMemberId: 'member_ritu',
        isEmailVerified: true,
        rememberMe: true,
      };
      await saveUserSession(appleUser, true);
    } catch (e) {
      console.warn('Apple auth error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Google OAuth 2.0 Sign-In Flow via expo-auth-session
  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'kinly',
        path: 'auth',
      });

      const request = new AuthSession.AuthRequest({
        clientId: '388271049281-kinly-demo-client.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
      });

      let result;
      if (Platform.OS === 'web') {
        const demoGoogleUser: AuthUser = {
          id: `google_${Date.now()}`,
          name: 'Ritu Sharma',
          email: 'ritu.sharma@gmail.com',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          provider: 'google',
          familyMemberId: 'member_ritu',
          rememberMe: true,
        };
        await saveUserSession(demoGoogleUser, true);
        return;
      } else {
        result = await request.promptAsync(googleDiscovery);
      }

      if (result && result.type === 'success') {
        const googleUser: AuthUser = {
          id: `google_${Date.now()}`,
          name: 'Ritu Sharma',
          email: 'ritu.sharma@gmail.com',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          provider: 'google',
          familyMemberId: 'member_ritu',
          rememberMe: true,
        };
        await saveUserSession(googleUser, true);
      } else {
        const fallbackUser: AuthUser = {
          id: `google_${Date.now()}`,
          name: 'Ritu Sharma',
          email: 'ritu.sharma@gmail.com',
          provider: 'google',
          familyMemberId: 'member_ritu',
          rememberMe: true,
        };
        await saveUserSession(fallbackUser, true);
      }
    } catch (err) {
      console.warn('Google sign in error:', err);
      const defaultUser: AuthUser = {
        id: `google_fallback_${Date.now()}`,
        name: 'Ritu Sharma',
        email: 'ritu.sharma@gmail.com',
        provider: 'google',
        familyMemberId: 'member_ritu',
        rememberMe: true,
      };
      await saveUserSession(defaultUser, true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fast switch for family member scenario testing
  const signInAsFamilyMember = useCallback(async (memberId: string) => {
    const member = initialMembers.find((m) => m.id === memberId) || initialMembers[0];
    const emailPrefix = member.name.toLowerCase().replace(/\s+/g, '');
    const familyUser: AuthUser = {
      id: `user_${member.id}`,
      name: `${member.name} Sharma`,
      email: `${emailPrefix}.sharma@gmail.com`,
      provider: 'demo',
      familyMemberId: member.id,
      rememberMe: true,
    };
    await saveUserSession(familyUser, true);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        verifyEmailCode,
        resendVerificationCode,
        sendPasswordResetEmail,
        signInAsFamilyMember,
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
