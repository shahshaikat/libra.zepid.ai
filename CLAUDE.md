# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Zepid is an AI-powered web development platform built as a Turborepo monorepo targeting Cloudflare Workers infrastructure. The codebase follows a microservices architecture with shared packages for common functionality.

### Core Structure
```
libra/
├── apps/                          # Application services
│   ├── web/                       # Next.js 15 main application (React 19)
│   ├── builder/                   # Vite build service
│   ├── cdn/                       # Hono CDN service
│   ├── deploy/                    # Deployment service V2 (Cloudflare Queues)
│   ├── deploy-workflow/           # Deployment service V1 (Cloudflare Workflows)
│   ├── dispatcher/                # Request routing (Workers for Platforms)
│   ├── auth-studio/               # Authentication management console
│   ├── docs/                      # Documentation site (Next.js + FumaDocs)
│   ├── email/                     # Email service (React Email)
│   ├── screenshot/                # Screenshot service
│   └── vite-shadcn-template/      # Project template engine
├── packages/                      # Shared libraries
│   ├── api/                       # tRPC API layer
│   ├── auth/                      # Authentication (better-auth)
│   ├── better-auth-cloudflare/    # Cloudflare adapter for better-auth
│   ├── better-auth-stripe/        # Stripe integration for better-auth
│   ├── common/                    # Shared utilities
│   ├── db/                        # Database layer (Drizzle ORM)
│   ├── email/                     # Email templates and utilities
│   ├── middleware/                # Shared middleware components
│   ├── sandbox/                   # Sandbox execution abstraction (E2B/Daytona)
│   ├── shikicode/                 # Code editor with syntax highlighting
│   ├── templates/                 # Project scaffolding templates
│   └── ui/                        # Design system (shadcn/ui + Tailwind v4)
└── tooling/                       # Development tools
```

## Technology Stack

### Core Technologies
- **Runtime**: Bun 1.2.19+ (package manager and runtime)
- **Monorepo**: Turborepo 2.5.5 for build orchestration
- **Frontend**: Next.js 15.3.5 with React 19.1.0
- **Backend**: Hono 4.8.5+ web framework for Cloudflare Workers
- **Database**: Dual setup - PostgreSQL (via Neon + Hyperdrive) for business data, Cloudflare D1 (SQLite) for auth
- **ORM**: Drizzle ORM 0.44.3 with Drizzle Kit for migrations
- **Authentication**: better-auth 1.3.3
- **API**: tRPC 11.4.3+ for type-safe APIs
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **AI Integration**: AI SDK 4.3.19 with multiple providers (Claude, OpenAI, Gemini, DeepSeek)
- **Deployment**: Cloudflare Workers with OpenNext adapter

### Cloudflare Services Used
- Workers (serverless compute)
- Durable Objects (state management)
- D1 (SQLite database)
- KV (key-value storage)
- R2 (object storage)
- Queues (async processing)
- Workflows (deployment orchestration)
- Workers for Platforms (multi-tenancy)

## Development Commands

### Environment Setup
```bash
# Install dependencies
bun install

# Initialize databases
# Main database (PostgreSQL) - if packages/db exists
cd packages/db && bun db:migrate

# Auth database (D1/SQLite) - local development
cd apps/web && bun wrangler d1 execute libra --local --command='SELECT 1'
cd ../../packages/auth && bun db:migrate

# Configure environment
cp .env.example .env
# Edit .env with required API keys and database URLs
```

### Development
```bash
# Start all services in development
bun dev

# Start only web app (most common)
bun dev:web

# Start specific app
cd apps/web && bun dev
```

### Building and Testing
```bash
# Build all packages
bun build

# Type checking across monorepo
bun typecheck

# Run tests (no root level test script)
cd apps/web && bun test     # Web app tests
cd packages/auth && bun test # Auth package tests
bun test:watch              # Watch mode (in specific packages)
```

### Code Quality
```bash
# Lint code (using Biome)
bun lint
bun lint:fix

# Format code
bun format
bun format:fix

# Check dependencies
bun check-deps
```

### Database Operations
```bash
# Generate migrations
bun migration:generate

# Run migrations locally
bun migration:local

# Database studio (auth database)
bun studio:dev
```

### Deployment
```bash
# Preview deployment
bun preview

# Deploy to Cloudflare
bun deploy

# Deploy cache service
bun deploy:cache
```

## Key Development Patterns

### Database Architecture
- **Dual Database Setup**: PostgreSQL for business data, D1 for authentication
- **Connection Management**: Use Hyperdrive for PostgreSQL connection pooling
- **Migrations**: Drizzle Kit handles schema migrations
- **Type Safety**: Full TypeScript integration with Drizzle ORM

### API Development
- **tRPC Routers**: Located in `packages/api/src/router/`
- **Type Safety**: End-to-end type safety from database to client
- **Error Handling**: Consistent error handling patterns with custom error types
- **Validation**: Zod schemas for input validation

### Component Development
- **Design System**: Use components from `packages/ui/`
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Component Structure**: Follow shadcn/ui patterns with Radix UI primitives
- **Testing**: Vitest for unit tests with proper mocking

### Authentication
- **better-auth**: Handles OAuth, email verification, and session management
- **Multi-Provider**: GitHub OAuth and email authentication
- **Organization System**: Built-in organization and permission management
- **Stripe Integration**: Commercial subscription handling

### AI Integration
- **Multi-Model Support**: Claude, OpenAI, Gemini, DeepSeek via AI SDK
- **Quota Management**: Built-in usage tracking and billing integration
- **Sandbox Execution**: E2B and Daytona for secure code execution
- **Context Management**: Smart context handling for AI conversations

## Local Service Addresses

When running locally:
- **Main App**: http://localhost:3000
- **Email Preview**: http://localhost:3001
- **Auth Studio**: http://localhost:3002
- **Documentation**: http://localhost:3003
- **CDN Service**: http://localhost:3004
- **Build Service**: http://localhost:5173 (Vite default)
- **Template Service**: http://localhost:5173 (Vite default)
- **Dispatcher**: http://localhost:3007
- **Deploy Service V2**: http://localhost:3008
- **Deploy Workflow V1**: http://localhost:3008 (same as V2)
- **Screenshot Service**: http://localhost:3009

## Important Configuration Files

- `turbo.json` - Turborepo build configuration
- `biome.json` - Code formatting and linting (replaces ESLint/Prettier)
- `wrangler.jsonc` - Cloudflare Workers configuration (per app)
- `drizzle.config.ts` - Database configuration
- `.env` - Environment variables (copy from `.env.example`)

## Working with the Codebase

### Adding New Features
1. Use TodoWrite to plan multi-step implementations
2. Follow existing patterns in similar components/services
3. Ensure type safety with TypeScript and Zod validation
4. Write tests using Vitest
5. Run linting and formatting before committing

### Database Changes
1. Modify schema in appropriate package (`packages/auth` for auth data)
2. Generate migration: `cd packages/auth && bun db:generate`
3. Run migration: `cd packages/auth && bun db:migrate`
4. For remote D1: `cd packages/auth && bun db:migrate-remote`
5. Ensure proper TypeScript types are updated

### API Development
1. Add routes in `packages/api/src/router/`
2. Use Zod for input validation
3. Implement proper error handling
4. Test with tRPC client in frontend components

### Debugging
- Use browser dev tools for frontend debugging
- Check Cloudflare Workers logs for backend issues
- Use Wrangler CLI for local Cloudflare services testing
- Database studio available via `bun studio:dev`