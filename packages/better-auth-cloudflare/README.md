# @libra/better-auth-cloudflare

> Cloudflare edge integration plugin for Better Auth with geolocation tracking and D1/KV support

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A specialized Better Auth integration plugin designed for the Cloudflare ecosystem, leveraging edge computing capabilities and global network infrastructure for ultra-low latency authentication with built-in geolocation tracking.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Geolocation Features](#-geolocation-features)
- [Database Integration](#-database-integration)
- [KV Storage](#-kv-storage)
- [Deployment](#-deployment)
- [Privacy & Security](#-privacy--security)
- [Performance](#-performance)
- [Troubleshooting](#-troubleshooting)
- [Advanced Usage](#-advanced-usage)
- [Contributing](#-contributing)

## 🚀 Features

- **🌍 Geolocation Tracking** - Automatic user location detection (country, region)
- **🔍 Real IP Detection** - Accurate IP identification using Cloudflare headers (`cf-connecting-ip`, `x-real-ip`)
- **🗄️ D1 Database Integration** - Seamless Cloudflare D1 SQLite database support with Drizzle ORM
- **⚡ KV Storage** - High-performance edge caching with Cloudflare KV
- **🚀 Edge-Optimized** - Purpose-built for Cloudflare Workers runtime
- **🔧 Simple Setup** - `withCloudflare` helper for streamlined configuration
- **🛡️ Privacy-First** - Configurable geolocation tracking with privacy controls
- **📊 Session Enhancement** - Automatic session enrichment with location data

## 📦 Installation

> **Note**: This is an internal package within the Libra monorepo and is not published to npm.

### Within Libra Project

```bash
# Install dependencies in the monorepo root
bun install

# The package is automatically available as a workspace dependency
# Add to your package.json dependencies:
"@libra/better-auth-cloudflare": "*"
```

### External Projects

If you want to use this package outside the Libra monorepo, you'll need to install the required dependencies:

```bash
# Core dependencies
bun add better-auth@^1.3.1 @opennextjs/cloudflare@^1.5.1

# Development dependencies
bun add -D @cloudflare/workers-types@^4.20250719.0

# Database dependencies (if using D1)
bun add drizzle-orm@latest
```

### Prerequisites

- **Cloudflare Workers** account and CLI (`wrangler`)
- **Better Auth** v1.3.1 or higher
- **Node.js** 18+ or **Bun** runtime

## 🏃‍♂️ Quick Start

### 1. Cloudflare Setup

Create your `wrangler.toml` configuration:

```toml
# wrangler.toml
name = "my-auth-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
AUTH_SECRET = "your-secret-key"
AUTH_URL = "https://my-auth-app.yourdomain.workers.dev"

# D1 Database (optional)
[[d1_databases]]
binding = "DB"
database_name = "auth-db"
database_id = "your-d1-database-id"

# KV Storage (optional)
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### 2. Database Setup (D1)

```bash
# Create D1 database
wrangler d1 create auth-db

# Apply Better Auth migrations
wrangler d1 migrations apply auth-db --local
```

### 3. Auth Configuration

```typescript
// src/auth.ts
import { betterAuth } from "better-auth"
import { drizzle } from "drizzle-orm/d1"
import { withCloudflare } from "@libra/better-auth-cloudflare"

export const auth = betterAuth(
  withCloudflare(
    {
      // D1 database configuration (optional)
      d1: {
        db: drizzle(env.DB)
      },
      // KV storage configuration (optional)
      kv: env.CACHE,
      // Geolocation tracking (default: true)
      geolocationTracking: true,
      // Auto IP detection (default: true)
      autoDetectIpAddress: true,
    },
    {
      secret: env.AUTH_SECRET,
      baseURL: env.AUTH_URL,
      // Add your auth providers here
      providers: {
        // github: { ... },
        // google: { ... },
      },
    }
  )
)
```

### 4. Workers Entry Point

```typescript
// src/index.ts
import { auth } from "./auth"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return auth.handler(request)
  },
} satisfies ExportedHandler<Env>

export interface Env {
  AUTH_SECRET: string
  AUTH_URL: string
  DB?: D1Database  // Optional if using D1
  CACHE?: KVNamespace  // Optional if using KV
}
```

### 5. Client Integration

```typescript
// src/auth-client.ts
import { createAuthClient } from "better-auth/client"
import { cloudflareClient } from "@libra/better-auth-cloudflare/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL!,
  plugins: [cloudflareClient()],
})

// Export auth methods for convenience
export const { signIn, signOut, useSession } = authClient
```

## 📚 API Reference

### `withCloudflare(cloudflareOptions, authOptions)`

Enhances Better Auth configuration with Cloudflare-specific features.

**Parameters:**

- `cloudflareOptions: WithCloudflareOptions` - Cloudflare-specific configuration
- `authOptions: BetterAuthOptions` - Standard Better Auth configuration

**Returns:** `BetterAuthOptions` - Enhanced configuration for Cloudflare

### `cloudflare(options?)`

Creates the Cloudflare plugin for Better Auth.

**Parameters:**

- `options?: CloudflarePluginOptions` - Plugin configuration

**Returns:** `BetterAuthPlugin` - Cloudflare plugin instance

### `createKVStorage(kv)`

Creates a secondary storage adapter using Cloudflare KV.

**Parameters:**

- `kv: KVNamespace` - Cloudflare KV namespace

**Returns:** `SecondaryStorage` - KV storage adapter

### `getGeolocation()`

Retrieves geolocation data from Cloudflare context.

**Returns:** `CloudflareGeolocation | undefined` - Location data or undefined

### Configuration Options

```typescript
interface WithCloudflareOptions {
  // D1 database configuration
  d1?: {
    db: ReturnType<typeof drizzle>
    options?: Omit<DrizzleAdapterConfig, "provider">
  }

  // KV storage configuration
  kv?: KVNamespace

  // Auto-detect IP address (default: true)
  autoDetectIpAddress?: boolean

  // Track geolocation in sessions (default: true)
  geolocationTracking?: boolean
}
```

## 🌍 Geolocation Features

### Automatic Session Enhancement

When geolocation tracking is enabled, sessions automatically include location data:

```typescript
import type { SessionWithGeolocation } from "@libra/better-auth-cloudflare"

interface SessionWithGeolocation extends Session {
  country?: string    // "US", "CN", "GB"
  region?: string     // "California", "Beijing", "London"
}
```

### Access User Location

```typescript
// Get current user's geolocation via API endpoint
const getUserLocation = async () => {
  const response = await fetch('/api/auth/cloudflare/geolocation')
  if (!response.ok) {
    throw new Error('Failed to get location')
  }
  const location = await response.json()
  return location // { country: "US", region: "CA" }
}

// Use in your application
try {
  const location = await getUserLocation()
  console.log(`User is in ${location.country}, ${location.region}`)
} catch (error) {
  console.error('Location unavailable:', error)
}
```

### Server-side Location Access

```typescript
// In your Cloudflare Worker
import { getGeolocation } from "@libra/better-auth-cloudflare"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const location = getGeolocation()
      console.log('User location:', location)
    } catch (error) {
      console.log('Location not available')
    }

    return auth.handler(request)
  }
}
```

### Practical Applications

```typescript
// Location-based content adaptation
const getLocalizedContent = (country?: string) => {
  // Return localized content based on country
  return country ? `Content for ${country}` : 'Default content'
}

// Localized content based on country
const getLocalizedContent = (country?: string) => {
  const localization = {
    'US': { currency: 'USD', language: 'en-US', flag: '🇺🇸' },
    'CN': { currency: 'CNY', language: 'zh-CN', flag: '🇨🇳' },
    'JP': { currency: 'JPY', language: 'ja-JP', flag: '🇯🇵' },
    'GB': { currency: 'GBP', language: 'en-GB', flag: '🇬🇧' },
    'DE': { currency: 'EUR', language: 'de-DE', flag: '🇩🇪' },
  }
  return localization[country as keyof typeof localization] || localization['US']
}

// Security monitoring for suspicious logins
const detectSuspiciousLogin = (
  current: SessionWithGeolocation,
  previous: SessionWithGeolocation[]
) => {
  if (!current.country || previous.length === 0) return false

  const lastSession = previous[0]
  if (lastSession?.country && current.country !== lastSession.country) {
    console.warn(`Suspicious login detected: ${lastSession.country} → ${current.country}`)
    return true
  }
  return false
}

// Usage example in your application
const handleUserSession = async (session: SessionWithGeolocation) => {
  // Get localized content
  const locale = getLocalizedContent(session.country)

  // Check for suspicious activity
  const previousSessions = await getPreviousSessions(session.userId)
  const isSuspicious = detectSuspiciousLogin(session, previousSessions)

  if (isSuspicious) {
    // Trigger security alert
    await sendSecurityAlert(session.userId, session.country)
  }

  return {
    locale,
    isSuspicious,
  }
}
```

## 🗄️ Database Integration

### D1 Database Setup

```bash
# Create D1 database
wrangler d1 create auth-db

# Get database ID and update wrangler.toml
# Copy the database_id from the output

# Apply Better Auth migrations (local development)
wrangler d1 migrations apply auth-db --local

# Apply migrations to production
wrangler d1 migrations apply auth-db

# Query database for testing
wrangler d1 execute auth-db --command="SELECT * FROM session LIMIT 5"
```

### Database Configuration

```typescript
// src/db.ts
import { drizzle } from "drizzle-orm/d1"
import { withCloudflare } from "@libra/better-auth-cloudflare"

// Configure with D1
export const auth = betterAuth(
  withCloudflare(
    {
      d1: {
        db: drizzle(env.DB),
        // Optional: custom table prefix
        options: {
          schema: {
            // Custom table names if needed
            user: "custom_users",
            session: "custom_sessions",
          }
        }
      }
    },
    {
      secret: env.AUTH_SECRET,
      baseURL: env.AUTH_URL,
    }
  )
)
```

### Custom Schema Extensions

The plugin automatically extends the session table with geolocation fields. You can also create custom tables:

```typescript
// src/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

// Extended user table with location preferences
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  preferredCountry: text("preferred_country"),
  registrationCountry: text("registration_country"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Location history tracking table
export const locationHistory = sqliteTable("location_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  country: text("country").notNull(),
  region: text("region"),
  ipAddress: text("ip_address"), // Anonymized IP
  loginAt: integer("login_at", { mode: "timestamp" }).notNull(),
})

// Usage in your application
export const db = drizzle(env.DB, { schema: { user, locationHistory } })
```

## ⚡ KV Storage

### Setup KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"

# For preview (development)
wrangler kv:namespace create "CACHE" --preview

# Add to wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### KV Storage Configuration

```typescript
// Configure with KV storage
export const auth = betterAuth(
  withCloudflare(
    {
      kv: env.CACHE, // KV namespace for secondary storage
    },
    {
      secret: env.AUTH_SECRET,
      baseURL: env.AUTH_URL,
    }
  )
)
```

### Using KV Storage Directly

```typescript
import { createKVStorage } from "@libra/better-auth-cloudflare"

// Create KV storage adapter
const kvStorage = createKVStorage(env.CACHE)

// Cache user preferences
await kvStorage.set(
  `user:${userId}:preferences`,
  JSON.stringify(preferences),
  3600 // 1 hour TTL in seconds
)

// Get cached data
const cachedPreferences = await kvStorage.get(`user:${userId}:preferences`)
const preferences = cachedPreferences ? JSON.parse(cachedPreferences) : null

// Delete cached data
await kvStorage.delete(`user:${userId}:preferences`)
```

### Rate Limiting with KV

```typescript
const checkRateLimit = async (ip: string, kv: KVNamespace) => {
  const key = `rate_limit:${ip}`
  const current = await kv.get(key)

  if (!current) {
    // First request
    await kv.put(key, "1", { expirationTtl: 60 }) // 1 minute window
    return { allowed: true, remaining: 4 }
  }

  const count = parseInt(current, 10)
  const limit = 5 // 5 requests per minute

  if (count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  // Increment counter
  await kv.put(key, (count + 1).toString(), { expirationTtl: 60 })
  return { allowed: true, remaining: limit - count - 1 }
}

// Usage in your Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const rateLimit = await checkRateLimit(ip, env.CACHE)

    if (!rateLimit.allowed) {
      return new Response('Rate limit exceeded', { status: 429 })
    }

    return auth.handler(request)
  }
}
```

### Session Caching Patterns

```typescript
// Cache session data for faster access
const cacheSession = async (sessionId: string, sessionData: any, kv: KVNamespace) => {
  const key = `session:${sessionId}`
  await kv.put(key, JSON.stringify(sessionData), {
    expirationTtl: 3600 // 1 hour
  })
}

// Retrieve cached session
const getCachedSession = async (sessionId: string, kv: KVNamespace) => {
  const key = `session:${sessionId}`
  const cached = await kv.get(key)
  return cached ? JSON.parse(cached) : null
}
```

## 🚀 Deployment

### Development Environment

```bash
# Install Wrangler CLI globally
npm install -g wrangler
# or with bun
bun add -g wrangler

# Login to Cloudflare
wrangler login

# Start local development server
wrangler dev

# Test auth endpoints
curl http://localhost:8787/api/auth/session
curl http://localhost:8787/api/auth/cloudflare/geolocation
```

### Production Deployment

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Set environment secrets
wrangler secret put AUTH_SECRET
# Enter your secret when prompted

# Set additional secrets if needed
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# Monitor deployment logs
wrangler tail

# Check deployment status
wrangler deployments list
```

### Environment Variables

```bash
# Set environment variables in wrangler.toml
[vars]
AUTH_URL = "https://your-worker.your-subdomain.workers.dev"
NODE_ENV = "production"

# Or set via CLI
wrangler secret put AUTH_SECRET
wrangler secret put DATABASE_URL  # if using external DB
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cloudflare context is not available"

**Problem:** The geolocation endpoint returns a 404 error.

**Solution:**

```typescript
// Ensure you're running in Cloudflare Workers environment
// Check that @opennextjs/cloudflare is properly configured

// In development, mock the Cloudflare context
if (process.env.NODE_ENV === 'development') {
  // Mock CF object for local development
  globalThis.cf = {
    country: 'US',
    region: 'California'
  }
}
```

#### 2. Database Connection Issues

**Problem:** D1 database queries fail or timeout.

**Solution:**

```bash
# Check D1 database status
wrangler d1 info auth-db

# Verify database binding in wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "auth-db"
database_id = "your-actual-database-id"

# Test database connection
wrangler d1 execute auth-db --command="SELECT 1"
```

#### 3. KV Storage Access Denied

**Problem:** KV operations fail with permission errors.

**Solution:**

```bash
# Check KV namespace configuration
wrangler kv:namespace list

# Verify KV binding in wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-actual-kv-id"

# Test KV access
wrangler kv:key put --binding=CACHE "test" "value"
```

#### 4. Session Not Persisting

**Problem:** User sessions don't persist across requests.

**Solution:**

```typescript
// Ensure session storage is properly configured
export const auth = betterAuth(
  withCloudflare(
    {
      d1: { db: drizzle(env.DB) }, // Required for session persistence
      geolocationTracking: true,   // This enables session storage
    },
    {
      secret: env.AUTH_SECRET,
      baseURL: env.AUTH_URL,
      session: {
        storeSessionInDatabase: true, // Explicitly enable
      }
    }
  )
)
```

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// Add debug logging
export const auth = betterAuth(
  withCloudflare(
    { /* your config */ },
    {
      secret: env.AUTH_SECRET,
      baseURL: env.AUTH_URL,
      logger: {
        level: "debug",
        disabled: false,
      }
    }
  )
)
```

## 🔒 Privacy & Security

### GDPR Compliance

Configure the plugin with privacy-first defaults:

```typescript
// Disable tracking by default (privacy-first approach)
export const auth = betterAuth(
  withCloudflare({
    geolocationTracking: false, // Require explicit consent
    autoDetectIpAddress: false, // Disable IP detection
  }, {
    secret: env.AUTH_SECRET,
    baseURL: env.AUTH_URL,
  })
)
```

### Consent Management

Implement user consent for geolocation tracking:

```typescript
// User consent management
interface UserConsent {
  userId: string
  geolocationConsent: boolean
  ipTrackingConsent: boolean
  consentDate: Date
}

// Store consent in database
const updateUserConsent = async (consent: UserConsent) => {
  await db.insert(userConsent).values(consent)
}

// Check consent before tracking
const hasGeolocationConsent = async (userId: string): Promise<boolean> => {
  const consent = await db.select()
    .from(userConsent)
    .where(eq(userConsent.userId, userId))
    .limit(1)

  return consent[0]?.geolocationConsent ?? false
}
```

### IP Anonymization

Implement IP anonymization for privacy compliance:

```typescript
// Anonymize IP addresses
const anonymizeIP = (ip: string): string => {
  if (!ip || ip === 'unknown') return 'anonymous'

  if (ip.includes(":")) {
    // IPv6 - keep first 64 bits (4 groups)
    const groups = ip.split(":")
    return groups.slice(0, 4).join(":") + "::"
  } else {
    // IPv4 - keep first 3 octets
    const octets = ip.split(".")
    return octets.slice(0, 3).join(".") + ".0"
  }
}

// Use in your application
const logSecurityEvent = async (request: Request, event: string) => {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const anonymizedIP = anonymizeIP(ip)

  await db.insert(securityLog).values({
    event,
    anonymizedIP,
    timestamp: new Date(),
    userAgent: request.headers.get('user-agent'),
  })
}
```

### Data Retention

Implement data retention policies:

```typescript
// Clean up old location data
const cleanupLocationHistory = async (retentionDays: number = 90) => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  await db.delete(locationHistory)
    .where(lt(locationHistory.loginAt, cutoffDate))
}

// Schedule cleanup (in your Worker)
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(cleanupLocationHistory(90)) // 90 days retention
  }
}
```

## 📊 Performance

### Edge Optimization

Leverage Cloudflare's global network for optimal performance:

```typescript
// Cache responses at the edge
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Use Cloudflare's cache API
    const cache = caches.default
    const cacheKey = new Request(request.url, request)

    // Check cache first
    let response = await cache.match(cacheKey)

    if (!response) {
      response = await auth.handler(request)

      // Cache successful responses
      if (response.status === 200) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()))
      }
    }

    return response
  }
}
```

### KV Performance Tips

Optimize KV usage for better performance:

```typescript
// Batch KV operations when possible
const batchKVOperations = async (operations: Array<{key: string, value: string}>, kv: KVNamespace) => {
  const promises = operations.map(op =>
    kv.put(op.key, op.value, { expirationTtl: 3600 })
  )

  await Promise.all(promises)
}

// Use appropriate TTL values
const cacheWithTTL = async (key: string, value: string, kv: KVNamespace) => {
  // Short TTL for frequently changing data
  if (key.includes('session')) {
    await kv.put(key, value, { expirationTtl: 300 }) // 5 minutes
  }
  // Longer TTL for stable data
  else if (key.includes('user-preferences')) {
    await kv.put(key, value, { expirationTtl: 86400 }) // 24 hours
  }
}
```

### Database Performance

Optimize D1 database queries:

```typescript
// Use prepared statements for better performance
const getUserSessions = db.select()
  .from(session)
  .where(eq(session.userId, placeholder('userId')))
  .prepare()

// Batch database operations
const batchInsertSessions = async (sessions: Array<SessionData>) => {
  await db.transaction(async (tx) => {
    for (const session of sessions) {
      await tx.insert(sessionTable).values(session)
    }
  })
}

// Use indexes for frequently queried fields
// Add this to your schema
export const sessionIndex = index('session_user_id_idx').on(session.userId)
export const locationIndex = index('location_country_idx').on(locationHistory.country)
```

## 🏗️ Architecture

### Package Structure

```text
@libra/better-auth-cloudflare/
├── index.ts          # Main plugin & withCloudflare helper
├── client.ts         # Client-side plugin
├── schema.ts         # Database schema extensions
├── types.ts          # TypeScript definitions
├── package.json      # Package configuration
├── tsconfig.json     # TypeScript configuration
├── tsup.config.ts    # Build configuration
├── DEV.md           # English development guide
├── DEV_ZH.md        # Chinese development guide
└── dist/            # Built distribution files
    ├── index.js
    ├── index.d.ts
    ├── client.js
    └── client.d.ts
```

### Component Overview

#### Core Components

- **`withCloudflare()`** - Configuration helper that adapts Better Auth for Cloudflare
- **`cloudflare()`** - Main plugin that adds geolocation and Cloudflare-specific features
- **`createKVStorage()`** - KV storage adapter for Better Auth secondary storage
- **`cloudflareClient()`** - Client-side plugin for Better Auth client

#### Data Flow

```text
Request → Cloudflare Worker → Better Auth → Plugin → Database/KV
   ↓           ↓                  ↓          ↓         ↓
CF Headers → IP Detection → Session Create → Geolocation → Storage
```

### Integration Points

1. **Cloudflare Workers Runtime** - Provides the execution environment
2. **Better Auth Core** - Handles authentication logic
3. **D1 Database** - Primary storage for users and sessions
4. **KV Storage** - Secondary storage for caching and rate limiting
5. **Cloudflare Network** - Provides geolocation and IP data

## 📚 Documentation

- **[Development Guide (中文)](DEV_ZH.md)** - 完整的中文开发指南
- **[Development Guide (English)](./DEV.md)** - Comprehensive English guide
- **[Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)** - Official Cloudflare documentation
- **[Better Auth Docs](https://better-auth.com)** - Official Better Auth documentation

## 🔧 Advanced Features

### Edge Caching

```typescript
// Leverage Cloudflare's edge cache
const cache = caches.default
const cacheKey = new Request(request.url, request)

let response = await cache.match(cacheKey)
if (!response) {
  response = await auth.handler(request)
  ctx.waitUntil(cache.put(cacheKey, response.clone()))
}
```

### Geographic Routing

```typescript
// Route based on user location
const geoRoute = (request: Request) => {
  const country = request.cf?.country
  
  switch (country) {
    case 'CN': return handleChinaUsers(request)
    case 'US': return handleUSUsers(request)
    default: return handleDefaultUsers(request)
  }
}
```

### Health Monitoring

```typescript
// Health check endpoint
const healthCheck = async (env: Env) => {
  const checks = []

  try {
    // Check D1 database
    if (env.DB) {
      await env.DB.prepare("SELECT 1").first()
      checks.push({ service: "D1", status: "healthy" })
    }

    // Check KV storage
    if (env.KV) {
      await env.KV.put("health", "ok", { expirationTtl: 60 })
      checks.push({ service: "KV", status: "healthy" })
    }

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks
    })
  } catch (error) {
    return Response.json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
      checks
    }, { status: 500 })
  }
}
```

## 🧪 Testing

### Local Development

```bash
# Type checking
bun run typecheck

# Build the package
bun run build

# Start local development server
wrangler dev --port 8787

# Test auth endpoints
curl http://localhost:8787/api/auth/session
curl http://localhost:8787/api/auth/cloudflare/geolocation

# Test with authentication
curl -H "Authorization: Bearer <token>" \
  http://localhost:8787/api/auth/cloudflare/geolocation
```

### Production Testing

```bash
# Deploy to staging
wrangler deploy --env staging

# Monitor logs
wrangler tail --env production

# Run health checks
curl https://your-worker.your-subdomain.workers.dev/health
```

### Integration Testing

```typescript
// Example test for geolocation endpoint
const testGeolocation = async () => {
  const response = await fetch('/api/auth/cloudflare/geolocation', {
    headers: {
      'Authorization': 'Bearer ' + sessionToken
    }
  })

  if (response.ok) {
    const location = await response.json()
    console.log('Location:', location)
  } else {
    console.error('Failed to get location:', response.status)
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the Libra repository
git clone https://github.com/libra-ai/libra.git
cd libra

# Install dependencies for the entire monorepo
bun install

# Navigate to the package
cd packages/better-auth-cloudflare

# Type check
bun run typecheck

# Build package
bun run build

# Run tests (if available)
bun test
```

### Contribution Guidelines

1. **Fork the repository** and create a feature branch
2. **Write tests** for new functionality
3. **Follow TypeScript best practices** and maintain type safety
4. **Update documentation** for any API changes
5. **Test thoroughly** in both development and production environments
6. **Submit a pull request** with a clear description of changes

## 📄 License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](../../LICENSE) file for details.

## 🆘 Support

### Documentation

- 📖 [Development Guide (English)](./DEV.md) - Comprehensive development documentation
- 📖 [Development Guide (中文)](./DEV_ZH.md) - 完整的中文开发指南
- 📚 [Better Auth Documentation](https://better-auth.com) - Official Better Auth docs
- 🌐 [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/) - Official Cloudflare docs

### Community & Support

- 🐛 [Report Issues](https://github.com/libra-ai/libra/issues) - Bug reports and feature requests
- 💬 [Discussions](https://github.com/libra-ai/libra/discussions) - Community discussions and Q&A
- 🌐 [Cloudflare Community](https://community.cloudflare.com/) - Cloudflare-specific help
- 📧 [Contact Us](mailto:support@zepid.dev) - Direct support for enterprise users

### Quick Links

- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Cloudflare Workers Examples](https://github.com/cloudflare/workers-examples)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 🙏 Credits

This package is based on the original work from [better-auth-cloudflare](https://github.com/zpg6/better-auth-cloudflare/) with significant enhancements and adaptations for the Libra ecosystem.

Special thanks to:

- The Better Auth team for creating an excellent authentication library
- The Cloudflare team for their edge computing platform
- The open-source community for continuous improvements and feedback

---

Built with ❤️ for the edge by the [Libra AI](https://github.com/libra-ai) team.