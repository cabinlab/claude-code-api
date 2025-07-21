import { Request, Response, NextFunction } from 'express';
import { KeyManager } from '../services/keyManager';
import * as crypto from 'crypto';

// Extend Express Request to include our auth data
declare global {
  namespace Express {
    interface Request {
      apiKeyData?: {
        oauthToken: string;
        keyName: string;
        apiKey: string;
      };
    }
  }
}

export class SecurityMiddleware {
  constructor(
    private keyManager: KeyManager,
    private adminPasswordHash: string
  ) {}

  /**
   * Force HTTPS for sensitive routes
   */
  requireHttps = (req: Request, res: Response, next: NextFunction) => {
    // Allow HTTP in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    // Check if request is secure
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }

    // Redirect to HTTPS
    res.redirect(`https://${req.headers.host}${req.url}`);
  };

  /**
   * Validate admin password
   */
  validateAdminPassword = (password: string): boolean => {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash === this.adminPasswordHash;
  };

  /**
   * Generate session token
   */
  generateSessionToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
  };

  /**
   * Validate session cookie
   */
  validateSession = (req: Request, res: Response, next: NextFunction) => {
    const sessionToken = req.cookies?.sessionToken;
    const sessionHash = req.cookies?.sessionHash;
    
    if (!sessionToken || !sessionHash) {
      return res.redirect('/auth');
    }

    // Verify session integrity
    const expectedHash = crypto.createHash('sha256')
      .update(sessionToken + this.adminPasswordHash)
      .digest('hex');
    
    if (sessionHash !== expectedHash) {
      res.clearCookie('sessionToken');
      res.clearCookie('sessionHash');
      return res.redirect('/auth');
    }

    next();
  };

  /**
   * Validate API key from Authorization header
   */
  validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Invalid authorization header. Expected: Bearer <api_key>',
          type: 'invalid_request_error',
          code: 'invalid_auth_header'
        }
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    
    try {
      const keyData = await this.keyManager.validateKey(apiKey);
      
      if (!keyData) {
        return res.status(401).json({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error',
            code: 'invalid_api_key'
          }
        });
      }

      // Attach key data to request for use in routes
      req.apiKeyData = {
        oauthToken: keyData.oauthToken,
        keyName: keyData.keyName,
        apiKey: apiKey  // Store the API key for later use
      };

      next();
    } catch (error) {
      console.error('Error validating API key:', error);
      res.status(500).json({
        error: {
          message: 'Internal server error',
          type: 'api_error',
          code: 'internal_error'
        }
      });
    }
  };

  /**
   * Rate limiting per API key (simple in-memory implementation)
   */
  private rateLimits = new Map<string, { count: number; resetAt: number }>();

  rateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers.authorization?.substring(7) || 'anonymous';
      const now = Date.now();
      
      let limit = this.rateLimits.get(apiKey);
      
      if (!limit || limit.resetAt < now) {
        limit = { count: 0, resetAt: now + windowMs };
        this.rateLimits.set(apiKey, limit);
      }
      
      limit.count++;
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - limit.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(limit.resetAt / 1000).toString());
      
      if (limit.count > maxRequests) {
        return res.status(429).json({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
            code: 'rate_limit_exceeded'
          }
        });
      }
      
      next();
    };
  };
}