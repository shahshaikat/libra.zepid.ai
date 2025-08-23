# @libra/better-auth-stripe

> Stripe integration plugin for Better Auth with complete subscription management

[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](#)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Private Package](https://img.shields.io/badge/package-private-red.svg)](#)

A comprehensive Stripe integration plugin for Better Auth that provides complete subscription management, customer handling, and payment processing capabilities for SaaS applications. This package is part of the Zepid AI platform monorepo and is specifically designed for Libra's subscription and quota management system.

## 🚀 Features

- **🔄 Subscription Management** - Complete lifecycle management (create, upgrade, cancel, restore)
- **👥 Customer Management** - Automatic Stripe customer creation and synchronization
- **🔗 Webhook Handling** - Secure processing of Stripe events with Better Auth integration
- **💳 Billing Portal** - Integrated Stripe customer portal access
- **🏢 Multi-tenant** - Organization-based subscription management (Libra's core model)
- **💺 Quota Management** - AI usage, project limits, and seat management
- **📊 Usage Tracking** - Real-time quota tracking and enforcement
- **🔄 Auto-renewal** - FREE plan quota refresh and paid plan management
- **🔒 Type Safe** - Full TypeScript support with comprehensive type definitions

## 📦 Installation

```bash
# Note: This is a private package within the Libra monorepo
# It's not published to npm and is used internally

# For development within the monorepo:
bun install  # Install all dependencies from workspace root

# Peer dependencies (installed at workspace root):
# - better-auth ^1.3.1
# - stripe (latest)
# - zod (latest)
# - @libra/common (workspace package)
```

## 🏃‍♂️ Quick Start

### 1. Environment Setup

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database Configuration (Better Auth uses multiple databases)
DATABASE_URL=postgresql://...  # PostgreSQL for project data
DATABASE=auth.db               # SQLite for authentication data

# Better Auth Configuration
BETTER_AUTH_SECRET=your-32-character-secret-key
```

### 2. Server Configuration

```typescript
import { betterAuth } from "better-auth"
import { stripe } from "@libra/better-auth-stripe"
import Stripe from "stripe"

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil", // Current API version used in Libra
})

export const auth = betterAuth({
  database: {
    provider: "sqlite", // Libra uses SQLite for auth data
    url: process.env.DATABASE || "auth.db",
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "libra pro",
            priceId: "price_pro_monthly",
            limits: { aiNums: 1000, seats: 5, projectNums: 10 },
          },
          {
            name: "libra max",
            priceId: "price_max_monthly",
            limits: { aiNums: 5000, seats: 20, projectNums: 50 },
          },
        ],
      },
    }),
  ],
})
```

### 3. Client Setup

```typescript
import { createAuthClient } from "better-auth/react"
import { stripeClient } from "@libra/better-auth-stripe/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || '',
  plugins: [stripeClient({ subscription: true })],
})

export const {
  signIn,
  signOut,
  useSession,
  // Stripe-specific methods
  subscription: {
    upgrade: authClient.subscription.upgrade,
    cancel: authClient.subscription.cancel,
    list: authClient.subscription.list,
    restore: authClient.subscription.restore,
  }
} = authClient
```

### 4. Subscription Management

```typescript
// Upgrade subscription
const upgradeSubscription = async () => {
  const response = await fetch('/api/auth/subscription/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: 'Pro',
      successUrl: '/dashboard/success',
      cancelUrl: '/dashboard/billing',
    }),
  })
  
  const { url, redirect } = await response.json()
  if (redirect && url) window.location.href = url
}

// Cancel subscription
const cancelSubscription = async () => {
  const response = await fetch('/api/auth/subscription/cancel', {
    method: 'POST',
    body: JSON.stringify({ returnUrl: '/dashboard/billing' }),
  })
  
  const { url } = await response.json()
  window.location.href = url
}

// List subscriptions
const getSubscriptions = async () => {
  const response = await fetch('/api/auth/subscription/list')
  return response.json()
}
```

## 🔗 Webhook Setup

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Create a new webhook endpoint: `https://yourdomain.com/api/auth/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

> **Important**: The webhook endpoint must match the Better Auth route structure. In Libra, this is handled automatically by the Better Auth Stripe plugin.

> **Note**: The webhook endpoint is automatically created by the plugin at `/stripe/webhook` when the plugin is configured.

## 📊 Database Schema

The plugin automatically extends the Better Auth schema with the following fields:

```sql
-- Subscription management (Better Auth schema format)
CREATE TABLE subscription (
    id TEXT PRIMARY KEY,
    plan TEXT NOT NULL,
    referenceId TEXT NOT NULL,        -- Note: camelCase in actual schema
    stripeCustomerId TEXT,            -- Note: camelCase in actual schema
    stripeSubscriptionId TEXT,        -- Note: camelCase in actual schema
    status TEXT DEFAULT 'incomplete',
    periodStart TIMESTAMP,            -- Note: camelCase in actual schema
    periodEnd TIMESTAMP,              -- Note: camelCase in actual schema
    cancelAtPeriodEnd BOOLEAN DEFAULT false, -- Note: camelCase in actual schema
    seats INTEGER
);

-- User extension
ALTER TABLE user ADD COLUMN stripeCustomerId TEXT; -- Note: camelCase in actual schema
```

## 🏗️ Architecture

```text
@libra/better-auth-stripe/
├── src/
│   ├── index.ts          # Main plugin with all endpoints
│   ├── client.ts         # Client-side plugin
│   ├── hooks.ts          # Webhook event handlers
│   ├── schema.ts         # Database schema definitions
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions
├── dist/                 # Compiled output
├── DEV.md               # English development guide
├── DEV_ZH.md            # Chinese development guide
├── package.json         # Package configuration
├── tsconfig.json        # TypeScript configuration
└── tsup.config.ts       # Build configuration
```

> **Note**: This package integrates deeply with Libra's subscription system and works in conjunction with `@libra/auth` for quota management and organization-based billing.

## 📚 Documentation

- **[Development Guide (中文)](DEV_ZH.md)** - 完整的中文开发指南
- **[Development Guide (English)](./DEV.md)** - Complete English development guide
- **[Stripe Documentation](https://stripe.com/docs)** - Official Stripe documentation
- **[Better Auth Documentation](https://better-auth.com)** - Official Better Auth documentation

## 🔧 Advanced Features

### Organization Subscriptions

```typescript
stripe({
  subscription: {
    enabled: true,
    // Authorize access to organization subscriptions
    authorizeReference: async ({ user, referenceId }) => {
      const org = await getOrganization(referenceId)
      return org.ownerId === user.id || org.members.includes(user.id)
    },
    // Organization-specific configuration
    organization: {
      enabled: true,
    },
    // Custom checkout parameters
    getCheckoutSessionParams: async ({ user, plan, referenceId }) => ({
      params: {
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          organizationId: referenceId,
          userId: user.id,
        },
      },
    }),
  },
})
```

### Free Trials

```typescript
{
  name: "libra pro",
  priceId: "price_pro",
  freeTrial: {
    days: 14,
    onTrialStart: async (subscription) => {
      await sendTrialStartEmail(subscription)
    },
    onTrialEnd: async ({ subscription }) => {
      await sendTrialEndEmail(subscription)
    },
  },
}
```

### Custom Checkout Parameters

```typescript
stripe({
  subscription: {
    enabled: true,
    getCheckoutSessionParams: async ({ user, plan, referenceId }) => ({
      params: {
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
        metadata: {
          userId: user.id,
          planName: plan.name,
          organizationId: referenceId,
        },
      },
      options: {
        // Stripe request options if needed
      },
    }),
  },
})
```

## 🧪 Testing

```bash
# Install Stripe CLI for webhook testing
brew install stripe/stripe-cli/stripe

# Forward webhooks to local development (correct endpoint)
stripe listen --forward-to localhost:3000/api/auth/stripe/webhook

# Run tests (Note: Currently no dedicated test files in this package)
# Tests are primarily integration tests in the main auth package
bun test

# Run type checking
bun run typecheck
```

> **Note**: This package currently relies on integration testing through the main `@libra/auth` package rather than having dedicated unit tests. The testing examples in the documentation refer to the broader Stripe integration testing patterns used across the Libra platform.

## 🤝 Contributing

We welcome contributions! Please see our [Code of Conduct](../../code_of_conduct.md) and [Technical Guidelines](../../TECHNICAL_GUIDELINES.md) for details.

## 📄 License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](../../LICENSE) file for details.

## 🆘 Support

- 📖 [Development Guide](./DEV.md) - Comprehensive development documentation
- 📖 [中文开发指南](./DEV_ZH.md) - Chinese development guide
- 🐛 [Issues](https://github.com/libra-ai/libra/issues) - Report bugs or request features
- 💬 [Discussions](https://github.com/libra-ai/libra/discussions) - Community discussions

---

Built with ❤️ by the Libra team.