import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { getAwsClientConfig, hasAwsCredentials, logAwsOperation } from './awsConfig';

const EVENT_BUS_NAME = process.env.AWS_EVENTBRIDGE_BUS || 'default';

let ebClient: EventBridgeClient | null = null;
function getEB(): EventBridgeClient {
  if (!ebClient) {
    ebClient = new EventBridgeClient(getAwsClientConfig());
  }
  return ebClient;
}

export const eventbridgeService = {
  /**
   * Publish a Family Domain Event to Amazon EventBridge
   */
  publishEvent: async (
    detailType: 'KinlyEmergencySOS' | 'KinlyTaskCreated' | 'KinlyReminderDue' | 'KinlyDocumentUploaded',
    detail: Record<string, any>
  ) => {
    if (hasAwsCredentials()) {
      try {
        const client = getEB();
        const res = await client.send(
          new PutEventsCommand({
            Entries: [
              {
                EventBusName: EVENT_BUS_NAME,
                Source: 'kinly.familyos',
                DetailType: detailType,
                Detail: JSON.stringify(detail),
                Time: new Date(),
              },
            ],
          })
        );
        logAwsOperation('eventbridge', 'PutEvents', { detailType, eventId: res.Entries?.[0]?.EventId });
        return { success: true, isLive: true };
      } catch (err: any) {
        console.warn('⚠️ [EventBridge Warning]:', err?.message || err);
      }
    }

    logAwsOperation('eventbridge', 'SimulatedEvent', { detailType, detail });
    return { success: true, isLive: false };
  },
};
