# Claude Code API Architecture

## Overview

Claude Code API provides an OpenAI-compatible REST API that wraps the Claude Code SDK, enabling seamless integration with existing OpenAI client libraries while leveraging Claude's capabilities.

## Architecture Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  OpenAI Client  │─────▶│  FastAPI Server │─────▶│ Claude Code SDK │
│   (Any Lang)    │ HTTP │ (Python Async)  │ SDK  │    (Python)     │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                            │
                                                            │ Subprocess
                                                            ▼
                                                   ┌─────────────────┐
                                                   │                 │
                                                   │  Claude CLI     │
                                                   │  (Node.js)      │
                                                   │                 │
                                                   └────────┬────────┘
                                                            │
                                                            │ HTTPS
                                                            ▼
                                                   ┌─────────────────┐
                                                   │                 │
                                                   │ Anthropic API   │
                                                   │                 │
                                                   └─────────────────┘
```

## Request/Response Flow

### Non-Streaming Request
```
1. Client → POST /v1/chat/completions
   {
     "model": "claude-3-opus-20240229",
     "messages": [{"role": "user", "content": "Hello"}]
   }

2. FastAPI → Validate OAuth token
   - Check Authorization: Bearer header
   - Or use CLAUDE_CODE_OAUTH_TOKEN env var

3. FastAPI → Transform to Claude format
   - Convert messages array to prompt string
   - Extract model name

4. FastAPI → Call SDK
   await query(prompt, ClaudeCodeOptions(model=model))

5. SDK → Spawn CLI subprocess
   claude --print --output-format stream-json

6. CLI → Return NDJSON messages

7. FastAPI → Transform to OpenAI format
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
     "model": "claude-3-opus-20240229",
     "messages": [...],
     "stream": true
   }

2-5. Same as non-streaming

6. CLI → Stream NDJSON messages

7. FastAPI → Stream SSE chunks
   data: {"choices": [{"delta": {"content": "Hello"}}]}
   data: {"choices": [{"delta": {"content": " there"}}]}
   data: [DONE]
```

## Key Components

### 1. FastAPI Application (`main.py`)
- Single endpoint: `/v1/chat/completions`
- OAuth token validation middleware
- OpenAI request/response models
- SSE streaming support

### 2. Message Transformer (`transformer.py`)
- OpenAI messages → Claude prompt
- Claude responses → OpenAI format
- Chunk splitting for smooth streaming

### 3. SDK Integration (`claude_client.py`)
- Async wrapper around `claude_code_sdk`
- Session management
- Error handling

### 4. Authentication (`auth.py`)
- Bearer token extraction
- OAuth token validation
- Environment variable fallback

## Data Flow Example

### Input (OpenAI Format)
```json
{
  "messages": [
    {"role": "system", "content": "You are helpful"},
    {"role": "user", "content": "What is Python?"}
  ]
}
```

### Transformed (Claude Format)
```
System: You are helpful
Human: What is Python?
```

### SDK Message Flow (NDJSON)
```json
{"type": "assistant", "message": {"role": "assistant", "content": [{"type": "text", "text": "Python is a high-level programming language..."}]}}
{"type": "result", "subtype": "success", "duration_ms": 1234, "total_cost_usd": 0.002}
```

### Output (OpenAI Format)
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "claude-3-opus-20240229",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Python is a high-level programming language..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  }
}
```

## Deployment

### Docker Container
- Base image: `ghcr.io/cabinlab/claude-code-sdk-docker:python`
- Pre-installed: Claude Code CLI + Python SDK
- OAuth token passed via environment variable

### Environment Variables
```bash
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...  # OAuth token
PORT=8000                                  # Server port
LOG_LEVEL=info                            # Logging level
```

## Benefits

1. **OpenAI Compatibility**: Drop-in replacement for OpenAI API
2. **Streaming Support**: Real-time response streaming via SSE
3. **Simple Auth**: OAuth-only, no user management needed
4. **Lightweight**: Minimal dependencies, stateless design
5. **Docker-Ready**: Designed for containerized deployment
