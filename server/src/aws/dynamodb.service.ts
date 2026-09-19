import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getAwsClientConfig, hasAwsCredentials, logAwsOperation } from './awsConfig';

const TELEMETRY_TABLE = process.env.AWS_DYNAMODB_TELEMETRY_TABLE || 'KinlyTelemetryStream';
const SOS_TABLE = process.env.AWS_DYNAMODB_SOS_TABLE || 'KinlyEmergencyEvents';

let docClient: DynamoDBDocumentClient | null = null;
function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const rawClient = new DynamoDBClient(getAwsClientConfig());
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
}

export const dynamodbService = {
  /**
   * Record location ping and device heartbeat into Amazon DynamoDB
   */
  recordTelemetry: async (data: {
    familyId: string;
    memberId: string;
    latitude?: number;
    longitude?: number;
    humanLocation?: string;
    batteryLevel?: number;
    isCharging?: boolean;
    ringerMode?: string;
  }) => {
    const timestamp = new Date().toISOString();
    const item = {
      PK: `FAMILY#${data.familyId}`,
      SK: `MEMBER#${data.memberId}#${Date.now()}`,
      familyId: data.familyId,
      memberId: data.memberId,
      latitude: data.latitude,
      longitude: data.longitude,
      humanLocation: data.humanLocation,
      batteryLevel: data.batteryLevel,
      isCharging: data.isCharging,
      ringerMode: data.ringerMode,
      ttl: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 day TTL
      recordedAt: timestamp,
    };

    if (hasAwsCredentials()) {
      try {
        const client = getDocClient();
        await client.send(
          new PutCommand({
            TableName: TELEMETRY_TABLE,
            Item: item,
          })
        );
        logAwsOperation('dynamodb', 'PutTelemetry', { table: TELEMETRY_TABLE, memberId: data.memberId });
        return { success: true, isLive: true };
      } catch (err: any) {
        console.warn('⚠️ [DynamoDB Telemetry Warning]:', err?.message || err);
      }
    }

    logAwsOperation('dynamodb', 'SimulatedTelemetry', { table: TELEMETRY_TABLE, memberId: data.memberId });
    return { success: true, isLive: false };
  },

  /**
   * Log an immutable emergency SOS incident into Amazon DynamoDB
   */
  recordSOSIncident: async (incident: {
    incidentId: string;
    familyId: string;
    senderId: string;
    senderName: string;
    senderRelation: string;
    humanLocation?: string;
    batteryLevel?: number;
    message?: string;
    coords?: { latitude?: number; longitude?: number };
  }) => {
    const timestamp = new Date().toISOString();
    const item = {
      PK: `FAMILY#${incident.familyId}`,
      SK: `SOS#${incident.incidentId}`,
      ...incident,
      resolved: false,
      timestamp,
    };

    if (hasAwsCredentials()) {
      try {
        const client = getDocClient();
        await client.send(
          new PutCommand({
            TableName: SOS_TABLE,
            Item: item,
          })
        );
        logAwsOperation('dynamodb', 'PutSOSIncident', { table: SOS_TABLE, incidentId: incident.incidentId });
        return { success: true, isLive: true };
      } catch (err: any) {
        console.warn('⚠️ [DynamoDB SOS Warning]:', err?.message || err);
      }
    }

    logAwsOperation('dynamodb', 'SimulatedSOSIncident', { table: SOS_TABLE, incidentId: incident.incidentId });
    return { success: true, isLive: false };
  },
};
