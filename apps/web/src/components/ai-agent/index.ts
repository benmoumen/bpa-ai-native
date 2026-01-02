/**
 * AI Agent Components
 *
 * Story 6-2: Chat Interface Foundation
 * Story 6-3: Confirmation Flow UI
 * Story 6-4: Service Generation Flow
 * Story 6-5: Iterative Refinement
 * Story 6-6: Gap Detection
 */

// Main components
export { ChatSidebar } from './ChatSidebar';
export { MessageList } from './MessageList';
export { MessageInput } from './MessageInput';
export { StreamingMessage } from './StreamingMessage';
export { ConfirmationDialog } from './ConfirmationDialog';

// Generation flow components
export { GenerationProgress } from './GenerationProgress';
export { GenerationPreview } from './GenerationPreview';
export { GenerationSummary } from './GenerationSummary';

// Refinement components
export { ChangePreview } from './ChangePreview';

// Gap detection components
export { GapReport } from './GapReport';
export {
  gapFixToIntent,
  generateFixPreviews,
  applyGapFixes,
  filterGapsByIds,
  getFixableGaps,
  describeFixAction,
} from './gap-fixer';
export type { FixPreviewItem, ApplyFixesResult } from './gap-fixer';

// Hooks
export { useChat } from './use-chat';
export { useConfirmation, createPendingAction } from './use-confirmation';
export type { ConfirmationResult } from './use-confirmation';
export {
  useGenerationFlow,
  GenerationStep,
  STEP_CONFIG,
  ORDERED_STEPS,
} from './use-generation-flow';
export type {
  GenerationResults,
  GenerationFlowState,
  UseGenerationFlowOptions,
  UseGenerationFlowReturn,
} from './use-generation-flow';
export { useRefinementFlow } from './use-refinement-flow';
export { useGapDetection } from './use-gap-detection';
export type {
  GapReportData,
  GapDetectionState,
  ServiceConfigForAnalysis,
  UseGapDetectionOptions,
  UseGapDetectionReturn,
} from './use-gap-detection';

// Refinement parser
export { parseRefinementIntent, describeIntent, isDestructiveIntent } from './refinement-parser';
export type { RefinementIntent } from './refinement-parser';

// Types
export type {
  MessageRole,
  MessageStatus,
  ChatMessage,
  ChatSession,
  PendingAction,
  ChatSidebarProps,
  MessageListProps,
  MessageInputProps,
  StreamingMessageProps,
} from './types';
export type {
  GapSeverity,
  GapFix,
  GapItem,
  GapReportProps,
} from './GapReport';
