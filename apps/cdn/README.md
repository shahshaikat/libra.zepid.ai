# Libra CDN Service

[简体中文版本](./README_ZH.md)

![version](https://img.shields.io/badge/version-0.0.0-blue)
![license](https://img.shields.io/badge/license-AGPL--3.0-green)

---

## Overview

**@libra/cdn** is a Cloudflare Workers-based Content Delivery Network that powers secure file uploads, edge caching, image optimization and screenshot storage for Zepid AI applications.

* Edge-first serverless architecture on Cloudflare Workers
* Built with TypeScript 5.x and Hono v4.8+ framework
* Advanced integrations: R2 storage, KV metadata, D1 database, Cloudflare Images
* Enterprise authentication via **@libra/auth** with better-auth
* Intelligent quota management and rate limiting (1 upload/10s)

## Features

| Category | Highlights |
|----------|------------|
| **File Management** | SHA-256 deduplication, planId-based replacement, quota tracking |
| **Image Processing** | Cloudflare Images optimization, AVIF/WebP/JPEG/PNG support |
| **Screenshot Service** | Base64 storage, planId retrieval, public iframe access |
| **Developer Tools** | Component Inspector, "Made with Libra" badge, real-time debugging |
| **API Documentation** | OpenAPI 3.1 with Scalar UI at `/docs`, interactive testing |
| **Security & Performance** | Rate limiting, CORS protection, 30-day edge caching |

## Directory Structure (short)

```
apps/cdn/
├── src/            # Worker source
│   ├── routes/     # upload | image | screenshot | delete | badge
│   ├── schemas/    # Zod validation
│   ├── utils/      # file / quota / screenshot helpers
│   └── index.ts    # main entry & CORS
├── public/         # static assets (badge.js, logo.png)
└── wrangler.jsonc  # CF Worker config
```

## Quick Start (Development)

```bash
# 1. Install deps from mono-repo root
bun install

# 2. Copy env template and fill in values
cp apps/cdn/.dev.vars.example apps/cdn/.dev.vars
nano apps/cdn/.dev.vars

# 3. Start local dev server (port 3004)
cd apps/cdn
bun dev
```

Once running you can open:

* API Docs: <http://localhost:3004/docs>
* Component Inspector: <http://localhost:3004/inspector>

<details>
<summary>Example cURL – File Upload</summary>

```bash
curl -X PUT http://localhost:3004/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@example.jpg" \
  -F "planId=my_plan"
```

</details>

## Required Environment Variables

| Key | Description | Required |
|-----|-------------|----------|
| `BETTER_AUTH_SECRET` | JWT secret for authentication | ✅ **Required** |
| `POSTGRES_URL` | Database connection for quota tracking | ✅ **Required** |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID for Cloudflare Images | 🔧 Optional |
| `CLOUDFLARE_IMAGES_TOKEN` | Token for image optimization | 🔧 Optional |
| `HYPERDRIVE_ID` | Database connection pool ID | 🔧 Optional |
| `TURNSTILE_SECRET_KEY` | Human verification secret | 🔧 Optional |
| `RESEND_API_KEY` | Email notification service | 🔧 Optional |
| `LOG_LEVEL` | Logging verbosity (`debug`/`info`/`warn`/`error`) | 🔧 Optional |

## NPM/Bun Scripts

| Script | Description |
|--------|-------------|
| `bun dev` (alias `npm run dev`) | Run `wrangler dev` on port 3004 |
| `bun run deploy` | Deploy to Cloudflare |
| `bun run cf-typegen` | Generate type definitions for CF bindings |
| `bun update` | Update dependencies |

## Deployment

```bash
# Authenticate once
wrangler auth login

# Push to production (+ secrets)
bun run deploy
```

Custom domain example:

```bash
wrangler route add "cdn.zepid.dev/*" libra-cdn
```

## API Reference

### Authentication Matrix

| Endpoint | Authentication | Purpose |
|----------|---------------|---------|
| **Public Endpoints** | ❌ None | |
| `GET /` | ❌ | Health check |
| `GET /image/{key}` | ❌ | Image access (cached 30 days) |
| `GET /screenshot/{planId}` | ❌ | Screenshot key lookup (iframe support) |
| `GET /badge.js` | ❌ | "Made with Libra" badge script |
| `GET /docs` | ❌ | API documentation |
| `GET /openapi.json` | ❌ | OpenAPI specification |
| `GET /inspector` | ❌ | Component Inspector (dev only) |
| **Protected Endpoints** | ✅ Bearer Token | |
| `PUT /upload` | ✅ | File upload with quota enforcement |
| `POST /screenshot` | ✅ | Screenshot storage |
| `DELETE /file/{planId}` | ✅ | File deletion with quota restoration |

### Rate Limiting

- **File uploads**: 1 request per 10 seconds per user
- **Other endpoints**: No specific limits (Cloudflare default protection)

The complete OpenAPI 3.1 specification is served at `/openapi.json`. Interactive documentation with testing capabilities is available at `/docs`.

## Further Reading

* [DEV.md](./DEV.md) – Full English development guide
* [DEV_ZH.md](./DEV_ZH.md) – 完整中文开发指南
* Cloudflare Workers: <https://developers.cloudflare.com/workers/>
* Hono Framework: <https://hono.dev/>

## Component Inspector

A powerful debugging tool available at `/inspector` during development:

- **Real-time DOM inspection** with element selection
- **Component property viewer** with live updates
- **Shadow DOM isolation** for clean styling
- **Cross-origin iframe support** for safe preview
- **Element highlighting** with click-to-inspect

---

© 2025 Zepid AI. Licensed under AGPL-3.0.
