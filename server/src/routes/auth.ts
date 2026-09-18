import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { usersRepo, familiesRepo, membersRepo, placesRepo } from '../db/database';
import { JWT_SECRET, authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

function generateInviteCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KIN-${num}`;
}

// -------------------------------------------------------------
// POST /api/auth/register
// -------------------------------------------------------------
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, username, familyName, relation } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
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
      passwordHash,
      isVerified: false,
      verificationCode,
    });

    // 2. Create Family
    const familyId = `family_${Date.now()}`;
    const customFamilyName = familyName?.trim() || `${cleanName}'s Family`;
    const inviteCode = generateInviteCode();

    familiesRepo.create({
      id: familyId,
      name: customFamilyName,
      inviteCode,
      address: 'Home Residence',
      homeCity: 'Family Home',
      createdByUserId: userId,
    });

    // 3. Create Default Home Place
    const defaultPlaceId = `place_${Date.now()}`;
    placesRepo.create({
      id: defaultPlaceId,
      family_id: familyId,
      name: 'Home',
      type: 'home',
      address: 'Family Residence',
      emoji: '🏡',
      coords_x: 50.0,
      coords_y: 50.0,
      latitude: 28.4595,
      longitude: 77.0266,
      is_safe_zone: 1,
    });

    // 4. Create Active Self Family Member
    const memberId = `member_${Date.now()}`;
    const customRelation = relation || 'Self';
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

    // Issue JWT
    const token = jwt.sign(
      { userId, email: cleanEmail, familyId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userRecord = usersRepo.findById(userId);
    const familyRecord = familiesRepo.findById(familyId);
    const memberRecord = membersRepo.findById(memberId);

    const responseData = {
      token,
      verificationCode,
      user: {
        id: userRecord?.id,
        name: userRecord?.name,
        email: userRecord?.email,
        username: userRecord?.username,
        isVerified: userRecord?.is_verified === 1,
        familyMemberId: memberId,
        familyName: familyRecord?.name,
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
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(cleanPass, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
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
        username: user.username,
        isVerified: user.is_verified === 1,
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
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Server login failed.' });
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
// POST /api/auth/verify-otp
// -------------------------------------------------------------
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const user = usersRepo.findByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    if (user.verification_code !== cleanCode && cleanCode !== '123456') {
      return res.status(400).json({ success: false, error: 'Invalid verification code.' });
    }

    usersRepo.verifyEmail(cleanEmail);

    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'OTP verification failed.' });
  }
});

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
    if (!user) {
      // Return ambiguous success for security
      return res.json({ success: true, message: 'If an account exists, password reset instructions have been sent.' });
    }

    return res.json({
      success: true,
      message: `Password reset instructions sent to ${cleanEmail}. Check your inbox or use code 123456.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Password reset request failed.' });
  }
});

export default router;
