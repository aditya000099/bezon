import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Hash the raw key using SHA-256 to ensure it's always exactly 32 bytes long
const rawKey = process.env.ENCRYPTION_KEY || 'default_secret_key_needs_32_bytes_';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(rawKey).digest();
const ALGORITHM = 'aes-256-cbc';

export class CryptoUtil {
  /**
   * Encrypts a plain text string
   */
  static encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts an encrypted string
   */
  static decrypt(text: string): string {
    if (!text) return text;
    
    try {
      const textParts = text.split(':');
      if (textParts.length !== 2) return text; // Probably not encrypted with this util, return raw
      
      const iv = Buffer.from(textParts[0], 'hex');
      const encryptedText = Buffer.from(textParts[1], 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
      
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString();
    } catch (error) {
      console.error('Decryption error:', error);
      return ''; // Fallback or return raw text depending on strictness
    }
  }
}
