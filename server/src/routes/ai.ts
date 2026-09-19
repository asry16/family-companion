import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
  familiesRepo,
  membersRepo,
  tasksRepo,
  eventsRepo,
  remindersRepo,
  documentsRepo,
  memoriesRepo,
  placesRepo,
} from '../db/database';
import { sagemakerService } from '../aws';

const router = Router();
router.use(authMiddleware);

export interface AIActionCard {
  id: string;
  type: 'remind' | 'create_task' | 'check_in' | 'view_doc' | 'call' | 'navigate';
  title: string;
  subtitle?: string;
  confirmLabel: string;
  cancelLabel?: string;
  payload?: any;
}

export interface AIResponse {
  answer: string;
  highlight?: string;
  actionCard?: AIActionCard;
  relatedEntities?: {
    members?: any[];
    tasks?: any[];
    events?: any[];
    documents?: any[];
    memories?: any[];
  };
}

// -------------------------------------------------------------
// POST /api/ai/query - Context-Aware Family AI Intelligence
// -------------------------------------------------------------
router.post('/query', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { query, activeMemberId } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query string is required.' });
    }

    const normalized = query.trim().toLowerCase();

    // 1. Fetch live family context from SQLite
    const family = familiesRepo.findById(familyId);
    const dbMembers = membersRepo.findByFamilyId(familyId);
    const dbTasks = tasksRepo.findByFamilyId(familyId);
    const dbEvents = eventsRepo.findByFamilyId(familyId);
    const dbReminders = remindersRepo.findByFamilyId(familyId);
    const dbDocs = documentsRepo.findByFamilyId(familyId);
    const dbMemories = memoriesRepo.findByFamilyId(familyId);
    const dbPlaces = placesRepo.findByFamilyId(familyId);

    const familyName = family?.name || 'Your Family';

    const members = dbMembers.map((m) => ({
      id: m.id,
      name: m.name,
      relation: m.relation,
      initials: m.initials,
      avatarColor: m.avatar_color,
      phone: m.phone,
      isSelf: m.is_self === 1,
      statusMessage: m.status_message,
      currentPlaceId: m.current_place_id,
      humanLocation: m.human_location,
      batteryLevel: m.battery_level,
      isCharging: m.is_charging === 1,
      ringerMode: m.ringer_mode,
      deviceModel: m.device_model,
      coords: { x: m.coords_x, y: m.coords_y },
      latitude: m.latitude,
      longitude: m.longitude,
      isSharingLocation: m.is_sharing_location === 1,
      sharingDuration: m.sharing_duration,
      availability: m.availability,
      lastUpdated: m.last_updated,
    }));

    const tasks = dbTasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      assignedToMemberId: t.assigned_to_member_id,
      dueDate: t.due_date,
      dueTime: t.due_time,
      priority: t.priority,
      isCompleted: t.is_completed === 1,
      note: t.note,
    }));

    const events = dbEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      durationMinutes: e.duration_minutes,
      location: e.location,
      category: e.category,
      notes: e.notes,
      attendeeIds: JSON.parse(e.attendee_ids_json || '[]'),
    }));

    const reminders = dbReminders.map((r) => ({
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

    const documents = dbDocs.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      amount: d.amount,
      currency: d.currency,
      dueDate: d.due_date,
      provider: d.provider,
      status: d.status,
      assignedToMemberId: d.assigned_to_member_id,
      fields: JSON.parse(d.fields_json || '{}'),
      suggestedActions: JSON.parse(d.suggested_actions_json || '[]'),
      notes: d.notes,
    }));

    const memories = dbMemories.map((m) => ({
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

    const places = dbPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      emoji: p.emoji,
      isSafeZone: p.is_safe_zone === 1,
    }));

    const activeMember = members.find((m) => m.id === (activeMemberId || req.user!.memberId)) || members[0];

    // Helper: place name
    const getPlaceName = (placeId?: string | null) => {
      if (!placeId) return null;
      return places.find((p) => p.id === placeId)?.name || null;
    };

    // 2. Semantic Evaluation
    let response: AIResponse;

    // Check specific member query
    const targetMember = members.find((m) => {
      const n = m.name.toLowerCase();
      const r = m.relation.toLowerCase();
      return normalized.includes(n) || normalized.includes(r);
    });

    if (targetMember && (normalized.includes('where') || normalized.includes('location') || normalized.includes('at') || normalized.includes('status'))) {
      const placeName = getPlaceName(targetMember.currentPlaceId);
      const locText = placeName ? `at ${placeName}` : targetMember.humanLocation;
      const batteryText = `${targetMember.batteryLevel}%${targetMember.isCharging ? ' ⚡ (charging)' : ''}`;
      
      response = {
        answer: `${targetMember.name} (${targetMember.relation}) is currently ${locText}. Device battery is at ${batteryText} with ringer set to ${targetMember.ringerMode}. Status: "${targetMember.statusMessage}".`,
        highlight: locText,
        actionCard: {
          id: `act_${Date.now()}`,
          type: 'check_in',
          title: `Ping ${targetMember.name}`,
          subtitle: `Send a quick notification to check in with ${targetMember.name}`,
          confirmLabel: 'Send Ping',
          payload: { memberId: targetMember.id, memberName: targetMember.name },
        },
        relatedEntities: { members: [targetMember] },
      };
    } else if (targetMember && (normalized.includes('battery') || normalized.includes('charge') || normalized.includes('phone'))) {
      response = {
        answer: `${targetMember.name}'s ${targetMember.deviceModel} is at ${targetMember.batteryLevel}%${targetMember.isCharging ? ' (currently charging)' : ''}.`,
        highlight: `${targetMember.batteryLevel}%`,
        actionCard: targetMember.batteryLevel < 20 ? {
          id: `act_${Date.now()}`,
          type: 'remind',
          title: `Remind ${targetMember.name} to Charge`,
          subtitle: `Battery is low (${targetMember.batteryLevel}%)`,
          confirmLabel: 'Send Reminder',
          payload: { memberId: targetMember.id },
        } : undefined,
        relatedEntities: { members: [targetMember] },
      };
    } else if (normalized.includes('battery') || normalized.includes('low power') || normalized.includes('charge')) {
      const lowBatt = members.filter((m) => m.batteryLevel <= 25);
      if (lowBatt.length > 0) {
        const names = lowBatt.map((m) => `${m.name} (${m.batteryLevel}%)`).join(', ');
        response = {
          answer: `Low battery detected for: ${names}. All other members have sufficient charge.`,
          highlight: `${lowBatt.length} device(s) low`,
          actionCard: {
            id: `act_${Date.now()}`,
            type: 'remind',
            title: 'Send Battery Alert to Family',
            confirmLabel: 'Alert Everyone',
          },
          relatedEntities: { members: lowBatt },
        };
      } else {
        response = {
          answer: `All family members have good battery levels right now (all above 25%). Lowest is ${members.reduce((prev, curr) => curr.batteryLevel < prev.batteryLevel ? curr : prev, members[0])?.name} at ${Math.min(...members.map((m) => m.batteryLevel))}%.`,
          highlight: 'All Batteries Healthy',
        };
      }
    } else if (normalized.includes('task') || normalized.includes('chore') || normalized.includes('to do') || normalized.includes('todo')) {
      const pending = tasks.filter((t) => !t.isCompleted);
      if (pending.length === 0) {
        response = {
          answer: `Great news! There are no pending family tasks or chores right now. Everything is complete.`,
          highlight: 'All Tasks Complete',
        };
      } else {
        const listStr = pending.slice(0, 4).map((t) => {
          const assignee = members.find((m) => m.id === t.assignedToMemberId)?.name || 'Unassigned';
          return `• "${t.title}" (${t.priority} priority, assigned to ${assignee})`;
        }).join('\n');
        response = {
          answer: `You have ${pending.length} pending family task(s):\n${listStr}`,
          highlight: `${pending.length} Pending Task(s)`,
          actionCard: {
            id: `act_${Date.now()}`,
            type: 'create_task',
            title: 'Add New Family Task',
            confirmLabel: 'Create Task',
          },
          relatedEntities: { tasks: pending },
        };
      }
    } else if (normalized.includes('event') || normalized.includes('calendar') || normalized.includes('schedule') || normalized.includes('today') || normalized.includes('tomorrow')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const upcoming = events.filter((e) => e.date >= todayStr).slice(0, 3);
      if (upcoming.length === 0) {
        response = {
          answer: `No upcoming calendar events found for ${familyName}. Would you like to schedule one?`,
          highlight: 'Schedule Clear',
        };
      } else {
        const evtStr = upcoming.map((e) => `• ${e.title} on ${e.date} at ${e.time} (${e.location})`).join('\n');
        response = {
          answer: `Here are the upcoming family events:\n${evtStr}`,
          highlight: `${upcoming.length} Upcoming Event(s)`,
          relatedEntities: { events: upcoming },
        };
      }
    } else if (normalized.includes('bill') || normalized.includes('document') || normalized.includes('due') || normalized.includes('pay') || normalized.includes('vault')) {
      const unpaid = documents.filter((d) => d.status === 'unpaid' || d.status === 'pending');
      if (unpaid.length > 0) {
        const bills = unpaid.map((d) => `• ${d.title}: ${d.currency} ${d.amount || 0} due ${d.dueDate || 'soon'}`).join('\n');
        response = {
          answer: `You have ${unpaid.length} pending document/bill(s) in your family vault:\n${bills}`,
          highlight: `${unpaid.length} Pending Bill(s)`,
          actionCard: {
            id: `act_${Date.now()}`,
            type: 'view_doc',
            title: 'Review Pending Bills',
            confirmLabel: 'Open Vault',
          },
          relatedEntities: { documents: unpaid },
        };
      } else {
        response = {
          answer: `All family vault documents and bills are up to date. No pending payments found.`,
          highlight: 'Bills Up to Date',
          relatedEntities: { documents },
        };
      }
    } else if (normalized.includes('where is') || normalized.includes('where are') || normalized.includes('find') || normalized.includes('passport') || normalized.includes('key') || normalized.includes('item') || normalized.includes('memory')) {
      const found = memories.filter((m) => {
        const t = m.title.toLowerCase();
        const l = m.savedLocation.toLowerCase();
        const tags = m.tags.join(' ').toLowerCase();
        return normalized.includes(t) || t.split(' ').some((word) => word.length > 3 && normalized.includes(word)) || normalized.includes(tags);
      });

      if (found.length > 0) {
        const item = found[0];
        response = {
          answer: `Found in Family Memories: ${item.emoji || '📌'} "${item.title}" is located at: ${item.savedLocation}. Notes: ${item.notes || 'None'}.`,
          highlight: item.savedLocation,
          relatedEntities: { memories: found },
        };
      } else {
        response = {
          answer: `I couldn't find a specific saved memory matching "${query}". You can save it in the Family Vault / Memories tab so everyone knows where it is kept!`,
          highlight: 'Memory Not Found',
        };
      }
    } else {
      // General overview and intelligent reasoning powered by AWS SageMaker AI / Bedrock
      const memberNames = members.map((m) => m.name).join(', ');
      const pendingTasksCount = tasks.filter((t) => !t.isCompleted).length;
      const todayDate = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      
      const contextSummary = `Family: ${familyName}. Active members (${members.length}): ${memberNames}. Pending Tasks: ${pendingTasksCount}. Events: ${events.length}. Vault Documents: ${documents.length}. Today: ${todayDate}.`;
      const aiInference = await sagemakerService.queryAssistant(query, contextSummary);

      const generatedAnswer = aiInference.source !== 'heuristic_engine' && aiInference.answer
        ? aiInference.answer
        : `Hello! I'm Kinly, your intelligent assistant for the ${familyName}. It's ${todayDate}. You have ${members.length} members connected (${memberNames}), ${pendingTasksCount} pending tasks, and ${events.length} scheduled family events. How can I help you today?`;

      response = {
        answer: generatedAnswer,
        highlight: `${familyName} Hub • AWS AI`,
        actionCard: {
          id: `act_${Date.now()}`,
          type: 'check_in',
          title: 'Family Status Check',
          subtitle: 'Check on live battery and locations',
          confirmLabel: 'View Status',
        },
      };
    }

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('AI Query error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to process AI query.' });
  }
});

export default router;
