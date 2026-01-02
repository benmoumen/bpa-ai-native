import type { ChatResponse, TokenUsage } from '../types.js';

/**
 * Stream utilities for BPA Agent responses
 */

/**
 * Create a ReadableStream from an async generator of ChatResponses
 * Useful for Next.js route handlers
 */
export function createResponseStream(
  generator: AsyncGenerator<ChatResponse>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const response of generator) {
          const chunk = formatStreamChunk(response);
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        const errorChunk = formatStreamChunk({
          text: '',
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Stream error',
            retryable: false,
          },
          isStreaming: false,
        });
        controller.enqueue(encoder.encode(errorChunk));
        controller.close();
      }
    },
  });
}

/**
 * Format a ChatResponse as a Server-Sent Event (SSE) chunk
 */
export function formatStreamChunk(response: ChatResponse): string {
  const data = JSON.stringify({
    text: response.text,
    isStreaming: response.isStreaming,
    error: response.error,
    usage: response.usage,
    toolCalls: response.toolCalls,
  });

  // SSE format: data: {json}\n\n
  return `data: ${data}\n\n`;
}

/**
 * Parse SSE chunks from a stream
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatResponse> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let buffer = '';

  try {
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        buffer += decoder.decode(result.value, { stream: true });
      }

      // Parse complete SSE messages
      const lines = buffer.split('\n\n');
      const remaining = lines.pop();
      buffer = remaining ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const json = line.slice(6);
          try {
            yield JSON.parse(json) as ChatResponse;
          } catch {
            console.warn('[parseSSEStream] Failed to parse chunk:', json);
          }
        }
      }
    }

    // Parse any remaining buffer
    if (buffer.length > 0 && buffer.startsWith('data: ')) {
      const json = buffer.slice(6);
      try {
        yield JSON.parse(json) as ChatResponse;
      } catch {
        // Ignore incomplete final chunk
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Aggregate multiple ChatResponses into a single final response
 */
export function aggregateResponses(responses: ChatResponse[]): ChatResponse {
  if (responses.length === 0) {
    return {
      text: '',
      isStreaming: false,
    };
  }

  const lastResponse = responses[responses.length - 1];

  // Aggregate all tool calls
  const allToolCalls = responses.flatMap((r) => r.toolCalls ?? []);

  // Sum all usage
  const totalUsage: TokenUsage = responses.reduce(
    (acc, r) => {
      if (r.usage) {
        acc.promptTokens += r.usage.promptTokens;
        acc.completionTokens += r.usage.completionTokens;
        acc.totalTokens += r.usage.totalTokens;
        acc.costUsd += r.usage.costUsd;
      }
      return acc;
    },
    { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
  );

  return {
    text: lastResponse.text,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    usage: totalUsage.totalTokens > 0 ? totalUsage : undefined,
    error: lastResponse.error,
    isStreaming: false,
  };
}

/**
 * Create a simple text-only stream (for testing)
 */
export function createTextStream(text: string, chunkSize = 10): AsyncGenerator<ChatResponse> {
  return (async function* () {
    let accumulated = '';
    for (let i = 0; i < text.length; i += chunkSize) {
      accumulated += text.slice(i, i + chunkSize);
      yield {
        text: accumulated,
        isStreaming: i + chunkSize < text.length,
      };
      // Simulate streaming delay
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    yield {
      text,
      isStreaming: false,
    };
  })();
}
