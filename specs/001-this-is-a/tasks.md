# Implementation Tasks: LinkedIn Cold Outreach AI Assistant (Colder)

**Feature Branch**: `001-this-is-a`
**Date**: 2025-10-13
**Status**: Ready for Implementation

## Overview

This document breaks down the implementation into executable tasks organized by user story priority. Each user story represents an independently testable increment of functionality.

**MVP Recommendation**: Focus on User Story 1 (P1) first for fastest value delivery.

## Task Summary

- **Total Tasks**: 52
- **Setup Tasks**: 8
- **Foundational Tasks**: 7
- **User Story 1 (P1)**: 15 tasks
- **User Story 2 (P2)**: 8 tasks
- **User Story 3 (P3)**: 8 tasks
- **User Story 4 (P4)**: 6 tasks

## Dependencies

```
Phase 1: Setup (T001-T008)
    ↓
Phase 2: Foundational (T009-T015)
    ↓
Phase 3: User Story 1 [P1] (T016-T030) ← MVP SCOPE
    ↓
Phase 4: User Story 2 [P2] (T031-T038) ← Can start after foundational
    ↓
Phase 5: User Story 3 [P3] (T039-T046) ← Depends on US1
    ↓
Phase 6: User Story 4 [P4] (T047-T052) ← Depends on US1

Note: US2 and US1 can be developed in parallel after foundational tasks complete.
```

---

## Phase 1: Project Setup

**Goal**: Initialize Plasmo project with all dependencies and configurations.

### T001 [P]: Initialize Plasmo Project
**File**: `package.json`, `tsconfig.json`
**Description**: Create new Plasmo project with TypeScript, React, and Tailwind CSS.
```bash
pnpm create plasmo colder
cd colder
pnpm install
```
Install dependencies:
- `langchain @langchain/openai`
- `react react-dom tailwindcss`
- Dev: `@types/chrome vitest @playwright/test`

**Acceptance**: Project builds successfully with `pnpm dev`.

### T002 [P]: Configure TypeScript
**File**: `tsconfig.json`
**Description**: Set up strict TypeScript configuration for extension development.
- Enable strict mode
- Configure paths for `src/` imports
- Set target to ES2022
- Include Chrome types

**Acceptance**: No TypeScript errors on empty project.

### T003 [P]: Setup Tailwind CSS
**File**: `tailwind.config.js`, `src/styles/global.css`
**Description**: Initialize Tailwind CSS with extension-appropriate configuration.
- Run `pnpm dlx tailwindcss init`
- Configure content paths for `src/**/*.{ts,tsx}`
- Set up global styles with Tailwind directives

**Acceptance**: Tailwind classes work in React components.

### T004 [P]: Configure Plasmo Manifest
**File**: `package.json` (manifest overrides)
**Description**: Configure Chrome extension manifest v3 settings.
- Add LinkedIn host permissions: `https://www.linkedin.com/*`
- Add permissions: storage, identity, tabs, activeTab
- Configure content script injection
- Set up icons

**Acceptance**: Extension loads in Chrome with correct permissions.

### T005 [P]: Create Environment Configuration
**File**: `.env.example`, `.env`, `.gitignore`
**Description**: Set up environment variables for API keys.
Create `.env.example`:
```
PLASMO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
```
Add `.env` to `.gitignore`.

**Acceptance**: Environment variables load correctly in extension.

### T006 [P]: Setup Testing Framework
**File**: `vitest.config.ts`, `tests/setup.ts`
**Description**: Configure Vitest for unit/integration testing.
- Install Vitest and testing libraries
- Configure Chrome API mocks
- Set up test utilities

**Acceptance**: Sample test runs successfully with `pnpm test`.

### T007 [P]: Setup E2E Testing
**File**: `playwright.config.ts`, `tests/e2e/setup.ts`
**Description**: Configure Playwright for Chrome extension testing.
- Install Playwright
- Configure extension loading in tests
- Set up test fixtures for LinkedIn pages

**Acceptance**: Playwright can load extension and navigate to test page.

### T008 [P]: Create Project Structure
**File**: Directory structure
**Description**: Create all source directories per plan.md structure.
```bash
mkdir -p src/{background/agent/prompts,content,popup/components,tabs,services,models,utils,styles}
mkdir -p tests/{unit/{services,models,utils},integration/{agent,storage,gmail},e2e}
mkdir -p assets
```

**Acceptance**: All directories exist and are properly structured.

**✓ Checkpoint**: Project is fully initialized and ready for foundational development.

---

## Phase 2: Foundational Layer

**Goal**: Implement core models, utilities, and services that ALL user stories depend on.

### T009 [P]: Create TypeScript Model Definitions
**File**: `src/models/*.ts`
**Description**: Implement all TypeScript interfaces from data-model.md.
- `src/models/user-profile.ts` - UserProfile interface
- `src/models/target-profile.ts` - TargetProfile, WorkExperience, Education, LinkedInPost
- `src/models/profile-analysis.ts` - ProfileAnalysis, TalkingPoint
- `src/models/message-draft.ts` - MessageDraft, Annotation, MessageEdit
- `src/models/outreach-history.ts` - OutreachHistory (minimal MVP version)
- `src/models/subscription-plan.ts` - SubscriptionPlan, PlanFeatures
- `src/models/extension-settings.ts` - ExtensionSettings
- `src/models/types.ts` - Shared types (TonePreset, MessageLength, ExtractionQuality, etc.)

**Acceptance**: All models match data-model.md specifications, compile without errors.

### T010 [P]: Implement LinkedIn Selectors Utility
**File**: `src/utils/linkedin-selectors.ts`
**Description**: Create multi-fallback selector patterns for LinkedIn DOM elements.
Implement selector functions for:
- Name extraction (3+ fallback selectors)
- Job title extraction (3+ fallback selectors)
- Company extraction (3+ fallback selectors)
- Work experience extraction
- Recent posts extraction

Each function should try multiple selectors and return null gracefully if none match.

**Acceptance**: Unit tests pass for selector fallback logic.

### T011 [P]: Implement Error Handlers Utility
**File**: `src/utils/error-handlers.ts`
**Description**: Create error handling utilities for extension.
- ExtractionError handling (FR-012)
- API error handling (OpenRouter, Gmail)
- Storage quota errors
- Network errors
- User-friendly error messages

**Acceptance**: Error handlers work correctly and provide clear messages.

### T012 [P]: Implement Validators Utility
**File**: `src/utils/validators.ts`
**Description**: Create data validation functions.
- Email validation
- OpenRouter API key validation
- Profile completeness calculation
- Message draft validation (SC-002: at least 2 target references)
- Word count validation for message lengths

**Acceptance**: All validation functions work correctly with edge cases.

### T013: Implement Storage Service Foundation
**File**: `src/services/storage-service.ts`
**Description**: Implement Chrome Storage API wrapper per contracts/storage-service.ts.
Core methods (other methods will be added in user story phases):
- `getUserProfile()` / `saveUserProfile()`
- `getSettings()` / `saveSettings()`
- `getStorageUsage()`
- `clearAllData()`

Use storage keys from data-model.md. Handle sync vs local storage appropriately.

**Acceptance**: Storage operations work correctly, data persists across sessions.

### T014: Implement Background Message Handler
**File**: `src/background/message-handler.ts`
**Description**: Create Chrome runtime message handler for communication between contexts.
- Set up message type routing
- Implement request/response pattern
- Add error handling for messages
- Support ProfileService, MessageService, StorageService messages

**Acceptance**: Background worker receives and routes messages correctly.

### T015: Create Background Worker Entry Point
**File**: `src/background/index.ts`
**Description**: Set up Plasmo background service worker.
- Import message handler
- Set up service worker lifecycle management
- Keep worker alive during active use
- Initialize storage cleanup alarms

**Acceptance**: Background worker loads and stays alive during extension use.

**✓ Checkpoint**: Foundational layer is complete. Ready for user story implementation.

---

## Phase 3: User Story 1 (P1) - Profile Analysis & Message Generation

**Story Goal**: User visits LinkedIn profile → activates extension → receives personalized message draft.

**Independent Test Criteria**:
- Install extension on LinkedIn profile page
- Click extension icon
- See profile analysis within 10 seconds (SC-001)
- Generated message includes 2+ target profile references (SC-002)
- Message displayed with annotations showing source attribution

### T016 [US1]: Implement Target Profile Model Storage
**File**: `src/services/storage-service.ts`
**Description**: Add TargetProfile storage methods to StorageService.
- `getTargetProfile(profileId)`
- `cacheTargetProfile(profile)`
- `clearExpiredTargetProfiles()` - 24h TTL

**Acceptance**: Target profiles cache and expire correctly.

### T017 [US1]: Implement Profile Analysis Model Storage
**File**: `src/services/storage-service.ts`
**Description**: Add ProfileAnalysis storage methods.
- `getProfileAnalysis(analysisId)`
- `cacheProfileAnalysis(analysis)`

**Acceptance**: Analyses cache correctly with 24h TTL.

### T018 [US1]: Implement LinkedIn Profile Extractor
**File**: `src/content/linkedin-extractor.ts`
**Description**: Extract profile data from LinkedIn DOM (FR-001, FR-010).
- Use multi-fallback selectors from `linkedin-selectors.ts`
- Extract: name, job title, company, work experience (last 2), education, recent posts (last 5)
- Calculate extraction quality (complete/partial/minimal)
- Track missing fields for user notification (FR-012)
- Handle non-profile pages gracefully (FR-010)

**Acceptance**:
- Extracts data from test LinkedIn profile HTML
- Returns correct extraction quality
- Handles missing data gracefully

### T019 [US1]: Implement Content Script
**File**: `src/content/index.ts`
**Description**: Create Plasmo content script for LinkedIn pages.
- Detect LinkedIn profile pages (use URL pattern matching)
- Listen for extension activation message
- Call profile extractor
- Send extracted data to background worker
- Handle errors and show user notifications

**Acceptance**: Content script injects successfully, extracts profiles on command.

### T020 [US1]: Implement Profile Service
**File**: `src/services/profile-service.ts`
**Description**: Implement ProfileService per contracts/profile-service.ts.
Methods:
- `extractProfile(document)` - orchestrate extraction
- `isLinkedInProfilePage(url)`  - URL validation
- `getCachedAnalysis(profileId)` - check cache

**Acceptance**: Service methods work correctly, integrate with storage.

### T021 [US1]: Create LangChain Profile Analyzer Prompt
**File**: `src/background/agent/prompts/profile-analyzer.ts`
**Description**: Create prompt template for profile analysis (FR-003).
Prompt should:
- Accept targetProfile and userProfile as inputs
- Request structured output (JSON mode)
- Identify talking points, mutual interests, connection opportunities
- Suggest approach and caution flags

Include 2-3 few-shot examples.

**Acceptance**: Prompt template compiles and formats correctly.

### T022 [US1]: Implement Profile Analyzer Agent
**File**: `src/background/agent/profile-analyzer.ts`
**Description**: Implement LangChain profile analysis chain (FR-003).
- Initialize ChatOpenAI with OpenRouter config
- Load API key from settings
- Use profile analyzer prompt
- Parse structured JSON output
- Handle API errors gracefully
- Log token usage and latency

**Acceptance**:
- Analyzes test profile and returns structured analysis
- Completes within 5 seconds
- Handles API errors

### T023 [US1]: Create LangChain Message Generator Prompt
**File**: `src/background/agent/prompts/message-generator.ts`
**Description**: Create prompt template for message generation (FR-004, FR-005).
Prompt should:
- Accept profile analysis, userProfile, tone, length
- Generate personalized message
- Include annotations for source attribution
- Reference at least 2 specific details from target profile (SC-002)
- Match tone preset (professional/casual/enthusiastic)
- Match length requirement (50-100/100-200/200-300 words)

Include few-shot examples for each tone.

**Acceptance**: Prompt generates messages matching specifications.

### T024 [US1]: Implement Message Generator Agent
**File**: `src/background/agent/message-generator.ts`
**Description**: Implement LangChain message generation chain (FR-004, FR-005, FR-006, FR-007).
- Initialize ChatOpenAI with OpenRouter config
- Use message generator prompt with tone/length parameters
- Parse response and create annotations
- Validate message (2+ target references per SC-002)
- Calculate word count
- Track generation time and tokens

**Acceptance**:
- Generates messages with correct tone/length
- Includes proper annotations
- Completes within 10 seconds total (with analysis time, SC-001)

### T025 [US1]: Implement Message Service
**File**: `src/services/message-service.ts`
**Description**: Implement MessageService per contracts/message-service.ts.
Methods for US1:
- `generateMessage(analysis, userProfile, options)` - orchestrate generation
- `validateMessage(draft)` - check SC-002 compliance

**Acceptance**: Service generates valid messages through agent.

### T026 [US1]: Add Message Draft Storage
**File**: `src/services/storage-service.ts`
**Description**: Add MessageDraft storage methods.
- `getMessageDraft(draftId)`
- `saveMessageDraft(draft)`
- `getAllMessageDrafts()`

**Acceptance**: Drafts persist correctly.

### T027 [US1]: Create Popup UI Component - Message Draft Display
**File**: `src/popup/components/MessageDraft.tsx`
**Description**: React component to display generated message (FR-005).
- Show subject and body
- Highlight annotations from target vs user profile
- Visual distinction for target_profile, user_profile, generated sources
- Display generation metadata (time, model)

**Acceptance**: Component renders message with clear source attribution.

### T028 [US1]: Create Popup UI Component - Loading State
**File**: `src/popup/components/LoadingState.tsx`
**Description**: Loading indicator during profile analysis and message generation.
- Show "Analyzing profile..." state
- Show "Generating message..." state
- Display progress if possible
- Show estimated time remaining

**Acceptance**: Loading states display correctly during generation.

### T029 [US1]: Implement Popup Main View
**File**: `src/popup/index.tsx`
**Description**: Main popup UI that orchestrates US1 flow.
- Detect current LinkedIn profile URL
- Button to "Analyze Profile" (FR-016)
- Call profile extraction → analysis → generation
- Display loading states
- Display message draft or errors
- Handle FR-012: clear error messages when extraction fails

**Acceptance**:
- Full US1 flow works end-to-end
- Profile analyzed and message generated within 10 seconds (SC-001)
- Error messages clear when applicable

### T030 [US1]: Write E2E Test for User Story 1
**File**: `tests/e2e/us1-profile-analysis.spec.ts`
**Description**: Playwright E2E test for complete US1 flow.
Test:
1. Load extension
2. Navigate to test LinkedIn profile (static HTML)
3. Click extension icon
4. Verify profile analysis appears
5. Verify message draft generated with 2+ references
6. Verify annotations displayed

**Acceptance**: E2E test passes reliably.

**✓ Checkpoint**: User Story 1 complete! MVP is functional. Users can generate personalized messages from LinkedIn profiles.

---

## Phase 4: User Story 2 (P2) - User Profile Setup & Management

**Story Goal**: User sets up their profile → information persists → used for message personalization.

**Independent Test Criteria**:
- Install extension
- Access settings page
- Fill profile form with required fields
- Save profile
- Verify data persists across browser restarts
- Generate message and confirm user info included

### T031 [US2]: Create Options Page UI - Profile Form
**File**: `src/tabs/options.tsx`
**Description**: Full-page React form for user profile setup (FR-002, FR-011).
Form fields:
- Name, email (required)
- Current role, current company (required)
- Professional background (textarea, 500 char max)
- Career goals (textarea, optional)
- Outreach objectives (textarea, optional)
- Value proposition (textarea, 300 char max)
- Default tone selector (professional/casual/enthusiastic)
- Default length selector (short/medium/long)

Validation:
- All required fields
- Email format
- Character limits
- Show completeness score (0-100%)

**Acceptance**: Form validates correctly, calculates completeness.

### T032 [US2]: Add Profile Completeness Calculator
**File**: `src/utils/validators.ts`
**Description**: Calculate profile completeness percentage.
- Required fields: 70% weight
- Optional fields: 30% weight
- Return 0-100 score

**Acceptance**: Completeness calculation accurate per data-model.md.

### T033 [US2]: Implement User Profile Save Logic
**File**: `src/tabs/options.tsx`
**Description**: Save user profile to storage when form submitted (FR-002).
- Call `storageService.saveUserProfile()`
- Update `updatedAt` timestamp
- Show success notification
- Update completeness score

**Acceptance**: Profile saves and persists across browser sessions.

### T034 [US2]: Create Onboarding Flow
**File**: `src/popup/components/Onboarding.tsx`
**Description**: First-time user onboarding prompt (SC-003: 85% complete setup in 5 min).
- Detect new user (no profile exists)
- Show welcome message
- Link to options page for profile setup
- Show progress indicator
- Skip button (allows incomplete profile with warning)

**Acceptance**: First-time users see onboarding, can complete setup quickly.

### T035 [US2]: Add Incomplete Profile Warning
**File**: `src/popup/index.tsx`
**Description**: Warn user when profile incomplete before generating message (FR-002 scenario 4).
- Check profile completeness before generation
- Show which fields are missing
- Explain impact on message quality
- Button to open options page

**Acceptance**: Warning displays when profile incomplete, explains impact.

### T036 [US2]: Add OpenRouter API Key Setup
**File**: `src/tabs/options.tsx`
**Description**: Add OpenRouter API key configuration to settings.
- Input field for API key (masked)
- Model selector dropdown (default: openai/gpt-4o)
- "Test Connection" button to validate key
- Clear instructions on obtaining key from OpenRouter

**Acceptance**: API key saves, validation works.

### T037 [US2]: Implement API Key Validation
**File**: `src/services/message-service.ts`
**Description**: Test OpenRouter API connection with user's key.
- Make test API call with minimal prompt
- Handle invalid key error
- Show success/failure message

**Acceptance**: Validation correctly detects valid/invalid keys.

### T038 [US2]: Write E2E Test for User Story 2
**File**: `tests/e2e/us2-profile-setup.spec.ts`
**Description**: Playwright test for profile setup flow.
Test:
1. Fresh install (no profile)
2. See onboarding prompt
3. Navigate to options page
4. Fill profile form
5. Save profile
6. Verify completeness = 100%
7. Restart browser
8. Verify profile persists

**Acceptance**: E2E test passes, profile persists correctly.

**✓ Checkpoint**: User Story 2 complete! Users can set up and manage their profiles.

---

## Phase 5: User Story 3 (P3) - Message Customization & Export

**Story Goal**: User customizes message tone/length → manually edits → copies to clipboard.

**Independent Test Criteria**:
- Generate message (US1)
- Change tone → message regenerates with new tone
- Change length → message adapts
- Manually edit text → edits preserved
- Click copy → message in clipboard
- Paste in LinkedIn → format preserved

### T039 [US3]: Implement Tone Change Logic
**File**: `src/services/message-service.ts`
**Description**: Add `changeTone()` method per contracts (FR-006).
- Regenerate message with new tone
- Preserve manual edits from previous version
- Increment version number
- Log tone change in edit history

**Acceptance**: Tone changes regenerate message correctly, edits preserved.

### T040 [US3]: Implement Length Change Logic
**File**: `src/services/message-service.ts`
**Description**: Add `changeLength()` method per contracts (FR-007).
- Regenerate message with new length (50-100/100-200/200-300 words)
- Preserve manual edits
- Increment version number
- Log length change in edit history

**Acceptance**: Length changes work correctly, target word count achieved.

### T041 [US3]: Create Tone Selector Component
**File**: `src/popup/components/ToneSelector.tsx`
**Description**: UI control for tone selection (FR-006).
- Radio buttons or segmented control
- Options: Professional (default), Casual, Enthusiastic
- Show current selection
- Trigger regeneration on change

**Acceptance**: Tone selector works, triggers regeneration.

### T042 [US3]: Create Length Slider Component
**File**: `src/popup/components/LengthSlider.tsx`
**Description**: UI control for length selection (FR-007).
- Slider or segmented control
- Options: Short (50-100), Medium (100-200), Long (200-300)
- Show word count estimate
- Trigger regeneration on change

**Acceptance**: Length control works, triggers regeneration.

### T043 [US3]: Implement Manual Edit Handler
**File**: `src/popup/components/MessageDraft.tsx`
**Description**: Allow user to edit message text (FR-008).
- Make message body editable (contentEditable or textarea)
- Track changes
- Save edits to draft
- Show edit indicator
- Edits NOT overwritten by tone/length changes

**Acceptance**: Manual edits work and persist through regenerations.

### T044 [US3]: Implement Copy to Clipboard
**File**: `src/services/message-service.ts`, `src/popup/components/MessageDraft.tsx`
**Description**: One-click copy function (FR-009).
- `copyToClipboard()` method using Clipboard API
- Copy button in UI
- Show "Copied!" confirmation
- Format preserved for LinkedIn messaging

**Acceptance**: Copy works, format compatible with LinkedIn.

### T045 [US3]: Integrate Customization UI in Popup
**File**: `src/popup/index.tsx`
**Description**: Add tone/length/edit controls to main popup.
- Place controls above message draft
- Wire up tone selector
- Wire up length slider
- Show loading state during regeneration
- Display edit indicators

**Acceptance**: All customization controls work together in popup.

### T046 [US3]: Write E2E Test for User Story 3
**File**: `tests/e2e/us3-message-customization.spec.ts`
**Description**: Playwright test for message customization.
Test:
1. Generate message (US1 flow)
2. Change tone to Casual → verify regeneration
3. Change length to Short → verify word count
4. Manually edit text
5. Change tone again → verify manual edits preserved
6. Click copy → verify clipboard
7. Paste in test textarea → verify format

**Acceptance**: E2E test passes, customization works end-to-end.

**✓ Checkpoint**: User Story 3 complete! Users can fully customize messages.

---

## Phase 6: User Story 4 (P4) - History Tracking & Duplicate Prevention

**Story Goal**: User sends message → history recorded → revisit profile → see warning about duplicate.

**Independent Test Criteria**:
- Send message (record in history)
- Revisit same LinkedIn profile
- See notification of previous contact
- View history dashboard
- See list of contacted profiles

### T047 [US4]: Implement Outreach History Storage
**File**: `src/services/storage-service.ts`
**Description**: Add OutreachHistory storage methods per contracts.
- `saveOutreachHistory(history)` - save minimal record (name, URL, timestamp)
- `getOutreachHistoryByUrl(url)` - duplicate check (FR-015)
- `getOutreachHistory(options)` - paginated list
- `clearExpiredOutreachHistory()` - free plan 5-day cleanup

**Acceptance**: History saves, retrieves by URL, expires correctly.

### T048 [US4]: Add Record History on Copy
**File**: `src/popup/index.tsx`, `src/services/message-service.ts`
**Description**: Record outreach when user copies message.
- After copy, create OutreachHistory entry
- Save: targetName, targetLinkedinUrl, contactedAt
- Set expiresAt based on plan (5 days free, null paid)
- Show confirmation

**Acceptance**: History recorded automatically on copy.

### T049 [US4]: Implement Duplicate Check
**File**: `src/popup/index.tsx`
**Description**: Check if profile previously contacted before generation (FR-015).
- Query history by LinkedIn URL
- If found within retention period → show warning
- Display: name, date contacted, days ago
- Allow user to proceed or cancel

**Acceptance**: Duplicate warning displays correctly when revisiting profile.

### T050 [US4]: Create History Dashboard UI
**File**: `src/tabs/history.tsx`
**Description**: Full-page history view (FR-014).
- List of contacted profiles (paginated, 50 per page)
- Show: name, date contacted, LinkedIn URL (link)
- Sort by date (newest first)
- Search by name
- Delete individual entries
- Show expiration date for free plan entries

**Acceptance**: History dashboard displays all contacts, search works.

### T051 [US4]: Add Subscription Plan Storage
**File**: `src/services/storage-service.ts`, `src/services/subscription-service.ts`
**Description**: Implement subscription plan management (FR-017, FR-018).
- `getSubscriptionPlan()` / `saveSubscriptionPlan()`
- Default: free plan (5-day retention, 50 msg/month)
- `hasFeatureAccess(feature)` - check plan features
- Show plan upgrade prompt when limits reached

**Acceptance**: Plan features enforced correctly (client-side honor system for MVP).

### T052 [US4]: Write E2E Test for User Story 4
**File**: `tests/e2e/us4-history-tracking.spec.ts`
**Description**: Playwright test for history tracking.
Test:
1. Generate message for profile A
2. Copy message → record in history
3. Navigate to profile B
4. Generate and copy → record in history
5. Navigate back to profile A
6. Verify duplicate warning appears
7. View history dashboard
8. Verify both entries listed
9. Search for profile A by name

**Acceptance**: E2E test passes, history tracking works.

**✓ Checkpoint**: User Story 4 complete! All core features implemented.

---

## Parallel Execution Opportunities

### Setup Phase (All parallel)
- T001-T008 can all run in parallel (different files)

### Foundational Phase
- T009 (models), T010 (selectors), T011 (errors), T012 (validators) can run in parallel
- T013 (storage) must complete before T014-T015
- T014-T015 can run in parallel

### User Story 1 (P1)
**Parallel Group 1** (after foundational):
- T016 (profile storage)
- T017 (analysis storage)
- T018 (extractor logic)
- T021 (analyzer prompt)
- T023 (generator prompt)

**Sequential**:
- T019 (content script) after T018
- T020 (profile service) after T016-T019
- T022 (analyzer agent) after T021
- T024 (generator agent) after T023
- T025 (message service) after T022-T024

**Parallel Group 2**:
- T026 (draft storage)
- T027 (message draft UI)
- T028 (loading UI)

**Sequential**:
- T029 (popup main) after all above
- T030 (E2E test) last

### User Story 2 (P2) - Can start after foundational
**Parallel**:
- T031-T032 (profile form + completeness)
- T036-T037 (API key setup + validation)

**Sequential**:
- T033 (save logic) after T031-T032
- T034 (onboarding) after T033
- T035 (incomplete warning) after T034
- T038 (E2E) last

### User Story 3 (P3) - Depends on US1
**Parallel**:
- T039 (tone change)
- T040 (length change)
- T041 (tone selector UI)
- T042 (length slider UI)
- T043 (edit handler)
- T044 (copy function)

**Sequential**:
- T045 (integrate UI) after all parallel
- T046 (E2E) last

### User Story 4 (P4) - Depends on US1
**Parallel**:
- T047 (history storage)
- T050 (history dashboard UI)
- T051 (subscription service)

**Sequential**:
- T048 (record on copy) after T047
- T049 (duplicate check) after T047
- T052 (E2E) last

---

## Testing Strategy

**Note**: Tests in this plan are minimal - only E2E tests for each user story's acceptance criteria. For comprehensive TDD approach, add unit/integration tests before each implementation task.

**Current Test Coverage**:
- E2E tests: 4 (one per user story)
- Test before implementation: No (tests are written last per task)
- Coverage goal: E2E tests validate user story acceptance criteria

**To add TDD approach**: Insert unit test tasks before each implementation task following pattern:
- Test task for service → implementation task for service
- Test task for component → implementation task for component

---

## Implementation Strategy

### MVP-First Approach (Recommended)
1. **Complete Phase 1-2** (Setup + Foundational): ~2-3 days
2. **Complete Phase 3** (User Story 1): ~5-7 days
3. **Deploy MVP**: Users can generate messages (core value)
4. **Iterate**: Add US2, US3, US4 based on user feedback

### Full Feature Approach
1. Complete all phases sequentially: ~3-4 weeks
2. Deploy with all features at once

### Parallel Team Approach
After foundational complete:
- **Developer A**: US1 (P1) - Core message generation
- **Developer B**: US2 (P2) - Profile setup (independent of US1)
- **Developer A**: US3 (P3) - Customization (after US1)
- **Developer B**: US4 (P4) - History (after US1)

---

## Next Steps

1. **Start with Phase 1**: Run T001 to initialize project
2. **Complete foundational layer**: Run T009-T015
3. **Focus on MVP**: Implement User Story 1 (T016-T030)
4. **Test and iterate**: Deploy MVP, gather feedback
5. **Add enhancements**: Implement US2-US4 based on priority

**Success Metrics** (track against spec.md success criteria):
- SC-001: Message generation < 10 seconds
- SC-002: 2+ target profile references in messages
- SC-003: 85% users complete profile setup in 5 minutes
- SC-005: 95% profile extraction success rate
- SC-008: No noticeable delay to LinkedIn browsing

---

**Ready to begin implementation! Start with T001.**
