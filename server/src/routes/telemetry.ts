import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { membersRepo, notificationsRepo } from '../db/database';
import { broadcastToFamily } from '../websocket';
import {
  dynamodbService,
  snsService,
  cloudwatchService,
  eventbridgeService,
} from '../aws';

const router = Router();
router.use(authMiddleware);

// -------------------------------------------------------------
// POST /api/telemetry/location - Update GPS / Canvas Location
// -------------------------------------------------------------
router.post('/location', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { memberId, coordsX, coordsY, latitude, longitude, humanLocation } = req.body || {};

    const targetId = memberId || req.user!.memberId;
    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Member ID required.' });
    }

    membersRepo.update(targetId, {
      coords_x: coordsX,
      coords_y: coordsY,
      latitude,
      longitude,
      human_location: humanLocation,
    });

    broadcastToFamily(familyId, {
      type: 'LOCATION_UPDATE',
      memberId: targetId,
      coordsX,
      coordsY,
      latitude,
      longitude,
      humanLocation,
      timestamp: new Date().toISOString(),
    });

    // AWS DynamoDB: High-throughput telemetry & location persistence
    dynamodbService.recordTelemetry({
      familyId,
      memberId: targetId,
      latitude,
      longitude,
      humanLocation,
    }).catch(e => console.warn('DynamoDB location err:', e.message));

    return res.json({ success: true, message: 'Location updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update location.' });
  }
});

// -------------------------------------------------------------
// POST /api/telemetry/device - Update Battery & Sound Status
// -------------------------------------------------------------
router.post('/device', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { memberId, batteryLevel, isCharging, ringerMode } = req.body || {};

    const targetId = memberId || req.user!.memberId;
    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Member ID required.' });
    }

    membersRepo.update(targetId, {
      battery_level: batteryLevel,
      is_charging: isCharging ? 1 : 0,
      ringer_mode: ringerMode,
    });

    broadcastToFamily(familyId, {
      type: 'DEVICE_TELEMETRY',
      memberId: targetId,
      batteryLevel,
      isCharging,
      ringerMode,
      timestamp: new Date().toISOString(),
    });

    // AWS DynamoDB: Device heartbeat recording
    dynamodbService.recordTelemetry({
      familyId,
      memberId: targetId,
      batteryLevel,
      isCharging: Boolean(isCharging),
      ringerMode,
    }).catch(e => console.warn('DynamoDB device err:', e.message));

    return res.json({ success: true, message: 'Device telemetry updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update telemetry.' });
  }
});

// -------------------------------------------------------------
// POST /api/telemetry/ping - Send Instant Status Check
// -------------------------------------------------------------
router.post('/ping', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { targetMemberId, message } = req.body || {};

    const senderId = req.user!.memberId || req.user!.id;
    const sender = membersRepo.findById(senderId);
    const senderName = sender?.name || req.user!.name || 'Family member';

    const notifId = `notif_${Date.now()}`;
    notificationsRepo.create({
      id: notifId,
      family_id: familyId,
      title: `Ping from ${senderName}`,
      body: message || 'Checking in on you!',
      priority: 'normal',
      is_read: 0,
      category: 'ping',
    });

    broadcastToFamily(familyId, {
      type: 'FAMILY_PING',
      senderId,
      senderName,
      targetMemberId,
      message,
      timestamp: new Date().toISOString(),
    });

    // AWS CloudWatch: Track family connectivity metrics
    cloudwatchService.putMetric('ActiveFamilyPings', 1, { FamilyId: familyId })
      .catch(e => console.warn('CloudWatch ping metric err:', e.message));

    return res.json({ success: true, message: 'Ping sent successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to send ping.' });
  }
});

// -------------------------------------------------------------
// POST /api/telemetry/sos - Emergency SOS Broadcast Alert
// -------------------------------------------------------------
router.post('/sos', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { message, coords, humanLocation, batteryLevel } = req.body || {};

    const senderId = req.user!.memberId || req.user!.id;
    const sender = membersRepo.findById(senderId);
    const senderName = sender?.name || req.user!.name || 'Family member';
    const senderRelation = sender?.relation || 'Family';
    const loc = humanLocation || sender?.human_location || 'Current Location';
    const batt = batteryLevel ?? sender?.battery_level ?? 95;

    const notifId = `sos_${Date.now()}`;
    notificationsRepo.create({
      id: notifId,
      family_id: familyId,
      title: `🚨 EMERGENCY SOS: ${senderName} (${senderRelation})`,
      body: message ? `${message} • Location: ${loc}` : `Emergency SOS activated at ${loc}. Battery: ${batt}%. Check live map immediately.`,
      priority: 'urgent',
      is_read: 0,
      category: 'sos',
    });

    const incidentData = {
      incidentId: notifId,
      familyId,
      senderId,
      senderName,
      senderRelation,
      humanLocation: loc,
      batteryLevel: batt,
      coords: coords || (sender ? { latitude: sender.latitude, longitude: sender.longitude } : undefined),
      message: message || 'Emergency SOS broadcast triggered.',
    };

    broadcastToFamily(familyId, {
      type: 'EMERGENCY_SOS',
      ...incidentData,
      timestamp: new Date().toISOString(),
    });

    // 1. AWS DynamoDB: Immutable emergency incident log
    dynamodbService.recordSOSIncident(incidentData)
      .catch(e => console.warn('DynamoDB SOS record err:', e.message));

    // 2. AWS SNS: Broadcast alert to SNS topic and dispatch SMS alerts
    const alertBody = `🚨 KINLY EMERGENCY: ${senderName} (${senderRelation}) triggered SOS at ${loc}! Battery: ${batt}%. Open Kinly map immediately!`;
    snsService.broadcastToTopic(`EMERGENCY: ${senderName} Needs Help!`, alertBody)
      .catch(e => console.warn('SNS broadcast err:', e.message));

    // Also send direct SMS if member phones are available
    const otherMembers = membersRepo.findByFamilyId(familyId).filter(m => m.id !== senderId);
    for (const member of otherMembers) {
      if (member.phone && member.phone.startsWith('+')) {
        snsService.sendEmergencySMS(member.phone, alertBody).catch(() => {});
      }
    }

    // 3. AWS CloudWatch: Emit emergency alarm metric and log audit entry
    cloudwatchService.putMetric('EmergencySOSTriggered', 1, { FamilyId: familyId, Priority: 'Urgent' })
      .catch(e => console.warn('CloudWatch SOS metric err:', e.message));
    cloudwatchService.logAuditEvent('KinlyEmergencySOS', incidentData)
      .catch(e => console.warn('CloudWatch SOS audit err:', e.message));

    // 4. AWS EventBridge: Publish domain event for external responders / queues
    eventbridgeService.publishEvent('KinlyEmergencySOS', incidentData)
      .catch(e => console.warn('EventBridge SOS event err:', e.message));

    return res.json({
      success: true,
      message: 'Emergency broadcast dispatched via Kinly Live Bus & AWS SNS/CloudWatch/DynamoDB.',
      senderName,
      location: loc,
      incidentId: notifId,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch SOS.' });
  }
});

export default router;
