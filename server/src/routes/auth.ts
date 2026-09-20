import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { usersRepo, familiesRepo, membersRepo, placesRepo } from '../db/database';
import { JWT_SECRET, authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { sendOtpEmail } from '../services/mailer';

const router = Router();

const pendingRegistrationOtps = new Map<string, { code: string; expiresAt: number }>();

function generateInviteCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// -------------------------------------------------------------
// POST /api/auth/register
// -------------------------------------------------------------
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, age, password, username, familyName, relation } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? String(phone).trim() : undefined;
    const cleanAge = age !== undefined && age !== null && age !== '' ? parseInt(String(age), 10) : undefined;
    const cleanUsername = username?.trim();

    // Check duplicate email
    const existing = usersRepo.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);

    const userId = `user_${Date.now()}`;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Create User
    usersRepo.create({
      id: userId,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      age: cleanAge,
      passwordHash,
      isVerified: false,
      verificationCode,
    });

    // 2. Conditionally Create Family Workspace if familyName is explicitly provided
    let familyId: string | undefined = undefined;
    let memberId: string | undefined = undefined;
    let customRelation: string | undefined = undefined;
    let familyRecord: any = undefined;
    let memberRecord: any = undefined;

    if (familyName && familyName.trim()) {
      familyId = `family_${Date.now()}`;
      const customFamilyName = familyName.trim();
      const inviteCode = generateInviteCode();

      familiesRepo.create({
        id: familyId,
        name: customFamilyName,
        inviteCode,
        address: 'Home Residence',
        homeCity: 'Family Home',
        createdByUserId: userId,
      });

      const defaultPlaceId = `place_${Date.now()}`;
      placesRepo.create({
        id: defaultPlaceId,
        family_id: familyId,
        name: 'Home',
        type: 'home',
        address: 'Home Residence',
        emoji: '🏡',
        coords_x: 50.0,
        coords_y: 50.0,
        latitude: 28.4595,
        longitude: 77.0266,
        is_safe_zone: 1,
      });

      memberId = `member_${Date.now()}`;
      customRelation = relation || 'Self';
      const initials = cleanName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      membersRepo.create({
        id: memberId,
        family_id: familyId,
        user_id: userId,
        name: cleanName,
        relation: customRelation,
        initials,
        avatar_color: '#3B82F6',
        phone: '+1 555-0100',
        is_self: 1,
        status_message: 'Just joined Kinly!',
        current_place_id: defaultPlaceId,
        human_location: 'At Home',
        battery_level: 100,
        is_charging: 0,
        ringer_mode: 'sound',
        coords_x: 50.0,
        coords_y: 50.0,
        availability: 'available',
      });

      familyRecord = familiesRepo.findById(familyId);
      memberRecord = membersRepo.findById(memberId);
    }

    // Issue JWT
    const token = jwt.sign(
      { userId, email: cleanEmail, familyId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Send Verification Email via Nodemailer
    const mailResult = await sendOtpEmail({
      to: cleanEmail,
      subject: `🔐 Your Kinly Verification Code: ${verificationCode}`,
      title: 'Welcome to Kinly!',
      code: verificationCode,
      purpose: 'verification',
    }).catch((mailErr) => {
      console.warn('[Register Email Delivery Warning]', mailErr);
      return { success: false, delivered: false };
    });

    const userRecord = usersRepo.findById(userId);

    const responseData = {
      token,
      verificationCode,
      delivered: mailResult.delivered,
      user: {
        id: userRecord?.id,
        name: userRecord?.name,
        email: userRecord?.email,
        phone: userRecord?.phone,
        age: userRecord?.age,
        username: userRecord?.username,
        isVerified: userRecord?.is_verified === 1,
        familyMemberId: memberId,
        familyName: familyRecord?.name,
        familyInviteCode: familyRecord?.invite_code,
        familyUsername: familyRecord?.username,
        hasCompletedFamilySetup: Boolean(familyId && familyRecord),
        relation: customRelation,
      },
      family: familyRecord,
      member: memberRecord,
    };

    return res.status(201).json({
      success: true,
      ...responseData,
      data: responseData,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server registration failed.' });
  }
});

// -------------------------------------------------------------
// POST /api/auth/login
// -------------------------------------------------------------
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const user = usersRepo.findByEmail(cleanEmail);
    if (!user) {
      // Distinct error for missing user so client can check local offline vault or offer registration
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'No account found with this email in database.',
      });
    }

    // Password comparison supporting:
    // 1) Modern bcrypt
    // 2) Client legacy SHA-256 hash
    // 3) Plaintext hash fallback
    const sha256Input = crypto.createHash('sha256').update(cleanPass).digest('hex');
    const isBcryptMatch = await bcrypt.compare(cleanPass, user.password_hash);
    const isSha256Match = user.password_hash.toLowerCase() === sha256Input.toLowerCase();
    const isPlainMatch = user.password_hash === cleanPass;

    const isPasswordValid = isBcryptMatch || isSha256Match || isPlainMatch;

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'INCORRECT_PASSWORD',
        message: 'Incorrect password. Please verify your entry.',
      });
    }

    // Auto-upgrade legacy hash to modern bcrypt hash
    if (!isBcryptMatch && (isSha256Match || isPlainMatch)) {
      try {
        const upgradedHash = await bcrypt.hash(cleanPass, 10);
        usersRepo.updatePassword(cleanEmail, upgradedHash);
      } catch {}
    }

    // Resolve member & family
    let member = membersRepo.findByUserId(user.id);
    let familyId = member?.family_id;
    let family = familyId ? familiesRepo.findById(familyId) : undefined;

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, familyId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const responseData = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        username: user.username,
        isVerified: user.is_verified === 1,
        familyMemberId: member?.id,
        familyName: family?.name,
        familyInviteCode: family?.invite_code,
        familyUsername: family?.username,
        hasCompletedFamilySetup: Boolean(familyId && family),
        relation: member?.relation || 'Self',
      },
      family,
      member,
    };

    return res.json({
      success: true,
      ...responseData,
      data: responseData,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server login failed.' });
  }
});

// -------------------------------------------------------------
// POST /api/auth/send-otp (For Login OTP or Email Verification)
// -------------------------------------------------------------
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, purpose = 'verification' } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in users table if user exists, or in pending map for pre-registration
    const user = usersRepo.findByEmail(cleanEmail);
    if (user) {
      usersRepo.setVerificationCode(cleanEmail, code);
    } else {
      pendingRegistrationOtps.set(cleanEmail, { code, expiresAt: Date.now() + 15 * 60 * 1000 });
    }

    // Dispatch real email via Nodemailer
    const subject =
      purpose === 'login'
        ? `🔑 Your Kinly Login Code: ${code}`
        : purpose === 'password_reset'
        ? `🔐 Your Kinly Password Reset Code: ${code}`
        : `✉️ Your Kinly Verification Code: ${code}`;

    const title =
      purpose === 'login'
        ? 'Sign In to Kinly'
        : purpose === 'password_reset'
        ? 'Reset Your Password'
        : 'Verify Your Email';

    const mailResult = await sendOtpEmail({
      to: cleanEmail,
      subject,
      title,
      code,
      purpose: purpose as any,
    });

    const isDelivered = mailResult.delivered;
    const message = isDelivered
      ? `A 6-digit verification code has been dispatched to ${cleanEmail}. Check your inbox!`
      : `Simulated code: ${code}. (To receive live emails in your inbox, set your Gmail App Password in server/.env)`;

    return res.json({
      success: true,
      code,
      delivered: isDelivered,
      message,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch verification code.' });
  }
});

// -------------------------------------------------------------
// POST /api/auth/login-with-otp (Passwordless Sign In)
// -------------------------------------------------------------
router.post('/login-with-otp', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    let user = usersRepo.findByEmail(cleanEmail);

    // If user does not exist, auto-provision account
    if (!user) {
      const rawPrefix = cleanEmail.split('@')[0];
      const autoName = rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1);
      const userId = `user_${Date.now()}`;
      const familyId = `family_${Date.now()}`;
      const memberId = `member_${Date.now()}`;
      const randomPass = await bcrypt.hash(Math.random().toString(36), 10);

      usersRepo.create({
        id: userId,
        name: autoName,
        email: cleanEmail,
        passwordHash: randomPass,
        isVerified: true,
      });

      familiesRepo.create({
        id: familyId,
        name: `${autoName}'s Family`,
        inviteCode: generateInviteCode(),
      });

      membersRepo.create({
        id: memberId,
        family_id: familyId,
        user_id: userId,
        name: autoName,
        relation: 'Self',
        initials: autoName.slice(0, 2).toUpperCase(),
        is_self: 1,
      });

      user = usersRepo.findByEmail(cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    // Verify OTP code
    const isOtpValid = user.verification_code === cleanCode;
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_OTP',
        message: 'Invalid verification code. Please check your email or click Resend Code.',
      });
    }

    // Mark email verified and clear verification code
    usersRepo.verifyEmail(cleanEmail);

    let member = membersRepo.findByUserId(user.id);
    let familyId = member?.family_id;
    let family = familyId ? familiesRepo.findById(familyId) : undefined;

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, familyId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const responseData = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        username: user.username,
        isVerified: true,
        familyMemberId: member?.id,
        familyName: family?.name,
        relation: member?.relation || 'Self',
      },
      family,
      member,
    };

    return res.json({
      success: true,
      ...responseData,
      data: responseData,
    });
  } catch (err: any) {
    console.error('OTP Login error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'OTP authentication failed.' });
  }
});

// -------------------------------------------------------------
// POST /api/auth/google
// -------------------------------------------------------------
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token, idToken, accessToken, email: providedEmail, name: providedName, photoUrl: providedPhoto, googleId: providedGoogleId } = req.body || {};

    let verifiedEmail = providedEmail?.trim().toLowerCase();
    let verifiedName = providedName?.trim();
    let verifiedPhoto = providedPhoto?.trim();
    let verifiedGoogleId = providedGoogleId?.trim();

    // Verify token against Google tokeninfo if idToken/token provided
    const effectiveToken = idToken || token;
    if (effectiveToken) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${effectiveToken}`);
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (tokenData.email) {
            verifiedEmail = tokenData.email.toLowerCase();
            verifiedName = tokenData.name || verifiedName;
            verifiedPhoto = tokenData.picture || verifiedPhoto;
            verifiedGoogleId = tokenData.sub || verifiedGoogleId;
          }
        }
      } catch (tokenErr) {
        console.warn('[Google Auth] Tokeninfo verification warning:', tokenErr);
      }
    }

    if (accessToken && !verifiedEmail) {
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.email) {
            verifiedEmail = profileData.email.toLowerCase();
            verifiedName = profileData.name || verifiedName;
            verifiedPhoto = profileData.picture || verifiedPhoto;
            verifiedGoogleId = profileData.sub || verifiedGoogleId;
          }
        }
      } catch (profileErr) {
        console.warn('[Google Auth] Userinfo profile fetch warning:', profileErr);
      }
    }

    if (!verifiedEmail) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_GOOGLE_CREDENTIALS',
        message: 'Could not obtain verified email from Google authentication.',
      });
    }

    // 1. Check if user already exists
    let user = usersRepo.findByEmail(verifiedEmail);
    let userId = user?.id;

    if (!user) {
      userId = `user_google_${Date.now()}`;
      const defaultName = verifiedName || verifiedEmail.split('@')[0];

      usersRepo.create({
        id: userId,
        name: defaultName,
        username: verifiedEmail.split('@')[0],
        email: verifiedEmail,
        passwordHash: '',
        provider: 'google',
        isVerified: true,
      });

      const familyId = `family_${Date.now()}`;
      const familyName = `${defaultName.split(' ')[0]}'s Family`;
      const inviteCode = generateInviteCode();

      familiesRepo.create({
        id: familyId,
        name: familyName,
        inviteCode,
        address: 'Home Residence',
        homeCity: '',
        createdByUserId: userId,
      });

      const defaultPlaceId = `place_${Date.now()}`;
      placesRepo.create({
        id: defaultPlaceId,
        family_id: familyId,
        name: 'Home',
        type: 'home',
        address: 'Home Residence',
        emoji: '🏡',
        coords_x: 50.0,
        coords_y: 50.0,
        latitude: 28.4595,
        longitude: 77.0266,
        is_safe_zone: 1,
      });

      const memberId = `member_${Date.now()}`;
      const initials = defaultName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      membersRepo.create({
        id: memberId,
        family_id: familyId,
        user_id: userId,
        name: defaultName,
        relation: 'Self',
        initials: initials || 'GU',
        avatar_color: '#4285F4',
        phone: '',
        is_self: 1,
        status_message: 'Joined via Google',
        human_location: 'At Home',
        battery_level: 100,
        ringer_mode: 'sound',
        device_model: 'Mobile',
        coords_x: 50.0,
        coords_y: 50.0,
      });

      user = usersRepo.findById(userId);
    } else {
      usersRepo.verifyEmail(verifiedEmail);
    }

    if (!user) {
      return res.status(500).json({ success: false, error: 'User provisioning failed.' });
    }

    let member = membersRepo.findByUserId(user.id);
    let familyId = member?.family_id;
    let family = familyId ? familiesRepo.findById(familyId) : undefined;

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, familyId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const authUserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      photoUrl: verifiedPhoto || undefined,
      provider: 'google',
      isVerified: true,
      familyMemberId: member?.id,
      familyName: family?.name,
      relation: member?.relation || 'Self',
    };

    return res.json({
      success: true,
      token: jwtToken,
      user: authUserData,
      familyMember: member,
      family,
      data: {
        token: jwtToken,
        user: authUserData,
        familyMember: member,
        family,
      },
    });
  } catch (err: any) {
    console.error('[Google Auth] Error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Google authentication failed.',
    });
  }
});

// -------------------------------------------------------------
// GET /api/auth/me
// -------------------------------------------------------------
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = usersRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const member = membersRepo.findByUserId(userId);
    const family = member?.family_id ? familiesRepo.findById(member.family_id) : undefined;

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        isVerified: user.is_verified === 1,
        familyMemberId: member?.id,
        familyName: family?.name,
        relation: member?.relation || 'Self',
      },
      family,
      member,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch user session.' });
  }
});

// -------------------------------------------------------------
// POST /api/auth/verify-otp & /api/auth/verify-email
// -------------------------------------------------------------
const handleVerifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const user = usersRepo.findByEmail(cleanEmail);
    const pending = pendingRegistrationOtps.get(cleanEmail);

    if (user) {
      if (user.verification_code !== cleanCode) {
        // Also check pending map as fallback
        if (!pending || pending.code !== cleanCode || Date.now() >= pending.expiresAt) {
          return res.status(400).json({ success: false, error: 'Invalid verification code.' });
        }
      }

      usersRepo.verifyEmail(cleanEmail);
      if (pending) pendingRegistrationOtps.delete(cleanEmail);

      let member = membersRepo.findByUserId(user.id);
      let familyId = member?.family_id;
      let family = familyId ? familiesRepo.findById(familyId) : undefined;

      const token = jwt.sign(
        { userId: user.id, email: user.email, familyId },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Email verified successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          age: user.age,
          username: user.username,
          isVerified: true,
          familyMemberId: member?.id,
          familyName: family?.name,
          relation: member?.relation || 'Self',
        },
        family,
        member,
      });
    }

    if (pending && pending.code === cleanCode) {
      if (Date.now() >= pending.expiresAt) {
        pendingRegistrationOtps.delete(cleanEmail);
        return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
      }
      pendingRegistrationOtps.delete(cleanEmail);
      return res.json({ success: true, message: 'Verification code confirmed.' });
    }

    return res.status(404).json({ success: false, error: 'Invalid verification code or user not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'OTP verification failed.' });
  }
};

router.post('/verify-otp', handleVerifyCode);
router.post('/verify-email', handleVerifyCode);

// -------------------------------------------------------------
// POST /api/auth/forgot-password
// -------------------------------------------------------------
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const user = usersRepo.findByEmail(cleanEmail);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    if (user) {
      usersRepo.setVerificationCode(cleanEmail, code);
      sendOtpEmail({
        to: cleanEmail,
        subject: `🔐 Your Kinly Password Reset Code: ${code}`,
        title: 'Reset Your Password',
        code,
        purpose: 'password_reset',
      }).catch(() => {});
    }

    return res.json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${cleanEmail}. Check your inbox.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Password reset request failed.' });
  }
});

export default router;
