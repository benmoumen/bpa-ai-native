/**
 * @bpa/ai-agent - AI Agent for BPA Service Configuration
 *
 * Provides AI-powered assistance for configuring government services
 * using natural language. Built on Vercel AI SDK with Groq/Anthropic.
 *
 * @example
 * ```typescript
 * import { BPAAgent } from '@bpa/ai-agent';
 *
 * const agent = new BPAAgent({
 *   context: {
 *     userId: 'user-123',
 *     sessionId: 'session-456',
 *     apiBaseUrl: 'http://localhost:4000/api/v1',
 *   },
 * });
 *
 * // Streaming response
 * for await (const chunk of agent.chat({ message: 'Create a business license service' })) {
 *   console.log(chunk.text);
 * }
 *
 * // Or sync response
 * const response = await agent.chatSync({ message: 'List all services' });
 * console.log(response.text);
 * ```
 */

// Core runtime
export { BPAAgent } from './runtime/agent.js';
export {
  createResponseStream,
  formatStreamChunk,
  parseSSEStream,
  aggregateResponses,
  createTextStream,
} from './runtime/stream.js';

// Types
export type {
  AgentConfig,
  BPAAgentOptions,
  BPAContext,
  ChatRequest,
  ChatResponse,
  ToolCallResult,
  TokenUsage,
  AgentError,
  AgentErrorCode,
  StepCompletionHandler,
  StepResult,
  LLMProvider,
} from './types.js';

export { AI_AGENT_VERSION, DEFAULT_CONFIG, LLM_MODELS } from './types.js';
