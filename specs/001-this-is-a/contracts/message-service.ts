/**
 * Message Service Contract
 *
 * Handles AI-powered message generation and customization.
 * Used by: Background worker, Popup UI, Content scripts
 */

import type {
  MessageDraft,
  ProfileAnalysis,
  UserProfile,
  TonePreset,
  MessageLength,
  Annotation,
} from '../data-model';

// ============================================================================
// Message Generation API
// ============================================================================

export interface MessageService {
  /**
   * Generate personalized cold message from profile analysis
   *
   * FR-004: Generate personalized drafts referencing both profiles
   * FR-005: Indicate which parts from target vs user profile
   * FR-006: Support tone presets (Professional, Casual, Enthusiastic)
   * FR-007: Support length options (short, medium, long)
   * SC-001: Generate within 10 seconds
   * SC-002: Include at least 2 specific references to target profile
   *
   * @param analysis - Profile analysis results
   * @param userProfile - User's profile for personalization
   * @param options - Tone and length preferences
   * @returns Generated message draft with annotations
   *
   * @throws {GenerationError} When LLM generation fails
   * @throws {RateLimitError} When API rate limit exceeded
   */
  generateMessage(
    analysis: ProfileAnalysis,
    userProfile: UserProfile,
    options: MessageGenerationOptions,
  ): Promise<MessageDraft>;

  /**
   * Regenerate message with different tone
   *
   * FR-006: Allow tone adjustment
   * FR-008: Preserve manual edits
   *
   * @param draft - Existing message draft
   * @param newTone - Desired tone
   * @returns Updated message draft (new version)
   */
  changeTone(
    draft: MessageDraft,
    newTone: TonePreset,
  ): Promise<MessageDraft>;

  /**
   * Regenerate message with different length
   *
   * FR-007: Allow length adjustment
   * FR-008: Preserve manual edits
   *
   * @param draft - Existing message draft
   * @param newLength - Desired length
   * @returns Updated message draft (new version)
   */
  changeLength(
    draft: MessageDraft,
    newLength: MessageLength,
  ): Promise<MessageDraft>;

  /**
   * Apply manual edit to message draft
   *
   * FR-008: Allow manual editing
   *
   * @param draft - Existing message draft
   * @param edit - Text changes to apply
   * @returns Updated draft with edit recorded
   */
  applyManualEdit(
    draft: MessageDraft,
    edit: ManualEdit,
  ): MessageDraft;

  /**
   * Validate that message meets quality criteria
   *
   * SC-002: At least 2 specific references to target profile
   *
   * @param draft - Message draft to validate
   * @returns Validation result
   */
  validateMessage(draft: MessageDraft): MessageValidation;

  /**
   * Copy message to clipboard
   *
   * FR-009: One-click copy function
   *
   * @param draft - Message to copy
   * @returns Success status
   */
  copyToClipboard(draft: MessageDraft): Promise<boolean>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface MessageGenerationOptions {
  tone: TonePreset;
  length: MessageLength;
  includeSubject?: boolean; // For email drafts
}

export interface ManualEdit {
  oldText: string;
  newText: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface MessageValidation {
  valid: boolean;
  targetReferences: number; // Should be >= 2
  wordCount: number;
  warnings: string[];
  errors: string[];
}

// ============================================================================
// Chrome Runtime Message API
// ============================================================================

/**
 * Message-based API for UI ↔ background worker communication
 */

export type MessageServiceMessage =
  | GenerateMessageMessage
  | ChangeToneMessage
  | ChangeLengthMessage
  | ApplyManualEditMessage
  | CopyToClipboardMessage;

export interface GenerateMessageMessage {
  type: 'GENERATE_MESSAGE';
  payload: {
    analysisId: string;
    userProfileId: string;
    options: MessageGenerationOptions;
  };
}

export interface ChangeToneMessage {
  type: 'CHANGE_TONE';
  payload: {
    draftId: string;
    newTone: TonePreset;
  };
}

export interface ChangeLengthMessage {
  type: 'CHANGE_LENGTH';
  payload: {
    draftId: string;
    newLength: MessageLength;
  };
}

export interface ApplyManualEditMessage {
  type: 'APPLY_MANUAL_EDIT';
  payload: {
    draftId: string;
    edit: ManualEdit;
  };
}

export interface CopyToClipboardMessage {
  type: 'COPY_TO_CLIPBOARD';
  payload: {
    draftId: string;
  };
}

export type MessageServiceResponse =
  | GenerateMessageResponse
  | ChangeToneResponse
  | ChangeLengthResponse
  | ApplyManualEditResponse
  | CopyToClipboardResponse;

export interface GenerateMessageResponse {
  type: 'GENERATE_MESSAGE_RESPONSE';
  success: boolean;
  data?: MessageDraft;
  error?: GenerationError;
}

export interface ChangeToneResponse {
  type: 'CHANGE_TONE_RESPONSE';
  success: boolean;
  data?: MessageDraft;
  error?: GenerationError;
}

export interface ChangeLengthResponse {
  type: 'CHANGE_LENGTH_RESPONSE';
  success: boolean;
  data?: MessageDraft;
  error?: GenerationError;
}

export interface ApplyManualEditResponse {
  type: 'APPLY_MANUAL_EDIT_RESPONSE';
  success: boolean;
  data: MessageDraft;
}

export interface CopyToClipboardResponse {
  type: 'COPY_TO_CLIPBOARD_RESPONSE';
  success: boolean;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface GenerationError {
  code: GenerationErrorCode;
  message: string;
  retryable: boolean;
  details?: unknown;
}

export enum GenerationErrorCode {
  LLM_API_ERROR = 'LLM_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  INSUFFICIENT_CONTEXT = 'INSUFFICIENT_CONTEXT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number, // seconds
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class GenerationFailedError extends Error {
  constructor(
    message: string,
    public code: GenerationErrorCode,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'GenerationFailedError';
  }
}

// ============================================================================
// Streaming API (Future Enhancement)
// ============================================================================

/**
 * Stream message generation progress
 * Enables real-time UI updates as message is generated
 */

export interface StreamingGenerationOptions
  extends MessageGenerationOptions {
  onProgress: (chunk: GenerationProgressChunk) => void;
}

export interface GenerationProgressChunk {
  type: 'thinking' | 'writing' | 'annotating' | 'complete';
  text?: string; // Partial message text
  annotations?: Annotation[]; // Partial annotations
  progress: number; // 0-100
}

// ============================================================================
// Tone Configuration
// ============================================================================

/**
 * Tone definitions for message generation
 * Ref: research.md #1 (LLM Provider Selection)
 */

export const TONE_DEFINITIONS: Record<TonePreset, ToneDefinition> = {
  professional: {
    name: 'Professional',
    description: 'Formal, respectful, business-appropriate',
    promptModifier:
      'Use a professional, formal tone. Address the recipient respectfully.',
    examples: ['Dear', 'I hope this message finds you well', 'Best regards'],
  },
  casual: {
    name: 'Casual',
    description: 'Friendly, approachable, conversational',
    promptModifier:
      'Use a casual, friendly tone. Be conversational and approachable.',
    examples: ['Hi', 'Hope you're doing well', 'Cheers'],
  },
  enthusiastic: {
    name: 'Enthusiastic',
    description: 'Energetic, positive, excited',
    promptModifier:
      'Use an enthusiastic, energetic tone. Show genuine excitement.',
    examples: [
      'I'm really excited to',
      'Your work on X is amazing',
      'Looking forward to',
    ],
  },
};

export interface ToneDefinition {
  name: string;
  description: string;
  promptModifier: string;
  examples: string[];
}

// ============================================================================
// Length Configuration
// ============================================================================

/**
 * Length definitions for message generation
 * Ref: data-model.md (MessageDraft validation rules)
 */

export const LENGTH_DEFINITIONS: Record<MessageLength, LengthDefinition> = {
  short: {
    name: 'Short',
    description: 'Brief and to the point',
    wordCount: { min: 50, max: 100 },
    promptModifier: 'Keep the message concise, 50-100 words.',
  },
  medium: {
    name: 'Medium',
    description: 'Balanced detail',
    wordCount: { min: 100, max: 200 },
    promptModifier: 'Write a medium-length message, 100-200 words.',
  },
  long: {
    name: 'Long',
    description: 'Detailed and thorough',
    wordCount: { min: 200, max: 300 },
    promptModifier:
      'Write a comprehensive message with detail, 200-300 words.',
  },
};

export interface LengthDefinition {
  name: string;
  description: string;
  wordCount: { min: number; max: number };
  promptModifier: string;
}

// ============================================================================
// Implementation Notes
// ============================================================================

/**
 * LangChain.js Integration:
 * - Use two-chain architecture (see research.md #4)
 * - Chain 1: Profile Analyzer (already done by ProfileService)
 * - Chain 2: Message Generator (this service)
 *
 * Caching Strategy:
 * - Cache generated drafts for 7 days
 * - On tone/length change, create new version (don't regenerate from scratch)
 * - Manual edits are preserved across regenerations
 *
 * Performance:
 * - Target < 10 seconds for initial generation (SC-001)
 * - Tone/length changes should be < 5 seconds (reuse analysis)
 * - Consider streaming API for real-time feedback
 *
 * Quality Assurance:
 * - Validate at least 2 target profile references (SC-002)
 * - Check word count matches length setting
 * - Ensure tone matches preset
 * - Log quality metrics for monitoring
 */
