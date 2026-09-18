import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWsBaseUrl, JWT_TOKEN_KEY } from './apiClient';

export type WebSocketMessageType =
  | 'AUTH'
  | 'AUTH_SUCCESS'
  | 'PING'
  | 'PONG'
  | 'LOCATION_UPDATE'
  | 'DEVICE_TELEMETRY'
  | 'FAMILY_PING'
  | 'EMERGENCY_SOS'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'EVENT_CREATED'
  | 'EVENT_DELETED'
  | 'REMINDER_CREATED'
  | 'REMINDER_UPDATED'
  | 'REMINDER_DELETED'
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_STATUS_UPDATED'
  | 'DOCUMENT_DELETED'
  | 'MEMORY_CREATED'
  | 'MEMORY_DELETED'
  | 'MEMBER_ADDED'
  | 'MEMBER_UPDATED'
  | 'MEMBER_REMOVED'
  | 'PROFILE_UPDATED'
  | 'ERROR';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

type MessageListener = (msg: WebSocketMessage) => void;

class KinlyWebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private isExplicitlyClosed = false;
  private isConnecting = false;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.isConnecting = true;

    try {
      const url = getWsBaseUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = async () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Authenticate immediately upon socket open
        const token = await AsyncStorage.getItem(JWT_TOKEN_KEY);
        if (token && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'AUTH', token }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.listeners.forEach((listener) => {
            try {
              listener(data);
            } catch (err) {
              console.warn('[WS Listener Error]', err);
            }
          });
        } catch (err) {
          console.warn('[WS Message Parse Error]', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (_error) => {
        this.isConnecting = false;
        // On error, let onclose trigger reconnect
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  public addListener(listener: MessageListener) {
    this.listeners.add(listener);
    return () => this.removeListener(listener);
  }

  public removeListener(listener: MessageListener) {
    this.listeners.delete(listener);
  }

  public send(msg: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public sendLocation(memberId: string, coordsX: number, coordsY: number, latitude?: number, longitude?: number, humanLocation?: string) {
    this.send({
      type: 'LOCATION_UPDATE',
      memberId,
      coordsX,
      coordsY,
      latitude,
      longitude,
      humanLocation,
    });
  }

  public sendDeviceTelemetry(memberId: string, batteryLevel: number, isCharging: boolean, ringerMode?: string, deviceModel?: string) {
    this.send({
      type: 'DEVICE_TELEMETRY',
      memberId,
      batteryLevel,
      isCharging,
      ringerMode,
      deviceModel,
    });
  }

  public sendFamilyPing(targetMemberId: string, message: string) {
    this.send({
      type: 'FAMILY_PING',
      targetMemberId,
      message,
    });
  }

  public sendEmergencySOS(memberId: string, latitude?: number, longitude?: number, note?: string) {
    this.send({
      type: 'EMERGENCY_SOS',
      memberId,
      latitude,
      longitude,
      note,
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isExplicitlyClosed) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }
}

export const websocketClient = new KinlyWebSocketClient();
