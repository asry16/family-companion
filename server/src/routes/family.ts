import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth';
import {
  familiesRepo,
  membersRepo,
  placesRepo,
  tasksRepo,
  eventsRepo,
  remindersRepo,
  documentsRepo,
  memoriesRepo,
  notificationsRepo,
} from '../db/database';
import { broadcastToFamily } from '../websocket';

const router = Router();

// -------------------------------------------------------------
// GET /api/family/lookup - Public Preview for Joining
// -------------------------------------------------------------
router.get('/lookup', async (req: Request, res: Response) => {
  try {
    const rawQuery = ((req.query.query as string) || (req.query.username as string) || (req.query.code as string) || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, error: 'Please provide a family username or invite code.' });
    }

    const family = familiesRepo.findByUsernameOrCode(rawQuery);
    if (!family) {
      return res.status(404).json({ success: false, error: 'No family found with that username or invite code.' });
    }

    const members = membersRepo.findByFamilyId(family.id);
    const lookupData = {
      family: {
        id: family.id,
        name: family.name,
        username: family.username,
        inviteCode: family.invite_code,
        membersCount: members.length,
      },
    };
    return res.json({
      success: true,
      ...lookupData,
      data: lookupData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lookup failed.' });
  }
});

router.use(authMiddleware);

// -------------------------------------------------------------
// GET /api/family - Full Family State Snapshot
// -------------------------------------------------------------
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId;
    if (!familyId) {
      return res.status(404).json({ success: false, error: 'No family associated with this user.' });
    }

    const family = familiesRepo.findById(familyId);
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found.' });
    }

    const rawMembers = membersRepo.findByFamilyId(familyId);
    const rawPlaces = placesRepo.findByFamilyId(familyId);
    const rawTasks = tasksRepo.findByFamilyId(familyId);
    const rawEvents = eventsRepo.findByFamilyId(familyId);
    const rawReminders = remindersRepo.findByFamilyId(familyId);
    const rawDocuments = documentsRepo.findByFamilyId(familyId);
    const rawMemories = memoriesRepo.findByFamilyId(familyId);
    const rawNotifications = notificationsRepo.findByFamilyId(familyId);

    // Map database structures to frontend client shapes
    const members = rawMembers.map((m) => ({
      id: m.id,
      name: m.name,
      relation: m.relation,
      initials: m.initials,
      avatarColor: m.avatar_color,
      photoUrl: m.photo_url || undefined,
      phone: m.phone,
      isSelf: m.user_id === req.user!.id || m.is_self === 1,
      statusMessage: m.status_message,
      currentPlaceId: m.current_place_id || 'place_home',
      humanLocation: m.human_location,
      batteryLevel: m.battery_level,
      isCharging: m.is_charging === 1,
      ringerMode: m.ringer_mode,
      deviceModel: m.device_model,
      coords: { x: m.coords_x, y: m.coords_y, latitude: m.latitude, longitude: m.longitude },
      isSharingLocation: m.is_sharing_location === 1,
      sharingDuration: m.sharing_duration,
      availability: m.availability,
      lastUpdated: m.last_updated,
    }));

    const places = rawPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      emoji: p.emoji,
      coords: { x: p.coords_x, y: p.coords_y },
      latitude: p.latitude,
      longitude: p.longitude,
      isSafeZone: p.is_safe_zone === 1,
    }));

    const tasks = rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      assignedToMemberId: t.assigned_to_member_id,
      createdByMemberId: t.created_by_member_id,
      dueDate: t.due_date || 'Today',
      dueTime: t.due_time,
      priority: t.priority,
      isCompleted: t.is_completed === 1,
      note: t.note,
    }));

    const events = rawEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      durationMinutes: e.duration_minutes,
      location: e.location,
      category: e.category,
      notes: e.notes,
      attendeeMemberIds: JSON.parse(e.attendee_ids_json || '[]'),
    }));

    const reminders = rawReminders.map((r) => ({
      id: r.id,
      title: r.title,
      targetMemberId: r.target_member_id,
      time: r.time,
      dueDate: r.due_date,
      category: r.category,
      urgency: r.urgency,
      isDone: r.is_done === 1,
      repeat: r.repeat,
    }));

    const documents = rawDocuments.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      amount: d.amount,
      currency: d.currency,
      dueDate: d.due_date,
      provider: d.provider,
      status: d.status,
      assignedToMemberId: d.assigned_to_member_id,
      scannedAt: d.scanned_at,
      fields: JSON.parse(d.fields_json || '[]'),
      suggestedActions: JSON.parse(d.suggested_actions_json || '[]'),
      notes: d.notes,
    }));

    const memories = rawMemories.map((m) => ({
      id: m.id,
      title: m.title,
      category: m.category,
      savedLocation: m.saved_location,
      lastVerified: m.last_verified,
      notes: m.notes,
      tags: JSON.parse(m.tags_json || '[]'),
      relatedMemberIds: JSON.parse(m.related_member_ids_json || '[]'),
      emoji: m.emoji,
    }));

    const notifications = rawNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      priority: n.priority,
      isRead: n.is_read === 1,
      category: n.category,
      timestamp: n.created_at,
    }));

    return res.json({
      success: true,
      data: {
        profile: {
          id: family.id,
          name: family.name,
          username: family.username,
          code: family.invite_code,
          address: family.address,
          homeCity: family.home_city,
          membersCount: members.length,
        },
        members,
        places,
        tasks,
        events,
        reminders,
        documents,
        memories,
        notifications,
      },
    });
  } catch (err: any) {
    console.error('Fetch family error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch family data.' });
  }
});

function generateFamilyUsername(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/\s+(family|household)$/, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'family';
  const discriminator = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${discriminator}`;
}

function generateInviteCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// -------------------------------------------------------------
// POST /api/family/create - Create New Family Circle
// -------------------------------------------------------------
router.post('/create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { name, username } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Family name is required.' });
    }

    const cleanName = name.trim();
    let familyUsername = username
      ? username.replace(/^@/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      : '';

    if (!familyUsername) {
      return res.status(400).json({ success: false, error: 'Family ID is required (e.g. @therfamily).' });
    }

    if (familyUsername.length < 3) {
      return res.status(400).json({ success: false, error: 'Family ID must be at least 3 characters long.' });
    }

    // Ensure uniqueness
    const existing = familiesRepo.findByUsername(familyUsername);
    if (existing) {
      return res.status(409).json({ success: false, error: `Family ID "@${familyUsername}" is already taken. Please choose another.` });
    }

    let inviteCode = generateInviteCode();
    let codeAttempts = 0;
    while (familiesRepo.findByInviteCode(inviteCode) && codeAttempts < 10) {
      inviteCode = generateInviteCode();
      codeAttempts++;
    }

    const familyId = `family_${Date.now()}`;
    familiesRepo.create({
      id: familyId,
      name: cleanName,
      username: familyUsername,
      inviteCode,
      address: 'Home',
      homeCity: '',
      createdByUserId: req.user.id,
    });

    // Create 1 Default Safe Home Place
    const defaultPlaceId = `place_${Date.now()}`;
    placesRepo.create({
      id: defaultPlaceId,
      family_id: familyId,
      name: 'Home',
      type: 'home',
      address: 'Family Sanctuary',
      emoji: '🏡',
      coords_x: 50.0,
      coords_y: 50.0,
      latitude: 28.4595,
      longitude: 77.0266,
      is_safe_zone: 1,
    });

    // Create Founding Self Member (ONLY the user - zero presets!)
    const memberId = `member_${Date.now()}`;
    const initials = req.user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    membersRepo.create({
      id: memberId,
      family_id: familyId,
      user_id: req.user.id,
      name: req.user.name,
      relation: 'Self',
      initials,
      avatar_color: '#3B82F6',
      phone: '+1 555-0100',
      is_self: 1,
      status_message: 'Just created our family space!',
      current_place_id: defaultPlaceId,
      human_location: 'At Home',
      battery_level: 100,
      is_charging: 0,
      ringer_mode: 'sound',
      coords_x: 50.0,
      coords_y: 50.0,
      availability: 'available',
    });

    // Single Welcome Notification
    notificationsRepo.create({
      id: `notif_${Date.now()}`,
      family_id: familyId,
      title: `Welcome to ${cleanName}!`,
      body: `Your private family vault is active. Share @${familyUsername} with your family members to invite them.`,
      priority: 'important',
      is_read: 0,
      category: 'ai',
    });

    // Issue refreshed JWT token containing familyId
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email, familyId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const createData = {
      token,
      family: {
        id: familyId,
        name: cleanName,
        username: familyUsername,
        inviteCode,
        address: 'Home',
        homeCity: '',
        membersCount: 1,
      },
      member: {
        id: memberId,
        name: req.user.name,
        relation: 'Self',
        initials,
      },
    };

    return res.status(201).json({
      success: true,
      ...createData,
      data: createData,
    });
  } catch (err: any) {
    console.error('Create family error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create family circle.' });
  }
});

// -------------------------------------------------------------
// POST /api/family/join - Join family via username or invite code
// -------------------------------------------------------------
router.post('/join', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inviteCode, username, usernameOrCode, relation } = req.body || {};
    const query = (usernameOrCode || username || inviteCode || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Family username or invite code is required.' });
    }

    const targetFamily = familiesRepo.findByUsernameOrCode(query);
    if (!targetFamily) {
      return res.status(404).json({
        success: false,
        error: `No family circle found matching "${query}". Please check the username or code.`,
      });
    }

    const userId = req.user!.id;
    const userName = req.user!.name;

    // Check if user is already a member
    const existingMember = membersRepo.findByUserId(userId);
    if (existingMember && existingMember.family_id === targetFamily.id) {
      if (relation && relation !== existingMember.relation) {
        membersRepo.update(existingMember.id, { relation });
      }

      const token = jwt.sign(
        { userId, email: req.user!.email, familyId: targetFamily.id },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const joinData = {
        message: 'You are connected to this family circle.',
        familyId: targetFamily.id,
        familyName: targetFamily.name,
        familyUsername: targetFamily.username,
        inviteCode: targetFamily.invite_code,
        token,
      };

      return res.json({
        success: true,
        ...joinData,
        data: joinData,
      });
    }

    // Create new member in target family
    const memberId = `member_${Date.now()}`;
    const initials = userName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    membersRepo.create({
      id: memberId,
      family_id: targetFamily.id,
      user_id: userId,
      name: userName,
      relation: relation || 'Family Member',
      initials,
      avatar_color: '#10B981',
      phone: '+1 555-0100',
      is_self: 1,
      status_message: 'Joined family circle',
      human_location: 'At Home',
      battery_level: 95,
      availability: 'available',
    });

    broadcastToFamily(targetFamily.id, {
      type: 'MEMBER_JOINED',
      name: userName,
      relation: relation || 'Family Member',
    });

    const token = jwt.sign(
      { userId, email: req.user!.email, familyId: targetFamily.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const joinData = {
      message: `Successfully joined ${targetFamily.name}!`,
      familyId: targetFamily.id,
      familyName: targetFamily.name,
      familyUsername: targetFamily.username,
      inviteCode: targetFamily.invite_code,
      token,
    };

    return res.json({
      success: true,
      ...joinData,
      data: joinData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to join family.' });
  }
});

// -------------------------------------------------------------
// PUT /api/family/profile - Update Household Profile
// -------------------------------------------------------------
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { name, address, homeCity } = req.body || {};

    familiesRepo.updateProfile(familyId, { name, address, homeCity });

    broadcastToFamily(familyId, {
      type: 'FAMILY_PROFILE_UPDATED',
      payload: { name, address, homeCity },
    });

    return res.json({ success: true, message: 'Household profile updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update profile.' });
  }
});

// -------------------------------------------------------------
// POST /api/family/members - Add New Member
// -------------------------------------------------------------
router.post('/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { name, relation, phone, avatarColor, ringerMode, deviceModel, batteryLevel } = req.body || {};

    if (!name) {
      return res.status(400).json({ success: false, error: 'Member name is required.' });
    }

    const cleanName = name.trim();
    const memberId = `member_${Date.now()}`;
    const initials = cleanName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    // Spread coordinates slightly so pins don't overlap
    const existingCount = membersRepo.findByFamilyId(familyId).length;
    const coordsX = 50 + ((existingCount * 28 + 15) % 60) - 30;
    const coordsY = 48 + ((existingCount * 34 + 10) % 50) - 25;

    membersRepo.create({
      id: memberId,
      family_id: familyId,
      name: cleanName,
      relation: relation || 'Other',
      initials,
      avatar_color: avatarColor || '#3B82F6',
      phone: phone || '',
      is_self: 0,
      status_message: 'Connected to Kinly',
      human_location: 'At Home',
      battery_level: parseInt(batteryLevel) || 85,
      is_charging: 0,
      ringer_mode: ringerMode || 'sound',
      device_model: deviceModel || 'Smartphone',
      coords_x: coordsX,
      coords_y: coordsY,
      availability: 'available',
    });

    const newMember = membersRepo.findById(memberId);

    broadcastToFamily(familyId, {
      type: 'MEMBER_ADDED',
      member: newMember,
    });

    return res.status(201).json({ success: true, member: newMember });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to add member.' });
  }
});

// -------------------------------------------------------------
// PUT /api/family/members/:id - Update Member
// -------------------------------------------------------------
router.put('/members/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memberId = req.params.id;
    const updates = req.body || {};

    membersRepo.update(memberId, updates);

    broadcastToFamily(req.familyId!, {
      type: 'MEMBER_UPDATED',
      memberId,
      updates,
    });

    return res.json({ success: true, message: 'Member updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update member.' });
  }
});

// -------------------------------------------------------------
// DELETE /api/family/members/:id - Remove Member
// -------------------------------------------------------------
router.delete('/members/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memberId = req.params.id;
    membersRepo.delete(memberId);

    broadcastToFamily(req.familyId!, {
      type: 'MEMBER_REMOVED',
      memberId,
    });

    return res.json({ success: true, message: 'Member removed from family circle.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to remove member.' });
  }
});

export default router;
