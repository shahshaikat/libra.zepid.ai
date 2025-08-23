# @libra/api

[![Version](https://img.shields.io/npm/v/@libra/api.svg)](https://npmjs.org/package/@libra/api)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/libra-ai/libra/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **Enterprise-grade type-safe API layer for the Zepid AI platform**

`@libra/api` is a comprehensive, type-safe backend service built on tRPC that powers the core business capabilities of the Zepid platform. It provides a unified, scalable API interface for AI-powered development workflows, project management, user authentication, payment processing, and third-party integrations.

## ✨ Key Features

### 🔒 **Type-Safe API Layer**
- **End-to-end type safety** with tRPC and TypeScript
- **Automatic type inference** for inputs and outputs
- **Runtime validation** with Zod schemas
- **Comprehensive error handling** with structured error responses

### 🚀 **Core Business Capabilities**
- **AI Integration** - Azure OpenAI integration with quota management
- **Project Management** - Complete project lifecycle management
- **File System** - Template-based file structure management
- **Version Control** - Git/GitHub integration with automated workflows
- **Container Management** - E2B sandbox environment provisioning
- **Deployment Management** - Deployment status tracking and configuration
- **Custom Domains** - Custom domain management and validation

### 💳 **Enterprise Features**
- **Payment Processing** - Stripe integration with subscription management
- **User Authentication** - Organization-based access control
- **Audit Logging** - Comprehensive activity tracking
- **Rate Limiting** - Usage quotas and fair-use policies
- **Security** - CSRF protection with Cloudflare Turnstile

### 🛠 **Developer Experience**
- **Modular Architecture** - Clean separation of concerns with organized router structure
- **Extensible Design** - Easy to add new routers and middleware
- **Rich Documentation** - Comprehensive API reference and examples
- **Type Safety** - End-to-end type inference with tRPC and TypeScript

## 🏗 Architecture Overview

```
@libra/api
├── 🎯 Routers (Business Logic)
│   ├── ai.ts          # AI text generation and enhancement
│   ├── custom-domain.ts # Custom domain management
│   ├── file.ts        # File structure and template management
│   ├── github.ts      # GitHub integration and repository management
│   ├── hello.ts       # Health check and basic endpoints
│   ├── history.ts     # Project history and version control
│   ├── project/       # Project operations (modular structure)
│   │   ├── basic-operations.ts      # CRUD operations
│   │   ├── container-operations.ts  # Container management
│   │   ├── deployment-operations.ts # Deployment status management
│   │   ├── history-operations.ts    # Screenshot and history
│   │   ├── special-operations.ts    # Fork and hero projects
│   │   └── status-operations.ts     # Status and quota queries
│   ├── project.ts     # Main project router aggregation
│   ├── session.ts     # User session management
│   ├── stripe.ts      # Payment and subscription handling
│   └── subscription.ts # Usage limits and quota management
├── 📋 Schemas (Data Validation)
│   ├── file.ts        # File structure validation
│   ├── history.ts     # History record types
│   ├── project-schema.ts # Project data validation
│   └── turnstile.ts   # Security validation
├── 🔧 Utils (Helper Functions)
│   ├── cloudflare-domain.ts # Cloudflare domain utilities
│   ├── container.ts   # E2B sandbox management
│   ├── excludedFiles.ts # File exclusion patterns
│   ├── github-auth.ts # GitHub authentication
│   ├── membership-validation.ts # Organization membership
│   ├── project-operations.ts # Project operation helpers
│   ├── project.ts     # Project utilities
│   ├── screenshot-client.ts # Screenshot service client
│   ├── screenshot-service.ts # Screenshot service
│   └── stripe-utils.ts # Payment utilities
└── ⚙️ Core Infrastructure
    ├── trpc.ts        # tRPC configuration and middleware
    ├── root.ts        # Router aggregation
    └── index.ts       # Package exports
```

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @libra/api

# Using pnpm
pnpm add @libra/api

# Using bun
bun add @libra/api
```

### Basic Usage

#### Server-Side Usage (App Router)

```typescript
import { createCaller, createTRPCContext } from '@libra/api'

// Create server-side caller
export async function getProjects() {
  const trpc = createCaller(await createTRPCContext({ headers: new Headers() }))
  const projects = await trpc.project.list()
  return projects
}
```

#### Client-Side Usage (React Components)

```typescript
'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery, useMutation } from '@tanstack/react-query'

export function ProjectList() {
  const trpc = useTRPC()
  
  // Query data
  const { data: projects, isLoading } = useQuery({
    ...trpc.project.list.queryOptions({}),
  })
  
  // Mutation
  const createProject = useMutation(trpc.project.create.mutationOptions())
  
  const handleCreate = () => {
    createProject.mutate({
      name: 'My New Project',
      visibility: 'private',
      templateType: 'default'
    })
  }
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <button onClick={handleCreate}>Create Project</button>
      {projects?.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  )
}
```

## 📚 API Overview

> **Note**: Deployment functionality is handled by separate services (`@libra/deploy` and `@libra/deploy-workflow`) rather than a dedicated router in this package. The `project` router includes deployment status management operations.

### Core Routers

| Router | Description | Key Operations |
|--------|-------------|----------------|
| `ai` | AI text generation and enhancement | `generateText` |
| `project` | Project lifecycle management | `create`, `update`, `list`, `delete`, `fork`, `getDeploymentStatus`, `updateDeploymentStatus` |
| `github` | GitHub integration | `getRepositories`, `pushCode`, `createProjectRepository` |
| `customDomain` | Custom domain management | Domain configuration and validation |
| `file` | File management | `getFileTree` |
| `history` | Project history | `getAll`, `appendHistory`, `revert` |
| `stripe` | Payment processing | `getUserPlans`, `createPortalSession` |
| `subscription` | Usage management | `getUsage` |
| `session` | Session management | `list` |
| `hello` | Health check and basic endpoints | Basic API health checks |

### Authentication Levels

- **`publicProcedure`** - No authentication required
- **`protectedProcedure`** - User authentication required
- **`organizationProcedure`** - Organization membership required

## 🔧 Environment Configuration

```bash
# AI Configuration
AZURE_RESOURCE_NAME=your-azure-resource
AZURE_API_KEY=your-azure-api-key
AZURE_DEPLOYMENT_NAME=your-deployment
AZURE_BASE_URL=https://your-gateway.com

# GitHub Integration
GITHUB_APP_ID=your-app-id
GITHUB_APP_CLIENT_ID=your-client-id
GITHUB_APP_CLIENT_SECRET=your-client-secret
GITHUB_APP_PRIVATE_KEY=your-private-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_AI_GATEWAY_NAME=your-gateway

# Application Settings
NEXT_PUBLIC_APP_URL=https://your-app.com
```

## 🏢 Technology Stack

### Core Framework
- **[tRPC](https://trpc.io/)** - Type-safe API framework with end-to-end type safety
- **[SuperJSON](https://github.com/blitz-js/superjson)** - Enhanced serialization for complex data types

### Data & Validation
- **[Zod](https://zod.dev/)** - Runtime validation and type inference
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database operations (via @libra/db)

### Financial & Payments
- **[Dinero.js](https://dinerojs.com/)** - Immutable money handling and calculations
- **[Stripe](https://stripe.com/)** - Payment processing and subscription management

### AI & Development
- **[Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)** - AI capabilities and text generation
- **[E2B](https://e2b.dev/)** - Sandbox environments for code execution

### Infrastructure
- **[Better Auth](https://better-auth.com/)** - Authentication and session management
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Edge deployment platform

## 📖 Documentation

- **[Development Guide](./DEV.md)** - Comprehensive development documentation
- **[中文开发指南](./DEV_ZH.md)** - Chinese development guide
- **[Router Details](./DEV.md#router-details)** - Detailed API router documentation
- **[Integration Guide](./DEV.md#integration-guide)** - Setup and integration examples

## 🤝 Contributing

We welcome contributions! Please see our [Code of Conduct](../../code_of_conduct.md) and [Technical Guidelines](../../TECHNICAL_GUIDELINES.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/libra-ai/libra.git
cd libra

# Install dependencies
bun install

# Build the package
cd packages/api
bun run build

# Run type checking
bun run typecheck

# Run linting and formatting
bun run format-and-lint
```

### Testing

Currently, this package focuses on type safety and integration testing through the main application. For comprehensive testing:

- **Type Safety**: Ensured through TypeScript and tRPC's end-to-end type inference
- **Integration Testing**: Performed through the main web application
- **API Testing**: Use the tRPC client in development mode for interactive testing

Future versions will include dedicated unit and integration test suites.

## 📄 License

This project is licensed under the [AGPL-3.0 License](https://github.com/libra-ai/libra/blob/main/LICENSE).

## 🔗 Related Packages

- **[@libra/auth](../auth)** - Authentication and authorization
- **[@libra/common](../common)** - Shared utilities and types
- **[@libra/db](../db)** - Database schema and operations
- **[@libra/sandbox](../sandbox)** - Sandbox environment management
- **[@libra/ui](../ui)** - UI components and design system

---

<div align="center">
  <strong>Built with ❤️ by the Zepid team</strong>
</div>