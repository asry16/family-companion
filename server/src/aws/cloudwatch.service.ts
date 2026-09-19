import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogStreamCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { getAwsClientConfig, hasAwsCredentials, logAwsOperation } from './awsConfig';

const LOG_GROUP = process.env.AWS_CLOUDWATCH_LOG_GROUP || '/aws/kinly/backend';
const NAMESPACE = 'Kinly/FamilyOS';

let cwClient: CloudWatchClient | null = null;
let cwLogsClient: CloudWatchLogsClient | null = null;

function getCW(): CloudWatchClient {
  if (!cwClient) {
    cwClient = new CloudWatchClient(getAwsClientConfig());
  }
  return cwClient;
}

function getCWLogs(): CloudWatchLogsClient {
  if (!cwLogsClient) {
    cwLogsClient = new CloudWatchLogsClient(getAwsClientConfig());
  }
  return cwLogsClient;
}

export const cloudwatchService = {
  /**
   * Emit custom operational metrics to Amazon CloudWatch
   */
  putMetric: async (
    metricName: 'EmergencySOSTriggered' | 'ActiveFamilyPings' | 'DocumentScannedCount' | 'ApiRequestCount',
    value: number = 1,
    dimensions?: Record<string, string>
  ) => {
    const formattedDimensions = dimensions
      ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
      : [{ Name: 'Environment', Value: process.env.NODE_ENV || 'production' }];

    if (hasAwsCredentials()) {
      try {
        const client = getCW();
        await client.send(
          new PutMetricDataCommand({
            Namespace: NAMESPACE,
            MetricData: [
              {
                MetricName: metricName,
                Value: value,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: formattedDimensions,
              },
            ],
          })
        );
        logAwsOperation('cloudwatch', 'PutMetricData', { metricName, value });
        return { success: true, isLive: true };
      } catch (err: any) {
        console.warn('⚠️ [CloudWatch Metric Warning]:', err?.message || err);
      }
    }

    logAwsOperation('cloudwatch', 'SimulatedMetric', { metricName, value });
    return { success: true, isLive: false };
  },

  /**
   * Log critical security / emergency audit event to CloudWatch Logs
   */
  logAuditEvent: async (eventName: string, payload: Record<string, any>) => {
    const streamName = `audit-${new Date().toISOString().split('T')[0]}`;
    if (hasAwsCredentials()) {
      try {
        const client = getCWLogs();
        await client.send(
          new PutLogEventsCommand({
            logGroupName: LOG_GROUP,
            logStreamName: streamName,
            logEvents: [
              {
                timestamp: Date.now(),
                message: JSON.stringify({ eventName, ...payload, timestamp: new Date().toISOString() }),
              },
            ],
          })
        );
        logAwsOperation('cloudwatch-logs', 'PutLogEvents', { eventName, streamName });
        return { success: true, isLive: true };
      } catch (err: any) {
        // If stream does not exist, try creating it once
        try {
          const client = getCWLogs();
          await client.send(new CreateLogStreamCommand({ logGroupName: LOG_GROUP, logStreamName: streamName }));
        } catch {
          // ignore
        }
      }
    }

    logAwsOperation('cloudwatch-logs', 'SimulatedLog', { eventName, payload });
    return { success: true, isLive: false };
  },
};
