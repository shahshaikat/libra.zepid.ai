---
title: "Zepid AI Development Documentation: Better-auth + Stripe Integration Guide"
description: "Comprehensive development documentation covering the complete implementation patterns of better-auth and Stripe payment integration in the Libra project"
version: "1.0"
lastUpdated: "2025-07-30"
---

# Zepid AI Development Documentation: Better-auth + Stripe Integration Guide

This is a comprehensive development documentation covering the complete implementation patterns of better-auth and Stripe payment integration in the Libra project.

## Quick Navigation

- 🚀 [Quick Start](#environment-setup) - Set up development environment in 5 minutes
- 🏗️ [Architecture Understanding](#architecture-overview) - Understand the overall system design
- 💳 [Stripe Integration](#stripe-integration-implementation) - Payment functionality implementation
- 📊 [Quota Management](#quota-management-system) - Subscription quota system
- 🧪 [Testing & Debugging](#testing-and-development) - Development and testing guide

## Table of Contents

- [Zepid AI Development Documentation: Better-auth + Stripe Integration Guide](#libra-ai-development-documentation-better-auth--stripe-integration-guide)
  - [Quick Navigation](#quick-navigation)
  - [Table of Contents](#table-of-contents)
  - [Related Documentation](#related-documentation)
  - [Architecture Overview](#architecture-overview)
    - [Core Features](#core-features)
  - [Environment Setup](#environment-setup)
    - [Required Environment Variables](#required-environment-variables)
    - [Development Environment Setup](#development-environment-setup)
  - [Database Architecture](#database-architecture)
    - [Authentication Database (SQLite)](#authentication-database-sqlite)
    - [Project Database (PostgreSQL)](#project-database-postgresql)
  - [Authentication System Configuration](#authentication-system-configuration)
    - [Better-auth Server Configuration](#better-auth-server-configuration)
    - [Plan Type Definitions](#plan-type-definitions)
  - [Stripe Integration Implementation](#stripe-integration-implementation)
    - [Custom Stripe Plugin](#custom-stripe-plugin)
    - [Stripe Event Handlers](#stripe-event-handlers)
  - [Quota Management System](#quota-management-system)
    - [Core Quota Deduction Function](#core-quota-deduction-function)
  - [API Routes Detailed](#api-routes-detailed)
    - [Stripe Related Routes](#stripe-related-routes)
  - [Error Handling Patterns](#error-handling-patterns)
    - [Quota Insufficient Handling](#quota-insufficient-handling)
  - [Testing and Development](#testing-and-development)
    - [Local Development Environment](#local-development-environment)
    - [Testing Stripe Integration](#testing-stripe-integration)
  - [Summary](#summary)
    - [🎯 Core Advantages](#-core-advantages)
    - [📚 Related Resources](#-related-resources)
    - [🤝 Contributing Guidelines](#-contributing-guidelines)

## Related Documentation

- [Project Overall Architecture](../../README_ZH.md#技术架构)
- [API Development Guide](../api/DEV_ZH.md)
- [Technical Development Guidelines](../../TECHNICAL_GUIDELINES_ZH.md)
- [Common Utilities Documentation](./README.md)

## Architecture Overview

Libra adopts a Multi-Database Hybrid Architecture, implementing a powerful subscription management and quota system:

```typescript
// Architecture Components
- SQLite (Auth DB): User authentication, organization management, Stripe subscriptions
- PostgreSQL (Project DB): Project data, quota limits, usage statistics
- Cloudflare D1 + KV: Runtime session storage
- Better-auth: Authentication framework core
- Stripe: Payment processing and subscription management
```

### Core Features

- **Hybrid Subscription Model**: Supports coexistence of FREE and PAID plans
- **Atomic Quota Deduction**: Prevents over-usage under concurrent conditions
- **Auto Quota Refresh**: FREE plan automatically resets quota monthly
- **Multi-Tenant Isolation**: Organization-based resource isolation
- **Event-Driven Updates**: Stripe Webhook triggers subscription lifecycle events

## Environment Setup

### Required Environment Variables

> 💡 **Tip**: Copy `.env.example` to `.env.local` and fill in the following configuration

```bash
# Better-auth authentication configuration
BETTER_AUTH_SECRET="your-32-char-secret"              # 32-character random string for JWT signing
BETTER_GITHUB_CLIENT_ID="github-oauth-client-id"      # GitHub OAuth application ID
BETTER_GITHUB_CLIENT_SECRET="github-oauth-client-secret" # GitHub OAuth application secret

# Stripe payment configuration
STRIPE_SECRET_KEY="sk_test_..."                       # Stripe secret key (test environment starts with sk_test_)
STRIPE_WEBHOOK_SECRET="whsec_..."                     # Stripe Webhook signature secret
STRIPE_PUBLISHABLE_KEY="pk_test_..."                  # Stripe publishable key (for frontend use)

# Database configuration
DATABASE_URL="postgresql://user:password@localhost:5432/libra"  # PostgreSQL connection string (project data)
DATABASE="auth.db"                                    # SQLite file path (authentication data)

# Admin configuration
ADMIN_USER_IDS="user1,user2,user3"                   # Comma-separated list of admin user IDs

# Cloudflare configuration (production environment)
KV_NAMESPACE="your-kv-namespace"                      # Cloudflare KV namespace
D1_DATABASE="your-d1-database"                       # Cloudflare D1 database name
```

### Development Environment Setup

```bash
# 1. Install project dependencies
bun install

# 2. Run database migrations (initialize database structure)
bun migration:local

# 3. Start development server (supports hot reload)
bun dev

# 4. Run type checking (verify TypeScript types)
bun typecheck

# 5. Run test suite
bun test
```

> ⚠️ **Note**: Ensure PostgreSQL database is installed locally and the corresponding database is created

## Database Architecture

### Authentication Database (SQLite)

> 📝 **Description**: Authentication database uses SQLite, storing user authentication information, organization data, and Stripe subscription records

```typescript
// packages/auth/db/schema/auth-schema.ts

// User Table - User basic information table
export const user = sqliteTable("user", {
  id: text('id').primaryKey(),                          // User unique identifier
  name: text('name').notNull(),                         // User display name
  email: text('email').notNull().unique(),              // User email (unique)
  emailVerified: integer('email_verified', {mode: 'boolean'}), // Email verification status
  stripeCustomerId: text('stripe_customer_id'),         // Stripe customer ID for billing
  role: text('role').default('user').notNull(),         // User role: user, admin, superadmin
  banned: integer('banned', {mode: 'boolean'}).default(false), // Account ban status
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(), // Account creation time
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull(), // Last update time
});

// Organization Table - Organization/team information table
export const organization = sqliteTable("organization", {
  id: text('id').primaryKey(),                          // Organization unique identifier
  name: text('name').notNull(),                         // Organization display name
  slug: text('slug').unique(),                          // URL-friendly identifier
  logo: text('logo'),                                   // Organization logo URL
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(), // Creation timestamp
  metadata: text('metadata')                            // Additional organization data (JSON)
});

// Subscription Table - Stripe subscription data table
export const subscription = sqliteTable("subscription", {
  id: text('id').primaryKey(),                          // Subscription unique identifier
  plan: text('plan').notNull(),                         // Plan name (e.g., "libra pro")
  referenceId: text('reference_id').notNull(),          // Organization ID reference
  stripeCustomerId: text('stripe_customer_id'),         // Stripe customer ID
  stripeSubscriptionId: text('stripe_subscription_id'), // Stripe subscription ID
  status: text('status').default("incomplete"),         // Subscription status: active, canceled, etc.
  periodStart: integer('period_start', {mode: 'timestamp'}), // Billing period start
  periodEnd: integer('period_end', {mode: 'timestamp'}),     // Billing period end
  cancelAtPeriodEnd: integer('cancel_at_period_end', {mode: 'boolean'}), // Cancel at period end flag
  seats: integer('seats')                               // Number of seats in subscription
});
```

### Project Database (PostgreSQL)

> 📝 **Description**: Project database uses PostgreSQL, storing quota limits, project data, and usage statistics

```typescript
// packages/db/schema/project-schema.ts

// Subscription Limit Table - Subscription quota limit table (quota management core)
export const subscriptionLimit = pgTable('subscription_limit', {
  id: text('id').primaryKey(),                        // Unique identifier
  organizationId: text('organization_id').notNull(),  // Organization reference
  stripeCustomerId: text('stripe_customer_id'),       // Stripe customer ID
  planName: text('plan_name').notNull(),              // Plan name (e.g., "libra pro")
  planId: text('plan_id').notNull(),                  // Plan identifier

  // Quota Fields
  aiNums: integer('ai_nums').notNull(),               // AI message quota remaining
  enhanceNums: integer('enhance_nums').notNull(),     // Enhancement feature quota
  uploadLimit: integer('upload_limit').notNull(),     // File upload limit
  seats: integer('seats').notNull().default(1),       // Number of seats
  projectNums: integer('project_nums').notNull().default(1), // Project count limit

  // Status Management
  isActive: boolean('is_active').notNull().default(true),    // Active status
  periodStart: timestamp('period_start').notNull(),          // Billing period start
  periodEnd: timestamp('period_end').notNull(),              // Billing period end

  // Timestamps
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Unique Constraint - Each organization can only have one active plan with the same name
  uniqueOrgPlanActive: uniqueIndex('subscription_limit_org_plan_active_idx')
    .on(table.organizationId, table.planName)
    .where(sql`${table.isActive} = true`)
}))
```

## Authentication System Configuration

### Better-auth Server Configuration

> 📝 **Description**: Better-auth is the core of the authentication system, integrating Cloudflare and Stripe plugins

```typescript
// packages/auth/auth-server.ts

import { withCloudflare } from '@libra/better-auth-cloudflare'
import { stripe } from '@libra/better-auth-stripe'
import { betterAuth } from 'better-auth'
import { admin, bearer, emailOTP, organization } from 'better-auth/plugins'

/**
 * Authentication Builder - Authentication system builder
 * Configure Better-auth instance, integrating Cloudflare and Stripe functionality
 */
async function authBuilder() {
  const dbInstance = await getAuthDb()
  const { env } = await getCloudflareContext({ async: true })

  return betterAuth(
    withCloudflare(
      {
        autoDetectIpAddress: true,        // Auto-detect user IP for security
        geolocationTracking: true,        // Enable geolocation tracking
        d1: { db: dbInstance },          // Cloudflare D1 database instance
        kv: env.KV,                      // Cloudflare KV storage for sessions
      },
      {
        // Database Hooks - Database hooks: auto-assign organization
        databaseHooks: {
          session: {
            create: {
              before: async (session: Session) => {
                // Auto-assign active organization to new sessions
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

        // OAuth Providers - OAuth provider configuration
        socialProviders: {
          github: {
            clientId: envs.BETTER_GITHUB_CLIENT_ID,
            clientSecret: envs.BETTER_GITHUB_CLIENT_SECRET,
          },
        },

        // Plugin Configuration
        plugins: [
          // Admin Plugin
          admin({
            defaultRole: 'user',
            adminRoles: ['admin', 'superadmin'],
            adminUserIds: getAdminUserIds(),
          }),
          // Organization Plugin - Organization management plugin
          organization(),
          // Email OTP Plugin - Email verification plugin
          emailOTP(),
          // Stripe Plugin - Stripe payment integration plugin
          stripe({
            stripeClient,
            stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
            createCustomerOnSignUp: true,
            subscription: {
              enabled: true,
              getCheckoutSessionParams,
              plans: getPlans,
              authorizeReference,
              onSubscriptionComplete,
              onSubscriptionUpdate,
              onSubscriptionCancel,
              onSubscriptionDeleted,
            },
            onEvent,
            onCustomerCreate,
          }),
          // Email Harmony Plugin
          emailHarmony(),
          // Bearer Token Plugin
          bearer(),
        ],
      }
    )
  )
}
```

### Plan Type Definitions

> 📝 **Description**: Define subscription plan types and quota limits, supporting FREE, PRO, MAX three plans

```typescript
// packages/auth/utils/subscription-limits/types.ts

// Plan Types - Plan type constant definitions
export const PLAN_TYPES = {
  FREE: 'libra free',    // Free plan for basic usage
  PRO: 'libra pro',      // Professional plan for teams
  MAX: 'libra max'       // Maximum plan for enterprises
} as const

// Plan Type Union
export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES]

// Plan Limits Interface
export interface PlanLimits {
  aiNums: number          // AI message quota limit
  seats: number           // Number of team seats
  projectNums: number     // Maximum project count
  uploadLimit?: number    // File upload size limit (optional)
}

// Plan Configuration - Plan configuration mapping table
export const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  // Free Plan - Free plan (suitable for individual users)
  [PLAN_TYPES.FREE]: {
    aiNums: 50,           // 50 AI messages per month
    seats: 1,             // Single user
    projectNums: 1,       // 1 project limit
  },
  // Pro Plan - Professional plan (suitable for small teams)
  [PLAN_TYPES.PRO]: {
    aiNums: 1000,         // 1000 AI messages per month
    seats: 5,             // Up to 5 team members
    projectNums: 10,      // 10 projects limit
  },
  // Max Plan - Maximum plan (suitable for large teams)
  [PLAN_TYPES.MAX]: {
    aiNums: 5000,         // 5000 AI messages per month
    seats: 20,            // Up to 20 team members
    projectNums: 50,      // 50 projects limit
  },
}
```

## Stripe Integration Implementation

### Custom Stripe Plugin

> 📝 **Description**: Custom Stripe plugin provides subscription management, payment processing, and Webhook event handling functionality

```typescript
// packages/better-auth-stripe/src/index.ts

/**
 * Stripe Plugin - Stripe payment integration plugin
 * Provides subscription upgrade, cancellation, and Webhook handling functionality
 */
export const stripe = <O extends StripeOptions>(options: O) => {
  const client = options.stripeClient

  return {
    id: 'stripe',
    endpoints: {
      // Subscription Upgrade Endpoint
      upgradeSubscription: createAuthEndpoint(
        '/subscription/upgrade',
        {
          method: 'POST',
          body: z.object({
            priceId: z.string().optional(),        // Stripe price ID
            lookupKey: z.string().optional(),      // Price lookup key
            referenceId: z.string().optional(),    // Organization reference ID
            successURL: z.string().optional(),     // Success redirect URL
            cancelURL: z.string().optional(),      // Cancel redirect URL
          }),
        },
        async (ctx) => {
          const session = await getSessionFromCtx(ctx)
          const { priceId, lookupKey, referenceId, successURL, cancelURL } = ctx.body

          // Create or get Stripe customer
          const customer = await getOrCreateCustomer(client, session.user)

          // Resolve price ID from lookup key
          const resolvedPriceId = priceId || await resolvePriceIdFromLookupKey(client, lookupKey)

          // Create Stripe Checkout Session
          const checkoutSession = await client.checkout.sessions.create({
            customer: customer.id,
            mode: 'subscription',
            line_items: [{ price: resolvedPriceId, quantity: 1 }],
            success_url: successURL || `${ctx.context.options.baseURL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelURL || `${ctx.context.options.baseURL}/pricing`,
            metadata: {
              referenceId: referenceId || session.user.id,
            },
          })

          return { checkoutURL: checkoutSession.url }
        }
      ),

      // Cancel Subscription Endpoint
      cancelSubscription: createAuthEndpoint(
        '/subscription/cancel',
        {
          method: 'POST',
          body: z.object({
            subscriptionId: z.string(),           // Stripe subscription ID
            referenceId: z.string().optional(),   // Organization reference ID
          }),
        },
        async (ctx) => {
          const { subscriptionId } = ctx.body

          // Create billing portal session for cancellation
          const portalSession = await client.billingPortal.sessions.create({
            customer: session.user.stripeCustomerId,
            return_url: `${ctx.context.options.baseURL}/dashboard`,
          })

          return { portalURL: portalSession.url }
        }
      ),

      // Stripe Webhook Handler
      stripeWebhook: createAuthEndpoint(
        '/stripe/webhook',
        {
          method: 'POST',
          headers: z.object({
            'stripe-signature': z.string(),       // Stripe webhook signature
          }),
          body: z.any(),                         // Raw webhook payload
        },
        async (ctx) => {
          const sig = ctx.headers['stripe-signature']

          // Verify and construct webhook event
          const event = client.webhooks.constructEvent(
            ctx.body,
            sig,
            options.stripeWebhookSecret
          )

          // Handle different webhook event types
          switch (event.type) {
            case 'checkout.session.completed':
              await onCheckoutSessionCompleted(event.data.object, options)
              break
            case 'customer.subscription.updated':
              await onSubscriptionUpdated(event.data.object, options)
              break
            case 'customer.subscription.deleted':
              await onSubscriptionDeleted(event.data.object, options)
              break
          }

          return { received: true }
        }
      ),
    },
  } satisfies BetterAuthPlugin
}
```

### Stripe Event Handlers

> 📝 **Description**: Stripe event handlers are responsible for handling subscription lifecycle events and synchronizing subscription status to the local database

```typescript
// packages/auth/plugins/stripe/subscription-handlers.ts

/**
 * Subscription Complete Handler
 * Triggered when user successfully completes subscription payment
 */
export async function onSubscriptionComplete(subscription: any, user: any) {
  log.subscription('info', 'Processing subscription completion', {
    userId: user.id,
    subscriptionId: subscription.id,
    operation: 'subscription_complete'
  });

  // Extract plan information from subscription
  const plan = subscription.items.data[0]?.price?.lookup_key || subscription.items.data[0]?.price?.id

  // Create subscription limit record
  await createOrUpdateSubscriptionLimit(
    user.activeOrganizationId,
    subscription.customer,
    plan,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000)
  )
}

/**
 * Subscription Update Handler
 * Triggered when subscription status changes (such as renewal, upgrade, etc.)
 */
export async function onSubscriptionUpdate(subscription: any) {
  log.subscription('info', 'Processing subscription update', {
    subscriptionId: subscription.id,
    status: subscription.status,
    operation: 'subscription_update'
  });

  // Only process active subscriptions
  if (subscription.status === 'active') {
    // Update subscription limits
    const plan = subscription.items.data[0]?.price?.lookup_key
    await createOrUpdateSubscriptionLimit(
      subscription.metadata.referenceId,
      subscription.customer,
      plan,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000)
    )
  }
}

/**
 * Subscription Cancel Handler
 * Triggered when user cancels subscription
 */
export async function onSubscriptionCancel(subscription: any) {
  log.subscription('info', 'Processing subscription cancellation', {
    subscriptionId: subscription.id,
    operation: 'subscription_cancel'
  });

  // Cancel paid subscription limits, keep FREE plan
  await cancelSubscriptionLimits(subscription.metadata.referenceId)
}
```

## Quota Management System

> 📝 **Description**: The quota management system is the core functionality of Libra, implementing high-performance quota deduction and automatic refresh mechanisms

### Core Quota Deduction Function

```typescript
// packages/auth/utils/subscription-limits/core.ts

/**
 * AI Message Usage Check and Update - AI message quota deduction main function
 *
 * Uses Hybrid Strategy:
 * 1. Fast Path: Paid plan atomic operation deduction
 * 2. Slow Path: FREE plan transaction processing (supports automatic refresh)
 *
 * @param organizationId - Organization unique identifier
 * @returns Promise<boolean> - true if quota available and deducted, false otherwise
 */
export async function checkAndUpdateAIMessageUsage(organizationId: string): Promise<boolean> {
  const db = await getDbAsync()

  // Get database time for UTC consistency
  const { rows } = await db.execute(sql`SELECT NOW() as "dbNow"`)
  const [{ dbNow }] = rows as [{ dbNow: Date }]
  const now = dbNow

  // Fast Path: Attempt atomic deduction from paid plans
  const paidDeductionResult = await attemptPaidPlanDeduction(db, organizationId, now)
  if (paidDeductionResult.success) {
    log.subscription('info', 'AI message deducted from paid plan', {
      organizationId,
      planName: paidDeductionResult.planName,
      remaining: paidDeductionResult.remaining,
    });
    return true
  }

  // Slow Path: Handle FREE plan with transaction safety
  return await handleFreePlanDeduction(db, organizationId, now)
}

/**
 * Paid Plan Atomic Deduction
 *
 * Uses single UPDATE statement for atomic operation, avoiding race conditions
 * Only deducts when quota is sufficient and subscription is valid
 *
 * @param db - Database instance
 * @param organizationId - Organization ID
 * @param now - Current timestamp
 * @returns Deduction result with success status and remaining quota
 */
async function attemptPaidPlanDeduction(
  db: any,
  organizationId: string,
  now: Date
): Promise<{ success: boolean; planName?: string; remaining?: number }> {
  const [result, error] = await tryCatch(async () => {
    // Atomic UPDATE with conditions
    const paidUpdated = await db
      .update(subscriptionLimit)
      .set({
        aiNums: sql<number>`(${subscriptionLimit.aiNums}) - 1`,  // Decrement quota by 1
        updatedAt: sql`CURRENT_TIMESTAMP`,                       // Update timestamp
      })
      .where(
        and(
          eq(subscriptionLimit.organizationId, organizationId),              // Match organization
          sql`${subscriptionLimit.planName} != ${PLAN_TYPES.FREE}`,         // Exclude FREE plans
          eq(subscriptionLimit.isActive, true),                             // Only active subscriptions
          sql`(${subscriptionLimit.aiNums}) > 0`,                          // Quota must be available
          sql`${subscriptionLimit.periodEnd} >= ${new Date(now).toISOString()}` // Subscription not expired
        )
      )
      .returning({
        remaining: subscriptionLimit.aiNums,    // Return remaining quota
        planName: subscriptionLimit.planName,   // Return plan name
      })

    // Check if deduction was successful
    if (paidUpdated.length > 0) {
      const result = paidUpdated[0]
      return {
        success: true,
        planName: result?.planName || 'unknown',
        remaining: result?.remaining || 0,
      }
    }

    return { success: false }
  })

  return result || { success: false }
}
```

## API Routes Detailed

### Stripe Related Routes

```typescript
// packages/api/src/router/stripe.ts

export const stripeRouter = {
  // Get user plan information
  getUserPlans: publicProcedure.query(async ({ ctx }) => {
    const auth = await initAuth()
    const sessionData = await auth.api.getSession({ headers: await headers() })
    const user = sessionData?.user

    if (user) {
      const activeOrg = await getActiveOrganization(user.id)

      // Get current subscription limits
      const currentLimits = await projectDb
        .select({ planName: subscriptionLimit.planName })
        .from(subscriptionLimit)
        .where(
          and(
            eq(subscriptionLimit.organizationId, activeOrg.id),
            eq(subscriptionLimit.isActive, true)
          )
        )

      // Get active subscriptions
      const activeSubscriptions = await db
        .select({ plan: subscription.plan })
        .from(subscription)
        .where(
          and(
            eq(subscription.referenceId, activeOrg.id),
            eq(subscription.status, 'active')
          )
        )

      // Merge all plans
      const allPlans = new Set<string>()
      currentLimits.forEach(limit => allPlans.add(limit.planName))
      activeSubscriptions.forEach(sub => allPlans.add(sub.plan))

      if (allPlans.size === 0) allPlans.add('FREE')

      const currentUserPlans = Array.from(allPlans)

      // Determine primary plan (paid plans take priority)
      const paidPlans = currentUserPlans.filter(plan => !plan.toLowerCase().includes('free'))
      const primaryPlan = paidPlans.find(plan => plan.toLowerCase().includes('pro')) ||
                         paidPlans.find(plan => plan.toLowerCase().includes('max')) ||
                         paidPlans[0] ||
                         'FREE'

      return {
        code: 'SUCCESS',
        data: mapToPlans(planPrices, primaryPlan),
        currentUserPlan: primaryPlan,
        currentUserPlans,
        hasPaidSubscription: paidPlans.length > 0,
      }
    }

    return { code: 'SUCCESS', data: [], currentUserPlan: 'FREE' }
  }),

  // Check if user is paid
  isPaid: organizationProcedure.query(async (opts) => {
    const { db } = opts.ctx
    const { orgId } = opts.input

    const activeSubscription = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.referenceId, orgId),
          eq(subscription.status, 'active')
        )
      )
      .then(rows => rows[0])

    return {
      code: 'SUCCESS',
      data: {
        isPaid: !!activeSubscription,
        subscription: activeSubscription || null,
      },
    }
  }),

  // Get subscription usage
  getSubscriptionUsage: organizationProcedure.query(async (opts) => {
    const { db } = opts.ctx
    const { orgId } = opts.input

    if (!orgId) {
      return { code: 'SUCCESS', data: DEFAULT_FREE_LIMITS }
    }

    const [limit] = await db
      .select()
      .from(subscriptionLimit)
      .where(
        and(
          eq(subscriptionLimit.organizationId, orgId),
          eq(subscriptionLimit.isActive, true)
        )
      )

    if (!limit) {
      return { code: 'SUCCESS', data: DEFAULT_FREE_LIMITS }
    }

    return {
      code: 'SUCCESS',
      data: {
        aiNums: limit.aiNums,
        aiNumsLimit: limit.aiNums,
        seats: limit.seats,
        seatsLimit: limit.seats,
        projectNums: limit.projectNums,
        projectNumsLimit: limit.projectNums,
        plan: limit.planName,
        isActive: limit.isActive,
        periodEnd: limit.periodEnd,
      },
    }
  }),
}
```

## Error Handling Patterns

### Quota Insufficient Handling

```typescript
// Where AI functionality is needed
async function generateAIResponse(organizationId: string, prompt: string) {
  // Check and deduct quota
  const hasQuota = await checkAndUpdateAIMessageUsage(organizationId)

  if (!hasQuota) {
    throw new APIError('QUOTA_EXCEEDED', {
      message: 'AI message quota exhausted',
      code: 'QUOTA_EXCEEDED',
      details: {
        quotaType: 'ai_messages',
        organizationId,
        suggestedAction: 'upgrade_plan'
      }
    })
  }

  try {
    // Execute AI request
    const response = await callAIService(prompt)
    return response
  } catch (error) {
    // AI request failed, restore quota
    await restoreAIQuotaOnError(organizationId)
    throw error
  }
}
```

## Testing and Development

### Local Development Environment

```bash
# 1. Set environment variables
cp .env.example .env.local
# Edit .env.local file and fill in necessary configuration

# 2. Start local database
docker run -d \
  --name libra-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=libra \
  -p 5432:5432 \
  postgres:15

# 3. Run migrations
bun migration:local

# 4. Start development server
bun dev

# 5. In another terminal, start Stripe CLI to listen for webhooks
stripe listen --forward-to localhost:3000/api/auth/stripe/webhook
```

### Testing Stripe Integration

```typescript
// tests/stripe-integration.test.ts

import { describe, it, expect, beforeEach } from 'bun:test'
import { createMockStripeWebhook, createTestUser } from './test-utils'

describe('Stripe Integration', () => {
  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData()
  })

  it('should create subscription limits on checkout completion', async () => {
    // Create test user and organization
    const { user, organization } = await createTestUser()

    // Mock Stripe checkout.session.completed event
    const checkoutEvent = createMockStripeWebhook('checkout.session.completed', {
      customer: user.stripeCustomerId,
      subscription: 'sub_test123',
      metadata: {
        referenceId: organization.id,
      },
    })

    // Process webhook
    await handleStripeWebhook(checkoutEvent)

    // Verify subscription limits are created
    const limits = await getSubscriptionUsage(organization.id)
    expect(limits.plan).not.toBe('libra free')
    expect(limits.aiNums).toBeGreaterThan(50) // Paid plan has higher quota
  })

  it('should handle quota deduction correctly', async () => {
    const { organization } = await createTestUser()

    // Create paid subscription limits
    await createOrUpdateSubscriptionLimit(
      organization.id,
      'cus_test123',
      'libra pro',
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
      { aiNums: 100, seats: 5, projectNums: 10 }
    )

    // Test quota deduction
    const success = await checkAndUpdateAIMessageUsage(organization.id)
    expect(success).toBe(true)

    // Verify quota decreased
    const usage = await getSubscriptionUsage(organization.id)
    expect(usage.aiNums).toBe(99)
  })
})
```

## Summary

This Better-auth + Stripe integration solution provides a complete SaaS subscription management solution:

### 🎯 Core Advantages

1. **Robust Subscription Management**: Supports multiple plan types and flexible quota systems
2. **High-Performance Quota System**: Atomic operations + transaction processing ensures data consistency
3. **Comprehensive Error Handling**: Covers various scenarios including quota exhaustion, payment failures, etc.
4. **Developer-Friendly**: Detailed logging and debugging tools
5. **Production-Ready**: Supports Cloudflare Workers deployment

### 📚 Related Resources

- [Better-auth Official Documentation](https://better-auth.com)
- [Stripe Developer Documentation](https://stripe.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Project GitHub Repository](https://github.com/nextify-limited/libra)

### 🤝 Contributing Guidelines

Welcome to contribute improvement suggestions to this documentation! Please refer to the [Contributing Guide](../../CONTRIBUTING.md) for detailed information.

---

By following these patterns and best practices, you can build a stable and reliable SaaS subscription system. If you have any questions, please refer to the related documentation or submit an Issue on GitHub.