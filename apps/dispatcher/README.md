# Libra Dispatcher Service

![version](https://img.shields.io/badge/version-0.0.0-blue)
![license](https://img.shields.io/badge/license-AGPL--3.0-green)

---

## Overview

**@libra/dispatcher** is a Cloudflare Workers–powered request routing layer that maps wildcard sub-domains, custom domains, and RESTful paths to their target Worker applications. It delivers global, low-latency dispatch with enterprise-grade security.

* Edge-first serverless architecture on Cloudflare Workers
* Built with TypeScript 5.x and Hono v4.8+
* Smart routing for `*.zapid.dev`, custom domains and query dispatch
* Enterprise authentication via **@libra/auth** (better-auth)
* Structured logging, health checks and quota-aware rate limiting

## Features

| Category | Highlights |
|----------|------------|
| **Routing Engine** | Wildcard sub-domain, custom domain, path & query dispatch |
| **Security** | Bearer token auth, CORS, input validation, reserved sub-domain guard |
| **Observability** | Health endpoints, structured logs, request tracing |
| **Developer UX** | Hot-reload dev server (Wrangler), Biome linting, Bun scripts |
| **Database Support** | Cloudflare D1 (custom domain lookup) + Hyperdrive pool |
| **Scalability** | Runs at 300+ Cloudflare PoPs, zero cold-starts |

## Directory Structure (short)

```text
apps/dispatcher/
├── src/
│   ├── routes/     # health | dispatch
│   ├── utils/      # routing | validation | custom-domain helpers
│   ├── auth.ts     # better-auth config (simplified)
│   └── index.ts    # Worker entry & global middleware
├── DEPLOYMENT.md   # Deployment guide
├── wrangler.jsonc  # Worker configuration
└── .dev.vars.example
```

## Quick Start (Development)

```bash
# 1. Install repo dependencies
bun install

# 2. Prepare environment variables
cp apps/dispatcher/.dev.vars.example apps/dispatcher/.dev.vars
nano apps/dispatcher/.dev.vars

# 3. Launch local dev server (port 3007)
cd apps/dispatcher
bun dev
```

Key URLs:

* Health Check: <http://localhost:3007/health>
* Example Dispatch: <http://localhost:3007/dispatch?worker=your-worker>

**Example – Sub-domain Routing (production):**

```text
# DNS record: *.zapid.dev → zepid-dispatcher
# Request automatically routed to Worker "vite-shadcn-template"
https://vite-shadcn-template.zapid.dev/about
```

## Required Environment Variables

| Key | Description | Required |
|-----|-------------|----------|
| `BETTER_GITHUB_CLIENT_ID` | GitHub OAuth client ID for authentication | ✅ **Required** |
| `BETTER_GITHUB_CLIENT_SECRET` | GitHub OAuth client secret for authentication | ✅ **Required** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID for dispatcher operations | ✅ **Required** |
| `DATABASE_ID` | Cloudflare D1 database ID | ✅ **Required** |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token for operations | ✅ **Required** |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret for human verification | ✅ **Required** |
| `POSTGRES_URL` | PostgreSQL database connection string | 🔧 Optional |
| `STRIPE_SECRET_KEY` | Stripe payment processing secret key | 🔧 Optional |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret for payment events | 🔧 Optional |
| `RESEND_FROM` | Email sender address for notifications | 🔧 Optional |
| `RESEND_API_KEY` | Resend API key for email services | 🔧 Optional |

## Bun/NPM Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | `wrangler dev` with live reload (port 3007) |
| `bun run deploy` | Deploy to Cloudflare Workers with environment variables |
| `bun run cf-typegen` | Generate Cloudflare type definitions |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run with-env` | Run commands with environment variables |
| `bun update` | Upgrade dependencies |

## Deployment

```bash
# Authenticate once
wrangler auth login

# Deploy (prod)
bun run deploy
```

Add production routes (wildcard):

```bash
wrangler route add "*.zapid.dev/*" zepid-dispatcher-prod
```

## API & Routing Reference

### Authentication Matrix

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` | ❌ | Health / readiness probe |
| `ALL /dispatch/:worker/*` | ✅ | Path-based routing to target Worker |
| `ALL /dispatch?worker=` | ✅ | Query-based routing |
| `*.zapid.dev/*` (wildcard) | ✅/❌* | Sub-domain routing; your app decides |

> *Wildcard requests are forwarded to your application Worker, which can decide its own auth requirements.*

### Rate Limiting

Default Cloudflare WAF rules apply. Custom per-user limits can be configured via `createRateLimitMiddleware`.

## Troubleshooting

### Common Issues

#### Port already in use (3007)

```bash
# Kill existing process
lsof -ti:3007 | xargs kill -9
# Or use a different port
bun dev --port 3008
```

#### Environment variables not loading

```bash
# Ensure .dev.vars file exists and has correct format
cp apps/dispatcher/.dev.vars.example apps/dispatcher/.dev.vars
# Edit the file with your actual values
nano apps/dispatcher/.dev.vars
```

#### Wrangler authentication issues

```bash
# Re-authenticate with Cloudflare
wrangler auth login
# Verify authentication
wrangler whoami
```

#### Database connection errors

* Verify `DATABASE_ID` and `CLOUDFLARE_ACCOUNT_ID` are correct
* Check `POSTGRES_URL` format: `postgresql://user:password@host:port/database`
* Ensure Hyperdrive configuration is properly set up

#### Worker deployment fails

* Check `wrangler.jsonc` configuration
* Verify all required environment variables are set
* Ensure you have proper Cloudflare permissions

### Getting Help

* Check the [DEV.md](./DEV.md) for detailed development guide
* Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions
* Open an issue in the repository for bugs or feature requests

## Further Reading

* [DEV.md](./DEV.md) – Full English development guide
* [DEV_ZH.md](./DEV_ZH.md) – 完整中文开发指南
* [DEPLOYMENT.md](./DEPLOYMENT.md) – Deployment guide
* [DEPLOYMENT_ZH.md](./DEPLOYMENT_ZH.md) – 部署指南
* Cloudflare Workers Docs – <https://developers.cloudflare.com/workers/>
* Hono Framework – <https://hono.dev/>

---

© 2025 Libra AI. Licensed under AGPL-3.0.
