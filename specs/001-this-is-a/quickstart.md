# Quickstart Guide: Colder Extension Development

**Feature**: LinkedIn Cold Outreach AI Assistant
**Last Updated**: 2025-10-13

## Overview

This guide helps developers quickly set up and start building the Colder Chrome extension. It covers environment setup, architecture overview, and common development workflows.

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Chrome browser (for testing)
- OpenRouter API key (for LLM integration testing - get free key at https://openrouter.ai/keys)
- Gmail account (for Gmail API testing)

## Quick Setup

### 1. Initialize Project

```bash
# Create project with Plasmo framework
pnpm create plasmo colder
cd colder

# Install dependencies
pnpm install

# Install core dependencies
pnpm add langchain @langchain/openai
pnpm add -D @types/chrome vitest @playwright/test

# Install UI dependencies
pnpm add react react-dom tailwindcss
pnpm add -D @types/react @types/react-dom

# Setup Tailwind CSS
pnpm dlx tailwindcss init
```

### 2. Project Structure Setup

Create the directory structure as defined in `plan.md`:

```bash
mkdir -p src/{background/agent/prompts,content,popup/components,tabs,services,models,utils,styles}
mkdir -p tests/{unit/{services,models,utils},integration/{agent,storage,gmail},e2e}
mkdir -p assets
```

### 3. Environment Configuration

Create `.env` file:

```bash
# .env (DO NOT COMMIT)
PLASMO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: For testing
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
```

Create `.env.example` (for documentation):

```bash
# .env.example (COMMIT THIS)
PLASMO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...

# Gmail OAuth (get from Google Cloud Console)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
```

### 4. Manifest Configuration

Plasmo auto-generates `manifest.json`, but you can customize in `package.json`:

```json
{
  "manifest": {
    "host_permissions": [
      "https://www.linkedin.com/*"
    ],
    "permissions": [
      "storage",
      "identity",
      "tabs",
      "activeTab"
    ],
    "oauth2": {
      "client_id": "YOUR_GMAIL_CLIENT_ID",
      "scopes": [
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/userinfo.email"
      ]
    }
  }
}
```

## Architecture Overview

### Extension Components

```
┌─────────────────────────────────────────────────────────┐
│                   LinkedIn Page                          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │      Content Script (linkedin-extractor.ts)      │   │
│  │  • Extract profile data from DOM                 │   │
│  │  • Inject UI elements                            │   │
│  └──────────────────┬──────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────┘
                      │ chrome.runtime.sendMessage()
                      ▼
┌─────────────────────────────────────────────────────────┐
│        Background Service Worker (index.ts)              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         LangChain.js Agent                        │  │
│  │  ┌────────────────┐  ┌──────────────────────┐   │  │
│  │  │ Profile        │  │ Message              │   │  │
│  │  │ Analyzer       │→ │ Generator            │   │  │
│  │  └────────────────┘  └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Storage Service                           │  │
│  │  • Chrome Storage API wrapper                     │  │
│  │  • Data caching & cleanup                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      ▲
                      │ chrome.runtime.onMessage
                      │
┌─────────────────────┴───────────────────────────────────┐
│              Popup UI (popup/index.tsx)                  │
│  • Message draft display                                 │
│  • Tone/length customization                             │
│  • Copy to clipboard                                     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**User Story 1 Flow (Profile Analysis & Message Generation)**:

1. User navigates to LinkedIn profile
2. User clicks extension icon
3. Content script extracts profile data from DOM
4. Content script sends `EXTRACT_PROFILE` message to background worker
5. Background worker:
   - Validates extracted data
   - Caches target profile (24h TTL)
   - Runs LangChain analyzer agent
   - Generates profile analysis
   - Caches analysis (24h TTL)
6. Background worker sends analysis to popup
7. User clicks "Generate Message" in popup
8. Popup sends `GENERATE_MESSAGE` to background worker
9. Background worker:
   - Runs LangChain message generator agent
   - Creates annotated message draft
   - Saves draft to storage
10. Popup displays draft with tone/length controls
11. User copies message → records in outreach history

## Development Workflow

### Running the Extension

```bash
# Development mode (with hot reload)
pnpm dev

# This will:
# 1. Start Plasmo dev server
# 2. Build extension in watch mode
# 3. Output: build/chrome-mv3-dev

# Load extension in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select build/chrome-mv3-dev
```

### Testing

```bash
# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

### Building for Production

```bash
# Build production extension
pnpm build

# Output: build/chrome-mv3-prod

# Package for Chrome Web Store
pnpm package

# Output: build/chrome-mv3-prod.zip
```

## Key Files to Start With

### 1. Data Models (`src/models/`)

Start by implementing TypeScript interfaces from `data-model.md`:

```typescript
// src/models/user-profile.ts
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  // ... (see data-model.md)
}
```

**Why first**: Establishes type safety for entire project.

### 2. Storage Service (`src/services/storage-service.ts`)

Implement Chrome Storage API wrapper from `contracts/storage-service.ts`:

```typescript
// src/services/storage-service.ts
import type { StorageService } from '../../specs/001-this-is-a/contracts/storage-service';

export class ChromeStorageService implements StorageService {
  async getUserProfile(): Promise<UserProfile | null> {
    const result = await chrome.storage.sync.get('user_profile');
    return result.user_profile || null;
  }
  // ... (implement all methods)
}
```

**Why second**: All services depend on storage.

### 3. Profile Extraction (`src/content/linkedin-extractor.ts`)

Implement LinkedIn DOM scraping:

```typescript
// src/content/linkedin-extractor.ts
import type { TargetProfile } from '../models/target-profile';

export async function extractLinkedInProfile(
  document: Document,
): Promise<TargetProfile> {
  // Use multi-fallback selectors (see research.md #3)
  const name = extractName(document);
  const jobTitle = extractJobTitle(document);
  // ...

  return {
    id: generateId(),
    linkedinUrl: window.location.href,
    name,
    currentJobTitle: jobTitle,
    // ...
  };
}

function extractJobTitle(doc: Document): string | null {
  const selectors = [
    '.text-heading-xlarge',
    '.pv-text-details__title',
    '[data-generated-suggestion-target]',
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      return element.textContent.trim();
    }
  }

  return null;
}
```

**Why third**: Unlocks user story 1 (profile extraction).

### 4. LangChain Agents (`src/background/agent/`)

Implement profile analyzer and message generator:

```typescript
// src/background/agent/profile-analyzer.ts
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from 'langchain/prompts';

export async function analyzeProfile(
  targetProfile: TargetProfile,
  userProfile: UserProfile,
): Promise<ProfileAnalysis> {
  const llm = new ChatOpenAI({
    modelName: 'openai/gpt-4o', // OpenRouter model format
    openAIApiKey: userApiKey, // User's OpenRouter API key
    temperature: 0.7,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },
  });

  const prompt = PromptTemplate.fromTemplate(`
    Analyze this LinkedIn profile for cold outreach opportunities.

    Target Profile:
    {targetProfile}

    User Profile:
    {userProfile}

    Identify:
    - Talking points
    - Mutual interests
    - Connection opportunities
  `);

  // ... (implement analysis chain)
}
```

**Why fourth**: Core AI functionality for message generation.

### 5. React UI Components (`src/popup/components/`)

Build user interface:

```typescript
// src/popup/components/MessageDraft.tsx
import React from 'react';
import type { MessageDraft } from '../../models/message-draft';

export function MessageDraftView({ draft }: { draft: MessageDraft }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">{draft.subject}</h2>
      <div className="mt-2 whitespace-pre-wrap">{draft.body}</div>

      {/* Annotations */}
      <div className="mt-4">
        {draft.annotations.map((annotation, i) => (
          <span
            key={i}
            className={annotation.highlight ? 'bg-yellow-200' : ''}
          >
            {annotation.text}
          </span>
        ))}
      </div>
    </div>
  );
}
```

**Why fifth**: UI to interact with the functionality.

## Common Development Tasks

### Adding a New Service

1. Define contract in `specs/001-this-is-a/contracts/`
2. Create interface in contract file
3. Implement service in `src/services/`
4. Write unit tests in `tests/unit/services/`
5. Wire up in background worker

### Adding a New Data Model

1. Define type in `src/models/`
2. Update `data-model.md` with documentation
3. Add validation rules
4. Update storage service to persist/retrieve
5. Write tests

### Debugging Extension

```bash
# 1. View service worker logs:
# Chrome DevTools → Extensions → Colder → "service worker"

# 2. View content script logs:
# Chrome DevTools → Console (on LinkedIn page)

# 3. View popup logs:
# Right-click extension icon → Inspect popup

# 4. View storage:
# Chrome DevTools → Application → Storage → Extension Storage
```

### Testing LinkedIn Scraping

```bash
# 1. Save LinkedIn profile HTML to test fixtures:
curl https://www.linkedin.com/in/someone/ > tests/fixtures/profile.html

# 2. Test extraction with saved HTML:
pnpm test tests/unit/content/linkedin-extractor.test.ts

# 3. Update selectors if LinkedIn DOM changes:
# Edit src/utils/linkedin-selectors.ts
```

## Next Steps

After setup, follow this implementation order (aligns with user story priorities):

1. **P1 - Profile Extraction & Message Generation**:
   - ✅ Storage service
   - ✅ Profile extraction (content script)
   - ✅ Profile analyzer agent
   - ✅ Message generator agent
   - ✅ Popup UI for message display

2. **P2 - User Profile Setup**:
   - ✅ Options page UI
   - ✅ Profile form with validation
   - ✅ Onboarding flow

3. **P3 - Message Customization**:
   - ✅ Tone selector component
   - ✅ Length slider component
   - ✅ Manual edit handling
   - ✅ Copy to clipboard

4. **P4 - History Tracking**:
   - ✅ Outreach history storage
   - ✅ History dashboard UI
   - ✅ Duplicate detection
   - ✅ Search functionality

## Troubleshooting

### Common Issues

**Issue**: Extension not loading
- **Fix**: Check `manifest.json` syntax, ensure all permissions declared

**Issue**: Content script not injecting
- **Fix**: Verify host permissions include `https://www.linkedin.com/*`

**Issue**: LLM API calls failing
- **Fix**: Check OpenRouter API key in `.env`, verify OpenRouter account has credits, check baseURL is `https://openrouter.ai/api/v1`

**Issue**: Storage quota exceeded
- **Fix**: Run cleanup: `chrome.storage.local.clear()`, check storage usage

**Issue**: OAuth2 flow not working
- **Fix**: Verify Gmail client ID in manifest, check OAuth consent screen setup

## Resources

- **Plasmo Docs**: https://docs.plasmo.com/
- **LangChain.js Docs**: https://js.langchain.com/
- **Chrome Extensions API**: https://developer.chrome.com/docs/extensions/
- **Gmail API**: https://developers.google.com/gmail/api
- **Project Docs**:
  - [spec.md](spec.md) - Feature specification
  - [plan.md](plan.md) - Implementation plan
  - [research.md](research.md) - Technical decisions
  - [data-model.md](data-model.md) - Data structures
  - [contracts/](contracts/) - Service contracts

## Getting Help

- Check existing issues in repository
- Review contract files for API signatures
- Consult research.md for design rationale
- Run tests to verify behavior

## License

[Your License Here]

---

**Ready to start coding!** Begin with `src/models/` → `src/services/storage-service.ts` → `src/content/linkedin-extractor.ts`.
