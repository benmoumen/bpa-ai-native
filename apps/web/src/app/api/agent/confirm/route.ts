import { NextRequest, NextResponse } from 'next/server';

/**
 * Confirmation API Route
 *
 * Story 6-3: Confirmation Flow UI
 *
 * Handles confirmation responses from the client.
 * This route receives confirmation decisions and forwards them
 * to the agent session.
 */

interface ConfirmationRequest {
  /** Session ID */
  sessionId: string;
  /** Action ID being confirmed */
  actionId: string;
  /** Whether the action was confirmed */
  confirmed: boolean;
  /** Reason for rejection (if not confirmed) */
  reason?: 'user_rejected' | 'timeout';
}

interface ConfirmationResponse {
  success: boolean;
  message: string;
  actionId: string;
}

/**
 * POST /api/agent/confirm
 *
 * Submit a confirmation decision for a pending action.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ConfirmationResponse>> {
  try {
    const body = (await request.json()) as ConfirmationRequest;
    const { sessionId, actionId, confirmed, reason } = body;

    // Validate required fields
    if (!sessionId || !actionId || confirmed === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: sessionId, actionId, confirmed',
          actionId: actionId || '',
        },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Validate the session exists
    // 2. Validate the action is pending for this session
    // 3. Forward the confirmation to the agent runtime
    // 4. Return the result

    // For now, we'll simulate success
    // The actual implementation will integrate with the WebSocket events
    // from Story 6-1d to notify the agent of the confirmation

    console.log(
      `[Agent Confirm] Session: ${sessionId}, Action: ${actionId}, Confirmed: ${String(confirmed)}, Reason: ${reason ?? 'N/A'}`
    );

    return NextResponse.json({
      success: true,
      message: confirmed
        ? 'Action confirmed successfully'
        : `Action rejected: ${reason ?? 'user_rejected'}`,
      actionId,
    });
  } catch (error) {
    console.error('[Agent Confirm] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        actionId: '',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/confirm
 *
 * Get pending confirmations for a session.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { success: false, message: 'Missing sessionId parameter', pending: [] },
      { status: 400 }
    );
  }

  // In a real implementation, this would fetch pending confirmations
  // from the agent session state

  return NextResponse.json({
    success: true,
    pending: [],
    sessionId,
  });
}
