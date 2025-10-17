/**
 * Extension Types
 * Re-export types from services for consistency
 */

// Re-export Chrome AI types
export type {
  MessageDraft,
  PolishedMessage,
  TargetProfile
} from '../services/chrome-ai';

export type {
  MessageGeneratorOptions,
  UserProfile
} from '../services/prompts';

export type {
  ExtensionSettings,
  StoredMessage
} from '../services/storage';

// Import for function implementation
import type { ExtensionSettings as ExtensionSettingsType } from '../services/storage';

// Create default settings
export function createDefaultSettings(): ExtensionSettingsType {
  return {
    userName: '',
    userRole: '',
    userCompany: '',
    userBackground: '',
    userValueProposition: ''
  };
}
