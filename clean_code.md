# Zepid Code Quality Guidelines

<!-- TOC -->

> Excellent code is not only executable by machines, but also easily understood and maintained by every team member. Code clarity directly affects project readability, scalability, and long-term maintenance costs.

---

## Core Principles

**Why** Implementing consistent development philosophy across the project maximizes collaboration efficiency and reduces long-term maintenance costs.

**When** Check against these principles before writing or reviewing any code.

**Key Takeaways**
1. Follow project conventions (Biome / shadcn / Tailwind)
2. Keep it simple – avoid over-engineering
3. Scout principle – make code better with every change
4. Root cause analysis – use type system to prevent issues

### Example Summary
```typescript
// Single responsibility example
function validateEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email)
}
```

---

## Architecture Design Principles

**Why** Good architecture makes code sustainably evolve and easily extensible.

**When** Apply when designing new modules or refactoring existing ones.

**Key Takeaways**
1. Centralized, type-safe configuration management
2. Composition over inheritance
3. Concurrency handling: React 19 + Suspense
4. Moderate configuration / dependency injection / principle of least knowledge

### Example Summary
```typescript
// Dependency injection example
class OrderProcessor {
  constructor(private payment: PaymentService) {}
  async process(order: Order) {
    await this.payment.pay(order.total)
  }
}
```

---

## Code Readability Techniques

**Why** Readable code allows future you (or colleagues) to quickly understand business intent.

**When** Should always be considered during writing, refactoring, or code review.

**Key Takeaways**
1. Consistent naming and style
2. Use explanatory variables and positive conditions
3. Encapsulate boundary conditions & extract functions
4. Avoid logical dependencies and side effects

### Example Summary
```typescript
// Explanatory variable example
const isProUser = user.plan === 'pro'
const hasActiveSub = user.subscription === 'active'
if (isProUser && hasActiveSub) {
  /* ... */
}
```

---

## Naming Conventions

**Why** Clear, consistent naming minimizes team communication costs.

**When** When defining any variables, functions, files, or branch names.

**Key Takeaways**
1. Descriptive and searchable
2. Meaningful distinctions, not numeric suffixes
3. Use named constants instead of magic values
4. Avoid encoding prefixes (Hungarian notation)

### Example Summary
```typescript
// Constants example
const MAX_RETRY = 3
```

---

## Function Design Principles

**Why** Small, focused functions are easy to test and reuse.

**When** When implementing new features or evaluating existing function complexity.

**Key Takeaways**
1. Single responsibility & descriptive function names
2. Minimal parameter count (object parameter passing)
3. Avoid side effects and boolean flag parameters

### Example Summary
```typescript
interface CreateProjectParams {
  name: string
  type: ProjectType
}
function createProject({ name, type }: CreateProjectParams) {
  /* ... */
}
```

---

## Comment Best Practices

**Why** High-quality comments supplement, not replace, readable code.

**When** When explaining intent, complex algorithms, or potential risks.

**Key Takeaways**
1. Self-documenting code is better than comments
2. Avoid redundant/noise comments
3. Delete unused code instead of commenting it out
4. Use JSDoc to document interfaces and examples

### Example Summary
```typescript
/**
 * Calculate discounted price
 */
function calcDiscount(price: number, rate: number) {
  return price * (1 - rate)
}
```

---

## Code Organization Structure

**Why** Proper organization reduces module cross-dependencies and cognitive load.

**When** When creating new files or reorganizing existing logic.

**Key Takeaways**
1. Vertical separation of concepts & related code stays close
2. Declare variables/functions near their usage
3. Maintain line length and group with blank lines

### Example Summary
```typescript
// Good vertical separation - related concepts tightly organized
class UserService {
  // Private fields concentrated at the top
  private readonly userRepository: UserRepository
  private readonly emailService: EmailService

  constructor(userRepo: UserRepository, emailSvc: EmailService) {
    this.userRepository = userRepo
    this.emailService = emailSvc
  }

  // Public methods organized by call hierarchy
  async createUser(userData: CreateUserData): Promise<User> {
    const validatedData = this.validateUserData(userData)
    const user = await this.saveUser(validatedData)
    await this.sendWelcomeEmail(user)
    return user
  }

  // Private helper methods follow closely after the public methods that call them
  private validateUserData(data: CreateUserData): ValidatedUserData {
    if (!data.email || !data.name) {
      throw new Error('Missing required fields')
    }
    return { ...data, createdAt: new Date() }
  }

  private async saveUser(data: ValidatedUserData): Promise<User> {
    return await this.userRepository.save(data)
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    await this.emailService.sendWelcome(user.email, user.name)
  }
}

// Poor vertical separation - concepts scattered
class BadUserService {
  private userRepository: UserRepository

  async createUser(userData: CreateUserData): Promise<User> {
    // Logic scattered, hard to understand
  }

  private emailService: EmailService // Field scattered

  private validateUserData(data: CreateUserData) {
    // Validation logic far from the method using it
  }

  constructor(userRepo: UserRepository, emailSvc: EmailService) {
    // Constructor misplaced
  }
}
```

---

## Component and Data Structure Design

**Why** Good encapsulation improves reusability and reduces coupling.

**When** When developing React components or defining interfaces.

**Key Takeaways**
1. Hide internal implementation & use simple data structures
2. Single responsibility & minimize props

### Example Summary
```tsx
function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

---

## Testing Best Practices

**Why** High-quality tests prevent regression and improve design quality.

**When** When writing or maintaining tests for features.

**Key Takeaways**
1. Single assertion focus & readability first
2. Fast execution & test isolation
3. Vitest configuration with React Testing Library

### Example Summary
```typescript
import { describe, test, expect } from 'vitest'

describe('add', () => {
  test('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2)
  })
})
```

---

## React 19 and Modern Patterns

**Why** Leverage latest concurrent features and RSC to optimize performance and user experience.

**When** When developing new pages or refactoring existing ones.

**Key Takeaways**
1. Server Components for data fetching
2. Suspense & Error Boundary
3. Custom Hooks for complex logic management

### Example Summary
```tsx
// React 19 + Suspense modern pattern
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Server Component - data fetching
async function ProjectList() {
  const projects = await getProjects() // Server-side data fetching

  return (
    <div className="grid gap-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// Client Component - interaction logic
'use client'
function ProjectCard({ project }: { project: Project }) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="border rounded-lg p-4">
      <h3>{project.name}</h3>
      <button
        onClick={() => setIsLiked(!isLiked)}
        className={isLiked ? 'text-red-500' : 'text-gray-500'}
      >
        {isLiked ? '❤️' : '🤍'}
      </button>
    </div>
  )
}

// Page component - composition pattern
export default function ProjectsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1>My Projects</h1>

      <ErrorBoundary fallback={<ProjectError />}>
        <Suspense fallback={<ProjectSkeleton />}>
          <ProjectList />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

// Error boundary component
function ProjectError() {
  return (
    <div className="text-center p-8">
      <p>Error loading projects, please try again later</p>
    </div>
  )
}

// Loading skeleton
function ProjectSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

// Custom Hook - complex logic management
function useProjectActions(projectId: string) {
  const [isLoading, setIsLoading] = useState(false)

  const deleteProject = async () => {
    setIsLoading(true)
    try {
      await api.projects.delete(projectId)
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteProject, isLoading }
}
```

---

## tRPC Best Practices

**Why** End-to-end type safety simplifies front-end and back-end collaboration.

**When** When designing APIs or client-side data access.

**Key Takeaways**
1. Modular routers & Zod validation
2. Client-side Hook usage patterns
3. Unified error handling

### Example Summary
```typescript
// tRPC router modular design
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'

// Zod validation schema
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['web', 'mobile', 'desktop']),
  isPublic: z.boolean().default(false)
})

const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid()
})

// Project router
export const projectRouter = createTRPCRouter({
  // Public query
  getPublic: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const projects = await ctx.db.project.findMany({
        where: { isPublic: true },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' }
      })

      let nextCursor: string | undefined
      if (projects.length > input.limit) {
        const nextItem = projects.pop()
        nextCursor = nextItem!.id
      }

      return { projects, nextCursor }
    }),

  // Protected query
  getMyProjects: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.project.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { updatedAt: 'desc' }
      })
    }),

  // Create project
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const project = await ctx.db.project.create({
          data: {
            ...input,
            userId: ctx.session.user.id
          }
        })

        // Log operation
        await ctx.logger.info('Project created', {
          projectId: project.id,
          userId: ctx.session.user.id
        })

        return project
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project'
        })
      }
    }),

  // Update project
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      // Permission check
      const existingProject = await ctx.db.project.findFirst({
        where: { id, userId: ctx.session.user.id }
      })

      if (!existingProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or no permission'
        })
      }

      return await ctx.db.project.update({
        where: { id },
        data: updateData
      })
    })
})

// Client usage example
'use client'
import { api } from '@/utils/api'

function ProjectList() {
  // Query Hook
  const { data: projects, isLoading, error } = api.project.getMyProjects.useQuery()

  // Mutation Hook
  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      // Refetch data
      utils.project.getMyProjects.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleCreate = (data: CreateProjectData) => {
    createProject.mutate(data)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// Unified error handling
export const createTRPCNext = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            return {
              authorization: getAuthToken()
            }
          }
        })
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
              // Don't retry 4xx errors
              if (error.data?.httpStatus >= 400 && error.data?.httpStatus < 500) {
                return false
              }
              return failureCount < 3
            }
          }
        }
      }
    }
  }
})
```

---

## Common Code Smell Identification

**Why** Identifying and fixing smells can significantly reduce technical debt.

**When** During code reviews or refactoring.

**Key Takeaways**
1. Rigidity / Fragility / Immobility
2. Unnecessary complexity & duplication & opacity

### Example Summary
```typescript
// Code smell examples

// 1. Rigidity - hard to change, one change affects many
class OrderProcessor {
  processOrder(order: Order) {
    // Hard-coded business rules, difficult to extend
    if (order.type === 'PREMIUM') {
      this.applyPremiumDiscount(order)
      this.sendPremiumEmail(order)
      this.updatePremiumStats(order)
    } else if (order.type === 'REGULAR') {
      this.applyRegularDiscount(order)
      this.sendRegularEmail(order)
      this.updateRegularStats(order)
    }
    // Adding new type requires modifying this method
  }
}

// 2. Fragility - changing one place breaks many others
class UserService {
  users: User[] = []

  addUser(user: User) {
    this.users.push(user) // Direct array manipulation
  }

  getUserCount() {
    return this.users.length // Depends on internal implementation
  }

  getActiveUsers() {
    return this.users.filter(u => u.isActive) // Same dependency
  }
  // If we change how users are stored, multiple methods break
}

// 3. Immobility - coupled to specific environment
class FileLogger {
  log(message: string) {
    // Hard-coded file path, can't be used in different environments
    fs.writeFileSync('/var/log/app.log', message)
  }
}

// 4. Unnecessary complexity - over-engineering
interface IUserFactory {
  createUser(): IUser
}

interface IUser {
  getName(): string
  setName(name: string): void
}

class UserFactory implements IUserFactory {
  createUser(): IUser {
    return new User()
  }
}
// Simple User class over-abstracted

// 5. Duplicate code - violates DRY principle
class EmailService {
  sendWelcomeEmail(user: User) {
    const subject = 'Welcome!'
    const body = `Hello ${user.name}, welcome to our platform!`
    this.sendEmail(user.email, subject, body)
  }

  sendPasswordResetEmail(user: User) {
    const subject = 'Password Reset'
    const body = `Hello ${user.name}, click here to reset password.`
    this.sendEmail(user.email, subject, body)
  }
  // Duplicate email sending logic
}

// 6. Opacity - hard to understand
function calc(a: number, b: number, c: number): number {
  return a * 0.1 + b * 0.05 - c * 0.02 // Magic numbers, meaning unclear
}

//  Refactored clean code

// 1. Solve rigidity - use strategy pattern
interface OrderStrategy {
  process(order: Order): void
}

class PremiumOrderStrategy implements OrderStrategy {
  process(order: Order) {
    this.applyDiscount(order, 0.2)
    this.sendEmail(order, 'premium-template')
    this.updateStats(order, 'premium')
  }
}

class OrderProcessor {
  private strategies = new Map<string, OrderStrategy>()

  process(order: Order) {
    const strategy = this.strategies.get(order.type)
    if (!strategy) throw new Error(`Unknown order type: ${order.type}`)
    strategy.process(order)
  }
}

// 2. Solve fragility - encapsulate internal state
class UserRepository {
  private users = new Map<string, User>()

  add(user: User): void {
    this.users.set(user.id, user)
  }

  getCount(): number {
    return this.users.size
  }

  getActive(): User[] {
    return Array.from(this.users.values()).filter(u => u.isActive)
  }
}

// 3. Solve immobility - dependency injection
interface Logger {
  log(message: string): void
}

class FileLogger implements Logger {
  constructor(private filePath: string) {}

  log(message: string) {
    fs.writeFileSync(this.filePath, message)
  }
}

// 4. Solve unnecessary complexity - simplify design
class User {
  constructor(public name: string) {}
}

// 5. Solve duplication - extract common logic
class EmailService {
  sendWelcomeEmail(user: User) {
    this.sendTemplateEmail(user, 'welcome', { name: user.name })
  }

  sendPasswordResetEmail(user: User) {
    this.sendTemplateEmail(user, 'password-reset', { name: user.name })
  }

  private sendTemplateEmail(user: User, template: string, data: any) {
    const { subject, body } = this.renderTemplate(template, data)
    this.sendEmail(user.email, subject, body)
  }
}

// 6. Solve opacity - use named constants
const TAX_RATE = 0.1
const SERVICE_FEE_RATE = 0.05
const DISCOUNT_RATE = 0.02

function calculateTotal(price: number, service: number, discount: number): number {
  return price * TAX_RATE + service * SERVICE_FEE_RATE - discount * DISCOUNT_RATE
}
```

---