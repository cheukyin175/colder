# Data Model: Colder Extension

**Feature**: LinkedIn Cold Outreach AI Assistant
**Date**: 2025-10-13
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data structures and entities used throughout the Colder extension. All entities are stored locally using Chrome Storage API (sync or local storage depending on data type).

## Core Entities

### 1. User Profile

**Purpose**: Represents the extension user's professional information used to personalize all generated messages.

**Storage**: `chrome.storage.sync` (synced across user's Chrome browsers)

**TypeScript Interface**:

```typescript
interface UserProfile {
  // Identity
  id: string;                    // UUID v4
  email: string;                 // User's email address
  name: string;                  // Full name

  // Professional info
  currentRole: string;           // e.g., "Senior Product Manager"
  currentCompany: string;        // e.g., "Acme Corp"

  // Background & value proposition
  professionalBackground: string; // 2-3 sentence summary
  careerGoals: string;           // What they're looking for
  outreachObjectives: string;    // Why they're reaching out
  valuePropositio: string;       // What they offer

  // Configuration
  defaultTone: TonePreset;       // 'professional' | 'casual' | 'enthusiastic'
  defaultLength: MessageLength;  // 'short' | 'medium' | 'long'

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completeness: number;          // 0-100% profile completeness score
}
```

**Validation Rules** (from FR-002):
- All fields required except `careerGoals` and `outreachObjectives` (optional)
- `email` must be valid email format
- `professionalBackground` max 500 characters
- `valuePropositio` max 300 characters
- `completeness` calculated based on filled fields

**State Transitions**:
1. Initial state: Empty profile on first install
2. Onboarding: User fills required fields → `completeness` increases
3. Complete: All required fields filled → `completeness = 100`
4. Updated: User edits fields → `updatedAt` timestamp updated

---

### 2. Target Profile

**Purpose**: Represents a LinkedIn profile being analyzed for outreach.

**Storage**: `chrome.storage.local` (not synced, cached temporarily)

**TypeScript Interface**:

```typescript
interface TargetProfile {
  // Identity
  id: string;                    // Hash of LinkedIn profile URL
  linkedinUrl: string;           // Full LinkedIn profile URL
  name: string;                  // Full name

  // Current position
  currentJobTitle: string | null;
  currentCompany: string | null;
  companyLinkedinUrl: string | null;

  // Work history
  workExperience: WorkExperience[];

  // Education
  education: Education[];

  // Activity & engagement
  recentPosts: LinkedInPost[];   // Last 5 posts
  skills: string[];              // Listed skills

  // Connection context
  mutualConnections: number;     // Count of mutual connections

  // Extraction metadata
  extractedAt: Date;
  extractionQuality: ExtractionQuality; // 'complete' | 'partial' | 'minimal'
  missingFields: string[];       // List of fields that couldn't be extracted
}

interface WorkExperience {
  title: string;
  company: string;
  startDate: string;             // ISO date or "Present"
  endDate: string | null;
  duration: string;              // e.g., "2 yrs 3 mos"
  description: string | null;
}

interface Education {
  institution: string;
  degree: string;
  field: string | null;
  graduationYear: number | null;
}

interface LinkedInPost {
  content: string;               // Post text (first 500 chars)
  postedAt: Date;
  engagement: {
    likes: number;
    comments: number;
  };
}

type ExtractionQuality = 'complete' | 'partial' | 'minimal';
```

**Validation Rules** (from FR-001, FR-013):
- Minimum required: `name`, `linkedinUrl`
- If `currentJobTitle` or `currentCompany` missing → `extractionQuality = 'partial'`
- If both missing → `extractionQuality = 'minimal'`
- `missingFields` populated to inform user (FR-012)

**Lifecycle**:
1. Extracted from LinkedIn DOM
2. Cached in local storage (TTL: 24 hours)
3. Used for profile analysis
4. Discarded after 24 hours (privacy consideration)

---

### 3. Profile Analysis

**Purpose**: Structured analysis of target profile, used as input for message generation.

**Storage**: `chrome.storage.local` (temporary, tied to target profile)

**TypeScript Interface**:

```typescript
interface ProfileAnalysis {
  // Reference
  targetProfileId: string;       // FK to TargetProfile
  userProfileId: string;         // FK to UserProfile

  // Analysis results
  talkingPoints: TalkingPoint[];
  mutualInterests: string[];
  connectionOpportunities: string[];

  // Recommendations
  suggestedApproach: string;     // e.g., "Lead with shared interest in AI"
  cautionFlags: string[];        // e.g., "Profile has minimal info"

  // Metadata
  analyzedAt: Date;
  modelUsed: string;             // e.g., "gpt-4o-2024-08-06"
  tokensUsed: number;
}

interface TalkingPoint {
  topic: string;                 // e.g., "Recent career transition"
  relevance: 'high' | 'medium' | 'low';
  context: string;               // Why this is relevant
  sourceField: string;           // e.g., "workExperience[0]"
}
```

**Validation Rules** (from FR-003):
- Must identify at least 1 talking point for `extractionQuality = 'complete'`
- Can have 0 talking points for `extractionQuality = 'minimal'`
- `connectionOpportunities` derived from comparing user + target profiles

---

### 4. Message Draft

**Purpose**: Generated cold message with metadata and customization options.

**Storage**: `chrome.storage.local` (temporary until copied/sent)

**TypeScript Interface**:

```typescript
interface MessageDraft {
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

interface Annotation {
  text: string;                  // Portion of message
  source: 'target_profile' | 'user_profile' | 'generated';
  sourceField: string | null;    // e.g., "currentJobTitle", "recentPosts[0]"
  highlight: boolean;            // Whether to highlight in UI
}

interface MessageEdit {
  timestamp: Date;
  oldText: string;
  newText: string;
  editType: 'manual' | 'tone_change' | 'length_change';
}

type TonePreset = 'professional' | 'casual' | 'enthusiastic';
type MessageLength = 'short' | 'medium' | 'long';
```

**Validation Rules** (from FR-004, FR-005, FR-006, FR-007, FR-008):
- `body` must include at least 2 annotations from `target_profile` (SC-002)
- Tone must be one of predefined presets (FR-006)
- Length options enforce word count ranges:
  - `short`: 50-100 words
  - `medium`: 100-200 words
  - `long`: 200-300 words
- Manual edits preserved across tone/length changes (FR-008)

**State Transitions**:
1. Initial: Generated with default tone/length
2. Customized: User changes tone/length → new version created
3. Edited: User manually edits text → `manualEdits` appended
4. Finalized: User copies to clipboard → Ready for sending
5. Archived: Moved to OutreachHistory on send

---

### 5. Outreach History

**Purpose**: Record of previous contacts to prevent duplicate outreach.

**Storage**: `chrome.storage.local` for free plan, `chrome.storage.sync` for paid plan

**TypeScript Interface**:

```typescript
interface OutreachHistory {
  // Identity
  id: string;                    // UUID v4

  // Minimal target information (MVP scope)
  targetName: string;            // Contact name
  targetLinkedinUrl: string;     // LinkedIn profile URL

  // Interaction metadata
  contactedAt: Date;             // When message was sent

  // Plan-based retention
  expiresAt: Date | null;        // Null for paid plan (indefinite retention)
}
```

**MVP Scope Note**: For MVP, we only store essential fields for duplicate detection (name, URL, timestamp). Full message content, user notes, and detailed metadata will be added post-MVP if needed.

**Validation Rules** (from FR-014, FR-015):
- Free plan: `expiresAt = contactedAt + 5 days`
- Paid plan: `expiresAt = null` (never expires)
- Duplicate check: Query by `targetLinkedinUrl` before allowing new outreach
- If contacted within retention period → show warning (FR-015)

**Lifecycle**:
1. Created when message sent
2. Free plan: Auto-deleted after 5 days (`expiresAt` passed)
3. Paid plan: Retained indefinitely
4. Can be manually deleted by user

**Indexes** (for performance per SC-006):
- Primary: `id`
- Secondary: `targetLinkedinUrl` (duplicate check - critical for FR-015)
- Search: `targetName` (simple name search)
- Date range: `contactedAt` (for history display)

---

### 6. Subscription Plan

**Purpose**: Tracks user's subscription tier and feature access.

**Storage**: `chrome.storage.sync` (synced across browsers)

**TypeScript Interface**:

```typescript
interface SubscriptionPlan {
  // Identity
  userId: string;                // FK to UserProfile

  // Plan details
  plan: PlanTier;
  status: PlanStatus;

  // Billing
  purchasedAt: Date | null;
  expiresAt: Date | null;        // Null for free plan
  licenseKey: string | null;     // For paid plan activation

  // Feature flags
  features: PlanFeatures;

  // Usage tracking (for rate limiting)
  monthlyUsage: {
    messagesGenerated: number;
    resetDate: Date;
  };
}

type PlanTier = 'free' | 'paid';

type PlanStatus = 'active' | 'expired' | 'trial' | 'cancelled';

interface PlanFeatures {
  historyRetentionDays: number | null;  // Null = indefinite
  monthlyMessageLimit: number | null;   // Null = unlimited
  yoloModeEnabled: boolean;
  prioritySupport: boolean;
  customToneEnabled: boolean;           // Future feature
}
```

**Validation Rules** (from FR-017, FR-018):
- Free plan features:
  - `historyRetentionDays = 5`
  - `monthlyMessageLimit = 50`
  - `yoloModeEnabled = false`
- Paid plan features:
  - `historyRetentionDays = null` (indefinite)
  - `monthlyMessageLimit = null` (unlimited)
  - `yoloModeEnabled = true`

**State Transitions**:
1. New user: `plan = 'free'`, `status = 'active'`
2. Purchases paid plan: `plan = 'paid'`, enters `licenseKey`
3. Paid plan expires: `status = 'expired'` → reverts to free tier
4. Cancels: `status = 'cancelled'` → reverts to free tier at end of billing period

---

### 7. Extension Settings

**Purpose**: User preferences and configuration.

**Storage**: `chrome.storage.sync` (synced across browsers)

**TypeScript Interface**:

```typescript
interface ExtensionSettings {
  // API Configuration
  openrouterApiKey: string | null;   // User-provided OpenRouter API key (encrypted)
  openrouterModel: string;           // Default: 'openai/gpt-4o'
  gmailConnected: boolean;
  gmailOAuthToken: string | null;    // Stored in chrome.storage.local for security

  // UI Preferences
  theme: 'light' | 'dark' | 'auto';
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
```

**Validation Rules**:
- `openrouterApiKey` validated on first use with test API call to OpenRouter
- `openrouterModel` must be valid OpenRouter model ID (e.g., 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet')
- `yoloModeEnabled` can only be `true` if user has paid plan (FR-018)
- `gmailOAuthToken` stored separately in `chrome.storage.local` (more secure)

---

## Data Relationships

```
UserProfile (1) ──┬── (many) MessageDraft
                  ├── (many) ProfileAnalysis
                  ├── (many) OutreachHistory
                  └── (1) SubscriptionPlan

TargetProfile (1) ─┬── (many) ProfileAnalysis
                   ├── (many) MessageDraft
                   └── (1) OutreachHistory

ProfileAnalysis (1) ── (many) MessageDraft

MessageDraft (1) ── (1) OutreachHistory (when sent)
```

## Storage Strategy

### Chrome Storage Sync (max 100KB total)
- `UserProfile` (~5KB)
- `SubscriptionPlan` (~1KB)
- `ExtensionSettings` (~2KB)
- **Total: ~8KB** (well under limit)

### Chrome Storage Local (max 10MB total)
- `TargetProfile[]` (cached, ~2KB each, max 50 = 100KB)
- `ProfileAnalysis[]` (~5KB each, max 50 = 250KB)
- `MessageDraft[]` (~3KB each, max 100 = 300KB)
- `OutreachHistory[]` (minimal fields: ~0.5KB each, free: 5-day retention ~50 entries = 25KB, paid: unlimited but paginated)
- `gmailOAuthToken` (~1KB)
- **Estimated total: ~800KB** (well under limit)

### Cache Expiration
- `TargetProfile`: 24 hours
- `ProfileAnalysis`: 24 hours
- `MessageDraft`: 7 days (if not sent)
- Cleanup task runs daily in background worker

## Data Migration Strategy

**Version 1.0.0**: Initial schema (this document)

**Future versions**: Migration scripts in `src/migrations/`

Example migration path:
1. Detect schema version in storage
2. Run migration functions sequentially
3. Update schema version
4. Handle errors gracefully (preserve user data)

## Privacy & Security

### Sensitive Data
- **API Keys**: OpenRouter API key stored in `chrome.storage.sync` (encrypted by Chrome)
- **OAuth Tokens**: Gmail OAuth tokens stored in `chrome.storage.local` (encrypted by Chrome)
- **User Profile**: Stored locally, never transmitted except to OpenRouter/Gmail APIs

### Data Retention
- Target profiles: 24 hours (privacy consideration)
- Free plan history: 5 days (automatic deletion)
- Paid plan history: User-controlled deletion

### Encryption
- Chrome handles encryption for `chrome.storage.sync` and `chrome.storage.local`
- No additional encryption needed for MVP
- Future: Consider additional encryption layer for sensitive fields

## Summary

| Entity | Storage | Retention | Size Est. |
|--------|---------|-----------|-----------|
| UserProfile | sync | Indefinite | ~5KB |
| TargetProfile | local | 24 hours | ~2KB each |
| ProfileAnalysis | local | 24 hours | ~5KB each |
| MessageDraft | local | 7 days | ~3KB each |
| OutreachHistory | local/sync | 5 days (free) / Indefinite (paid) | ~0.5KB each |
| SubscriptionPlan | sync | Indefinite | ~1KB |
| ExtensionSettings | sync | Indefinite | ~2KB |

**Total storage budget**: ~800KB / 10MB local, ~8KB / 100KB sync ✅
