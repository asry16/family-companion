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
 * into proactive, high-value suggestions.
 * 
 * "Don't make the family manage the app. Make the app understand the family."
 * "The app does the thinking. The user only makes the decision."
 */
export function generateContextSuggestions(snapshot: ContextStateSnapshot): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const { members, places, tasks, events, reminders, documents } = snapshot;

  const dad = members.find((m) => m.id === 'member_dad');
  const mom = members.find((m) => m.id === 'member_mom');
  const aman = members.find((m) => m.id === 'member_aman');

  // Rule 1: Proximity + Pending Medication Refill / Grocery Task
  const pendingGrocery = tasks.find((t) => !t.isCompleted && t.category === 'groceries');
  const pendingMedRefill = tasks.find((t) => !t.isCompleted && t.category === 'health');
  const momMedReminder = reminders.find((r) => !r.isDone && r.targetMemberId === 'member_mom');

  if (dad && dad.currentPlaceId === 'place_office') {
    if (pendingMedRefill || momMedReminder) {
      suggestions.push({
        id: 'sug_dad_pharmacy_meds',
        title: 'One thing you may want to know',
        body: 'Dad is near Apollo Pharmacy and Mom\'s medicine reminder is due tonight.',
        reasoning: 'Dad is currently at DLF Cyber City within 300m of Apollo Pharmacy. Picking this up now prevents a late-night pharmacy trip.',
        category: 'health_refill',
        primaryActionLabel: 'Ask Dad',
        primaryActionType: 'ask_member',
        primaryPayload: {
          memberId: 'member_dad',
          message: 'Hi Dad, could you please pick up Mom\'s medicine from Apollo Pharmacy near your office before heading home?',
          taskTitle: 'Pick up Mom\'s medicine',
        },
        secondaryActionLabel: 'Not now',
        status: 'active',
        createdAt: 'Just now',
      });
    } else if (pendingGrocery) {
      suggestions.push({
        id: 'sug_dad_groceries',
        title: 'Family Suggestion',
        body: 'Dad is near Modern Bazaar grocery store and the grocery task is still pending.',
        reasoning: 'Modern Bazaar is on Dad\'s return route from Cyber City. Asking him now aligns with his commute.',
        category: 'proximity',
        primaryActionLabel: 'Ask Dad',
        primaryActionType: 'ask_member',
        primaryPayload: {
          memberId: 'member_dad',
          message: 'Hi Dad, since you are near Modern Bazaar, could you pick up vegetables on your way back?',
          taskTitle: 'Buy vegetables',
        },
        secondaryActionLabel: 'Not now',
        status: 'active',
        createdAt: 'Just now',
      });
    }
  }

  // Rule 2: Unpaid Bill Due Tomorrow
  const pendingBill = documents.find(
    (d) => d.type === 'electricity_bill' && d.status === 'pending'
  );
  if (pendingBill) {
    suggestions.push({
      id: 'sug_bill_electricity',
      title: 'Electricity Bill Due Tomorrow',
      body: `Tata Power bill of ₹${pendingBill.amount?.toLocaleString()} is due tomorrow. Would you like to remind Dad?`,
      reasoning: 'Avoid late fee surcharge (₹150). Dad usually clears utility accounts via UPI.',
      category: 'due_date',
      primaryActionLabel: 'Remind Dad',
      primaryActionType: 'remind_member',
      primaryPayload: {
        memberId: 'member_dad',
        documentId: pendingBill.id,
        amount: pendingBill.amount,
      },
      secondaryActionLabel: 'Dismiss',
      status: 'active',
      createdAt: '1h ago',
    });
  }

  // Rule 3: Schedule coordination (Mom Doctor + Aman College pickup)
  const doctorEvent = events.find((e) => e.category === 'doctor');
  if (doctorEvent && aman && mom) {
    suggestions.push({
      id: 'sug_pickup_coordination',
      title: 'Travel Coordination',
      body: 'Mom has a doctor appointment at 4:00 PM and Aman finishes classes at 4:15 PM.',
      reasoning: 'Both locations are within 15 mins travel. Aman can accompany Mom home.',
      category: 'schedule_conflict',
      primaryActionLabel: 'Ask Aman',
      primaryActionType: 'ask_member',
      primaryPayload: {
        memberId: 'member_aman',
        message: 'Aman, could you meet Mom at Max Healthcare after your 4:15 class and head home together?',
      },
      secondaryActionLabel: 'Not now',
      status: 'active',
      createdAt: '2h ago',
    });
  }

  return suggestions;
}
