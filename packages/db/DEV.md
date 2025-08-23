# Zepid DB Package

Zepid DB is a modern core package focused on database management, providing a unified, type-safe business data access layer for the entire application. Built on **Drizzle ORM**, it implements fully type-safe database operations and is deeply optimized for **Cloudflare** environments. It provides intelligent environment-adaptive connection solutions that can seamlessly switch between development and production environments, while leveraging Cloudflare Hyperdrive technology to significantly improve database performance in Serverless scenarios. Through centrally managed data model definitions and React caching mechanisms, it ensures the entire application uses consistent data structures and effectively prevents resource waste and connection leaks.

## 🚀 Core Features

### 🎯 Type-Safe Database Operations
- **Drizzle ORM Integration**: Fully type-safe database queries and operations
- **Automatic Type Inference**: Automatically generate TypeScript types from schema
- **Compile-time Checks**: Discover SQL errors and type mismatches at compile time
- **IntelliSense Support**: Complete code completion and type hints

### ⚡ High-Performance Database Connections
- **Cloudflare Hyperdrive**: Database connection acceleration in production environments
- **Connection Pool Management**: Intelligent PostgreSQL connection pool configuration
- **React Cache Optimization**: Prevents duplicate connection creation, improves performance
- **Serverless Optimization**: Connection strategies designed specifically for Serverless environments

### 🔄 Environment Adaptability
- **Automatic Environment Detection**: Intelligently recognizes development and production environments
- **Unified Configuration**: Same code automatically adapts to different environments
- **Hot Switching Support**: Switch database connections without restart
- **Environment Isolation**: Ensures complete isolation of development and production data

### 🧩 Modular Architecture
- **Schema Separation**: Separate data model definitions by business domain
- **Domain-Driven**: Independent modules for projects, components, subscriptions, etc.
- **High Extensibility**: Easy to add new business domains and data models
- **Dependency Management**: Clear inter-module dependency relationships

### 🛡️ Enterprise-Grade Features
- **Data Migration**: Complete database version control and migration management
- **Performance Monitoring**: Database connection and query performance tracking
- **Security**: SQL injection protection and access control
- **Audit Logs**: Complete data change tracking records

## 📁 Project Structure

```bash
packages/db/
├── DEV-ZH.md                 # Chinese development documentation
├── DEV.md                    # English development documentation
├── README.md                 # Package description documentation
├── package.json              # Package dependencies and script definitions
├── tsconfig.json             # TypeScript configuration
├── tsup.config.ts            # Build configuration
├── env.mjs                   # Environment variable configuration and validation
├── drizzle.config.ts         # Drizzle ORM configuration
├── index.ts                  # Main export file
├── cloudflare-env.d.ts       # Cloudflare environment type definitions
├── custom-domain-queries.ts  # Custom domain query functions
├── drizzle/                  # Drizzle ORM metadata
│   ├── 0000_*.sql           # Database migration SQL files
│   └── meta/                 # Migration metadata and version information
│       ├── 0000_snapshot.json # Database structure snapshots
│       └── _journal.json     # Migration history records
├── schema/                   # Database schema definitions
│   ├── project-schema.ts     # Project-related table structure definitions
│   └── components-schema.ts  # Component-related table structure definitions
└── utils/                    # Utility functions
    └── subscription.ts       # Subscription-related utility functions
```

## 🛠️ Technical Implementation

### Core Technology Stack
- **Drizzle ORM**: Modern TypeScript ORM providing type-safe database operations
- **PostgreSQL**: Enterprise-grade relational database
- **Cloudflare Hyperdrive**: Database connection acceleration service
- **React Cache**: Server-side component caching mechanism
- **Node.js pg**: High-performance PostgreSQL client

### Architecture Design
- **Connection Layer Abstraction**: Unified database connection interface
- **Environment Adaptation**: Automatic detection and adaptation to different deployment environments
- **Caching Strategy**: Multi-level database connection and query caching
- **Type System**: End-to-end TypeScript type safety

## 🚀 Installation and Configuration

### Environment Variable Configuration

```bash
# Development environment configuration (.env.local)
POSTGRES_URL=postgresql://username:password@localhost:5432/libra_dev

# Production environment configuration (Cloudflare)
# HYPERDRIVE connection will be automatically provided through Cloudflare environment
```

### Database Initialization

```bash
# Install dependencies
bun install

# Generate migration files
bun db:generate

# Execute database migrations
bun db:migrate

# Check database status
bun db:status
```

## 🔧 Core Functionality

### Database Connection Management

```typescript
// Async database connection (for Next.js applications)
import { getDbAsync } from '@libra/db'

export async function GET() {
  const db = await getDbAsync()
  const projects = await db.select().from(project)
  return Response.json(projects)
}

// Hono application database connection (for Cloudflare Workers)
import { getDbForHono } from '@libra/db'

export async function handler(c: Context) {
  const db = await getDbForHono(c)
  const projects = await db.select().from(project)
  return c.json(projects)
}

// Workflow application database connection
import { getDbForWorkflow } from '@libra/db'

export async function workflowHandler(env: any) {
  const db = await getDbForWorkflow(env)
  const projects = await db.select().from(project)
  return projects
}
```

### Type-Safe Query Operations

```typescript
import { getDbAsync, project, projectAIUsage } from '@libra/db'
import { eq, and, desc } from 'drizzle-orm'

// Query projects
const db = await getDbAsync()

// Create new project
const newProject = await db.insert(project).values({
  name: 'My New Project',
  templateType: 'nextjs',
  userId: 'user_123',
  organizationId: 'org_456',
  visibility: 'private'
}).returning()

// Query user projects
const userProjects = await db
  .select()
  .from(project)
  .where(and(
    eq(project.userId, 'user_123'),
    eq(project.isActive, true)
  ))
  .orderBy(desc(project.createdAt))

// Join query for projects and usage
const projectsWithUsage = await db
  .select({
    project: project,
    usage: projectAIUsage
  })
  .from(project)
  .leftJoin(projectAIUsage, eq(project.id, projectAIUsage.projectId))
  .where(eq(project.organizationId, 'org_456'))
```

### Transaction Operations

```typescript
import { getDbAsync } from '@libra/db'

const db = await getDbAsync()

// Transaction: Create project and initialize usage records
await db.transaction(async (tx) => {
  // Create project
  const [newProject] = await tx.insert(project).values({
    name: 'New Project',
    templateType: 'nextjs',
    userId: 'user_123',
    organizationId: 'org_456'
  }).returning()

  // Initialize AI usage records
  await tx.insert(projectAIUsage).values({
    projectId: newProject.id,
    organizationId: 'org_456',
    totalAIMessageCount: 0
  })
})
```

## 📊 Data Models

### Project Management Module

#### Project Table
Core information management table for projects.

```typescript
export const project = pgTable('project', {
  id: text('id').primaryKey().unique(),          // Project unique identifier
  name: text('name').notNull(),                  // Project name
  templateType: text('template_type').notNull(), // Template type
  url: text('url'),                              // Project access URL
  gitUrl: text('git_url'),                       // Git repository address
  gitBranch: text('git_branch'),                 // Git branch
  previewImageUrl: text('preview_image_url'),    // Preview image URL
  productionDeployUrl: text('production_deploy_url'), // Production deployment URL
  workflowId: text('workflow_id'),               // Workflow ID
  deploymentStatus: varchar('deployment_status', { // Deployment status
    enum: ['idle', 'preparing', 'deploying', 'deployed', 'failed']
  }).default('idle'),
  customDomain: text('custom_domain'),           // Custom domain
  customDomainStatus: varchar('custom_domain_status', { // Custom domain status
    enum: ['pending', 'verified', 'active', 'failed']
  }),
  customDomainVerifiedAt: timestamp('custom_domain_verified_at'), // Custom domain verification time
  customHostnameId: text('custom_hostname_id'),  // Custom hostname ID
  ownershipVerification: text('ownership_verification'), // Ownership verification
  sslStatus: varchar('ssl_status', {             // SSL status
    enum: ['pending', 'pending_validation', 'active', 'failed']
  }),
  visibility: varchar('visibility', { enum: ['public', 'private'] }), // Visibility
  isActive: boolean('is_active').default(true),  // Is active
  userId: text('user_id').notNull(),             // User ID
  organizationId: text('organization_id').notNull(), // Organization ID
  containerId: text('container_id'),             // Container ID
  initialMessage: text('initial_message'),       // Initial message
  knowledge: text('knowledge'),                  // Knowledge base content
  messageHistory: text('message_history').default('[]'), // Message history
  createdAt: timestamp('created_at'),            // Creation time
  updatedAt: timestamp('updated_at')             // Update time
})

// TypeScript types
type Project = typeof project.$inferSelect
type InsertProject = typeof project.$inferInsert
```

#### ProjectAIUsage Table
Project AI feature usage statistics table.

```typescript
export const projectAIUsage = pgTable('project_ai_usage', {
  id: text('id').primaryKey(),                   // Record unique identifier
  projectId: text('project_id').references(() => project.id), // Project ID (foreign key)
  organizationId: text('organization_id').notNull(), // Organization ID
  totalAIMessageCount: integer('total_ai_message_count').default(0), // Total AI message count
  lastUsedAt: timestamp('last_used_at'),         // Last used time
  createdAt: timestamp('created_at'),            // Creation time
  updatedAt: timestamp('updated_at')             // Update time
})
```

### Subscription Management Module

#### SubscriptionLimit Table
Organization subscription limits and billing information management table.

```typescript
export const subscriptionLimit = pgTable('subscription_limit', {
  id: text('id').primaryKey(),                   // Record unique identifier
  organizationId: text('organization_id').notNull(), // Organization ID
  stripeCustomerId: text('stripe_customer_id'),  // Stripe customer ID
  planName: text('plan_name').notNull(),         // Subscription plan name
  planId: text('plan_id').notNull(),             // Subscription plan ID
  aiNums: integer('ai_nums').notNull(),          // AI usage limit
  enhanceNums: integer('enhance_nums').notNull(), // Enhancement feature limit
  uploadLimit: integer('upload_limit').notNull(), // Upload limit
  deployLimit: integer('deploy_limit').notNull(), // Deployment limit
  seats: integer('seats').default(1),           // Number of seats
  projectNums: integer('project_nums').default(1), // Project number limit
  isActive: boolean('is_active').default(true), // Is active
  periodStart: timestamp('period_start'),       // Subscription period start
  periodEnd: timestamp('period_end'),           // Subscription period end
  createdAt: timestamp('created_at'),           // Creation time
  updatedAt: timestamp('updated_at')            // Update time
}, (table) => ({
  // Unique constraint: each organization can only have one active plan
  uniqueOrgPlanActive: uniqueIndex('subscription_limit_org_plan_active_idx')
    .on(table.organizationId, table.planName)
    .where(sql`${table.isActive} = true`)
}))
```

### Component Management Module

#### Components Table
UI component library management table.

```typescript
export const components = pgTable('components', {
  id: integer('id').primaryKey(),                // Component unique identifier
  name: text('name').notNull(),                  // Component name
  component_slug: text('component_slug').unique(), // Component slug
  code: text('code'),                            // Component code
  compiled_css: text('compiled_css'),            // Compiled CSS
  component_names: json('component_names').notNull(), // Component names list
  demo_code: text('demo_code'),                  // Demo code
  demo_dependencies: json('demo_dependencies'),  // Demo dependencies
  demo_direct_registry_dependencies: json('demo_direct_registry_dependencies'), // Demo direct registry dependencies
  dependencies: json('dependencies'),            // Dependencies list
  direct_registry_dependencies: json('direct_registry_dependencies'), // Direct registry dependencies
  description: text('description'),              // Component description
  global_css_extension: text('global_css_extension'), // Global CSS extension
  tailwind_config_extension: text('tailwind_config_extension'), // Tailwind config extension
  downloads_count: integer('downloads_count').default(0), // Download count
  likes_count: integer('likes_count').default(0), // Likes count
  is_public: boolean('is_public').default(false), // Is public
  is_paid: boolean('is_paid').default(false),   // Is paid
  payment_url: text('payment_url'),              // Payment URL
  preview_url: text('preview_url').notNull(),   // Preview URL
  created_at: timestamp('created_at'),          // Creation time
  updated_at: timestamp('updated_at')           // Update time
})
```

#### ProjectAsset Table
Project asset file management table for tracking project-related attachment files.

```typescript
export const projectAsset = pgTable('project_asset', {
  id: text('id').primaryKey(),                   // Asset unique identifier
  organizationId: text('organization_id').notNull(), // Organization ID
  projectId: text('project_id')                  // Project ID (foreign key)
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull(),             // Plan ID
  attachmentKey: text('attachment_key').notNull(), // Attachment key
  createdAt: timestamp('created_at'),            // Creation time
  updatedAt: timestamp('updated_at')             // Update time
})
```

### Utility Functions Module

#### Custom Domain Queries
Provides custom domain-related database query functionality.

```typescript
import { findProjectByCustomDomain, validateCustomDomainProject } from '@libra/db'

// Find project by custom domain
const result = await findProjectByCustomDomain(db, 'example.com')
if (result.success && result.project) {
  // Validate domain configuration
  const validation = validateCustomDomainProject(result.project)
  if (validation.valid) {
    // Domain configuration is correct, can be used
  }
}
```

#### Subscription Utility Functions
Provides subscription-related business logic functions.

```typescript
import { hasPremiumMembership } from '@libra/db'

// Check if organization has premium membership
const isPremium = await hasPremiumMembership('org_123')
if (isPremium) {
  // Allow access to premium features
}
```

## 🔧 Development Guide

### Local Development Environment

```bash
# Start local PostgreSQL database
docker run --name libra-postgres \
  -e POSTGRES_DB=libra_dev \
  -e POSTGRES_USER=libra \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Set environment variables
export POSTGRES_URL="postgresql://libra:password@localhost:5432/libra_dev"

# Run migrations
bun db:migrate
```

### Adding New Data Tables

1. **Create Schema File**

```typescript
// schema/user-schema.ts
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const user = pgTable('user', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
})

export type User = typeof user.$inferSelect
export type InsertUser = typeof user.$inferInsert
```

2. **Update Main Export File**

```typescript
// index.ts
import * as userSchema from './schema/user-schema'

export const schema = {
  ...projectSchema,
  ...components,
  ...userSchema  // Add new schema
}
```

3. **Generate and Execute Migrations**

```bash
# Generate migration files
bun db:generate

# Execute migrations
bun db:migrate
```

### Database Query Best Practices

```typescript
// ✅ Recommended: Use type-safe queries
import { eq, and, desc, count } from 'drizzle-orm'

// Paginated queries
async function getProjectsPaginated(organizationId: string, page = 1, limit = 10) {
  const db = await getDbAsync()

  const offset = (page - 1) * limit

  const [projects, totalCount] = await Promise.all([
    db
      .select()
      .from(project)
      .where(eq(project.organizationId, organizationId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(project.createdAt)),

    db
      .select({ count: count() })
      .from(project)
      .where(eq(project.organizationId, organizationId))
  ])

  return {
    projects,
    total: totalCount[0].count,
    page,
    limit,
    totalPages: Math.ceil(totalCount[0].count / limit)
  }
}

// ✅ Recommended: Use transactions for complex operations
async function createProjectWithLimits(data: {
  name: string
  userId: string
  organizationId: string
}) {
  const db = await getDbAsync()

  return await db.transaction(async (tx) => {
    // Check project count limits
    const subscription = await tx
      .select()
      .from(subscriptionLimit)
      .where(and(
        eq(subscriptionLimit.organizationId, data.organizationId),
        eq(subscriptionLimit.isActive, true)
      ))
      .limit(1)

    if (!subscription.length) {
      throw new Error('No valid subscription')
    }

    const currentProjectCount = await tx
      .select({ count: count() })
      .from(project)
      .where(eq(project.organizationId, data.organizationId))

    if (currentProjectCount[0].count >= subscription[0].projectNums) {
      throw new Error('Project count limit reached')
    }

    // Create project
    const [newProject] = await tx
      .insert(project)
      .values({
        name: data.name,
        userId: data.userId,
        organizationId: data.organizationId,
        templateType: 'nextjs'
      })
      .returning()

    // Initialize usage statistics
    await tx.insert(projectAIUsage).values({
      projectId: newProject.id,
      organizationId: data.organizationId
    })

    return newProject
  })
}
```

### Performance Optimization Recommendations

```typescript
// ✅ Use indexes to optimize queries
// Add indexes on frequently queried fields
export const projectIndex = index('project_org_user_idx')
  .on(project.organizationId, project.userId)

// ✅ Use partial indexes to optimize specific queries
export const activeProjectIndex = index('active_project_idx')
  .on(project.organizationId)
  .where(eq(project.isActive, true))

// ✅ Batch operations optimization
async function bulkUpdateProjects(updates: Array<{id: string, name: string}>) {
  const db = await getDbAsync()

  // Use batch updates instead of looping individual updates
  const promises = updates.map(update =>
    db
      .update(project)
      .set({ name: update.name, updatedAt: new Date() })
      .where(eq(project.id, update.id))
  )

  await Promise.all(promises)
}
```

## 🎯 Problems Solved

### 1. Database Operation Type Safety
- **Traditional Problem**: SQL queries prone to errors, lack of type checking
- **Solution**: Drizzle ORM provides compile-time type checking
- **Advantage**: Discover errors during development, reduce runtime exceptions

### 2. Environment Configuration Complexity
- **Traditional Problem**: Inconsistent configuration between development and production environments
- **Solution**: Intelligent environment detection and automatic adaptation
- **Advantage**: Same code runs in multiple environments, reduces configuration errors

### 3. Database Connection Performance
- **Traditional Problem**: High connection latency in Serverless environments
- **Solution**: Cloudflare Hyperdrive acceleration
- **Advantage**: Significantly improves database access performance

### 4. Data Model Maintenance
- **Traditional Problem**: Scattered data models, lack of unified management
- **Solution**: Centralized Schema definition and version control
- **Advantage**: Data structure consistency, easy to maintain and extend

### 5. Development Efficiency
- **Traditional Problem**: Repetitive database operation code, lack of abstraction
- **Solution**: Unified data access layer and utility functions
- **Advantage**: Improve development efficiency, reduce duplicate code

## 📖 Related Resources

- **Drizzle ORM Official Documentation**: [https://orm.drizzle.team/](https://orm.drizzle.team/)
- **Cloudflare Hyperdrive**: [https://developers.cloudflare.com/hyperdrive/](https://developers.cloudflare.com/hyperdrive/)
- **PostgreSQL Documentation**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **React Cache API**: [https://react.dev/reference/react/cache](https://react.dev/reference/react/cache)

## 🤝 Contributing Guide

Welcome to contribute code and suggestions!

### Ways to Contribute
- 🐛 **Bug Reports**: Submit issues when you find problems
- 💡 **Feature Suggestions**: New feature ideas are welcome for discussion
- 📝 **Documentation Improvements**: Help improve documentation content
- 🔧 **Code Contributions**: Submit Pull Requests

### Development Process
1. Fork the project repository
2. Create a feature branch
3. Develop and test
4. Submit Pull Request
5. Code review and merge

### Schema Contribution Guidelines
- Follow existing naming conventions and code style
- Add complete TypeScript type definitions
- Provide detailed field comments and usage instructions
- Ensure migration file backward compatibility