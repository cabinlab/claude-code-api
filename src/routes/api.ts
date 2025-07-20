import { Router, Request, Response } from 'express';
import { ClaudeService, ChatCompletionRequest } from '../services/claude';
import { SecurityMiddleware } from '../middleware/security';

export function createApiRouter(
  claudeService: ClaudeService, 
  security: SecurityMiddleware
): Router {
  const router = Router();

  // Apply rate limiting to all API routes
  router.use(security.rateLimit(100, 60000)); // 100 requests per minute

  // List available models
  router.get('/models', security.validateApiKey, (req: Request, res: Response) => {
    res.json({
      object: 'list',
      data: [
        {
          id: 'gpt-4',
          object: 'model',
          created: 1687882411,
          owned_by: 'openai',
          permission: [],
          root: 'gpt-4',
          parent: null
        },
        {
          id: 'gpt-3.5-turbo',
          object: 'model',
          created: 1677610602,
          owned_by: 'openai',
          permission: [],
          root: 'gpt-3.5-turbo',
          parent: null
        },
        {
          id: 'sonnet',
          object: 'model',
          created: 1677610602,
          owned_by: 'anthropic',
          permission: [],
          root: 'claude-3-sonnet',
          parent: null
        },
        {
          id: 'opus',
          object: 'model',
          created: 1677610602,
          owned_by: 'anthropic',
          permission: [],
          root: 'claude-3-opus',
          parent: null
        },
        {
          id: 'haiku',
          object: 'model',
          created: 1677610602,
          owned_by: 'anthropic',
          permission: [],
          root: 'claude-3-haiku',
          parent: null
        }
      ]
    });
  });

  // Chat completions endpoint
  router.post('/chat/completions', security.validateApiKey, async (req: Request, res: Response) => {
    try {
      const request = req.body as ChatCompletionRequest;
      
      // Validate request
      if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
        return res.status(400).json({
          error: {
            message: 'Messages array is required and must not be empty',
            type: 'invalid_request_error',
            code: 'invalid_messages'
          }
        });
      }

      const oauthToken = req.apiKeyData!.oauthToken;

      if (request.stream) {
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        try {
          // Stream completions
          for await (const chunk of claudeService.streamCompletions(request, oauthToken)) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          
          // Send done signal
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (error) {
          // Send error in SSE format
          const errorChunk = {
            error: {
              message: error instanceof Error ? error.message : 'Stream processing failed',
              type: 'api_error',
              code: 'stream_error'
            }
          };
          res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
          res.end();
        }
      } else {
        // Non-streaming response
        const completion = await claudeService.completions(request, oauthToken);
        res.json(completion);
      }
    } catch (error) {
      console.error('Chat completion error:', error);
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          return res.status(429).json({
            error: {
              message: 'Rate limit exceeded. Please try again later.',
              type: 'rate_limit_error',
              code: 'rate_limit_exceeded'
            }
          });
        }
        
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          return res.status(401).json({
            error: {
              message: 'Authentication failed. OAuth token may be invalid or expired.',
              type: 'authentication_error',
              code: 'invalid_oauth_token'
            }
          });
        }
      }
      
      // Generic error
      res.status(500).json({
        error: {
          message: 'An error occurred processing your request',
          type: 'api_error',
          code: 'internal_error'
        }
      });
    }
  });

  // Health check endpoint (no auth required)
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}