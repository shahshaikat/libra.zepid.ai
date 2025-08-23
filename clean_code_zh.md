# Zepid 代码质量指南

<!-- TOC -->

> 优秀的代码不仅能被机器执行，更能被团队中的每个人轻松理解和维护。代码的清晰性直接影响项目的可读性、可扩展性和长期维护成本。

---

## 核心原则

**Why** 在项目中贯彻统一的开发理念，可最大化协作效率并降低长期维护成本。

**When** 在编写或评审任何代码之前，首先检查是否符合这些原则。

**Key Takeaways**
1. 遵循项目约定（Biome / shadcn / Tailwind）
2. 保持简洁 —— 避免过度工程化
3. 童子军原则 —— 每次修改都让代码更好
4. 根因分析 —— 用类型系统预防问题

### 示例汇总
```typescript
// 单一职责示例
function validateEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email)
}
```

---

## 架构设计原则

**Why** 良好的架构使代码可持续演进并易于扩展。

**When** 在设计新模块或重构旧模块时应用。

**Key Takeaways**
1. 配置管理集中、类型安全
2. 组合优于继承
3. 并发处理：React 19 + Suspense
4. 适度配置 / 依赖注入 / 最小知识

### 示例汇总
```typescript
// 依赖注入示例
class OrderProcessor {
  constructor(private payment: PaymentService) {}
  async process(order: Order) {
    await this.payment.pay(order.total)
  }
}
```

---

## 代码可读性技巧

**Why** 可读的代码能让未来的你（或同事）快速理解业务意图。

**When** 在撰写、重构或 code review 时应始终关注。

**Key Takeaways**
1. 保持一致命名与风格
2. 使用解释性变量与肯定条件
3. 封装边界条件 & 提炼函数
4. 避免逻辑依赖与副作用

### 示例汇总
```typescript
// 解释性变量示例
const isProUser = user.plan === 'pro'
const hasActiveSub = user.subscription === 'active'
if (isProUser && hasActiveSub) {
  /* ... */
}
```

---

## 命名约定

**Why** 明确、统一的命名使团队沟通成本最低。

**When** 定义任何变量、函数、文件、分支名时。

**Key Takeaways**
1. 描述性且易于搜索
2. 有意义区分而非数字后缀
3. 使用命名常量替换魔法值
4. 避免编码前缀（匈牙利命名法）

### 示例汇总
```typescript
// 常量示例
const MAX_RETRY = 3
```

---

## 函数设计原则

**Why** 小而专一的函数易于测试与复用。

**When** 实现新功能或评估现有函数复杂度时。

**Key Takeaways**
1. 单一职责 & 描述性函数名
2. 最小参数数量（对象化传参）
3. 避免副作用与布尔标志参数

### 示例汇总
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

## 注释最佳实践

**Why** 高质量注释补充而非替代可读代码。

**When** 解释意图、复杂算法或潜在风险时。

**Key Takeaways**
1. 代码自解释优于注释
2. 避免冗余 / 噪音注释
3. 删除而非注释掉无用代码
4. 使用 JSDoc 说明接口与示例

### 示例汇总
```typescript
/**
 * 计算优惠后价格
 */
function calcDiscount(price: number, rate: number) {
  return price * (1 - rate)
}
```

---

## 代码组织结构

**Why** 合理组织可降低模块交叉依赖与认知负荷。

**When** 创建新文件或重排现有逻辑时。

**Key Takeaways**
1. 垂直分离概念 & 相关代码紧密
2. 就近声明变量 / 函数
3. 保持行长度与空白行分组

### 示例汇总
```typescript
// ✅ 好的垂直分离 - 相关概念紧密组织
class UserService {
  // 私有字段集中在顶部
  private readonly userRepository: UserRepository
  private readonly emailService: EmailService

  constructor(userRepo: UserRepository, emailSvc: EmailService) {
    this.userRepository = userRepo
    this.emailService = emailSvc
  }

  // 公共方法按调用层次组织
  async createUser(userData: CreateUserData): Promise<User> {
    const validatedData = this.validateUserData(userData)
    const user = await this.saveUser(validatedData)
    await this.sendWelcomeEmail(user)
    return user
  }

  // 私有辅助方法紧跟在调用它们的公共方法后面
  private validateUserData(data: CreateUserData): ValidatedUserData {
    if (!data.email || !data.name) {
      throw new Error('缺少必要字段')
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

// ❌ 不好的垂直分离 - 概念分散
class BadUserService {
  private userRepository: UserRepository

  async createUser(userData: CreateUserData): Promise<User> {
    // 逻辑分散，难以理解
  }

  private emailService: EmailService // 字段分散

  private validateUserData(data: CreateUserData) {
    // 验证逻辑远离使用它的方法
  }

  constructor(userRepo: UserRepository, emailSvc: EmailService) {
    // 构造函数位置不当
  }
}
```

---

## 组件和数据结构设计

**Why** 良好封装提高复用并降低耦合。

**When** 开发 React 组件或定义接口时。

**Key Takeaways**
1. 隐藏内部实现 & 使用简单数据结构
2. 单一职责 & 最小化 props

### 示例汇总
```tsx
function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

---

## 测试最佳实践

**Why** 高质量测试防止回归并提升设计质量。

**When** 为功能编写或维护测试时。

**Key Takeaways**
1. 单一断言关注点 & 可读性优先
2. 快速执行 & 测试隔离
3. Vitest 配置与 React Testing Library

### 示例汇总
```typescript
import { describe, test, expect } from 'vitest'

describe('add', () => {
  test('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2)
  })
})
```

---

## React 19 和现代模式

**Why** 利用最新并发特性与 RSC 优化性能与用户体验。

**When** 开发新页面或重构旧页面时。

**Key Takeaways**
1. Server Components 获取数据
2. Suspense & Error Boundary
3. 自定义 Hook 管理复杂逻辑

### 示例汇总
```tsx
// ✅ React 19 + Suspense 现代模式
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Server Component - 数据获取
async function ProjectList() {
  const projects = await getProjects() // 服务端数据获取

  return (
    <div className="grid gap-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// Client Component - 交互逻辑
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

// 页面组件 - 组合模式
export default function ProjectsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1>我的项目</h1>

      <ErrorBoundary fallback={<ProjectError />}>
        <Suspense fallback={<ProjectSkeleton />}>
          <ProjectList />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

// 错误边界组件
function ProjectError() {
  return (
    <div className="text-center p-8">
      <p>加载项目时出错，请稍后重试</p>
    </div>
  )
}

// 加载骨架屏
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

// 自定义 Hook - 复杂逻辑管理
function useProjectActions(projectId: string) {
  const [isLoading, setIsLoading] = useState(false)

  const deleteProject = async () => {
    setIsLoading(true)
    try {
      await api.projects.delete(projectId)
      // 处理成功
    } catch (error) {
      // 处理错误
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteProject, isLoading }
}
```

---

## tRPC 最佳实践

**Why** 端到端类型安全简化前后端协作。

**When** 设计 API 或客户端数据访问时。

**Key Takeaways**
1. 路由器模块化 & Zod 验证
2. 客户端 Hooks 使用模式
3. 统一错误处理

### 示例汇总
```typescript
// ✅ tRPC 路由器模块化设计
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'

// Zod 验证模式
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['web', 'mobile', 'desktop']),
  isPublic: z.boolean().default(false)
})

const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid()
})

// 项目路由器
export const projectRouter = createTRPCRouter({
  // 公开查询
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

  // 受保护的查询
  getMyProjects: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.project.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { updatedAt: 'desc' }
      })
    }),

  // 创建项目
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

        // 记录操作日志
        await ctx.logger.info('Project created', {
          projectId: project.id,
          userId: ctx.session.user.id
        })

        return project
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '创建项目失败'
        })
      }
    }),

  // 更新项目
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      // 权限检查
      const existingProject = await ctx.db.project.findFirst({
        where: { id, userId: ctx.session.user.id }
      })

      if (!existingProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '项目不存在或无权限'
        })
      }

      return await ctx.db.project.update({
        where: { id },
        data: updateData
      })
    })
})

// 客户端使用示例
'use client'
import { api } from '@/utils/api'

function ProjectList() {
  // 查询 Hook
  const { data: projects, isLoading, error } = api.project.getMyProjects.useQuery()

  // 变更 Hook
  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      // 重新获取数据
      utils.project.getMyProjects.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleCreate = (data: CreateProjectData) => {
    createProject.mutate(data)
  }

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// 统一错误处理
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
            staleTime: 5 * 60 * 1000, // 5分钟
            retry: (failureCount, error) => {
              // 4xx 错误不重试
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

## 常见代码异味识别

**Why** 识别并修复异味可显著降低技术债务。

**When** 进行代码审查或重构时。

**Key Takeaways**
1. 僵硬性 / 脆弱性 / 不可移植性
2. 不必要复杂 & 重复 & 不透明

### 示例汇总
```typescript
// ❌ 代码异味示例

// 1. 僵硬性 - 难以修改，牵一发动全身
class OrderProcessor {
  processOrder(order: Order) {
    // 硬编码的业务规则，难以扩展
    if (order.type === 'PREMIUM') {
      this.applyPremiumDiscount(order)
      this.sendPremiumEmail(order)
      this.updatePremiumStats(order)
    } else if (order.type === 'REGULAR') {
      this.applyRegularDiscount(order)
      this.sendRegularEmail(order)
      this.updateRegularStats(order)
    }
    // 添加新类型需要修改这个方法
  }
}

// 2. 脆弱性 - 修改一处破坏多处
class UserService {
  users: User[] = []

  addUser(user: User) {
    this.users.push(user) // 直接操作数组
  }

  getUserCount() {
    return this.users.length // 依赖内部实现
  }

  getActiveUsers() {
    return this.users.filter(u => u.isActive) // 同样依赖内部实现
  }
  // 如果改变 users 的存储方式，多个方法都会破坏
}

// 3. 不可移植性 - 与特定环境耦合
class FileLogger {
  log(message: string) {
    // 硬编码文件路径，无法在不同环境使用
    fs.writeFileSync('/var/log/app.log', message)
  }
}

// 4. 不必要的复杂性 - 过度设计
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
// 简单的 User 类被过度抽象

// 5. 重复代码 - 违反 DRY 原则
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
  // 重复的邮件发送逻辑
}

// 6. 不透明性 - 难以理解
function calc(a: number, b: number, c: number): number {
  return a * 0.1 + b * 0.05 - c * 0.02 // 魔法数字，无法理解含义
}

// ✅ 重构后的清洁代码

// 1. 解决僵硬性 - 使用策略模式
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

// 2. 解决脆弱性 - 封装内部状态
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

// 3. 解决不可移植性 - 依赖注入
interface Logger {
  log(message: string): void
}

class FileLogger implements Logger {
  constructor(private filePath: string) {}

  log(message: string) {
    fs.writeFileSync(this.filePath, message)
  }
}

// 4. 解决不必要复杂性 - 简化设计
class User {
  constructor(public name: string) {}
}

// 5. 解决重复 - 提取公共逻辑
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

// 6. 解决不透明性 - 使用命名常量
const TAX_RATE = 0.1
const SERVICE_FEE_RATE = 0.05
const DISCOUNT_RATE = 0.02

function calculateTotal(price: number, service: number, discount: number): number {
  return price * TAX_RATE + service * SERVICE_FEE_RATE - discount * DISCOUNT_RATE
}
```

---