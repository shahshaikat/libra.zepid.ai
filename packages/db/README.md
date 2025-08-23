# @libra/db

A modern, type-safe database management package providing unified business data access layer for the entire Zepid application.

## ✨ Features

- 🎯 **Type-Safe Operations** - Complete type safety with Drizzle ORM
- ⚡ **High Performance** - Cloudflare Hyperdrive acceleration & connection pooling
- 🔄 **Environment Adaptive** - Seamless dev/production environment switching
- 🧩 **Modular Architecture** - Domain-separated schema definitions
- 🛡️ **Enterprise Ready** - Migration management, performance monitoring, security

## 🚀 Quick Start

### Environment Setup

```bash
# Development environment
POSTGRES_URL=postgresql://username:password@localhost:5432/libra_dev

# Production uses Cloudflare Hyperdrive automatically
```

### Basic Usage

```typescript
import { getDbAsync, project, projectAIUsage } from '@libra/db'
import { eq, and, desc } from 'drizzle-orm'

// Get database connection
const db = await getDbAsync()

// Create a new project
const newProject = await db.insert(project).values({
  name: 'My Project',
  templateType: 'nextjs',
  userId: 'user_123',
  organizationId: 'org_456'
}).returning()

// Query projects
const userProjects = await db
  .select()
  .from(project)
  .where(and(
    eq(project.userId, 'user_123'),
    eq(project.isActive, true)
  ))
  .orderBy(desc(project.createdAt))
```

### Database Operations

```bash
# Generate migration files
bun db:generate

# Execute migrations
bun db:migrate
```

## 🏗️ Architecture

### Technology Stack
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Enterprise-grade database
- **Cloudflare Hyperdrive** - Connection acceleration
- **React Cache** - Server-side connection optimization

### Data Models
- **Projects** - Core project management
- **AI Usage** - Usage tracking and limits
- **Subscriptions** - Billing and resource limits
- **Components** - UI component library

## 📁 Schema Structure

```
schema/
├── project-schema.ts     # Project management tables
└── components-schema.ts  # Component library tables
```

## 🔧 Core Functions

- **Environment Detection** - Auto-switch between dev/prod configurations
- **Connection Pooling** - Optimized PostgreSQL connection management
- **Type Generation** - Auto-generated TypeScript types from schema
- **Migration Management** - Version-controlled database schema changes
- **Transaction Support** - ACID-compliant complex operations

## 📖 Documentation

- **[DEV-ZH.md](DEV_ZH.md)** - Detailed Chinese documentation
- **[DEV.md](./DEV.md)** - Detailed English documentation

## 🤝 Contributing

Contributions are welcome! Please see the development documentation for guidelines on:

- Adding new schema definitions
- Database query best practices
- Performance optimization techniques
- Migration file management

## 📄 License

AGPL-3.0 License - see the project root for details.

---

**Zepid DB - Type-Safe Database Operations Made Simple** ✨ 