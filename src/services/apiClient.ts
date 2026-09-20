import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const JWT_TOKEN_KEY = '@kinly_jwt_token_v1';

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;

  // 1. Web environment
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `http://${window.location.hostname}:3001`;
      }
    }
    if (envUrl) {
      return envUrl;
    }
    return 'http://localhost:3001';
  }

  // 2. Native devices (Physical phone or Emulator)
  let devIp: string | null = null;
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const rawIp = hostUri.split(':')[0];
    if (rawIp && rawIp !== 'localhost' && rawIp !== '127.0.0.1') {
      devIp = rawIp;
    }
  }

  if (!devIp && Constants.linkingUri) {
    const match = Constants.linkingUri.match(/:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      devIp = match[1];
    }
  }

  if (devIp) {
    return `http://${devIp}:3001`;
  }

  // 3. Environment URL if specified and not localhost
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 4. Default LAN IP fallback for physical devices on local Wi-Fi
  return 'http://192.168.1.44:3001';
}

export function getWsBaseUrl(): string {
  const base = getApiBaseUrl();
  return base.replace(/^http/, 'ws') + '/ws';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const token = await AsyncStorage.getItem(JWT_TOKEN_KEY);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await response.json();
    if (!response.ok) {
      return { success: false, error: json.error || `HTTP ${response.status}` };
    }
    return json;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Network request timed out. Please check your network connection.' };
    }
    const rawMsg = err.message || '';
    if (rawMsg.includes('Failed to fetch') || rawMsg.includes('Network request failed') || rawMsg.includes('NetworkError')) {
      return {
        success: false,
        error: 'Unable to connect to backend server. Make sure the server is running on port 3001.',
      };
    }
    return { success: false, error: rawMsg || 'Server connection failed.' };
  }
}

export const apiClient = {
  // -----------------------------------------------------------
  // System Health
  // -----------------------------------------------------------
  checkHealth: async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // -----------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------
  auth: {
    login: async (email: string, pass: string) => {
      const res = await request<{ token: string; user: any; family?: any; member?: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.success && res.data?.token) {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, res.data.token);
      }
      return res;
    },

    loginWithGoogle: async (payload: {
      token?: string;
      idToken?: string;
      accessToken?: string;
      email?: string;
      name?: string;
      photoUrl?: string;
      googleId?: string;
    }) => {
      const res = await request<{ token: string; user: any; familyMember: any; family: any }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const token = res.data?.token || (res as any).token;
      if (res.success && token) {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, token);
      }
      return res;
    },

    register: async (payload: {
      name: string;
      email: string;
      phone?: string;
      age?: number | string;
      password: string;
      username?: string;
      familyName?: string;
      relation?: string;
    }) => {
      const res = await request<{ token: string; user: any; family?: any; member?: any; verificationCode?: string; delivered?: boolean }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Do not activate token until OTP verification is completed
      return res;
    },

    me: async () => {
      return request<{ user: any; familyMember: any }>('/api/auth/me');
    },

    sendOtp: async (
      email: string,
      purpose: 'login' | 'register' | 'verification' | 'password_reset' = 'login'
    ) => {
      const res = await request<{ code?: string; delivered?: boolean; message?: string }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      });
      return res;
    },

    loginWithOtp: async (email: string, code: string) => {
      const res = await request<{ token: string; user: any }>('/api/auth/login-with-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      const token = res.data?.token || (res as any).token;
      if (res.success && token) {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, token);
      }
      return res;
    },

    verifyOtp: async (email: string, code: string) => {
      const res = await request<{ message?: string; token?: string; user?: any }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      const token = res.data?.token || (res as any).token;
      if (res.success && token) {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, token);
      }
      return res;
    },

    forgotPassword: async (email: string) => {
      return request<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    logout: async () => {
      await AsyncStorage.removeItem(JWT_TOKEN_KEY);
    },
  },

  // -----------------------------------------------------------
  // Family Hub
  // -----------------------------------------------------------
  family: {
    getFamily: async () => {
      return request<{
        profile: any;
        members: any[];
        places: any[];
        tasks: any[];
        events: any[];
        reminders: any[];
        documents: any[];
        memories: any[];
        notifications: any[];
      }>('/api/family');
    },

    updateProfile: async (updates: { name?: string; address?: string; homeCity?: string }) => {
      return request('/api/family/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    createFamily: async (name: string, username?: string) => {
      const res = await request<{
        token: string;
        family: any;
        member: any;
      }>('/api/family/create', {
        method: 'POST',
        body: JSON.stringify({ name, username }),
      });
      if (res.success && res.data?.token) {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, res.data.token);
      }
      return res;
    },

    lookupFamily: async (query: string) => {
      return request<{
        family: {
          id: string;
          name: string;
          username: string | null;
          inviteCode: string;
          membersCount: number;
        };
      }>(`/api/family/lookup?query=${encodeURIComponent(query)}`);
    },

    joinFamily: async (usernameOrCode: string, relation?: string) => {
      const res = await request<{
        token?: string;
        familyId: string;
        familyName: string;
        familyUsername?: string;
        inviteCode?: string;
        message: string;
      }>('/api/family/join', {
        method: 'POST',
        body: JSON.stringify({ usernameOrCode, inviteCode: usernameOrCode, relation }),
      });
      if (res.success && res.data?.token) {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, res.data.token);
      }
      return res;
    },

    addMember: async (member: any) => {
      return request<{ member: any }>('/api/family/members', {
        method: 'POST',
        body: JSON.stringify(member),
      });
    },

    updateMember: async (memberId: string, updates: any) => {
      return request('/api/family/members/' + memberId, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    deleteMember: async (memberId: string) => {
      return request('/api/family/members/' + memberId, {
        method: 'DELETE',
      });
    },
  },

  // -----------------------------------------------------------
  // Telemetry & Safety
  // -----------------------------------------------------------
  telemetry: {
    updateLocation: async (data: {
      memberId?: string;
      coordsX?: number;
      coordsY?: number;
      latitude?: number;
      longitude?: number;
      humanLocation?: string;
    }) => {
      return request('/api/telemetry/location', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateDevice: async (data: {
      memberId?: string;
      batteryLevel?: number;
      isCharging?: boolean;
      ringerMode?: string;
      deviceModel?: string;
    }) => {
      return request('/api/telemetry/device', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    sendPing: async (targetMemberId: string, message: string) => {
      return request('/api/telemetry/ping', {
        method: 'POST',
        body: JSON.stringify({ targetMemberId, message }),
      });
    },

    triggerSOS: async (data: {
      latitude?: number;
      longitude?: number;
      coords?: { x?: number; y?: number; latitude?: number; longitude?: number };
      humanLocation?: string;
      batteryLevel?: number;
      message?: string;
      note?: string;
      memberId?: string;
      senderName?: string;
    }) => {
      return request<{ success: boolean; message: string; senderName?: string; location?: string }>('/api/telemetry/sos', {
        method: 'POST',
        body: JSON.stringify({
          memberId: data.memberId,
          senderName: data.senderName,
          message: data.message || data.note,
          coords: data.coords || (data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : undefined),
          humanLocation: data.humanLocation,
          batteryLevel: data.batteryLevel,
        }),
      });
    },
  },

  // -----------------------------------------------------------
  // Planner (Tasks, Events, Reminders)
  // -----------------------------------------------------------
  planner: {
    createTask: async (task: any) => {
      return request<{ task: any }>('/api/planner/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
    },

    updateTask: async (taskId: string, updates: any) => {
      return request('/api/planner/tasks/' + taskId, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    deleteTask: async (taskId: string) => {
      return request('/api/planner/tasks/' + taskId, {
        method: 'DELETE',
      });
    },

    createEvent: async (event: any) => {
      return request<{ event: any }>('/api/planner/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    },

    deleteEvent: async (eventId: string) => {
      return request('/api/planner/events/' + eventId, {
        method: 'DELETE',
      });
    },

    createReminder: async (reminder: any) => {
      return request<{ reminder: any }>('/api/planner/reminders', {
        method: 'POST',
        body: JSON.stringify(reminder),
      });
    },

    updateReminder: async (reminderId: string, updates: any) => {
      return request('/api/planner/reminders/' + reminderId, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    deleteReminder: async (reminderId: string) => {
      return request('/api/planner/reminders/' + reminderId, {
        method: 'DELETE',
      });
    },
  },

  // -----------------------------------------------------------
  // Vault (Documents, OCR, Memories)
  // -----------------------------------------------------------
  vault: {
    createDocument: async (doc: any) => {
      return request<{ document: any }>('/api/vault/documents', {
        method: 'POST',
        body: JSON.stringify(doc),
      });
    },

    updateDocStatus: async (docId: string, status: string) => {
      return request('/api/vault/documents/' + docId + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    deleteDocument: async (docId: string) => {
      return request('/api/vault/documents/' + docId, {
        method: 'DELETE',
      });
    },

    analyzeDoc: async (imageUriOrBase64: string, filename?: string) => {
      return request<{ analysis: any }>('/api/vault/documents/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: imageUriOrBase64, filename }),
      });
    },

    createMemory: async (memory: any) => {
      return request<{ memory: any }>('/api/vault/memories', {
        method: 'POST',
        body: JSON.stringify(memory),
      });
    },

    deleteMemory: async (memoryId: string) => {
      return request('/api/vault/memories/' + memoryId, {
        method: 'DELETE',
      });
    },
  },

  // -----------------------------------------------------------
  // AI Assistant
  // -----------------------------------------------------------
  ai: {
    query: async (query: string, activeMemberId?: string) => {
      return request<any>('/api/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query, activeMemberId }),
      });
    },
  },
};
