# @libra/api Development Documentation

[![Version](https://img.shields.io/npm/v/@libra/api.svg)](https://npmjs.org/package/@libra/api)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/libra-ai/libra/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **Enterprise-grade type-safe API layer providing core business capabilities for the Zepid AI platform**

`@libra/api` is a comprehensive, type-safe backend service built on tRPC that supports core business functions of the Zepid platform, including AI-driven development workflows, project management, user authentication, payment processing, and third-party integrations.

## 📋 Table of Contents

- [@libra/api Development Documentation](#libraapi-development-documentation)
  - [📋 Table of Contents](#-table-of-contents)
  - [Project Overview](#project-overview)
    - [Technology Stack](#technology-stack)
    - [Core Features](#core-features)
  - [Core Architecture](#core-architecture)
    - [Project Structure](#project-structure)
    - [Architectural Design Patterns](#architectural-design-patterns)
      - [1. Layered Architecture Pattern](#1-layered-architecture-pattern)
      - [2. Quota Management Pattern](#2-quota-management-pattern)
      - [3. Error Handling Pattern](#3-error-handling-pattern)
  - [Authentication System](#authentication-system)
    - [Authentication Levels](#authentication-levels)
    - [Permission Verification Implementation](#permission-verification-implementation)
    - [Session Management](#session-management)
  - [Router Details](#router-details)
    - [AI Router (`ai.ts`)](#ai-router-aits)
      - [Core Features](#core-features-1)
      - [API Interfaces](#api-interfaces)
      - [Environment Configuration](#environment-configuration)
    - [Project Router (`project.ts`)](#project-router-projectts)
      - [Core Features](#core-features-2)
      - [API Interfaces](#api-interfaces-1)
  - [Data Validation](#data-validation)
    - [Zod Schema Definitions](#zod-schema-definitions)
      - [Project Schema (`project-schema.ts`)](#project-schema-project-schemats)
      - [File Structure Schema (`file.ts`)](#file-structure-schema-filets)
  - [Utility Functions](#utility-functions)
    - [Database Connection Management](#database-connection-management)
      - [Database Connection Function Description](#database-connection-function-description)
      - [Selection Guide](#selection-guide)
    - [Project Tools (`project.ts`)](#project-tools-projectts)
  - [Error Handling](#error-handling)
    - [Error Types and Handling](#error-types-and-handling)
    - [Logging and Monitoring](#logging-and-monitoring)
  - [Best Practices](#best-practices)
    - [1. Type Safety](#1-type-safety)
    - [2. Error Handling](#2-error-handling)
    - [3. Database Operations](#3-database-operations)
    - [4. Security](#4-security)
    - [5. Performance](#5-performance)
  - [Integration Guide](#integration-guide)
    - [Setting up the API](#setting-up-the-api)
    - [Client Integration](#client-integration)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Mode](#debug-mode)
  - [Security Best Practices](#security-best-practices)
    - [1. Input Validation](#1-input-validation)
    - [2. Authentication \& Authorization](#2-authentication--authorization)
    - [3. Data Protection](#3-data-protection)
    - [4. API Security](#4-api-security)

## Project Overview

### Technology Stack

- **tRPC**: End-to-end type-safe API framework
- **Zod**: Runtime type validation and schema definition
- **Drizzle ORM**: Type-safe database operations
- **Better Auth**: Modern authentication solution
- **Stripe**: Payment and subscription management
- **E2B**: Sandbox environment and container management
- **GitHub API**: Code repository integration
- **Azure OpenAI**: AI text generation services

### Core Features

- ✅ **Type Safety**: End-to-end TypeScript type inference
- 🔐 **Multi-layer Authentication**: Public, protected, organization-level, and member-level permission control
- 📊 **Quota Management**: Complete subscription limits and usage tracking
- 🚀 **Project Deployment**: Automated Cloudflare Workers deployment
- 🤖 **AI Integration**: Azure OpenAI text generation and enhancement
- 📁 **File Management**: Project file structure and version control
- 💳 **Payment Integration**: Stripe subscription and billing management
- 🔗 **GitHub Integration**: Dual authentication with OAuth and App installation

## Core Architecture

### Project Structure

```text
packages/api/
├── src/
│   ├── router/           # Business route implementations
│   │   ├── ai.ts         # AI text generation and enhancement
│   │   ├── project.ts    # Project lifecycle management
│   │   ├── github.ts     # GitHub integration
│   │   ├── deploy.ts     # Project deployment
│   │   ├── file.ts       # File management
│   │   ├── history.ts    # Project history
│   │   ├── stripe.ts     # Payment processing
│   │   ├── subscription.ts # Subscription management
│   │   ├── session.ts    # Session management
│   │   ├── custom-domain.ts # Custom domain
│   │   └── hello.ts      # Test interface
│   ├── schemas/          # Data validation schemas
│   │   ├── project-schema.ts # Project data validation
│   │   ├── file.ts       # File structure validation
│   │   ├── history.ts    # History record types
│   │   └── turnstile.ts  # Security validation
│   ├── utils/            # Utility functions
│   │   ├── container.ts  # E2B sandbox management
│   │   ├── deploy.ts     # Deployment tools
│   │   ├── github-auth.ts # GitHub authentication
│   │   ├── project.ts    # Project tools
│   │   ├── stripe-utils.ts # Payment tools
│   │   └── membership-validation.ts # Membership validation
│   ├── trpc.ts           # tRPC configuration and middleware
│   ├── root.ts           # Route aggregation
│   └── index.ts          # Package exports
├── env.mjs               # Environment variable configuration
└── package.json          # Dependencies and script definitions
```

### Architectural Design Patterns

#### 1. Layered Architecture Pattern

```typescript
// packages/api/src/trpc.ts

// 1. Context creation - Provides database connections and session information
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const auth = await initAuth()
  const session = await auth.api.getSession({ headers: opts.headers })
  const db = await getAuthDb()
  return { db, session, ...opts }
}

// 2. Base procedure - Public access
export const publicProcedure = t.procedure

// 3. Protected procedure - Requires login
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

// 4. Organization-level procedure - Requires organization permissions
export const organizationProcedure = protectedProcedure
  .input(z.object({ orgId: z.string().optional() }))
  .use(async ({ ctx, input, next }) => {
    const activeOrganizationId = ctx.session?.session?.activeOrganizationId

    // Prioritize input parameter, fallback to active organization ID in session
    const orgId = input.orgId || activeOrganizationId

    if (!orgId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }

    // If user specifies a different organization ID than current active organization, verify access permissions
    if (input.orgId && input.orgId !== activeOrganizationId) {
      const hasAccess = await verifyOrganizationAccess(ctx.session.user.id, input.orgId)
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
        })
      }
    }

    return next({
      ctx: { ...ctx, orgId, session: ctx.session },
    })
  })

/**
 * Verify user access to organization
 */
async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const db = await getAuthDb()

    const membership = await db.query.organizationMember.findFirst({
      where: and(
        eq(organizationMember.userId, userId),
        eq(organizationMember.organizationId, organizationId),
        eq(organizationMember.status, 'active')
      ),
    })

    return !!membership
  } catch (error) {
    console.error('[Auth] Failed to verify organization access:', error)
    return false
  }
}

// 5. Member-level procedure - Requires paid membership permissions
export const memberProcedure = organizationProcedure.use(async ({ ctx, next }) => {
  await requirePremiumMembership(ctx.orgId, 'this feature')
  return next({ ctx })
})
```

#### 2. Quota Management Pattern

```typescript
// packages/api/src/router/project.ts

export const projectRouter = {
  create: organizationProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()

      // Check and deduct project quota
      const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
      if (!quotaDeducted) {
        log.project('warn', 'Project creation failed - quota exceeded', {
          orgId, userId, operation: 'create'
        })
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project quota exceeded'
        })
      }

      // Project creation logic...
      const [newProject] = await db.insert(project).values({
        name: input.name ?? 'My First Project',
        templateType: input.templateType ?? 'default',
        visibility: input.visibility ?? 'private',
        userId,
        organizationId: orgId,
      }).returning()

      return newProject
    })
}
```

#### 3. Error Handling Pattern

```typescript
// packages/api/src/router/ai.ts

export const aiRouter = createTRPCRouter({
  generateText: organizationProcedure
    .input(z.object({
      prompt: z.string().min(1, 'Prompt cannot be empty'),
      modelId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const context = {
        userId: ctx.session.user.id,
        organizationId: ctx.orgId,
        operation: 'generateText'
      }

      log.ai('info', 'Starting AI text generation', {
        ...context,
        promptLength: input.prompt.length,
        modelId: input.modelId || 'default',
      })

      const [result, error] = await tryCatch(async () => {
        // Check quota
        const canUseEnhance = await checkAndUpdateEnhanceUsage(ctx.orgId)
        if (!canUseEnhance) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Enhance quota exceeded. Please upgrade your plan.',
          })
        }

        // AI generation logic...
        return await generateText({
          model: myProvider.languageModel('chat-model-reasoning-azure'),
          prompt: input.prompt,
        })
      })

      if (error) {
        if (error instanceof TRPCError) {
          log.ai('warn', 'AI generation blocked', context, error)
          throw error
        }

        log.ai('error', 'AI service failure', context, error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate enhanced text',
          cause: error,
        })
      }

      return result
    })
})
```

## Authentication System

### Authentication Levels

| Level | Description | Use Cases | Examples |
|-------|-------------|-----------|----------|
| `publicProcedure` | Public access, no authentication required | Get public information, health checks | `hello.pub` |
| `protectedProcedure` | Requires user login | User personal operations | `history.getAll` |
| `organizationProcedure` | Requires organization permissions | Organization resource operations | `project.create` |
| `memberProcedure` | Requires paid membership permissions | Advanced feature access | `customDomain.set` |

### Permission Verification Implementation

```typescript
// packages/api/src/utils/membership-validation.ts

/**
 * Check if organization has premium membership permissions
 */
export async function hasPremiumMembership(organizationId: string): Promise<boolean> {
  try {
    const db = await getAuthDb()

    // Query active subscription records
    const activeSubscription = await db.query.subscription.findFirst({
      where: and(
        eq(subscription.referenceId, organizationId),
        eq(subscription.status, 'active')
      ),
    })

    if (!activeSubscription) return false

    // Check if subscription is within valid period
    const now = new Date()
    const periodEnd = activeSubscription.periodEnd

    if (periodEnd && periodEnd < now) {
      return false
    }

    // Check if it's a paid plan
    const planName = activeSubscription.plan?.toLowerCase() || ''
    return !planName.includes('free')

  } catch (error) {
    log.subscription('error', 'Failed to check premium membership', {
      organizationId, operation: 'hasPremiumMembership'
    }, error)
    return false
  }
}

/**
 * Require premium membership permissions, otherwise throw error
 */
export async function requirePremiumMembership(
  organizationId: string,
  featureName = 'this feature'
): Promise<void> {
  const isPremium = await hasPremiumMembership(organizationId)

  if (!isPremium) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Premium membership required to use ${featureName}. Please upgrade your plan.`,
    })
  }
}
```

### Session Management

```typescript
// packages/api/src/router/session.ts

export const sessionRouter = {
  list: organizationProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId

    const [sessions, error] = await tryCatch(async () => {
      return await ctx.db
        .select()
        .from(session)
        .where(eq(session.activeOrganizationId, orgId))
        .orderBy(desc(session.createdAt))
    })

    if (error) {
      console.error(`[Session Query Error] Organization ID: ${orgId}`, error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching the session list',
        cause: error,
      })
    }

    return sessions
  }),
}
```

## Router Details

### AI Router (`ai.ts`)

The AI router provides text generation and enhancement functionality, integrating Azure OpenAI services.

#### Core Features

- **Text Generation**: Uses GPT-4 models to generate and enhance text content
- **Quota Management**: Automatically checks and deducts AI usage quotas
- **Error Handling**: Comprehensive error handling and logging

#### API Interfaces

```typescript
// packages/api/src/router/ai.ts

export const aiRouter = createTRPCRouter({
  generateText: organizationProcedure
    .input(z.object({
      prompt: z.string().min(1, 'Prompt cannot be empty'),
      modelId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const orgId = ctx.orgId
      const context = { userId, organizationId: orgId, operation: 'generateText' }

      // Check AI provider configuration
      if (!myProvider) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI provider not configured. Please check Azure environment variables.',
        })
      }

      // Check and deduct enhancement quota
      const canUseEnhance = await checkAndUpdateEnhanceUsage(orgId)
      if (!canUseEnhance) {
        log.ai('warn', 'AI generation quota exceeded', context)
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Enhance quota exceeded. Please upgrade your plan or wait for next billing cycle.',
        })
      }

      // Generate text
      const result = await generateText({
        model: myProvider.languageModel('chat-model-reasoning-azure'),
        prompt: `Generate an enhanced version of this prompt: ${input.prompt}`,
        providerOptions: {
          openai: {
            ...(env.REASONING_ENABLED ? { reasoningEffort: 'medium' } : {}),
          },
        },
      })

      log.ai('info', 'AI text generation completed', {
        ...context,
        outputLength: result.text.length,
        tokensUsed: result.usage?.totalTokens || 0,
      })

      return {
        text: result.text,
        usage: result.usage,
        model: 'chat-model-reasoning-azure',
      }
    })
})
```

#### Environment Configuration

```typescript
// AI provider configuration
const azure = env.AZURE_RESOURCE_NAME && env.AZURE_API_KEY
  ? createAzure({
      resourceName: env.AZURE_RESOURCE_NAME,
      apiKey: env.AZURE_API_KEY,
      apiVersion: '2024-06-01-preview',
      ...(env.AZURE_BASE_URL && {
        baseURL: `${env.AZURE_BASE_URL}${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_AIGATEWAY_NAME}/azure-openai/${env.AZURE_RESOURCE_NAME}`
      })
    })
  : null
```

### Project Router (`project.ts`)

The Project router is the core business module, providing complete project lifecycle management functionality.

#### Core Features

- **Project CRUD**: Create, read, update, delete projects
- **Quota Management**: Project quantity limits and quota deduction
- **Permission Control**: Organization-level permission verification
- **History Management**: Message history and version control
- **Container Management**: E2B sandbox environment integration

#### API Interfaces

```typescript
// packages/api/src/router/project.ts

export const projectRouter = {
  // Create project
  create: organizationProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { name, initialMessage, visibility, templateType, attachment, planId } = input

      log.project('info', 'Project creation started', {
        orgId, userId, projectName: name, templateType, visibility
      })

      // Check and deduct project quota
      const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
      if (!quotaDeducted) {
        log.project('warn', 'Project creation failed - quota exceeded', {
          orgId, userId, operation: 'create'
        })
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project quota exceeded'
        })
      }

      // Initialize history records
      const messagePlanId = planId || 'initial'
      const messageHistory = initialMessage
        ? JSON.stringify([{
            type: 'user',
            message: initialMessage,
            planId: messagePlanId,
            ...(attachment && { attachment }),
          }])
        : '[]'

      // Create project
      const [newProject] = await db.insert(project).values({
        name: name ?? 'My First Project',
        templateType: templateType ?? 'default',
        visibility: (visibility as 'public' | 'private') ?? 'private',
        initialMessage,
        messageHistory,
        userId,
        organizationId: orgId,
      }).returning()

      log.project('info', 'Project created successfully', {
        orgId, userId, projectId: newProject.id, projectName: newProject.name
      })

      return newProject
    }),

  // Get project list
  list: organizationProcedure.query(async ({ ctx }) => {
    const { orgId } = await requireOrgAndUser(ctx)
    const db = await getBusinessDb()

    const projects = await db
      .select()
      .from(project)
      .where(eq(project.organizationId, orgId))
      .orderBy(desc(project.createdAt))

    return projects
  }),

  // Update project
  update: organizationProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { projectId, initialMessage } = input

      // Get and validate project
      const projectData = await fetchProject(db, projectId)
      ensureOrgAccess(projectData, orgId, 'update')

      // Update project
      const [updatedProject] = await db
        .update(project)
        .set({
          initialMessage,
          updatedAt: sql`now()`,
        })
        .where(eq(project.id, projectId))
        .returning()

      return updatedProject
    }),

  // Delete project
  delete: organizationProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { projectId } = input

      // Get and validate project
      const projectData = await fetchProject(db, projectId)
      ensureOrgAccess(projectData, orgId, 'delete')

      // Clean up container resources
      if (projectData.containerId) {
        await terminateSandbox(projectData.containerId)
      }

      // Delete project
      await db.delete(project).where(eq(project.id, projectId))

      // Restore project quota
      await restoreProjectQuotaOnDeletion(orgId)

      log.project('info', 'Project deleted successfully', {
        orgId, projectId, projectName: projectData.name
      })

      return { success: true }
    }),

  // Fork project
  fork: organizationProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { projectId, name } = input

      // Check quota
      const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
      if (!quotaDeducted) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project quota exceeded'
        })
      }

      // Get original project
      const originalProject = await fetchProject(db, projectId)

      // Create copy
      const [forkedProject] = await db.insert(project).values({
        name: name || `${originalProject.name} (Copy)`,
        templateType: originalProject.templateType,
        visibility: originalProject.visibility,
        initialMessage: originalProject.initialMessage,
        messageHistory: originalProject.messageHistory,
        userId,
        organizationId: orgId,
      }).returning()

      return forkedProject
    }),
}
```

## Data Validation

### Zod Schema Definitions

The project uses Zod for runtime type validation and schema definition, ensuring data type safety and integrity.

#### Project Schema (`project-schema.ts`)

```typescript
// packages/api/src/schemas/project-schema.ts

// Project creation schema
export const projectSchema = z.object({
  name: z.string().optional(),
  initialMessage: z.string().optional(),
  visibility: z.string().optional(),
  templateType: z.string().optional(),
  attachment: z.object({
    key: z.string(),
    name: z.string(),
    type: z.string(),
  }).optional(),
  planId: z.string().optional(),
})

// Project update schema
export const updateSchema = z.object({
  projectId: z.string().min(1),
  initialMessage: z.string().optional(),
})

// Project configuration update schema
export const updateProjectConfigSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .optional(),
  knowledge: z.string().optional(),
})

// Git information schema
export const gitInfoSchema = z.object({
  gitUrl: z.string()
    .url('Invalid URL format')
    .regex(GIT_URL_REGEX, 'Invalid Git repository URL format')
    .optional(),
  gitBranch: z.string()
    .min(1, 'Branch name cannot be empty')
    .max(250, 'Branch name too long')
    .regex(GIT_BRANCH_REGEX, 'Invalid branch name format')
    .optional(),
})

// GitHub repository information schema
export const githubRepoInfoSchema = z.object({
  gitUrl: z.string()
    .url('Invalid GitHub URL format')
    .regex(GITHUB_URL_REGEX, 'Must be a valid GitHub repository URL')
    .optional(),
  gitBranch: z.string()
    .min(1, 'Branch name cannot be empty')
    .max(250, 'Branch name too long')
    .regex(GIT_BRANCH_REGEX, 'Invalid branch name format')
    .default('main'),
})

// Deployment schema
export const deployProjectSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  customDomain: z.string()
    .regex(DOMAIN_REGEX, 'Invalid domain name format')
    .optional(),
})

// Custom domain schema
export const customDomainSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  customDomain: z.string()
    .min(1, 'Domain name is required')
    .regex(DOMAIN_REGEX, 'Invalid domain name format'),
})
```

#### File Structure Schema (`file.ts`)

```typescript
// packages/api/src/schemas/file.ts

// File entry schema
export const fileEntrySchema = z.object({
  type: z.literal('file'),
  isBinary: z.boolean(),
  content: z.string(),
})

// Directory entry schema
export const directoryEntrySchema: z.ZodType<{
  type: 'directory'
  children: Record<string, FileEntry | DirectoryEntry>
}> = z.object({
  type: z.literal('directory'),
  children: z.record(
    z.string(),
    z.lazy(() => fileEntrySchema.or(directoryEntrySchema))
  ),
})

// File or directory entry
export const fileOrDirEntrySchema = fileEntrySchema.or(directoryEntrySchema)

// Complete file structure schema
export const fileStructureSchema = z.record(z.string(), fileOrDirEntrySchema)

// File content retrieval input schema
export const getFileContentSchema = z.object({
  path: z.string().min(1, 'File path cannot be empty'),
})

// Type definition exports
export type FileEntry = z.infer<typeof fileEntrySchema>
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>
export type FileOrDirEntry = z.infer<typeof fileOrDirEntrySchema>
export type FileStructure = z.infer<typeof fileStructureSchema>
export type GetFileContentInput = z.infer<typeof getFileContentSchema>
```

## Utility Functions

### Database Connection Management

In `@libra/api`, we use two different database connection functions, each with specific purposes:

#### Database Connection Function Description

```typescript
/**
 * Get authentication database connection - Used for user authentication, session management, organization permissions, etc.
 * Applicable scenarios:
 * - User login verification
 * - Session management
 * - Organization member permission checks
 * - Subscription and billing information
 */
export async function getAuthDb() {
  // Returns authentication database connection
}

/**
 * Get business database connection - Used for core business logic and data operations
 * Applicable scenarios:
 * - Project CRUD operations
 * - File management
 * - History record management
 * - Deployment information storage
 */
export async function getBusinessDb() {
  // Returns business database connection
}
```

#### Selection Guide

| Operation Type | Recommended Function | Example Scenarios |
|----------------|---------------------|-------------------|
| User Authentication | `getAuthDb()` | Login verification, permission checks |
| Organization Management | `getAuthDb()` | Member management, subscription status |
| Project Operations | `getBusinessDb()` | Create, update, delete projects |
| File Management | `getBusinessDb()` | File upload, version control |
| History Records | `getBusinessDb()` | Message history, operation logs |

### Project Tools (`project.ts`)

Project utility functions provide common project operations and validation functionality.

```typescript
// packages/api/src/utils/project.ts

/**
 * Require organization and user permissions
 */
export async function requireOrgAndUser(ctx: any) {
  const orgId = ctx?.orgId
  const userId = ctx?.session?.user?.id

  if (!orgId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Organization ID is missing'
    })
  }

  if (!userId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User ID is missing'
    })
  }

  return { orgId, userId }
}

/**
 * Get business database connection
 */
export async function getBusinessDb() {
  const db = await getDbAsync()
  if (!db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database connection is not available',
    })
  }
  return db
}

/**
 * Get project data
 */
export async function fetchProject(db: any, projectId: string) {
  const results = await db.select().from(project).where(eq(project.id, projectId))

  if (results.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Project not found'
    })
  }

  const projectData = results[0]
  if (!projectData) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Project data is corrupted'
    })
  }

  return projectData
}

/**
 * Ensure organization access permissions
 */
export function ensureOrgAccess(
  projectData: { organizationId?: string },
  orgId: string,
  action: string
) {
  if (projectData.organizationId !== orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You do not have permission to ${action} this project`,
    })
  }
}

/**
 * Parse message history
 */
export function parseMessageHistory(messageHistory: string): HistoryType {
  try {
    const parsed = JSON.parse(messageHistory || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('[Project Utils] Failed to parse message history:', error)
    return []
  }
}
```

## Error Handling

The API implements comprehensive error handling patterns to ensure robust operation and clear error reporting.

### Error Types and Handling

```typescript
// Common error handling pattern
const [result, error] = await tryCatch(async () => {
  // Potentially failing operation
  return await someAsyncOperation()
})

if (error) {
  if (error instanceof TRPCError) {
    // Re-throw tRPC errors to maintain error context
    throw error
  }

  // Convert unexpected errors to tRPC errors
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Operation failed',
    cause: error,
  })
}
```

### Logging and Monitoring

```typescript
// Structured logging with context
log.ai('info', 'AI text generation started', {
  userId,
  organizationId,
  operation: 'generateText',
  promptLength: input.prompt.length,
})

// Error logging with full context
log.ai('error', 'AI service failure', context, error)
```

## Best Practices

### 1. Type Safety
- Always use Zod schemas for input validation
- Leverage TypeScript's type inference capabilities
- Use proper type definitions for all data structures

### 2. Error Handling
- Use the `tryCatch` utility for consistent error handling
- Provide meaningful error messages to users
- Log errors with sufficient context for debugging

### 3. Database Operations
- Use appropriate database connection functions (`getAuthDb` vs `getBusinessDb`)
- Implement proper transaction handling for complex operations
- Use database-level constraints and validations

### 4. Security
- Always validate user permissions before operations
- Use organization-level access control
- Implement quota management to prevent abuse

### 5. Performance
- Use database indexes for frequently queried fields
- Implement proper caching strategies
- Monitor and optimize slow queries

## Integration Guide

### Setting up the API

1. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure required environment variables
   AZURE_RESOURCE_NAME=your-azure-resource
   AZURE_API_KEY=your-azure-key
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-secret
   ```

2. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:migrate

   # Seed initial data
   npm run db:seed
   ```

3. **Development Server**
   ```bash
   # Start development server
   npm run dev
   ```

### Client Integration

```typescript
// Client-side usage example
import { api } from '@/utils/api'

// Create a new project
const createProject = api.project.create.useMutation({
  onSuccess: (project) => {
    console.log('Project created:', project.id)
  },
  onError: (error) => {
    console.error('Failed to create project:', error.message)
  }
})

// Call the mutation
createProject.mutate({
  name: 'My New Project',
  templateType: 'vite',
  visibility: 'private'
})
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database credentials in environment variables
   - Check database server availability
   - Ensure proper network connectivity

2. **Authentication Failures**
   - Verify session configuration
   - Check authentication provider settings
   - Validate JWT tokens and expiration

3. **Quota Exceeded Errors**
   - Check subscription status and limits
   - Verify quota calculation logic
   - Monitor usage patterns

4. **Container/Sandbox Issues**
   - Verify E2B API credentials
   - Check container resource limits
   - Monitor container lifecycle

### Debug Mode

Enable debug logging by setting environment variables:

```bash
DEBUG=libra:*
LOG_LEVEL=debug
```

This will provide detailed logging for all operations, helping identify issues quickly.

## Security Best Practices

### 1. Input Validation
- Always validate input using Zod schemas
- Sanitize user-provided data
- Implement rate limiting for API endpoints

### 2. Authentication & Authorization
- Use secure session management
- Implement proper role-based access control
- Validate permissions at multiple levels

### 3. Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper audit logging

### 4. API Security
- Implement CORS policies
- Use API rate limiting
- Monitor for suspicious activities

---

This documentation provides a comprehensive guide to the `@libra/api` package. For additional support or questions, please refer to the project repository or contact the development team.