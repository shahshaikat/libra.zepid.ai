# Zepid Better-auth + Stripe Integration Development Documentation

This is a comprehensive English development documentation covering the complete implementation patterns of better-auth and Stripe payment integration in the Zepid project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Configuration](#environment-configuration)
3. [Database Architecture](#database-architecture)
4. [Authentication System Configuration](#authentication-system-configuration)
5. [Stripe Integration Implementation](#stripe-integration-implementation)
6. [Quota Management System](#quota-management-system)
7. [API Routes Detailed](#api-routes-detailed)
8. [Error Handling Patterns](#error-handling-patterns)
9. [Testing and Development](#testing-and-development)

## Architecture Overview

Zepid adopts a multi-database hybrid architecture, implementing a powerful subscription management and quota system:

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
- **Atomic Quota Deduction**: Prevents overuse under concurrent conditions
- **Automatic Quota Refresh**: FREE plans automatically reset quotas monthly
- **Multi-tenant Isolation**: Organization-based resource isolation
- **Event-driven Updates**: Stripe Webhook triggers subscription lifecycle events

## Environment Configuration

### Required Environment Variables

```bash
# Better-auth Configuration
BETTER_AUTH_SECRET="your-32-char-secret"
BETTER_GITHUB_CLIENT_ID="github-oauth-client-id"
BETTER_GITHUB_CLIENT_SECRET="github-oauth-client-secret"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Database Configuration
DATABASE_URL="postgresql://..."  # PostgreSQL (project data)
DATABASE="auth.db"               # SQLite (auth data)

# Admin Configuration
ADMIN_USER_IDS="user1,user2,user3"  # Comma-separated admin user IDs

# Cloudflare Configuration (production)
KV_NAMESPACE="your-kv-namespace"
D1_DATABASE="your-d1-database"
```

### Development Environment Setup

```bash
# Install dependencies
bun install

# Run database migrations
bun migration:local

# Start development server
bun dev

# Run type checking
bun typecheck

# Run tests
bun test
```

## Database Architecture

### Authentication Database (SQLite)

```typescript
// packages/auth/db/schema/auth-schema.ts

// User table
export const user = sqliteTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', {mode: 'boolean'}),
  stripeCustomerId: text('stripe_customer_id'),  // Stripe customer ID
  role: text('role').default('user').notNull(),   // user, admin, superadmin
  banned: integer('banned', {mode: 'boolean'}).default(false),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull(),
});

// Organization table
export const organization = sqliteTable("organization", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  metadata: text('metadata')
});

// Subscription table (Stripe subscription data)
export const subscription = sqliteTable("subscription", {
  id: text('id').primaryKey(),
  plan: text('plan').notNull(),                           // Plan name
  referenceId: text('reference_id').notNull(),           // Organization ID
  stripeCustomerId: text('stripe_customer_id'),          // Stripe customer ID
  stripeSubscriptionId: text('stripe_subscription_id'),  // Stripe subscription ID
  status: text('status').default("incomplete"),          // active, canceled, etc.
  periodStart: integer('period_start', {mode: 'timestamp'}),
  periodEnd: integer('period_end', {mode: 'timestamp'}),
  cancelAtPeriodEnd: integer('cancel_at_period_end', {mode: 'boolean'}),
  seats: integer('seats')
});
```

### Project Database (PostgreSQL)

```typescript
// packages/db/schema/project-schema.ts

// Subscription limit table (quota management core)
export const subscriptionLimit = pgTable('subscription_limit', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  planName: text('plan_name').notNull(),              // Plan name
  planId: text('plan_id').notNull(),

  // Quota fields
  aiNums: integer('ai_nums').notNull(),               // AI message quota
  enhanceNums: integer('enhance_nums').notNull(),     // Enhancement feature quota
  uploadLimit: integer('upload_limit').notNull(),     // Upload limit
  seats: integer('seats').notNull().default(1),       // Number of seats
  projectNums: integer('project_nums').notNull().default(1), // Number of projects

  // Status management
  isActive: boolean('is_active').notNull().default(true),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Unique constraint: each organization can only have one active plan with the same name
  uniqueOrgPlanActive: uniqueIndex('subscription_limit_org_plan_active_idx')
    .on(table.organizationId, table.planName)
    .where(sql`${table.isActive} = true`)
}))
```

## Authentication System Configuration

### Better-auth Server Configuration

```typescript
// packages/auth/auth-server.ts

import { withCloudflare } from '@libra/better-auth-cloudflare'
import { stripe } from '@libra/better-auth-stripe'
import { betterAuth } from 'better-auth'
import { admin, bearer, emailOTP, organization } from 'better-auth/plugins'

async function authBuilder() {
  const dbInstance = await getAuthDb()
  const { env } = await getCloudflareContext({ async: true })

  return betterAuth(
    withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        d1: { db: dbInstance },
        kv: env.KV,  // Cloudflare KV storage
      },
      {
        // Session hooks: automatically assign organization
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
              }
            }
          }
        },

        // Database configuration
        database: dbInstance,
        secret: env.BETTER_AUTH_SECRET,

        // Plugin configuration
        plugins: [
          admin({
            adminUserIds: env.ADMIN_USER_IDS?.split(',') || [],
          }),
          bearer(),
          emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
              // Send OTP via email service
              await sendEmail({
                to: email,
                subject: 'Verification Code',
                text: `Your verification code is: ${otp}`,
              })
            },
          }),
          organization({
            async sendInvitationEmail(data) {
              // Send organization invitation email
              await sendEmail({
                to: data.email,
                subject: 'Organization Invitation',
                text: `You've been invited to join ${data.organization.name}`,
              })
            },
          }),
          stripe({
            stripeSecretKey: env.STRIPE_SECRET_KEY!,
            stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET!,

            // Subscription event handlers
            onSubscriptionCreated: async (subscription) => {
              await handleSubscriptionCreated(subscription)
            },
            onSubscriptionUpdated: async (subscription) => {
              await handleSubscriptionUpdated(subscription)
            },
            onSubscriptionDeleted: async (subscription) => {
              await handleSubscriptionDeleted(subscription)
            },
          }),
        ],

        // Social providers
        socialProviders: {
          github: {
            clientId: env.BETTER_GITHUB_CLIENT_ID!,
            clientSecret: env.BETTER_GITHUB_CLIENT_SECRET!,
          },
        },
      }
    )
  )
}

export const initAuth = memoize(authBuilder)
```

## Stripe Integration Implementation

### Stripe Plugin Configuration

```typescript
// packages/better-auth-stripe/src/index.ts

import type { BetterAuthPlugin } from 'better-auth'
import Stripe from 'stripe'

export interface StripePluginOptions {
  stripeSecretKey: string
  stripeWebhookSecret: string
  onSubscriptionCreated?: (subscription: Stripe.Subscription) => Promise<void>
  onSubscriptionUpdated?: (subscription: Stripe.Subscription) => Promise<void>
  onSubscriptionDeleted?: (subscription: Stripe.Subscription) => Promise<void>
  onInvoicePaymentSucceeded?: (invoice: Stripe.Invoice) => Promise<void>
  onInvoicePaymentFailed?: (invoice: Stripe.Invoice) => Promise<void>
}

export const stripe = (options: StripePluginOptions): BetterAuthPlugin => {
  const stripeClient = new Stripe(options.stripeSecretKey, {
    apiVersion: '2025-05-28.basil',
  })

  return {
    id: 'stripe',
    endpoints: {
      // Create Stripe customer
      createCustomer: {
        method: 'POST',
        path: '/stripe/create-customer',
        handler: async (request) => {
          const { userId, email, name } = await request.json()

          const customer = await stripeClient.customers.create({
            email,
            name,
            metadata: { userId },
          })

          // Update user with Stripe customer ID
          await updateUser(userId, { stripeCustomerId: customer.id })

          return { customerId: customer.id }
        },
      },

      // Create checkout session
      createCheckoutSession: {
        method: 'POST',
        path: '/stripe/create-checkout-session',
        handler: async (request) => {
          const { priceId, customerId, organizationId, successUrl, cancelUrl } = await request.json()

          const session = await stripeClient.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
              organizationId,
            },
          })

          return { sessionId: session.id, url: session.url }
        },
      },

      // Handle Stripe webhooks
      webhook: {
        method: 'POST',
        path: '/stripe/webhook',
        handler: async (request) => {
          const body = await request.text()
          const signature = request.headers.get('stripe-signature')

          if (!signature) {
            throw new Error('Missing Stripe signature')
          }

          let event: Stripe.Event

          try {
            event = stripeClient.webhooks.constructEvent(
              body,
              signature,
              options.stripeWebhookSecret
            )
          } catch (err) {
            throw new Error(`Webhook signature verification failed: ${err}`)
          }

          // Handle different event types
          switch (event.type) {
            case 'customer.subscription.created':
              if (options.onSubscriptionCreated) {
                await options.onSubscriptionCreated(event.data.object as Stripe.Subscription)
              }
              break

            case 'customer.subscription.updated':
              if (options.onSubscriptionUpdated) {
                await options.onSubscriptionUpdated(event.data.object as Stripe.Subscription)
              }
              break

            case 'customer.subscription.deleted':
              if (options.onSubscriptionDeleted) {
                await options.onSubscriptionDeleted(event.data.object as Stripe.Subscription)
              }
              break

            case 'invoice.payment_succeeded':
              if (options.onInvoicePaymentSucceeded) {
                await options.onInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
              }
              break

            case 'invoice.payment_failed':
              if (options.onInvoicePaymentFailed) {
                await options.onInvoicePaymentFailed(event.data.object as Stripe.Invoice)
              }
              break

            default:
              console.log(`Unhandled event type: ${event.type}`)
          }

          return { received: true }
        },
      },
    },
  }
}
```

### Subscription Event Handlers

```typescript
// packages/auth/utils/stripe-handlers.ts

import { log } from '@libra/common'
import { createOrUpdateSubscriptionLimit, deactivateSubscriptionLimit } from '@libra/auth/utils/subscription-limits'
import type Stripe from 'stripe'

/**
 * Handle subscription creation
 */
export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const context = {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
    operation: 'subscription_created'
  }

  log.subscription('info', 'Processing subscription creation', context)

  try {
    // Get organization ID from subscription metadata
    const organizationId = subscription.metadata?.organizationId
    if (!organizationId) {
      throw new Error('Organization ID not found in subscription metadata')
    }

    // Get plan information
    const priceId = subscription.items.data[0]?.price.id
    const planName = subscription.items.data[0]?.price.nickname || 'Unknown Plan'

    // Calculate period dates
    const periodStart = new Date(subscription.current_period_start * 1000)
    const periodEnd = new Date(subscription.current_period_end * 1000)

    // Create subscription limit record
    await createOrUpdateSubscriptionLimit(
      organizationId,
      subscription.customer as string,
      planName,
      periodStart,
      periodEnd,
      {
        // Default quotas - should be configured based on plan
        aiNums: 1000,
        enhanceNums: 500,
        uploadLimit: 100,
        seats: subscription.quantity || 1,
        projectNums: 10,
      }
    )

    log.subscription('info', 'Subscription creation completed', {
      ...context,
      organizationId,
      planName,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    })

  } catch (error) {
    log.subscription('error', 'Failed to handle subscription creation', context, error as Error)
    throw error
  }
}

/**
 * Handle subscription updates
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const context = {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
    operation: 'subscription_updated'
  }

  log.subscription('info', 'Processing subscription update', context)

  try {
    const organizationId = subscription.metadata?.organizationId
    if (!organizationId) {
      throw new Error('Organization ID not found in subscription metadata')
    }

    if (subscription.status === 'active') {
      // Update active subscription
      const planName = subscription.items.data[0]?.price.nickname || 'Unknown Plan'
      const periodStart = new Date(subscription.current_period_start * 1000)
      const periodEnd = new Date(subscription.current_period_end * 1000)

      await createOrUpdateSubscriptionLimit(
        organizationId,
        subscription.customer as string,
        planName,
        periodStart,
        periodEnd,
        {
          aiNums: 1000,
          enhanceNums: 500,
          uploadLimit: 100,
          seats: subscription.quantity || 1,
          projectNums: 10,
        }
      )
    } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
      // Deactivate subscription
      await deactivateSubscriptionLimit(organizationId, subscription.customer as string)
    }

    log.subscription('info', 'Subscription update completed', {
      ...context,
      organizationId,
      status: subscription.status,
    })

  } catch (error) {
    log.subscription('error', 'Failed to handle subscription update', context, error as Error)
    throw error
  }
}

/**
 * Handle subscription deletion
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const context = {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
    operation: 'subscription_deleted'
  }

  log.subscription('info', 'Processing subscription deletion', context)

  try {
    const organizationId = subscription.metadata?.organizationId
    if (!organizationId) {
      throw new Error('Organization ID not found in subscription metadata')
    }

    // Deactivate subscription limit
    await deactivateSubscriptionLimit(organizationId, subscription.customer as string)

    log.subscription('info', 'Subscription deletion completed', {
      ...context,
      organizationId,
    })

  } catch (error) {
    log.subscription('error', 'Failed to handle subscription deletion', context, error as Error)
    throw error
  }
}
```

## Quota Management System

### Core Quota Functions

```typescript
// packages/auth/utils/subscription-limits.ts

import { log } from '@libra/common'
import { getDbAsync } from '@libra/db'
import { subscriptionLimit } from '@libra/db/schema/project-schema'
import { and, eq, sql } from 'drizzle-orm'

/**
 * Check and update AI message usage
 * Implements atomic quota deduction with automatic refresh for FREE plans
 */
export async function checkAndUpdateAIMessageUsage(organizationId: string): Promise<boolean> {
  const context = {
    organizationId,
    operation: 'checkAndUpdateAIMessageUsage'
  }

  log.subscription('info', 'Starting AI message quota check', context)

  try {
    const db = await getDbAsync()

    return await db.transaction(async (tx) => {
      // Get current active subscription limit
      const [currentLimit] = await tx
        .select()
        .from(subscriptionLimit)
        .where(
          and(
            eq(subscriptionLimit.organizationId, organizationId),
            eq(subscriptionLimit.isActive, true)
          )
        )
        .limit(1)

      if (!currentLimit) {
        log.subscription('warn', 'No active subscription limit found', context)
        return false
      }

      const now = new Date()
      const periodEnd = new Date(currentLimit.periodEnd)

      // Check if FREE plan needs refresh
      if (currentLimit.planName.toLowerCase().includes('free') && periodEnd < now) {
        log.subscription('info', 'FREE plan quota refresh needed', {
          ...context,
          planName: currentLimit.planName,
          periodEnd: periodEnd.toISOString(),
          currentTime: now.toISOString()
        })

        // Refresh FREE plan quota
        const newPeriodStart = new Date()
        const newPeriodEnd = new Date()
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

        await tx
          .update(subscriptionLimit)
          .set({
            aiNums: 50, // Reset to FREE plan limit
            enhanceNums: 10,
            uploadLimit: 5,
            periodStart: newPeriodStart.toISOString(),
            periodEnd: newPeriodEnd.toISOString(),
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(subscriptionLimit.id, currentLimit.id))

        // Deduct 1 from refreshed quota
        const [updatedLimit] = await tx
          .update(subscriptionLimit)
          .set({
            aiNums: sql`${subscriptionLimit.aiNums} - 1`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(
            and(
              eq(subscriptionLimit.id, currentLimit.id),
              sql`${subscriptionLimit.aiNums} >= 1`
            )
          )
          .returning()

        if (!updatedLimit) {
          log.subscription('warn', 'Failed to deduct from refreshed quota', context)
          return false
        }

        log.subscription('info', 'FREE plan quota refreshed and deducted', {
          ...context,
          newQuota: updatedLimit.aiNums,
          newPeriodEnd: newPeriodEnd.toISOString()
        })

        return true
      }

      // For active subscriptions (including non-expired FREE plans)
      if (currentLimit.aiNums <= 0) {
        log.subscription('warn', 'AI message quota exhausted', {
          ...context,
          currentQuota: currentLimit.aiNums,
          planName: currentLimit.planName
        })
        return false
      }

      // Atomic quota deduction
      const [updatedLimit] = await tx
        .update(subscriptionLimit)
        .set({
          aiNums: sql`${subscriptionLimit.aiNums} - 1`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(
          and(
            eq(subscriptionLimit.id, currentLimit.id),
            sql`${subscriptionLimit.aiNums} >= 1`
          )
        )
        .returning()

      if (!updatedLimit) {
        log.subscription('warn', 'Concurrent quota deduction conflict', context)
        return false
      }

      log.subscription('info', 'AI message quota deducted successfully', {
        ...context,
        remainingQuota: updatedLimit.aiNums,
        planName: currentLimit.planName
      })

      return true
    })

  } catch (error) {
    log.subscription('error', 'AI message quota check failed', context, error as Error)
    return false
  }
}

/**
 * Check and update project usage quota
 */
export async function checkAndUpdateProjectUsage(organizationId: string): Promise<boolean> {
  const context = {
    organizationId,
    operation: 'checkAndUpdateProjectUsage'
  }

  log.subscription('info', 'Starting project quota check', context)

  try {
    const db = await getDbAsync()

    return await db.transaction(async (tx) => {
      const [currentLimit] = await tx
        .select()
        .from(subscriptionLimit)
        .where(
          and(
            eq(subscriptionLimit.organizationId, organizationId),
            eq(subscriptionLimit.isActive, true)
          )
        )
        .limit(1)

      if (!currentLimit) {
        log.subscription('warn', 'No active subscription limit found', context)
        return false
      }

      if (currentLimit.projectNums <= 0) {
        log.subscription('warn', 'Project quota exhausted', {
          ...context,
          currentQuota: currentLimit.projectNums,
          planName: currentLimit.planName
        })
        return false
      }

      // Atomic quota deduction
      const [updatedLimit] = await tx
        .update(subscriptionLimit)
        .set({
          projectNums: sql`${subscriptionLimit.projectNums} - 1`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(
          and(
            eq(subscriptionLimit.id, currentLimit.id),
            sql`${subscriptionLimit.projectNums} >= 1`
          )
        )
        .returning()

      if (!updatedLimit) {
        log.subscription('warn', 'Concurrent project quota deduction conflict', context)
        return false
      }

      log.subscription('info', 'Project quota deducted successfully', {
        ...context,
        remainingQuota: updatedLimit.projectNums,
        planName: currentLimit.planName
      })

      return true
    })

  } catch (error) {
    log.subscription('error', 'Project quota check failed', context, error as Error)
    return false
  }
}

/**
 * Restore project quota on deletion
 */
export async function restoreProjectQuotaOnDeletion(organizationId: string): Promise<boolean> {
  const context = {
    organizationId,
    operation: 'restoreProjectQuotaOnDeletion'
  }

  log.subscription('info', 'Starting project quota restoration', context)

  try {
    const db = await getDbAsync()

    const [updatedLimit] = await db
      .update(subscriptionLimit)
      .set({
        projectNums: sql`${subscriptionLimit.projectNums} + 1`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(subscriptionLimit.organizationId, organizationId),
          eq(subscriptionLimit.isActive, true)
        )
      )
      .returning()

    if (!updatedLimit) {
      log.subscription('warn', 'No active subscription found for quota restoration', context)
      return false
    }

    log.subscription('info', 'Project quota restored successfully', {
      ...context,
      restoredQuota: updatedLimit.projectNums,
      planName: updatedLimit.planName
    })

    return true

  } catch (error) {
    log.subscription('error', 'Project quota restoration failed', context, error as Error)
    return false
  }
}
```

## API Routes Detailed

### Stripe Routes

```typescript
// packages/api/src/router/stripe.ts

export const stripeRouter = {
  // Get user plans
  getUserPlans: publicProcedure.query(async ({ ctx }) => {
    const auth = await initAuth()
    const sessionData = await auth.api.getSession({ headers: await headers() })
    const user = sessionData?.user

    // Get all available plans
    const planPrices = await db
      .select({
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          limits: plan.limits,
          marketing_features: plan.marketing_features,
        },
        price: {
          id: price.id,
          amount: price.amount,
          currency: price.currency,
          interval: price.interval,
        },
      })
      .from(plan)
      .leftJoin(price, eq(plan.id, price.planId))
      .where(eq(plan.isActive, true))

    let currentUserPlans: string[] = ['FREE']
    let primaryPlan = 'FREE'

    if (user) {
      try {
        const activeOrg = await getActiveOrganization(user.id)
        if (activeOrg?.id) {
          const userSubscriptions = await db
            .select()
            .from(subscription)
            .where(
              and(
                eq(subscription.referenceId, activeOrg.id),
                eq(subscription.status, 'active')
              )
            )

          if (userSubscriptions.length > 0) {
            currentUserPlans = userSubscriptions.map(sub => sub.plan)
            primaryPlan = userSubscriptions[0]?.plan || 'FREE'
          }
        }
      } catch (error) {
        console.error('Error getting user current plan:', error)
        currentUserPlans = ['FREE']
        primaryPlan = 'FREE'
      }
    }

    const hasPaidSubscription = currentUserPlans.some(
      (plan) => !plan.toLowerCase().includes('free')
    )

    return {
      code: 'SUCCESS',
      data: mapToPlans(planPrices, primaryPlan),
      currentUserPlan: primaryPlan,
      currentUserPlans,
      hasPaidSubscription,
    }
  }),

  // Create portal session
  createPortalSession: organizationProcedure.mutation(async (opts) => {
    const { session, db } = opts.ctx
    const userId = session.user.id

    const [userData] = await db.select().from(user).where(eq(user.id, userId))

    if (!userData?.stripeCustomerId) {
      throw new Error('User does not have a valid payment customer ID')
    }

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: getURL('dashboard'),
      })

      return {
        code: 'SUCCESS',
        data: { url: portalSession.url },
      }
    } catch (err) {
      console.error('Failed to create portal session:', err)
      throw new Error('Unable to create billing portal session')
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

### Quota Error Handling

```typescript
// packages/auth/utils/error-handling.ts

export class QuotaExceededError extends Error {
  constructor(
    public quotaType: string,
    public currentUsage: number,
    public limit: number,
    public organizationId: string
  ) {
    super(`${quotaType} quota exceeded: ${currentUsage}/${limit}`)
    this.name = 'QuotaExceededError'
  }
}

export class SubscriptionNotFoundError extends Error {
  constructor(public organizationId: string) {
    super(`No active subscription found for organization: ${organizationId}`)
    this.name = 'SubscriptionNotFoundError'
  }
}

/**
 * Centralized quota error handler
 */
export function handleQuotaError(error: unknown, context: Record<string, any>) {
  if (error instanceof QuotaExceededError) {
    log.subscription('warn', 'Quota exceeded', {
      ...context,
      quotaType: error.quotaType,
      currentUsage: error.currentUsage,
      limit: error.limit,
      organizationId: error.organizationId,
    })

    return {
      success: false,
      error: 'QUOTA_EXCEEDED',
      message: error.message,
      details: {
        quotaType: error.quotaType,
        currentUsage: error.currentUsage,
        limit: error.limit,
      },
    }
  }

  if (error instanceof SubscriptionNotFoundError) {
    log.subscription('warn', 'Subscription not found', {
      ...context,
      organizationId: error.organizationId,
    })

    return {
      success: false,
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: error.message,
    }
  }

  // Generic error handling
  log.subscription('error', 'Unexpected quota operation error', context, error as Error)

  return {
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  }
}

/**
 * Retry mechanism for quota operations
 */
export async function retryQuotaOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry quota exceeded errors
      if (error instanceof QuotaExceededError) {
        throw error
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError!
}
```

## Testing and Development

### Unit Tests

```typescript
// packages/auth/utils/__tests__/subscription-limits.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { checkAndUpdateAIMessageUsage, createOrUpdateSubscriptionLimit } from '../subscription-limits'

describe('Subscription Limits', () => {
  let testOrganizationId: string

  beforeEach(async () => {
    testOrganizationId = `test-org-${Date.now()}`
  })

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData(testOrganizationId)
  })

  it('should deduct AI message quota successfully', async () => {
    // Create test subscription limit
    await createOrUpdateSubscriptionLimit(
      testOrganizationId,
      null,
      'libra pro',
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      { aiNums: 100, seats: 1, projectNums: 5 }
    )

    // Test quota deduction
    const success = await checkAndUpdateAIMessageUsage(testOrganizationId)
    expect(success).toBe(true)

    // Verify quota was deducted
    const usage = await getSubscriptionUsage(testOrganizationId)
    expect(usage.aiNums).toBe(99)
  })

  it('should handle quota exhaustion', async () => {
    // Create subscription with 0 quota
    await createOrUpdateSubscriptionLimit(
      testOrganizationId,
      null,
      'libra pro',
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      { aiNums: 0, seats: 1, projectNums: 5 }
    )

    // Test quota deduction should fail
    const success = await checkAndUpdateAIMessageUsage(testOrganizationId)
    expect(success).toBe(false)
  })

  it('should refresh FREE plan quota when expired', async () => {
    // Create expired FREE plan
    const pastDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
    await createOrUpdateSubscriptionLimit(
      testOrganizationId,
      null,
      'libra free',
      pastDate,
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      { aiNums: 0, seats: 1, projectNums: 1 }
    )

    // Attempt to use quota (should trigger refresh)
    const success = await checkAndUpdateAIMessageUsage(testOrganizationId)
    expect(success).toBe(true)

    // Verify quota was refreshed
    const usage = await getSubscriptionUsage(testOrganizationId)
    expect(usage.aiNums).toBe(49) // Refreshed to 50, deducted 1
  })

  it('should handle concurrent quota deductions', async () => {
    // Create subscription with limited quota
    await createOrUpdateSubscriptionLimit(
      testOrganizationId,
      null,
      'libra pro',
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      { aiNums: 5, seats: 1, projectNums: 5 }
    )

    // Simulate concurrent requests
    const promises = Array.from({ length: 10 }, () =>
      checkAndUpdateAIMessageUsage(testOrganizationId)
    )

    const results = await Promise.all(promises)
    const successCount = results.filter(Boolean).length

    // Only 5 should succeed due to quota limit
    expect(successCount).toBe(5)

    // Verify final quota
    const usage = await getSubscriptionUsage(testOrganizationId)
    expect(usage.aiNums).toBe(0)
  })
})
```

```typescript
// packages/auth/utils/__tests__/stripe-integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Stripe from 'stripe'
import { handleSubscriptionCreated, handleSubscriptionUpdated } from '../stripe-handlers'

describe('Stripe Integration', () => {
  let stripe: Stripe
  let testCustomerId: string
  let testOrganizationId: string

  beforeAll(async () => {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-05-28.basil',
    })

    testOrganizationId = `test-org-${Date.now()}`

    // Create test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: { organizationId: testOrganizationId },
    })
    testCustomerId = customer.id
  })

  afterAll(async () => {
    // Clean up test customer
    if (testCustomerId) {
      await stripe.customers.del(testCustomerId)
    }
    await cleanupTestData(testOrganizationId)
  })

  it('should handle subscription creation webhook', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_test123',
      customer: testCustomerId,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      metadata: {
        organizationId: testOrganizationId,
      },
      items: {
        data: [
          {
            price: {
              id: 'price_test123',
              nickname: 'Pro Plan',
            },
          },
        ],
      } as any,
      quantity: 1,
    }

    await handleSubscriptionCreated(mockSubscription as Stripe.Subscription)

    // Verify subscription limit was created
    const usage = await getSubscriptionUsage(testOrganizationId)
    expect(usage.plan).toBe('Pro Plan')
    expect(usage.aiNumsLimit).toBeGreaterThan(0)
  })

  it('should handle subscription status changes', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_test456',
      customer: testCustomerId,
      status: 'canceled',
      metadata: {
        organizationId: testOrganizationId,
      },
    }

    await handleSubscriptionUpdated(mockSubscription as Stripe.Subscription)

    // Verify subscription was deactivated
    const usage = await getSubscriptionUsage(testOrganizationId)
    expect(usage.plan).toBe('FREE')
  })
})
```

### Development Debugging

```typescript
// Development debugging utilities
import { log } from '@libra/common'

export async function debugQuotaStatus(organizationId: string) {
  const usage = await getSubscriptionUsage(organizationId)

  log.subscription('debug', 'Quota status debug', {
    organizationId,
    usage,
    operation: 'debug_quota_status'
  })

  return usage
}

// Add debug endpoint in development
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/quota/:orgId', async (req, res) => {
    const usage = await debugQuotaStatus(req.params.orgId)
    res.json(usage)
  })
}
```

### Performance Monitoring

```typescript
// Quota operation performance monitoring
import { performance } from 'perf_hooks'

export async function checkAndUpdateAIMessageUsageWithTiming(organizationId: string) {
  const start = performance.now()

  try {
    const result = await checkAndUpdateAIMessageUsage(organizationId)
    const duration = performance.now() - start

    log.subscription('info', 'Quota deduction timing', {
      organizationId,
      duration: `${duration.toFixed(2)}ms`,
      result,
      operation: 'quota_deduction_timing'
    })

    // Log warning if operation takes too long
    if (duration > 1000) {
      log.subscription('warn', 'Slow quota deduction detected', {
        organizationId,
        duration: `${duration.toFixed(2)}ms`,
        operation: 'slow_quota_deduction'
      })
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    log.subscription('error', 'Quota deduction failed', {
      organizationId,
      duration: `${duration.toFixed(2)}ms`,
      operation: 'quota_deduction_error'
    }, error as Error)
    throw error
  }
}
```

## Summary

This better-auth + Stripe integration solution provides:

1. **Powerful Subscription Management**: Supports multiple plan types and flexible quota systems
2. **High-Performance Quota System**: Atomic operations + transaction processing ensures data consistency
3. **Comprehensive Error Handling**: Covers various scenarios including quota exhaustion and payment failures
4. **Developer-Friendly**: Detailed logging and debugging tools
5. **Production-Ready**: Supports Cloudflare Workers deployment

By following these patterns and best practices, you can build a stable and reliable SaaS subscription system.
