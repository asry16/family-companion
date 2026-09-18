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
import { apiClient } from '@/services/apiClient';
import { websocketClient } from '@/services/websocketClient';

const STORAGE_KEY = '@kinly_family_state_v1';

export interface SosAlertPayload {
  active: boolean;
  senderId?: string;
  senderName: string;
  senderRelation?: string;
  humanLocation?: string;
  batteryLevel?: number;
  coords?: { x?: number; y?: number; latitude?: number; longitude?: number };
  message?: string;
  timestamp: string;
}

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
  sosAlert: SosAlertPayload | null;
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
  sendEmergencySos: (reason?: string, details?: any) => Promise<{ success: boolean; error?: string }>;
  dismissSosAlert: () => void;
  joinFamilyByCode: (inviteCode: string, relation?: MemberRelation) => Promise<{ success: boolean; familyName?: string; error?: string }>;
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
  const [sosAlert, setSosAlert] = useState<SosAlertPayload | null>(null);

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

  // Synchronize with Kinly Backend Server & WebSocket
  useEffect(() => {
    if (!user) {
      websocketClient.disconnect();
      return;
    }

    let isSubscribed = true;

    // Fetch live family data from SQLite server
    apiClient.family.getFamily().then((res) => {
      if (!isSubscribed || !res.success || !res.data) return;
      const d = res.data;
      if (d.profile) setProfile(d.profile);
      if (d.members && d.members.length > 0) setMembers(d.members);
      if (d.places && d.places.length > 0) setPlaces(d.places);
      if (d.tasks) setTasks(d.tasks);
      if (d.events) setEvents(d.events);
      if (d.reminders) setReminders(d.reminders);
      if (d.documents) setDocuments(d.documents);
      if (d.memories) setMemories(d.memories);
      if (d.notifications) setNotifications(d.notifications);
    }).catch(() => {
      // Backend offline: continue with local state seamlessly
    });

    // Connect WebSocket
    websocketClient.connect();

    const removeWs = websocketClient.addListener((msg) => {
      if (!isSubscribed) return;

      switch (msg.type) {
        case 'LOCATION_UPDATE':
          setMembers((prev) =>
            prev.map((m) =>
              m.id === msg.memberId
                ? {
                    ...m,
                    coords: { x: msg.coordsX ?? m.coords?.x ?? 50, y: msg.coordsY ?? m.coords?.y ?? 50 },
                    humanLocation: msg.humanLocation || m.humanLocation,
                    lastUpdated: 'Just now',
                  }
                : m
            )
          );
          break;

        case 'DEVICE_TELEMETRY':
          setMembers((prev) =>
            prev.map((m) =>
              m.id === msg.memberId
                ? {
                    ...m,
                    batteryLevel: msg.batteryLevel ?? m.batteryLevel,
                    isCharging: typeof msg.isCharging === 'boolean' ? msg.isCharging : m.isCharging,
                    ringerMode: msg.ringerMode || m.ringerMode,
                    deviceModel: msg.deviceModel || m.deviceModel,
                  }
                : m
            )
          );
          break;

        case 'FAMILY_PING':
          setNotifications((prev) => [
            {
              id: `ping_${Date.now()}`,
              title: `Ping from Family`,
              body: msg.message || 'Someone sent you a check-in ping.',
              priority: 'important',
              timestamp: 'Just now',
              isRead: false,
              category: 'ai',
            },
            ...prev,
          ]);
          break;

        case 'EMERGENCY_SOS':
          setSosAlert({
            active: true,
            senderId: msg.memberId,
            senderName: msg.senderName || 'Family Member',
            humanLocation: msg.humanLocation || msg.locationName || 'Current Location',
            batteryLevel: msg.batteryLevel,
            coords: msg.coords,
            message: msg.note || msg.message || 'Emergency assistance requested!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          setNotifications((prev) => [
            {
              id: `sos_${Date.now()}`,
              title: `🚨 EMERGENCY SOS: ${msg.senderName || 'Family Member'}`,
              body: msg.note || msg.message || `A family member triggered an emergency SOS alert!`,
              priority: 'urgent',
              timestamp: 'Just now',
              isRead: false,
              category: 'location',
            },
            ...prev,
          ]);
          break;

        case 'TASK_CREATED':
          if (msg.task) {
            setTasks((prev) => (prev.some((t) => t.id === msg.task.id) ? prev : [msg.task, ...prev]));
          }
          break;

        case 'TASK_UPDATED':
          if (msg.task) {
            setTasks((prev) => prev.map((t) => (t.id === msg.task.id ? { ...t, ...msg.task } : t)));
          }
          break;

        case 'TASK_DELETED':
          setTasks((prev) => prev.filter((t) => t.id !== msg.taskId));
          break;

        case 'EVENT_CREATED':
          if (msg.event) {
            setEvents((prev) => (prev.some((e) => e.id === msg.event.id) ? prev : [...prev, msg.event]));
          }
          break;

        case 'EVENT_DELETED':
          setEvents((prev) => prev.filter((e) => e.id !== msg.eventId));
          break;

        case 'REMINDER_CREATED':
          if (msg.reminder) {
            setReminders((prev) => (prev.some((r) => r.id === msg.reminder.id) ? prev : [...prev, msg.reminder]));
          }
          break;

        case 'REMINDER_UPDATED':
          if (msg.reminder) {
            setReminders((prev) => prev.map((r) => (r.id === msg.reminder.id ? { ...r, ...msg.reminder } : r)));
          }
          break;

        case 'REMINDER_DELETED':
          setReminders((prev) => prev.filter((r) => r.id !== msg.reminderId));
          break;

        case 'DOCUMENT_CREATED':
          if (msg.document) {
            setDocuments((prev) => (prev.some((d) => d.id === msg.document.id) ? prev : [msg.document, ...prev]));
          }
          break;

        case 'DOCUMENT_STATUS_UPDATED':
          setDocuments((prev) =>
            prev.map((d) => (d.id === msg.documentId ? { ...d, status: msg.status } : d))
          );
          break;

        case 'DOCUMENT_DELETED':
          setDocuments((prev) => prev.filter((d) => d.id !== msg.documentId));
          break;

        case 'MEMORY_CREATED':
          if (msg.memory) {
            setMemories((prev) => (prev.some((m) => m.id === msg.memory.id) ? prev : [msg.memory, ...prev]));
          }
          break;

        case 'MEMORY_DELETED':
          setMemories((prev) => prev.filter((m) => m.id !== msg.memoryId));
          break;

        case 'MEMBER_ADDED':
          if (msg.member) {
            setMembers((prev) => (prev.some((m) => m.id === msg.member.id) ? prev : [...prev, msg.member]));
          }
          break;

        case 'MEMBER_UPDATED':
          if (msg.memberId && msg.updates) {
            setMembers((prev) =>
              prev.map((m) => (m.id === msg.memberId ? { ...m, ...msg.updates } : m))
            );
          }
          break;

        case 'MEMBER_REMOVED':
          setMembers((prev) => prev.filter((m) => m.id !== msg.memberId));
          break;

        case 'PROFILE_UPDATED':
          if (msg.profile) {
            setProfile((prev) => ({ ...prev, ...msg.profile }));
          }
          break;
      }
    });

    return () => {
      isSubscribed = false;
      removeWs();
      websocketClient.disconnect();
    };
  }, [user]);

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
    let nextStatus = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          nextStatus = !t.isCompleted;
          return { ...t, isCompleted: nextStatus };
        }
        return t;
      })
    );
    apiClient.planner.updateTask(taskId, { isCompleted: nextStatus }).catch(() => {});
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
    };
    setTasks((prev) => [newTask, ...prev]);
    apiClient.planner.createTask(newTask).catch(() => {});

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
    apiClient.planner.deleteTask(taskId).catch(() => {});
  }, []);

  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event_${Date.now()}`,
    };
    setEvents((prev) => [newEvent, ...prev]);
    apiClient.planner.createEvent(newEvent).catch(() => {});
  }, []);

  const toggleReminder = useCallback((reminderId: string) => {
    let nextDone = false;
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === reminderId) {
          nextDone = !r.isDone;
          return { ...r, isDone: nextDone };
        }
        return r;
      })
    );
    apiClient.planner.updateReminder(reminderId, { isDone: nextDone }).catch(() => {});
  }, []);

  const addReminder = useCallback((reminderData: Omit<Reminder, 'id'>) => {
    const newRem: Reminder = {
      ...reminderData,
      id: `rem_${Date.now()}`,
    };
    setReminders((prev) => [newRem, ...prev]);
    apiClient.planner.createReminder(newRem).catch(() => {});
  }, []);

  const addMemory = useCallback((memoryData: Omit<MemoryItem, 'id'>) => {
    const newMem: MemoryItem = {
      ...memoryData,
      id: `mem_${Date.now()}`,
    };
    setMemories((prev) => [newMem, ...prev]);
    apiClient.vault.createMemory(newMem).catch(() => {});
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
    apiClient.vault.createDocument(newDoc).catch(() => {});
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
      websocketClient.sendFamilyPing(memberId, message);
      apiClient.telemetry.sendPing(memberId, message).catch(() => {});
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
    apiClient.family.updateProfile(updates).catch(() => {});
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
    apiClient.family.updateProfile({ name: trimmedName, address, homeCity }).catch(() => {});
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
    apiClient.family.addMember(newMember).catch(() => {});

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
    apiClient.family.updateMember(memberId, updates).catch(() => {});
  }, []);

  const deleteFamilyMember = useCallback((memberId: string) => {
    setMembers((prev) => {
      const filtered = prev.filter((m) => m.id !== memberId);
      setProfile((p) => ({ ...p, membersCount: filtered.length }));
      return filtered;
    });
    apiClient.family.deleteMember(memberId).catch(() => {});
  }, []);

  const initUserFamily = useCallback((userMember: FamilyMember, userProfile: FamilyProfile) => {
    setProfile(userProfile);
    setMembers([userMember]);
    setActiveMemberId(userMember.id);
  }, []);

  const dismissSosAlert = useCallback(() => {
    setSosAlert(null);
  }, []);

  const sendEmergencySos = useCallback(
    async (reason?: string, details?: any) => {
      try {
        const activeMem = members.find((m) => m.id === activeMemberId) || activeUser;
        const alertMsg = reason || 'Emergency assistance requested!';
        const humanLoc = details?.humanLocation || activeMem?.humanLocation || 'Current Location';
        const coords = details?.coords || activeMem?.coords || { x: 50, y: 50, latitude: 28.4595, longitude: 77.0266 };
        const battery = details?.batteryLevel ?? activeMem?.batteryLevel ?? 88;

        // Immediate local state update
        setSosAlert({
          active: true,
          senderId: activeMem?.id || user?.id || 'me',
          senderName: activeMem?.name || user?.name || 'You',
          senderRelation: activeMem?.relation || 'Self',
          humanLocation: humanLoc,
          batteryLevel: battery,
          coords,
          message: alertMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        // Broadcast to server & family members
        await apiClient.telemetry.triggerSOS({
          memberId: activeMem?.id || user?.id,
          senderName: activeMem?.name || user?.name || 'Family Member',
          coords,
          humanLocation: humanLoc,
          batteryLevel: battery,
          message: alertMsg,
        });

        return { success: true };
      } catch (err: any) {
        console.warn('SOS network error:', err);
        return { success: true };
      }
    },
    [activeMemberId, activeUser, members, user]
  );

  const joinFamilyByCode = useCallback(
    async (inviteCode: string, relation?: MemberRelation) => {
      try {
        const cleanCode = inviteCode.trim().toUpperCase();
        const res = await apiClient.family.joinFamily(cleanCode, relation);
        if (res.success) {
          const famRes = await apiClient.family.getFamily();
          if (famRes.success && famRes.data) {
            if (famRes.data.profile) setProfile(famRes.data.profile);
            if (famRes.data.members && famRes.data.members.length > 0) setMembers(famRes.data.members);
            if (famRes.data.places) setPlaces(famRes.data.places);
            if (famRes.data.tasks) setTasks(famRes.data.tasks);
            if (famRes.data.events) setEvents(famRes.data.events);
            if (famRes.data.reminders) setReminders(famRes.data.reminders);
            if (famRes.data.documents) setDocuments(famRes.data.documents);
            if (famRes.data.memories) setMemories(famRes.data.memories);
            if (famRes.data.notifications) setNotifications(famRes.data.notifications);
          }
          return { success: true, familyName: famRes.data?.profile?.name || 'Family Circle' };
        }
        return { success: false, error: res.error || 'Invalid or expired invite code' };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to join family circle' };
      }
    },
    []
  );

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
        sosAlert,
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
        sendEmergencySos,
        dismissSosAlert,
        joinFamilyByCode,
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
