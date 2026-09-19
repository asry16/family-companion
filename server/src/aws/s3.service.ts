import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAwsClientConfig, hasAwsCredentials, logAwsOperation } from './awsConfig';

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'kinly-family-vault';

let s3Client: S3Client | null = null;
function getClient(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client(getAwsClientConfig());
  }
  return s3Client;
}

export interface UploadResult {
  s3Key: string;
  url: string;
  bucket: string;
  isLiveS3: boolean;
}

export const s3Service = {
  /**
   * Upload an asset (document, photo, memory, receipt) to Amazon S3
   */
  uploadAsset: async (options: {
    familyId: string;
    category: 'documents' | 'memories' | 'avatars';
    fileKey: string;
    contentType?: string;
    buffer?: Buffer;
    base64Data?: string;
  }): Promise<UploadResult> => {
    const { familyId, category, fileKey, contentType = 'image/jpeg', buffer, base64Data } = options;
    const s3Key = `families/${familyId}/${category}/${fileKey}`;

    let bodyBuffer: Buffer;
    if (buffer) {
      bodyBuffer = buffer;
    } else if (base64Data) {
      // Strip potential data URL prefix
      const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      bodyBuffer = Buffer.from(cleanBase64, 'base64');
    } else {
      bodyBuffer = Buffer.from('empty_file');
    }

    if (hasAwsCredentials()) {
      try {
        const client = getClient();
        await client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: bodyBuffer,
            ContentType: contentType,
            Metadata: {
              familyId,
              uploadedAt: new Date().toISOString(),
            },
          })
        );

        // Generate a 24-hour presigned URL for direct secure access
        const presignedUrl = await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          }),
          { expiresIn: 86400 }
        );

        logAwsOperation('s3', 'PutObject', { bucket: BUCKET_NAME, key: s3Key, bytes: bodyBuffer.length });
        return {
          s3Key,
          url: presignedUrl,
          bucket: BUCKET_NAME,
          isLiveS3: true,
        };
      } catch (err: any) {
        console.warn('⚠️ [S3 Live Upload Warning]: Falling back to local storage URL -', err?.message || err);
      }
    }

    // Simulation / local fallback
    logAwsOperation('s3', 'SimulatedUpload', { bucket: BUCKET_NAME, key: s3Key, bytes: bodyBuffer.length });
    return {
      s3Key,
      url: `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`,
      bucket: BUCKET_NAME,
      isLiveS3: false,
    };
  },

  /**
   * Generate a Presigned Download URL for a family vault document
   */
  getPresignedUrl: async (s3Key: string, expiresInSeconds: number = 3600): Promise<string> => {
    if (hasAwsCredentials()) {
      try {
        const client = getClient();
        return await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          }),
          { expiresIn: expiresInSeconds }
        );
      } catch (err: any) {
        console.warn('⚠️ [S3 Presign Warning]:', err?.message || err);
      }
    }

    return `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
  },
};
