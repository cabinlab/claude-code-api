# Claude Code API

An OpenAI-compatible API gateway for Claude Code with simple auth and web-based key management & revocation

![Create API Key](docs/images/key-generation.png)
*Create API Key Interface*
## Features

- 🔄 **OpenAI-Compatible**: Drop-in replacement for OpenAI API clients
- 🔐 **Secure Token Exchange**: Convert Claude OAuth tokens to API keys via HTTPS interface
- 🎯 **Simple Management**: Web UI for creating and managing API keys
- 🚀 **Streaming Support**: Real-time responses via Server-Sent Events
- 📦 **Minimal Size**: Adds <10MB to base container

![API Key Management](docs/images/key-management.png)
*API Key Management Dashboard*

## Quick Start

### Using Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/cabinlab/claude-code-api
   cd claude-code-api
   ```

2. Generate self-signed certificates:
   ```bash
   npm run generate-certs
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env and set your ADMIN_PASSWORD
   ```

4. Start the service:
   ```bash
   docker-compose up -d
   ```

5. Generate an API key:
   - Visit https://localhost:8443
   - Enter admin password
   - Paste your Claude OAuth token (get from https://claude.ai/settings/oauth)
   - Copy the generated API key

### Local Development

```bash
# Install dependencies
npm install

# Generate certificates
npm run generate-certs

# Set environment variables
export ADMIN_PASSWORD=your-admin-password
export CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...

# Run development server
npm run dev
```

## Usage

### With OpenAI Python Client

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-generated-api-key-here",  # Your generated API key
    base_url="http://localhost:8000/v1"
)

response = client.chat.completions.create(
    model="sonnet",  # or "opus", "haiku", "gpt-4", "gpt-3.5-turbo"
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    stream=True  # Optional: Enable streaming
)

for chunk in response:
    print(chunk.choices[0].delta.content, end="")
```

### With curl

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer your-generated-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonnet",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Password for admin interface | `changeme` |
| `CLAUDE_CODE_OAUTH_TOKEN` | Your Claude OAuth token | Required |
| `PORT` | HTTP API port | `8000` |
| `HTTPS_PORT` | HTTPS admin port | `8443` |
| `NODE_ENV` | Environment mode | `production` |

### Model Mappings

The API supports both OpenAI and Claude model names:

| OpenAI Model | Claude Model |
|--------------|--------------|
| `gpt-4` | `opus` |
| `gpt-4-turbo` | `sonnet` |
| `gpt-3.5-turbo` | `claude-3-5-haiku-20241022` |

You can also use Claude model names directly: `opus`, `sonnet`, `haiku`.

## API Endpoints

### OpenAI-Compatible Endpoints

- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Create chat completion
- `GET /v1/health` - Health check

### Admin Endpoints (HTTPS only)

- `GET /` - OAuth token exchange interface
- `GET /admin` - API key management
- `POST /auth/exchange` - Exchange OAuth token for API key
- `DELETE /admin/keys/:apiKey` - Delete API key

## Security

- OAuth tokens are never exposed to API clients
- Admin interface requires HTTPS
- API keys use OpenAI-compatible format for better client support
- All key mappings are stored locally (no external database)

## Production Deployment

### Using Cloudflare Tunnel

For production HTTPS without managing certificates:

1. Create a Cloudflare Tunnel
2. Add to docker-compose.yml:
   ```yaml
   cloudflared:
     image: cloudflare/cloudflared:latest
     command: tunnel --no-autoupdate run
     environment:
       - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
   ```

### Using a Reverse Proxy

Configure nginx/Caddy to handle SSL termination and proxy to the API.

## Development

### Project Structure

```
src/
├── server.ts           # Main Express server
├── routes/
│   ├── auth.ts        # OAuth token exchange
│   ├── admin.ts       # Key management UI
│   └── api.ts         # OpenAI-compatible API
├── services/
│   ├── claude.ts      # Claude SDK integration
│   └── keyManager.ts  # API key management
└── middleware/
    └── security.ts    # Auth & HTTPS middleware
```

### Adding Features

1. **New Models**: Update the model mapping in `claude.ts`
2. **Rate Limiting**: Modify `security.ts` middleware
3. **Custom Endpoints**: Add routes in `api.ts`

## Troubleshooting

### "Invalid OAuth token"
- Ensure your token starts with `sk-ant-oat01-`
- Check token hasn't expired
- Verify `CLAUDE_CODE_OAUTH_TOKEN` is set correctly

### "Connection refused" on HTTPS
- Run `npm run generate-certs` to create certificates
- Check port 8443 is not in use
- Ensure Docker has the certs volume mounted

### Streaming not working
- Check your client supports SSE
- Ensure no proxy is buffering responses
- Add `X-Accel-Buffering: no` header for nginx

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.