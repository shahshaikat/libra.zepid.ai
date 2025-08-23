# @libra/auth Development Documentation

A comprehensive authentication and authorization solution built on the better-auth framework, optimized for Cloudflare Workers environment with integrated Stripe payment processing.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Environment Configuration](#environment-configuration)
- [Testing](#testing)
- [Configuration Options](#configuration-options)
- [TypeScript Type Definitions](#typescript-type-definitions)
- [Plugins](#plugins)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

`@libra/auth` is the core authentication package of the Zepid project, providing complete user authentication, authorization, and subscription management functionality.

### Core Features

- **🔐 Authentication & Authorization**: Complete user authentication system with multiple login methods and OAuth third-party login
- **💳 Stripe Integration**: Complete subscription lifecycle management and payment processing
- **☁️ Cloudflare Optimization**: Built specifically for Cloudflare Workers environment
- **🗄️ Database Management**: Using Drizzle ORM and D1 database support
- **📧 Email System**: Automated email notification system
- **🔒 Security Protection**: Session management, CSRF protection, and OAuth nonce verification
- **🏢 Organization Management**: Multi-tenant organization and team management
- **🪝 Webhook Processing**: Complete third-party service integration webhook processing

### Technology Stack

- **Framework**: better-auth (based on latest stable version)
- **Database**: Drizzle ORM + Cloudflare D1
- **Payment**: Stripe API
- **Email**: Resend + React Email templates
- **Runtime**: Cloudflare Workers
- **Type Safety**: TypeScript 5+

### Version Compatibility

| Component | Supported Version | Description |
|-----------|-------------------|-------------|
| better-auth | Latest stable | Core authentication framework |
| Drizzle ORM | Latest version | Database ORM |
| TypeScript | 5.0+ | Type safety support |
| Bun | 1.0+ | Recommended runtime |
| Node.js | 18+ | Alternative runtime |
| Cloudflare Workers | Latest runtime | Production environment |

## Project Structure

### Directory Structure

```
packages/auth/
├── auth-client.ts              # Client configuration
├── auth-server.ts              # Server configuration
├── db/                         # Database module
│   ├── index.ts               # Database connection
│   ├── schema.ts              # Database schema definition
│   ├── schema/                # Database schema files
│   └── migrations/            # Database migration files
├── plugins/                    # Plugin modules
│   ├── captcha-plugin.ts      # Captcha plugin
│   ├── email-otp-plugin.ts    # Email OTP plugin
│   ├── organization-plugin.ts # Organization management plugin
│   ├── stripe-plugin.ts       # Stripe plugin
│   └── stripe/                # Stripe plugin submodules
├── utils/                      # Utility functions
│   ├── admin-utils.ts         # Admin utilities
│   ├── email-service.ts       # Email service
│   ├── email.ts               # Email utilities
│   ├── nonce.ts               # OAuth nonce verification
│   ├── organization-utils.ts  # Organization utilities
│   ├── stripe-config.ts       # Stripe configuration
│   ├── subscription-limits.ts # Subscription limits (main entry)
│   ├── subscription-limits/   # Subscription limits submodules
│   ├── subscription-utils.ts  # Subscription utilities
│   └── __tests__/             # Utility function tests
├── webhooks/                   # Webhook processing
│   ├── stripe-handler.ts      # Stripe webhook processing
│   ├── handlers/              # Other webhook handlers
│   ├── shared/                # Shared webhook utilities
│   └── utils/                 # Webhook utility functions
├── env.mjs                     # Environment variable configuration
├── plugins.ts                  # Plugin configuration
├── vitest.config.ts           # Test configuration
├── wrangler.jsonc             # Cloudflare Workers configuration
└── package.json               # Package configuration file
```

### Core Structure

#### 1. Server Configuration (`auth-server.ts`)

```typescript
import { withCloudflare } from '@libra/better-auth-cloudflare'
import { betterAuth } from 'better-auth'
import { plugins } from './plugins'

async function authBuilder() {
  const dbInstance = await getAuthDb()
  const { env } = await getCloudflareContext({ async: true })

  return betterAuth(
    withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        d1: { db: dbInstance },
        kv: env.KV,
      },
      {
        plugins: plugins,
        socialProviders: {
          github: {
            clientId: process.env.BETTER_GITHUB_CLIENT_ID,
            clientSecret: process.env.BETTER_GITHUB_CLIENT_SECRET,
          },
        },
        databaseHooks: {
          session: {
            create: {
              before: async (session: Session) => {
                const organization = await getActiveOrganization(session.userId)
                return {
                  data: {
                    ...session,
                    activeOrganizationId: organization.id,
                  },
                }
              },
            },
          },
        },
      }
    )
  )
}
```

#### 2. Client Configuration (`auth-client.ts`)

```typescript
import { createAuthClient } from 'better-auth/client'
import { organizationClient } from 'better-auth/client/plugins'
import { stripeClient } from '@libra/better-auth-stripe/client'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000',
  plugins: [
    organizationClient(),
    stripeClient(),
  ],
})

// Export common client APIs
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient
```

## API Reference

### Server API

#### `initAuth()`

Initialize authentication instance

```typescript
import { initAuth } from '@libra/auth'

const auth = await initAuth()
export default auth.handler
```

#### `getAuthDb()`

Get database connection

```typescript
import { getAuthDb } from '@libra/auth/db'

const db = await getAuthDb()
```

### Client API

#### Authentication

```typescript
import { signIn, signOut, signUp } from '@libra/auth/auth-client'

// Email login
await signIn.email({
  email: 'user@example.com',
  password: 'password123'
})

// GitHub OAuth login
await signIn.social({
  provider: 'github',
  callbackURL: '/dashboard'
})

// Sign out
await signOut()

// Sign up
await signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'User Name'
})
```

#### Session Management

```typescript
import { useSession } from '@libra/auth/auth-client'

function MyComponent() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>
  if (!session) return <div>Please sign in</div>

  return <div>Welcome, {session.user.name}!</div>
}
```

### Organization API

#### Organization Management

```typescript
import { authClient } from '@libra/auth/auth-client'
import { getActiveOrganization } from '@libra/auth/utils/organization-utils'

// Create organization (using client API)
const { data: org, error } = await authClient.organization.create({
  name: 'My Company',
  slug: 'my-company'
})

// Get current active organization (server utility function)
const activeOrg = await getActiveOrganization(userId)

// Switch organization (using client API)
await authClient.organization.setActive({
  organizationId: organizationId
})

// Or switch using slug
await authClient.organization.setActive({
  organizationSlug: 'my-company'
})
```

### Stripe API

#### Subscription Management

```typescript
import {
  getSubscriptionUsage,
  checkAndUpdateAIMessageUsage,
  checkAndUpdateEnhanceUsage
} from '@libra/auth/utils/subscription-limits'

// Get subscription usage
const usage = await getSubscriptionUsage(organizationId)
console.log(`AI Messages: ${usage.aiNums}/${usage.aiNumsLimit}`)

// Check AI message usage limits
const canUse = await checkAndUpdateAIMessageUsage(organizationId, 1)
if (!canUse) {
  throw new Error('AI message limit exceeded')
}
```

#### Payment Processing

```typescript
import { createCheckoutSession } from '@libra/auth/utils/stripe-config'

// Create payment session
const session = await createCheckoutSession({
  organizationId,
  priceId: 'price_1234567890',
  successUrl: '/success',
  cancelUrl: '/cancel'
})

// Redirect to payment page
window.location.href = session.url
```

## Environment Configuration

### Environment Variables

```env
# Required - GitHub OAuth
BETTER_GITHUB_CLIENT_ID=your_github_client_id
BETTER_GITHUB_CLIENT_SECRET=your_github_client_secret

# Optional - Stripe Payment (required for subscription features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Required - Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
DATABASE_ID=your_d1_database_id
CLOUDFLARE_API_TOKEN=your_api_token

# Required - Security
TURNSTILE_SECRET_KEY=your_turnstile_secret

# Optional - Admin
ADMIN_USER_IDS=user1,user2,user3
```

### Cloudflare Workers Configuration

#### wrangler.toml

```toml
name = "libra-auth"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
AUTH_SECRET = "your-secret-key"
AUTH_URL = "https://your-app.workers.dev"

# D1 Database
[[d1_databases]]
binding = "DATABASE"
database_name = "libra-auth"
database_id = "your-database-id"

# KV Storage
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

# R2 Storage (optional)
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "libra-uploads"
```

### Database Migration

```bash
# Generate database migration
bun run db:generate

# Execute migration
bun run db:migrate

# View database
bun run db:studio
```

## Testing

### Authentication Testing

```typescript
import { describe, it, expect } from 'vitest'
import { authClient } from '../auth-client'

describe('Authentication', () => {
  it('should sign in with email', async () => {
    const result = await authClient.signIn.email({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result.data?.session).toBeDefined()
    expect(result.data?.user.email).toBe('test@example.com')
  })

  it('should handle invalid credentials', async () => {
    const result = await authClient.signIn.email({
      email: 'test@example.com',
      password: 'wrongpassword'
    })

    expect(result.error).toBeDefined()
  })
})
```

### Organization Management Testing

```typescript
import { describe, it, expect } from 'vitest'
import { authClient } from '@libra/auth/auth-client'
import { getActiveOrganization } from '@libra/auth/utils/organization-utils'

describe('Organization Management', () => {
  it('should create organization', async () => {
    const { data: org, error } = await authClient.organization.create({
      name: 'Test Org',
      slug: 'test-org'
    })

    expect(error).toBeNull()
    expect(org?.name).toBe('Test Org')
    expect(org?.slug).toBe('test-org')
  })

  it('should get active organization', async () => {
    const org = await getActiveOrganization('user-id')
    expect(org).toBeDefined()
    expect(org.id).toBeDefined()
  })
})
```

### Stripe Integration Testing

```typescript
import { describe, it, expect } from 'vitest'
import { getSubscriptionUsage, checkAndUpdateAIMessageUsage } from '../utils/subscription-limits'

describe('Subscription Management', () => {
  it('should get subscription usage', async () => {
    const usage = await getSubscriptionUsage('org-id')

    expect(usage.aiNums).toBeGreaterThanOrEqual(0)
    expect(usage.aiNumsLimit).toBeGreaterThan(0)
  })

  it('should check AI message usage', async () => {
    const canUse = await checkAndUpdateAIMessageUsage('org-id', 1)
    expect(typeof canUse).toBe('boolean')
  })
})
```

## Configuration Options

### Plugin Configuration

```typescript
// plugins.ts
export const plugins = [
  admin({
    defaultRole: 'user',
    adminRoles: ["admin", "superadmin"],
    adminUserIds: getAdminUserIds(),
  }),
  captchaPlugin,
  emailOTPPlugin,
  ...stripePlugin,
  organizationPlugin,
  emailHarmony(),
  bearer(),
]
```

### Database Hooks

```typescript
databaseHooks: {
  session: {
    create: {
      before: async (session: Session) => {
        // Automatically associate organization
        const organization = await getActiveOrganization(session.userId)
        return {
          data: {
            ...session,
            activeOrganizationId: organization.id,
          },
        }
      },
    },
  },
  user: {
    create: {
      after: async (user) => {
        // Send welcome email
        await sendWelcomeEmail(user.email, user.name)
      },
    },
  },
}
```

## TypeScript Type Definitions

### Session Type Extensions

```typescript
declare module "better-auth" {
  interface Session {
    activeOrganizationId?: string
    country?: string
    region?: string
  }

  interface User {
    role?: string
    organizationId?: string
  }
}
```

### Custom Types

```typescript
export interface SubscriptionUsage {
  aiNums: number
  aiNumsLimit: number
  projectNums: number
  projectNumsLimit: number
  seats: number
  seatsLimit: number
  plan: string
}

export interface OrganizationData {
  id: string
  name: string
  slug: string
  stripeCustomerId?: string
  subscriptionId?: string
}
```

## Plugins

### Custom Plugin Development

```typescript
// plugins/custom-plugin.ts
import { createAuthPlugin } from 'better-auth'

export const customPlugin = createAuthPlugin({
  id: 'custom',
  endpoints: {
    customEndpoint: createAuthEndpoint(
      '/custom/action',
      { method: 'POST' },
      async (ctx) => {
        // Custom logic
        return ctx.json({ success: true })
      }
    ),
  },
  hooks: {
    after: [
      {
        matcher: (context) => context.path === '/sign-in/email',
        handler: async (ctx) => {
          // Post-login processing
          console.log('User signed in:', ctx.session?.userId)
        },
      },
    ],
  },
})
```

### Plugin Integration

```typescript
// Integrate in auth-server.ts
import { customPlugin } from './plugins/custom-plugin'

const authConfig = {
  plugins: [
    ...plugins,
    customPlugin,
  ],
}
```

## Best Practices

### Error Handling

```typescript
// Unified error handling
export async function safeAuthAction<T>(
  action: () => Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const result = await action()
    return [result, null]
  } catch (error) {
    console.error('Auth action failed:', error)
    return [null, error as Error]
  }
}

// Usage example
const [session, error] = await safeAuthAction(() =>
  authClient.getSession()
)

if (error) {
  // Handle error
  return
}

// Use session
```

### Performance Optimization

```typescript
// Session caching
let cachedSession: Session | null = null
let cacheExpiry = 0

export async function getCachedSession(): Promise<Session | null> {
  const now = Date.now()

  if (cachedSession && now < cacheExpiry) {
    return cachedSession
  }

  const session = await authClient.getSession()
  cachedSession = session.data
  cacheExpiry = now + 5 * 60 * 1000 // 5-minute cache

  return cachedSession
}
```

### Security Best Practices

```typescript
// CSRF protection
export const authConfig = {
  csrf: {
    enabled: true,
    sameSite: 'strict',
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  rateLimit: {
    window: 60, // 1 minute
    max: 10,    // Maximum 10 requests
  },
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failure

**Problem**: Users cannot log in
**Solution**:
```typescript
// Check environment variables
if (!process.env.BETTER_GITHUB_CLIENT_ID) {
  throw new Error('Missing BETTER_GITHUB_CLIENT_ID')
}

// Check database connection
try {
  const db = await getAuthDb()
  console.log('Database connected successfully')
} catch (error) {
  console.error('Database connection failed:', error)
}
```

#### 2. Subscription Limit Issues

**Problem**: Subscription limit checks fail
**Solution**:
```typescript
// Debug subscription status
const usage = await getSubscriptionUsage(organizationId)
console.log('Subscription debug:', {
  plan: usage.plan,
  limits: {
    ai: `${usage.aiNums}/${usage.aiNumsLimit}`,
    projects: `${usage.projectNums}/${usage.projectNumsLimit}`,
  },
})
```

#### 3. Webhook Processing Failure

**Problem**: Stripe webhook event processing fails
**Solution**:
```typescript
// Verify webhook signature
import { stripe } from '@libra/auth/utils/stripe-config'

export async function verifyWebhook(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const body = await request.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    return event
  } catch (error) {
    console.error('Webhook verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}
```

### Debug Tools

```typescript
// Enable debug logging
export const authConfig = {
  logger: {
    level: 'debug',
    disabled: process.env.NODE_ENV === 'production',
  },
}

// Custom logging
import { log } from '@libra/common'

export function logAuthEvent(event: string, data: any) {
  log.auth('info', event, {
    timestamp: new Date().toISOString(),
    ...data,
  })
}
```