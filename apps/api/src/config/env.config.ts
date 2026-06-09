import dotenv from 'dotenv';
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5002,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/bezon',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'bezon-cookie-secret',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'false' ? false : process.env.NODE_ENV === 'production',
  JWT_SECRET: process.env.JWT_SECRET || 'bezon-jwt-secret-key',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'bezon-assets',
  S3_REGION: process.env.S3_REGION || 'ap-south-1', // Default from s3.service.ts
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'default_secret_key_needs_32_bytes_',
};
