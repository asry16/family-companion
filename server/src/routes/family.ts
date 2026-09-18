import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
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

// -------------------------------------------------------------
// POST /api/family/join - Join family via invite code
// -------------------------------------------------------------
router.post('/join', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inviteCode, relation } = req.body || {};
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Family invite code is required.' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const targetFamily = familiesRepo.findByInviteCode(cleanCode);

    if (!targetFamily) {
      return res.status(404).json({ success: false, error: 'Invalid invite code. No family found.' });
    }

    const userId = req.user!.id;
    const userName = req.user!.name;

    // Check if user is already a member
    const existingMember = membersRepo.findByUserId(userId);
    if (existingMember && existingMember.family_id === targetFamily.id) {
      return res.json({ success: true, message: 'You are already in this family circle.', familyId: targetFamily.id });
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

    return res.json({
      success: true,
      message: `Successfully joined ${targetFamily.name}!`,
      familyId: targetFamily.id,
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
