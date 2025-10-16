# Colder - LinkedIn Outreach Message Generator

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A Chrome extension that generates personalized LinkedIn outreach messages using **Chrome's Built-in AI** (Gemini Nano). No backend, no API keys, completely local and private.

## Why Colder?

Sending personalized LinkedIn messages is effective, but it's a grind. Manually researching each profile and crafting a unique message can take hours out of your day. Colder solves this problem by using local AI to do the heavy lifting for you. It analyzes a profile and generates a high-quality, personalized message in seconds, giving you back your time while boosting your response rates.

## ✨ Features

- 🤖 **Chrome Built-in AI**: Uses Gemini Nano running locally - no external API needed
- 🔒 **100% Private**: All data stored locally, no cloud services
- 🎯 **Smart Profile Analysis**: Extracts key information from LinkedIn profiles
- ✨ **Customizable Messages**: Choose tone, purpose, and length
- 🔄 **Polish & Regenerate**: Refine messages with feedback
- 📝 **Message History**: View and reuse past generations
- ⚡ **No Costs**: No subscription, no API fees, works offline

## 📋 Prerequisites

- **Chrome 128+** (Stable, Dev, or Canary)
- **22+ GB free storage** (for Gemini Nano model)
- **Hardware**: 4+ GB VRAM (GPU) or 16+ GB RAM + 4+ CPU cores
- **Node.js 18+** and **pnpm**

## 🚀 Quick Start

### 1. Enable Chrome AI

1. Open: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
2. Set to: **Enabled**
3. **Restart Chrome**
4. Verify in Console:
   ```javascript
   await LanguageModel.availability();
   // Should return: 'downloadable' or 'available'
   ```

### 2. Install & Build

```bash
git clone https://github.com/yourusername/colder.git
cd colder
pnpm install
pnpm build
```

### 3. Load Extension

1. Open `chrome://extensions/`
2. Enable **"Developer mode"** (top right)
3. Click **"Load unpacked"**
4. Select: `build/chrome-mv3-prod/`

### 4. Download AI Model (First Time Only)

The extension will trigger the 22GB Gemini Nano download automatically on first use. This takes 10-30 minutes depending on your connection.

**Monitor download**: `chrome://on-device-internals` → Model Status tab

## 💡 Usage

1. **Navigate to LinkedIn**: Go to any profile (e.g., `linkedin.com/in/hluaguo`)
2. **Open Extension**: Click the Colder icon or use Chrome sidepanel
3. **Setup Profile**: Fill in your details in the Profile tab (optional but recommended)
4. **Generate Message**:
   - Choose **Tone** (Professional, Casual, Friendly, etc.)
   - Select **Purpose** (Connection, Coffee Chat, Job Inquiry, etc.)
   - Pick **Length** (Short, Medium, Long)
   - Click **"Generate Message"**
5. **Copy & Use**: Click "Copy Message" and paste into LinkedIn

## 📁 Project Structure

```
colder/
├── src/
│   ├── sidepanel.tsx          # Main UI
│   ├── services/
│   │   ├── chrome-ai.ts       # Chrome AI API wrapper
│   │   ├── storage.ts         # Local storage service
│   │   └── prompts.ts         # AI prompt templates
│   ├── contents/
│   │   └── linkedin.ts        # Profile extraction content script
│   ├── components/            # UI components (shadcn/ui)
│   ├── background/            # Background service worker
│   └── types/                 # TypeScript definitions
├── build/                     # Built extension (generated)
└── package.json
```

## 🛠️ Development

```bash
# Development with hot reload
pnpm dev

# Production build
pnpm build

# Package for distribution
pnpm package

# Clean build artifacts
pnpm clean
```

## 🎨 Customization Options

### Tone Options

- **Professional**: Polished but not stiff
- **Casual**: Conversational and relaxed
- **Enthusiastic**: High energy and positive
- **Formal**: Business-like and respectful
- **Friendly**: Warm and approachable

### Purpose Options

- General Connection
- Coffee Chat Request
- Informational Interview
- Collaboration Proposal
- Job Inquiry
- Sales/Partnership
- Custom (your own purpose)

### Length Options

- **Short**: 50-100 words
- **Medium**: 100-200 words
- **Long**: 200-300 words

## 🔧 Troubleshooting

### "Chrome AI not available"

**Solutions:**

1. Verify Chrome version: `chrome://version/` (need 128+)
2. Enable flag: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
3. Restart Chrome completely (Cmd+Q / Ctrl+Q)
4. Check availability in Console:
   ```javascript
   await LanguageModel.availability();
   ```

### Model Download Issues

**Check status**: `chrome://on-device-internals`

**Common fixes:**

- Ensure 22GB+ free disk space
- Use Wi-Fi (not cellular/metered connection)
- Wait 10-30 minutes for initial download
- Restart Chrome if stuck

### Profile Extraction Fails

**Solutions:**

1. Ensure you're on a LinkedIn profile page (`linkedin.com/in/...`)
2. Refresh the page
3. Check console for errors (F12)

### Extension Won't Load

**Solutions:**

1. Rebuild: `pnpm clean && pnpm build`
2. Check for errors in extension console
3. Try removing and re-adding the extension

## 🔒 Privacy & Security

- ✅ **100% Local Processing**: All AI runs in your browser
- ✅ **No External API Calls**: No data sent to servers
- ✅ **No Tracking**: No analytics or telemetry
- ✅ **Local Storage Only**: Data stays on your device
- ✅ **No Cloud Sync**: Complete privacy

## ⚠️ Limitations

- **Chrome Only**: Requires Chrome 128+ with Built-in AI support
- **Storage**: Needs 22GB for Gemini Nano model
- **No Mobile**: Chrome AI not available on mobile devices yet
- **Experimental**: Chrome Built-in AI is still in preview, expect changes
- **Language**: Currently English only (Spanish, Japanese coming soon)

## 🏗️ How It Works

1. **Profile Extraction**: Content script reads LinkedIn profile data
2. **AI Processing**: Sends data to local Gemini Nano model
3. **Message Generation**: AI creates personalized outreach message
4. **Local Storage**: Saves message history locally
5. **Polish & Iterate**: Refine messages with user feedback

**Tech Stack:**

- React + TypeScript
- Plasmo Framework (Chrome Extension)
- Chrome Built-in AI (Prompt API)
- Tailwind CSS + shadcn/ui
- Chrome Storage API

## 📚 Resources

- [Chrome Built-in AI Docs](https://developer.chrome.com/docs/ai)
- [Prompt API Reference](https://developer.chrome.com/docs/ai/prompt-api)
- [Plasmo Framework](https://www.plasmo.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Plasmo Framework](https://www.plasmo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by Chrome's Built-in AI (Gemini Nano)

---

**⚠️ Disclaimer**: This project is not affiliated with Google, Chrome, or LinkedIn. Chrome's Built-in AI is an experimental feature subject to change.

**🚀 Ready to generate personalized LinkedIn messages with local AI? Let's go!**
