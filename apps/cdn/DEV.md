# @libra/cdn Development Guide

> High-performance CDN service based on Cloudflare Workers

Version: 0.0.0
Last Updated: 2025-07-30

## Table of Contents

- [@libra/cdn Development Guide](#libracdn-development-guide)
    - [Table of Contents](#table-of-contents)
    - [Overview](#overview)
    - [Core Features](#core-features)
        - [🗄️ File Management](#️-file-management)
        - [🖼️ Image Processing](#️-image-processing)
        - [📸 Screenshot Service](#-screenshot-service)
        - [🎯 Developer Tools](#-developer-tools)
    - [Technical Architecture](#technical-architecture)
        - [🏗️ Core Tech Stack](#️-core-tech-stack)
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
            - [File Upload](#file-upload)
            - [Image Access](#image-access)
            - [Screenshot Service](#screenshot-service)
- [Retrieve screenshot key (public access)](#retrieve-screenshot-key-public-access)
- [Response example](#response-example)
  - [Badge Service](#badge-service)
  - [Component Inspector](#component-inspector)
    - [Core Feature Implementation](#core-feature-implementation)
        - [Main Entry File (src/index.ts)](#main-entry-file-srcindexts)
        - [File Upload Implementation (src/routes/upload.ts)](#file-upload-implementation-srcroutesuploadts)
    - [API Reference](#api-reference)
        - [Authentication](#authentication)
        - [File Upload](#file-upload-1)
            - [PUT /upload](#put-upload)
        - [Image Access](#image-access-1)
            - [GET /image/{key}](#get-imagekey)
        - [Screenshot Service](#screenshot-service-1)
            - [POST /screenshot](#post-screenshot)
            - [GET /screenshot/{planId}](#get-screenshotplanid)
        - [File Deletion](#file-deletion)
            - [DELETE /file/{planId}](#delete-fileplanid)
        - [Badge Service](#badge-service-1)
            - [GET /badge.js](#get-badgejs)
        - [Developer Tools](#developer-tools)
            - [GET /inspector](#get-inspector)
            - [GET /inspect.js](#get-inspectjs)
            - [GET /docs](#get-docs)
            - [GET /openapi.json](#get-openapijson)
            - [GET /debug/session](#get-debugsession)
        - [Quota Management](#quota-management)
        - [Rate Limiting](#rate-limiting)
    - [Deployment Guide](#deployment-guide)
        - [Prerequisites](#prerequisites-1)
        - [Resource Configuration](#resource-configuration)
            - [R2 Storage Bucket](#r2-storage-bucket)
            - [KV Namespace](#kv-namespace)
            - [D1 Database](#d1-database)
        - [Environment Deployment](#environment-deployment)
            - [Development Environment](#development-environment)
            - [Production Environment](#production-environment)
        - [Custom Domain](#custom-domain)
        - [wrangler.jsonc Configuration](#wranglerjsonc-configuration)
    - [Troubleshooting](#troubleshooting)
        - [Common Issues](#common-issues)
            - [File Upload Failure](#file-upload-failure)
            - [Image Access Failure](#image-access-failure)
            - [Screenshot Service Issues](#screenshot-service-issues)
            - [Inspector Access Issues](#inspector-access-issues)
            - [Authentication Issues](#authentication-issues)
    - [Related Resources](#related-resources)
        - [Documentation](#documentation)
        - [Internal Resources](#internal-resources)
        - [Development Tools](#development-tools)

## Overview

`@libra/cdn` is the core storage service of the Zepid AI platform, built on Cloudflare Workers edge computing architecture. It provides file upload, image processing, screenshot management, quota control and other functions, supporting global distributed deployment and intelligent caching strategies. Through deep integration with better-auth, it implements a comprehensive authentication and authorization system.

## Core Features

### 🗄️ File Management
| Feature | Description | Technical Features |
|---------|-------------|-------------------|
| **Smart Upload** | File replacement management based on planId | SHA256 deduplication, automatic old file replacement, max 5MB |
| **Distributed Storage** | Cloudflare R2 object storage | Global edge nodes, high availability |
| **Secure Deletion** | Cascading deletion of associated files | KV mapping cleanup, quota recovery |
| **High-speed Access** | Intelligent caching strategy | 30-day browser cache, edge cache |
| **Quota Management** | User/organization level upload quotas | Automatic deduction and recovery, plan limits, 1 time/10 seconds rate limiting |

### 🖼️ Image Processing
| Feature | Description | Limitations |
|---------|-------------|-------------|
| **Multi-format Support** | PNG, JPEG, WebP, SVG, AVIF | Max 5MB |
| **Size Tagging** | Width and height identification storage | `{hash}_{width}x{height}.{ext}` |
| **Smart Compression** | Cloudflare Images integration (preferred) + fallback compression | Automatic format conversion, 80% quality optimization |
| **CDN Acceleration** | Global node distribution | Cache-Control: 30 days |
| **Content Validation** | MIME type validation + SHA256 verification | Prevent malicious file uploads |

### 📸 Screenshot Service
| Feature | Description | Security |
|---------|-------------|----------|
| **Base64 Storage** | Support for dataURL format | Authentication protection |
| **Fast Retrieval** | planId → key mapping | Public read access (iframe) |
| **Format Conversion** | PNG/JPEG automatic recognition | MIME type validation |
| **TTL Management** | 90-day automatic expiration | KV storage optimization |

### 🎯 Developer Tools
| Tool | Purpose | Access Path |
|------|---------|-------------|
| **API Documentation** | Scalar interactive documentation (OpenAPI 3.1) | `/docs` |
| **Inspector** | Real-time component debugging (development only) | `/inspector` |
| **Badge.js** | "Made with Libra" website badge | `/badge.js` |
| **OpenAPI** | API specification export | `/openapi.json` |
| **Health Check** | Service status monitoring | `/` |
| **Static Resources** | Sound effects, scripts, icons | `/public/inspect.js` etc |

## Technical Architecture

### 🏗️ Core Tech Stack
```typescript
// Runtime Environment
├── Cloudflare Workers    // Edge computing platform
├── Hono v4.x            // High-performance web framework
├── TypeScript 5.x       // Type safety guarantee
└── Node.js 24+          // Development environment requirement

// Storage Layer
├── R2 Storage           // Object storage (file content)
├── KV Namespace         // Key-value storage (mapping relationships)
├── D1 Database          // SQLite (optional)
├── Hyperdrive           // Database connection pool (optional)
└── Cache API            // Edge cache

// API Layer
├── @hono/zod-openapi    // OpenAPI integration
├── Zod Schemas          // Runtime validation
├── @scalar/hono-api-ref // API documentation UI
└── better-auth          // Authentication authorization framework

// Advanced Features (optional)
├── Cloudflare Images    // Image optimization service
├── Rate Limiting API    // Rate limiting
└── @libra/common        // Logging and utility library
```

### 🔐 Security Architecture
| Layer | Technology | Description |
|-------|------------|-------------|
| **Authentication** | better-auth + @libra/auth | Bearer Token, Session management |
| **Authorization** | Middleware chain | Route-level permission control, skip public endpoints |
| **Rate Limiting** | Cloudflare Rate Limiting | Configurable user-level limits |
| **Validation** | Zod Schemas | Request/response validation, file type verification |
| **CORS** | Dynamic configuration | localhost/zepid.dev whitelist |
| **Encryption** | SHA256 | File uniqueness verification, prevent duplicate uploads |
| **Quota** | KV storage | User/organization level upload limits |

## Directory Structure

```text
apps/cdn/                          # CDN service root directory
├── README.md                      # Basic service documentation
├── package.json                   # Dependencies and script definitions
├── biome.json                     # Code formatting configuration
├── tsconfig.json                  # TypeScript configuration
├── wrangler.jsonc                 # Cloudflare Workers configuration (using compatibility date 2025-07-17)
├── worker-configuration.d.ts      # Cloudflare Workers environment types
├── badge-test.html               # Badge functionality test page
├── .dev.vars.example             # Environment variables example
├── src/                          # Source code directory
│   ├── index.ts                  # Worker main entry, integrates all routes
│   ├── openapi.ts                # OpenAPI application configuration and route registration
│   ├── auth-server.ts            # better-auth authentication configuration
│   ├── inspector.ts              # Component Inspector functionality
│   ├── db.ts                     # Database configuration
│   ├── db-postgres.ts            # PostgreSQL database configuration
│   ├── drizzle.config.ts         # Drizzle ORM configuration
│   ├── config/                   # Configuration files directory
│   ├── middleware/               # Middleware directory
│   ├── routes/                   # API route handlers
│   │   ├── upload.ts             # File upload route (PUT /upload)
│   │   ├── image.ts              # Image access route (GET /image/{key})
│   │   ├── screenshot.ts         # Screenshot service route (POST /screenshot, GET /screenshot/{planId})
│   │   ├── delete.ts             # File deletion route (DELETE /file/{planId})
│   │   └── badge.ts              # Badge script route (GET /badge.js)
│   ├── schemas/                  # Zod data validation schemas
│   │   ├── upload.ts             # File upload validation schema
│   │   ├── image.ts              # Image access parameter schema
│   │   ├── screenshot.ts         # Screenshot request parameter schema
│   │   └── delete.ts             # Delete operation validation schema
│   ├── types/                    # Type definitions directory
│   └── utils/                    # Utility functions library
│       ├── __tests__/            # Unit tests
│       ├── common.ts             # Common utility functions
│       ├── error-handler.ts      # Error handling utilities
│       ├── file-management.ts    # R2 file management and planId mapping utilities
│       ├── file-validation.ts    # File validation utilities
│       ├── quota-management.ts   # Quota management utilities
│       └── screenshot-management.ts # Screenshot processing utilities
└── public/                       # Static resources directory
    ├── logo.png                  # Logo icon
    ├── inspect.js                # Component Inspector client script
    └── notification.wav          # Notification sound effect
```

## Environment Setup

### Prerequisites

```bash
# Required tools
node >= 18.0.0
bun >= 1.0.0
wrangler >= 4.0.0


# Cloudflare authentication
wrangler auth login
```

### Environment Variables

Create `.dev.vars` file in `apps/cdn` directory:

```bash
# GitHub OAuth configuration
BETTER_GITHUB_CLIENT_ID=your_github_client_id
BETTER_GITHUB_CLIENT_SECRET=your_github_client_secret

# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Database configuration
DATABASE_ID=your_database_id
POSTGRES_URL=postgresql://user:password@host:port/database

# Security configuration
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# Email service configuration
RESEND_FROM=noreply@yourdomain.com
RESEND_API_KEY=your_resend_api_key

# Note:
# 1. Most configurations are preset in the vars section of wrangler.jsonc
# 2. .dev.vars is mainly used to override sensitive information
# 3. Cloudflare resources (R2, KV, D1) are configured through wrangler.jsonc
```

### Installation

```bash
# Enter CDN directory
cd apps/cdn

# Install dependencies (execute in project root directory)
cd ../../ && bun install

# Return to CDN directory
cd apps/cdn

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

# Service will be available at the following addresses:
# - Local: http://localhost:3004
# - API Documentation: http://localhost:3004/docs
# - Inspector: http://localhost:3004/inspector
```

### API Testing & Documentation

#### API Documentation Access

```bash
# After starting the service, access the automatically generated API documentation
open http://localhost:3004/docs

# View OpenAPI specification
curl http://localhost:3004/openapi.json
```

#### File Upload

```bash
# Upload image file (authentication required)
curl -X PUT http://localhost:3004/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@example.jpg" \
  -F "planId=your_plan_id"

# Upload with size tagging (for responsive images)
curl -X PUT http://localhost:3004/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@example.jpg" \
  -F "planId=your_plan_id" \
  -F "width=800" \
  -F "height=600"

# Response example (returns file key)
abc123def456789.jpg                    # Normal upload
abc123def456789_800x600.jpg           # Upload with size tagging
```

#### Image Access

```bash
# Access image by key
curl "http://localhost:3004/image/abc123def456789.jpg"

# Response headers include caching strategy
# Cache-Control: public, max-age=2592000 (30 days)
# Content-Type: image/jpeg
```

#### Screenshot Service
Provided by dedicated screenshot service

# Retrieve screenshot key (public access)
curl "http://localhost:3004/screenshot/your_plan_id"

# Response example
{
"key": "screenshot_abc123def456.png",
"planId": "your_plan_id",
"timestamp": 1704067200000
}
```

#### File Deletion

```bash
# Delete file (authentication required)
curl -X DELETE http://localhost:3004/file/your_plan_id \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response example
{
  "success": true,
  "message": "File deleted successfully",
  "fileKey": "abc123def456789.jpg"
}
```

#### Badge Service

```bash
# Get Badge script
curl "http://localhost:3004/badge.js"

# Use in web pages
<script src="https://cdn.zepid.dev/badge.js"></script>
```

#### Component Inspector

```bash
# Access Inspector interface
open http://localhost:3004/inspector

# Get Inspector client script
curl "http://localhost:3004/inspect.js"
```

### Core Feature Implementation

#### Main Entry File (src/index.ts)

```typescript
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'

import { createErrorHandler } from '@libra/middleware'
import { createCorsMiddleware } from '@libra/middleware/cors'
import { createLoggingMiddleware, createRequestIdMiddleware } from '@libra/middleware/logging'

import { registerInspectorRoutes } from './inspector'
import { openApiApp } from './openapi'
import type { Bindings, Variables } from './types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Apply middleware stack
app.use('*', createRequestIdMiddleware())
app.onError(createErrorHandler('cdn'))
app.use('*', createCorsMiddleware())
app.use('*', createLoggingMiddleware({ service: 'cdn', level: 'info' }))

// Handle OPTIONS requests for /upload
app.options('/upload', (c) => {
    return c.newResponse(null, 204)
})

// Root path
app.get('/', async (c) => {
    return c.text('Hello Zepid AI!')
})

// Register Inspector routes (development only)
registerInspectorRoutes(app)

// Integrate OpenAPI application routes
app.route('/', openApiApp)

// API documentation
app.get('/docs', Scalar({
    url: '/openapi.json',
    theme: 'default',
    pageTitle: 'Libra CDN API Documentation',
    customCss: `
    .light-mode {
      --scalar-color-accent: #0099ff;
    }
    .dark-mode {
      --scalar-color-accent: #e36002;
    }
  `,
}))

export default app
```

#### File Upload Implementation (src/routes/upload.ts)

```typescript
import { createRoute } from '@hono/zod-openapi'
import { log, logger, LogLevel } from '@libra/common'
import { sha256 } from 'hono/utils/crypto'
import { getExtension } from 'hono/utils/mime'
import type { z } from 'zod'
import { errorResponseSchema, uploadRequestSchema, uploadResponseSchema } from '../schemas/upload'
import { checkAndUpdateUploadUsage } from '../utils/quota-management'
import { getConfig, uploadConfig } from '../config'
import type { AppContext } from '../types'
import { CDNError, CommonErrors, ErrorCodes, withErrorHandling } from '../utils/error-handler'
import { getStorageBucket, logWithContext } from '../utils/common'
import { sanitizeFileMetadata, validateFile } from '../utils/file-validation'

export const uploadRoute = createRoute({
  method: 'put',
  path: '/upload',
  summary: 'Upload an image file',
  description: 'Upload an image file to R2 storage with optional width and height parameters for resizing',
  tags: ['Images'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: uploadRequestSchema
        }
      },
      required: true
    }
  },
  responses: {
    200: {
      description: 'Image uploaded successfully',
      content: {
        'text/plain': {
          schema: uploadResponseSchema.shape.key
        }
      }
    },
    401: {
      description: 'Unauthorized - Valid session required',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    }
  }
})

export const uploadHandler = withErrorHandling(async (c: AppContext) => {
  const requestId = c.get('requestId')
  logWithContext(c, 'info', 'Upload request started', { operation: 'upload' })

  const data = await c.req.parseBody() as { image: File; width: string; height: string; planId: string }
  const file: File = data.image
  const planId: string = data.planId

  // Validate file and parameters
  await validateFile(file, uploadConfig.maxFileSize)

  const type = file.type
  const extension = getExtension(type) ?? 'png'
  const arrayBuffer = await file.arrayBuffer()

  // Generate file key
  let key: string
  if (data.width && data.height) {
    key = `${await sha256(arrayBuffer)}_${data.width}x${data.height}.${extension}`
  } else {
    key = `${await sha256(arrayBuffer)}.${extension}`
  }

  // Check quota and upload file
  await checkAndUpdateUploadUsage(c, planId)

  const bucket = getStorageBucket(c)
  const metadata = sanitizeFileMetadata({
    planId,
    uploadedAt: new Date().toISOString(),
    contentType: type,
    size: file.size
  })

  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: type },
    customMetadata: metadata
  })

  logWithContext(c, 'info', 'Upload completed successfully', {
    operation: 'upload',
    planId,
    fileKey: key
  })

  return c.text(key)
})
```

## API Reference

### Authentication

All endpoints requiring authentication need to include a valid Bearer Token or Session in the request headers:

```bash
# Bearer Token authentication
Authorization: Bearer YOUR_TOKEN

# Session authentication (via Cookie)
Cookie: session=YOUR_SESSION_TOKEN
```

**Public endpoints (no authentication required)**:
- `GET /` - Root path
- `GET /image/{key}` - Image access
- `GET /screenshot/{planId}` - Screenshot retrieval
- `GET /badge.js` - Badge script
- `GET /inspector` - Inspector UI (development only)
- `GET /docs` - API documentation
- `GET /openapi.json` - OpenAPI specification

### File Upload

#### PUT /upload

Upload image files to CDN with planId-based file replacement management.

**Authentication**: Required

**Request Body**:
```typescript
{
  image: File,          // Image file to upload
  planId: string,       // Plan ID (for file replacement tracking)
  width?: string,       // Optional: image width (for resizing)
  height?: string       // Optional: image height (for resizing)
}
```

**Response**:
```
text/plain
abc123def456789.jpg   // Returns generated file key
```

### Image Access

#### GET /image/{key}

Get image by file key.

**Authentication**: Not required

**Path Parameters**:
- `key`: File unique identifier

**Response**:
- **Content-Type**: image/*
- **Cache-Control**: public, max-age=2592000 (30-day cache)

### Screenshot Service

#### POST /screenshot

Store screenshot data.

**Authentication**: Required

**Request Body**:
```typescript
{
  dataUrl: string,      // base64 format image data URL
  planId: string,       // Plan ID
  format?: 'png' | 'jpeg'  // Image format (default png, supports png or jpeg)
}
```

**Response**:
```typescript
{
  key: string,          // Generated screenshot file key
  planId: string,       // Plan ID
  timestamp: number     // Timestamp
}
```

#### GET /screenshot/{planId}

Retrieve screenshot file key by planId.

**Authentication**: Not required (public access for iframe)

**Path Parameters**:
- `planId`: Plan ID

**Response**:
```typescript
{
  key: string,          // Screenshot file key
  planId: string,       // Plan ID
  timestamp: number     // Timestamp
}
```

### File Deletion

#### DELETE /file/{planId}

Delete files associated with planId.

**Authentication**: Required

**Path Parameters**:
- `planId`: Plan ID

**Response**:
```typescript
{
  success: boolean,     // Whether operation succeeded
  message: string,      // Operation result message
  fileKey?: string      // Deleted file key (optional)
}
```

### Badge Service

#### GET /badge.js

Get Libra Badge JavaScript script.

**Authentication**: Not required

**Response**:
- **Content-Type**: application/javascript
- Returns embeddable Badge script for websites

### Developer Tools

#### GET /inspector

Access Component Inspector interface.

**Authentication**: Not required (development only)

**Response**:
- **Content-Type**: text/html
- Returns complete component inspector interface

#### GET /inspect.js

Get Inspector client script.

**Authentication**: Not required

**Response**:
- **Content-Type**: application/javascript
- Returns client inspector script

#### GET /docs

Access API documentation interface.

**Authentication**: Not required

**Response**:
- Modern API documentation interface based on Scalar
- Supports interactive API testing

#### GET /openapi.json

Get OpenAPI specification.

**Authentication**: Not required

**Response**:
- **Content-Type**: application/json
- Returns complete OpenAPI 3.1.0 specification

#### GET /debug/session

Debug current session structure.

**Authentication**: Required

**Response**:
```typescript
{
  user: {               // User information
    id: string,
    email: string,
    // ... other user fields
  },
  session: {           // Session information
    token: string,
    expiresAt: string,
    // ... other session fields
  }
}
```

### Quota Management

The quota system automatically tracks user upload usage:

**Quota Deduction**:
- Automatically deducts 1 quota when uploading files
- Replacing files with the same planId does not deduct additional quota

**Quota Recovery**:
- Automatically recovers 1 quota when deleting files
- Managed at organization or user level

**Quota Limits**:
- Set according to user subscription plans
- Upload requests are rejected when quota is exceeded

### Rate Limiting

Implemented using Cloudflare Rate Limiting API for fine-grained control:

**Default Limits**:
- File upload: According to configuration (e.g., 1 time/10 seconds)
- Based on user ID or IP address

**Custom Configuration**:
```json
// Configuration in wrangler.jsonc
{
  "unsafe": {
    "bindings": [{
      "name": "FILE_UPLOAD_RATE_LIMITER",
      "type": "ratelimit",
      "namespace_id": "1001",
      "simple": {
        "limit": 1,
        "period": 10
      }
    }]
  }
}
```

## Deployment Guide

### Prerequisites

1. **Cloudflare Account Setup**
    - Active Cloudflare account
    - Workers service enabled
    - R2 storage bucket configured
    - KV namespace configured
    - D1 database configured

2. **Authentication Setup**
   ```bash
   wrangler auth login
   wrangler whoami
   ```

### Resource Configuration

#### R2 Storage Bucket

```bash
# Create R2 storage bucket
wrangler r2 bucket create libra-cdn

# View bucket list
wrangler r2 bucket list
```

#### KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create "CDN_KV"

# View namespace list
wrangler kv:namespace list
```

#### D1 Database

```bash
# Create D1 database
wrangler d1 create libra

# View database list
wrangler d1 list
```

### Environment Deployment

#### Development Environment

```bash
# Start development server
bun dev

# Development server will start at http://localhost:3004
```

#### Production Environment

```bash
# Set production environment secrets
wrangler secret put BETTER_GITHUB_CLIENT_SECRET --env production
wrangler secret put POSTGRES_URL --env production
wrangler secret put RESEND_API_KEY --env production
wrangler secret put TURNSTILE_SECRET_KEY --env production

# Deploy to production environment
bun run deploy
```

### Custom Domain

```bash
# Add custom domain route
wrangler route add "cdn.zepid.dev/*" libra-cdn

# View current routes
wrangler route list
```

### wrangler.jsonc Configuration

```json
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "libra-cdn",
  "main": "src/index.ts",
  "compatibility_date": "2025-07-30",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "binding": "ASSETS",
    "directory": "public"
  },
  "routes": [
    {
      "pattern": "zepid.dev",
      "custom_domain": true
    }
  ],
  "minify": true,
  "placement": { "mode": "smart" },
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "your_hyperdrive_id",
      "localConnectionString": "postgresql://postgres:postgres@libra:5432/libra"
    }
  ],
  "d1_databases": [
    {
      "binding": "DATABASE",
      "database_name": "zepid-d1",
      "database_id": "your_database_id"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "your_kv_namespace_id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "libra-cdn"
    }
  ],
  "images": {
    "binding": "IMAGES"
  },
  "unsafe": {
    "bindings": [
      {
        "name": "FILE_UPLOAD_RATE_LIMITER",
        "type": "ratelimit",
        "namespace_id": "1001",
        "simple": {
          "limit": 1,
          "period": 10
        }
      }
    ]
  },
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },
  "vars": {
    "LOG_LEVEL": "info",
    "ENVIRONMENT": "development",
    "NODE_ENV": "development",
    "POSTGRES_URL": "postgresql://postgres:postgres@libra:5432/libra"
  }
}
```

## Troubleshooting

### Common Issues

#### File Upload Failure

**Symptoms**: Upload requests return 401 or 500 errors.

**Solutions**:
```bash
# Check authentication status
curl -X PUT http://localhost:3004/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg" \
  -F "planId=test123" -v

# Check R2 storage bucket configuration
wrangler r2 bucket list

# Check KV namespace
wrangler kv:namespace list

# View real-time logs
wrangler tail

# Check file size limit (max 5MB)
ls -lh test.jpg
```

#### Image Access Failure

**Symptoms**: Image access returns 404 errors.

**Solutions**:
- Confirm file key is correct
- Check if file exists in R2 storage bucket
- Verify cache settings

#### Screenshot Service Issues

**Symptoms**: Screenshot storage or retrieval fails.

**Solutions**:
- Check if dataUrl format is correct
- Verify planId is valid
- Confirm KV storage status

#### Inspector Access Issues

**Symptoms**: Inspector page fails to load.

**Solutions**:
- Confirm service is running on correct port (3004)
- Check if static resources load correctly
- Verify CORS configuration

#### Authentication Issues

**Symptoms**: Authentication-related endpoints return 401 errors.

**Solutions**:
```bash
# Check environment variables
echo $BETTER_GITHUB_CLIENT_ID
echo $BETTER_GITHUB_CLIENT_SECRET

# Verify better-auth configuration
# Check src/auth-server.ts configuration

# Test authentication flow
curl -X GET http://localhost:3004/ \
  -H "Authorization: Bearer YOUR_TOKEN" -v
```

## Related Resources

### Documentation
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Hono Documentation](https://hono.dev/)
- [better-auth Documentation](https://better-auth.com/)

### Internal Resources
- `@libra/auth` - Authentication utility library
- `@libra/common` - Shared utility library (logging, error handling)
- `packages/api` - API route definitions
- `apps/web` - Main web application

### Development Tools
- [Scalar API Documentation](https://github.com/scalar/scalar) - API documentation generation
- [Zod](https://zod.dev/) - TypeScript schema validation
- [Biome](https://biomejs.dev/) - Code formatting and linting