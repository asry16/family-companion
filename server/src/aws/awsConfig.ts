/**
 * AWS SDK v3 Central Configuration Provider
 * Supports real AWS credentials (IAM / Event Engine / SSO) with graceful hybrid simulation fallback.
 */

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export function getAwsRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
}

export function hasAwsCredentials(): boolean {
  const key = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  return Boolean(key && secret && key.trim() !== '' && secret.trim() !== '');
}

export function getAwsClientConfig() {
  const region = getAwsRegion();

  if (hasAwsCredentials()) {
    const creds: AwsCredentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!.trim(),
    };
    if (process.env.AWS_SESSION_TOKEN) {
      creds.sessionToken = process.env.AWS_SESSION_TOKEN.trim();
    }
    return {
      region,
      credentials: creds,
    };
  }

  // Fallback to default credentials chain or mock region
  return {
    region,
  };
}

export function logAwsOperation(service: string, action: string, details: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const isLive = hasAwsCredentials();
  const badge = isLive ? '☁️ [AWS LIVE]' : '🧪 [AWS SIMULATION]';
  console.log(`${badge} [${service.toUpperCase()}] ${action} @ ${timestamp}`);
  if (Object.keys(details).length > 0) {
    console.log(`   ${JSON.stringify(details)}`);
  }
}
