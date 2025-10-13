/**
 * Extension Settings Model
 * User preferences and configuration.
 */

import { Theme, DEFAULTS } from './types';

export interface ExtensionSettings {
  // API Configuration
  openrouterApiKey: string | null;   // User-provided OpenRouter API key (encrypted)
  openrouterModel: string;           // Default: 'openai/gpt-4o'
  gmailConnected: boolean;
  gmailOAuthToken: string | null;    // Stored in chrome.storage.local for security

  // UI Preferences
  theme: Theme;
  notificationsEnabled: boolean;

  // Feature toggles
  yoloModeEnabled: boolean;      // Requires paid plan
  autoSaveHistory: boolean;

  // Privacy
  telemetryEnabled: boolean;     // Anonymous usage stats

  // Advanced
  customPrompts: boolean;        // Future feature
  debugMode: boolean;
}

/**
 * Create default extension settings
 */
export function createDefaultSettings(): ExtensionSettings {
  return {
    openrouterApiKey: null,
    openrouterModel: DEFAULTS.model,
    gmailConnected: false,
    gmailOAuthToken: null,
    theme: DEFAULTS.theme,
    notificationsEnabled: true,
    yoloModeEnabled: false,
    autoSaveHistory: true,
    telemetryEnabled: false,
    customPrompts: false,
    debugMode: false
  };
}

/**
 * Validate OpenRouter API key format
 * OpenRouter keys typically start with 'sk-or-v1-'
 */
export function isValidOpenRouterKey(key: string): boolean {
  if (!key || key.trim().length === 0) {
    return false;
  }

  // Basic validation - OpenRouter keys usually follow this pattern
  return key.startsWith('sk-or-') || key.startsWith('sk-');
}

/**
 * List of available OpenRouter models
 * This is a subset of popular models - full list should be fetched from API
 */
export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o (Latest)', provider: 'OpenAI' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'meta-llama/llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta' }
];

/**
 * Validate selected model
 */
export function isValidModel(modelId: string): boolean {
  return AVAILABLE_MODELS.some(model => model.id === modelId);
}

/**
 * Mask API key for display
 */
export function maskApiKey(key: string | null): string {
  if (!key) return '';

  const visibleChars = 8;
  if (key.length <= visibleChars) {
    return '*'.repeat(key.length);
  }

  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  return `${start}...${end}`;
}

/**
 * Check if settings are complete enough to use the extension
 */
export function areSettingsComplete(settings: ExtensionSettings): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!settings.openrouterApiKey) {
    missingFields.push('OpenRouter API key');
  }

  if (!settings.openrouterModel || !isValidModel(settings.openrouterModel)) {
    missingFields.push('Valid AI model selection');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}

/**
 * Export settings for backup (excludes sensitive data)
 */
export function exportSettings(settings: ExtensionSettings): Partial<ExtensionSettings> {
  const { openrouterApiKey, gmailOAuthToken, ...exportable } = settings;
  return exportable;
}

/**
 * Import settings from backup
 */
export function importSettings(
  current: ExtensionSettings,
  imported: Partial<ExtensionSettings>
): ExtensionSettings {
  // Don't import sensitive fields
  const { openrouterApiKey, gmailOAuthToken, ...safeImported } = imported;

  return {
    ...current,
    ...safeImported
  };
}

/**
 * Get theme based on system preference
 */
export function resolveTheme(settings: ExtensionSettings): 'light' | 'dark' {
  if (settings.theme !== 'auto') {
    return settings.theme;
  }

  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  return 'light'; // Default to light if can't detect
}