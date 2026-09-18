import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import {
  FamilyMember,
  MemberRelation,
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
  createOrUpdateFamily: (name: string, address?: string, homeCity?: string) => void;
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => FamilyMember;
  updateFamilyMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (memberId: string) => void;
  initUserFamily: (userMember: FamilyMember, profile: FamilyProfile) => void;
  resetToDefaults: () => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FamilyProfile>({
    id: 'fam_empty',
    name: 'My Family',
    code: 'KIN-0000',
    address: 'Home',
    homeCity: '',
    membersCount: 0,
  });
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [places, setPlaces] = useState<FamilyPlace[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [simpleMode, setSimpleModeState] = useState<boolean>(false);
  const [activeMemberId, setActiveMemberId] = useState<string>(user?.familyMemberId || '');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const currentStorageKey = useMemo(() => {
    if (user?.id) {
      return `@kinly_family_state_${user.id}`;
    }
    return STORAGE_KEY;
  }, [user]);

  // Load from AsyncStorage whenever user or storage key changes
  useEffect(() => {
    let isCancelled = false;

    async function loadSavedState() {
      try {
        setIsLoaded(false);
        const json = await AsyncStorage.getItem(currentStorageKey);

        if (json) {
          const data = JSON.parse(json);
          let loadedMembers: FamilyMember[] = data.members || [];

          // If authenticated user, sync their profile with AuthUser
          if (user) {
            const selfIdx = loadedMembers.findIndex(
              (m) => m.isSelf || m.id === user.familyMemberId
            );
            if (selfIdx >= 0) {
              loadedMembers[selfIdx] = {
                ...loadedMembers[selfIdx],
                name: user.name,
                relation: (user.relation as MemberRelation) || loadedMembers[selfIdx].relation || 'Self',
                isSelf: true,
                initials: user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase(),
              };
            }
          }

          if (!isCancelled) {
            if (data.profile) setProfile(data.profile);
            setMembers(loadedMembers);
            if (data.places) setPlaces(data.places);
            if (data.tasks) setTasks(data.tasks);
            if (data.events) setEvents(data.events);
            if (data.reminders) setReminders(data.reminders);
            if (data.memories) setMemories(data.memories);
            if (data.documents) setDocuments(data.documents);
            if (data.notifications) setNotifications(data.notifications);
            if (typeof data.simpleMode === 'boolean') setSimpleModeState(data.simpleMode);
            if (user?.familyMemberId) {
              setActiveMemberId(user.familyMemberId);
            } else {
              const selfMember = loadedMembers.find((m) => m.isSelf);
              if (selfMember) setActiveMemberId(selfMember.id);
            }
          }
        } else {
          // No saved state found for this user key
          if (user) {
            // Initialize fresh user-defined family
            const memberId = user.familyMemberId || `member_${user.id}`;
            const userMember: FamilyMember = {
              id: memberId,
              name: user.name,
              relation: (user.relation as MemberRelation) || 'Self',
              initials: user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
              avatarColor: '#3B82F6',
              isSelf: true,
              statusMessage: 'Just joined Kinly!',
              currentPlaceId: 'place_home',
              humanLocation: 'At Home',
              batteryLevel: 95,
              isCharging: false,
              isSharingLocation: true,
              sharingDuration: 'always',
              lastUpdated: 'Just now',
              availability: 'available',
              phone: '+1 555-0100',
              ringerMode: 'sound',
              deviceModel: 'iPhone 15',
              coords: { x: 50, y: 50 },
            };

            const userProfile: FamilyProfile = {
              id: `fam_${user.id}`,
              name: user.familyName || `${user.name.split(' ')[0]}'s Family`,
              code: `KIN-${Math.floor(1000 + Math.random() * 9000)}`,
              membersCount: 1,
              address: 'Home',
              homeCity: 'Local',
            };

            const defaultHomePlace: FamilyPlace = {
              id: 'place_home',
              name: 'Home',
              address: 'Family Sanctuary',
              type: 'home',
              emoji: '🏡',
              coords: { x: 50, y: 50 },
            };

            if (!isCancelled) {
              setProfile(userProfile);
              setMembers([userMember]);
              setPlaces([defaultHomePlace]);
              setTasks([]);
              setEvents([]);
              setReminders([]);
              setMemories([]);
              setDocuments([]);
              setNotifications([
                {
                  id: `notif_${Date.now()}`,
                  title: `Welcome to ${userProfile.name}!`,
                  body: `Your private family vault is active. Tap Family to invite or add your family members.`,
                  priority: 'important',
                  timestamp: 'Just now',
                  isRead: false,
                  category: 'ai',
                },
              ]);
              setActiveMemberId(memberId);
            }
          } else {
            // Unauthenticated: zero demo fallback
            if (!isCancelled) {
              setProfile({
                id: 'fam_empty',
                name: 'My Family',
                code: 'KIN-0000',
                membersCount: 0,
                address: 'Home',
                homeCity: '',
              });
              setMembers([]);
              setPlaces([]);
              setTasks([]);
              setEvents([]);
              setReminders([]);
              setMemories([]);
              setDocuments([]);
              setNotifications([]);
              setActiveMemberId('');
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load state from AsyncStorage:', err);
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    }

    loadSavedState();
    return () => {
      isCancelled = true;
    };
  }, [user, currentStorageKey]);

  // Save to currentStorageKey whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      profile,
      members,
      places,
      tasks,
      events,
      reminders,
      memories,
      documents,
      notifications,
      simpleMode,
    };
    AsyncStorage.setItem(currentStorageKey, JSON.stringify(stateToSave)).catch((err) =>
      console.warn('Failed to persist state:', err)
    );
  }, [
    profile,
    members,
    places,
    tasks,
    events,
    reminders,
    memories,
    documents,
    notifications,
    simpleMode,
    isLoaded,
    currentStorageKey,
  ]);

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

  const fallbackActiveUser: FamilyMember = useMemo(() => ({
    id: user?.familyMemberId || (user?.id ? `member_${user.id}` : 'member_me'),
    name: user?.name || 'You',
    relation: (user?.relation as MemberRelation) || 'Self',
    initials: user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'YOU',
    avatarColor: '#3B82F6',
    isSelf: true,
    statusMessage: 'Family Space Ready',
    currentPlaceId: 'place_home',
    humanLocation: 'At Home',
    batteryLevel: 100,
    isCharging: false,
    isSharingLocation: true,
    sharingDuration: 'always',
    lastUpdated: 'Just now',
    availability: 'available',
    phone: '+1 555-0100',
    ringerMode: 'sound',
    deviceModel: 'iPhone 15',
    coords: { x: 50, y: 50 },
  }), [user]);

  const activeUser: FamilyMember = useMemo(() => {
    if (simpleMode) {
      return (
        members.find((m) => m.relation === 'Grandmother' || m.id === 'member_dadi') ||
        members[0] ||
        fallbackActiveUser
      );
    }
    return (
      members.find((m) => m.id === activeMemberId) ||
      members.find((m) => m.isSelf) ||
      members[0] ||
      fallbackActiveUser
    );
  }, [members, simpleMode, activeMemberId, fallbackActiveUser]);

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
        const defaultAssignee = members.find((m) => !m.isSelf)?.id || activeUser.id;
        addReminder({
          title: `${doc.title} Due Payment`,
          targetMemberId: doc.assignedToMemberId || defaultAssignee,
          time: '10:00 AM',
          dueDate: doc.dueDate || 'Tomorrow',
          category: 'bill',
          urgency: 'urgent',
          isDone: false,
        });
      } else if (action.actionType === 'assign_task') {
        const defaultAssignee = members.find((m) => !m.isSelf)?.id || activeUser.id;
        addTask({
          title: `Clear ${doc.title} (${doc.currency || '₹'}${doc.amount?.toLocaleString() || ''})`,
          category: 'bills',
          assignedToMemberId: defaultAssignee,
          createdByMemberId: activeUser.id,
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
        places,
        tasks,
        events,
        reminders,
        memories,
        documents,
        activeUser,
        profile,
      });
    },
    [members, places, tasks, events, reminders, memories, documents, activeUser, profile]
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

  const createOrUpdateFamily = useCallback((name: string, address?: string, homeCity?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setProfile((prev) => ({
      ...prev,
      name: trimmedName,
      address: address?.trim() || prev.address,
      homeCity: homeCity?.trim() || prev.homeCity,
    }));
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Family Space Updated`,
        body: `Your family space has been updated to "${trimmedName}".`,
        priority: 'normal',
        timestamp: 'Just now',
        isRead: false,
        category: 'ai',
      },
      ...prev,
    ]);
  }, []);

  const addFamilyMember = useCallback((memberData: Omit<FamilyMember, 'id'>): FamilyMember => {
    const randomOffset = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
    const coords = memberData.coords || {
      x: randomOffset(20, 80),
      y: randomOffset(20, 80),
      latitude: 28.4595 + (Math.random() - 0.5) * 0.04,
      longitude: 77.0266 + (Math.random() - 0.5) * 0.04,
    };

    const newMember: FamilyMember = {
      ...memberData,
      id: `member_${Date.now()}`,
      ringerMode: memberData.ringerMode || 'sound',
      batteryLevel: memberData.batteryLevel ?? 88,
      deviceModel: memberData.deviceModel || (Platform.OS === 'ios' ? 'iPhone' : 'Android Device'),
      coords,
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
    AsyncStorage.removeItem(currentStorageKey).catch(console.warn);
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.warn);
  }, [currentStorageKey]);

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
        createOrUpdateFamily,
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
