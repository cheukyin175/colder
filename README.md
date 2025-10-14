# Colder - LinkedIn Outreach Message Generator

A Chrome extension that generates personalized LinkedIn outreach messages using AI. Analyze profiles and craft engaging messages with customizable tone, purpose, and length.

## Features

- 🎯 **Smart Profile Analysis**: Extracts key information from LinkedIn profiles
- 🤖 **AI-Powered Generation**: Creates personalized messages using advanced language models
- 🎨 **Customizable Messages**: Choose tone (professional, casual, friendly, etc.) and purpose (connection, coffee chat, job inquiry, etc.)
- ✨ **Message Polish**: Refine generated messages with specific feedback
- 🔄 **Regenerate**: Get new versions with the same settings
- 🔐 **Secure Authentication**: Powered by Supabase Auth
- 💳 **Credit System**: Fair usage with credit-based generation

## Tech Stack

- **Frontend**: Chrome Extension with React, TypeScript, Tailwind CSS (Plasmo Framework)
- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Authentication**: Supabase Auth
- **AI**: OpenRouter API (supports multiple models including GPT-4, Claude, Gemini)

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (or use Supabase local development)
- Chrome browser for extension testing
- OpenRouter API key for AI generation (see setup instructions below)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/colder.git
cd colder
```

### 2. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install backend dependencies
cd backend
pnpm install
cd ..
```

### 3. Set Up OpenRouter (AI Provider)

OpenRouter provides unified access to multiple AI models (GPT-4, Claude, Gemini, etc.) with a single API.

#### Getting Your API Key

1. **Sign Up**: Go to [openrouter.ai](https://openrouter.ai) and create an account
2. **Add Credits**:
   - Navigate to the Credits section
   - Add credits ($5 minimum recommended for testing)
   - OpenRouter uses pay-per-token pricing
3. **Generate API Key**:
   - Go to [openrouter.ai/keys](https://openrouter.ai/keys)
   - Click "Create Key"
   - Name it (e.g., "Colder Extension")
   - Copy the key (starts with `sk-or-v1-`)
   - **Save it securely** - you won't see it again!

#### Pricing & Models

OpenRouter charges per token based on the model used. Popular options:

| Model | Cost per 1M tokens | Speed | Quality | Best For |
|-------|-------------------|--------|---------|----------|
| `google/gemini-2.0-flash` | $0.30 | ⚡ Fast | Good | Budget-friendly, quick generation |
| `openai/gpt-4-turbo` | $10.00 | Medium | Excellent | High-quality messages |
| `anthropic/claude-3-sonnet` | $3.00 | Medium | Excellent | Nuanced, thoughtful messages |
| `meta-llama/llama-3.1-70b` | $0.70 | Fast | Good | Open source alternative |

💡 **Tip**: Start with `gemini-2.0-flash` for testing - it's fast and affordable!

#### Usage Estimates

With $5 credit, you can generate approximately:
- **Gemini Flash**: ~15,000 messages
- **GPT-4 Turbo**: ~500 messages
- **Claude Sonnet**: ~1,500 messages

### 4. Set Up Supabase (Authentication & Database)

#### Option A: Use Supabase Cloud (Recommended for Quick Start)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API to get your credentials
4. Note down:
   - Project URL
   - Anon/Public key
   - Service role key (for backend)

#### Option B: Local Supabase Development

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start Supabase locally
supabase start

# This will output your local credentials:
# API URL: http://127.0.0.1:54321
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Anon key: [your-anon-key]
```

### 4. Configure Environment Variables

#### Backend Configuration (`backend/.env`)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Supabase
SUPABASE_URL="http://127.0.0.1:54321"  # or your cloud URL
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"  # optional but recommended
SUPABASE_JWT_SECRET="your-jwt-secret"  # at least 32 characters

# AI Model
OPENROUTER_API_KEY="sk-or-v1-your-key"  # Get from openrouter.ai
DEFAULT_MODEL="google/gemini-2.0-flash"  # or any OpenRouter model
```

#### Frontend Configuration (`.env.local`)

```env
# Supabase
PLASMO_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"  # or your cloud URL
PLASMO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 5. Set Up the Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

### 6. Start Development Servers

#### Terminal 1: Backend Server
```bash
cd backend
pnpm dev
# Backend runs on http://localhost:3000
```

#### Terminal 2: Extension Development
```bash
# In root directory
pnpm dev
# Extension development server starts
```

### 7. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev` folder from your project
5. The Colder extension icon should appear in your toolbar

## Usage

1. **Sign Up/Sign In**: Click the extension icon and create an account
2. **Configure Settings**: Add your name, role, and value proposition
3. **Navigate to LinkedIn**: Go to any LinkedIn profile
4. **Generate Message**:
   - Select tone (Professional, Casual, Friendly, etc.)
   - Choose purpose (Connection, Coffee Chat, Job Inquiry, etc.)
   - Pick length (Short, Medium, Long)
   - Click "Generate Message"
5. **Refine**: Use "Polish" to refine with specific feedback
6. **Copy**: Click "Copy Message" to use in LinkedIn

## Project Structure

```
colder/
├── src/                    # Extension source (React components)
│   ├── popup.tsx          # Main extension popup
│   ├── content.ts         # LinkedIn content script
│   └── lib/               # Utilities and Supabase client
├── backend/
│   ├── src/
│   │   ├── agents/        # AI agents for analysis and generation
│   │   ├── auth/          # JWT strategy and guards
│   │   ├── generate/      # Message generation endpoints
│   │   ├── settings/      # User settings management
│   │   └── supabase/      # Supabase service
│   └── prisma/
│       └── schema.prisma  # Database schema
├── package.json
└── manifest.json          # Extension manifest
```

## API Endpoints

- `POST /generate` - Generate a new message
- `POST /generate/regenerate` - Generate a new version
- `POST /generate/polish` - Polish existing message
- `GET /settings` - Get user settings
- `PUT /settings` - Update user settings

## Development Commands

```bash
# Root directory
pnpm dev          # Start extension dev server
pnpm build        # Build extension for production
pnpm package      # Create extension zip file

# Backend directory
pnpm dev          # Start backend dev server
pnpm build        # Build backend
pnpm start:prod   # Start production server
npx prisma studio # Open database GUI
```

## Deployment

### Backend Deployment (Recommended: Railway, Render, or Heroku)

1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy NestJS application
4. Run database migrations

### Extension Publishing

1. Build production version: `pnpm build`
2. Create zip: `pnpm package`
3. Upload to Chrome Web Store

## Configuration Options

### AI Models (via OpenRouter)

The extension supports any model available on OpenRouter. Popular options:
- `openai/gpt-4-turbo-preview` - Best quality
- `anthropic/claude-3-opus` - Great for nuanced messages
- `google/gemini-2.0-flash` - Fast and cost-effective
- `meta-llama/llama-3.1-70b` - Open source alternative

Change the model in `backend/.env`:
```env
DEFAULT_MODEL="your-preferred-model"
```

### Database Options

While PostgreSQL is recommended, you can use any database supported by Prisma:
- PostgreSQL (recommended)
- MySQL
- SQLite (for development)
- MongoDB

## Troubleshooting

### Extension Not Loading
- Ensure you're in developer mode
- Check console for errors: Right-click extension → Inspect popup

### Backend Connection Issues
- Verify backend is running on port 3000
- Check CORS settings in `backend/src/main.ts`
- Ensure `.env` files are properly configured

### Database Issues
- Run `npx prisma db push` to sync schema
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is running

### Authentication Issues
- Verify Supabase credentials match in frontend and backend
- Check JWT_SECRET is the same in backend
- Ensure Supabase project is running (if local)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

## Security

- Never commit `.env` files
- Keep API keys secure
- Use environment variables for sensitive data
- Regularly update dependencies

---

Built with ❤️ for better LinkedIn outreach