import { streamText, generateText, type CoreMessage, type Tool, type LanguageModel } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';

import type {
  AgentConfig,
  BPAAgentOptions,
  BPAContext,
  ChatRequest,
  ChatResponse,
  StepCompletionHandler,
  StepResult,
  TokenUsage,
  AgentError,
  LLMProvider,
} from '../types.js';
import { DEFAULT_CONFIG, LLM_MODELS } from '../types.js';

/**
 * BPA AI Agent - Core runtime for AI-powered service configuration
 *
 * Provides multi-step reasoning, tool execution, and streaming responses
 * for the BPA service designer interface.
 *
 * @example
 * ```typescript
 * const agent = new BPAAgent({
 *   context: {
 *     userId: 'user-123',
 *     sessionId: 'session-456',
 *     apiBaseUrl: 'http://localhost:4000/api/v1',
 *   },
 * });
 *
 * const stream = agent.chat({ message: 'Create a business license service' });
 * for await (const chunk of stream) {
 *   console.log(chunk.text);
 * }
 * ```
 */
export class BPAAgent {
  private config: Required<AgentConfig>;
  private context: BPAContext;
  private tools: Record<string, Tool>;
  private systemPrompt: string;
  private model: LanguageModel;
  private fallbackModel: LanguageModel | null;
  private stepHandlers: StepCompletionHandler[] = [];
  private totalUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  };

  constructor(options: BPAAgentOptions) {
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.context = options.context;
    this.tools = options.tools ?? {};
    this.systemPrompt = this.buildSystemPrompt(options.systemPrompt);

    // Initialize primary model
    this.model = this.createModel(this.config.provider, this.config.modelId);

    // Initialize fallback model if enabled
    this.fallbackModel = this.config.enableFallback
      ? this.createFallbackModel()
      : null;
  }

  /**
   * Send a chat message and get a streaming response
   */
  async *chat(request: ChatRequest): AsyncGenerator<ChatResponse> {
    const messages = this.buildMessages(request);

    try {
      yield* this.executeChat(messages, this.model);
    } catch (error) {
      // Try fallback on failure
      if (this.fallbackModel && this.shouldFallback(error)) {
        console.warn('[BPAAgent] Primary model failed, using fallback', error);
        yield* this.executeChat(messages, this.fallbackModel);
      } else {
        yield {
          text: '',
          error: this.classifyError(error),
          isStreaming: false,
        };
      }
    }
  }

  /**
   * Send a chat message and get a complete response (non-streaming)
   */
  async chatSync(request: ChatRequest): Promise<ChatResponse> {
    const messages = this.buildMessages(request);

    try {
      return await this.executeChatSync(messages, this.model);
    } catch (error) {
      if (this.fallbackModel && this.shouldFallback(error)) {
        console.warn('[BPAAgent] Primary model failed, using fallback', error);
        return await this.executeChatSync(messages, this.fallbackModel);
      }
      return {
        text: '',
        error: this.classifyError(error),
      };
    }
  }

  /**
   * Register a step completion handler
   */
  onStepComplete(handler: StepCompletionHandler): void {
    this.stepHandlers.push(handler);
  }

  /**
   * Get total token usage for this agent instance
   */
  getUsage(): TokenUsage {
    return { ...this.totalUsage };
  }

  /**
   * Get current context
   */
  getContext(): BPAContext {
    return { ...this.context };
  }

  /**
   * Update context (e.g., after navigation or service change)
   */
  updateContext(update: Partial<BPAContext>): void {
    this.context = { ...this.context, ...update };
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Register additional tools
   */
  registerTools(tools: Record<string, Tool>): void {
    this.tools = { ...this.tools, ...tools };
  }

  private async *executeChat(
    messages: CoreMessage[],
    model: LanguageModel,
  ): AsyncGenerator<ChatResponse> {
    const { textStream, usage } = streamText({
      model,
      messages,
      system: this.systemPrompt,
      tools: this.tools,
      maxSteps: this.config.maxSteps,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      onStepFinish: async ({ stepType, text, toolCalls: stepToolCalls, usage: stepUsage }) => {
        const step: StepResult = {
          stepNumber: 1, // TODO: track step number
          type: stepType === 'initial' ? 'text' : stepType === 'tool-result' ? 'tool-result' : 'tool-call',
          text,
          usage: this.calculateUsage(stepUsage, model),
        };

        const firstToolCall = stepToolCalls[0] as { toolName: string; args: unknown } | undefined;
        if (firstToolCall !== undefined) {
          step.toolCall = {
            name: firstToolCall.toolName,
            args: firstToolCall.args as Record<string, unknown>,
          };
        }

        for (const handler of this.stepHandlers) {
          await handler(step);
        }
      },
    });

    let accumulatedText = '';

    for await (const chunk of textStream) {
      accumulatedText += chunk;
      yield {
        text: accumulatedText,
        isStreaming: true,
      };
    }

    // Final response with usage
    const finalUsage = await usage;
    const tokenUsage = this.calculateUsage(finalUsage, model);
    this.updateTotalUsage(tokenUsage);

    yield {
      text: accumulatedText,
      usage: tokenUsage,
      isStreaming: false,
    };
  }

  private async executeChatSync(
    messages: CoreMessage[],
    model: LanguageModel,
  ): Promise<ChatResponse> {
    const result = await generateText({
      model,
      messages,
      system: this.systemPrompt,
      tools: this.tools,
      maxSteps: this.config.maxSteps,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    const tokenUsage = this.calculateUsage(result.usage, model);
    this.updateTotalUsage(tokenUsage);

    return {
      text: result.text,
      usage: tokenUsage,
    };
  }

  private buildMessages(request: ChatRequest): CoreMessage[] {
    const history = request.history ?? [];
    const userMessage: CoreMessage = {
      role: 'user',
      content: request.message,
    };

    return [...history, userMessage];
  }

  private buildSystemPrompt(customPrompt?: string): string {
    const basePrompt = `You are BPA Agent, an AI assistant helping service designers configure government services.

## Your Capabilities
- Create and configure services, forms, workflows, and registrations
- Add form fields with validation rules
- Configure workflow steps and transitions
- Set up determinants and business rules

## Current Context
- User: ${this.context.userName ?? 'Unknown'} (${this.context.userId})
- Session: ${this.context.sessionId}
${this.context.serviceId ? `- Active Service: ${this.context.serviceId}` : '- No service selected'}
${this.context.countryCode ? `- Country: ${this.context.countryCode}` : ''}

## Guidelines
1. Be concise and helpful
2. Confirm destructive actions before executing
3. Explain what you're doing as you work
4. If unsure, ask for clarification
5. Prefer batch operations when efficient

## Response Style
- Use markdown for structured responses
- Keep explanations brief but clear
- Show progress for multi-step operations
`;

    return customPrompt
      ? `${basePrompt}\n\n## Additional Instructions\n${customPrompt}`
      : basePrompt;
  }

  private createModel(provider: LLMProvider, modelId: string): LanguageModel {
    const apiKey = this.config.apiKey || this.getApiKeyFromEnv(provider);

    switch (provider) {
      case 'groq': {
        const groq = createGroq({ apiKey });
        return groq(modelId);
      }
      case 'anthropic': {
        const anthropic = createAnthropic({ apiKey });
        return anthropic(modelId);
      }
      default: {
        const exhaustiveCheck: never = provider;
        throw new Error(`Unsupported provider: ${exhaustiveCheck as string}`);
      }
    }
  }

  private createFallbackModel(): LanguageModel | null {
    const provider = this.config.provider;
    // If primary is Groq, fallback to Anthropic
    if (provider === 'groq') {
      try {
        return this.createModel('anthropic', 'claude-3-5-haiku-20241022');
      } catch {
        console.warn('[BPAAgent] Fallback model not available');
        return null;
      }
    }
    // If primary is Anthropic, fallback to Groq
    try {
      return this.createModel('groq', 'llama-3.3-70b-versatile');
    } catch {
      console.warn('[BPAAgent] Fallback model not available');
      return null;
    }
  }

  private getApiKeyFromEnv(provider: LLMProvider): string {
    const envKey = provider === 'groq' ? 'GROQ_API_KEY' : 'ANTHROPIC_API_KEY';
    const apiKey = process.env[envKey];
    if (!apiKey) {
      throw new Error(`${envKey} environment variable is required`);
    }
    return apiKey;
  }

  private shouldFallback(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Fallback on rate limits, timeouts, and provider errors
      return (
        message.includes('rate') ||
        message.includes('limit') ||
        message.includes('timeout') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('unavailable')
      );
    }
    return false;
  }

  private classifyError(error: unknown): AgentError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('rate') || message.includes('limit')) {
        return {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Please wait a moment.',
          cause: error,
          retryable: true,
          recovery: 'Wait 30 seconds and try again',
        };
      }

      if (message.includes('timeout')) {
        return {
          code: 'TIMEOUT',
          message: 'Request timed out. The operation took too long.',
          cause: error,
          retryable: true,
          recovery: 'Try a simpler request',
        };
      }

      if (message.includes('unauthorized') || message.includes('401')) {
        return {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in again.',
          cause: error,
          retryable: false,
        };
      }

      if (message.includes('forbidden') || message.includes('403')) {
        return {
          code: 'FORBIDDEN',
          message: 'You do not have permission for this action.',
          cause: error,
          retryable: false,
        };
      }

      return {
        code: 'PROVIDER_ERROR',
        message: error.message,
        cause: error,
        retryable: false,
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      retryable: false,
    };
  }

  private calculateUsage(
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    model: LanguageModel,
  ): TokenUsage {
    const pricing = this.getModelPricing(model);
    const costUsd = pricing
      ? (usage.promptTokens / 1000) * pricing.inputPrice +
        (usage.completionTokens / 1000) * pricing.outputPrice
      : 0;

    return {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      costUsd,
    };
  }

  private getModelPricing(
    model: LanguageModel,
  ): { inputPrice: number; outputPrice: number } | null {
    // Extract model ID from the language model
    const modelId = (model as unknown as { modelId?: string }).modelId ?? '';

    // Check groq models
    for (const [id, pricing] of Object.entries(LLM_MODELS.groq)) {
      if (modelId.includes(id)) {
        return { inputPrice: pricing.inputPrice, outputPrice: pricing.outputPrice };
      }
    }

    // Check anthropic models
    for (const [id, pricing] of Object.entries(LLM_MODELS.anthropic)) {
      if (modelId.includes(id)) {
        return { inputPrice: pricing.inputPrice, outputPrice: pricing.outputPrice };
      }
    }

    return null;
  }

  private updateTotalUsage(usage: TokenUsage): void {
    this.totalUsage.promptTokens += usage.promptTokens;
    this.totalUsage.completionTokens += usage.completionTokens;
    this.totalUsage.totalTokens += usage.totalTokens;
    this.totalUsage.costUsd += usage.costUsd;

    // Update context with session cost
    this.context.sessionCost = this.totalUsage.costUsd;
  }
}
