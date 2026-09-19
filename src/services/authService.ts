/**
 * AuthService Interface & Mock Implementation
 * Provides signIn, signUp, joinWithCode, and password reset via link or OTP
 */

export interface AuthServiceResponse {
  success: boolean;
  error?: string;
  familyName?: string;
  devCode?: string;
  message?: string;
}

export interface SignUpPayload {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  password: string;
  inviteCode?: string;
}

export interface IAuthService {
  signIn: (emailOrPhone: string, password: string) => Promise<AuthServiceResponse>;
  signUp: (payload: SignUpPayload) => Promise<AuthServiceResponse>;
  joinWithCode: (code: string) => Promise<AuthServiceResponse>;
  requestPasswordResetOtp: (identifier: string) => Promise<AuthServiceResponse>;
  verifyAndResetPasswordWithOtp: (identifier: string, code: string, newPassword: string) => Promise<AuthServiceResponse>;
}

// Simulated in-memory store for OTP reset verification
const pendingPasswordResetOtps: Record<string, { code: string; expiresAt: number }> = {};

class MockAuthService implements IAuthService {
  async signIn(emailOrPhone: string, password: string): Promise<AuthServiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const trimmed = emailOrPhone.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Please enter your email or phone number.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    return { success: true };
  }

  async signUp(payload: SignUpPayload): Promise<AuthServiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const { name, email, phone, password, inviteCode } = payload;

    if (!name || !name.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }

    const cleanEmail = email?.trim().toLowerCase() || '';
    const cleanPhone = phone?.trim() || '';

    // Rule: User must provide either email or phone (or both)
    if (!cleanEmail && !cleanPhone) {
      return {
        success: false,
        error: 'Please provide either an email address or a phone number (or both).',
      };
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (cleanPhone) {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        return { success: false, error: 'Please enter a valid phone number (at least 7 digits).' };
      }
    }

    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    if (inviteCode && inviteCode.trim().length > 0 && inviteCode.trim().length < 4) {
      return { success: false, error: 'Invalid invite code format.' };
    }

    return { success: true, familyName: inviteCode ? 'Connected Family' : undefined };
  }

  async joinWithCode(code: string): Promise<AuthServiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      return { success: false, error: 'Please enter a valid 6-character code.' };
    }

    return { success: true, familyName: 'KinLy Family' };
  }

  async requestPasswordResetOtp(identifier: string): Promise<AuthServiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, error: 'Please enter an email address or phone number.' };
    }

    // Generate a secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    pendingPasswordResetOtps[cleanId] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    const isPhone = !cleanId.includes('@') && /\d/.test(cleanId);
    const destination = isPhone ? `phone ${cleanId}` : `email ${cleanId}`;

    return {
      success: true,
      devCode: code,
      message: `A 6-digit OTP has been sent to your ${destination}. (Code: ${code})`,
    };
  }

  async verifyAndResetPasswordWithOtp(
    identifier: string,
    code: string,
    newPassword: string
  ): Promise<AuthServiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const cleanId = identifier.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanId) {
      return { success: false, error: 'Please specify the email or phone.' };
    }

    if (!cleanCode || cleanCode.length !== 6) {
      return { success: false, error: 'Please enter the 6-digit OTP code.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters.' };
    }

    const pending = pendingPasswordResetOtps[cleanId];
    // In mock/development mode, accept 123456 or matching generated code
    if (cleanCode === '123456' || (pending && pending.code === cleanCode)) {
      delete pendingPasswordResetOtps[cleanId];
      return {
        success: true,
        message: 'Your password has been successfully reset. You can now sign in.',
      };
    }

    return {
      success: false,
      error: 'Invalid or expired OTP code. Please check or request a new code.',
    };
  }
}

export const authService: IAuthService = new MockAuthService();
