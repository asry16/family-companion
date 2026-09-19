/**
 * Kinly AWS Live Provisioning & Verification Script
 * Provisions S3, DynamoDB, SNS, CloudWatch resources and tests live connectivity.
 * No AWS CLI required — uses AWS SDK v3 directly.
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { S3Client, CreateBucketCommand, PutBucketEncryptionCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, CreateTopicCommand } from '@aws-sdk/client-sns';
import { CloudWatchLogsClient, CreateLogGroupCommand } from '@aws-sdk/client-cloudwatch-logs';

const region = process.env.AWS_REGION || 'us-east-1';
const creds = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
};
const config = { region, credentials: creds };

async function main() {
  console.log('\n======================================================');
  console.log('🚀 KINLY AWS LIVE PROVISIONING & VERIFICATION');
  console.log('======================================================\n');

  // 1. Verify AWS Identity
  try {
    const sts = new STSClient(config);
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    console.log('✅ [STS] AWS Identity Verified!');
    console.log(`   Account: ${identity.Account}`);
    console.log(`   ARN:     ${identity.Arn}`);
    console.log(`   UserId:  ${identity.UserId}`);
    console.log(`   Region:  ${region}\n`);
  } catch (err: any) {
    console.error('❌ [STS] FAILED to verify AWS credentials:', err.message);
    process.exit(1);
  }

  // 2. Provision S3 Bucket
  const bucketName = process.env.AWS_S3_BUCKET || 'kinly-family-vault';
  const s3 = new S3Client(config);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ [S3] Bucket "${bucketName}" already exists.`);
  } catch {
    try {
      const createParams: any = { Bucket: bucketName };
      if (region !== 'us-east-1') {
        createParams.CreateBucketConfiguration = { LocationConstraint: region };
      }
      await s3.send(new CreateBucketCommand(createParams));
      console.log(`✅ [S3] Created bucket "${bucketName}".`);
    } catch (err: any) {
      console.log(`⚠️  [S3] Bucket create: ${err.message}`);
    }
  }
  // Enable encryption
  try {
    await s3.send(new PutBucketEncryptionCommand({
      Bucket: bucketName,
      ServerSideEncryptionConfiguration: {
        Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }],
      },
    }));
    console.log(`   Encryption: AES-256 enabled.`);
  } catch (err: any) {
    console.log(`   Encryption: ${err.message}`);
  }

  // 3. Provision DynamoDB Tables
  const dynamo = new DynamoDBClient(config);
  const tables = [
    process.env.AWS_DYNAMODB_TELEMETRY_TABLE || 'KinlyTelemetryStream',
    process.env.AWS_DYNAMODB_SOS_TABLE || 'KinlyEmergencyEvents',
  ];
  for (const tableName of tables) {
    try {
      await dynamo.send(new DescribeTableCommand({ TableName: tableName }));
      console.log(`✅ [DynamoDB] Table "${tableName}" already exists.`);
    } catch {
      try {
        await dynamo.send(new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        }));
        console.log(`✅ [DynamoDB] Created table "${tableName}".`);
      } catch (err: any) {
        console.log(`⚠️  [DynamoDB] Table "${tableName}": ${err.message}`);
      }
    }
  }

  // 4. Provision SNS Topic
  const sns = new SNSClient(config);
  try {
    const res = await sns.send(new CreateTopicCommand({ Name: 'KinlyEmergencyAlerts' }));
    console.log(`✅ [SNS] Topic ARN: ${res.TopicArn}`);
  } catch (err: any) {
    console.log(`⚠️  [SNS] Topic: ${err.message}`);
  }

  // 5. Provision CloudWatch Log Group
  const cwLogs = new CloudWatchLogsClient(config);
  const logGroup = process.env.AWS_CLOUDWATCH_LOG_GROUP || '/aws/kinly/backend';
  try {
    await cwLogs.send(new CreateLogGroupCommand({ logGroupName: logGroup }));
    console.log(`✅ [CloudWatch] Created log group "${logGroup}".`);
  } catch (err: any) {
    if (err.name === 'ResourceAlreadyExistsException') {
      console.log(`✅ [CloudWatch] Log group "${logGroup}" already exists.`);
    } else {
      console.log(`⚠️  [CloudWatch] Log group: ${err.message}`);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 AWS CLOUD INFRASTRUCTURE PROVISIONING COMPLETE!');
  console.log('======================================================\n');
}

main().catch(console.error);
