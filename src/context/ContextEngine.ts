import {
  FamilyMember,
  FamilyPlace,
  Task,
  CalendarEvent,
  Reminder,
  FamilyDocument,
  AISuggestion,
} from '@/types';

export interface ContextStateSnapshot {
  members: FamilyMember[];
  places: FamilyPlace[];
  tasks: Task[];
  events: CalendarEvent[];
  reminders: Reminder[];
  documents: FamilyDocument[];
}

/**
 * Family Context Engine:
 * Combines cross-domain state (people, location, schedule, tasks, reminders, documents)
 * into proactive, high-value, user-defined suggestions.
 * 
 * "Don't make the family manage the app. Make the app understand the family."
 * "The app does the thinking. The user only makes the decision."
 */
export function generateContextSuggestions(snapshot: ContextStateSnapshot): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const { members, places, tasks, events, reminders, documents } = snapshot;

  const otherMembers = members.filter((m) => !m.isSelf);
  const selfMember = members.find((m) => m.isSelf) || members[0];

  // Helper to resolve place name
  const getPlaceName = (placeId?: string) => {
    if (!placeId) return null;
    return places.find((p) => p.id === placeId)?.name || null;
  };

  // -------------------------------------------------------------
  // Rule 1: Pending Unpaid Bill Due Soon
  // -------------------------------------------------------------
  const pendingBill = documents.find(
    (d) => d.status === 'pending'
  );

  if (pendingBill) {
    const assignedMember =
      members.find((m) => m.id === pendingBill.assignedToMemberId) ||
      otherMembers[0] ||
      selfMember;

    const currency = pendingBill.currency || '₹';
    const amountStr = pendingBill.amount ? `${currency}${pendingBill.amount.toLocaleString()}` : 'Bill';
    const isAssignedToOther = assignedMember && !assignedMember.isSelf;

    suggestions.push({
      id: `sug_bill_${pendingBill.id}`,
      title: `${pendingBill.title} Due Soon`,
      body: `${pendingBill.title} of ${amountStr} is due ${pendingBill.dueDate || 'soon'}. ${
        isAssignedToOther
          ? `Would you like to remind ${assignedMember.name}?`
          : 'Confirm when payment is completed.'
      }`,
      reasoning: `Avoid late payment fee and keep family utility accounts settled.`,
      category: 'due_date',
      primaryActionLabel: isAssignedToOther ? `Remind ${assignedMember.name}` : 'Mark as Paid',
      primaryActionType: 'remind_member',
      primaryPayload: {
        memberId: assignedMember?.id,
        documentId: pendingBill.id,
        amount: pendingBill.amount,
      },
      secondaryActionLabel: 'Dismiss',
      status: 'active',
      createdAt: 'Just now',
    });
  }

  // -------------------------------------------------------------
  // Rule 2: Low Phone Battery Warning (< 25% and not charging)
  // -------------------------------------------------------------
  const lowBatteryMember = otherMembers.find(
    (m) => m.batteryLevel <= 25 && !m.isCharging && m.isSharingLocation
  );

  if (lowBatteryMember) {
    suggestions.push({
      id: `sug_battery_${lowBatteryMember.id}`,
      title: `Low Battery: ${lowBatteryMember.name}`,
      body: `${lowBatteryMember.name}'s phone is at ${lowBatteryMember.batteryLevel}% battery and not charging.`,
      reasoning: `${lowBatteryMember.name} is currently ${lowBatteryMember.humanLocation}. A low battery may disconnect live location tracking.`,
      category: 'proximity',
      primaryActionLabel: `Ping ${lowBatteryMember.name}`,
      primaryActionType: 'ask_member',
      primaryPayload: {
        memberId: lowBatteryMember.id,
        message: `Hey ${lowBatteryMember.name}, your phone battery is down to ${lowBatteryMember.batteryLevel}%. Please remember to charge it!`,
        taskTitle: 'Charge Phone',
      },
      secondaryActionLabel: 'Dismiss',
      status: 'active',
      createdAt: 'Just now',
    });
  }

  // -------------------------------------------------------------
  // Rule 3: Proximity / Commute errand matching
  // If someone is outside (at work or in transit) and an errand/grocery task is pending
  // -------------------------------------------------------------
  const pendingErrand = tasks.find(
    (t) => !t.isCompleted && (t.category === 'groceries' || t.category === 'bills')
  );

  const outMember = otherMembers.find(
    (m) => m.availability === 'available' || m.currentPlaceId === 'place_office' || m.humanLocation?.toLowerCase().includes('office')
  );

  if (pendingErrand && outMember) {
    suggestions.push({
      id: `sug_errand_${pendingErrand.id}_${outMember.id}`,
      title: 'Family Errand Coordination',
      body: `${outMember.name} is currently ${outMember.humanLocation} and "${pendingErrand.title}" is still pending.`,
      reasoning: `Asking ${outMember.name} aligns with their commute and saves a separate trip later.`,
      category: 'proximity',
      primaryActionLabel: `Ask ${outMember.name}`,
      primaryActionType: 'ask_member',
      primaryPayload: {
        memberId: outMember.id,
        message: `Hi ${outMember.name}, could you help with: "${pendingErrand.title}" before heading back?`,
        taskTitle: pendingErrand.title,
      },
      secondaryActionLabel: 'Not now',
      status: 'active',
      createdAt: 'Just now',
    });
  }

  // -------------------------------------------------------------
  // Rule 4: Health / Medication Reminder
  // -------------------------------------------------------------
  const pendingMedReminder = reminders.find(
    (r) => !r.isDone && r.category === 'medicine'
  );

  if (pendingMedReminder) {
    const target = members.find((m) => m.id === pendingMedReminder.targetMemberId) || selfMember;
    suggestions.push({
      id: `sug_health_${pendingMedReminder.id}`,
      title: 'Health Routine Check',
      body: `Health reminder for ${target.name}: "${pendingMedReminder.title}" scheduled for ${pendingMedReminder.time || 'today'}.`,
      reasoning: 'Gentle nudge to maintain daily wellness routine.',
      category: 'health_refill',
      primaryActionLabel: `Check In with ${target.name}`,
      primaryActionType: 'ask_member',
      primaryPayload: {
        memberId: target.id,
        message: `Hi ${target.name}, just checking in on your health routine: ${pendingMedReminder.title}`,
        taskTitle: pendingMedReminder.title,
      },
      secondaryActionLabel: 'Dismiss',
      status: 'active',
      createdAt: 'Just now',
    });
  }

  // -------------------------------------------------------------
  // Rule 5: Upcoming Event Coordination
  // -------------------------------------------------------------
  if (events.length > 0) {
    const upcomingEvent = events[0];
    suggestions.push({
      id: `sug_event_${upcomingEvent.id}`,
      title: `Upcoming: ${upcomingEvent.title}`,
      body: `${upcomingEvent.title} is scheduled for ${upcomingEvent.date || 'today'} at ${upcomingEvent.time || 'Scheduled'}.`,
      reasoning: `Location: ${upcomingEvent.location || 'Home'}. Ensure family members are aligned on transportation.`,
      category: 'schedule_conflict',
      primaryActionLabel: 'Coordinate Event',
      primaryActionType: 'ask_member',
      primaryPayload: {
        eventId: upcomingEvent.id,
        message: `Reminder: ${upcomingEvent.title} is coming up at ${upcomingEvent.time || 'Scheduled'}.`,
      },
      secondaryActionLabel: 'Dismiss',
      status: 'active',
      createdAt: 'Just now',
    });
  }

  // -------------------------------------------------------------
  // Rule 6: Family Setup Tip (If user is alone in circle)
  // -------------------------------------------------------------
  if (members.length <= 1) {
    suggestions.push({
      id: 'sug_invite_family_setup',
      title: 'Build Your Family Circle',
      body: 'Add your family members to unlock real-time safety pings, battery tracking, and collaborative schedules.',
      reasoning: 'FamilyOS AI works best when the entire household is connected.',
      category: 'proximity',
      primaryActionLabel: 'Add Member',
      primaryActionType: 'ask_member',
      primaryPayload: {
        message: 'Tap the Family tab to invite members',
      },
      secondaryActionLabel: 'Later',
      status: 'active',
      createdAt: 'Just now',
    });
  }

  return suggestions;
}
