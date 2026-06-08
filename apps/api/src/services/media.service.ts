import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/env.config.js';

const S3_BUCKET_NAME = config.S3_BUCKET_NAME;
const S3_REGION = config.S3_REGION;
const AWS_ACCESS_KEY_ID = config.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = config.AWS_SECRET_ACCESS_KEY;

const isS3Configured = !!(S3_BUCKET_NAME && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);

let s3Client: S3Client | null = null;
if (isS3Configured) {
  s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
  });
} else {
  console.log('⚠️  AWS S3 is not fully configured. Media uploads will run in Sandbox Mock mode.');
}

export class MediaService {
  /**
   * Uploads an image to S3 (or mocks upload in sandbox mode)
   */
  static async uploadImage(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }) {
    const fileExtension = file.originalname.split('.').pop() || '';
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    const s3Key = `uploads/${Date.now()}_${cleanFileName}.${fileExtension}`;

    let imageUrl = '';

    if (isS3Configured && s3Client) {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME!,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);
      imageUrl = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
    } else {
      console.log(`[Media Sandbox] Simulating S3 upload for ${file.originalname} (size: ${file.size}B)`);
      imageUrl = `https://s3.${S3_REGION}.amazonaws.com/bezon-mock-sandbox/${s3Key}`;
    }

    return {
      url: imageUrl,
      s3Key,
    };
  }
}
