# Zepid Web Application

![version](https://img.shields.io/badge/version-0.0.0-blue)
![license](https://img.shields.io/badge/license-AGPL--3.0-green)
![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)

---

## Overview

**@libra/web** is the core web application of the Zepid AI ecosystem - a modern AI-native development platform built on Next.js 15 and React 19. It provides an IDE-like interface and experience, integrating multiple AI assistants, GitHub integration, team collaboration, and intelligent code generation to create a comprehensive development environment.

* **AI-Native Experience**: Deep integration with multiple AI models (Anthropic Claude, Azure OpenAI, XAI)
* **Modern Architecture**: Built on Next.js 15 App Router and React 19 Server Components
* **IDE-like Interface**: Professional development experience with real-time code editing and preview
* **Global Deployment**: Serverless architecture on Cloudflare Workers with edge optimization
* **Enterprise Features**: Team collaboration, subscription billing, quota management, and security

## Features

| Category | Highlights |
|----------|------------|
| **AI Integration** | Multi-model AI support, intelligent code generation, context-aware assistance |
| **Development Experience** | IDE-like interface, real-time preview, GitHub integration, version control |
| **Team Collaboration** | Organization management, member permissions, project sharing |
| **Internationalization** | Type-safe i18n with Paraglide.js, English and Chinese support |
| **Authentication** | Better-auth integration, GitHub OAuth, session management |
| **Billing & Subscriptions** | Stripe integration, quota management, usage tracking |
| **Performance** | Server Components, edge deployment, intelligent caching |
| **Developer Tools** | TypeScript, tRPC type safety, comprehensive testing |

## Directory Structure

```text
apps/web/
├── ai/                     # AI integration and providers
│   ├── providers.ts        # AI model configurations
│   ├── generate.ts         # Code generation logic
│   └── prompts/           # AI prompt templates
├── app/                   # Next.js App Router
│   ├── (fontend)/         # Frontend routes
│   │   ├── (dashboard)/   # Dashboard pages
│   │   └── (marketing)/   # Marketing pages
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── billing/           # Billing and subscription
│   ├── dashboard/         # Dashboard UI
│   ├── ide/               # IDE interface
│   ├── marketing/         # Marketing pages
│   └── ui/                # Shared UI components
├── configs/               # Configuration files
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── messages/              # i18n message files
├── paraglide/             # Generated i18n code
├── trpc/                  # tRPC client/server setup
└── types/                 # TypeScript type definitions
```

## Quick Start (Development)

```bash
# 1. Install dependencies from monorepo root
bun install

# 2. Set up environment variables
cp ../../.env.example ../../.env
nano ../../.env

# 3. Start development server (port 3000)
cd apps/web
bun dev
```

Once running, you can access:

* **Main Application**: <http://localhost:3000>
* **Dashboard**: <http://localhost:3000/dashboard>
* **API Documentation**: Available through tRPC integration

<details>
<summary>Example Environment Setup</summary>

```bash
# Database
POSTGRES_URL="postgresql://user:password@localhost:5432/libra"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_GITHUB_CLIENT_ID="your-github-client-id"
BETTER_GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Providers
ANTHROPIC_API_KEY="your-anthropic-key"
AZURE_OPENAI_API_KEY="your-azure-key"
XAI_API_KEY="your-xai-key"

# Cloudflare
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
```

</details>

## Required Environment Variables

| Key | Description | Required |
|-----|-------------|----------|
| `POSTGRES_URL` | PostgreSQL database connection string | ✅ **Required** |
| `BETTER_AUTH_SECRET` | JWT secret for authentication | ✅ **Required** |
| `BETTER_GITHUB_CLIENT_ID` | GitHub OAuth client ID | ✅ **Required** |
| `BETTER_GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ✅ **Required** |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | ✅ **Required** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | ✅ **Required** |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | ✅ **Required** |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | 🔧 Optional |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | 🔧 Optional |
| `XAI_API_KEY` | xAI API key | 🔧 Optional |
| `OPENROUTER_API_KEY` | OpenRouter API key for additional models | 🔧 Optional |
| `STRIPE_SECRET_KEY` | Stripe secret key for billing | 🔧 Optional |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | 🔧 Optional |
| `RESEND_API_KEY` | Resend API key for email services | 🔧 Optional |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret for verification | 🔧 Optional |

## NPM/Bun Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start development server with Turbo (port 3000) |
| `bun run build` | Build production application with i18n compilation |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run test` | Run test suite with Vitest |
| `bun run test:watch` | Run tests in watch mode |
| `bun run cf-typegen` | Generate Cloudflare type definitions |
| `bun run machine-translate` | Auto-translate i18n messages |
| `bun run analyze` | Analyze bundle size |
| `bun run payload` | Run Payload CMS commands |
| `bun run migrate` | Run database migrations |
| `bun update` | Update dependencies |

## Deployment

### Cloudflare Workers Deployment

```bash
# Authenticate with Cloudflare
wrangler auth login

# Deploy to production
bun run deploy
```

### Custom Domain Configuration

```bash
# Add custom domain route
wrangler route add "zepid.dev/*" libra
```

### Environment Variables Setup

```bash
# Set production secrets
wrangler secret put POSTGRES_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put ANTHROPIC_API_KEY
# ... add other secrets as needed
```

## Architecture

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 15.3.5 | React framework with App Router |
| **Runtime** | React | 19.1.0 | UI library with Server Components |
| **Language** | TypeScript | 5.0+ | Type-safe JavaScript |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS framework |
| **State Management** | Zustand | 5.0.6 | Client-side state management |
| **Server State** | TanStack Query | 5.83.0 | Server state management |
| **API Layer** | tRPC | Latest | Type-safe API communication |
| **Database** | PostgreSQL | Latest | Primary database with Hyperdrive |
| **Authentication** | Better-auth | Latest | Modern authentication solution |
| **AI Integration** | AI SDK | 4.3.19 | Unified AI provider interface |
| **Internationalization** | Paraglide.js | 2.2.0 | Type-safe i18n solution |
| **Deployment** | Cloudflare Workers | Latest | Edge computing platform |

### AI Model Support

The application integrates with multiple AI providers:

* **Anthropic Claude**: Primary AI model for code generation
* **Azure OpenAI**: GPT-4 and reasoning models
* **xAI Grok**: Alternative AI provider
* **OpenRouter**: Access to additional models
* **Databricks**: Enterprise AI solutions

### Database Architecture

* **PostgreSQL**: Primary database via Cloudflare Hyperdrive
* **D1**: Cloudflare's SQLite for edge data
* **KV**: Key-value storage for caching
* **R2**: Object storage for assets and cache

## API Reference

### Authentication

The application uses Better-auth for authentication with the following providers:

* **GitHub OAuth**: Primary authentication method
* **Session Management**: JWT-based sessions
* **Organization Support**: Multi-tenant architecture

### tRPC API Routes

Key API endpoints available through tRPC:

* **User Management**: Profile, preferences, organizations
* **Project Operations**: CRUD operations, collaboration
* **AI Integration**: Code generation, model selection
* **Billing**: Subscription management, usage tracking
* **Analytics**: Usage statistics, performance metrics

### Rate Limiting

* **AI Requests**: Based on subscription plan and quotas
* **API Calls**: Cloudflare's default protection
* **File Uploads**: Integrated with CDN service limits

## Internationalization

### Supported Languages

* **English (en)**: Default language
* **Chinese (zh)**: Simplified Chinese support

### Configuration

The application uses Paraglide.js for type-safe internationalization:

```typescript
// Automatic locale detection from:
// 1. URL parameters
// 2. Cookies
// 3. Browser preferences
// 4. Default to English

// Usage in components
import { m } from '@/paraglide/messages'

function Component() {
  return <h1>{m.welcome_message()}</h1>
}
```

### Adding New Languages

1. Add locale to `project.inlang/settings.json`
2. Create message file in `messages/{locale}.json`
3. Run `bun run machine-translate` for auto-translation
4. Update locale configuration in `next.config.mjs`

## Development

### Local Development Setup

1. **Prerequisites**:
   * Node.js 18+ and Bun
   * PostgreSQL database
   * Cloudflare account (for deployment)

2. **Environment Setup**:

   ```bash
   # Clone and install
   git clone <repository>
   bun install

   # Database setup
   docker run --name libra -e POSTGRES_PASSWORD=postgres -d postgres

   # Environment configuration
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Development Workflow**:

   ```bash
   # Start development server
   bun dev

   # Run tests
   bun test

   # Type checking
   bun run typecheck

   # Database migrations
   bun run migrate
   ```

### Code Quality

* **TypeScript**: Strict type checking enabled
* **ESLint**: Code linting with custom rules
* **Prettier**: Code formatting
* **Biome**: Fast linting and formatting
* **Testing**: Vitest for unit and integration tests

## Troubleshooting

### Common Issues

#### Port already in use (3000)

```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
# Or use different port
bun dev --port 3001
```

#### Database connection errors

* Verify `POSTGRES_URL` format
* Check database server is running
* Ensure Hyperdrive configuration is correct

#### AI API errors

* Verify API keys are set correctly
* Check quota limits with providers
* Review model availability and permissions

#### Build failures

* Clear Next.js cache: `rm -rf .next`
* Regenerate i18n: `bun run prebuild`
* Check TypeScript errors: `bun run typecheck`

#### Deployment issues

* Verify Cloudflare authentication: `wrangler whoami`
* Check `wrangler.jsonc` configuration
* Ensure all secrets are set in production

### Getting Help

* Check [DEV.md](./DEV.md) for detailed development guide
* Review [DEV_ZH.md](./DEV_ZH.md) for Chinese documentation
* Check [LOCAL_DEV.md](./LOCAL_DEV.md) for local development specifics
* Open issues in the repository for bugs or feature requests

## Performance Optimization

### Caching Strategy

* **Server Components**: Automatic caching with React 19
* **Static Assets**: CDN caching via Cloudflare
* **API Responses**: TanStack Query caching
* **Database**: Connection pooling with Hyperdrive

### Bundle Optimization

* **Code Splitting**: Automatic with Next.js App Router
* **Tree Shaking**: Unused code elimination
* **Image Optimization**: Custom loader with Cloudflare Images
* **Bundle Analysis**: Available with `bun run analyze`

## Security

### Authentication Security

* **JWT Tokens**: Secure session management
* **OAuth Integration**: GitHub OAuth with proper scopes
* **Session Validation**: Server-side session verification
* **CSRF Protection**: Built-in CSRF protection

### Data Protection

* **Input Validation**: Zod schema validation
* **SQL Injection**: Parameterized queries with Prisma
* **XSS Protection**: React's built-in XSS protection
* **Content Security Policy**: Configured headers

## Further Reading

* [DEV.md](./DEV.md) – Complete English development guide
* [DEV_ZH.md](./DEV_ZH.md) – 完整中文开发指南
* [LOCAL_DEV.md](./LOCAL_DEV.md) – Local development setup
* Next.js Documentation: <https://nextjs.org/docs>
* React 19 Features: <https://react.dev/blog/2024/12/05/react-19>
* Cloudflare Workers: <https://developers.cloudflare.com/workers/>
* Better-auth: <https://www.better-auth.com/>
* Paraglide.js: <https://inlang.com/m/gerre34r/library-inlang-paraglideJs>

---

© 2025 Zepid AI. Licensed under AGPL-3.0.