import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

interface ClaudeCredentials {
  claudeAiOauth: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    scopes: string[];
    subscriptionType: string;
  };
}

interface ClaudeConfig {
  numStartups: number;
  installMethod: string;
  autoUpdates: boolean;
  firstStartTime: string;
  userID: string;
  projects: Record<string, any>;
  oauthAccount: {
    accountUuid: string;
    emailAddress: string;
    organizationUuid: string;
    organizationRole: string;
    workspaceRole: null | string;
    organizationName: string;
  };
  hasCompletedOnboarding: boolean;
  lastOnboardingVersion: string;
  subscriptionNoticeCount: number;
  hasAvailableSubscription: boolean;
}

export class ClaudeAuthService {
  private claudeDir: string;
  private credentialsPath: string;
  private configPath: string;

  constructor() {
    const homeDir = os.homedir();
    this.claudeDir = path.join(homeDir, '.claude');
    this.credentialsPath = path.join(this.claudeDir, '.credentials.json');
    this.configPath = path.join(homeDir, '.claude.json');
  }

  /**
   * Get the last 4 digits of the currently active OAuth token
   * Returns null if no token is active or file doesn't exist
   */
  async getActiveToken(): Promise<string | null> {
    try {
      const credentialsData = await fs.readFile(this.credentialsPath, 'utf-8');
      const credentials: ClaudeCredentials = JSON.parse(credentialsData);
      
      if (credentials.claudeAiOauth?.accessToken) {
        const token = credentials.claudeAiOauth.accessToken;
        return token.substring(token.length - 4);
      }
      
      return null;
    } catch (error) {
      // File doesn't exist or is invalid
      console.log('No active Claude OAuth token found');
      return null;
    }
  }

  /**
   * Activate an OAuth token by writing it to Claude's configuration files
   */
  async activateToken(oauthToken: string): Promise<void> {
    try {
      // Check if there's already an active token
      const currentActiveToken = await this.getActiveToken();
      if (currentActiveToken) {
        console.log('OAuth token already active, skipping activation');
        return;
      }
      
      // Only activate if no token is currently active
      // Ensure .claude directory exists
      await this.ensureClaudeDirectories();
      
      // Write credentials file
      await this.writeCredentials(oauthToken);
      
      // Ensure .claude.json exists with proper structure
      await this.ensureClaudeJson();
      
      console.log('OAuth token activated successfully');
    } catch (error) {
      console.error('Failed to activate OAuth token:', error);
      throw new Error('Failed to activate OAuth token in Claude configuration');
    }
  }

  /**
   * Ensure the .claude directory exists with proper permissions
   */
  private async ensureClaudeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.claudeDir, { recursive: true, mode: 0o700 });
    } catch (error) {
      console.error('Failed to create .claude directory:', error);
      throw error;
    }
  }

  /**
   * Write the credentials file with the OAuth token
   */
  private async writeCredentials(token: string): Promise<void> {
    const credentials: ClaudeCredentials = {
      claudeAiOauth: {
        accessToken: token,
        refreshToken: token,
        expiresAt: "2099-12-31T23:59:59.999Z",
        scopes: ["read", "write"],
        subscriptionType: "pro"
      }
    };

    try {
      await fs.writeFile(
        this.credentialsPath,
        JSON.stringify(credentials, null, 2),
        { mode: 0o600 }
      );
    } catch (error) {
      console.error('Failed to write credentials file:', error);
      throw error;
    }
  }

  /**
   * Ensure .claude.json exists and has proper structure
   * Only creates if it doesn't exist to preserve existing session data
   */
  private async ensureClaudeJson(): Promise<void> {
    try {
      // Check if file already exists
      await fs.access(this.configPath);
      console.log('.claude.json already exists, preserving existing data');
      return;
    } catch {
      // File doesn't exist, create it
      const userId = crypto.createHash('sha256')
        .update(`${process.env.USER || 'user'}${Date.now()}`)
        .digest('hex');

      const config: ClaudeConfig = {
        numStartups: 1,
        installMethod: "api",
        autoUpdates: true,
        firstStartTime: new Date().toISOString(),
        userID: userId,
        projects: {
          "/app": {
            allowedTools: [],
            history: [],
            mcpContextUris: [],
            mcpServers: {},
            enabledMcpjsonServers: [],
            disabledMcpjsonServers: [],
            hasTrustDialogAccepted: true,
            projectOnboardingSeenCount: 1,
            hasClaudeMdExternalIncludesApproved: false,
            hasClaudeMdExternalIncludesWarningShown: false
          }
        },
        oauthAccount: {
          accountUuid: "00000000-0000-0000-0000-000000000001",
          emailAddress: "api@claude-code.local",
          organizationUuid: "00000000-0000-0000-0000-000000000002",
          organizationRole: "admin",
          workspaceRole: null,
          organizationName: "Claude Code API"
        },
        hasCompletedOnboarding: true,
        lastOnboardingVersion: "1.0.53",
        subscriptionNoticeCount: 0,
        hasAvailableSubscription: true
      };

      try {
        await fs.writeFile(
          this.configPath,
          JSON.stringify(config, null, 2),
          { mode: 0o600 }
        );
        console.log('Created new .claude.json file');
      } catch (error) {
        console.error('Failed to write .claude.json:', error);
        throw error;
      }
    }
  }

  /**
   * Check if a token matches the active token (by comparing last 4 digits)
   */
  async isTokenActive(token: string): Promise<boolean> {
    const activeTokenSuffix = await this.getActiveToken();
    if (!activeTokenSuffix) return false;
    
    return token.endsWith(activeTokenSuffix);
  }
}

// Export singleton instance
export const claudeAuth = new ClaudeAuthService();