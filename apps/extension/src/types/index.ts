/**
 * Extension Types
 * Simple types for the extension UI (backend handles full data models)
 */

// Message draft response from backend
export interface MessageDraft {
  body: string;
  wordCount: number;
}

// User settings stored in backend
export interface ExtensionSettings {
  userName: string;
  userRole: string;
  userCompany: string;
  userBackground: string;
  userValueProposition: string;
}

// LinkedIn profile data extracted from content script
export interface TargetProfile {
  id: string;
  linkedinUrl: string;
  name: string;
  currentJobTitle: string | null;
  currentCompany: string | null;
  rawProfileText: string;
  extractedAt: Date;
}

// Create default settings
export function createDefaultSettings(): ExtensionSettings {
  return {
    userName: '',
    userRole: '',
    userCompany: '',
    userBackground: '',
    userValueProposition: ''
  };
}
