import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { getAwsClientConfig, hasAwsCredentials, logAwsOperation } from './awsConfig';

let snsClient: SNSClient | null = null;
function getClient(): SNSClient {
  if (!snsClient) {
    snsClient = new SNSClient(getAwsClientConfig());
  }
  return snsClient;
}

export interface SnsPublishResult {
  messageId?: string;
  delivered: boolean;
  channel: 'sms' | 'topic' | 'simulated';
}

export const snsService = {
  /**
   * Dispatch an Urgent SMS alert to family members via Amazon SNS
   */
  sendEmergencySMS: async (phoneNumber: string, message: string): Promise<SnsPublishResult> => {
    if (hasAwsCredentials() && phoneNumber) {
      try {
        const client = getClient();
        const res = await client.send(
          new PublishCommand({
            PhoneNumber: phoneNumber,
            Message: `[KINLY SOS ALERT] 🚨 ${message}`,
            MessageAttributes: {
              'AWS.SNS.SMS.SMSType': {
                DataType: 'String',
                StringValue: 'Transactional', // High priority delivery
              },
            },
          })
        );

        logAwsOperation('sns', 'PublishSMS', { phoneNumber, messageId: res.MessageId });
        return { messageId: res.MessageId, delivered: true, channel: 'sms' };
      } catch (err: any) {
        console.warn('⚠️ [SNS SMS Warning]:', err?.message || err);
      }
    }

    logAwsOperation('sns', 'SimulatedSMS', { phoneNumber, message });
    return { delivered: false, channel: 'simulated' };
  },

  /**
   * Broadcast emergency SOS notification to an Amazon SNS Topic
   */
  broadcastToTopic: async (subject: string, message: string): Promise<SnsPublishResult> => {
    const topicArn = process.env.AWS_SNS_TOPIC_ARN;
    if (hasAwsCredentials() && topicArn) {
      try {
        const client = getClient();
        const res = await client.send(
          new PublishCommand({
            TopicArn: topicArn,
            Subject: subject,
            Message: message,
          })
        );

        logAwsOperation('sns', 'PublishTopic', { topicArn, messageId: res.MessageId });
        return { messageId: res.MessageId, delivered: true, channel: 'topic' };
      } catch (err: any) {
        console.warn('⚠️ [SNS Topic Warning]:', err?.message || err);
      }
    }

    logAwsOperation('sns', 'SimulatedTopicBroadcast', { subject, message });
    return { delivered: false, channel: 'simulated' };
  },
};
