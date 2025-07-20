# Testing Claude Code API with OpenWebUI

This guide explains how to test the Claude Code API using OpenWebUI as a frontend interface.

## Overview

The test stack includes:
- **Claude Code API**: Your OpenAI-compatible API gateway for Claude
- **OpenWebUI**: A web interface for testing chat completions

## Prerequisites

- Docker and Docker Compose installed
- A Claude OAuth token (get from https://claude.ai/settings/oauth or run `claude get-token`)
- The Claude Code API project set up

## Quick Start

1. **Copy the test environment file**:
   ```bash
   cp .env.test.example .env.test
   ```

2. **Edit `.env.test`** and add:
   - Your Claude OAuth token (`CLAUDE_CODE_OAUTH_TOKEN`)
   - A secure admin password (`ADMIN_PASSWORD`)

3. **Start the test stack**:
   ```bash
   docker compose -f compose-test-openwebui.yaml --env-file .env.test up -d
   ```

4. **Generate an API key**:
   - Visit https://localhost:8543/auth/exchange
   - Login with your admin password
   - Paste your Claude OAuth token
   - Generate an API key
   - Copy the generated API key

5. **Update `.env.test`** with your API key:
   ```env
   TEST_API_KEY=sk-YOUR-GENERATED-API-KEY
   ```

6. **Restart the stack** to apply the API key:
   ```bash
   docker compose -f compose-test-openwebui.yaml --env-file .env.test restart
   ```

7. **Access OpenWebUI**:
   - Open http://localhost:8090
   - Create an account (first user becomes admin)
   - Start chatting with Claude through your API!

## Port Configuration

Default ports (customizable in `.env.test`):
- `8100`: Claude Code API (HTTP)
- `8543`: Claude Code API (HTTPS) - for admin/auth
- `8090`: OpenWebUI

## Viewing Logs

```bash
# All services
docker compose -f compose-test-openwebui.yaml logs -f

# Just Claude Code API
docker compose -f compose-test-openwebui.yaml logs -f claude-api

# Just OpenWebUI
docker compose -f compose-test-openwebui.yaml logs -f open-webui
```

## Stopping the Test Stack

```bash
docker compose -f compose-test-openwebui.yaml down

# To also remove volumes (data will be lost)
docker compose -f compose-test-openwebui.yaml down -v
```

## Troubleshooting

### OpenWebUI can't connect to the API
- Check that the Claude Code API is healthy: `docker compose -f compose-test-openwebui.yaml ps`
- Verify the API key is correct in `.env.test`
- Check logs for errors: `docker compose -f compose-test-openwebui.yaml logs claude-api`

### SSL Certificate Warnings
- The test stack uses self-signed certificates
- Accept the certificate warning when accessing https://localhost:8543

### Model Selection in OpenWebUI
When OpenWebUI starts, it queries the `/v1/models` endpoint to discover available models. The Claude Code API returns a list of model names that OpenWebUI will display in its model selector.

The API handles model selection by:
1. Accepting any model name from the OpenAI-compatible request
2. Mapping it to a Claude model (defaulting to "sonnet" if unrecognized)
3. Passing it to the Claude Code CLI which determines the actual model to use

Note: The specific Claude model used depends on your Claude account's access and the Claude Code CLI's current model availability.

## Development Tips

1. **Hot Reload**: Uncomment the source mount in the compose file:
   ```yaml
   volumes:
     - ./src:/app/src:ro
   ```

2. **Custom Certificates**: Place your certificates in `./certs` and uncomment:
   ```yaml
   volumes:
     - ./certs:/app/certs
   ```

3. **Persistent Data**: API keys and Claude auth are stored in Docker volumes

## Security Notes

- The test stack is for development only
- Use strong passwords and keys in production
- Don't commit `.env.test` with real credentials
- The self-signed certificates are not suitable for production