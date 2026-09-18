import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth';
import { membersRepo, notificationsRepo } from './db/database';

interface FamilyClient {
  ws: WebSocket;
  userId: string;
  familyId: string;
  memberId: string;
}

const familyClients = new Map<string, Set<FamilyClient>>();

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    let clientInfo: FamilyClient | null = null;

    // Helper to authenticate
    const authenticate = (token: string) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          familyId?: string;
        };

        const member = membersRepo.findByUserId(decoded.userId);
        const familyId = decoded.familyId || member?.family_id;

        if (!familyId || !member) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'No family associated with this user.' }));
          return false;
        }

        clientInfo = {
          ws,
          userId: decoded.userId,
          familyId,
          memberId: member.id,
        };

        if (!familyClients.has(familyId)) {
          familyClients.set(familyId, new Set());
        }
        familyClients.get(familyId)!.add(clientInfo);

        // Notify client auth success
        ws.send(
          JSON.stringify({
            type: 'AUTH_SUCCESS',
            familyId,
            memberId: member.id,
            connectedMembersCount: familyClients.get(familyId)!.size,
          })
        );

        // Mark member as online/available
        membersRepo.update(member.id, { availability: 'available' });
        broadcastToFamily(familyId, {
          type: 'MEMBER_ONLINE',
          memberId: member.id,
        }, ws);

        return true;
      } catch (err) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid authentication token.' }));
        return false;
      }
    };

    // Check query token
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const queryToken = url.searchParams.get('token');
    if (queryToken) {
      authenticate(queryToken);
    }

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Handle initial auth handshake if not done via query
        if (msg.type === 'AUTH' && msg.token) {
          authenticate(msg.token);
          return;
        }

        if (!clientInfo) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Not authenticated yet.' }));
          return;
        }

        const { familyId, memberId } = clientInfo;

        switch (msg.type) {
          // 1. Live GPS Location Stream
          case 'LOCATION_UPDATE': {
            const { coordsX, coordsY, latitude, longitude, humanLocation } = msg.payload || {};
            membersRepo.update(memberId, {
              coords_x: coordsX,
              coords_y: coordsY,
              latitude,
              longitude,
              human_location: humanLocation || 'Location updated',
            });

            broadcastToFamily(familyId, {
              type: 'LOCATION_UPDATE',
              memberId,
              coordsX,
              coordsY,
              latitude,
              longitude,
              humanLocation,
              timestamp: new Date().toISOString(),
            }, ws);
            break;
          }

          // 2. Live Device Telemetry (Battery & Ringer)
          case 'DEVICE_TELEMETRY': {
            const { batteryLevel, isCharging, ringerMode } = msg.payload || {};
            membersRepo.update(memberId, {
              battery_level: batteryLevel,
              is_charging: isCharging ? 1 : 0,
              ringer_mode: ringerMode,
            });

            broadcastToFamily(familyId, {
              type: 'DEVICE_TELEMETRY',
              memberId,
              batteryLevel,
              isCharging,
              ringerMode,
              timestamp: new Date().toISOString(),
            }, ws);
            break;
          }

          // 3. Instant Family Ping
          case 'FAMILY_PING': {
            const { targetMemberId, message } = msg.payload || {};
            const sender = membersRepo.findById(memberId);
            const senderName = sender?.name || 'A family member';

            // Create persistent notification in database
            notificationsRepo.create({
              id: `notif_${Date.now()}`,
              family_id: familyId,
              title: `Ping from ${senderName}`,
              body: message || 'Checking in on you!',
              priority: 'normal',
              is_read: 0,
              category: 'ping',
            });

            broadcastToFamily(familyId, {
              type: 'FAMILY_PING',
              senderId: memberId,
              senderName,
              targetMemberId,
              message,
              timestamp: new Date().toISOString(),
            });
            break;
          }

          // 4. Emergency SOS Broadcast
          case 'EMERGENCY_SOS': {
            const { message } = msg.payload || {};
            const sender = membersRepo.findById(memberId);
            const senderName = sender?.name || 'A family member';

            notificationsRepo.create({
              id: `sos_${Date.now()}`,
              family_id: familyId,
              title: `🚨 EMERGENCY SOS: ${senderName}`,
              body: message || `${senderName} triggered an emergency broadcast. Check live map immediately.`,
              priority: 'urgent',
              is_read: 0,
              category: 'sos',
            });

            broadcastToFamily(familyId, {
              type: 'EMERGENCY_SOS',
              senderId: memberId,
              senderName,
              message,
              timestamp: new Date().toISOString(),
            });
            break;
          }

          case 'PING': {
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
          }
        }
      } catch (e) {
        console.warn('WebSocket message parse error:', e);
      }
    });

    ws.on('close', () => {
      if (clientInfo) {
        const familySet = familyClients.get(clientInfo.familyId);
        if (familySet) {
          familySet.delete(clientInfo);
          if (familySet.size === 0) {
            familyClients.delete(clientInfo.familyId);
          }
        }
      }
    });
  });

  return wss;
}

export function broadcastToFamily(familyId: string, event: any, excludeWs?: WebSocket) {
  const clients = familyClients.get(familyId);
  if (!clients) return;

  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}
