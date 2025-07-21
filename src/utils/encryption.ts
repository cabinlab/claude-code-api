import * as crypto from 'crypto';

export interface EncryptedData {
  data: string;  // base64 encoded encrypted data
  iv: string;    // base64 encoded initialization vector
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly saltLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly iterations = 100000;
  private readonly keyLength = 32;

  /**
   * Derive an encryption key from the admin password hash using PBKDF2
   */
  deriveKey(passwordHash: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(passwordHash, salt, this.iterations, this.keyLength, 'sha256');
  }

  /**
   * Generate a random salt
   */
  generateSalt(): Buffer {
    return crypto.randomBytes(this.saltLength);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext: string, passwordHash: string): EncryptedData {
    // Generate random salt and IV
    const salt = this.generateSalt();
    const iv = crypto.randomBytes(this.ivLength);
    
    // Derive key from password hash
    const key = this.deriveKey(passwordHash, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, tag, and encrypted data
    const combined = Buffer.concat([salt, tag, encrypted]);
    
    return {
      data: combined.toString('base64'),
      iv: iv.toString('base64')
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData, passwordHash: string): string {
    // Decode from base64
    const combined = Buffer.from(encryptedData.data, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, this.saltLength);
    const tag = combined.subarray(this.saltLength, this.saltLength + this.tagLength);
    const encrypted = combined.subarray(this.saltLength + this.tagLength);
    
    // Derive key from password hash
    const key = this.deriveKey(passwordHash, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Check if a value is encrypted
   */
  isEncryptedData(value: any): value is EncryptedData {
    return value && 
           typeof value === 'object' && 
           typeof value.data === 'string' && 
           typeof value.iv === 'string';
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();