/**
 * Chat Streaming API Endpoint
 *
 * Story 6-4: Service Generation Flow (Task 1)
 *
 * Provides streaming chat responses from the BPAAgent.
 * Uses Server-Sent Events (SSE) for real-time streaming.
 */

import { auth } from '@/auth';
import { BPAAgent, createResponseStream } from '@bpa/ai-agent';
import type { ChatRequest, BPAContext } from '@bpa/ai-agent';

/** Maximum allowed message length (10KB) */
const MAX_MESSAGE_LENGTH = 10240;

/** Maximum allowed history items */
const MAX_HISTORY_ITEMS = 100;

/** Supported LLM providers */
const SUPPORTED_PROVIDERS = ['groq', 'anthropic'] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

interface ChatRequestBody {
  /** User's message */
  message: string;
  /** Service ID for context */
  serviceId?: string;
  /** Session ID for conversation continuity */
  sessionId?: string;
  /** Previous message history (optional) */
  history?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

interface ChatErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * POST /api/agent/chat
 *
 * Stream chat responses from the AI agent.
 * Requires authentication.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        } satisfies ChatErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON body',
          },
        } satisfies ChatErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Message is required',
          },
        } satisfies ChatErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate message length
    if (body.message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
          },
        } satisfies ChatErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate history if provided
    if (body.history) {
      if (!Array.isArray(body.history)) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_REQUEST',
              message: 'History must be an array',
            },
          } satisfies ChatErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (body.history.length > MAX_HISTORY_ITEMS) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_REQUEST',
              message: `History too long. Maximum ${MAX_HISTORY_ITEMS} items allowed.`,
            },
          } satisfies ChatErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Build BPA context from session and request
    const context: BPAContext = {
      userId: session.user.id ?? 'unknown',
      userName: session.user.name ?? undefined,
      userEmail: session.user.email ?? undefined,
      userRoles: session.user.roles ?? [],
      serviceId: body.serviceId,
      sessionId: body.sessionId ?? `session-${Date.now()}`,
      apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1',
      authToken: session.accessToken,
    };

    // Get and validate provider
    const providerEnv = process.env.LLM_PROVIDER ?? 'groq';
    const provider: SupportedProvider = SUPPORTED_PROVIDERS.includes(
      providerEnv as SupportedProvider
    )
      ? (providerEnv as SupportedProvider)
      : 'groq';

    // Create agent instance
    const agent = new BPAAgent({
      context,
      config: {
        provider,
        modelId: process.env.LLM_MODEL_ID,
        apiKey: process.env.GROQ_API_KEY ?? process.env.ANTHROPIC_API_KEY,
        enableFallback: true,
        maxSteps: 10,
        temperature: 0.7,
        maxTokens: 4096,
      },
    });

    // Build chat request
    const chatRequest: ChatRequest = {
      message: body.message,
      history: body.history?.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Create streaming response
    const responseGenerator = agent.chat(chatRequest);
    const stream = createResponseStream(responseGenerator);

    // Return streaming response with abort handling
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    // Log full error server-side for debugging
    console.error('[/api/agent/chat] Unexpected error:', error);

    // Return generic message to client (avoid information disclosure)
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your request',
        },
      } satisfies ChatErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * OPTIONS /api/agent/chat
 *
 * Handle CORS preflight requests.
 * Note: Next.js handles same-origin requests automatically.
 * Only allow specific origins in production.
 */
export async function OPTIONS(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];

  // Only allow configured origins or same-origin requests
  const isAllowed = !origin || allowedOrigins.includes(origin);

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowed && origin ? origin : '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
