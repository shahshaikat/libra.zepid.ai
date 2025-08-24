# @libra/better-auth-cloudflare Development Documentation

> Better Auth integration plugin for Cloudflare Workers environment

## Overview

`@libra/better-auth-cloudflare` is a Better Auth integration plugin specifically designed for Cloudflare Workers environment, providing Cloudflare D1 database and KV storage support. This plugin fully leverages Cloudflare's edge computing capabilities to provide high-performance, low-latency authentication services for the zepid project.

### Core Features

- **🌍 Geolocation Tracking**: Automatically detects user geolocation information
- **🗄️ D1 Database Integration**: Supports Cloudflare D1 as the primary database
- **⚡ KV Storage Support**: Utilizes Cloudflare KV for caching
- **🔍 Real IP Detection**: Obtains real IP through Cloudflare Headers
- **🚀 Edge Optimization**: Better Auth configuration optimized for edge computing environments

## Architecture Design

### Overall Architecture

```
                    libra Project Architecture
                ┌─────────────────┐
   apps/web     │   apps/cdn      │   apps/dispatcher
   (Next.js)    │   (Hono Worker) │   (Hono Worker)
                └─────────┬───────┘
                          │
              @libra/better-auth-cloudflare
                ┌─────────┼───────┐
   withCloudflare│  cloudflare()  │  createKVStorage()
   (Config Helper)│  (Plugin Core) │  (KV Storage Adapter)
                └─────────┼───────┘
                          │
                    Better Auth Core
                ┌─────────┼───────┐
   Session      │   Database      │   Plugins
   Management   │   Adapter       │   System
                └─────────┼───────┘
                          │
                 Cloudflare Infrastructure
                ┌─────────┼───────┐
   D1 Database  │   KV Storage    │   Workers Runtime
   (Primary DB) │   (Cache Store) │   (Runtime Env)
                └─────────────────┘
```

### Core Components

#### 1. `withCloudflare()` - Configuration Helper
Adapts Better Auth configuration to Cloudflare environment, automatically configuring database adapters and KV storage.

#### 2. `cloudflare()` - Plugin Core
Provides Cloudflare-specific features such as geolocation tracking and IP detection.

#### 3. `createKVStorage()` - KV Adapter
Adapts Better Auth's SecondaryStorage interface to Cloudflare KV storage.

#### 4. `cloudflareClient()` - Client Plugin
Provides type-safe access to Cloudflare features for the client.

## Quick Start

### 1. Install Dependencies

Ensure installation in Cloudflare Workers environment:

```bash
# Install core dependencies
bun add @libra/better-auth-cloudflare better-auth
bun add -D @cloudflare/workers-types

# Configure bindings in wrangler.toml
```

### 2. Cloudflare Binding Configuration

Configure database and KV bindings in `wrangler.toml`:

```toml
# D1 Database binding
[[d1_databases]]
binding = "DATABASE"
database_name = "libra-auth"
database_id = "your-database-id"

# KV Storage binding
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

### 3. TypeScript Type Definitions

Create `worker-configuration.d.ts` file:

```typescript
interface Env {
  DATABASE: D1Database
  KV: KVNamespace
  // Other environment variables
  BETTER_AUTH_SECRET: string
  BETTER_GITHUB_CLIENT_ID: string
  BETTER_GITHUB_CLIENT_SECRET: string
}
```

### 4. Basic Usage

```typescript
// worker.ts
import { withCloudflare, cloudflare } from '@libra/better-auth-cloudflare'
import { betterAuth } from 'better-auth'
import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

// Initialize Better Auth with Cloudflare support
const auth = betterAuth(
  withCloudflare(
    {
      autoDetectIpAddress: true,
      geolocationTracking: true,
      d1: { db: c.env.DATABASE },
      kv: c.env.KV,
    },
    {
      database: c.env.DATABASE,
      secret: c.env.BETTER_AUTH_SECRET,
      plugins: [
        cloudflare({
          enableGeolocation: true,
          enableIpTracking: true,
        }),
      ],
      socialProviders: {
        github: {
          clientId: c.env.BETTER_GITHUB_CLIENT_ID,
          clientSecret: c.env.BETTER_GITHUB_CLIENT_SECRET,
        },
      },
    }
  )
)

// Mount auth routes
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

export default app
```

## API Reference

### `withCloudflare(cloudflareOptions, betterAuthOptions)`

Main configuration function that adapts Better Auth to Cloudflare environment.

#### Parameters

```typescript
interface WithCloudflareOptions {
  autoDetectIpAddress?: boolean      // Auto-detect real IP
  geolocationTracking?: boolean      // Enable geolocation tracking
  d1?: {
    db: D1Database                   // D1 database instance
  }
  kv?: KVNamespace                   // KV storage instance
}

interface BetterAuthOptions {
  database?: any                     // Database configuration
  secret: string                     // Auth secret
  plugins?: BetterAuthPlugin[]       // Plugin array
  socialProviders?: any              // Social login providers
  // ... other Better Auth options
}
```

#### Return Value

Returns enhanced Better Auth configuration with Cloudflare adapters.

#### Usage Example

```typescript
import { withCloudflare } from '@libra/better-auth-cloudflare'

const authConfig = withCloudflare(
  {
    autoDetectIpAddress: true,
    geolocationTracking: true,
    d1: { db: env.DATABASE },
    kv: env.KV,
  },
  {
    database: env.DATABASE,
    secret: env.BETTER_AUTH_SECRET,
    plugins: [/* your plugins */],
  }
)
```

### `cloudflare()` Plugin

Cloudflare-specific functionality plugin.

#### Configuration Options

```typescript
interface CloudflarePluginOptions {
  enableGeolocation?: boolean        // Enable geolocation tracking
  enableIpTracking?: boolean         // Enable IP address tracking
  customHeaders?: string[]           // Custom headers to track
}
```

#### Usage Example

```typescript
import { cloudflare } from '@libra/better-auth-cloudflare'

const auth = betterAuth({
  plugins: [
    cloudflare({
      enableGeolocation: true,
      enableIpTracking: true,
      customHeaders: ['CF-Ray', 'CF-Connecting-IP'],
    }),
  ],
})
```

#### Features

1. **Geolocation Tracking**: Automatically extracts user location from Cloudflare headers
2. **Real IP Detection**: Gets real user IP through `CF-Connecting-IP` header
3. **Request Metadata**: Collects Cloudflare-specific request information

### `createKVStorage()` Function

Creates KV storage adapter for Better Auth secondary storage.

#### Parameters

```typescript
interface KVStorageOptions {
  kv: KVNamespace                    // KV namespace instance
  prefix?: string                    // Key prefix (default: 'auth:')
  ttl?: number                       // Default TTL in seconds
}
```

#### Usage Example

```typescript
import { createKVStorage } from '@libra/better-auth-cloudflare'

const kvStorage = createKVStorage({
  kv: env.KV,
  prefix: 'libra-auth:',
  ttl: 3600, // 1 hour
})

const auth = betterAuth({
  secondaryStorage: kvStorage,
  // ... other options
})
```

#### Methods

```typescript
interface KVStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}
```

### `cloudflareClient()` Client Plugin

Client-side plugin for accessing Cloudflare features.

#### Usage Example

```typescript
// client.ts
import { createAuthClient } from 'better-auth/client'
import { cloudflareClient } from '@libra/better-auth-cloudflare/client'

export const authClient = createAuthClient({
  baseURL: 'https://your-worker.your-subdomain.workers.dev',
  plugins: [cloudflareClient()],
})

// Usage in components
const { data: session } = authClient.useSession()
const geolocation = session?.geolocation
const realIp = session?.ipAddress
```

## Implementation Details

### Database Adapter

The plugin automatically configures D1 database adapter:

```typescript
// Internal implementation
function createD1Adapter(db: D1Database) {
  return {
    async create(table: string, data: any) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map(() => '?').join(', ')

      const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
      return await db.prepare(query).bind(...values).run()
    },

    async findUnique(table: string, where: any) {
      const key = Object.keys(where)[0]
      const value = where[key]

      const query = `SELECT * FROM ${table} WHERE ${key} = ? LIMIT 1`
      const result = await db.prepare(query).bind(value).first()
      return result
    },

    async update(table: string, where: any, data: any) {
      const whereKey = Object.keys(where)[0]
      const whereValue = where[whereKey]
      const updateKeys = Object.keys(data)
      const updateValues = Object.values(data)

      const setClause = updateKeys.map(key => `${key} = ?`).join(', ')
      const query = `UPDATE ${table} SET ${setClause} WHERE ${whereKey} = ?`

      return await db.prepare(query).bind(...updateValues, whereValue).run()
    },

    async delete(table: string, where: any) {
      const key = Object.keys(where)[0]
      const value = where[key]

      const query = `DELETE FROM ${table} WHERE ${key} = ?`
      return await db.prepare(query).bind(value).run()
    },
  }
}
```

### Geolocation Extraction

```typescript
// Internal geolocation handling
function extractGeolocation(request: Request): CloudflareGeolocation | null {
  const headers = request.headers

  return {
    country: headers.get('CF-IPCountry') || undefined,
    region: headers.get('CF-Region') || undefined,
    latitude: headers.get('CF-IPLatitude') || undefined,
    longitude: headers.get('CF-IPLongitude') || undefined,
    postalCode: headers.get('CF-IPPostalCode') || undefined,
    metroCode: headers.get('CF-IPMetroCode') || undefined,
  }
}
```

### IP Address Detection

```typescript
// Real IP detection logic
function getRealIpAddress(request: Request): string | null {
  const headers = request.headers

  // Priority order for IP detection
  const ipHeaders = [
    'CF-Connecting-IP',      // Cloudflare real IP
    'X-Forwarded-For',       // Standard proxy header
    'X-Real-IP',             // Nginx proxy header
    'X-Client-IP',           // Alternative header
  ]

  for (const header of ipHeaders) {
    const ip = headers.get(header)
    if (ip) {
      // Handle comma-separated IPs (take first one)
      return ip.split(',')[0].trim()
    }
  }

  return null
}
```

## Advanced Usage

### Custom Session Enhancement

```typescript
// Enhance session with Cloudflare data
import { withCloudflare, cloudflare } from '@libra/better-auth-cloudflare'

const auth = betterAuth(
  withCloudflare(
    {
      autoDetectIpAddress: true,
      geolocationTracking: true,
      d1: { db: env.DATABASE },
      kv: env.KV,
    },
    {
      database: env.DATABASE,
      secret: env.BETTER_AUTH_SECRET,

      // Session hooks to add Cloudflare data
      databaseHooks: {
        session: {
          create: {
            before: async (session, request) => {
              const geolocation = extractGeolocation(request)
              const ipAddress = getRealIpAddress(request)

              return {
                data: {
                  ...session,
                  geolocation,
                  ipAddress,
                  cfRay: request.headers.get('CF-Ray'),
                },
              }
            },
          },
        },
      },

      plugins: [
        cloudflare({
          enableGeolocation: true,
          enableIpTracking: true,
        }),
      ],
    }
  )
)
```

### Multi-Environment Configuration

```typescript
// Different configurations for different environments
function createAuthConfig(env: Env, isDevelopment: boolean) {
  const baseConfig = {
    database: env.DATABASE,
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      github: {
        clientId: env.BETTER_GITHUB_CLIENT_ID,
        clientSecret: env.BETTER_GITHUB_CLIENT_SECRET,
      },
    },
  }

  if (isDevelopment) {
    // Development configuration
    return betterAuth(
      withCloudflare(
        {
          autoDetectIpAddress: false,
          geolocationTracking: false,
          d1: { db: env.DATABASE },
        },
        {
          ...baseConfig,
          plugins: [
            cloudflare({
              enableGeolocation: false,
              enableIpTracking: false,
            }),
          ],
        }
      )
    )
  }

  // Production configuration
  return betterAuth(
    withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        d1: { db: env.DATABASE },
        kv: env.KV,
      },
      {
        ...baseConfig,
        plugins: [
          cloudflare({
            enableGeolocation: true,
            enableIpTracking: true,
            customHeaders: ['CF-Ray', 'CF-Worker'],
          }),
        ],
      }
    )
  )
}
```

### Error Handling and Logging

```typescript
// Enhanced error handling
import { log } from '@libra/common'

export async function safeInitAuth(c: any) {
  try {
    const auth = await initAuth(c)

    log.auth('info', 'Auth initialized successfully', {
      environment: c.env.ENVIRONMENT || 'unknown',
      hasKV: !!c.env.KV,
      hasDatabase: !!c.env.DATABASE,
    })

    return auth
  } catch (error) {
    log.auth('error', 'Auth initialization failed', {
      environment: c.env.ENVIRONMENT || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    throw new Error('Failed to initialize authentication')
  }
}

// Middleware for auth error handling
export function authErrorHandler() {
  return async (c: any, next: any) => {
    try {
      await next()
    } catch (error) {
      if (error instanceof AuthError) {
        log.auth('warn', 'Authentication error', {
          path: c.req.path,
          method: c.req.method,
          error: error.message,
        })

        return c.json({ error: 'Authentication failed' }, 401)
      }

      log.auth('error', 'Unexpected auth error', {
        path: c.req.path,
        method: c.req.method,
      }, error as Error)

      return c.json({ error: 'Internal server error' }, 500)
    }
  }
}
```

## Testing

### Unit Tests

```typescript
// tests/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { withCloudflare, createKVStorage } from '@libra/better-auth-cloudflare'

describe('Cloudflare Auth Integration', () => {
  let mockEnv: Env

  beforeEach(() => {
    mockEnv = {
      DATABASE: {} as D1Database,
      KV: {} as KVNamespace,
      BETTER_AUTH_SECRET: 'test-secret',
      BETTER_GITHUB_CLIENT_ID: 'test-client-id',
      BETTER_GITHUB_CLIENT_SECRET: 'test-client-secret',
    }
  })

  it('should create auth configuration with Cloudflare support', () => {
    const config = withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        d1: { db: mockEnv.DATABASE },
        kv: mockEnv.KV,
      },
      {
        database: mockEnv.DATABASE,
        secret: mockEnv.BETTER_AUTH_SECRET,
      }
    )

    expect(config.database).toBeDefined()
    expect(config.secondaryStorage).toBeDefined()
  })

  it('should create KV storage adapter', () => {
    const kvStorage = createKVStorage({
      kv: mockEnv.KV,
      prefix: 'test:',
      ttl: 3600,
    })

    expect(kvStorage).toBeDefined()
    expect(typeof kvStorage.get).toBe('function')
    expect(typeof kvStorage.set).toBe('function')
    expect(typeof kvStorage.delete).toBe('function')
  })
})
```

### Integration Tests

```typescript
// tests/integration.test.ts
import { describe, it, expect } from 'vitest'
import { testClient } from 'hono/testing'
import { createApp } from '../src/worker'

describe('Auth Integration Tests', () => {
  it('should handle auth routes', async () => {
    const app = createApp()
    const client = testClient(app)

    // Test session endpoint
    const sessionResponse = await client.api.auth.session.$get()
    expect(sessionResponse.status).toBe(200)

    // Test sign-in endpoint
    const signInResponse = await client.api.auth['sign-in'].$post({
      json: {
        email: 'test@example.com',
        password: 'password123',
      },
    })
    expect(signInResponse.status).toBe(200)
  })

  it('should extract geolocation from headers', async () => {
    const app = createApp()
    const client = testClient(app)

    const response = await client.api.auth.session.$get(undefined, {
      headers: {
        'CF-IPCountry': 'US',
        'CF-Region': 'California',
        'CF-Connecting-IP': '192.168.1.1',
      },
    })

    expect(response.status).toBe(200)
    // Additional assertions for geolocation data
  })
})
```

## Best Practices

### 1. Environment Configuration

```typescript
// Use environment-specific configurations
const isDevelopment = env.ENVIRONMENT === 'development'
const isProduction = env.ENVIRONMENT === 'production'

const authConfig = withCloudflare(
  {
    autoDetectIpAddress: isProduction,
    geolocationTracking: isProduction,
    d1: { db: env.DATABASE },
    kv: isProduction ? env.KV : undefined,
  },
  {
    database: env.DATABASE,
    secret: env.BETTER_AUTH_SECRET,
    // ... other options
  }
)
```

### 2. Error Handling

```typescript
// Use unified error handling
import { tryCatch } from '@libra/common'

export async function safeInitAuth(c: any) {
  const [auth, error] = await tryCatch(async () => {
    return await initAuth(c)
  })

  if (error) {
    log.auth('error', 'Auth initialization failed', {}, error)
    throw new Error('Failed to initialize authentication')
  }

  return auth
}
```

### 3. Type Safety

```typescript
// Enhance type safety
export function withCloudflare<T extends BetterAuthOptions>(
  cloudflareOptions: WithCloudflareOptions,
  options: T
): T & { database?: any; secondaryStorage?: any } {
  // Implementation logic...
}

// Type guard functions
function isValidGeolocation(data: unknown): data is CloudflareGeolocation {
  return (
    typeof data === 'object' &&
    data !== null &&
    'country' in data &&
    'region' in data
  )
}
```
