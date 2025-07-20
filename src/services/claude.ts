import { query, type SDKMessage } from '@anthropic-ai/claude-code';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: 'stop' | 'length' | null;
  }>;
}

export class ClaudeService {
  /**
   * Convert OpenAI messages to Claude prompt format
   */
  private formatMessages(messages: OpenAIMessage[]): string {
    return messages
      .map(msg => {
        switch (msg.role) {
          case 'system':
            return `System: ${msg.content}`;
          case 'user':
            return `Human: ${msg.content}`;
          case 'assistant':
            return `Assistant: ${msg.content}`;
          default:
            return msg.content;
        }
      })
      .join('\n\n');
  }

  /**
   * Extract model name from OpenAI format
   */
  private getClaudeModel(model: string): string {
    // Map common OpenAI models to Claude models
    const modelMap: Record<string, string> = {
      'gpt-4': 'opus',
      'gpt-4-turbo': 'sonnet',
      'gpt-3.5-turbo': 'claude-3-5-haiku-20241022',
      'opus': 'opus',
      'sonnet': 'sonnet',
      'haiku': 'claude-3-5-haiku-20241022'
    };

    return modelMap[model] || 'sonnet'; // Default to sonnet
  }

  /**
   * Generate a unique completion ID
   */
  private generateId(): string {
    return `chatcmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle non-streaming chat completion
   */
  async completions(request: ChatCompletionRequest, oauthToken: string): Promise<ChatCompletionResponse> {
    // Set OAuth token for this request
    process.env.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;

    const prompt = this.formatMessages(request.messages);
    const model = this.getClaudeModel(request.model);
    
    let responseText = '';
    let totalCost = 0;

    for await (const message of query({
      prompt,
      options: { model }
    })) {
      if (message.type === 'assistant') {
        // Extract text content
        for (const block of message.message.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
      } else if (message.type === 'result' && message.subtype === 'success') {
        totalCost = message.total_cost_usd || 0;
      }
    }

    // Estimate token counts (rough approximation)
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(responseText.length / 4);

    return {
      id: this.generateId(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseText
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    };
  }

  /**
   * Handle streaming chat completion
   */
  async *streamCompletions(request: ChatCompletionRequest, oauthToken: string): AsyncGenerator<ChatCompletionChunk> {
    // Set OAuth token for this request
    process.env.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;

    const prompt = this.formatMessages(request.messages);
    const model = this.getClaudeModel(request.model);
    const completionId = this.generateId();
    const created = Math.floor(Date.now() / 1000);

    // Send initial chunk with role
    yield {
      id: completionId,
      object: 'chat.completion.chunk',
      created,
      model: request.model,
      choices: [{
        index: 0,
        delta: { role: 'assistant' },
        finish_reason: null
      }]
    };

    for await (const message of query({
      prompt,
      options: { model }
    })) {
      if (message.type === 'assistant') {
        // Extract and stream text content
        for (const block of message.message.content) {
          if (block.type === 'text') {
            const text = block.text;
            
            // Split large blocks into smaller chunks for smoother streaming
            if (text.length > 50) {
              const words = text.split(' ');
              let chunk = '';
              
              for (const word of words) {
                if (chunk.length + word.length > 30) {
                  yield {
                    id: completionId,
                    object: 'chat.completion.chunk',
                    created,
                    model: request.model,
                    choices: [{
                      index: 0,
                      delta: { content: chunk + ' ' },
                      finish_reason: null
                    }]
                  };
                  chunk = word;
                } else {
                  chunk = chunk ? `${chunk} ${word}` : word;
                }
              }
              
              // Send remaining chunk
              if (chunk) {
                yield {
                  id: completionId,
                  object: 'chat.completion.chunk',
                  created,
                  model: request.model,
                  choices: [{
                    index: 0,
                    delta: { content: chunk },
                    finish_reason: null
                  }]
                };
              }
            } else {
              // Small blocks sent as-is
              yield {
                id: completionId,
                object: 'chat.completion.chunk',
                created,
                model: request.model,
                choices: [{
                  index: 0,
                  delta: { content: text },
                  finish_reason: null
                }]
              };
            }
          }
        }
      }
    }

    // Send final chunk
    yield {
      id: completionId,
      object: 'chat.completion.chunk',
      created,
      model: request.model,
      choices: [{
        index: 0,
        delta: {},
        finish_reason: 'stop'
      }]
    };
  }
}