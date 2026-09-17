import {
  FamilyMember,
  Task,
  CalendarEvent,
  Reminder,
  MemoryItem,
  FamilyDocument,
} from '@/types';

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
    members?: FamilyMember[];
    tasks?: Task[];
    events?: CalendarEvent[];
    documents?: FamilyDocument[];
    memories?: MemoryItem[];
  };
}

export interface AIQueryContext {
  members: FamilyMember[];
  tasks: Task[];
  events: CalendarEvent[];
  reminders: Reminder[];
  memories: MemoryItem[];
  documents: FamilyDocument[];
  activeUser: FamilyMember;
}

/**
 * FamilyOS AI Query Processor:
 * Context-aware semantic query resolver tailored for family life.
 */
export function processFamilyAIQuery(query: string, ctx: AIQueryContext): AIResponse {
  const normalized = query.trim().toLowerCase();

  // 1. "Where is Dad?" / Location query
  if (normalized.includes('where is dad') || normalized.includes('dad location') || (normalized.includes('dad') && normalized.includes('where'))) {
    const dad = ctx.members.find((m) => m.id === 'member_dad');
    if (dad) {
      return {
        answer: `Dad is currently **${dad.humanLocation}** at DLF Cyber City. His battery is at **${dad.batteryLevel}%** and his location is shared until **8:00 PM tonight**.`,
        highlight: 'Dad • At Office (Cyber City)',
        actionCard: {
          id: 'act_dad_ping',
          type: 'call',
          title: 'Dad • Rajesh Sharma',
          subtitle: 'Available for quick message • Last active 12m ago',
          confirmLabel: 'Call Dad',
          cancelLabel: 'Dismiss',
          payload: { phone: dad.phone },
        },
        relatedEntities: { members: [dad] },
      };
    }
  }

  // 2. "Where is Mom?" / "Where is Aman?"
  if (normalized.includes('where is mom') || (normalized.includes('mom') && normalized.includes('where'))) {
    const mom = ctx.members.find((m) => m.id === 'member_mom');
    return {
      answer: `Mom is **At Home** (Gulmohar Enclave). She has a doctor consultation scheduled for **4:00 PM** at Max Healthcare.`,
      highlight: 'Mom • At Home',
      actionCard: {
        id: 'act_mom_event',
        type: 'navigate',
        title: 'Doctor Consultation at 4:00 PM',
        subtitle: 'Max Healthcare • 45 mins',
        confirmLabel: 'View Appointment',
        cancelLabel: 'Close',
        payload: { eventId: 'event_doctor' },
      },
    };
  }

  // 3. "Where is Dad's passport?" / "Where is my passport?" / Memory queries
  if (normalized.includes('passport')) {
    const passportMem = ctx.memories.find((m) => m.title.toLowerCase().includes('passport'));
    return {
      answer: `📘 **Dad's Passport & OCI Documents** are saved in the **${passportMem?.savedLocation || 'Blue cupboard, top shelf'}**.\n\n*Verified ${passportMem?.lastVerified || '2 months ago'}*. Contains both Rajesh and Sunita's passports valid till 2031.`,
      highlight: 'Saved Location: Blue cupboard, top shelf',
      actionCard: {
        id: 'act_view_memory_passport',
        type: 'view_doc',
        title: 'Physical Location Verified',
        subtitle: passportMem?.savedLocation,
        confirmLabel: 'Mark as Verified Today',
        cancelLabel: 'Done',
      },
      relatedEntities: { memories: passportMem ? [passportMem] : [] },
    };
  }

  // 4. "Wi-Fi password" / "Wifi"
  if (normalized.includes('wifi') || normalized.includes('wi-fi') || normalized.includes('password')) {
    const wifiMem = ctx.memories.find((m) => m.title.toLowerCase().includes('wi-fi'));
    return {
      answer: `📶 The home Wi-Fi details are:\n\n• **Network:** Gulmohar_5G\n• **Password:** \`SharmaFamily2026!\`\n• **Speed:** AirFiber 300 Mbps\n\n${wifiMem?.savedLocation ? `*Saved on: ${wifiMem.savedLocation}*` : ''}`,
      highlight: 'Password: SharmaFamily2026!',
      actionCard: {
        id: 'act_copy_wifi',
        type: 'check_in',
        title: 'Home Wi-Fi Network',
        subtitle: 'SharmaFamily2026! (AirFiber 300 Mbps)',
        confirmLabel: 'Copy Password',
        cancelLabel: 'Close',
      },
    };
  }

  // 5. "Did we pay the electricity bill?" / "Electricity bill"
  if (normalized.includes('electricity') || (normalized.includes('bill') && !normalized.includes('school'))) {
    const billDoc = ctx.documents.find((d) => d.type === 'electricity_bill');
    const isPaid = billDoc?.status === 'paid';
    if (!isPaid) {
      return {
        answer: `💡 The **Tata Power electricity bill of ₹2,340** is **pending** and due **tomorrow (25 September)**. It is currently assigned to Dad.`,
        highlight: 'Status: Pending • Due Tomorrow • ₹2,340',
        actionCard: {
          id: 'act_bill_remind_dad',
          type: 'remind',
          title: 'Remind Dad to Pay Bill?',
          subtitle: 'Tata Power DDL • ₹2,340 due tomorrow',
          confirmLabel: 'Remind Dad',
          cancelLabel: 'I Will Pay',
          payload: { memberId: 'member_dad', amount: 2340 },
        },
        relatedEntities: { documents: billDoc ? [billDoc] : [] },
      };
    } else {
      return {
        answer: `✅ Yes, the electricity bill of ₹2,340 has already been marked as paid.`,
        highlight: 'Paid & Verified',
      };
    }
  }

  // 6. "When is Mom's appointment?" / "Doctor appointment"
  if (normalized.includes('appointment') || normalized.includes('doctor') || (normalized.includes('mom') && normalized.includes('when'))) {
    const docEvent = ctx.events.find((e) => e.category === 'doctor');
    return {
      answer: `🩺 Mom's appointment with **Dr. R.K. Mehta** is scheduled for **today at 4:00 PM** at Max Healthcare, Saket.\n\n*Note: Carry blood test report and health insurance card.*`,
      highlight: 'Today at 4:00 PM • Max Healthcare',
      actionCard: {
        id: 'act_confirm_appointment',
        type: 'navigate',
        title: 'Max Healthcare Consultation',
        subtitle: 'Dr. R.K. Mehta • Today 4:00 PM',
        confirmLabel: 'Get Directions',
        cancelLabel: 'Dismiss',
      },
      relatedEntities: { events: docEvent ? [docEvent] : [] },
    };
  }

  // 7. "Who can pick Aman up?" / "Pick up Aman"
  if (normalized.includes('pick aman up') || normalized.includes('pick up aman') || normalized.includes('who can pick')) {
    return {
      answer: `🚗 Aman finishes classes at **4:15 PM** at North Campus. \n\n• **Mom** is at Saket for her doctor visit at 4 PM.\n• **Dad** finishes meetings at 3:30 PM in Cyber City.\n• **Ritu** is at Home.\n\n**Recommendation:** Dad can pick Aman up on his way, or Aman can take the Metro to meet Mom at Max Healthcare.`,
      highlight: 'Dad finishes at 3:30 PM • Best Match',
      actionCard: {
        id: 'act_ask_dad_pickup',
        type: 'remind',
        title: 'Ask Dad to Pick Up Aman?',
        subtitle: 'College Gate 3 • Around 4:20 PM',
        confirmLabel: 'Ask Dad',
        cancelLabel: 'Ask Aman to Metro',
      },
    };
  }

  // 8. "What do I need to do today?" / "What do I have today?" / "Today"
  if (normalized.includes('what do i need') || normalized.includes('today') || normalized.includes('tasks today') || normalized.includes('plans')) {
    const pendingTasks = ctx.tasks.filter((t) => !t.isCompleted);
    return {
      answer: `Here is what is on the family radar today:\n\n🩺 **4:00 PM** — Mom's Doctor Consultation\n🚗 **4:30 PM** — Pick up Aman from College\n🛒 **Groceries** — Assigned to Dad (Tomatoes, veggies, flour)\n💡 **Electricity Bill** — ₹2,340 due tomorrow\n🍲 **7:30 PM** — Family Dinner at Home`,
      highlight: '3 Events • 3 Tasks Pending',
      actionCard: {
        id: 'act_view_plans',
        type: 'navigate',
        title: 'Today\'s Family Schedule',
        subtitle: 'Unified Planner • 5 Items',
        confirmLabel: 'Open Family Planner',
        cancelLabel: 'Done',
      },
    };
  }

  // 9. "Remind Dad to buy vegetables tomorrow morning" / Natural language task creation
  if (normalized.includes('remind') || normalized.includes('add task') || normalized.includes('buy')) {
    return {
      answer: `I prepared this reminder for you based on what you said. Would you like me to add it to the Family Planner?`,
      highlight: 'New Task Ready to Confirm',
      actionCard: {
        id: 'act_create_nl_task',
        type: 'create_task',
        title: 'Buy fresh vegetables',
        subtitle: 'Assigned to Dad • Tomorrow at 10:00 AM',
        confirmLabel: 'Confirm & Add to Planner',
        cancelLabel: 'Cancel',
        payload: {
          title: 'Buy fresh vegetables',
          assignee: 'member_dad',
          dueDate: 'Tomorrow',
          dueTime: '10:00 AM',
          category: 'groceries',
          priority: 'urgent',
        },
      },
    };
  }

  // Generic fallback with helpful family context
  return {
    answer: `I checked the family system. All 5 members are accounted for:\n\n• Dad is at Office (Cyber City)\n• Mom & Dadi are at Home\n• Aman is at College\n• Today's key priority is Mom's 4:00 PM doctor consultation and paying the ₹2,340 electricity bill.`,
    highlight: 'Family is all good',
    actionCard: {
      id: 'act_generic_home',
      type: 'navigate',
      title: 'Family Status All Clear',
      subtitle: 'No urgent safety alerts',
      confirmLabel: 'View Family Circle',
      cancelLabel: 'Close',
    },
  };
}
