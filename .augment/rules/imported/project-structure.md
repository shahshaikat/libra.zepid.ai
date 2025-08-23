---
type: "always_apply"
---

# Zepid AI Project Structure Guidelines

## Overview

Zepid AI is a modern open-source AI-driven development platform built on **Turborepo Monorepo** architecture. This document defines the project structure rules, naming conventions, and organizational patterns that must be followed when working with the codebase.

## Core Architecture Principles

### 1. Monorepo Organization
- **Turborepo First**: All code is organized in a unified monorepo with clear separation between applications and shared packages
- **Separation of Concerns**: Clear boundaries between application layer, business logic layer, and data layer
- **Type Safety First**: End-to-end TypeScript type coverage with Zod validation
- **Developer Experience First**: Bun package manager, Biome code formatting, hot reload support

### 2. Directory Structure Rules

```text
libra/
├── apps/                    # Applications (独立可部署的应用)
│   ├── auth-studio/         # 认证管理控制台 (D1 + drizzle-kit)
│   ├── builder/             # Vite 构建服务 - 代码编译与部署
│   ├── cdn/                 # Hono CDN 服务 - 静态资源管理
│   ├── deploy/              # 部署服务 V2 - Cloudflare Queues
│   ├── deploy-workflow/     # 部署服务 V1 - Cloudflare Workflows (deprecated)
│   ├── dispatcher/          # 请求路由分发器 (Workers for Platforms)
│   ├── docs/                # 技术文档站点 (Next.js + FumaDocs)
│   ├── email/               # 邮件服务预览器 (React Email)
│   ├── screenshot/          # 截图服务 - Cloudflare Queues
│   ├── vite-shadcn-template/# 项目模板引擎 (Vite + shadcn/ui)
│   └── web/                 # Next.js 15 主应用 (React 19)
├── packages/                # 共享包模块
│   ├── api/                 # API 层 (tRPC + 类型安全)
│   ├── auth/                # 认证服务 (better-auth)
│   ├── better-auth-cloudflare/ # Cloudflare 认证适配器
│   ├── better-auth-stripe/  # Stripe 支付集成
│   ├── common/              # 公共工具库与类型定义
│   ├── email/               # 邮件服务组件
│   ├── middleware/          # 中间件服务与工具
│   ├── sandbox/             # 统一沙箱抽象层 (E2B + Daytona)
│   ├── shikicode/           # 代码编辑器 (Shiki 语法高亮)
│   ├── templates/           # 项目脚手架模板
│   └── ui/                  # 设计系统 (shadcn/ui + Tailwind CSS v4)
├── tooling/                 # 开发工具和配置
│   └── typescript-config/   # 共享 TypeScript 配置
├── scripts/                 # Github 环境变量管理
├── biome.json               # Biome 配置
├── bun.lockb                # Bun 锁定文件
├── package.json             # 根级依赖管理 (Bun workspace)
└── turbo.json               # Turborepo 构建配置
```

## Application Structure Rules

### apps/web - Main Web Application
**Technology**: Next.js 15 + React 19 + App Router

```text
apps/web/
├── ai/                      # AI integration and providers
│   ├── models.ts            # AI model configuration and selection logic
│   ├── generate.ts          # Core logic for code generation
│   └── prompts/             # AI prompt template directory
├── app/                     # Next.js App Router
│   ├── (frontend)/          # Frontend route group
│   │   ├── (dashboard)/     # Dashboard page group
│   │   │   ├── dashboard/   # User dashboard
│   │   │   └── project/     # Project management page
│   │   └── (marketing)/     # Marketing page group
│   └── api/                 # API routes
│       ├── ai/              # AI-related APIs
│       ├── auth/            # Authentication APIs
│       ├── trpc/            # tRPC endpoints
│       └── webhooks/        # Webhook handling
├── components/              # React components
│   ├── auth/                # Authentication components
│   ├── billing/             # Billing and subscription components
│   ├── dashboard/           # Dashboard components
│   ├── ide/                 # IDE editor components
│   ├── marketing/           # Marketing page components
│   └── ui/                  # Base UI components
├── hooks/                   # Custom React Hooks
├── lib/                     # Utility function library
├── trpc/                    # tRPC client configuration
└── env.mjs                  # Environment variable configuration
```

**Rules for apps/web**:
- All pages must use App Router structure
- Components should be organized by feature/domain
- Custom hooks must be in `/hooks` directory
- Utility functions go in `/lib` directory
- AI-related code must be in `/ai` directory

### Other Applications Structure

#### apps/builder - Vite Build Service
```text
apps/builder/
├── src/
│   ├── components/          # Build tool UI components
│   ├── lib/                 # Build logic and utilities
│   └── utils/               # Helper functions
├── vite.config.ts           # Vite configuration
└── wrangler.jsonc           # Cloudflare Workers configuration
```

#### apps/cdn - CDN Service (Hono)
```text
apps/cdn/
├── src/
│   ├── routes/              # API route handlers
│   ├── middleware/          # Request middleware
│   └── utils/               # Utility functions
├── wrangler.jsonc           # Workers configuration
└── package.json
```

#### apps/dispatcher - Request Router (Hono)
```text
apps/dispatcher/
├── src/
│   ├── middleware/          # Authentication middleware
│   ├── routes/              # Routing logic
│   └── utils/               # Utility functions
├── wrangler.jsonc           # Cloudflare Workers configuration
└── package.json
```

#### apps/docs - Documentation Site (Next.js + FumaDocs)
```text
apps/docs/
├── app/                     # Next.js App Router
│   ├── [lang]/             # Multi-language routing
│   ├── layout.tsx          # Layout component
│   └── page.tsx            # Homepage
├── components/              # Documentation components
│   ├── language-switcher.tsx # Language switcher
│   ├── heading.tsx         # Heading component
│   └── scroller.tsx        # Scroll component
├── content/                 # Documentation content
│   ├── meta.json           # English metadata
│   ├── meta.zh.json        # Chinese metadata
│   ├── opensource/         # Open source documentation
│   └── platform/           # Platform documentation
├── lib/                     # Utility functions
│   ├── i18n.ts             # Internationalization configuration
│   └── translations.ts     # Translation management
├── source.config.ts         # FumaDocs configuration
└── wrangler.jsonc          # Cloudflare Workers configuration
```

## Shared Packages Structure Rules

### packages/api - tRPC API Layer
```text
packages/api/
├── src/
│   ├── router/              # Business logic routers
│   │   ├── ai.ts           # AI text generation and enhancement
│   │   ├── custom-domain.ts # Custom domain management
│   │   ├── file.ts         # File structure and template management
│   │   ├── github.ts       # GitHub integration and repository management
│   │   ├── hello.ts        # Health check and basic endpoints
│   │   ├── history.ts      # Project history and version control
│   │   ├── project/        # Project operations (modular structure)
│   │   │   ├── basic-operations.ts      # CRUD operations
│   │   │   ├── container-operations.ts  # Container management
│   │   │   ├── deployment-operations.ts # Deployment status management
│   │   │   ├── history-operations.ts    # Screenshot and history
│   │   │   ├── special-operations.ts    # Fork and hero projects
│   │   │   └── status-operations.ts     # Status and quota queries
│   │   ├── project.ts      # Main project router aggregation
│   │   ├── session.ts      # User session management
│   │   ├── stripe.ts       # Payment and subscription processing
│   │   └── subscription.ts # Usage limits and quota management
│   ├── schemas/             # Data validation schemas
│   │   ├── file.ts         # File structure validation
│   │   ├── project.ts      # Project data validation
│   │   └── subscription.ts # Subscription validation
│   ├── utils/               # Utility functions
│   │   ├── auth.ts         # Authentication helpers
│   │   ├── quota.ts        # Quota management utilities
│   │   └── validation.ts   # Validation helpers
│   ├── trpc.ts             # tRPC configuration and procedures
│   └── index.ts            # Main export
├── env.mjs                 # Environment variables
└── package.json
```

**Rules for packages/api**:
- All routers must be in `/src/router/` directory
- Data validation schemas must be in `/src/schemas/` directory
- Utility functions must be in `/src/utils/` directory
- Each router should have a single responsibility
- Use tRPC procedures for type safety
- All inputs must be validated with Zod schemas

### packages/ui - Design System
```text
packages/ui/
├── src/
│   ├── components/          # UI components
│   │   ├── ui/             # Base UI components (Button, Input, etc.)
│   │   ├── forms/          # Form components
│   │   ├── layout/         # Layout components
│   │   └── feedback/       # Feedback components (Toast, Alert, etc.)
│   ├── styles/             # Style definitions
│   │   ├── globals.css     # Global styles
│   │   ├── variables.css   # CSS variables (OKLCH colors)
│   │   ├── theme.css       # Theme definitions
│   │   ├── utils.css       # Utility classes
│   │   └── quota.css       # Quota-specific styles
│   ├── lib/                # Utility functions
│   │   ├── utils.ts        # Class name utilities (cn function)
│   │   └── constants.ts    # Design system constants
│   └── index.ts            # Main export
├── components.json         # shadcn/ui configuration
├── postcss.config.mjs      # PostCSS configuration
└── package.json
```

**Rules for packages/ui**:
- All components must follow shadcn/ui patterns
- Use CVA (Class Variance Authority) for component variants
- CSS variables must be defined in `/src/styles/variables.css`
- Use OKLCH color space for all color definitions
- Components must support `asChild` pattern via Radix UI Slot
- All components must be properly typed with TypeScript

### packages/auth - Authentication System
```text
packages/auth/
├── auth-client.ts          # Client-side authentication
├── auth-server.ts          # Server-side authentication
├── plugins.ts              # Authentication plugins
├── db/                     # Database schema and migrations
│   ├── schema.ts          # Authentication database schema
│   └── migrations/        # Database migrations
├── plugins/                # Custom authentication plugins
│   ├── stripe.ts          # Stripe integration plugin
│   └── organization.ts    # Organization management plugin
├── utils/                  # Authentication utilities
│   ├── session.ts         # Session management
│   └── validation.ts      # Validation helpers
├── webhooks/               # Webhook handlers
│   ├── stripe.ts          # Stripe webhook handlers
│   └── github.ts          # GitHub webhook handlers
├── drizzle.config.ts       # Drizzle ORM configuration
├── env.mjs                 # Environment variables
└── package.json
```

**Rules for packages/auth**:
- Use better-auth as the core authentication framework
- Database schema must be in `/db/schema.ts`
- All plugins must be in `/plugins/` directory
- Webhook handlers must be in `/webhooks/` directory
- Client and server configurations must be separate files
- Use Cloudflare D1 for authentication database

### packages/common - Shared Utilities
```text
packages/common/
├── src/
│   ├── types/              # Shared type definitions
│   │   ├── api.ts         # API-related types
│   │   ├── auth.ts        # Authentication types
│   │   ├── project.ts     # Project-related types
│   │   └── subscription.ts # Subscription types
│   ├── utils/              # Utility functions
│   │   ├── error.ts       # Error handling utilities (tryCatch)
│   │   ├── logger.ts      # Structured logging
│   │   ├── validation.ts  # Validation helpers
│   │   └── constants.ts   # Application constants
│   ├── config/             # Configuration files
│   │   ├── ai-models.ts   # AI model configurations
│   │   └── plans.ts       # Subscription plan definitions
│   └── index.ts            # Main export
├── __tests__/              # Unit tests
└── package.json
```

**Rules for packages/common**:
- All shared types must be in `/src/types/` directory
- Utility functions must be in `/src/utils/` directory
- Configuration files must be in `/src/config/` directory
- Use structured logging with component-level categorization
- All utilities must be properly tested
- Export everything through main index.ts file

## File Naming Conventions

### General Rules
- Use **kebab-case** for file and directory names: `user-profile.tsx`, `api-client.ts`
- Use **PascalCase** for React components: `UserProfile.tsx`, `ApiClient.tsx`
- Use **camelCase** for utility functions and variables: `getUserProfile`, `apiClient`
- Use **SCREAMING_SNAKE_CASE** for constants: `API_BASE_URL`, `MAX_FILE_SIZE`

### Specific Naming Patterns

#### React Components
```text
✅ Correct:
- UserProfile.tsx
- ProjectCard.tsx
- AuthButton.tsx
- DashboardLayout.tsx

❌ Incorrect:
- userProfile.tsx
- project_card.tsx
- auth-button.tsx
- dashboardlayout.tsx
```

#### API Routes and Handlers
```text
✅ Correct:
- user-profile.ts
- project-management.ts
- auth-callback.ts
- webhook-handler.ts

❌ Incorrect:
- UserProfile.ts
- projectManagement.ts
- authCallback.ts
- WebhookHandler.ts
```

#### Configuration Files
```text
✅ Correct:
- next.config.mjs
- tailwind.config.ts
- drizzle.config.ts
- wrangler.jsonc

❌ Incorrect:
- nextConfig.mjs
- tailwindConfig.ts
- drizzleConfig.ts
- wranglerConfig.jsonc
```

#### Database Schema and Types
```text
✅ Correct:
- user-schema.ts
- project-schema.ts
- subscription-schema.ts
- auth-types.ts

❌ Incorrect:
- UserSchema.ts
- projectSchema.ts
- subscription_schema.ts
- AuthTypes.ts
```

## Import and Export Rules

### Import Organization
Imports must be organized in the following order:
1. Node.js built-in modules
2. External packages (npm packages)
3. Internal packages (@libra/*)
4. Relative imports (./*, ../)

```typescript
// ✅ Correct import order
import { readFile } from 'fs/promises'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { auth } from '@libra/auth'
import { db } from '@libra/db'
import { Button } from '@libra/ui'
import { validateInput } from '../utils/validation'
import { UserProfile } from './UserProfile'
```

### Export Patterns
- Use **named exports** for utilities and components
- Use **default exports** for pages and main entry points
- Always export types alongside implementations

```typescript
// ✅ Correct export patterns
export const validateUser = (user: User) => { ... }
export type User = { ... }
export { UserProfile } from './UserProfile'

// For main entry points
export default function HomePage() { ... }
```

## Technology Stack Rules

### Frontend Technology Requirements
- **Next.js 15+** with App Router for web applications
- **React 19+** with Server Components where applicable
- **TypeScript 5.8+** with strict mode enabled
- **Tailwind CSS v4** with CSS-in-CSS syntax
- **Radix UI** for primitive components
- **shadcn/ui** patterns for component development

### Backend Technology Requirements
- **Hono** for Cloudflare Workers applications
- **tRPC** for type-safe API development
- **Drizzle ORM** for database operations
- **better-auth** for authentication
- **Zod** for runtime validation

### Database Requirements
- **PostgreSQL** (via Neon + Hyperdrive) for business data
- **Cloudflare D1** (SQLite) for authentication data
- **Drizzle ORM** for all database operations
- **Drizzle Kit** for migrations

## Development Workflow Rules

### Package Management
- **MUST** use **Bun** as the package manager (not npm or yarn)
- **MUST** use `bun install` for installing dependencies
- **MUST** use `bun add` for adding new dependencies
- **MUST** use `bun remove` for removing dependencies
- **NEVER** manually edit package.json for dependencies

### Build and Development Commands
```bash
# Development
bun dev                    # Start all applications in development mode
bun dev:web               # Start only web application (excluding stripe)

# Building
bun build                 # Build all applications
turbo build --concurrency=100%

# Code Quality
bun lint                  # Run linting
bun lint:fix             # Fix linting issues
bun format               # Check formatting
bun format:fix           # Fix formatting issues
bun typecheck            # Type checking

# Database
bun migration:generate    # Generate database migrations
bun migration:local      # Run local migrations
```

### Code Quality Rules
- **MUST** use **Biome** for linting and formatting (not ESLint + Prettier)
- **MUST** pass type checking before committing
- **MUST** follow the import organization rules
- **MUST** use structured logging for all applications
- **MUST** validate all inputs with Zod schemas

### Environment Variables
- **MUST** define environment variables in `env.mjs` files
- **MUST** use Zod for environment variable validation
- **MUST** provide `.env.example` files for all applications
- **NEVER** commit actual `.env` files to version control

### Testing Requirements
- **MUST** write unit tests for utility functions
- **MUST** write integration tests for API endpoints
- **MUST** use Vitest as the testing framework
- **SHOULD** aim for >80% code coverage for critical paths

## Security and Performance Rules

### Security Requirements
- **MUST** validate all user inputs with Zod schemas
- **MUST** use better-auth for all authentication
- **MUST** implement proper CORS policies
- **MUST** use HTTPS in production
- **MUST** sanitize all user-generated content
- **NEVER** expose sensitive data in client-side code

### Performance Requirements
- **MUST** use React Server Components where applicable
- **MUST** implement proper caching strategies
- **MUST** optimize images using Cloudflare Images
- **MUST** use streaming responses for AI generation
- **SHOULD** implement proper loading states
- **SHOULD** use code splitting for large bundles

## Documentation Requirements

### Code Documentation
- **MUST** document all public APIs with JSDoc comments
- **MUST** provide README.md files for all packages and applications
- **MUST** document environment variables and their purposes
- **SHOULD** provide usage examples for complex utilities

### Architecture Documentation
- **MUST** update this structure guide when adding new packages/apps
- **MUST** document any architectural decisions in ADR format
- **MUST** maintain up-to-date dependency graphs
- **SHOULD** provide migration guides for breaking changes

## Enforcement and Compliance

### Automated Checks
- Biome linting and formatting checks
- TypeScript type checking
- Import organization validation
- File naming convention checks
- Environment variable validation

### Manual Review Requirements
- All new packages must follow the structure rules
- All new applications must have proper README documentation
- All database schema changes must be reviewed
- All security-related changes must be reviewed by maintainers

### Violation Handling
- Structure violations should be caught in CI/CD pipeline
- Naming convention violations should be flagged in code review
- Security violations should block deployment
- Performance regressions should trigger alerts

---

**Last Updated**: 2025-07-30
**Version**: 1.0
**Maintainers**: Zepid AI Team

This document is the authoritative source for project structure rules and must be followed by all contributors to maintain consistency and quality across the Zepid AI codebase.
