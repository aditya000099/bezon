import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.S3_REGION || 'ap-south-1';
const bucketName = process.env.S3_BUCKET_NAME || 'bezon-assets';

const s3Client = new S3Client({
  region,
});

export class S3Service {
  /**
   * Uploads a raw buffer to AWS S3 and returns the public URL
   */
  static async uploadPdfBufferToS3(buffer: Buffer, filename: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `invoices/${filename}`,
        Body: buffer,
        ContentType: 'application/pdf',
        // Optional: Assuming bucket has public read or we return unsigned URLs
      });

      await s3Client.send(command);

      // Return public URL format
      return `https://${bucketName}.s3.${region}.amazonaws.com/invoices/${filename}`;
    } catch (error) {
      console.error('Error uploading PDF to S3:', error);
      throw new Error('Failed to upload invoice to storage.');
    }
  }
}
