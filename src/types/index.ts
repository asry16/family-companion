export type MemberRelation = 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Grandmother' | 'Grandfather' | 'Daughter' | 'Son' | 'Spouse' | 'Partner' | 'Self' | 'Other';

export type LocationPlaceType = 'home' | 'office' | 'college' | 'school' | 'hospital' | 'grandparents' | 'grocery' | 'pharmacy' | 'other';

export type SharingDuration = '1h' | 'tonight' | 'always' | 'off';

export interface FamilyPlace {
  id: string;
  name: string;
  type: LocationPlaceType;
  address: string;
  emoji: string;
  coords: { x: number; y: number }; // normalized 0-100 for vector map
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: MemberRelation;
  initials: string;
  avatarColor: string;
  photoUrl?: string;
  isSelf?: boolean;
  statusMessage: string;
  currentPlaceId: string;
  humanLocation: string; // e.g. "At Office"
  batteryLevel: number;
  isCharging?: boolean;
  isSharingLocation: boolean;
  sharingDuration: SharingDuration;
  lastUpdated: string;
  nextTaskOrEvent?: string;
  availability: 'available' | 'busy' | 'in_transit' | 'offline';
  phone: string;
  ringerMode?: 'sound' | 'silent' | 'vibrate' | 'dnd';
  deviceModel?: string;
  coords?: { x: number; y: number; latitude?: number; longitude?: number };
}

export type PriorityLevel = 'urgent' | 'important' | 'normal';
export type TaskCategory = 'groceries' | 'bills' | 'health' | 'chores' | 'kids' | 'general';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  assignedToMemberId: string;
  createdByMemberId: string;
  dueDate: string;
  dueTime?: string;
  isCompleted: boolean;
  priority: PriorityLevel;
  relatedDocumentId?: string;
  note?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  location: string;
  category: 'doctor' | 'family' | 'school' | 'celebration' | 'work';
  attendeeMemberIds: string[];
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  targetMemberId: string;
  time: string;
  dueDate: string;
  category: 'medicine' | 'bill' | 'pickup' | 'call' | 'general';
  urgency: PriorityLevel;
  isDone: boolean;
  repeat?: 'daily' | 'weekly' | 'none';
}

export type MemoryCategory = 'household' | 'documents' | 'health' | 'preferences' | 'moments';

export interface MemoryItem {
  id: string;
  title: string;
  category: MemoryCategory;
  savedLocation: string; // Physical location e.g. "Blue cupboard, 2nd shelf"
  lastVerified: string;
  notes: string;
  tags: string[];
  relatedMemberIds: string[];
  emoji: string;
}

export type DocumentType = 'electricity_bill' | 'medical_prescription' | 'receipt' | 'insurance' | 'tax' | 'id_card';

export interface ExtractedField {
  label: string;
  value: string;
}

export interface SuggestedAction {
  id: string;
  label: string;
  actionType: 'add_reminder' | 'assign_task' | 'add_expense' | 'share_member';
  payload?: any;
}

export interface FamilyDocument {
  id: string;
  title: string;
  type: DocumentType;
  amount?: number;
  currency?: string;
  dueDate?: string;
  provider?: string;
  scannedAt: string;
  status: 'pending' | 'paid' | 'verified';
  assignedToMemberId?: string;
  fields: ExtractedField[];
  suggestedActions: SuggestedAction[];
  notes?: string;
}

export type SuggestionCategory = 'proximity' | 'due_date' | 'schedule_conflict' | 'health_refill';

export interface AISuggestion {
  id: string;
  title: string;
  body: string;
  reasoning: string;
  category: SuggestionCategory;
  primaryActionLabel: string;
  primaryActionType: 'ask_member' | 'remind_member' | 'assign_task' | 'confirm_pickup';
  primaryPayload?: any;
  secondaryActionLabel?: string;
  status: 'active' | 'accepted' | 'dismissed';
  createdAt: string;
}

export interface SmartNotification {
  id: string;
  title: string;
  body: string;
  priority: PriorityLevel;
  timestamp: string;
  isRead: boolean;
  category: 'task' | 'location' | 'ai' | 'bill' | 'health';
  actionLabel?: string;
  actionType?: string;
}

export interface FamilyProfile {
  id: string;
  name: string;
  code: string;
  address: string;
  homeCity: string;
  membersCount: number;
}
