/**
 * AuthService Interface & Mock Implementation
 * Provides signIn(email, password), signUp(name, email, password, inviteCode?), joinWithCode(code)
 */

export interface AuthServiceResponse {
  success: boolean;
  error?: string;
  familyName?: string;
}

export interface IAuthService {
  signIn: (email: string, password: string) => Promise<AuthServiceResponse>;
  signUp: (name: string, email: string, password: string, inviteCode?: string) => Promise<AuthServiceResponse>;
  joinWithCode: (code: string) => Promise<AuthServiceResponse>;
}

class MockAuthService implements IAuthService {
  async signIn(email: string, password: string): Promise<AuthServiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 650));

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    return { success: true };
  }

  async signUp(
    name: string,
    email: string,
    password: string,
    inviteCode?: string
  ): Promise<AuthServiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 750));

    if (!name.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
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
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      return { success: false, error: 'Please enter a valid 6-character code.' };
    }

    return { success: true, familyName: 'Kinly Family' };
  }
}

export const authService: IAuthService = new MockAuthService();
