# @libra/screenshot Development Guide

> High-performance queue-based screenshot service built on Cloudflare Workers

Version: 1.0.0
Last Updated: 2025-07-30

## Table of Contents

- [@libra/screenshot Development Guide](#librascreenshot-development-guide)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Core Features](#core-features)
    - [🚀 Asynchronous Screenshot Processing](#-asynchronous-screenshot-processing)
    - [🔐 Integration \& Security](#-integration--security)
    - [📊 Monitoring \& Debugging](#-monitoring--debugging)
    - [🎯 Developer Tools](#-developer-tools)
  - [Technology Architecture](#technology-architecture)
    - [🏗️ Core Technology Stack](#️-core-technology-stack)
    - [🔐 Security Architecture](#-security-architecture)
  - [Directory Structure](#directory-structure)
    - [Architecture Design](#architecture-design)
      - [Queue Processing Flow](#queue-processing-flow)
      - [Workflow State Machine](#workflow-state-machine)
  - [Environment Setup](#environment-setup)
    - [Prerequisites](#prerequisites)
    - [Environment Variables](#environment-variables)
    - [Installation](#installation)
  - [Development Guide](#development-guide)
    - [Quick Start](#quick-start)
    - [API Testing \& Documentation](#api-testing--documentation)
      - [API Documentation Access](#api-documentation-access)
      - [Health Check](#health-check)
      - [Screenshot Service Testing](#screenshot-service-testing)
    - [Testing](#testing)
    - [Core Feature Implementation](#core-feature-implementation)
      - [Main Entry File (src/index.ts)](#main-entry-file-srcindexts)
      - [Queue Producer Implementation (src/queue/producer.ts)](#queue-producer-implementation-srcqueueproducerts)
      - [Screenshot Workflow Implementation (src/screenshot/workflow.ts)](#screenshot-workflow-implementation-srcscreenshotworkflowts)
  - [API Reference](#api-reference)
    - [Screenshot Service](#screenshot-service)
      - [Submit Screenshot Task](#submit-screenshot-task)
      - [Query Screenshot Status](#query-screenshot-status)
    - [Health Check](#health-check-1)
      - [Service Health Check](#service-health-check)
    - [Developer Tools](#developer-tools)
      - [API Documentation](#api-documentation)
      - [OpenAPI Specification](#openapi-specification)
  - [Deployment Guide](#deployment-guide)
    - [Preparation](#preparation)
    - [Resource Configuration](#resource-configuration)
      - [Cloudflare Queues](#cloudflare-queues)
      - [D1 Database](#d1-database)
    - [Environment Deployment](#environment-deployment)
      - [Development Environment](#development-environment)
      - [Production Environment](#production-environment)
    - [Custom Domain](#custom-domain)
    - [Deployment Verification](#deployment-verification)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
      - [Q: Queue message processing failure](#q-queue-message-processing-failure)
      - [Q: Screenshot generation timeout](#q-screenshot-generation-timeout)
      - [Q: Database connection failure](#q-database-connection-failure)
    - [Performance Optimization](#performance-optimization)
    - [Debugging Tools](#debugging-tools)
      - [Log Viewing](#log-viewing)
      - [Performance Monitoring](#performance-monitoring)
  - [Related Resources](#related-resources)
    - [Documentation](#documentation)
    - [Internal Resources](#internal-resources)
    - [Development Tools](#development-tools)

## Overview

`@libra/screenshot` is the core screenshot service of the Zepid AI platform, built on Cloudflare Workers and Queues. It implements an asynchronous queue processing architecture that solves the 30-second timeout limitation of synchronous screenshots, supports high concurrency and reliable project preview screenshot generation, and is deeply integrated with sandbox services and CDN services.

## Core Features

### 🚀 Asynchronous Screenshot Processing

| Feature | Description | Technical Characteristics |
|---------|-------------|---------------------------|
| **Queue-based Processing** | Asynchronous screenshot task processing based on Cloudflare Queues | No timeout limits, high concurrency, automatic retry |
| **Batch Processing** | Efficient batch message processing mechanism | Configurable concurrency, optimized batch size |
| **Status Tracking** | Complete screenshot task status management | Real-time status updates, progress tracking |
| **Error Recovery** | Smart retry and dead letter queue mechanism | Exponential backoff, failed task isolation |

### 🔐 Integration & Security

| Feature | Description | Limitations |
|---------|-------------|-------------|
| **Sandbox Integration** | Reuse existing sandbox infrastructure for project preparation | Support for multiple sandbox providers |
| **CDN Storage** | Automatic upload and management of screenshots to CDN | Global distribution, cache optimization |
| **Permission Verification** | User session-based permission control | Organization-level permissions, audit trails |
| **Rate Limiting** | Built-in rate limiting to prevent abuse | User-level and organization-level limits |

### 📊 Monitoring & Debugging

| Feature | Description | Security |
|---------|-------------|----------|
| **Health Checks** | Multi-level service status checks | Queue status, external service connections |
| **Structured Logging** | Detailed logging based on `@libra/common` | Correlation IDs, performance metrics |
| **API Documentation** | Scalar interactive documentation (OpenAPI 3.1) | Real-time testing, complete specifications |
| **Queue Monitoring** | Queue backlog and processing rate monitoring | Real-time metrics, alerting mechanisms |

### 🎯 Developer Tools

| Tool | Purpose | Access Path |
|------|---------|-------------|
| **API Documentation** | Scalar interactive documentation (OpenAPI 3.1) | `/docs` |
| **OpenAPI** | API specification export | `/openapi.json` |
| **Health Check** | Service status monitoring | `/health` |
| **Screenshot Status** | Task status query | `/screenshot-status` |
| **Screenshot Submit** | New screenshot task submission | `/screenshot` |

## Technology Architecture

### 🏗️ Core Technology Stack

```typescript
// Runtime Environment
├── Cloudflare Workers    // Edge computing platform
├── Cloudflare Queues     // Message queue service
├── Hono v4.8.5          // High-performance web framework
├── TypeScript 5.8.3     // Type safety guarantee
└── Node.js 24+          // Development environment requirement

// Storage Layer
├── D1 Database          // SQLite database (state management)
├── R2 Storage           // Object storage (screenshot files)
├── Cloudflare Browser   // Browser rendering API
└── Cache API            // Edge caching

// API Layer
├── @hono/zod-openapi v0.19.10    // OpenAPI integration
├── Zod v4.0.14         // Runtime validation
├── @scalar/hono-api-reference v0.9.11 // API documentation UI
└── @libra/middleware    // Middleware library

// Advanced Features
├── @libra/sandbox       // Sandbox service integration
├── @libra/common        // Logging and utility library
├── @libra/db            // Database abstraction layer
└── drizzle-orm v0.44.3  // ORM query builder
```

### 🔐 Security Architecture

| Layer | Technology | Description |
|-------|------------|-------------|
| **Authentication & Authorization** | @libra/auth | User session validation, organization permission control |
| **Input Validation** | Zod Schemas | Request/response validation, parameter verification |
| **Rate Limiting** | Queue mechanism | Natural rate limiting, abuse protection |
| **Error Handling** | Unified error handling | Secure error messages, request tracking |
| **Data Protection** | Temporary file cleanup | Sensitive data encryption, secure credential handling |

## Directory Structure

```text
apps/screenshot/                   # Screenshot service root directory
├── README.md                      # Basic service documentation
├── ARCH.md                        # Architecture design documentation
├── package.json                   # Dependencies and script definitions
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Test configuration
├── wrangler.jsonc                 # Cloudflare Workers configuration (compatibility date: 2025-07-17)
├── wrangler.jsonc.example         # Configuration file example
├── public/                        # Static assets directory
│   └── favicon.ico               # Website icon
├── src/                          # Source code directory
│   ├── index.ts                  # Worker main entry, queue processing and routing
│   ├── types/                    # Type definitions directory
│   ├── api/                      # API route handlers
│   │   ├── openapi.ts           # OpenAPI application configuration and route registration
│   │   └── middleware/          # API middleware
│   ├── queue/                    # Queue processing logic
│   │   ├── producer.ts          # Queue producer (task submission)
│   │   └── consumer.ts          # Queue consumer (task processing)
│   ├── screenshot/               # Screenshot workflow
│   │   ├── workflow.ts          # Screenshot workflow orchestration
│   │   └── steps/               # Workflow steps
│   │       ├── validate.ts      # Permission and parameter validation
│   │       ├── capture.ts       # Screenshot capture logic
│   │       └── storage.ts       # Storage and upload processing
│   └── utils/                    # Utility functions library
│       ├── logger.ts            # Logging utilities
│       └── errors.ts            # Error handling utilities
└── node_modules/                 # Dependencies directory
```

### Architecture Design

#### Queue Processing Flow

```text
User Request: POST /screenshot
    ↓
Queue Producer: Validate parameters and create queue message
    ↓
Cloudflare Queue: Message queued for processing
    ↓
Queue Consumer: Batch process messages
    ↓
Screenshot Workflow: Execute complete screenshot process
    ↓
Status Update: Update database status
```

#### Workflow State Machine

```text
pending → processing → validating → creating_sandbox
    ↓
syncing_files → capturing → storing → completed
    ↓
failed (when any step fails)
```

## Environment Setup

### Prerequisites

```bash
# Required tools
Node.js >= 24.0.0
Bun >= 1.0.0
Wrangler >= 4.25.0

# Install Wrangler CLI globally
npm install -g wrangler

# Cloudflare account authentication
wrangler auth login
```

### Environment Variables

Create a `.dev.vars` file in the `apps/screenshot` directory:

```bash
# Cloudflare configuration (required)
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
CLOUDFLARE_ZONE_ID="your_zone_id"

# Database configuration (required)
DATABASE_ID="your_d1_database_id"
POSTGRES_URL="your_postgres_connection_string"

# GitHub OAuth (optional)
BETTER_GITHUB_CLIENT_ID="your_github_client_id"
BETTER_GITHUB_CLIENT_SECRET="your_github_client_secret"

# Sandbox service configuration
E2B_API_KEY="your_e2b_api_key"
DAYTONA_API_KEY="your_daytona_api_key"
NEXT_PUBLIC_SANDBOX_BUILDER_DEFAULT_PROVIDER="daytona"

# Application configuration
NEXT_PUBLIC_DISPATCHER_URL="https://zapid.dev"

# Queue configuration
SCREENSHOT_QUEUE_NAME="screenshot-queue"
SCREENSHOT_DLQ_NAME="screenshot-dlq"
MAX_SCREENSHOT_TIMEOUT="300000"
MAX_CONCURRENT_SCREENSHOTS="3"

# Development configuration
ENVIRONMENT="development"
LOG_LEVEL="debug"
NODE_ENV="development"

# Important notes:
# 1. Most configurations are preset in the vars section of wrangler.jsonc
# 2. .dev.vars is mainly used to override sensitive information and local development configuration
# 3. Cloudflare resources (Queues, D1) are configured through wrangler.jsonc
# 4. For production environment, please use wrangler secret command to set sensitive variables
```

### Installation

```bash
# Enter Screenshot directory
cd apps/screenshot

# Install dependencies (execute in project root directory)
cd ../../ && bun install

# Return to Screenshot directory
cd apps/screenshot

# Copy configuration file template
cp wrangler.jsonc.example wrangler.jsonc

# Edit configuration file
nano wrangler.jsonc
```

## Development Guide

### Quick Start

```bash
# Start development server
bun dev

# Service will be available at:
# - Local: http://localhost:3009
# - API Documentation: http://localhost:3009/docs
# - Health Check: http://localhost:3009/health
```

### API Testing & Documentation

#### API Documentation Access

```bash
# After starting the service, access auto-generated API documentation
open http://localhost:3009/docs

# View OpenAPI specification
curl http://localhost:3009/openapi.json
```

#### Health Check

```bash
# Basic health check
curl http://localhost:3009/health
```

#### Screenshot Service Testing

```bash
# Submit screenshot task (authentication required)
curl -X POST http://localhost:3009/screenshot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "your_project_id",
    "planId": "your_plan_id",
    "orgId": "your_org_id",
    "userId": "your_user_id",
    "previewUrl": "https://example.com"
  }'

# Query screenshot status
curl "http://localhost:3009/screenshot-status?id=screenshot_id"
```

### Testing

```bash
# Run unit tests
bun test

# Run tests with coverage report
bun run test:coverage

# Type checking
bun run typecheck
```

### Core Feature Implementation

#### Main Entry File (src/index.ts)

```typescript
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import {
  createCorsMiddleware,
  createLoggingMiddleware,
  createRequestIdMiddleware
} from '@libra/middleware'
import { handleQueueBatch } from './queue/consumer'
import { openApiApp } from './api/openapi'
import { createLogger } from './utils/logger'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
```

#### Queue Producer Implementation (src/queue/producer.ts)

```typescript
/**
 * Submit screenshot request to queue
 */
export async function submitScreenshotRequest(
  env: Bindings,
  params: {
    projectId: string
    planId: string
    orgId: string
    userId: string
    previewUrl?: string
  },
  options?: {
    priority?: boolean
    delaySeconds?: number
    deduplicate?: boolean
    config?: {
      timeout?: number
      skipSteps?: string[]
      debug?: boolean
    }
  }
): Promise<string> {
  const screenshotId = generateScreenshotId()
  const message = createScreenshotMessage(screenshotId, params, options?.config)

  if (options?.priority) {
    await sendPriorityMessage(env, message)
  } else if (options?.deduplicate) {
    const deduplicationKey = createDeduplicationKey(params.projectId, params.planId, params.userId)
    await sendDedupedMessage(env, message, deduplicationKey)
  } else if (options?.delaySeconds) {
    await sendDelayedMessage(env, message, options.delaySeconds)
  } else {
    await sendToQueue(env, message)
  }

  return screenshotId
}
```

#### Screenshot Workflow Implementation (src/screenshot/workflow.ts)

```typescript
/**
 * Execute complete screenshot workflow
 */
export class ScreenshotWorkflow {
  private env: Bindings
  private logger: ReturnType<typeof createLogger>
  private stepResults: Record<string, BaseStepResult> = {}

  constructor(
    env: Bindings,
    logger: ReturnType<typeof createLogger>
  ) {
    this.env = env
    this.logger = logger
  }

  /**
   * Execute URL-based screenshot workflow
   */
  async execute(screenshotId: string, params: ScreenshotParams): Promise<ScreenshotResult> {
    const startTime = Date.now()

    this.logger.info('Starting URL-based screenshot workflow', {
      screenshotId,
      projectId: params.projectId,
      planId: params.planId,
      userId: params.userId,
      organizationId: params.orgId,
      previewUrl: params.previewUrl
    })

    // Validate if previewUrl is provided
    if (!params.previewUrl) {
      throw new ScreenshotError(
        400,
        ErrorCodes.INVALID_REQUEST,
        'previewUrl is required for screenshot service'
      )
    }

    // Create screenshot context
    const context: ScreenshotContext = {
      screenshotId,
      env: this.env,
      params,
      logger: this.logger,
      stepResults: {}
    }

    try {
      // Step 1: Validate permissions and prepare screenshot
      await this.executeStep(
        'validation',
        'Validating project and preparing screenshot',
        25,
        context,
        validateAndPrepare
      )

      // Step 2: Capture screenshot from URL
      await this.executeStep(
        'capture',
        'Capturing screenshot from URL',
        70,
        context,
        captureScreenshot
      )

      // Step 3: Store screenshot to CDN
      await this.executeStep(
        'storage',
        'Storing screenshot to CDN',
        100,
        context,
        storeScreenshot
      )

      const duration = Date.now() - startTime
      const screenshotUrl = this.stepResults.storage?.data?.screenshotUrl

      this.logger.info('Screenshot workflow completed successfully', {
        screenshotId,
        duration,
        screenshotUrl
      })

      return {
        screenshotId,
        status: 'completed' as ScreenshotStatus,
        screenshotUrl: screenshotUrl || '',
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime

      this.logger.error('Screenshot workflow failed', {
        screenshotId,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }
}
```

## API Reference

### Screenshot Service

#### Submit Screenshot Task

```http
POST /screenshot
```

**Authentication**: Required

**Request Body**:

```typescript
{
  projectId: string,        // Project ID
  planId: string,          // Plan ID
  orgId: string,           // Organization ID
  userId: string,          // User ID
  previewUrl?: string      // Optional: Custom preview URL
}
```

**Response**:

```json
{
  "success": true,
  "screenshotId": "screenshot_1721649600000_abc123def",
  "message": "Screenshot request submitted successfully"
}
```

#### Query Screenshot Status

```http
GET /screenshot-status?id=<screenshotId>
```

**Authentication**: Not required

**Query Parameters**:

- `id`: Screenshot task ID

**Response**:

```json
{
  "success": true,
  "status": "completed",
  "message": "Screenshot completed successfully",
  "previewImageUrl": "https://cdn.zepid.dev/screenshots/screenshot_1721649600000_abc123def.png"
}
```

### Health Check

#### Service Health Check

```http
GET /health
```

**Authentication**: Not required

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-07-22T12:00:00.000Z",
  "service": "Zepid Screenshot Service",
  "version": "0.0.0",
  "environment": "development",
  "queue": {
    "status": "available",
    "name": "screenshot-queue"
  }
}
```

### Developer Tools

#### API Documentation

```http
GET /docs
```

Access Scalar interactive API documentation interface.

#### OpenAPI Specification

```http
GET /openapi.json
```

Get complete OpenAPI 3.1.0 specification.

## Deployment Guide

### Preparation

1. **Cloudflare Account Setup**
   - Active Cloudflare account
   - Workers service enabled
   - Queues service configured
   - D1 database configured

2. **Authentication Setup**
   ```bash
   wrangler auth login
   wrangler whoami
   ```

### Resource Configuration

#### Cloudflare Queues

```bash
# Create main processing queue
wrangler queues create screenshot-queue

# Create dead letter queue
wrangler queues create screenshot-dlq

# View queue list
wrangler queues list
```

#### D1 Database

```bash
# Create D1 database (if not exists)
wrangler d1 create libra

# View database list
wrangler d1 list
```

### Environment Deployment

#### Development Environment

```bash
# Start development server
bun dev

# Development server will start at http://localhost:3009
```

#### Production Environment

```bash
# Set production environment secrets
wrangler secret put CLOUDFLARE_API_TOKEN --env production
wrangler secret put POSTGRES_URL --env production
wrangler secret put E2B_API_KEY --env production
wrangler secret put DAYTONA_API_KEY --env production

# Deploy to production environment
bun run deploy:prod
```

### Custom Domain

```bash
# Add custom domain route
wrangler route add "screenshot.zepid.dev" libra-screenshot

# View current routes
wrangler route list
```

### Deployment Verification

Visit the following URLs to verify deployment:

- `https://screenshot.zepid.dev/health`

## Troubleshooting

### Common Issues

#### Q: Queue message processing failure

```bash
# Check queue status
wrangler queues list

# View dead letter queue
wrangler queues consumer list screenshot-dlq

# View real-time logs
wrangler tail libra-screenshot
```

#### Q: Screenshot generation timeout

- Check sandbox service status
- Verify browser rendering API configuration
- Confirm network connection stability

#### Q: Database connection failure

- Check D1 database configuration
- Verify PostgreSQL connection string
- Confirm database permission settings

### Performance Optimization

1. **Queue Configuration**: Adjust concurrency and batch size
2. **Caching Strategy**: Utilize CDN caching for screenshot results
3. **Error Handling**: Optimize retry strategy and timeout settings

### Debugging Tools

#### Log Viewing

```bash
# View Worker logs
wrangler tail libra-screenshot

# Real-time monitoring
wrangler tail libra-screenshot --format pretty
```

#### Performance Monitoring

- Cloudflare Dashboard → Workers → libra-screenshot → Analytics
- View queue processing rate, error rate, response time and other metrics

## Related Resources

### Documentation

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Queues Documentation](https://developers.cloudflare.com/queues/)
- [Cloudflare Browser Rendering Documentation](https://developers.cloudflare.com/browser-rendering/)
- [Hono Documentation](https://hono.dev/)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)

### Internal Resources

- `@libra/sandbox` - Sandbox service integration
- `@libra/common` - Shared utility library (logging, error handling)
- `@libra/middleware` - Middleware library
- `@libra/db` - Database abstraction layer
- `apps/cdn` - CDN service

### Development Tools

- [Scalar API Documentation](https://github.com/scalar/scalar) - API documentation generation
- [Zod](https://zod.dev/) - TypeScript schema validation
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Vitest](https://vitest.dev/) - Unit testing framework