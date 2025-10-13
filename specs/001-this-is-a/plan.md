# Implementation Plan: LinkedIn Cold Outreach AI Assistant (Colder)

**Branch**: `001-this-is-a` | **Date**: 2025-10-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-this-is-a/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Colder is a Chrome extension that helps users send personalized cold outreach messages on LinkedIn. The extension analyzes LinkedIn profiles using an AI agent, extracts relevant information, and generates customized message drafts based on both the target's profile and the user's own background.

**MVP Scope**: Client-side extension with BYOK (user provides OpenRouter API key), profile extraction, AI message generation, minimal contact history (name/URL/timestamp only). No backend required for MVP.

**Post-MVP**: Backend API for managed keys, user authentication, billing, full history tracking, and advanced analytics.

Key MVP features: profile extraction, AI-powered message generation with tone/length customization, basic duplicate detection. Uses Plasmo framework with React/TypeScript for UI, LangChain.js for AI orchestration, and Gmail API for email integration.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js runtime
**Extension Framework**: Plasmo (Chrome extension framework optimized for complex background tasks)
**Frontend Stack**:
  - React 18+ (minimal usage - settings/config UI only)
  - TypeScript (type safety across extension)
  - Tailwind CSS (lightweight styling)
**AI/Agent Layer**:
  - LangChain.js (LLM orchestration and agent workflows)
  - LLM Provider: OpenRouter (OpenAI-compatible API gateway)
    - Default model: openai/gpt-4o
    - User-provided OpenRouter API key
    - Supports multiple providers: OpenAI, Anthropic, Google, Meta via single API
**Email Integration**: Gmail API with OAuth2 authentication
**Storage**: Chrome Storage API (local and sync storage for user profiles, settings, and outreach history)
**Testing**: Vitest (unit/integration), Playwright (E2E), Chrome extension testing with mocked APIs
**Target Platform**: Chrome browser (Manifest V3), potentially extensible to other Chromium-based browsers
**Project Type**: Chrome extension (single project with background worker, content scripts, popup/options UI)
**Performance Goals**:
  - Profile analysis and message generation < 10 seconds (per SC-001)
  - Extension loads without noticeable delay to LinkedIn browsing (per SC-008)
  - Support 100+ outreach history entries without performance degradation (per SC-006)
**Constraints**:
  - Chrome extension Manifest V3 restrictions (service worker lifecycle, content security policy)
  - LinkedIn DOM scraping fragility (page structure changes)
  - OpenRouter API rate limits and latency (user's responsibility with BYOK)
  - OAuth2 token management for Gmail API
  - No backend for MVP (all logic client-side)
**Scale/Scope**:
  - Target: Individual users with 10-100 outreach messages per week
  - Free tier: 5-day history retention
  - Paid tier: Unlimited history retention
  - 4 prioritized user stories with 18 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: Constitution file contains template placeholders only. No specific project principles have been defined yet.

**Recommended Gates for Chrome Extension Project**:

| Gate | Status | Notes |
|------|--------|-------|
| **Security & Privacy** | ⚠️ ATTENTION | OAuth2 token management for Gmail API must be secure; OpenRouter API keys stored in chrome.storage.sync (encrypted by Chrome); No sensitive data should be logged or transmitted insecurely |
| **Testing Strategy** | ✅ PASS | Three-tier testing defined: Vitest (unit/integration), Playwright (E2E), Chrome extension mocks |
| **Error Handling** | ✅ PASS | Extension must gracefully handle LinkedIn DOM changes, API failures, and network issues per FR-010, FR-012 |
| **Performance** | ✅ PASS | Clear performance goals defined in success criteria (SC-001, SC-006, SC-008) |
| **Extensibility** | ✅ PASS | Architecture supports future social platforms beyond LinkedIn per feature spec |

**Action Items**:
1. ✅ RESOLVED: LLM provider selected (OpenRouter with user-provided API keys)
2. ✅ RESOLVED: Testing strategy defined (Vitest + Playwright, see research.md #2)
3. Consider creating project-specific constitution if patterns emerge during implementation

## Project Structure

### Documentation (this feature)

```
specs/001-this-is-a/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── message-service.ts    # Message generation API
│   ├── profile-service.ts    # Profile extraction/analysis API
│   └── storage-service.ts    # Data persistence API
├── checklists/
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Structure Decision**: Chrome extension architecture using Plasmo framework conventions. Plasmo organizes code by extension component type (background, content, popup, tabs) with shared services and types.

```
src/
├── background/              # Service worker (Manifest V3)
│   ├── index.ts            # Background service worker entry
│   ├── message-handler.ts  # Handles messages from content scripts
│   └── agent/              # LangChain.js AI agent
│       ├── profile-analyzer.ts   # Profile analysis chain
│       ├── message-generator.ts  # Message generation chain
│       └── prompts/              # LLM prompt templates
├── content/                # Content scripts (injected into LinkedIn)
│   ├── linkedin-extractor.ts    # DOM scraping for profile data
│   └── linkedin-ui-injector.ts  # Inject extension UI into LinkedIn
├── popup/                  # Browser action popup
│   ├── index.tsx           # Popup entry (React)
│   └── components/         # React components for popup
│       ├── MessageDraft.tsx
│       ├── ToneSelector.tsx
│       └── LengthSlider.tsx
├── tabs/                   # Full-page extension tabs (React)
│   ├── options.tsx         # Settings/configuration page
│   └── history.tsx         # Outreach history dashboard
├── services/               # Shared business logic
│   ├── profile-service.ts      # Profile extraction/analysis
│   ├── message-service.ts      # Message generation/customization
│   ├── storage-service.ts      # Chrome Storage API wrapper
│   ├── gmail-service.ts        # Gmail API integration
│   └── subscription-service.ts # Plan management (free/paid)
├── models/                 # TypeScript types/interfaces
│   ├── user-profile.ts
│   ├── target-profile.ts
│   ├── message-draft.ts
│   ├── outreach-history.ts
│   └── subscription-plan.ts
├── utils/                  # Shared utilities
│   ├── linkedin-selectors.ts   # DOM selectors for LinkedIn
│   ├── error-handlers.ts       # Error handling utilities
│   └── validators.ts           # Data validation
└── styles/                 # Tailwind CSS
    └── global.css

tests/
├── unit/                   # Unit tests
│   ├── services/
│   ├── models/
│   └── utils/
├── integration/            # Integration tests
│   ├── agent/              # LangChain agent tests
│   ├── storage/            # Storage service tests
│   └── gmail/              # Gmail API tests
└── e2e/                    # End-to-end tests (Playwright)
    ├── profile-extraction.spec.ts
    ├── message-generation.spec.ts
    └── history-tracking.spec.ts

assets/                     # Extension assets
├── icon-16.png
├── icon-48.png
└── icon-128.png

package.json                # Dependencies and scripts
tsconfig.json              # TypeScript configuration
tailwind.config.js         # Tailwind CSS configuration
.env.example               # Environment variables template
```

**Key Architecture Notes**:
- **Background Service Worker**: Runs LangChain.js agents, manages state, handles API calls (Gmail, LLM)
- **Content Scripts**: Extract LinkedIn profile data, inject UI elements
- **Popup**: Quick access to message generation and settings
- **Options/History Tabs**: Full React applications for complex UIs
- **Message Passing**: Content scripts ↔ Background worker communication via Chrome runtime API
- **Storage**: Chrome Storage API (sync for user profile, local for history/cache)
- **OAuth2 Flow**: Gmail API authentication handled in background worker with chrome.identity API

## Complexity Tracking

*No constitution violations requiring justification - template constitution has no defined gates.*
