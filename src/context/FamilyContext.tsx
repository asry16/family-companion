import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FamilyMember,
  FamilyPlace,
  Task,
  CalendarEvent,
  Reminder,
  MemoryItem,
  FamilyDocument,
  AISuggestion,
  SmartNotification,
  FamilyProfile,
  SharingDuration,
} from '@/types';
import {
  initialFamilyProfile,
  initialMembers,
  initialPlaces,
  initialTasks,
  initialEvents,
  initialReminders,
  initialMemories,
  initialDocuments,
  initialNotifications,
} from '@/data/mockFamilyData';
import { generateContextSuggestions } from '@/context/ContextEngine';
import { processFamilyAIQuery, AIResponse } from '@/services/aiService';

const STORAGE_KEY = '@kinly_family_state_v1';

interface FamilyContextValue {
  profile: FamilyProfile;
  members: FamilyMember[];
  activeUser: FamilyMember;
  places: FamilyPlace[];
  tasks: Task[];
  events: CalendarEvent[];
  reminders: Reminder[];
  memories: MemoryItem[];
  documents: FamilyDocument[];
  suggestions: AISuggestion[];
  notifications: SmartNotification[];
  simpleMode: boolean;
  unreadCount: number;
  activeMemberId: string;
  setActiveMemberId: (id: string) => void;
  setSimpleMode: (enabled: boolean) => void;
  toggleTask: (taskId: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  deleteTask: (taskId: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  toggleReminder: (reminderId: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  addMemory: (memory: Omit<MemoryItem, 'id'>) => void;
  searchMemories: (query: string) => MemoryItem[];
  addDocument: (doc: Omit<FamilyDocument, 'id'>) => void;
  executeDocumentAction: (docId: string, actionId: string) => void;
  acceptSuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  updateLocationSharing: (memberId: string, duration: SharingDuration) => void;
  checkIn: (memberId: string, placeId: string) => void;
  askFamilyAI: (query: string) => AIResponse;
  sendFamilyPing: (memberId: string, message: string) => void;
  updateFamilyProfile: (updates: Partial<FamilyProfile>) => void;
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => FamilyMember;
  updateFamilyMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (memberId: string) => void;
  initUserFamily: (userMember: FamilyMember, profile: FamilyProfile) => void;
  resetToDefaults: () => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<FamilyProfile>(initialFamilyProfile);
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [places, setPlaces] = useState<FamilyPlace[]>(initialPlaces);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [memories, setMemories] = useState<MemoryItem[]>(initialMemories);
  const [documents, setDocuments] = useState<FamilyDocument[]>(initialDocuments);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [notifications, setNotifications] = useState<SmartNotification[]>(initialNotifications);
  const [simpleMode, setSimpleModeState] = useState<boolean>(false);
  const [activeMemberId, setActiveMemberId] = useState<string>('member_ritu');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    async function loadSavedState() {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const data = JSON.parse(json);
          if (data.profile) setProfile(data.profile);
          if (data.members) setMembers(data.members);
          if (data.tasks) setTasks(data.tasks);
          if (data.events) setEvents(data.events);
          if (data.reminders) setReminders(data.reminders);
          if (data.memories) setMemories(data.memories);
          if (data.documents) setDocuments(data.documents);
          if (data.notifications) setNotifications(data.notifications);
          if (typeof data.simpleMode === 'boolean') setSimpleModeState(data.simpleMode);
        }
      } catch (err) {
        console.warn('Failed to load state from AsyncStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSavedState();
  }, []);

  // Save to AsyncStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      profile,
      members,
      tasks,
      events,
      reminders,
      memories,
      documents,
      notifications,
      simpleMode,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave)).catch((err) =>
      console.warn('Failed to persist state:', err)
    );
  }, [profile, members, tasks, events, reminders, memories, documents, notifications, simpleMode, isLoaded]);

  // Context Engine: evaluate suggestions whenever relevant data changes
  useEffect(() => {
    const freshSuggestions = generateContextSuggestions({
      members,
      places,
      tasks,
      events,
      reminders,
      documents,
    });
    setSuggestions(freshSuggestions);
  }, [members, places, tasks, events, reminders, documents]);

  const activeUser = useMemo(() => {
    if (simpleMode) {
      // In Elderly Mode, default to Dadi for simple personal context, or Ritu
      return members.find((m) => m.id === 'member_dadi') || members[0];
    }
    return members.find((m) => m.id === activeMemberId) || members.find((m) => m.isSelf) || members[0];
  }, [members, simpleMode, activeMemberId]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const setSimpleMode = useCallback((enabled: boolean) => {
    setSimpleModeState(enabled);
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
    };
    setTasks((prev) => [newTask, ...prev]);

    // Add smart notification
    const assignee = initialMembers.find((m) => m.id === taskData.assignedToMemberId);
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Task assigned: ${newTask.title}`,
        body: `Assigned to ${assignee?.name || 'Family member'} for ${newTask.dueDate}.`,
        priority: newTask.priority,
        timestamp: 'Just now',
        isRead: false,
        category: 'task',
      },
      ...prev,
    ]);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event_${Date.now()}`,
    };
    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  const toggleReminder = useCallback((reminderId: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, isDone: !r.isDone } : r))
    );
  }, []);

  const addReminder = useCallback((reminderData: Omit<Reminder, 'id'>) => {
    const newRem: Reminder = {
      ...reminderData,
      id: `rem_${Date.now()}`,
    };
    setReminders((prev) => [newRem, ...prev]);
  }, []);

  const addMemory = useCallback((memoryData: Omit<MemoryItem, 'id'>) => {
    const newMem: MemoryItem = {
      ...memoryData,
      id: `mem_${Date.now()}`,
    };
    setMemories((prev) => [newMem, ...prev]);
  }, []);

  const searchMemories = useCallback(
    (query: string): MemoryItem[] => {
      const q = query.trim().toLowerCase();
      if (!q) return memories;
      return memories.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.savedLocation.toLowerCase().includes(q) ||
          m.notes.toLowerCase().includes(q) ||
          m.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    },
    [memories]
  );

  const addDocument = useCallback((docData: Omit<FamilyDocument, 'id'>) => {
    const newDoc: FamilyDocument = {
      ...docData,
      id: `doc_${Date.now()}`,
    };
    setDocuments((prev) => [newDoc, ...prev]);
  }, []);

  const executeDocumentAction = useCallback(
    (docId: string, actionId: string) => {
      const doc = documents.find((d) => d.id === docId);
      if (!doc) return;

      const action = doc.suggestedActions.find((a) => a.id === actionId);
      if (!action) return;

      if (action.actionType === 'add_reminder') {
        addReminder({
          title: `${doc.title} Due Payment`,
          targetMemberId: doc.assignedToMemberId || 'member_dad',
          time: '10:00 AM',
          dueDate: doc.dueDate || 'Tomorrow',
          category: 'bill',
          urgency: 'urgent',
          isDone: false,
        });
      } else if (action.actionType === 'assign_task') {
        addTask({
          title: `Clear ${doc.title} (${doc.currency || '₹'}${doc.amount?.toLocaleString() || ''})`,
          category: 'bills',
          assignedToMemberId: 'member_dad',
          createdByMemberId: 'member_ritu',
          dueDate: doc.dueDate || 'Tomorrow',
          isCompleted: false,
          priority: 'urgent',
          relatedDocumentId: doc.id,
        });
      } else if (action.actionType === 'add_expense') {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: 'paid' } : d))
        );
      }

      // Mark notification
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          title: `Action confirmed: ${action.label}`,
          body: `Processed for ${doc.title}.`,
          priority: 'normal',
          timestamp: 'Just now',
          isRead: false,
          category: 'bill',
        },
        ...prev,
      ]);
    },
    [documents, addReminder, addTask]
  );

  const acceptSuggestion = useCallback(
    (suggestionId: string) => {
      const sug = suggestions.find((s) => s.id === suggestionId);
      if (!sug) return;

      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestionId ? { ...s, status: 'accepted' } : s))
      );

      // Trigger respective action
      if (sug.primaryActionType === 'ask_member') {
        const targetMember = members.find((m) => m.id === sug.primaryPayload?.memberId);
        setNotifications((prev) => [
          {
            id: `notif_${Date.now()}`,
            title: `Message sent to ${targetMember?.name || 'Dad'}`,
            body: sug.primaryPayload?.message || 'Request dispatched via FamilyOS.',
            priority: 'important',
            timestamp: 'Just now',
            isRead: false,
            category: 'ai',
          },
          ...prev,
        ]);
      } else if (sug.primaryActionType === 'remind_member') {
        setNotifications((prev) => [
          {
            id: `notif_${Date.now()}`,
            title: `Reminder sent to Dad`,
            body: `Electricity bill payment reminder dispatched for ${sug.primaryPayload?.amount || '₹2,340'}.`,
            priority: 'urgent',
            timestamp: 'Just now',
            isRead: false,
            category: 'bill',
          },
          ...prev,
        ]);
      }
    },
    [suggestions, members]
  );

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const updateLocationSharing = useCallback((memberId: string, duration: SharingDuration) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            sharingDuration: duration,
            isSharingLocation: duration !== 'off',
            lastUpdated: 'Just now',
          };
        }
        return m;
      })
    );
  }, []);

  const checkIn = useCallback(
    (memberId: string, placeId: string) => {
      const place = places.find((p) => p.id === placeId);
      if (!place) return;

      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === memberId) {
            return {
              ...m,
              currentPlaceId: placeId,
              humanLocation: `At ${place.name}`,
              lastUpdated: 'Just now',
            };
          }
          return m;
        })
      );

      const member = members.find((m) => m.id === memberId);
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          title: `${member?.name || 'Member'} checked in`,
          body: `Arrived at ${place.name} (${place.address}).`,
          priority: 'normal',
          timestamp: 'Just now',
          isRead: false,
          category: 'location',
        },
        ...prev,
      ]);
    },
    [places, members]
  );

  const askFamilyAI = useCallback(
    (query: string): AIResponse => {
      return processFamilyAIQuery(query, {
        members,
        tasks,
        events,
        reminders,
        memories,
        documents,
        activeUser,
      });
    },
    [members, tasks, events, reminders, memories, documents, activeUser]
  );

  const sendFamilyPing = useCallback(
    (memberId: string, message: string) => {
      const member = members.find((m) => m.id === memberId);
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          title: `Ping sent to ${member?.name || 'Family member'}`,
          body: message,
          priority: 'normal',
          timestamp: 'Just now',
          isRead: false,
          category: 'ai',
        },
        ...prev,
      ]);
    },
    [members]
  );

  const updateFamilyProfile = useCallback((updates: Partial<FamilyProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const addFamilyMember = useCallback((memberData: Omit<FamilyMember, 'id'>): FamilyMember => {
    const newMember: FamilyMember = {
      ...memberData,
      id: `member_${Date.now()}`,
    };
    setMembers((prev) => {
      const next = [...prev, newMember];
      setProfile((p) => ({ ...p, membersCount: next.length }));
      return next;
    });
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Welcome ${newMember.name}!`,
        body: `${newMember.name} (${newMember.relation}) has joined your family space.`,
        priority: 'normal',
        timestamp: 'Just now',
        isRead: false,
        category: 'task',
      },
      ...prev,
    ]);
    return newMember;
  }, []);

  const updateFamilyMember = useCallback((memberId: string, updates: Partial<FamilyMember>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...updates } : m))
    );
  }, []);

  const deleteFamilyMember = useCallback((memberId: string) => {
    setMembers((prev) => {
      const filtered = prev.filter((m) => m.id !== memberId);
      setProfile((p) => ({ ...p, membersCount: filtered.length }));
      return filtered;
    });
  }, []);

  const initUserFamily = useCallback((userMember: FamilyMember, userProfile: FamilyProfile) => {
    setProfile(userProfile);
    setMembers([userMember]);
    setActiveMemberId(userMember.id);
  }, []);

  const resetToDefaults = useCallback(() => {
    setProfile(initialFamilyProfile);
    setMembers(initialMembers);
    setPlaces(initialPlaces);
    setTasks(initialTasks);
    setEvents(initialEvents);
    setReminders(initialReminders);
    setMemories(initialMemories);
    setDocuments(initialDocuments);
    setNotifications(initialNotifications);
    setSimpleModeState(false);
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.warn);
  }, []);

  return (
    <FamilyContext.Provider
      value={{
        profile,
        members,
        activeUser,
        places,
        tasks,
        events,
        reminders,
        memories,
        documents,
        suggestions,
        notifications,
        simpleMode,
        unreadCount,
        activeMemberId,
        setActiveMemberId,
        setSimpleMode,
        toggleTask,
        addTask,
        deleteTask,
        addEvent,
        toggleReminder,
        addReminder,
        addMemory,
        searchMemories,
        addDocument,
        executeDocumentAction,
        acceptSuggestion,
        dismissSuggestion,
        markNotificationRead,
        updateLocationSharing,
        checkIn,
        askFamilyAI,
        sendFamilyPing,
        updateFamilyProfile,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        initUserFamily,
        resetToDefaults,
      }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const ctx = useContext(FamilyContext);
  if (!ctx) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return ctx;
};
