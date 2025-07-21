# Claude Code API Architecture

## Overview

Claude Code API provides an OpenAI-compatible REST API that wraps the Claude Code SDK, enabling seamless integration with existing OpenAI client libraries while leveraging Claude's capabilities. The implementation uses Express.js/TypeScript with direct SDK integration.

## Architecture Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  OpenAI Client  │─────▶│ Express Server  │─────▶│ Claude Code SDK │
│   (Any Lang)    │ HTTP │  (TypeScript)   │ SDK  │   (TypeScript)  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                            │
                                                            │ HTTPS
                                                            ▼
                                                   ┌─────────────────┐
                                                   │                 │
                                                   │ Anthropic API   │
                                                   │                 │
                                                   └─────────────────┘
```

## Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Web Interface (HTTPS)                    │
├────────────────────────────────────────────────────────────────┤
│  Login Page  │  Token Exchange  │  Admin Dashboard  │  Logout   │
└──────┬───────┴─────────┬────────┴──────────┬───────┴─────┬─────┘
       │                 │                   │             │
       ▼                 ▼                   ▼             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Express.js Application                       │
├─────────────────┬──────────────────┬──────────────────────────┤
│   Auth Routes   │   Admin Routes    │     API Routes           │
│  - POST /login  │  - GET /admin     │  - GET /v1/models       │
│  - GET /exchange│  - DELETE /keys   │  - POST /v1/chat/...    │
└────────┬────────┴─────────┬────────┴─────────┬────────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌────────────────────────────────────────────────────────────────┐
│                        Services Layer                           │
├─────────────────┬──────────────────┬──────────────────────────┤
│  SecurityMiddleware │  KeyManager    │    ClaudeService        │
│  - Session mgmt    │  - Key storage │  - SDK integration      │
│  - Rate limiting   │  - Validation  │  - Message transform    │
└────────────────────┴────────┬───────┴──────────┬───────────────┘
                              │                  │
                              ▼                  ▼
                     ┌─────────────────┐ ┌─────────────────┐
                     │  data/keys.json │ │ Claude Code SDK │
                     └─────────────────┘ └─────────────────┘
```

## Request/Response Flow

### Non-Streaming Request
```
1. Client → POST /v1/chat/completions
   Authorization: Bearer sk-xxxx (generated API key)
   {
     "model": "gpt-4",
     "messages": [{"role": "user", "content": "Hello"}]
   }

2. Express → Validate API key
   - Extract Bearer token from Authorization header
   - Lookup OAuth token in KeyManager
   - Update last used timestamp

3. Express → Transform to Claude format
   - Convert OpenAI message format to Claude prompt
   - Map model names (gpt-4 → opus)

4. Express → Call Claude SDK
   const messages = await query({
     prompt: formattedPrompt,
     options: { model: claudeModel }
   })

5. SDK → Direct API call to Anthropic

6. Express → Transform response
   {
     "id": "chatcmpl-...",
     "object": "chat.completion",
     "choices": [{
       "message": {"role": "assistant", "content": "..."},
       "finish_reason": "stop"
     }]
   }
```

### Streaming Request
```
1. Client → POST /v1/chat/completions
   {
     "model": "gpt-4",
     "messages": [...],
     "stream": true
   }

2-4. Same validation and transformation

5. Express → Stream SSE chunks
   data: {"choices": [{"delta": {"content": "Hello"}}]}
   data: {"choices": [{"delta": {"content": " there"}}]}
   data: [DONE]
```

## Key Components

### 1. Express Server (`server.ts`)
- HTTPS server for admin interface (port 8443)
- HTTP server for API endpoints (port 8000)
- Static asset serving for web UI
- Cookie parser for session management

### 2. Routes

#### Auth Routes (`routes/auth.ts`)
- `/auth` - Login page
- `/auth/login` - Handle admin authentication
- `/auth/exchange` - OAuth token exchange interface
- `/auth/logout` - Clear session

#### Admin Routes (`routes/admin.ts`)
- `/admin` - Dashboard for key management
- `/admin/keys/:apiKey` - Delete specific key

#### API Routes (`routes/api.ts`)
- `/v1/models` - List available models
- `/v1/chat/completions` - Create chat completion
- `/v1/health` - Health check

### 3. Services

#### ClaudeService (`services/claude.ts`)
```typescript
class ClaudeService {
  // Convert OpenAI messages to Claude format
  formatMessages(messages: OpenAIMessage[]): string
  
  // Handle non-streaming completions
  completions(request: ChatCompletionRequest, oauthToken: string)
  
  // Handle streaming completions
  *streamCompletions(request: ChatCompletionRequest, oauthToken: string)
}
```

#### KeyManager (`services/keyManager.ts`)
```typescript
class KeyManager {
  // Generate OpenAI-compatible API key
  createKey(oauthToken: string, keyName: string): Promise<string>
  
  // Validate and retrieve OAuth token
  getOAuthToken(apiKey: string): Promise<string | null>
  
  // List all keys (for admin UI)
  listKeys(): Promise<KeyData[]>
  
  // Delete a key
  deleteKey(apiKey: string): Promise<boolean>
}
```

#### SecurityMiddleware (`middleware/security.ts`)
```typescript
class SecurityMiddleware {
  // Require HTTPS for sensitive endpoints
  requireHttps(req, res, next)
  
  // Validate session cookies
  validateSession(req, res, next)
  
  // Validate API keys
  validateApiKey(req, res, next)
  
  // Rate limiting
  rateLimit(requests: number, windowMs: number)
}
```

### 4. Data Storage

#### Key Storage Format (`data/keys.json`)
```json
{
  "sk-xxxx": {
    "oauthToken": "sk-ant-oat01-...",
    "keyName": "my-app",
    "createdAt": "2024-01-20T10:00:00Z",
    "lastUsed": "2024-01-20T11:00:00Z"
  }
}
```

## Authentication Flow

### Admin Authentication
1. User visits `/auth` (HTTPS required)
2. Submits admin password
3. Server validates password hash
4. Creates session token and hash
5. Sets HTTP-only secure cookies
6. Redirects to dashboard or token exchange

### API Key Generation
1. Admin visits `/auth/exchange`
2. Submits Claude OAuth token
3. Server generates unique API key
4. Stores mapping in `data/keys.json`
5. Activates token in Claude configuration
6. Returns API key to user

### API Authentication
1. Client sends request with `Authorization: Bearer sk-xxxx`
2. Middleware extracts and validates API key
3. Retrieves associated OAuth token
4. Sets token in environment for SDK
5. Processes request

## Security Architecture

### HTTPS/TLS
- Self-signed certificates for development
- Admin interface requires HTTPS
- Supports Cloudflare Tunnel for production

### Session Security
- HTTP-only cookies prevent XSS
- Secure flag ensures HTTPS-only transmission
- SameSite=strict prevents CSRF
- 24-hour session timeout

### API Key Security
- OpenAI-compatible format for client compatibility
- Cryptographically random generation
- OAuth tokens never exposed via API
- Key names help identify usage

### Rate Limiting
- Per-IP rate limiting on API endpoints
- Configurable limits (default: 100/minute)
- Memory-based storage (resets on restart)

## Deployment Architecture

### Docker Container
```dockerfile
FROM ghcr.io/cabinlab/claude-code-sdk-docker:typescript
# Includes: Node.js, Claude CLI, TypeScript, SDK
```

### Volume Mounts
- `./data:/app/data` - Persist API keys
- `./certs:/app/certs` - SSL certificates

### Environment Variables
- `ADMIN_PASSWORD` - Admin authentication
- `CLAUDE_CODE_OAUTH_TOKEN` - Default token
- `PORT` / `HTTPS_PORT` - Service ports
- `NODE_ENV` - Runtime environment

## Performance Considerations

1. **Stateless Design**: No server-side session storage
2. **Direct SDK Integration**: No subprocess overhead
3. **Streaming Support**: Efficient memory usage for long responses
4. **Rate Limiting**: Prevents abuse and ensures fair usage
5. **JSON File Storage**: Simple, fast key lookups

## Error Handling

All errors follow OpenAI's error format:
```json
{
  "error": {
    "message": "Human-readable error message",
    "type": "error_category",
    "code": "specific_error_code"
  }
}
```

Error types:
- `authentication_error` - Invalid API key or session
- `invalid_request_error` - Malformed request
- `rate_limit_error` - Too many requests
- `api_error` - Internal server error