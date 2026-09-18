import {
  FamilyMember,
  Task,
  CalendarEvent,
  Reminder,
  MemoryItem,
  FamilyDocument,
  FamilyProfile,
  FamilyPlace,
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
  profile?: FamilyProfile;
  places?: FamilyPlace[];
}

/**
 * FamilyOS AI Query Processor:
 * 100% User-defined, dynamic, context-aware semantic query engine.
 * Inspects the user's active family members, live device telemetry,
 * calendar events, tasks, saved memories, and documents.
 */
export function processFamilyAIQuery(query: string, ctx: AIQueryContext): AIResponse {
  const normalized = query.trim().toLowerCase();
  const familyName = ctx.profile?.name || 'Your Family';
  const members = ctx.members || [];
  const tasks = ctx.tasks || [];
  const events = ctx.events || [];
  const memories = ctx.memories || [];
  const documents = ctx.documents || [];
  const places = ctx.places || [];

  // Helper to find place by ID
  const getPlaceName = (placeId?: string) => {
    if (!placeId) return null;
    return places.find((p) => p.id === placeId)?.name || null;
  };

  // -------------------------------------------------------------
  // 1. SPECIFIC FAMILY MEMBER QUERY (Name or Relation)
  // -------------------------------------------------------------
  const matchedMember = members.find((m) => {
    const nameMatch = m.name && normalized.includes(m.name.toLowerCase());
    const relMatch = m.relation && normalized.includes(m.relation.toLowerCase());
    const firstName = m.name?.split(' ')[0]?.toLowerCase();
    const firstNameMatch = firstName && firstName.length > 2 && normalized.includes(firstName);

    // Common synonyms for relations
    const isDadSynonym =
      (m.relation === 'Father' || m.relation?.toLowerCase() === 'dad') &&
      (normalized.includes('dad') || normalized.includes('father') || normalized.includes('papa'));
    const isMomSynonym =
      (m.relation === 'Mother' || m.relation?.toLowerCase() === 'mom') &&
      (normalized.includes('mom') || normalized.includes('mother') || normalized.includes('maa') || normalized.includes('mum'));
    const isBrotherSynonym =
      m.relation?.toLowerCase() === 'brother' && normalized.includes('brother');
    const isSisterSynonym =
      m.relation?.toLowerCase() === 'sister' && normalized.includes('sister');
    const isGrandmotherSynonym =
      (m.relation?.toLowerCase().includes('grand') || m.relation?.toLowerCase().includes('dadi') || m.relation?.toLowerCase().includes('nani')) &&
      (normalized.includes('dadi') || normalized.includes('nani') || normalized.includes('grandma') || normalized.includes('grandmother'));

    return nameMatch || relMatch || firstNameMatch || isDadSynonym || isMomSynonym || isBrotherSynonym || isSisterSynonym || isGrandmotherSynonym;
  });

  if (matchedMember) {
    // Check if user is asking to create a reminder or task for this member
    const isTaskCreation =
      normalized.includes('remind') ||
      normalized.includes('add task') ||
      normalized.includes('create task');

    if (isTaskCreation) {
      const firstName = matchedMember.name?.split(' ')[0] || '';
      let taskTitle = query
        .replace(/^(can you|please|could you)\s+/i, '')
        .replace(/^(remind|add task to|add task for|create task to)\s+/i, '')
        .replace(new RegExp(`^${matchedMember.name}\\s+to\\s+`, 'i'), '')
        .replace(new RegExp(`^${firstName}\\s+to\\s+`, 'i'), '')
        .trim();

      if (!taskTitle || taskTitle.length < 3) {
        taskTitle = 'Family Task';
      } else {
        taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
      }

      return {
        answer: `I prepared a task for your family planner based on what you said. Would you like to confirm and assign it to **${matchedMember.name}**?`,
        highlight: `New Task for ${matchedMember.name}`,
        actionCard: {
          id: `act_create_task_${Date.now()}`,
          type: 'create_task',
          title: taskTitle,
          subtitle: `Assigned to ${matchedMember.name} • Due Today`,
          confirmLabel: 'Confirm & Add to Planner',
          cancelLabel: 'Cancel',
          payload: {
            title: taskTitle,
            assignee: matchedMember.id,
            dueDate: 'Today',
            dueTime: '6:00 PM',
            category: normalized.includes('buy') ? 'groceries' : 'general',
            priority: 'important',
          },
        },
      };
    }

    const isAskingBatteryOrPhone =
      normalized.includes('battery') ||
      normalized.includes('charging') ||
      normalized.includes('silent') ||
      normalized.includes('sound') ||
      normalized.includes('ringer') ||
      normalized.includes('phone');

    const isAskingLocation =
      normalized.includes('where') ||
      normalized.includes('location') ||
      /\bat\b/i.test(normalized) ||
      normalized.includes('reach') ||
      normalized.includes('is home') ||
      normalized.includes('place');

    const isAskingScheduleOrTasks =
      normalized.includes('task') ||
      normalized.includes('schedule') ||
      normalized.includes('plan') ||
      normalized.includes('doing') ||
      normalized.includes('busy');

    // 1A. Member Battery / Phone Device telemetry
    if (isAskingBatteryOrPhone && !normalized.includes('where')) {
      const chargeText = matchedMember.isCharging ? ' (⚡ Charging)' : '';
      const ringerText =
        matchedMember.ringerMode === 'silent'
          ? '🔕 Silent Mode'
          : matchedMember.ringerMode === 'vibrate'
          ? '📳 Vibrate Mode'
          : '🔔 Sound On';

      return {
        answer: `📱 **${matchedMember.name}'s Device Telemetry:**\n\n• **Battery:** ${matchedMember.batteryLevel}%${chargeText}\n• **Ringer Mode:** ${ringerText}\n• **Current Location:** ${matchedMember.humanLocation || 'Location shared'}\n• **Last Sync:** ${matchedMember.lastUpdated || 'Just now'}`,
        highlight: `${matchedMember.name} • ${matchedMember.batteryLevel}% • ${(matchedMember.ringerMode || 'sound').toUpperCase()}`,
        actionCard: {
          id: `act_ping_${matchedMember.id}`,
          type: 'call',
          title: `Contact ${matchedMember.name}`,
          subtitle: `Phone: ${matchedMember.phone || 'Available'} • ${ringerText}`,
          confirmLabel: `Call ${matchedMember.name}`,
          cancelLabel: 'Dismiss',
          payload: { phone: matchedMember.phone, memberId: matchedMember.id },
        },
        relatedEntities: { members: [matchedMember] },
      };
    }

    // 1B. Member Schedule & Tasks
    if (isAskingScheduleOrTasks && !isAskingLocation) {
      const memberTasks = tasks.filter(
        (t) => t.assignedToMemberId === matchedMember.id && !t.isCompleted
      );
      if (memberTasks.length > 0) {
        const taskLines = memberTasks
          .map((t) => `• **${t.title}** (${t.priority} priority, due ${t.dueDate || 'soon'})`)
          .join('\n');
        return {
          answer: `📋 Here are the active tasks assigned to **${matchedMember.name}**:\n\n${taskLines}`,
          highlight: `${memberTasks.length} Task(s) for ${matchedMember.name}`,
          actionCard: {
            id: `act_tasks_${matchedMember.id}`,
            type: 'navigate',
            title: `${matchedMember.name}'s Planner`,
            subtitle: `${memberTasks.length} pending items`,
            confirmLabel: 'Open Planner',
            cancelLabel: 'Close',
          },
          relatedEntities: { members: [matchedMember], tasks: memberTasks },
        };
      } else {
        return {
          answer: `✅ **${matchedMember.name}** has no pending tasks assigned in the family planner right now.`,
          highlight: `${matchedMember.name} • No Pending Tasks`,
        };
      }
    }

    // 1C. Member Location / Whereabouts (Default for member match)
    const placeName = getPlaceName(matchedMember.currentPlaceId);
    const placeDetail = placeName ? ` at **${placeName}**` : '';
    const ringerAlert =
      matchedMember.ringerMode === 'silent'
        ? ' *(Phone is currently on Silent)*'
        : '';
    const chargeBadge = matchedMember.isCharging ? ' (⚡ Charging)' : '';

    return {
      answer: `📍 **${matchedMember.name}** (${matchedMember.relation}) is currently **${matchedMember.humanLocation}**${placeDetail}.\n\n• **Battery:** ${matchedMember.batteryLevel}%${chargeBadge}\n• **Ringer:** ${(matchedMember.ringerMode || 'sound').toUpperCase()}${ringerAlert}\n• **Status:** ${matchedMember.statusMessage || 'Sharing live presence'}\n• **Last Sync:** ${matchedMember.lastUpdated || 'Just now'}`,
      highlight: `${matchedMember.name} • ${matchedMember.humanLocation}`,
      actionCard: {
        id: `act_call_${matchedMember.id}`,
        type: 'call',
        title: `${matchedMember.name} (${matchedMember.relation})`,
        subtitle: `${matchedMember.humanLocation} • Battery: ${matchedMember.batteryLevel}%`,
        confirmLabel: `Call ${matchedMember.name}`,
        cancelLabel: 'Dismiss',
        payload: { phone: matchedMember.phone, memberId: matchedMember.id },
      },
      relatedEntities: { members: [matchedMember] },
    };
  }

  // -------------------------------------------------------------
  // 2. FAMILY-WIDE LOCATIONS / "Where is everyone?" / "Who is home?"
  // -------------------------------------------------------------
  if (
    normalized.includes('where is everyone') ||
    normalized.includes('where are they') ||
    normalized.includes('who is home') ||
    normalized.includes('who is at home') ||
    normalized.includes('family location') ||
    normalized.includes('everyone location') ||
    (normalized.includes('where') && normalized.includes('family'))
  ) {
    if (members.length === 0) {
      return {
        answer: `You haven't added any family members to **${familyName}** yet.\n\nTap the **Family** tab to invite or register your loved ones so FamilyOS can track live presence, safety statuses, and battery telemetry.`,
        highlight: 'No Members Added',
        actionCard: {
          id: 'act_invite_members',
          type: 'navigate',
          title: 'Add Family Members',
          subtitle: 'Expand your private family circle',
          confirmLabel: 'Open Family Tab',
        },
      };
    }

    const memberListStr = members
      .map(
        (m) =>
          `• **${m.name}** (${m.relation}): **${m.humanLocation}** • Battery: ${m.batteryLevel}%${m.isCharging ? ' ⚡' : ''} • Ringer: ${m.ringerMode}`
      )
      .join('\n');

    return {
      answer: `📍 **Live Family Presence & Locations for ${familyName}:**\n\n${memberListStr}`,
      highlight: `${members.length} Member(s) Live on Map`,
      actionCard: {
        id: 'act_view_live_map',
        type: 'navigate',
        title: 'Open Live Family Map',
        subtitle: `Real-time pins and telemetry for ${members.length} members`,
        confirmLabel: 'View Family Map',
        cancelLabel: 'Close',
      },
      relatedEntities: { members },
    };
  }

  // -------------------------------------------------------------
  // 3. PHYSICAL MEMORY SEARCH / "Where is [item]?" / Passports, Keys, etc.
  // -------------------------------------------------------------
  const isMemoryQuery =
    normalized.includes('where is') ||
    normalized.includes('where did i put') ||
    normalized.includes('where are my') ||
    normalized.includes('find my') ||
    normalized.includes('passport') ||
    normalized.includes('keys') ||
    normalized.includes('car key') ||
    normalized.includes('charger') ||
    normalized.includes('glasses') ||
    normalized.includes('lock') ||
    normalized.includes('locker') ||
    normalized.includes('safe') ||
    normalized.includes('kept');

  if (isMemoryQuery) {
    // Search memories matching query keywords
    const matchingMem = memories.find((m) => {
      const titleWords = m.title.toLowerCase().split(/\s+/);
      const queryWords = normalized.split(/\s+/);
      const titleMatches = titleWords.some((w) => w.length > 2 && normalized.includes(w));
      const queryMatches = queryWords.some((w) => w.length > 3 && m.title.toLowerCase().includes(w));
      const tagMatches = m.tags?.some((t) => normalized.includes(t.toLowerCase()));
      const locMatches = m.savedLocation?.toLowerCase().split(/\s+/).some((w) => w.length > 3 && normalized.includes(w));
      return titleMatches || queryMatches || tagMatches || locMatches;
    });

    if (matchingMem) {
      return {
        answer: `📘 **${matchingMem.title}** is stored in: **${matchingMem.savedLocation}**.\n\n${matchingMem.notes ? `*Notes:* ${matchingMem.notes}\n` : ''}${matchingMem.lastVerified ? `*Last verified:* ${matchingMem.lastVerified}` : ''}`,
        highlight: `Saved Location: ${matchingMem.savedLocation}`,
        actionCard: {
          id: `act_mem_${matchingMem.id}`,
          type: 'view_doc',
          title: matchingMem.title,
          subtitle: matchingMem.savedLocation,
          confirmLabel: 'View in Family Memories',
          cancelLabel: 'Done',
          payload: { memoryId: matchingMem.id },
        },
        relatedEntities: { memories: [matchingMem] },
      };
    } else if (memories.length > 0) {
      // Return list of available saved memories
      const sampleMems = memories.slice(0, 4).map((m) => `• **${m.title}**: ${m.savedLocation}`).join('\n');
      return {
        answer: `I searched your family memories vault, but couldn't find an exact match for your item.\n\nHere are some items currently logged in your vault:\n${sampleMems}\n\nWould you like to log this new item in **Family Memories**?`,
        highlight: `${memories.length} Items Logged in Vault`,
        actionCard: {
          id: 'act_add_mem',
          type: 'navigate',
          title: 'Add to Family Memories',
          subtitle: 'Never lose household items or documents again',
          confirmLabel: 'Open Memories',
        },
      };
    } else {
      return {
        answer: `No physical items or documents have been logged in your **Family Memories** vault yet.\n\nYou can log passports, spare keys, certificates, or appliance manuals with their precise cupboard and shelf locations so anyone in your family can find them instantly.`,
        highlight: 'Memories Vault Empty',
        actionCard: {
          id: 'act_open_memories',
          type: 'navigate',
          title: 'Create First Memory Entry',
          subtitle: 'Log safe locations of valuable household items',
          confirmLabel: 'Open Memories',
        },
      };
    }
  }

  // -------------------------------------------------------------
  // 4. WI-FI CREDENTIALS / "Wi-Fi password" / Internet
  // -------------------------------------------------------------
  if (
    normalized.includes('wifi') ||
    normalized.includes('wi-fi') ||
    normalized.includes('internet password') ||
    normalized.includes('network password') ||
    normalized.includes('router')
  ) {
    const wifiMem = memories.find(
      (m) =>
        m.title.toLowerCase().includes('wifi') ||
        m.title.toLowerCase().includes('wi-fi') ||
        m.title.toLowerCase().includes('internet') ||
        m.tags?.some((t) => t.toLowerCase().includes('wifi'))
    );

    if (wifiMem) {
      return {
        answer: `📶 **Family Wi-Fi Credentials:**\n\n• **Network / Label:** ${wifiMem.title}\n• **Details:** ${wifiMem.savedLocation}\n${wifiMem.notes ? `• **Notes:** ${wifiMem.notes}\n` : ''}`,
        highlight: `Wi-Fi: ${wifiMem.savedLocation}`,
        actionCard: {
          id: `act_wifi_${wifiMem.id}`,
          type: 'check_in',
          title: wifiMem.title,
          subtitle: wifiMem.savedLocation,
          confirmLabel: 'View Wi-Fi Memory',
          cancelLabel: 'Close',
        },
        relatedEntities: { memories: [wifiMem] },
      };
    } else {
      return {
        answer: `📶 Your family Wi-Fi details have not been saved to **${familyName}'s** vault yet.\n\nYou can add your home Wi-Fi SSID and password to **Family Memories** so your family members and guests can look it up with a single tap.`,
        highlight: 'Wi-Fi Not Recorded',
        actionCard: {
          id: 'act_add_wifi_memory',
          type: 'navigate',
          title: 'Store Home Wi-Fi',
          subtitle: 'Save network name and password in vault',
          confirmLabel: 'Add Wi-Fi to Memories',
        },
      };
    }
  }

  // -------------------------------------------------------------
  // 5. BILLS & FINANCIAL DOCUMENTS / Electricity, Water, Rent, Dues
  // -------------------------------------------------------------
  if (
    normalized.includes('bill') ||
    normalized.includes('electricity') ||
    normalized.includes('water') ||
    normalized.includes('utility') ||
    normalized.includes('rent') ||
    normalized.includes('due') ||
    normalized.includes('payment') ||
    normalized.includes('paid')
  ) {
    const pendingBills = documents.filter(
      (d) => d.status === 'pending'
    );

    if (pendingBills.length > 0) {
      const billLines = pendingBills
        .map((b) => {
          const assignee = members.find((m) => m.id === b.assignedToMemberId);
          const assigneeStr = assignee ? ` (Assigned to ${assignee.name})` : '';
          return `• **${b.title}**: ${b.currency || '₹'}${b.amount?.toLocaleString() || 'Pending'} — Due **${b.dueDate || 'Soon'}**${assigneeStr}`;
        })
        .join('\n');

      const firstBill = pendingBills[0];
      const assignee = members.find((m) => m.id === firstBill.assignedToMemberId) || members[0];

      return {
        answer: `💡 **Pending Family Bills:**\n\n${billLines}`,
        highlight: `${pendingBills.length} Bill(s) Pending Payment`,
        actionCard: {
          id: `act_bill_${firstBill.id}`,
          type: 'remind',
          title: `Remind ${assignee?.name || 'Family'} to Pay ${firstBill.title}`,
          subtitle: `${firstBill.currency || '₹'}${firstBill.amount?.toLocaleString() || ''} due ${firstBill.dueDate || 'soon'}`,
          confirmLabel: `Remind ${assignee?.name || 'Family'}`,
          cancelLabel: 'View Documents',
          payload: {
            memberId: assignee?.id,
            documentId: firstBill.id,
            amount: firstBill.amount,
          },
        },
        relatedEntities: { documents: pendingBills },
      };
    } else if (documents.length > 0) {
      return {
        answer: `✅ All ${documents.length} recorded bills and documents for **${familyName}** are marked as **paid and up to date**! There are no pending utility dues.`,
        highlight: 'All Family Bills Settled',
        actionCard: {
          id: 'act_view_docs',
          type: 'navigate',
          title: 'Family Documents Vault',
          subtitle: 'All bills settled and receipts archived',
          confirmLabel: 'Open Documents',
        },
      };
    } else {
      return {
        answer: `No utility bills or financial records have been tracked in your family vault yet.\n\nYou can log electricity, water, Wi-Fi, or insurance documents in the **Docs** tab to track due dates, receipts, and split payments.`,
        highlight: 'No Bills in Vault',
        actionCard: {
          id: 'act_add_doc',
          type: 'navigate',
          title: 'Track Family Bills',
          subtitle: 'Add upcoming bills and utility accounts',
          confirmLabel: 'Open Documents',
        },
      };
    }
  }

  // -------------------------------------------------------------
  // 6. CALENDAR & SCHEDULE / Appointments, Doctor Visits, Events
  // -------------------------------------------------------------
  if (
    normalized.includes('appointment') ||
    normalized.includes('doctor') ||
    normalized.includes('meeting') ||
    normalized.includes('calendar') ||
    normalized.includes('event') ||
    normalized.includes('when is')
  ) {
    if (events.length > 0) {
      const eventLines = events
        .slice(0, 5)
        .map(
          (e) =>
            `• 📅 **${e.title}** — ${e.date || 'Today'} at **${e.time || 'Scheduled'}** (${e.location || 'Home'})`
        )
        .join('\n');

      return {
        answer: `📅 **Upcoming Family Events & Appointments:**\n\n${eventLines}`,
        highlight: `${events.length} Event(s) on Calendar`,
        actionCard: {
          id: 'act_open_calendar',
          type: 'navigate',
          title: 'View Family Calendar',
          subtitle: `Timeline of all ${events.length} scheduled events`,
          confirmLabel: 'Open Planner',
          cancelLabel: 'Close',
        },
        relatedEntities: { events },
      };
    } else {
      return {
        answer: `There are no scheduled events or doctor appointments on your family calendar right now.\n\nYou can add family gatherings, health checkups, or school events in the **Planner** tab.`,
        highlight: 'Calendar Clear',
        actionCard: {
          id: 'act_add_event',
          type: 'navigate',
          title: 'Schedule Family Event',
          subtitle: 'Add appointments, school dates, or trips',
          confirmLabel: 'Open Planner',
        },
      };
    }
  }

  // -------------------------------------------------------------
  // 7. TODAY'S AGENDA / "What do I need to do today?" / Plans
  // -------------------------------------------------------------
  if (
    normalized.includes('today') ||
    normalized.includes('what do i need') ||
    normalized.includes('tasks today') ||
    normalized.includes('my tasks') ||
    normalized.includes('agenda') ||
    normalized.includes('plans')
  ) {
    const pendingTasks = tasks.filter((t) => !t.isCompleted);
    const todayEvents = events.slice(0, 3);

    if (pendingTasks.length > 0 || todayEvents.length > 0) {
      let scheduleText = `Here is what is on the family radar today:\n\n`;

      if (todayEvents.length > 0) {
        scheduleText += `**Events & Schedule:**\n`;
        scheduleText += todayEvents
          .map((e) => `• 🕒 **${e.time || 'Today'}** — ${e.title} (${e.location || 'Home'})`)
          .join('\n');
        scheduleText += '\n\n';
      }

      if (pendingTasks.length > 0) {
        scheduleText += `**Pending Tasks:**\n`;
        scheduleText += pendingTasks
          .slice(0, 5)
          .map((t) => {
            const assignee = members.find((m) => m.id === t.assignedToMemberId);
            return `• 📋 **${t.title}** — Assigned to ${assignee?.name || 'You'} (${t.priority})`;
          })
          .join('\n');
      }

      return {
        answer: scheduleText,
        highlight: `${pendingTasks.length} Pending Task(s) • ${todayEvents.length} Event(s)`,
        actionCard: {
          id: 'act_view_family_planner',
          type: 'navigate',
          title: 'Today\'s Family Schedule',
          subtitle: 'Open Unified Family Planner',
          confirmLabel: 'Open Family Planner',
          cancelLabel: 'Done',
        },
        relatedEntities: { tasks: pendingTasks, events: todayEvents },
      };
    } else {
      return {
        answer: `✨ **All Clear!** You and your family have no pending tasks or scheduled events for today. Enjoy your day!`,
        highlight: 'Zero Pending Items',
        actionCard: {
          id: 'act_add_task_today',
          type: 'navigate',
          title: 'Add New Task or Plan',
          subtitle: 'Keep everyone organized and aligned',
          confirmLabel: 'Open Planner',
        },
      };
    }
  }

  // -------------------------------------------------------------
  // 8. NATURAL LANGUAGE TASK CREATION / "Remind [Name] to [task]"
  // -------------------------------------------------------------
  if (
    normalized.includes('remind') ||
    normalized.includes('add task') ||
    normalized.includes('create task') ||
    normalized.includes('buy ') ||
    normalized.includes('pick up ')
  ) {
    // Attempt to extract assignee
    const otherMembers = members.filter((m) => !m.isSelf);
    let targetAssignee = members.find((m) => {
      const name = m.name?.toLowerCase();
      const relation = m.relation?.toLowerCase();
      return (name && normalized.includes(name)) || (relation && normalized.includes(relation));
    });

    if (!targetAssignee) {
      targetAssignee = otherMembers[0] || ctx.activeUser;
    }

    // Clean up task title
    const targetFirstName = targetAssignee.name?.split(' ')[0] || '';
    let taskTitle = query
      .replace(/^(can you|please|could you)\s+/i, '')
      .replace(/^(remind|add task to|add task for|create task to)\s+/i, '')
      .replace(new RegExp(`^${targetAssignee.name}\\s+to\\s+`, 'i'), '')
      .replace(new RegExp(`^${targetFirstName}\\s+to\\s+`, 'i'), '')
      .replace(new RegExp(`^${targetAssignee.relation}\\s+to\\s+`, 'i'), '')
      .trim();

    if (!taskTitle || taskTitle.length < 3) {
      taskTitle = 'Family Task';
    } else {
      taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
    }

    return {
      answer: `I prepared a task for your family planner based on what you said. Would you like to confirm and assign it to **${targetAssignee.name}**?`,
      highlight: `New Task for ${targetAssignee.name}`,
      actionCard: {
        id: `act_create_task_${Date.now()}`,
        type: 'create_task',
        title: taskTitle,
        subtitle: `Assigned to ${targetAssignee.name} • Due Today`,
        confirmLabel: 'Confirm & Add to Planner',
        cancelLabel: 'Cancel',
        payload: {
          title: taskTitle,
          assignee: targetAssignee.id,
          dueDate: 'Today',
          dueTime: '6:00 PM',
          category: normalized.includes('buy') ? 'groceries' : 'general',
          priority: 'important',
        },
      },
    };
  }

  // -------------------------------------------------------------
  // 9. LOGISTICS / "Who can pick up?" / Availability coordination
  // -------------------------------------------------------------
  if (normalized.includes('pick up') || normalized.includes('who can pick') || normalized.includes('who is free')) {
    const availableMembers = members.filter(
      (m) => m.availability === 'available'
    );

    if (availableMembers.length > 0) {
      const availList = availableMembers
        .map((m) => `• **${m.name}** (${m.relation}) — Currently **${m.humanLocation}**`)
        .join('\n');

      const bestHelper = availableMembers.find((m) => !m.isSelf) || availableMembers[0];

      return {
        answer: `🚗 **Current Family Availability for Pickup Coordination:**\n\n${availList}\n\n**Recommendation:** ${bestHelper.name} is available and currently ${bestHelper.humanLocation}.`,
        highlight: `${availableMembers.length} Member(s) Available`,
        actionCard: {
          id: `act_pickup_${bestHelper.id}`,
          type: 'call',
          title: `Coordinate with ${bestHelper.name}`,
          subtitle: `Available • Phone: ${bestHelper.phone || 'Ready'}`,
          confirmLabel: `Call ${bestHelper.name}`,
          cancelLabel: 'Dismiss',
          payload: { phone: bestHelper.phone, memberId: bestHelper.id },
        },
        relatedEntities: { members: availableMembers },
      };
    } else {
      return {
        answer: `🚗 All family members are currently listed as busy, in transit, or away from home.\n\nYou can send a high-priority ping to the family broadcast channel to check who can assist.`,
        highlight: 'All Members Busy',
      };
    }
  }

  // -------------------------------------------------------------
  // 10. DEVICE TELEMETRY / "Battery" / "Silent"
  // -------------------------------------------------------------
  if (
    normalized.includes('battery') ||
    normalized.includes('batteries') ||
    normalized.includes('silent') ||
    normalized.includes('ringer') ||
    normalized.includes('sound')
  ) {
    if (members.length === 0) {
      return {
        answer: `No family members have been registered yet to monitor battery and sound telemetry.`,
        highlight: 'Telemetry Inactive',
      };
    }

    const deviceLines = members
      .map((m) => {
        const ringerStr =
          m.ringerMode === 'silent'
            ? '🔕 Silent'
            : m.ringerMode === 'vibrate'
            ? '📳 Vibrate'
            : '🔔 Sound';
        return `• **${m.name}**: ${m.batteryLevel}% battery${m.isCharging ? ' ⚡' : ''} • ${ringerStr} • ${m.humanLocation}`;
      })
      .join('\n');

    return {
      answer: `📱 **Family Device Status & Battery Telemetry:**\n\n${deviceLines}`,
      highlight: `${members.length} Devices Synced`,
      actionCard: {
        id: 'act_device_map',
        type: 'navigate',
        title: 'View Live Family Map',
        subtitle: 'Real-time telemetry and member statuses',
        confirmLabel: 'Open Family Map',
        cancelLabel: 'Close',
      },
      relatedEntities: { members },
    };
  }

  // -------------------------------------------------------------
  // 11. DYNAMIC USER-DEFINED FALLBACK
  // -------------------------------------------------------------
  const pendingCount = tasks.filter((t) => !t.isCompleted).length;
  const eventsCount = events.length;

  if (members.length > 0) {
    const memberSummary = members
      .map((m) => `• **${m.name}** (${m.relation}): ${m.humanLocation} (Battery: ${m.batteryLevel}%)`)
      .join('\n');

    return {
      answer: `I am FamilyOS AI, connected to **${familyName}**.\n\n**Current Family Status (${members.length} members):**\n${memberSummary}\n\n• **Pending Tasks:** ${pendingCount} item(s)\n• **Scheduled Events:** ${eventsCount} item(s)\n\n*You can ask me where any family member is, check pending utility bills, search saved memories or passwords, or tell me to assign a task.*`,
      highlight: `${familyName} • All Systems Synced`,
      actionCard: {
        id: 'act_generic_family_hub',
        type: 'navigate',
        title: 'Open Family Circle',
        subtitle: `${members.length} members connected`,
        confirmLabel: 'View Family Hub',
        cancelLabel: 'Close',
      },
      relatedEntities: { members },
    };
  }

  return {
    answer: `Welcome to FamilyOS AI! You are set up as the administrator of **${familyName}**.\n\nTo get the most out of your private family companion:\n1. Tap **Family** to invite or register your family members.\n2. Tap **Docs** to log upcoming household bills.\n3. Tap **Planner** to schedule family events and tasks.`,
    highlight: 'Welcome to FamilyOS AI',
    actionCard: {
      id: 'act_welcome_family',
      type: 'navigate',
      title: 'Invite Family Members',
      subtitle: 'Build your private family network',
      confirmLabel: 'Open Family Tab',
    },
  };
}
