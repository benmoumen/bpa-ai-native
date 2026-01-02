import { describe, it, expect } from 'vitest';
import {
  formatStreamChunk,
  aggregateResponses,
  createTextStream,
} from './stream.js';
import type { ChatResponse, TokenUsage } from '../types.js';

describe('formatStreamChunk', () => {
  it('should format response as SSE data line', () => {
    const response: ChatResponse = {
      text: 'Hello',
      isStreaming: true,
    };

    const result = formatStreamChunk(response);
    expect(result).toMatch(/^data: /);
    expect(result).toMatch(/\n\n$/);
  });

  it('should include all response fields', () => {
    const response: ChatResponse = {
      text: 'Complete',
      isStreaming: false,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        costUsd: 0.001,
      },
    };

    const result = formatStreamChunk(response);
    const json = result.replace('data: ', '').replace('\n\n', '');
    const parsed = JSON.parse(json);

    expect(parsed.text).toBe('Complete');
    expect(parsed.isStreaming).toBe(false);
    expect(parsed.usage.totalTokens).toBe(30);
  });

  it('should include error information', () => {
    const response: ChatResponse = {
      text: '',
      isStreaming: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        retryable: true,
      },
    };

    const result = formatStreamChunk(response);
    const json = result.replace('data: ', '').replace('\n\n', '');
    const parsed = JSON.parse(json);

    expect(parsed.error.code).toBe('RATE_LIMITED');
    expect(parsed.error.retryable).toBe(true);
  });
});

describe('aggregateResponses', () => {
  it('should return empty response for empty array', () => {
    const result = aggregateResponses([]);
    expect(result.text).toBe('');
    expect(result.isStreaming).toBe(false);
  });

  it('should return last text from responses', () => {
    const responses: ChatResponse[] = [
      { text: 'Hello', isStreaming: true },
      { text: 'Hello world', isStreaming: true },
      { text: 'Hello world!', isStreaming: false },
    ];

    const result = aggregateResponses(responses);
    expect(result.text).toBe('Hello world!');
    expect(result.isStreaming).toBe(false);
  });

  it('should sum up token usage', () => {
    const usage1: TokenUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      costUsd: 0.001,
    };
    const usage2: TokenUsage = {
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
      costUsd: 0.002,
    };

    const responses: ChatResponse[] = [
      { text: 'Part 1', isStreaming: true, usage: usage1 },
      { text: 'Part 1 and 2', isStreaming: false, usage: usage2 },
    ];

    const result = aggregateResponses(responses);
    expect(result.usage?.promptTokens).toBe(25);
    expect(result.usage?.completionTokens).toBe(45);
    expect(result.usage?.totalTokens).toBe(70);
    expect(result.usage?.costUsd).toBeCloseTo(0.003);
  });

  it('should aggregate tool calls from all responses', () => {
    const responses: ChatResponse[] = [
      {
        text: 'Step 1',
        isStreaming: true,
        toolCalls: [
          {
            toolName: 'createService',
            args: { name: 'Test' },
            result: { id: '123' },
            durationMs: 100,
          },
        ],
      },
      {
        text: 'Step 2',
        isStreaming: false,
        toolCalls: [
          {
            toolName: 'addFormField',
            args: { type: 'text' },
            result: { id: '456' },
            durationMs: 50,
          },
        ],
      },
    ];

    const result = aggregateResponses(responses);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls?.[0].toolName).toBe('createService');
    expect(result.toolCalls?.[1].toolName).toBe('addFormField');
  });
});

describe('createTextStream', () => {
  it('should stream text in chunks', async () => {
    const text = 'Hello, World!';
    const chunks: ChatResponse[] = [];

    for await (const chunk of createTextStream(text, 5)) {
      chunks.push(chunk);
    }

    // Should have intermediate chunks plus final
    expect(chunks.length).toBeGreaterThan(1);

    // Last chunk should have full text
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.text).toBe(text);
    expect(lastChunk.isStreaming).toBe(false);
  });

  it('should indicate streaming status correctly', async () => {
    const text = 'Test';
    const chunks: ChatResponse[] = [];

    for await (const chunk of createTextStream(text, 2)) {
      chunks.push(chunk);
    }

    // Last chunk should not be streaming
    expect(chunks[chunks.length - 1].isStreaming).toBe(false);
    // Final chunk should have complete text
    expect(chunks[chunks.length - 1].text).toBe(text);
  });
});
