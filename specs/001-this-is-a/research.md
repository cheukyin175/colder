# Research & Design Decisions: Colder Extension

**Feature**: LinkedIn Cold Outreach AI Assistant
**Date**: 2025-10-13
**Phase**: 0 - Outline & Research

## Overview

This document consolidates research findings and design decisions for technical aspects requiring clarification before implementation.

## 1. LLM Provider Selection

### Decision: OpenRouter (OpenAI-compatible API Gateway)

### Rationale:
- **Model Flexibility**: Access to multiple LLM providers (OpenAI, Anthropic, Google, Meta, etc.) through single API
- **LangChain.js Integration**: Fully compatible with OpenAI SDK (drop-in replacement), works with LangChain.js
- **Cost Efficiency**: Competitive pricing, automatic routing to cheapest/fastest provider for model class
- **Performance**: Fast response times (typically 2-5 seconds) suitable for SC-001 (<10 second requirement)
- **Quality**: Can use GPT-4o, Claude 3.5 Sonnet, or Gemini Pro based on user preference
- **API Stability**: Reliable gateway with fallback capabilities
- **User Choice**: MVP can default to GPT-4o, allow model selection in settings later

### Why OpenRouter over Direct OpenAI:
- **Lower costs**: OpenRouter often has better rates than direct OpenAI API
- **Model diversity**: Users can switch models without code changes
- **Reliability**: Automatic failover if one provider has issues
- **Future-proof**: Easy to add new models as they're released
- **Same integration**: Uses OpenAI-compatible API format

### Implementation with LangChain.js:

```typescript
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({
  modelName: 'openai/gpt-4o', // OpenRouter model format
  openAIApiKey: userApiKey, // OpenRouter API key
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
});
```

### Alternatives Considered:
1. **Direct OpenAI API**
   - Pros: Simpler documentation, direct provider relationship
   - Cons: Higher costs, locked into single provider, no fallback
   - Rejected: OpenRouter provides better cost/flexibility with same integration

2. **Anthropic Claude Direct**
   - Pros: Better safety guardrails, longer context window
   - Cons: More expensive, LangChain.js integration less mature, separate API
   - Rejected: Can access via OpenRouter with OpenAI-compatible interface

3. **Local LLM (Ollama/llama.cpp)**
   - Pros: No API costs, complete privacy, offline capable
   - Cons: Requires user to run local model server, quality/speed limitations
   - Rejected: UX complexity and performance constraints for average users

### API Key Management Approach:

**Decision**: BYOK (Bring Your Own Key) for MVP - Backend post-MVP

**MVP Implementation (BYOK)**:
- User provides their own OpenRouter API key
- Key stored in `chrome.storage.sync` (automatically encrypted by Chrome)
- Extension calls OpenRouter API directly from background worker
- Clear documentation on obtaining API key from OpenRouter (https://openrouter.ai/keys)
- Validation on first use with test API call
- Default model: `openai/gpt-4o` (can be changed in settings)

**Why BYOK for MVP**:
- **No backend needed**: Faster MVP development, zero infrastructure costs
- **Focus on core features**: Profile extraction and message generation
- **Dev-friendly**: Easy to test and iterate locally
- **User controls costs**: No revenue/billing infrastructure needed yet
- **Privacy**: All data stays client-side (extension + OpenRouter only)

**MVP Limitations**:
- Users must obtain and manage their own API keys
- No usage analytics or rate limiting
- No centralized user management
- Free/paid tiers enforced client-side (honor system)

**Post-MVP: Backend Migration**:
When ready to scale and monetize:
- Build backend API to proxy LLM requests
- Migrate from BYOK to backend-managed keys
- Add user authentication and billing
- Server-side rate limiting and usage tracking
- Optional: Keep BYOK as enterprise tier feature

**Backend API Design** (Post-MVP):
- `POST /api/analyze-profile` - Analyze LinkedIn profile data
- `POST /api/generate-message` - Generate personalized message
- `POST /api/regenerate` - Regenerate with different tone/length
- `GET /api/usage` - Get user's usage stats
- User authentication via JWT tokens

## 2. Testing Strategy for Chrome Extensions

### Decision: Three-tier testing approach

### 1. Unit Testing
**Framework**: Vitest (faster than Jest, better TypeScript support)
**Coverage**: Services, models, utilities, business logic
**Approach**:
- Mock Chrome APIs using `@types/chrome` and Vitest mocks
- Test business logic in isolation
- Target 80% coverage for services and utils

### 2. Integration Testing
**Framework**: Vitest with Chrome API mocks
**Coverage**:
- LangChain agent workflows (profile analyzer, message generator)
- Storage service with mocked Chrome Storage API
- Gmail API integration with mocked responses
**Approach**:
- Test service interactions
- Validate message passing patterns
- Test state management flows

### 3. End-to-End Testing
**Framework**: Playwright with Chrome extension support
**Coverage**:
- Full user flows from P1 user story
- Extension installation and onboarding
- Profile extraction from LinkedIn test profiles
- Message generation and customization
- History tracking
**Approach**:
- Use Playwright's `chromium.launchPersistentContext()` with extension loading
- Test against static HTML snapshots of LinkedIn profiles (avoid hitting real LinkedIn)
- Mock LLM API responses for consistency and speed
- CI/CD integration with GitHub Actions

### Why this approach:
- **Vitest over Jest**: Faster, better ESM support, better TypeScript integration
- **Playwright over Puppeteer**: Better Chrome extension support, better debugging tools
- **Three tiers**: Balance between coverage, speed, and maintenance
- **Static LinkedIn snapshots**: Avoid flakiness from LinkedIn DOM changes, faster tests

### Rationale for rejecting alternatives:
- **Chrome Extension Testing Library**: Too low-level, more boilerplate
- **WebdriverIO**: Slower than Playwright, less developer-friendly
- **Manual testing only**: Not sustainable for 18 functional requirements

## 3. LinkedIn DOM Scraping Strategy

### Decision: Selector-based extraction with fallback patterns

### Approach:
**Primary strategy**: CSS selectors targeting LinkedIn's semantic class names
**Fallback strategy**: Multiple selector patterns for each data point
**Resilience pattern**: Graceful degradation when elements missing

### Implementation Pattern:

```typescript
// Example: Extract job title with fallbacks
const extractJobTitle = (doc: Document): string | null => {
  const selectors = [
    '.text-heading-xlarge',  // Primary LinkedIn selector (2024)
    '.pv-text-details__title', // Fallback pattern 1
    '[data-generated-suggestion-target]', // Fallback pattern 2
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      return element.textContent.trim();
    }
  }

  return null; // Gracefully handle missing data
};
```

### Key Strategies:
1. **Selector hierarchy**: Primary → Fallback 1 → Fallback 2 → Null (graceful failure)
2. **Versioning**: Track LinkedIn selector versions in `linkedin-selectors.ts` with dates
3. **Monitoring**: Log selector success/failure rates (telemetry for future updates)
4. **User feedback**: Clear error messages when extraction fails (FR-012)
5. **Minimal extraction**: Only extract fields needed for personalization (reduce breakage surface)

### Data Points to Extract:
- **Critical** (P0): Name, current job title, company
- **High priority** (P1): Recent posts (last 5), work experience (last 2 roles)
- **Nice to have** (P2): Education, skills, mutual connections

### Rationale:
- LinkedIn's DOM changes ~4-6 times per year
- Fallback patterns provide resilience
- Graceful degradation maintains UX when partial data available
- Clear error messages help users understand limitations

### Rejected alternatives:
- **LinkedIn Official API**: Not available for profile scraping, only for posting/sharing
- **Third-party scraping APIs** (Proxycurl, etc.): Adds cost, latency, external dependency, privacy concerns
- **OCR/Computer Vision**: Overkill for structured data, slow, fragile

## 4. LangChain.js Agent Architecture

### Decision: Two-chain architecture with ReAct pattern

### Architecture:

**Chain 1: Profile Analyzer**
- **Input**: Extracted LinkedIn profile data + user profile
- **Output**: Structured analysis (talking points, mutual interests, personalization opportunities)
- **Pattern**: Simple LLM chain with structured output
- **Latency**: ~2-3 seconds

**Chain 2: Message Generator**
- **Input**: Profile analysis + tone + length + user context
- **Output**: Personalized message draft with annotations
- **Pattern**: ReAct agent with tools (tone modifier, length adjuster)
- **Latency**: ~3-5 seconds

### Why Two Chains:
1. **Separation of concerns**: Analysis ≠ Generation
2. **Caching**: Can cache analysis, regenerate messages with different tones
3. **Debugging**: Easier to debug when stages are separate
4. **Cost**: Can skip re-analysis when only tone/length changes

### Agent Tools:
- **Tone Modifier Tool**: Adjusts message tone (Professional/Casual/Enthusiastic)
- **Length Adjuster Tool**: Expands or contracts message to target length
- **Context Retriever Tool**: Pulls relevant user profile context

### Prompt Engineering Strategy:
- **System prompts**: Stored in `src/background/agent/prompts/` as versioned templates
- **Few-shot examples**: Include 3-5 example profiles → message pairs
- **Structured output**: Use JSON mode for reliable parsing
- **Tone templates**: Separate prompts for each tone preset

### Rationale:
- **ReAct pattern**: Better for multi-step reasoning (analyze → generate)
- **Tool-based customization**: Cleaner than regenerating entire message for tone changes
- **Versioned prompts**: Easy to A/B test and iterate
- **Structured output**: Reduces parsing errors, enables metadata extraction

## 5. Gmail API Integration Flow

### Decision: OAuth2 with Incremental Authorization

### Flow:

1. **First-time setup**:
   - User clicks "Connect Gmail" in settings
   - Extension triggers `chrome.identity.launchWebAuthFlow()`
   - User authorizes Gmail access (read + send scopes)
   - Extension receives OAuth2 token
   - Token stored in `chrome.storage.local` (encrypted by Chrome)

2. **Draft creation**:
   - Extension calls Gmail API's `drafts.create` endpoint
   - Draft created in user's Gmail drafts folder
   - Extension opens Gmail tab with draft URL
   - User reviews and sends manually (or uses "YOLO mode" for instant send)

3. **Token refresh**:
   - OAuth2 refresh token stored securely
   - Automatic token refresh when expired
   - Re-auth prompt if refresh fails

### Scopes Required:
- `https://www.googleapis.com/auth/gmail.compose` - Create drafts and send
- `https://www.googleapis.com/auth/userinfo.email` - Get user email (for "from" address)

### "YOLO Mode" (Auto-send):
- **Opt-in feature**: Disabled by default
- **User must explicitly enable**: Toggle in settings with warning
- **Sends immediately**: Skips draft creation, directly sends message
- **Audit log**: Records all sent messages in history

### Why Gmail API:
- **Most reliable**: OAuth2 is secure and standardized
- **User-controlled**: Users see drafts before sending
- **No credentials**: Extension never sees user's Gmail password
- **Audit trail**: All drafts visible in Gmail

### Alternatives considered:
- **mailto: links**: Too manual, no programmatic access
- **SMTP**: Requires user credentials (security risk), less reliable
- **Third-party email APIs** (SendGrid, etc.): Not user's actual email account

## 6. Subscription Plan Implementation

### Decision: Client-side plan enforcement with future backend option

### MVP Approach (Client-side):
- **Plan storage**: User's plan stored in `chrome.storage.sync` as `{ plan: 'free' | 'paid', expiresAt: Date }`
- **Enforcement**: Feature gating in code (e.g., history retention logic)
- **Upgrade flow**: Link to external payment page (Stripe, Gumroad, etc.)
- **Activation**: User enters license key after purchase, validated client-side

### Why client-side for MVP:
- **Faster to launch**: No backend infrastructure needed
- **Lower complexity**: Focus on core features first
- **User trust**: Extension works offline, no "phone home" requirement

### Limitations of client-side approach:
- **Bypassable**: Technical users could modify storage to unlock paid features
- **No revenue protection**: Honor system for payments
- **Mitigation**: Acceptable for MVP, most users will pay if value is clear

### Future Backend Option (Post-MVP):
- **License server**: Validates license keys server-side
- **Periodic checks**: Extension pings server to verify subscription status
- **Secure storage**: Plan status signed by server, validated in extension
- **Benefits**: Revenue protection, usage analytics, remote plan management

### Plan Differences:
- **Free plan**: 5-day history retention, 50 messages/month
- **Paid plan**: Unlimited history, unlimited messages, priority support, YOLO mode

## 7. Performance Optimization Strategies

### To Meet Success Criteria:

**SC-001**: Message generation < 10 seconds
- **Strategy**: Parallel API calls where possible (LLM + Gmail draft creation)
- **Caching**: Cache user profile to avoid repeated context loading
- **Streaming**: Use streaming LLM responses to show progress

**SC-006**: 100+ history entries without degradation
- **Strategy**: Virtual scrolling in history UI (react-window)
- **Indexing**: Index history by target name/company for fast search
- **Pagination**: Load history in chunks of 50

**SC-008**: No noticeable delay to LinkedIn browsing
- **Strategy**: Lazy-load content script only on profile pages
- **Debouncing**: Wait 500ms after page load before scraping
- **Minimal DOM access**: Read DOM once, cache extracted data

### Additional Optimizations:
- **Background worker**: Keep service worker alive during active use
- **Message batching**: Batch Chrome runtime messages to reduce overhead
- **Tree shaking**: Minimize bundle size (LangChain.js can be large)
- **Code splitting**: Lazy load React components in options page

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **LLM Provider** | OpenRouter (OpenAI-compatible) with user-provided API key | Model flexibility, cost efficiency, LangChain.js support, user-controlled costs |
| **Testing** | Vitest + Playwright (3-tier testing) | Speed, developer experience, Chrome extension support |
| **LinkedIn Scraping** | Multi-fallback selector-based extraction | Resilience to DOM changes, graceful degradation |
| **Agent Architecture** | Two-chain ReAct pattern (Analyzer + Generator) | Separation of concerns, caching, debugging |
| **Gmail Integration** | OAuth2 with incremental authorization | Security, reliability, user control |
| **Subscription Plans** | Client-side enforcement (MVP) | Faster launch, lower complexity, future backend option |
| **Performance** | Parallel APIs, caching, virtual scrolling | Meet SC-001, SC-006, SC-008 requirements |

## Next Steps

✅ All NEEDS CLARIFICATION items resolved
➡️ Ready for Phase 1: Design & Contracts
- Generate data-model.md
- Create API contracts
- Write quickstart.md
