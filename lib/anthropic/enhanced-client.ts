/**
 * Enhanced Anthropic Client with Retry Logic, Caching, and Monitoring
 * Based on Cursor AI Implementation Guide Phase 4
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Message, TextBlockParam } from '@anthropic-ai/sdk/resources';

export interface AnthropicClientConfig {
  apiKey: string;
  maxRetries?: number;
  timeout?: number;
  enableCaching?: boolean;
}

export interface MessageParams {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string | Array<TextBlockParam>;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface MessageResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  model: string;
  stop_reason: string;
}

export class AnthropicClient {
  private client: Anthropic;
  private maxRetries: number;
  private timeout: number;
  private enableCaching: boolean;
  private requestCount: number = 0;
  private totalTokens: number = 0;

  constructor(config: AnthropicClientConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 60000; // 60 seconds
    this.enableCaching = config.enableCaching !== false; // Default true
  }

  /**
   * Create a message with retry logic and timeout handling
   */
  async createMessage(params: MessageParams): Promise<MessageResponse> {
    const model = params.model || 'claude-sonnet-4-5-20250929';
    const maxTokens = params.max_tokens || 4096;
    const temperature = params.temperature !== undefined ? params.temperature : 0.7;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Add timeout and ensure non-streaming response
        const response = await this.withTimeout(
          this.client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature,
            system: params.system as string | Array<TextBlockParam> | undefined,
            messages: params.messages as any,
            stream: false, // Explicitly set non-streaming
          }) as Promise<Message>,
          this.timeout
        );

        // Track usage
        this.requestCount++;
        this.totalTokens += response.usage.input_tokens + response.usage.output_tokens;

        // Extract text content
        const content = response.content[0];
        const text = content.type === 'text' ? content.text : '';

        return {
          content: text,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
            cache_creation_input_tokens: (response.usage as any).cache_creation_input_tokens,
            cache_read_input_tokens: (response.usage as any).cache_read_input_tokens,
          },
          model: response.model,
          stop_reason: response.stop_reason || 'end_turn',
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Anthropic API attempt ${attempt}/${this.maxRetries} failed:`, error);

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Exponential backoff
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Create message with prompt caching enabled
   * Useful for repeated system prompts
   */
  async createMessageWithCaching(
    systemPrompt: string,
    userMessage: string,
    options: Partial<MessageParams> = {}
  ): Promise<MessageResponse> {
    if (!this.enableCaching) {
      return this.createMessage({
        ...options,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });
    }

    // Enable prompt caching for system prompt
    const system: Array<TextBlockParam> = [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ];

    return this.createMessage({
      ...options,
      system,
      messages: [{ role: 'user', content: userMessage }],
    });
  }

  /**
   * Calculate cost based on token usage
   * Claude Sonnet 4.5 pricing (as of Feb 2026):
   * - Input: $3 per million tokens
   * - Output: $15 per million tokens
   * - Cached input: $0.30 per million tokens (10x cheaper)
   */
  calculateCost(usage: MessageResponse['usage']): number {
    const inputCost = (usage.input_tokens / 1_000_000) * 3;
    const outputCost = (usage.output_tokens / 1_000_000) * 15;
    const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * 0.3;
    const cacheWriteCost = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * 3.75; // 1.25x input price

    return Number((inputCost + outputCost + cacheReadCost + cacheWriteCost).toFixed(4));
  }

  /**
   * Validate that API key is commercial (not consumer)
   */
  async validateCommercialAPI(): Promise<boolean> {
    try {
      // Make a minimal test request
      const response = await this.createMessage({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });

      // Commercial API should work without issues
      return true;
    } catch (error: any) {
      if (error.message?.includes('consumer')) {
        console.error('Consumer API key detected. Commercial API required for legal use.');
        return false;
      }
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    request_count: number;
    total_tokens: number;
  } {
    return {
      request_count: this.requestCount,
      total_tokens: this.totalTokens,
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.requestCount = 0;
    this.totalTokens = 0;
  }

  // Private helper methods

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      ),
    ]);
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limits, timeouts, and server errors
    const retryableStatuses = [429, 500, 502, 503, 504];
    const retryableMessages = ['timeout', 'rate limit', 'overloaded'];

    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some((msg) => errorMessage.includes(msg));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance for app-wide use
let clientInstance: AnthropicClient | null = null;

export function getAnthropicClient(): AnthropicClient {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    clientInstance = new AnthropicClient({
      apiKey,
      maxRetries: 3,
      timeout: 60000,
      enableCaching: true,
    });
  }

  return clientInstance;
}
