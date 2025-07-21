import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { encryptionService, EncryptedData } from '../utils/encryption';

interface ApiKeyData {
  oauthToken: string | EncryptedData;  // Plain text when active, encrypted when inactive
  oauthTokenDisplay: string;  // Obfuscated version for display (always plain)
  apiKey: string | EncryptedData;  // Plain text when active, encrypted when inactive
  apiKeyDisplay: string;  // Obfuscated version for display (always plain)
  keyName: string;
  isActive: boolean;  // Whether this key is currently active in Claude
  createdAt: string;
  lastUsed?: string;
}

export class KeyManager {
  private dataPath: string;
  private keys: Map<string, ApiKeyData>;
  private adminPasswordHash: string | null = null;

  constructor(dataDir: string = 'data') {
    this.dataPath = path.join(dataDir, 'keys.json');
    this.keys = new Map();
  }

  setAdminPasswordHash(hash: string): void {
    this.adminPasswordHash = hash;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      
      // Load existing keys
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Check if we need to migrate old format
      let needsMigration = false;
      for (const [apiKey, keyData] of Object.entries(parsed)) {
        if (!('apiKey' in (keyData as any))) {
          needsMigration = true;
          break;
        }
      }
      
      if (needsMigration) {
        console.log('Migrating keys to new format...');
        await this.migrateOldFormat(parsed);
      } else {
        this.keys = new Map(Object.entries(parsed));
      }
    } catch (error) {
      // File doesn't exist yet, start with empty map
      this.keys = new Map();
    }
    
    // Check for active token in Claude config and import if needed
    await this.importActiveTokenIfNeeded();
  }

  private async migrateOldFormat(oldData: Record<string, any>): Promise<void> {
    // Get the active token from Claude config
    const claudeAuth = require('./claudeAuth').claudeAuth;
    const activeTokenSuffix = await claudeAuth.getActiveToken();
    
    for (const [apiKey, data] of Object.entries(oldData)) {
      const isActive = activeTokenSuffix && data.oauthTokenDisplay.endsWith(activeTokenSuffix);
      
      // Create apiKeyDisplay
      const apiKeyDisplay = `${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`;
      
      // Store tokens - encrypt if not active
      let oauthToken = data.oauthToken;
      let storedApiKey: string | EncryptedData = apiKey;
      
      if (!isActive && this.adminPasswordHash) {
        oauthToken = encryptionService.encrypt(data.oauthToken, this.adminPasswordHash);
        storedApiKey = encryptionService.encrypt(apiKey, this.adminPasswordHash);
      }
      
      this.keys.set(apiKey, {
        oauthToken,
        oauthTokenDisplay: data.oauthTokenDisplay,
        apiKey: storedApiKey,
        apiKeyDisplay,
        keyName: data.keyName,
        isActive,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed
      });
    }
    
    // Save migrated data
    await this.save();
    console.log('Migration completed successfully');
  }

  /**
   * Generate OpenAI-compatible API key
   * Format: sk-[20 chars]T3BlbkFJ[20 chars]
   */
  generateApiKey(): string {
    const prefix = randomBytes(15).toString('base64url').substring(0, 20);
    const suffix = randomBytes(15).toString('base64url').substring(0, 20);
    return `sk-${prefix}T3BlbkFJ${suffix}`;
  }

  async createKey(oauthToken: string, keyName: string = 'default', makeActive: boolean = false): Promise<string> {
    const apiKey = this.generateApiKey();
    
    // Create obfuscated versions for display
    const oauthTokenDisplay = `${oauthToken.substring(0, 12)}...${oauthToken.substring(oauthToken.length - 4)}`;
    const apiKeyDisplay = `${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`;
    
    // If this will be active, deactivate any current active key
    if (makeActive) {
      await this.deactivateAllKeys();
    }
    
    // Store encrypted if not active
    let storedOauthToken: string | EncryptedData = oauthToken;
    let storedApiKey: string | EncryptedData = apiKey;
    
    if (!makeActive && this.adminPasswordHash) {
      storedOauthToken = encryptionService.encrypt(oauthToken, this.adminPasswordHash);
      storedApiKey = encryptionService.encrypt(apiKey, this.adminPasswordHash);
    }
    
    this.keys.set(apiKey, {
      oauthToken: storedOauthToken,
      oauthTokenDisplay,
      apiKey: storedApiKey,
      apiKeyDisplay,
      keyName,
      isActive: makeActive,
      createdAt: new Date().toISOString()
    });

    await this.save();
    return apiKey;
  }

  async validateKey(apiKey: string): Promise<{ oauthToken: string; keyName: string } | null> {
    const keyData = this.keys.get(apiKey);
    if (!keyData) {
      return null;
    }

    // If the key is encrypted and not active, we can't use it
    if (!keyData.isActive && encryptionService.isEncryptedData(keyData.oauthToken)) {
      return null;
    }

    // Don't update last used here - wait for successful API response

    return {
      oauthToken: keyData.oauthToken as string,  // We know it's a string if we got here
      keyName: keyData.keyName
    };
  }

  /**
   * Update last used timestamp for a key after successful API call
   */
  async updateLastUsed(apiKey: string): Promise<void> {
    const keyData = this.keys.get(apiKey);
    if (keyData) {
      keyData.lastUsed = new Date().toISOString();
      await this.save();
    }
  }

  async deleteKey(apiKey: string): Promise<boolean> {
    const deleted = this.keys.delete(apiKey);
    if (deleted) {
      await this.save();
    }
    return deleted;
  }

  async listKeys(): Promise<Array<{ apiKey: string; apiKeyDisplay: string; oauthTokenDisplay: string; keyName: string; isActive: boolean; createdAt: string; lastUsed?: string }>> {
    return Array.from(this.keys.entries()).map(([apiKey, data]) => ({
      apiKey,
      apiKeyDisplay: data.apiKeyDisplay || `${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`,  // Fallback for existing keys
      oauthTokenDisplay: data.oauthTokenDisplay || 'sk-ant-oat01-...****',  // Fallback for existing keys
      keyName: data.keyName,
      isActive: data.isActive || false,  // Default to false for existing keys
      createdAt: data.createdAt,
      lastUsed: data.lastUsed
    }));
  }

  /**
   * Deactivate all keys (encrypt them)
   */
  async deactivateAllKeys(): Promise<void> {
    if (!this.adminPasswordHash) {
      throw new Error('Admin password hash not set');
    }

    for (const [apiKey, data] of this.keys.entries()) {
      if (data.isActive) {
        // Encrypt the tokens
        if (typeof data.oauthToken === 'string') {
          data.oauthToken = encryptionService.encrypt(data.oauthToken, this.adminPasswordHash);
        }
        if (typeof data.apiKey === 'string') {
          data.apiKey = encryptionService.encrypt(data.apiKey, this.adminPasswordHash);
        }
        data.isActive = false;
      }
    }
  }

  /**
   * Activate a key by API key
   */
  async activateKey(apiKey: string): Promise<boolean> {
    if (!this.adminPasswordHash) {
      throw new Error('Admin password hash not set');
    }

    const keyData = this.keys.get(apiKey);
    if (!keyData) {
      return false;
    }

    // First deactivate all keys
    await this.deactivateAllKeys();

    // Decrypt this key's tokens
    if (encryptionService.isEncryptedData(keyData.oauthToken)) {
      keyData.oauthToken = encryptionService.decrypt(keyData.oauthToken, this.adminPasswordHash);
    }
    if (encryptionService.isEncryptedData(keyData.apiKey)) {
      keyData.apiKey = encryptionService.decrypt(keyData.apiKey, this.adminPasswordHash);
    }

    keyData.isActive = true;
    await this.save();
    return true;
  }

  /**
   * Get the active OAuth token (if any)
   */
  async getActiveOAuthToken(): Promise<string | null> {
    for (const [_, data] of this.keys.entries()) {
      if (data.isActive && typeof data.oauthToken === 'string') {
        return data.oauthToken;
      }
    }
    return null;
  }

  /**
   * Import active token from Claude config if it's not in our database
   * OR sync our active token to Claude config if it's missing there
   */
  private async importActiveTokenIfNeeded(): Promise<void> {
    const claudeAuth = require('./claudeAuth').claudeAuth;
    
    try {
      // First, check if we have an active token in our database
      const activeKeyInDb = Array.from(this.keys.values()).find(key => key.isActive);
      
      // Get the active token suffix from Claude config
      const activeTokenSuffix = await claudeAuth.getActiveToken();
      
      if (activeKeyInDb && !activeTokenSuffix) {
        // We have an active token in DB but not in Claude config - sync it
        if (typeof activeKeyInDb.oauthToken === 'string') {
          console.log('Syncing active token from database to Claude configuration...');
          await claudeAuth.activateToken(activeKeyInDb.oauthToken);
          console.log('Active token synced successfully');
        }
        return;
      }
      
      if (!activeTokenSuffix) {
        return; // No active token anywhere
      }
      
      // Check if this token is already in our database
      const tokenExists = Array.from(this.keys.values()).some(
        data => data.oauthTokenDisplay.endsWith(activeTokenSuffix)
      );
      
      if (!tokenExists) {
        // Need to get the full token from Claude's credentials
        const credentialsPath = path.join(require('os').homedir(), '.claude', '.credentials.json');
        try {
          const credentialsData = await fs.readFile(credentialsPath, 'utf-8');
          const credentials = JSON.parse(credentialsData);
          const fullToken = credentials.claudeAiOauth?.accessToken;
          
          if (fullToken && fullToken.endsWith(activeTokenSuffix)) {
            console.log('Importing active token from Claude configuration...');
            
            // Deactivate all existing keys before importing to prevent duplicates
            await this.deactivateAllKeys();
            
            // Generate API key and add to our database
            const apiKey = this.generateApiKey();
            const oauthTokenDisplay = `${fullToken.substring(0, 12)}...${fullToken.substring(fullToken.length - 4)}`;
            const apiKeyDisplay = `${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`;
            
            this.keys.set(apiKey, {
              oauthToken: fullToken, // Store in plaintext since it's active
              oauthTokenDisplay,
              apiKey: apiKey, // Store in plaintext since it's active  
              apiKeyDisplay,
              keyName: 'imported-active',
              isActive: true,
              createdAt: new Date().toISOString()
            });
            
            await this.save();
            console.log('Active token imported successfully');
          }
        } catch (error) {
          console.error('Failed to read Claude credentials:', error);
        }
      }
    } catch (error) {
      console.error('Error checking for active token:', error);
    }
  }

  private async save(): Promise<void> {
    const data = Object.fromEntries(this.keys.entries());
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
  }
}