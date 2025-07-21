# Claude Code API Reference

This document provides a complete reference for all API endpoints in Claude Code API.

## Base URLs

- **API Endpoint**: `http://localhost:8000`
- **Admin Interface**: `https://localhost:8443`

## Authentication

### API Authentication
All API endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx
```

### Admin Authentication
Admin endpoints require session-based authentication via HTTPS.

## OpenAI-Compatible Endpoints

### List Models

Lists the available models that can be used with the API.

**Endpoint:** `GET /v1/models`

**Headers:**
- `Authorization: Bearer <api_key>` (required)

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1687882411,
      "owned_by": "openai",
      "permission": [],
      "root": "gpt-4",
      "parent": null
    },
    {
      "id": "gpt-3.5-turbo",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai",
      "permission": [],
      "root": "gpt-3.5-turbo",
      "parent": null
    },
    {
      "id": "sonnet",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic",
      "permission": [],
      "root": "claude-3-sonnet",
      "parent": null
    },
    {
      "id": "opus",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic",
      "permission": [],
      "root": "claude-3-opus",
      "parent": null
    },
    {
      "id": "haiku",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic",
      "permission": [],
      "root": "claude-3-haiku",
      "parent": null
    }
  ]
}
```

### Create Chat Completion

Creates a completion for the provided messages.

**Endpoint:** `POST /v1/chat/completions`

**Headers:**
- `Authorization: Bearer <api_key>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Parameters:**
- `model` (string, required): Model to use. Options: `gpt-4`, `gpt-3.5-turbo`, `opus`, `sonnet`, `haiku`
- `messages` (array, required): Array of message objects with `role` and `content`
- `stream` (boolean, optional): Whether to stream the response. Default: `false`
- `temperature` (number, optional): Sampling temperature. Currently ignored by Claude SDK
- `max_tokens` (number, optional): Maximum tokens to generate. Currently ignored by Claude SDK

**Response (Non-streaming):**
```json
{
  "id": "chatcmpl-1234567890-abc123def",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

**Response (Streaming):**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" there!"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Health Check

Simple health check endpoint to verify the API is running.

**Endpoint:** `GET /v1/health`

**Headers:** None required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## Admin Endpoints

All admin endpoints require HTTPS and session authentication.

### Login Page

Serves the admin login interface.

**Endpoint:** `GET /auth`

**Response:** HTML login page

### Admin Login

Authenticates admin user and creates session.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "adminPassword": "your-admin-password"
}
```

**Response:**
```json
{
  "success": true,
  "redirectTo": "/admin",
  "keyCount": 5
}
```

**Cookies Set:**
- `sessionToken`: Random session identifier
- `sessionHash`: Hashed session for validation

### Token Exchange Page

Serves the OAuth token exchange interface.

**Endpoint:** `GET /auth/exchange`

**Requirements:** Valid session

**Response:** HTML token exchange page

### Exchange OAuth Token

Creates a new API key from a Claude OAuth token.

**Endpoint:** `POST /auth/exchange`

**Requirements:** Valid session

**Request Body:**
```json
{
  "oauthToken": "sk-ant-oat01-...",
  "keyName": "my-application"
}
```

**Response:**
```json
{
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxx",
  "message": "API key generated successfully"
}
```

### Admin Dashboard

Displays all API keys and management interface.

**Endpoint:** `GET /admin`

**Requirements:** Valid session

**Response:** HTML dashboard page

### Delete API Key

Removes an API key from the system.

**Endpoint:** `DELETE /admin/keys/:apiKey`

**Requirements:** Valid session

**Parameters:**
- `apiKey`: The API key to delete

**Response:**
```json
{
  "message": "API key deleted successfully"
}
```

### Logout

Clears the admin session.

**Endpoint:** `GET /auth/logout`

**Response:** Redirect to `/auth`

## Error Responses

All errors follow the OpenAI error format:

```json
{
  "error": {
    "message": "Human-readable error description",
    "type": "error_type",
    "code": "error_code"
  }
}
```

### Error Types

| Type | Description | HTTP Status |
|------|-------------|-------------|
| `authentication_error` | Invalid API key or session | 401 |
| `invalid_request_error` | Malformed request | 400 |
| `rate_limit_error` | Too many requests | 429 |
| `api_error` | Internal server error | 500 |

### Common Error Codes

| Code | Description |
|------|-------------|
| `invalid_api_key` | API key is invalid or not found |
| `invalid_oauth_token` | OAuth token is invalid or expired |
| `invalid_messages` | Messages array is missing or empty |
| `invalid_password` | Admin password is incorrect |
| `rate_limit_exceeded` | Too many requests |
| `stream_error` | Error during streaming |
| `internal_error` | Unexpected server error |
| `key_not_found` | API key not found for deletion |
| `key_creation_failed` | Failed to create API key |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default limit**: 100 requests per minute per IP
- **Headers returned**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Model Mappings

The API accepts both OpenAI and Claude model names:

| OpenAI Model | Claude Model | Description |
|--------------|--------------|-------------|
| `gpt-4` | `opus` | Most capable model |
| `gpt-4-turbo` | `sonnet` | Balanced performance |
| `gpt-3.5-turbo` | `claude-3-5-haiku-20241022` | Fast, efficient model |

You can use either the OpenAI model name or the Claude model name directly.

## Client Examples

### Python (OpenAI SDK)
```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-xxxxxxxxxxxxxxxxxxxx",
    base_url="http://localhost:8000/v1"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### JavaScript/Node.js
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'sk-xxxxxxxxxxxxxxxxxxxx',
  baseURL: 'http://localhost:8000/v1',
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});

console.log(completion.choices[0].message.content);
```

### cURL
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### Streaming with cURL
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```