# @libra/deploy Development Guide

> High-performance deployment service based on Cloudflare Workers queues

Version: 1.0.0
Last Updated: 2025-07-30

## Table of Contents

- [@libra/deploy Development Guide](#libradeploy-development-guide)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Core Features](#core-features)
    - [🚀 Deployment Management](#-deployment-management)
    - [📊 Monitoring \& Status](#-monitoring--status)
    - [🔧 Developer Tools](#-developer-tools)
  - [Technical Architecture](#technical-architecture)
    - [🏗️ Core Technology Stack](#️-core-technology-stack)
    - [🔄 Queue Architecture](#-queue-architecture)
    - [🔐 Security Architecture](#-security-architecture)
  - [Directory Structure](#directory-structure)
  - [Environment Setup](#environment-setup)
    - [Prerequisites](#prerequisites)
    - [Environment Variables](#environment-variables)
    - [Installation](#installation)
  - [Development Guide](#development-guide)
    - [Quick Start](#quick-start)
    - [API Testing \& Documentation](#api-testing--documentation)
      - [API Documentation Access](#api-documentation-access)
      - [Deployment Request](#deployment-request)
      - [Status Query](#status-query)
      - [Health Check](#health-check)
    - [Core Feature Implementation](#core-feature-implementation)
      - [Main Entry File (src/index.ts)](#main-entry-file-srcindexts)
  - [Deployment Workflow](#deployment-workflow)
    - [Six-Step Deployment Process](#six-step-deployment-process)
      - [Step 1: Validate](#step-1-validate)
      - [Step 2: Sync](#step-2-sync)
      - [Step 3: Sandbox](#step-3-sandbox)
      - [Step 4: Build](#step-4-build)
      - [Step 5: Deploy](#step-5-deploy)
      - [Step 6: Cleanup](#step-6-cleanup)
    - [Workflow Orchestrator](#workflow-orchestrator)
    - [State Management](#state-management)
  - [API Reference](#api-reference)
    - [Authentication](#authentication)
    - [Deployment Management](#deployment-management)
      - [POST /deploy](#post-deploy)
      - [GET /deploy-status](#get-deploy-status)
    - [Monitoring and Health Check](#monitoring-and-health-check)
      - [GET /health](#get-health)
      - [GET /](#get-)
    - [Error Response](#error-response)
  - [Queue System](#queue-system)
    - [Queue Configuration](#queue-configuration)
      - [deployment-queue (Main Queue)](#deployment-queue-main-queue)
      - [deployment-dlq (Dead Letter Queue)](#deployment-dlq-dead-letter-queue)
    - [Message Format](#message-format)
    - [Queue Processing Flow](#queue-processing-flow)
      - [Message Producer (src/queue/producer.ts)](#message-producer-srcqueueproducerts)
      - [Message Consumer (src/queue/consumer.ts)](#message-consumer-srcqueueconsumerts)
  - [Deployment Guide](#deployment-guide)
    - [Preparation](#preparation)
    - [Resource Configuration](#resource-configuration)
      - [Cloudflare Queues](#cloudflare-queues)
      - [D1 Database](#d1-database)
      - [R2 Storage Bucket (Optional)](#r2-storage-bucket-optional)
    - [Environment Deployment](#environment-deployment)
      - [Development Environment](#development-environment)
      - [Production Environment](#production-environment)
    - [Custom Domain](#custom-domain)
    - [wrangler.jsonc Configuration](#wranglerjsonc-configuration)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
      - [Deployment Request Failure](#deployment-request-failure)
      - [Queue Processing Failure](#queue-processing-failure)
      - [Deployment Status Query Exception](#deployment-status-query-exception)
      - [Sandbox Environment Creation Failure](#sandbox-environment-creation-failure)
    - [Debugging Tools](#debugging-tools)
      - [Log Viewing](#log-viewing)
      - [Queue Monitoring](#queue-monitoring)
      - [Performance Monitoring](#performance-monitoring)
  - [Related Resources](#related-resources)
    - [Documentation](#documentation)
    - [Internal Resources](#internal-resources)
    - [Development Tools](#development-tools)
    - [Sandbox Providers](#sandbox-providers)

## Overview

`@libra/deploy` is the core deployment service of the Zepid AI platform, built on Cloudflare Workers queue architecture. It provides project deployment, state management, quota control, error handling, and other features, supporting asynchronous queue processing and intelligent retry strategies. Through a queue-driven architecture, it achieves a highly scalable and reliable deployment system.

## Core Features

### 🚀 Deployment Management
| Feature | Description | Technical Features |
|---------|-------------|-------------------|
| **Queue Deployment** | Asynchronous processing based on Cloudflare Queues | Batch processing, concurrency control, automatic retry |
| **Six-Step Workflow** | Validate→Sync→Sandbox→Build→Deploy→Cleanup | State tracking, error recovery, logging |
| **State Management** | D1 Database + R2 Storage hybrid architecture | Fast queries, detailed logs, persistence |
| **Quota Control** | Organization-level deployment quota management | Automatic deduction, limit checking, usage statistics |
| **Error Handling** | Dead letter queue + retry mechanism | 3 retries, failure classification, manual intervention |

### 📊 Monitoring & Status
| Feature | Description | Access Method |
|---------|-------------|---------------|
| **Real-time Status** | Deployment progress and status queries | `GET /deploy-status?id={deploymentId}` |
| **Health Check** | Service and dependency status monitoring | `GET /health` |
| **Queue Monitoring** | Queue status and processing statistics | Built-in monitoring, log analysis |
| **Deployment History** | Historical deployment records and logs | D1 queries, R2 log storage |

### 🔧 Developer Tools
| Tool | Purpose | Access Path |
|------|---------|-------------|
| **API Documentation** | Scalar interactive documentation (OpenAPI 3.1) | `/docs` |
| **OpenAPI** | API specification export | `/openapi.json` |
| **Health Check** | Service status monitoring | `/health` |
| **Service Info** | Version and endpoint information | `/` |

## Technical Architecture

### 🏗️ Core Technology Stack
```typescript
// Runtime Environment
├── Cloudflare Workers    // Edge computing platform
├── Hono v4.x            // High-performance web framework
├── TypeScript 5.x       // Type safety guarantee
└── Node.js 18+          // Development environment requirement

// Queue System
├── Cloudflare Queues    // Asynchronous message queue
├── Dead Letter Queue    // Failed message handling
├── Batch Processing     // Batch message processing
└── Retry Mechanism      // Intelligent retry strategy

// Storage Layer
├── D1 Database          // SQLite (state management)
├── R2 Storage           // Object storage (logs and artifacts)
├── KV Namespace         // Key-value storage (cache)
└── Cache API            // Edge cache

// API Layer
├── @hono/zod-openapi    // OpenAPI integration
├── Zod Schemas          // Runtime validation
├── @scalar/hono-api-ref // API documentation UI
└── @libra/auth          // Authentication authorization framework

// Deployment Toolchain
├── @libra/sandbox       // Sandbox environment management
├── @libra/templates     // Project template system
├── @libra/db            // Database operations
└── @libra/common        // Logging and utility library
```

### 🔄 Queue Architecture
| Component | Function | Configuration |
|-----------|----------|---------------|
| **deployment-queue** | Main deployment queue | Batch size:1, Timeout:0s, Retry:2 times |
| **deployment-dlq** | Dead letter queue | Failed message storage and manual processing |
| **Queue Consumer** | Message consumer | Max concurrency:5, Batch processing support |
| **Queue Producer** | Message producer | HTTP API trigger, Message serialization |

### 🔐 Security Architecture
| Layer | Technology | Description |
|-------|------------|-------------|
| **Authentication** | @libra/auth | Bearer Token, Session management |
| **Authorization** | Middleware chain | Route-level permission control |
| **Validation** | Zod Schemas | Request/response validation, parameter checking |
| **CORS** | Dynamic configuration | localhost/zepid.dev whitelist |
| **Quota** | D1 Storage | Organization-level deployment limits |
| **Error Handling** | Structured logging | Sensitive information filtering, error classification |

## Directory Structure

```text
apps/deploy/                           # Deployment service root directory
├── README.md                          # Basic service documentation
├── ARCH.md                           # Architecture design documentation
├── package.json                      # Dependencies and script definitions
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Test configuration
├── wrangler.jsonc                    # Cloudflare Workers configuration (using compatibility date 2025-07-17)
├── wrangler.jsonc.example            # Configuration file example
├── worker-configuration.d.ts         # Cloudflare Workers environment types
├── public/                           # Static assets directory
│   └── favicon.ico                   # Service icon
├── src/                              # Source code directory
│   ├── index.ts                      # Worker main entry, integrates HTTP API and queue processing
│   ├── openapi.ts                    # OpenAPI application configuration and route registration
│   ├── api/                          # HTTP API routes and middleware
│   │   └── middleware/               # API middleware directory
│   ├── deployment/                   # Deployment workflow core
│   │   ├── workflow.ts               # Queue deployment workflow orchestrator
│   │   ├── state.ts                  # Deployment state manager
│   │   └── steps/                    # Six-step deployment process implementation
│   │       ├── validate.ts           # Step 1: Parameter validation and project checking
│   │       ├── sync.ts               # Step 2: Data synchronization and preparation
│   │       ├── sandbox.ts            # Step 3: Sandbox environment creation
│   │       ├── build.ts              # Step 4: Project building and compilation
│   │       ├── deploy.ts             # Step 5: Deployment to target environment
│   │       └── cleanup.ts            # Step 6: Resource cleanup and finalization
│   ├── queue/                        # Queue system implementation
│   │   ├── consumer.ts               # Queue message consumer
│   │   └── producer.ts               # Queue message producer
│   ├── types/                        # TypeScript type definitions
│   │   ├── index.ts                  # Main type exports
│   │   ├── deployment.ts             # Deployment-related types
│   │   └── queue.ts                  # Queue message types
│   └── utils/                        # Utility function library
│       ├── common.ts                 # Common utility functions
│       ├── logger.ts                 # Logging tools
│       ├── errors.ts                 # Error handling tools
│       ├── deployment.ts             # Deployment helper tools
│       └── deploy-quota.ts           # Quota management tools
└── node_modules/                     # Dependencies directory
```

## Environment Setup

### Prerequisites

```bash
# Required tools
node >= 18.0.0
bun >= 1.0.0
wrangler >= 4.0.0

# Install Wrangler globally
npm install -g wrangler

# Cloudflare authentication
wrangler auth login
```

### Environment Variables

Create a `.dev.vars` file in the `apps/deploy` directory:

```bash
# GitHub OAuth configuration
BETTER_GITHUB_CLIENT_ID=your_github_client_id
BETTER_GITHUB_CLIENT_SECRET=your_github_client_secret

# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id

# Database configuration
DATABASE_ID=your_database_id
POSTGRES_URL=postgresql://user:password@host:port/database

# Sandbox provider configuration
E2B_API_KEY=your_e2b_api_key
DAYTONA_API_KEY=your_daytona_api_key
SANDBOX_BUILDER_DEFAULT_PROVIDER=daytona

# Security configuration
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# Queue configuration
DEPLOYMENT_QUEUE_NAME=deployment-queue
DEPLOYMENT_DLQ_NAME=deployment-dlq
MAX_DEPLOYMENT_TIMEOUT=600000
MAX_CONCURRENT_DEPLOYMENTS=5

# Note:
# 1. Most configurations are preset in the vars section of wrangler.jsonc
# 2. .dev.vars is mainly used to override sensitive information
# 3. Cloudflare resources (Queues, D1, R2) are configured through wrangler.jsonc
```

### Installation

```bash
# Enter deployment service directory
cd apps/deploy

# Install dependencies (execute in project root directory)
cd ../../ && bun install

# Return to deployment service directory
cd apps/deploy

# Generate Cloudflare type definitions
bun run cf-typegen

# Create environment variables file (if needed)
touch .dev.vars

# Edit environment variables
nano .dev.vars
```

## Development Guide

### Quick Start

```bash
# Start development server
bun dev

# Service will be available at:
# - Local: http://localhost:3008
# - API Documentation: http://localhost:3008/docs
# - Service Info: http://localhost:3008/
```

### API Testing & Documentation

#### API Documentation Access

```bash
# After starting the service, access auto-generated API documentation
open http://localhost:3008/docs

# View OpenAPI specification
curl http://localhost:3008/openapi.json
```

#### Deployment Request

```bash
# Create new deployment (authentication required)
curl -X POST http://localhost:3008/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "your_project_id",
    "orgId": "your_org_id",
    "userId": "your_user_id",
    "customDomain": "example.com",
    "initFiles": [
      {
        "path": "index.html",
        "content": "<!DOCTYPE html><html>...</html>"
      }
    ],
    "historyMessages": [
      {
        "role": "user",
        "content": "Create a simple website"
      }
    ]
  }'

# Response example
{
  "success": true,
  "deploymentId": "abc123def456789",
  "status": "queued",
  "message": "Deployment queued successfully",
  "timestamp": "2025-07-22T10:30:00.000Z"
}
```

#### Status Query

```bash
# Query deployment status
curl "http://localhost:3008/deploy-status?id=abc123def456789"

# Response example
{
  "deploymentId": "abc123def456789",
  "status": "building",
  "currentStep": "build",
  "progress": 60,
  "steps": {
    "validate": { "status": "completed", "timestamp": "2025-07-22T10:30:05.000Z" },
    "sync": { "status": "completed", "timestamp": "2025-07-22T10:30:10.000Z" },
    "sandbox": { "status": "completed", "timestamp": "2025-07-22T10:30:15.000Z" },
    "build": { "status": "in_progress", "timestamp": "2025-07-22T10:30:20.000Z" },
    "deploy": { "status": "pending" },
    "cleanup": { "status": "pending" }
  },
  "logs": [
    "Validating deployment parameters...",
    "Syncing project data...",
    "Creating sandbox environment...",
    "Building project..."
  ],
  "timestamp": "2025-07-22T10:30:25.000Z"
}
```

#### Health Check

```bash
# Basic health check
curl "http://localhost:3008/health"

# Response example
{
  "status": "healthy",
  "timestamp": "2025-07-22T10:30:00.000Z",
  "service": "Zepid Deploy V2",
  "version": "2.0.0",
  "uptime": 1234567,
  "checks": {
    "database": "healthy",
    "queue": "healthy"
  }
}
```

### Core Feature Implementation

#### Main Entry File (src/index.ts)

```typescript
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import {
  createErrorHandler,
  createCorsMiddleware,
  createLoggingMiddleware,
  createRequestIdMiddleware
} from '@libra/middleware'
import { handleQueueBatch } from './queue/consumer'
import { openApiApp } from './openapi'
import { createLogger } from './utils/logger'
import type { Bindings, Variables, QueueMessage } from './types'

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

// Apply middleware stack
app.onError(createErrorHandler('deploy-v2'))
app.use('*', createRequestIdMiddleware())
app.use('*', createLoggingMiddleware({ service: 'deploy-v2', level: 'info' }))
app.use('*', createCorsMiddleware())

// Integrate OpenAPI application routes
app.route('/', openApiApp)

// API documentation
app.get('/docs', Scalar({
  url: '/openapi.json',
  theme: 'default',
  pageTitle: 'Zepid Deploy V2 API Documentation'
}))

// Cloudflare Worker exports
export default {
  fetch: app.fetch,

  // Queue message processing
  async queue(batch: MessageBatch<QueueMessage>, env: Bindings, ctx: ExecutionContext) {
    const logger = createLogger(env)

    try {
      await handleQueueBatch(batch, env, ctx)
    } catch (error) {
      logger.error('Queue batch processing failed', { error })
      throw error
    }
  }
}
```

## Deployment Workflow

### Six-Step Deployment Process

The deployment service adopts a standardized six-step workflow, with each step having clear responsibilities and error handling mechanisms:

#### Step 1: Validate
**File**: `src/deployment/steps/validate.ts`

**Functions**:
- Validate deployment parameter completeness and validity
- Check project existence and permissions
- Verify quotas and limits
- Check custom domain availability

**Implementation Points**:
```typescript
export async function validateStep(params: DeploymentParams, context: DeploymentContext) {
  // Parameter validation
  if (!params.projectId || !params.orgId || !params.userId) {
    throw new DeploymentError('Missing required parameters', ErrorCodes.VALIDATION_ERROR)
  }

  // Project existence check
  const project = await getProject(params.projectId)
  if (!project) {
    throw new DeploymentError('Project not found', ErrorCodes.PROJECT_NOT_FOUND)
  }

  // Quota check
  await checkDeploymentQuota(params.orgId)

  // Custom domain validation
  if (params.customDomain) {
    await validateCustomDomain(params.customDomain)
  }
}
```

#### Step 2: Sync
**File**: `src/deployment/steps/sync.ts`

**Functions**:
- Retrieve project data and files from database
- Synchronize history messages and context
- Prepare all data required for deployment
- Create deployment working directory

**Key Features**:
- Data integrity checking
- Incremental sync support
- Error recovery mechanism

#### Step 3: Sandbox
**File**: `src/deployment/steps/sandbox.ts`

**Functions**:
- Create isolated sandbox environment
- Configure runtime environment and dependencies
- Set security policies and resource limits
- Prepare build environment

**Supported Sandbox Providers**:
- **Daytona**: Default provider, cloud-native development environment
- **E2B**: Alternative provider, code execution sandbox

#### Step 4: Build
**File**: `src/deployment/steps/build.ts`

**Functions**:
- Execute project build in sandbox environment
- Handle dependency installation and compilation
- Generate static assets and build artifacts
- Optimize and compress output files

**Build Features**:
- Multi-framework support (React, Vue, Next.js, etc.)
- Intelligent caching mechanism
- Build logging
- Error diagnosis and reporting

#### Step 5: Deploy
**File**: `src/deployment/steps/deploy.ts`

**Functions**:
- Deploy build artifacts to target environment
- Configure CDN and caching strategies
- Set up custom domains and SSL
- Update DNS records

**Deployment Targets**:
- Cloudflare Pages (primary)
- Static file hosting
- Edge function deployment

#### Step 6: Cleanup
**File**: `src/deployment/steps/cleanup.ts`

**Functions**:
- Clean up temporary files and sandbox environment
- Release resources and connections
- Update deployment status and statistics
- Send completion notifications

### Workflow Orchestrator

**File**: `src/deployment/workflow.ts`

```typescript
export class QueueDeploymentWorkflow {
  private steps = [
    { name: 'validate', handler: validateStep },
    { name: 'sync', handler: syncStep },
    { name: 'sandbox', handler: sandboxStep },
    { name: 'build', handler: buildStep },
    { name: 'deploy', handler: deployStep },
    { name: 'cleanup', handler: cleanupStep }
  ]

  async execute(params: DeploymentParams, context: DeploymentContext) {
    const stateManager = new DeploymentStateManager(context.env)

    try {
      for (const step of this.steps) {
        await stateManager.updateStepStatus(
          context.deploymentId,
          step.name,
          'in_progress'
        )

        await step.handler(params, context)

        await stateManager.updateStepStatus(
          context.deploymentId,
          step.name,
          'completed'
        )
      }

      await stateManager.updateDeploymentStatus(
        context.deploymentId,
        'completed'
      )

    } catch (error) {
      await stateManager.updateDeploymentStatus(
        context.deploymentId,
        'failed',
        error.message
      )
      throw error
    }
  }
}
```

### State Management

**File**: `src/deployment/state.ts`

Deployment state is managed through a hybrid storage architecture:

**D1 Database**:
- Basic deployment information and status
- Step progress and timestamps
- Error information and retry counts

**R2 Storage**:
- Detailed build logs
- Deployment artifacts and builds
- Error stacks and debug information

```typescript
export class DeploymentStateManager {
  async updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus,
    error?: string
  ) {
    // Update D1 database status
    await this.db.update(deployments)
      .set({
        status,
        error,
        updatedAt: new Date()
      })
      .where(eq(deployments.id, deploymentId))

    // Store detailed logs to R2 if available
    if (error) {
      await this.storeDetailedLogs(deploymentId, { error, timestamp: new Date() })
    }
  }
}
```

## API Reference

### Authentication

All endpoints requiring authentication need a valid Bearer Token or Session in the request header:

```bash
# Bearer Token authentication
Authorization: Bearer YOUR_TOKEN

# Session authentication (via Cookie)
Cookie: session=YOUR_SESSION_TOKEN
```

**Public endpoints (no authentication required)**:
- `GET /` - Service information
- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /openapi.json` - OpenAPI specification

### Deployment Management

#### POST /deploy

Create a new deployment task and add it to queue processing.

**Authentication**: Required

**Request Body**:
```typescript
{
  projectId: string,        // Project ID (required)
  orgId: string,           // Organization ID (required)
  userId: string,          // User ID (required)
  customDomain?: string,   // Custom domain (optional)
  initFiles?: Array<{      // Initial files (optional)
    path: string,
    content: string
  }>,
  historyMessages?: Array<{ // History messages (optional)
    role: 'user' | 'assistant',
    content: string
  }>
}
```

**Response**:
```typescript
{
  success: boolean,        // Whether operation succeeded
  deploymentId: string,    // Deployment task ID
  status: 'queued',        // Initial status
  message: string,         // Operation result message
  timestamp: string        // Timestamp
}
```

#### GET /deploy-status

Query the current status and progress of a deployment task.

**Authentication**: Not required

**Query Parameters**:
- `id`: Deployment task ID

**Response**:
```typescript
{
  deploymentId: string,    // Deployment task ID
  status: 'queued' | 'in_progress' | 'completed' | 'failed', // Overall status
  currentStep?: string,    // Current execution step
  progress: number,        // Progress percentage (0-100)
  steps: {                 // Detailed status of each step
    validate: StepStatus,
    sync: StepStatus,
    sandbox: StepStatus,
    build: StepStatus,
    deploy: StepStatus,
    cleanup: StepStatus
  },
  logs: string[],          // Execution logs
  error?: string,          // Error information (if failed)
  timestamp: string        // Last update time
}

// StepStatus type
{
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  timestamp?: string,
  error?: string
}
```

### Monitoring and Health Check

#### GET /health

Get service health status.

**Authentication**: Not required

**Response**:
```typescript
{
  status: 'healthy' | 'unhealthy',  // Service status
  timestamp: string,                // Check time
  service: string,                  // Service name
  version: string,                  // Service version
  uptime: number,                   // Uptime (milliseconds)
  checks: {                         // Dependency checks
    database: 'healthy' | 'unhealthy',
    queue: 'healthy' | 'unhealthy'
  }
}
```

#### GET /

Get basic service information.

**Authentication**: Not required

**Response**:
```typescript
{
  message: string,          // Service description
  service: string,          // Service name
  version: string,          // Version number
  status: string,           // Running status
  timestamp: string,        // Current time
  architecture: string,     // Architecture type
  description: string,      // Detailed description
  endpoints: string[]       // Available endpoint list
}
```

### Error Response

All APIs return a unified error format when errors occur:

```typescript
{
  success: false,
  error: string,            // Error type
  message: string,          // Error description
  details?: any,            // Detailed information (optional)
  timestamp: string         // Error time
}
```

**Common Error Codes**:
- `400` - Request parameter error
- `401` - Authentication failed
- `403` - Insufficient permissions
- `404` - Resource not found
- `429` - Request rate limit
- `500` - Internal server error

## Queue System

### Queue Configuration

The deployment service uses two Cloudflare Queues:

#### deployment-queue (Main Queue)
```json
{
  "queue": "deployment-queue",
  "max_batch_size": 1,        // Batch size: 1 message
  "max_batch_timeout": 0,     // Batch timeout: immediate processing
  "max_retries": 2,           // Maximum retries: 2 times
  "max_concurrency": 5,       // Maximum concurrency: 5
  "dead_letter_queue": "deployment-dlq"
}
```

#### deployment-dlq (Dead Letter Queue)
```json
{
  "queue": "deployment-dlq",
  "binding": "DEPLOYMENT_DLQ"
}
```

### Message Format

Queue messages use standardized JSON format:

```typescript
interface QueueMessage {
  deploymentId: string,     // Unique deployment task identifier
  params: DeploymentParams, // Deployment parameters
  metadata: {
    timestamp: string,      // Message creation time
    retryCount: number,     // Retry count
    priority: number        // Priority (reserved)
  }
}
```

### Queue Processing Flow

#### Message Producer (src/queue/producer.ts)

```typescript
export async function sendToQueue(
  queue: Queue<QueueMessage>,
  deploymentId: string,
  params: DeploymentParams
) {
  const message: QueueMessage = {
    deploymentId,
    params,
    metadata: {
      timestamp: new Date().toISOString(),
      retryCount: 0,
      priority: 1
    }
  }

  await queue.send(message)
}
```

#### Message Consumer (src/queue/consumer.ts)

```typescript
export async function handleQueueBatch(
  batch: MessageBatch<QueueMessage>,
  env: Bindings,
  ctx: ExecutionContext
) {
  const workflow = new QueueDeploymentWorkflow()

  for (const message of batch.messages) {
    try {
      const context = createDeploymentContext(message.body.deploymentId, env)
      await workflow.execute(message.body.params, context)

      // Confirm successful message processing
      message.ack()

    } catch (error) {
      // Log error and retry
      console.error('Deployment failed:', error)
      message.retry()
    }
  }
}
```

## Deployment Guide

### Preparation

1. **Cloudflare Account Setup**
   - Active Cloudflare account
   - Workers service enabled
   - Queues service configured
   - D1 database configured
   - R2 storage bucket configured (optional)

2. **Authentication Setup**
   ```bash
   wrangler auth login
   wrangler whoami
   ```

### Resource Configuration

#### Cloudflare Queues

```bash
# Create main deployment queue
wrangler queues create deployment-queue

# Create dead letter queue
wrangler queues create deployment-dlq

# View queue list
wrangler queues list
```

#### D1 Database

```bash
# Create D1 database
wrangler d1 create libra

# View database list
wrangler d1 list

# Execute database migrations (if needed)
wrangler d1 migrations apply libra
```

#### R2 Storage Bucket (Optional)

```bash
# Create log storage bucket
wrangler r2 bucket create libra-deployment-logs

# Create artifact storage bucket
wrangler r2 bucket create libra-deployment-artifacts

# View bucket list
wrangler r2 bucket list
```

### Environment Deployment

#### Development Environment

```bash
# Start development server
bun dev

# Development server will start at http://localhost:3008
# Queue processor will automatically start and listen for messages
```

#### Production Environment

```bash
# Set production environment secrets
wrangler secret put BETTER_GITHUB_CLIENT_SECRET --env production
wrangler secret put POSTGRES_URL --env production
wrangler secret put E2B_API_KEY --env production
wrangler secret put DAYTONA_API_KEY --env production

# Deploy to production environment
bun run deploy:prod
```

### Custom Domain

```bash
# Add custom domain route
wrangler route add "deploy.zepid.dev/*" libra-deploy

# View current routes
wrangler route list
```

### wrangler.jsonc Configuration

```json
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "libra-deploy",
  "main": "src/index.ts",
  "compatibility_date": "2025-07-17",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],

  "routes": [
    {
      "pattern": "deploy.zepid.dev",
      "custom_domain": true
    }
  ],

  "d1_databases": [
    {
      "binding": "DATABASE",
      "database_name": "zepid-d1",
      "database_id": "your_database_id"
    }
  ],

  "queues": {
    "consumers": [
      {
        "queue": "deployment-queue",
        "max_batch_size": 1,
        "max_batch_timeout": 0,
        "max_retries": 2,
        "max_concurrency": 5,
        "dead_letter_queue": "deployment-dlq"
      }
    ],
    "producers": [
      {
        "queue": "deployment-queue",
        "binding": "DEPLOYMENT_QUEUE"
      },
      {
        "queue": "deployment-dlq",
        "binding": "DEPLOYMENT_DLQ"
      }
    ]
  },

  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info",
    "DEPLOYMENT_QUEUE_NAME": "deployment-queue",
    "DEPLOYMENT_DLQ_NAME": "deployment-dlq",
    "MAX_DEPLOYMENT_TIMEOUT": "600000",
    "MAX_CONCURRENT_DEPLOYMENTS": "5"
  }
}
```

## Troubleshooting

### Common Issues

#### Deployment Request Failure

**Symptoms**: Deployment request returns 400 or 500 error.

**Solutions**:
```bash
# Check authentication status
curl -X POST http://localhost:3008/deploy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","orgId":"test","userId":"test"}' -v

# Check queue configuration
wrangler queues list

# Check D1 database
wrangler d1 list

# View real-time logs
wrangler tail
```

#### Queue Processing Failure

**Symptoms**: Deployment tasks stuck in "queued" status.

**Solutions**:
- Check queue consumer configuration
- View failed messages in dead letter queue
- Check concurrency limit settings
- Verify environment variable configuration

#### Deployment Status Query Exception

**Symptoms**: Status query returns 404 or stale data.

**Solutions**:
- Confirm deployment ID is correct
- Check D1 database connection
- Verify state manager implementation
- Check database table structure

#### Sandbox Environment Creation Failure

**Symptoms**: Deployment fails at sandbox step.

**Solutions**:
```bash
# Check sandbox provider configuration
echo $E2B_API_KEY
echo $DAYTONA_API_KEY

# Verify sandbox provider status
# Check src/deployment/steps/sandbox.ts configuration

# Test sandbox connection
curl -X GET "https://api.e2b.dev/health" \
  -H "Authorization: Bearer $E2B_API_KEY"
```

### Debugging Tools

#### Log Viewing

```bash
# View Worker logs in real-time
wrangler tail

# View development logs
bun dev --verbose

# View queue processing logs
wrangler queues consumer --name deployment-queue
```

#### Queue Monitoring

```bash
# View queue status
wrangler queues list

# View dead letter queue messages
wrangler queues consumer --name deployment-dlq

# Manually send test message
wrangler queues producer --name deployment-queue --message '{"test": true}'
```

#### Performance Monitoring

```bash
# Check deployment performance
curl -w "@curl-format.txt" http://localhost:3008/health

# curl-format.txt content:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

## Related Resources

### Documentation
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Queues Documentation](https://developers.cloudflare.com/queues/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Hono Documentation](https://hono.dev/)
- [Zod Documentation](https://zod.dev/)

### Internal Resources
- `@libra/auth` - Authentication utility library
- `@libra/common` - Shared utility library (logging, error handling)
- `@libra/db` - Database operations library
- `@libra/sandbox` - Sandbox environment management
- `@libra/templates` - Project template system
- `apps/cdn` - CDN service
- `apps/web` - Main web application

### Development Tools
- [Scalar API Documentation](https://github.com/scalar/scalar) - API documentation generation
- [Vitest](https://vitest.dev/) - Unit testing framework
- [TypeScript](https://www.typescriptlang.org/) - Type system

### Sandbox Providers
- [E2B](https://e2b.dev/) - Code execution sandbox
- [Daytona](https://www.daytona.io/) - Cloud-native development environment