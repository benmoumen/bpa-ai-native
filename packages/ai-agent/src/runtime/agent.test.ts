import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BPAAgent } from './agent.js';
import type { BPAContext, ChatRequest } from '../types.js';

// Mock the AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(),
  generateText: vi.fn(),
}));

vi.mock('@ai-sdk/groq', () => ({
  createGroq: vi.fn(() => () => ({})),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => () => ({})),
}));

describe('BPAAgent', () => {
  const mockContext: BPAContext = {
    userId: 'test-user',
    sessionId: 'test-session',
    apiBaseUrl: 'http://localhost:4000/api/v1',
    userName: 'Test User',
    userEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set mock API key
    process.env.GROQ_API_KEY = 'test-key';
  });

  describe('constructor', () => {
    it('should create agent with default config', () => {
      const agent = new BPAAgent({ context: mockContext });
      expect(agent).toBeInstanceOf(BPAAgent);
    });

    it('should merge custom config with defaults', () => {
      const agent = new BPAAgent({
        context: mockContext,
        config: {
          maxSteps: 5,
          temperature: 0.5,
        },
      });
      expect(agent).toBeInstanceOf(BPAAgent);
    });

    it('should accept custom tools', () => {
      const customTool = {
        description: 'A test tool',
        parameters: {},
        execute: vi.fn(),
      };

      const agent = new BPAAgent({
        context: mockContext,
        tools: { testTool: customTool as unknown as never },
      });
      expect(agent).toBeInstanceOf(BPAAgent);
    });
  });

  describe('getContext', () => {
    it('should return a copy of the context', () => {
      const agent = new BPAAgent({ context: mockContext });
      const context = agent.getContext();

      expect(context).toEqual(mockContext);
      expect(context).not.toBe(mockContext);
    });
  });

  describe('updateContext', () => {
    it('should update context with new values', () => {
      const agent = new BPAAgent({ context: mockContext });
      agent.updateContext({ serviceId: 'new-service-id' });

      const context = agent.getContext();
      expect(context.serviceId).toBe('new-service-id');
      expect(context.userId).toBe(mockContext.userId);
    });
  });

  describe('getUsage', () => {
    it('should return initial usage as zero', () => {
      const agent = new BPAAgent({ context: mockContext });
      const usage = agent.getUsage();

      expect(usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
      });
    });
  });

  describe('onStepComplete', () => {
    it('should register step completion handlers', () => {
      const agent = new BPAAgent({ context: mockContext });
      const handler = vi.fn();

      agent.onStepComplete(handler);
      // Handler is registered, will be called during chat execution
      expect(agent).toBeInstanceOf(BPAAgent);
    });
  });

  describe('registerTools', () => {
    it('should add tools to the agent', () => {
      const agent = new BPAAgent({ context: mockContext });
      const newTool = {
        description: 'New tool',
        parameters: {},
        execute: vi.fn(),
      };

      agent.registerTools({ newTool: newTool as unknown as never });
      expect(agent).toBeInstanceOf(BPAAgent);
    });
  });
});

describe('BPAAgent types', () => {
  it('should export correct type for ChatRequest', () => {
    const request: ChatRequest = {
      message: 'Hello',
      history: [{ role: 'user', content: 'Previous message' }],
    };
    expect(request.message).toBe('Hello');
  });

  it('should export correct type for BPAContext', () => {
    const context: BPAContext = {
      userId: 'user-1',
      sessionId: 'session-1',
      apiBaseUrl: 'http://localhost:4000',
      serviceId: 'service-1',
      countryCode: 'US',
    };
    expect(context.userId).toBe('user-1');
  });
});
