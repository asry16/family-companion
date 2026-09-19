import { FamilyMember } from '@/types';

export interface ChatMemberStatusItem {
  id: string;
  name: string;
  relation: string;
  initials: string;
  avatarColor: string;
  locationName: string;
  batteryLevel: number;
  isCharging?: boolean;
  statusText: string;
  statusVariant: 'Safe' | 'All good' | 'View' | 'Vault';
  statusColorScheme: 'green' | 'blue' | 'purple' | 'yellow';
}

export interface ChatRichCardData {
  type: 'location' | 'battery' | 'safety' | 'general';
  title?: string;
  members: ChatMemberStatusItem[];
  actionLabel?: string;
}

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  highlight?: string;
  timestamp: string;
  richCard?: ChatRichCardData;
}

export interface SendMessageContext {
  activeUser?: FamilyMember;
  members?: FamilyMember[];
  familyName?: string;
}

export interface ChatServiceReply {
  reply: string;
  highlight?: string;
  richCard?: ChatRichCardData;
}

export interface IChatService {
  sendMessage(text: string, context?: SendMessageContext): Promise<ChatServiceReply>;
}

export class MockKinlyChatService implements IChatService {
  async sendMessage(text: string, context?: SendMessageContext): Promise<ChatServiceReply> {
    // Simulate brief network / LLM thinking delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalized = text.trim().toLowerCase();
    const familyName = context?.familyName || 'The A Family';
    const activeUserName = context?.activeUser?.name || 'Asmita';
    const rawMembers = context?.members && context.members.length > 0 ? context.members : [
      {
        id: '1',
        name: 'Dad (Rajesh)',
        relation: 'Father',
        initials: 'R',
        avatarColor: '#3B6FF0',
        humanLocation: 'Home Office',
        batteryLevel: 82,
        isCharging: false,
        statusMessage: 'At desk',
      } as FamilyMember,
      {
        id: '2',
        name: 'Dadi (Kamla)',
        relation: 'Grandmother',
        initials: 'K',
        avatarColor: '#7C5CE0',
        humanLocation: 'Living Room',
        batteryLevel: 94,
        isCharging: true,
        statusMessage: 'Reading morning newspaper',
      } as FamilyMember,
    ];

    const mappedMembers: ChatMemberStatusItem[] = rawMembers.map((m) => ({
      id: m.id,
      name: m.name,
      relation: m.relation || 'Member',
      initials: m.initials || m.name.charAt(0).toUpperCase(),
      avatarColor: m.avatarColor || '#3B6FF0',
      locationName: m.humanLocation || 'Home',
      batteryLevel: m.batteryLevel ?? 85,
      isCharging: m.isCharging ?? false,
      statusText: m.statusMessage || 'Active',
      statusVariant: 'Safe',
      statusColorScheme: 'green',
    }));

    // 1. Location Query ("Where is everyone?", "Where are family members?")
    if (normalized.includes('where is') || normalized.includes('location') || normalized.includes('everyone')) {
      return {
        reply: `Here are the live locations of your family members. Everyone's location is encrypted and synced in real time.`,
        highlight: `${familyName} • Live Presence`,
        richCard: {
          type: 'location',
          title: 'Family Live Locations',
          actionLabel: 'View on map →',
          members: mappedMembers,
        },
      };
    }

    // 2. Battery Query ("How is everyone's battery?", "battery")
    if (normalized.includes('battery') || normalized.includes('charge') || normalized.includes('power')) {
      const lowBatteryMembers = mappedMembers.filter((m) => m.batteryLevel < 20);
      const batterySummary = lowBatteryMembers.length > 0
        ? `Note: ${lowBatteryMembers.map((m) => m.name).join(', ')} has low battery.`
        : `All devices have sufficient battery levels right now.`;

      return {
        reply: `Here is the current device battery telemetry for your family. ${batterySummary}`,
        highlight: `${familyName} • Battery Telemetry`,
        richCard: {
          type: 'battery',
          title: 'Device Battery Status',
          actionLabel: 'View on map →',
          members: mappedMembers.map((m) => ({
            ...m,
            statusText: m.isCharging ? 'Charging' : `${m.batteryLevel}%`,
            statusVariant: m.batteryLevel > 30 ? 'All good' : 'Vault',
            statusColorScheme: m.batteryLevel > 30 ? 'blue' : 'yellow',
          })),
        },
      };
    }

    // 3. Safety Query ("Are all family members safe?", "safe")
    if (normalized.includes('safe') || normalized.includes('sos') || normalized.includes('status')) {
      return {
        reply: `All ${mappedMembers.length} family members are verified safe. No SOS triggers or safety alerts have been detected.`,
        highlight: `${familyName} • 100% Safe`,
        richCard: {
          type: 'safety',
          title: 'Family Safety Check',
          actionLabel: 'View on map →',
          members: mappedMembers.map((m) => ({
            ...m,
            statusText: 'Safe & Verified',
            statusVariant: 'Safe',
            statusColorScheme: 'green',
          })),
        },
      };
    }

    // 4. Default / General AI response
    return {
      reply: `I checked with ${familyName}'s shared systems. I am keeping track of live locations, schedule reminders, and home documents for you, ${activeUserName}. Let me know if you need to coordinate any plans!`,
      highlight: `${familyName} • Active & Synced`,
    };
  }
}

export const defaultChatService: IChatService = new MockKinlyChatService();
