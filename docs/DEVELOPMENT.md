# Development Guide

This guide covers setting up and developing Claude Code API locally.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized development)
- OpenSSL (for certificate generation)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/cabinlab/claude-code-api.git
cd claude-code-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate SSL Certificates

The admin interface requires HTTPS. Generate self-signed certificates:

```bash
npm run generate-certs
```

This creates:
- `certs/cert.pem` - SSL certificate
- `certs/key.pem` - Private key

### 4. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `ADMIN_PASSWORD` - Strong password for admin access
- `CLAUDE_CODE_OAUTH_TOKEN` - Your Claude OAuth token (optional if using web UI)

### 5. Start Development Server

```bash
npm run dev
```

This starts:
- HTTP API server on http://localhost:8000
- HTTPS admin interface on https://localhost:8443

The dev server uses `tsx watch` for automatic reloading on file changes.

## Docker Development

### Build and Run

```bash
# Build the image
docker build -t claude-code-api .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Development with Docker

For hot reloading in Docker, uncomment the source mount in `compose.yaml`:

```yaml
volumes:
  - ./src:/app/src:ro  # Uncomment for development
```

## Project Structure

```
claude-code-api/
├── src/
│   ├── server.ts           # Main Express application
│   ├── routes/            # Route handlers
│   │   ├── api.ts         # OpenAI-compatible endpoints
│   │   ├── auth.ts        # Authentication routes
│   │   └── admin.ts       # Admin dashboard routes
│   ├── services/          # Business logic
│   │   ├── claude.ts      # Claude SDK integration
│   │   ├── keyManager.ts  # API key management
│   │   └── claudeAuth.ts  # OAuth token management
│   ├── middleware/        # Express middleware
│   │   └── security.ts    # Auth, HTTPS, rate limiting
│   └── assets/            # Static assets (images, icons)
├── scripts/               # Utility scripts
├── certs/                 # SSL certificates (generated)
├── data/                  # Persistent storage
├── docs/                  # Documentation
└── tests/                 # Test files (if any)
```

## Development Workflow

### Adding a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow TypeScript conventions
   - Maintain OpenAI API compatibility
   - Update relevant documentation

3. **Test locally**
   ```bash
   # Type check
   npx tsc --noEmit
   
   # Run dev server
   npm run dev
   
   # Test API endpoints
   curl http://localhost:8000/v1/health
   ```

4. **Test with Docker**
   ```bash
   docker build -t claude-code-api:test .
   docker run -p 8000:8000 -p 8443:8443 claude-code-api:test
   ```

### Common Development Tasks

#### Adding a New Model

Edit `src/services/claude.ts`:

```typescript
const modelMap: Record<string, string> = {
  'gpt-4': 'opus',
  'gpt-4-turbo': 'sonnet',
  'gpt-3.5-turbo': 'claude-3-5-haiku-20241022',
  'your-model': 'claude-model-name',  // Add here
};
```

#### Adding a New API Endpoint

1. Add route in `src/routes/api.ts`:
   ```typescript
   router.get('/v1/your-endpoint', security.validateApiKey, async (req, res) => {
     // Implementation
   });
   ```

2. Update API documentation in `API.md`

#### Modifying Rate Limits

Edit `src/routes/api.ts`:

```typescript
// Change from 100 requests per minute to 200
router.use(security.rateLimit(200, 60000));
```

#### Adding Custom Middleware

Create in `src/middleware/`:

```typescript
export function customMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Your logic
    next();
  };
}
```

## TypeScript Development

### Type Checking

Run type checking without building:

```bash
npx tsc --noEmit
```

### Adding Types

Define interfaces in the relevant service files:

```typescript
// In src/services/claude.ts
export interface CustomRequest {
  field: string;
  // ...
}
```

### Strict Mode

The project uses TypeScript strict mode. Ensure:
- All variables have explicit types
- No implicit `any` types
- Null checks are properly handled

## Debugging

### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "src/server.ts"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Debug Logging

Use console logging with appropriate context:

```typescript
console.log('[ClaudeService] Processing request:', request.model);
console.error('[KeyManager] Error loading keys:', error);
```

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :8000
lsof -i :8443

# Kill process
kill -9 <PID>
```

#### Certificate Issues

```bash
# Regenerate certificates
rm -rf certs/
npm run generate-certs
```

#### TypeScript Errors

```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

## Testing

### Manual Testing

#### Test API Key Generation

1. Login to admin interface: https://localhost:8443/auth
2. Generate OAuth token: `claude get-token`
3. Exchange token for API key
4. Test the API key:

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

#### Test Streaming

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="http://localhost:8000/v1"
)

stream = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Count to 5"}],
    stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")
```

### Health Checks

```bash
# API health
curl http://localhost:8000/v1/health

# Docker health
docker ps
docker logs claude-code-api
```

## Performance Optimization

### Memory Usage

- Streaming responses use generators to minimize memory
- Rate limiting uses in-memory storage (resets on restart)
- Consider external rate limiting for production

### Response Times

- Direct SDK integration eliminates subprocess overhead
- Async/await patterns for non-blocking operations
- Connection pooling handled by the SDK

## Security Considerations

### Development vs Production

**Development:**
- Self-signed certificates acceptable
- Simple admin password
- Console logging enabled

**Production:**
- Use proper SSL certificates
- Strong admin password
- Structured logging
- Environment-specific configs

### Sensitive Data

Never commit:
- `.env` files
- `data/keys.json`
- SSL certificates
- OAuth tokens

## Troubleshooting

### SDK Import Errors

```bash
# Ensure @anthropic-ai/claude-code is installed
npm list @anthropic-ai/claude-code

# Reinstall if needed
npm install @anthropic-ai/claude-code
```

### OAuth Token Issues

1. Verify token format: `sk-ant-oat01-...`
2. Check token in Claude settings: https://claude.ai/settings/oauth
3. Try generating a new token: `claude get-token`

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist/
npx tsc --build --clean
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Code style
- Commit messages
- Pull request process
- Testing requirements