import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

interface ApiKeyData {
  oauthToken: string;
  oauthTokenDisplay: string;  // Obfuscated version for display
  keyName: string;
  createdAt: string;
  lastUsed?: string;
}

export class KeyManager {
  private dataPath: string;
  private keys: Map<string, ApiKeyData>;

  constructor(dataDir: string = 'data') {
    this.dataPath = path.join(dataDir, 'keys.json');
    this.keys = new Map();
  }

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      
      // Load existing keys
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.keys = new Map(Object.entries(parsed));
    } catch (error) {
      // File doesn't exist yet, start with empty map
      this.keys = new Map();
    }
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

  async createKey(oauthToken: string, keyName: string = 'default'): Promise<string> {
    const apiKey = this.generateApiKey();
    
    // Create obfuscated version of OAuth token for display
    const oauthTokenDisplay = `${oauthToken.substring(0, 12)}...${oauthToken.substring(oauthToken.length - 4)}`;
    
    this.keys.set(apiKey, {
      oauthToken,
      oauthTokenDisplay,
      keyName,
      createdAt: new Date().toISOString()
    });

    await this.save();
    return apiKey;
  }

  async validateKey(apiKey: string): Promise<ApiKeyData | null> {
    const keyData = this.keys.get(apiKey);
    if (!keyData) {
      return null;
    }

    // Update last used
    keyData.lastUsed = new Date().toISOString();
    await this.save();

    return keyData;
  }

  async deleteKey(apiKey: string): Promise<boolean> {
    const deleted = this.keys.delete(apiKey);
    if (deleted) {
      await this.save();
    }
    return deleted;
  }

  async listKeys(): Promise<Array<{ apiKey: string; oauthTokenDisplay: string; keyName: string; createdAt: string; lastUsed?: string }>> {
    return Array.from(this.keys.entries()).map(([apiKey, data]) => ({
      apiKey,
      oauthTokenDisplay: data.oauthTokenDisplay || 'sk-ant-oat01-...****',  // Fallback for existing keys
      keyName: data.keyName,
      createdAt: data.createdAt,
      lastUsed: data.lastUsed
    }));
  }

  private async save(): Promise<void> {
    const data = Object.fromEntries(this.keys.entries());
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
  }
}