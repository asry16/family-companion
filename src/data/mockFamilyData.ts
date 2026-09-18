import {
  FamilyMember,
  FamilyPlace,
  Task,
  CalendarEvent,
  Reminder,
  MemoryItem,
  FamilyDocument,
  SmartNotification,
  FamilyProfile,
} from '@/types';

export const initialFamilyProfile: FamilyProfile = {
  id: '',
  name: 'My Family',
  code: '',
  address: 'Home',
  homeCity: '',
  membersCount: 0,
};

export const initialPlaces: FamilyPlace[] = [];

export const initialMembers: FamilyMember[] = [];

export const initialTasks: Task[] = [];

export const initialEvents: CalendarEvent[] = [];

export const initialReminders: Reminder[] = [];

export const initialMemories: MemoryItem[] = [];

export const initialDocuments: FamilyDocument[] = [];

export const initialNotifications: SmartNotification[] = [];
