/**
 * Message Draft Model
 * Generated cold message with metadata and customization options.
 */

import { TonePreset, MessageLength, AnnotationSource, EditType } from './types';

export interface MessageDraft {
  // Identity
  id: string;                    // UUID v4
  targetProfileId: string;       // FK to TargetProfile
  analysisId: string;            // FK to ProfileAnalysis

  // Message content
  subject: string;               // For email
  body: string;                  // Message text
  annotations: Annotation[];     // Source attribution for each part

  // Customization settings
  tone: TonePreset;
  length: MessageLength;

  // Generation metadata
  generatedAt: Date;
  modelUsed: string;
  tokensUsed: number;
  generationTime: number;        // Milliseconds

  // Edit history
  manualEdits: MessageEdit[];
  version: number;               // Increments on regeneration
}

export interface Annotation {
  text: string;                  // Portion of message
  source: AnnotationSource;      // 'target_profile' | 'user_profile' | 'generated'
  sourceField: string | null;    // e.g., "currentJobTitle", "recentPosts[0]"
  highlight: boolean;            // Whether to highlight in UI
}

export interface MessageEdit {
  timestamp: Date;
  oldText: string;
  newText: string;
  editType: EditType;            // 'manual' | 'tone_change' | 'length_change'
}

/**
 * Create a new message draft
 */
export function createMessageDraft(
  targetProfileId: string,
  analysisId: string,
  data: Partial<MessageDraft>
): MessageDraft {
  return {
    id: crypto.randomUUID(),
    targetProfileId,
    analysisId,
    subject: '',
    body: '',
    annotations: [],
    tone: 'professional',
    length: 'medium',
    generatedAt: new Date(),
    modelUsed: 'gpt-4o',
    tokensUsed: 0,
    generationTime: 0,
    manualEdits: [],
    version: 1,
    ...data
  };
}

/**
 * Count words in message body
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Validate message meets requirements (SC-002: at least 2 target references)
 */
export function validateMessage(draft: MessageDraft): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for minimum target profile references
  const targetAnnotations = draft.annotations.filter(
    a => a.source === 'target_profile'
  );

  if (targetAnnotations.length < 2) {
    errors.push('Message must include at least 2 references to the target profile');
  }

  // Check word count is within range for selected length
  const wordCount = countWords(draft.body);
  const lengthRanges = {
    short: { min: 50, max: 100 },
    medium: { min: 100, max: 200 },
    long: { min: 200, max: 300 }
  };

  const range = lengthRanges[draft.length];
  if (wordCount < range.min || wordCount > range.max) {
    errors.push(`Message should be ${range.min}-${range.max} words (currently ${wordCount})`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Apply manual edit to message
 */
export function applyManualEdit(
  draft: MessageDraft,
  oldText: string,
  newText: string
): MessageDraft {
  const updatedDraft = { ...draft };

  // Update body
  updatedDraft.body = updatedDraft.body.replace(oldText, newText);

  // Record edit
  updatedDraft.manualEdits.push({
    timestamp: new Date(),
    oldText,
    newText,
    editType: 'manual'
  });

  // Update annotations if necessary
  updatedDraft.annotations = updatedDraft.annotations.map(annotation => {
    if (annotation.text === oldText) {
      return { ...annotation, text: newText };
    }
    return annotation;
  });

  return updatedDraft;
}

/**
 * Increment version for regeneration
 */
export function incrementVersion(draft: MessageDraft, editType: EditType): MessageDraft {
  return {
    ...draft,
    version: draft.version + 1,
    manualEdits: [
      ...draft.manualEdits,
      {
        timestamp: new Date(),
        oldText: draft.body,
        newText: '', // Will be filled with new generation
        editType
      }
    ]
  };
}

/**
 * Get annotations by source type
 */
export function getAnnotationsBySource(
  draft: MessageDraft,
  source: AnnotationSource
): Annotation[] {
  return draft.annotations.filter(a => a.source === source);
}

/**
 * Check if message draft has expired (7 days)
 */
export function isDraftExpired(draft: MessageDraft): boolean {
  const now = Date.now();
  const generatedAt = draft.generatedAt.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return (now - generatedAt) > sevenDays;
}