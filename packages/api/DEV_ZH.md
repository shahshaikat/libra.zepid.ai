# @libra/api 开发文档

[![Version](https://img.shields.io/npm/v/@libra/api.svg)](https://npmjs.org/package/@libra/api)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/libra-ai/libra/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **企业级类型安全 API 层，为 Zepid AI 平台提供核心业务能力**

`@libra/api` 是基于 tRPC 构建的综合性、类型安全的后端服务，为 Zepid 平台的核心业务功能提供支持，包括 AI 驱动的开发工作流、项目管理、用户认证、支付处理和第三方集成。

## 📋 目录

- [项目概述](#项目概述)
- [核心架构](#核心架构)
- [认证系统](#认证系统)
- [路由器详解](#路由器详解)
- [数据验证](#数据验证)
- [工具函数](#工具函数)
- [错误处理](#错误处理)
- [集成指南](#集成指南)
- [安全最佳实践](#安全最佳实践)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 项目概述

### 技术栈

- **tRPC**: 端到端类型安全的 API 框架
- **Zod**: 运行时类型验证和模式定义
- **Drizzle ORM**: 类型安全的数据库操作
- **Better Auth**: 现代化的认证解决方案
- **Stripe**: 支付和订阅管理
- **E2B**: 沙箱环境和容器管理
- **GitHub API**: 代码仓库集成
- **Azure OpenAI**: AI 文本生成服务

### 核心特性

- ✅ **类型安全**: 端到端 TypeScript 类型推断
- 🔐 **多层认证**: 公共、受保护、组织级、会员级权限控制
- 📊 **配额管理**: 完整的订阅限制和使用量跟踪
- 🚀 **项目部署**: 自动化 Cloudflare Workers 部署
- 🤖 **AI 集成**: Azure OpenAI 文本生成和增强
- 📁 **文件管理**: 项目文件结构和历史版本控制
- 💳 **支付集成**: Stripe 订阅和计费管理
- 🔗 **GitHub 集成**: OAuth 和 App 安装双重认证

## 核心架构

### 项目结构

```
packages/api/
├── src/
│   ├── router/           # 业务路由实现
│   │   ├── ai.ts         # AI 文本生成和增强
│   │   ├── project.ts    # 项目生命周期管理
│   │   ├── github.ts     # GitHub 集成
│   │   ├── deploy.ts     # 项目部署
│   │   ├── file.ts       # 文件管理
│   │   ├── history.ts    # 项目历史
│   │   ├── stripe.ts     # 支付处理
│   │   ├── subscription.ts # 订阅管理
│   │   ├── session.ts    # 会话管理
│   │   ├── custom-domain.ts # 自定义域名
│   │   └── hello.ts      # 测试接口
│   ├── schemas/          # 数据验证模式
│   │   ├── project-schema.ts # 项目数据验证
│   │   ├── file.ts       # 文件结构验证
│   │   ├── history.ts    # 历史记录类型
│   │   └── turnstile.ts  # 安全验证
│   ├── utils/            # 工具函数
│   │   ├── container.ts  # E2B 沙箱管理
│   │   ├── deploy.ts     # 部署工具
│   │   ├── github-auth.ts # GitHub 认证
│   │   ├── project.ts    # 项目工具
│   │   ├── stripe-utils.ts # 支付工具
│   │   └── membership-validation.ts # 会员验证
│   ├── trpc.ts           # tRPC 配置和中间件
│   ├── root.ts           # 路由聚合
│   └── index.ts          # 包导出
├── env.mjs               # 环境变量配置
└── package.json          # 依赖和脚本定义
```

### 架构设计模式

#### 1. 分层架构模式

```typescript
// packages/api/src/trpc.ts

// 1. 上下文创建 - 提供数据库连接和会话信息
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const auth = await initAuth()
  const session = await auth.api.getSession({ headers: opts.headers })
  const db = await getAuthDb()
  return { db, session, ...opts }
}

// 2. 基础过程 - 公共访问
export const publicProcedure = t.procedure

// 3. 受保护过程 - 需要登录
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

// 4. 组织级过程 - 需要组织权限
export const organizationProcedure = protectedProcedure
  .input(z.object({ orgId: z.string().optional() }))
  .use(async ({ ctx, input, next }) => {
    const activeOrganizationId = ctx.session?.session?.activeOrganizationId

    // 优先使用输入参数，回退到会话中的活跃组织ID
    const orgId = input.orgId || activeOrganizationId

    if (!orgId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }

    // 如果用户指定了与当前活跃组织不同的组织ID，需要验证访问权限
    if (input.orgId && input.orgId !== activeOrganizationId) {
      const hasAccess = await verifyOrganizationAccess(ctx.session.user.id, input.orgId)
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
        })
      }
    }

    return next({
      ctx: { ...ctx, orgId, session: ctx.session },
    })
  })

/**
 * 验证用户对组织的访问权限
 */
async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const db = await getAuthDb()

    const membership = await db.query.organizationMember.findFirst({
      where: and(
        eq(organizationMember.userId, userId),
        eq(organizationMember.organizationId, organizationId),
        eq(organizationMember.status, 'active')
      ),
    })

    return !!membership
  } catch (error) {
    console.error('[Auth] Failed to verify organization access:', error)
    return false
  }
}

// 5. 会员级过程 - 需要付费会员权限
export const memberProcedure = organizationProcedure.use(async ({ ctx, next }) => {
  await requirePremiumMembership(ctx.orgId, 'this feature')
  return next({ ctx })
})
```

#### 2. 配额管理模式

```typescript
// packages/api/src/router/project.ts

export const projectRouter = {
  create: organizationProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()

      // 检查并扣除项目配额
      const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
      if (!quotaDeducted) {
        log.project('warn', 'Project creation failed - quota exceeded', {
          orgId, userId, operation: 'create'
        })
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project quota exceeded'
        })
      }

      // 创建项目逻辑...
      const [newProject] = await db.insert(project).values({
        name: input.name ?? 'My First Project',
        templateType: input.templateType ?? 'default',
        visibility: input.visibility ?? 'private',
        userId,
        organizationId: orgId,
      }).returning()

      return newProject
    })
}
```

#### 3. 错误处理模式

```typescript
// packages/api/src/router/ai.ts

export const aiRouter = createTRPCRouter({
  generateText: organizationProcedure
    .input(z.object({
      prompt: z.string().min(1, 'Prompt cannot be empty'),
      modelId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const context = {
        userId: ctx.session.user.id,
        organizationId: ctx.orgId,
        operation: 'generateText'
      }

      log.ai('info', 'Starting AI text generation', {
        ...context,
        promptLength: input.prompt.length,
        modelId: input.modelId || 'default',
      })

      const [result, error] = await tryCatch(async () => {
        // 检查配额
        const canUseEnhance = await checkAndUpdateEnhanceUsage(ctx.orgId)
        if (!canUseEnhance) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Enhance quota exceeded. Please upgrade your plan.',
          })
        }

        // AI 生成逻辑...
        return await generateText({
          model: myProvider.languageModel('chat-model-reasoning-azure'),
          prompt: input.prompt,
        })
      })

      if (error) {
        if (error instanceof TRPCError) {
          log.ai('warn', 'AI generation blocked', context, error)
          throw error
        }

        log.ai('error', 'AI service failure', context, error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate enhanced text',
          cause: error,
        })
      }

      return result
    })
})
```

## 认证系统

### 认证级别

| 级别 | 描述 | 使用场景 | 示例 |
|------|------|----------|------|
| `publicProcedure` | 公共访问，无需认证 | 获取公开信息、健康检查 | `hello.pub` |
| `protectedProcedure` | 需要用户登录 | 用户个人操作 | `history.getAll` |
| `organizationProcedure` | 需要组织权限 | 组织内资源操作 | `project.create` |
| `memberProcedure` | 需要付费会员权限 | 高级功能访问 | `customDomain.set` |

### 权限验证实现

```typescript
// packages/api/src/utils/membership-validation.ts

/**
 * 检查组织是否具有付费会员权限
 */
export async function hasPremiumMembership(organizationId: string): Promise<boolean> {
  try {
    const db = await getAuthDb()

    // 查询活跃的订阅记录
    const activeSubscription = await db.query.subscription.findFirst({
      where: and(
        eq(subscription.referenceId, organizationId),
        eq(subscription.status, 'active')
      ),
    })

    if (!activeSubscription) return false

    // 检查订阅是否在有效期内
    const now = new Date()
    const periodEnd = activeSubscription.periodEnd

    if (periodEnd && periodEnd < now) {
      return false
    }

    // 检查是否为付费计划
    const planName = activeSubscription.plan?.toLowerCase() || ''
    return !planName.includes('free')

  } catch (error) {
    log.subscription('error', 'Failed to check premium membership', {
      organizationId, operation: 'hasPremiumMembership'
    }, error)
    return false
  }
}

/**
 * 要求付费会员权限，否则抛出错误
 */
export async function requirePremiumMembership(
  organizationId: string,
  featureName = 'this feature'
): Promise<void> {
  const isPremium = await hasPremiumMembership(organizationId)

  if (!isPremium) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Premium membership required to use ${featureName}. Please upgrade your plan.`,
    })
  }
}
```

### 会话管理

```typescript
// packages/api/src/router/session.ts

export const sessionRouter = {
  list: organizationProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId

    const [sessions, error] = await tryCatch(async () => {
      return await ctx.db
        .select()
        .from(session)
        .where(eq(session.activeOrganizationId, orgId))
        .orderBy(desc(session.createdAt))
    })

    if (error) {
      console.error(`[Session Query Error] Organization ID: ${orgId}`, error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching the session list',
        cause: error,
      })
    }

    return sessions
  }),
}
```

## 路由器详解

### AI 路由器 (`ai.ts`)

AI 路由器提供文本生成和增强功能，集成 Azure OpenAI 服务。

#### 核心功能

- **文本生成**: 使用 GPT-4 模型生成和增强文本内容
- **配额管理**: 自动检查和扣除 AI 使用配额
- **错误处理**: 完善的错误处理和日志记录

#### API 接口

```typescript
// packages/api/src/router/ai.ts

export const aiRouter = createTRPCRouter({
  generateText: organizationProcedure
    .input(z.object({
      prompt: z.string().min(1, 'Prompt cannot be empty'),
      modelId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const orgId = ctx.orgId
      const context = { userId, organizationId: orgId, operation: 'generateText' }

      // 检查 AI 提供商配置
      if (!myProvider) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI provider not configured. Please check Azure environment variables.',
        })
      }

      // 检查并扣除增强配额
      const canUseEnhance = await checkAndUpdateEnhanceUsage(orgId)
      if (!canUseEnhance) {
        log.ai('warn', 'AI generation quota exceeded', context)
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Enhance quota exceeded. Please upgrade your plan or wait for next billing cycle.',
        })
      }

      // 生成文本
      const result = await generateText({
        model: myProvider.languageModel('chat-model-reasoning-azure'),
        prompt: `Generate an enhanced version of this prompt: ${input.prompt}`,
        providerOptions: {
          openai: {
            ...(env.REASONING_ENABLED ? { reasoningEffort: 'medium' } : {}),
          },
        },
      })

      log.ai('info', 'AI text generation completed', {
        ...context,
        outputLength: result.text.length,
        tokensUsed: result.usage?.totalTokens || 0,
      })

      return {
        text: result.text,
        usage: result.usage,
        model: 'chat-model-reasoning-azure',
      }
    })
})
```

#### 环境配置

```typescript
// AI 提供商配置
const azure = env.AZURE_RESOURCE_NAME && env.AZURE_API_KEY
  ? createAzure({
      resourceName: env.AZURE_RESOURCE_NAME,
      apiKey: env.AZURE_API_KEY,
      apiVersion: '2024-06-01-preview',
      ...(env.AZURE_BASE_URL && {
        baseURL: `${env.AZURE_BASE_URL}${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_AIGATEWAY_NAME}/azure-openai/${env.AZURE_RESOURCE_NAME}`
      })
    })
  : null
```

### 项目路由器 (`project.ts`)

项目路由器是核心业务模块，提供完整的项目生命周期管理功能。

#### 核心功能

- **项目 CRUD**: 创建、读取、更新、删除项目
- **配额管理**: 项目数量限制和配额扣除
- **权限控制**: 组织级权限验证
- **历史管理**: 消息历史和版本控制
- **容器管理**: E2B 沙箱环境集成

#### API 接口

```typescript
// packages/api/src/router/project.ts

export const projectRouter = {
  // 创建项目
  create: organizationProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { name, initialMessage, visibility, templateType, attachment, planId } = input

      log.project('info', 'Project creation started', {
        orgId, userId, projectName: name, templateType, visibility
      })

      // 检查并扣除项目配额
      const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
      if (!quotaDeducted) {
        log.project('warn', 'Project creation failed - quota exceeded', {
          orgId, userId, operation: 'create'
        })
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project quota exceeded'
        })
      }

      // 初始化历史记录
      const messagePlanId = planId || 'initial'
      const messageHistory = initialMessage
        ? JSON.stringify([{
            type: 'user',
            message: initialMessage,
            planId: messagePlanId,
            ...(attachment && { attachment }),
          }])
        : '[]'

      // 创建项目
      const [newProject] = await db.insert(project).values({
        name: name ?? 'My First Project',
        templateType: templateType ?? 'default',
        visibility: (visibility as 'public' | 'private') ?? 'private',
        initialMessage,
        messageHistory,
        userId,
        organizationId: orgId,
      }).returning()

      log.project('info', 'Project created successfully', {
        orgId, userId, projectId: newProject.id, projectName: newProject.name
      })

      return newProject
    }),

  // 获取项目列表
  list: organizationProcedure.query(async ({ ctx }) => {
    const { orgId } = await requireOrgAndUser(ctx)
    const db = await getBusinessDb()

    const projects = await db
      .select()
      .from(project)
      .where(eq(project.organizationId, orgId))
      .orderBy(desc(project.createdAt))

    return projects
  }),

  // 更新项目
  update: organizationProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { projectId, initialMessage } = input

      // 获取并验证项目
      const projectData = await fetchProject(db, projectId)
      ensureOrgAccess(projectData, orgId, 'update')

      // 更新项目
      const [updatedProject] = await db
        .update(project)
        .set({
          initialMessage,
          updatedAt: sql`now()`,
        })
        .where(eq(project.id, projectId))
        .returning()

      return updatedProject
    }),

  // 删除项目
  delete: organizationProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { projectId } = input

      // 获取并验证项目
      const projectData = await fetchProject(db, projectId)
      ensureOrgAccess(projectData, orgId, 'delete')

      // 清理容器资源
      if (projectData.containerId) {
        await terminateSandbox(projectData.containerId)
      }

      // 删除项目
      await db.delete(project).where(eq(project.id, projectId))

      // 恢复项目配额
      await restoreProjectQuotaOnDeletion(orgId)

      log.project('info', 'Project deleted successfully', {
        orgId, projectId, projectName: projectData.name
      })

      return { success: true }
    }),

  // 复制项目
  fork: organizationProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const { projectId, name } = input

      // 检查配额
      const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
      if (!quotaDeducted) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project quota exceeded'
        })
      }

      // 获取原项目
      const originalProject = await fetchProject(db, projectId)

      // 创建副本
      const [forkedProject] = await db.insert(project).values({
        name: name || `${originalProject.name} (Copy)`,
        templateType: originalProject.templateType,
        visibility: originalProject.visibility,
        initialMessage: originalProject.initialMessage,
        messageHistory: originalProject.messageHistory,
        userId,
        organizationId: orgId,
      }).returning()

      return forkedProject
    }),
}
```

### GitHub 路由器 (`github.ts`)

GitHub 路由器提供完整的 GitHub 集成功能，支持 OAuth 和 GitHub App 两种认证方式。

#### 核心功能

- **OAuth 认证**: 用户级 GitHub 访问令牌管理
- **App 安装**: 组织级 GitHub App 安装和管理
- **仓库操作**: 获取仓库列表、创建仓库、推送代码
- **权限管理**: 基于安装类型的权限控制

#### API 接口

```typescript
// packages/api/src/router/github.ts

export const githubRouter = createTRPCRouter({
  // 获取 GitHub OAuth URL
  getOAuthUrl: organizationProcedure.mutation(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'getOAuthUrl',
    }

    if (!GITHUB_CLIENT_ID) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'GitHub OAuth client ID not configured',
      })
    }

    // 生成安全状态参数
    const nonceData = await generateSecureNonce(ctx.orgId, ctx.session.user.id)
    const state = Buffer.from(JSON.stringify({
      organizationId: ctx.orgId,
      userId: ctx.session.user.id,
      timestamp: nonceData.timestamp,
      nonce: nonceData.nonce,
    })).toString('base64')

    // 构建 OAuth URL
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'
    const oauthUrl = new URL('https://github.com/login/oauth/authorize')
    oauthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('scope', 'user:email,repo')

    return {
      oauthUrl: oauthUrl.toString(),
      redirectUri: `${baseUrl}/api/github/callback`,
      state,
    }
  }),

  // 获取 GitHub App 安装 URL
  getInstallUrl: organizationProcedure.mutation(async ({ ctx }) => {
    const nonceData = await generateSecureNonce(ctx.orgId, ctx.session.user.id)
    const state = Buffer.from(JSON.stringify({
      organizationId: ctx.orgId,
      userId: ctx.session.user.id,
      timestamp: nonceData.timestamp,
      nonce: nonceData.nonce,
    })).toString('base64')

    const installUrl = new URL(
      `https://github.com/apps/${process.env['GITHUB_APP_NAME'] || 'nextify-limited'}/installations/new`
    )
    installUrl.searchParams.set('state', state)

    return {
      installUrl: installUrl.toString(),
      state,
    }
  }),

  // 获取用户仓库列表
  getRepositories: organizationProcedure.query(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'getRepositories',
    }

    const authResult = await getGitHubAuthToken(ctx.orgId)
    const octokit = new Octokit({ auth: authResult.token })

    try {
      const { data: repositories } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      })

      return repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        htmlUrl: repo.html_url,
        description: repo.description,
        updatedAt: repo.updated_at,
        defaultBranch: repo.default_branch,
      }))
    } catch (error) {
      log.github('error', 'Failed to fetch repositories', context, error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch GitHub repositories',
      })
    }
  }),

  // 推送代码到 GitHub
  pushCode: organizationProcedure
    .input(githubRepoInfoSchema.extend({
      projectId: z.string(),
      commitMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, gitUrl, gitBranch, commitMessage } = input
      const context = {
        userId: ctx.session.user.id,
        organizationId: ctx.orgId,
        projectId,
        operation: 'pushCode',
      }

      // 获取项目数据
      const { orgId } = await requireOrgAndUser(ctx)
      const db = await getBusinessDb()
      const projectData = await fetchProject(db, projectId)
      ensureOrgAccess(projectData, orgId, 'access')

      // 获取 GitHub 认证
      const authResult = await getGitHubAuthToken(orgId)
      const octokit = new Octokit({ auth: authResult.token })

      // 解析仓库信息
      const repoMatch = gitUrl?.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!repoMatch) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid GitHub repository URL',
        })
      }

      const [, owner, repo] = repoMatch
      const branch = gitBranch || 'main'

      try {
        // 构建文件内容
        const initFiles = templateConfigs.vite as FileStructure
        const historyMessages = JSON.parse(projectData?.messageHistory || '[]')
        const { fileMap } = buildFiles(initFiles, historyMessages)

        // 获取仓库信息
        const { data: repository } = await octokit.rest.repos.get({
          owner,
          repo: repo.replace('.git', ''),
        })

        // 创建或更新文件
        const filesToCommit = Object.entries(fileMap)
          .filter(([path]) => !isExcludedFile(path))
          .map(([path, fileInfo]) => ({
            path,
            content: fileInfo.type === 'file' && !fileInfo.isBinary
              ? fileInfo.content
              : JSON.stringify(fileInfo.content),
          }))

        // 批量提交文件
        for (const file of filesToCommit) {
          try {
            // 检查文件是否存在
            let sha: string | undefined
            try {
              const { data: existingFile } = await octokit.rest.repos.getContent({
                owner,
                repo: repository.name,
                path: file.path,
                ref: branch,
              })
              if ('sha' in existingFile) {
                sha = existingFile.sha
              }
            } catch (error) {
              // 文件不存在，创建新文件
            }

            // 创建或更新文件
            await octokit.rest.repos.createOrUpdateFileContents({
              owner,
              repo: repository.name,
              path: file.path,
              message: commitMessage || `Update ${file.path}`,
              content: Buffer.from(file.content).toString('base64'),
              branch,
              ...(sha && { sha }),
            })
          } catch (fileError) {
            log.github('warn', `Failed to update file: ${file.path}`, context, fileError)
          }
        }

        // 更新项目 Git 信息
        await updateProjectGitInfo(db, projectId, { gitUrl, gitBranch: branch })

        log.github('info', 'Code pushed to GitHub successfully', {
          ...context,
          repository: `${owner}/${repository.name}`,
          branch,
          filesCount: filesToCommit.length,
        })

        return {
          success: true,
          repository: `${owner}/${repository.name}`,
          branch,
          commitUrl: `${repository.html_url}/tree/${branch}`,
        }
      } catch (error) {
        log.github('error', 'Failed to push code to GitHub', context, error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to push code to GitHub repository',
        })
      }
    }),
})
```

### 部署路由器 (`deploy.ts`)

部署路由器负责将项目部署到 Cloudflare Workers 平台。

#### 核心功能

- **自动化部署**: 使用 E2B 沙箱环境构建和部署项目
- **自定义域名**: 支持自定义域名配置
- **构建优化**: 自动化构建流程和资源优化
- **错误处理**: 完善的部署错误处理和回滚机制

#### API 接口

```typescript
// packages/api/src/router/deploy.ts

export const deployRouter = createTRPCRouter({
  deployProject: organizationProcedure
    .input(deployProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { projectId } = input
      const context = {
        userId: ctx.session.user.id,
        organizationId: ctx.orgId,
        projectId,
        operation: 'deployProject',
      }

      log.deployment('info', 'Starting project deployment', context)

      const [deployResult, deployError] = await tryCatch(async () => {
        // 验证用户权限和获取项目数据
        const { orgId } = await requireOrgAndUser(ctx)
        const db = await getBusinessDb()
        const projectData = await fetchProject(db, projectId)
        ensureOrgAccess(projectData, orgId, 'access')

        // 获取初始文件结构
        const initFiles = templateConfigs.vite as FileStructure

        // 解析消息历史获取文件差异
        const historyMessages = parseMessageHistory(projectData.messageHistory)

        log.deployment('info', 'Starting container provisioning and deployment', {
          ...context,
          template: 'vite',
          historyMessageCount: historyMessages.length,
        })

        // 执行部署
        const deployResult = await deployProject({
          projectId,
          ...(input.customDomain && { customDomain: input.customDomain })
        }, initFiles, historyMessages, orgId)

        // 更新项目部署信息
        await db
          .update(project)
          .set({
            productionDeployUrl: deployResult.workerUrl,
            updatedAt: sql`now()`,
          })
          .where(eq(project.id, projectId))

        return deployResult
      })

      if (deployError) {
        if (deployError instanceof TRPCError) {
          throw deployError
        }

        log.deployment('error', 'Deployment failed with unexpected error', context, deployError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: deployError instanceof Error ? deployError.message : 'Unknown deployment error',
        })
      }

      log.deployment('info', 'Project deployment completed successfully', {
        ...context,
        workerUrl: deployResult.workerUrl,
      })

      return {
        success: true,
        workerUrl: deployResult.workerUrl,
        message: 'Project deployed successfully',
      }
    }),
})
```

### 历史路由器 (`history.ts`)

历史路由器管理项目的消息历史和版本控制功能。

#### API 接口

```typescript
// packages/api/src/router/history.ts

export const historyRouter = createTRPCRouter({
  // 获取项目历史
  getAll: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const businessDb = await getBusinessDb()
      const res = await businessDb.query.project.findFirst({
        where: eq(project.id, input.id),
      })

      if (!res) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Project with ID ${input.id} not found`
        })
      }

      return JSON.parse(res?.messageHistory || '[]') as HistoryType
    }),

  // 追加历史记录
  appendHistory: organizationProcedure
    .input(z.object({
      id: z.string(),
      messages: z.union([z.lazy(() => z.any()), z.array(z.lazy(() => z.any()))]),
    }))
    .mutation(async ({ ctx, input }) => {
      const businessDb = await getBusinessDb()
      const res = await businessDb.query.project.findFirst({
        where: eq(project.id, input.id),
      })

      if (!res) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Project with ID ${input.id} not found`
        })
      }

      // 解析当前历史
      const [parsed, parseError] = tryCatch(() => {
        return JSON.parse(res?.messageHistory || '[]')
      })

      let currentHistory: HistoryType
      if (parseError) {
        console.error('[History Append] Failed to parse history:', parseError)
        currentHistory = []
      } else {
        currentHistory = Array.isArray(parsed) ? parsed : []
      }

      // 追加新消息
      const newHistory = Array.isArray(input.messages)
        ? [...currentHistory, ...input.messages]
        : [...currentHistory, input.messages]

      // 更新数据库
      await businessDb
        .update(project)
        .set({ messageHistory: JSON.stringify(newHistory) })
        .where(eq(project.id, input.id))

      return { success: true, historyLength: newHistory.length }
    }),

  // 回滚历史
  revert: protectedProcedure
    .input(z.object({
      id: z.string(),
      planId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const businessDb = await getBusinessDb()
      const res = await businessDb.query.project.findFirst({
        where: eq(project.id, input.id),
      })

      if (!res) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Project with ID ${input.id} not found`
        })
      }

      const [parsed, parseError] = tryCatch(() => {
        return JSON.parse(res?.messageHistory || '[]')
      })

      if (parseError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse project history'
        })
      }

      const currentHistory: HistoryType = Array.isArray(parsed) ? parsed : []

      // 找到指定 planId 的最后一次出现
      let revertIndex = -1
      for (let i = currentHistory.length - 1; i >= 0; i--) {
        if ('planId' in currentHistory[i] && currentHistory[i].planId === input.planId) {
          revertIndex = i
          break
        }
      }

      if (revertIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Plan ID ${input.planId} not found in history`
        })
      }

      // 回滚到指定位置
      const revertedHistory = currentHistory.slice(0, revertIndex + 1)
      const removedMessagesCount = currentHistory.length - revertedHistory.length

      // 更新数据库
      await businessDb
        .update(project)
        .set({ messageHistory: JSON.stringify(revertedHistory) })
        .where(eq(project.id, input.id))

      return {
        success: true,
        historyLength: revertedHistory.length,
        revertedFrom: currentHistory.length,
        removedMessagesCount,
        message: `Successfully rolled back to plan ID: ${input.planId}`,
      }
    }),
})
```

### Stripe 路由器 (`stripe.ts`)

Stripe 路由器处理支付和订阅相关功能。

#### API 接口

```typescript
// packages/api/src/router/stripe.ts

export const stripeRouter = {
  // 获取用户计划
  getUserPlans: publicProcedure.query(async ({ ctx }) => {
    const db = await getAuthDb()
    const auth = await initAuth()
    const sessionData = await auth.api.getSession({ headers: await headers() })

    // 获取所有可用计划
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

    if (sessionData?.user) {
      try {
        const activeOrg = await getActiveOrganization(sessionData.user.id)
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

  // 创建客户门户会话
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

  // 获取订阅使用情况
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

## 数据验证

### Zod 模式定义

项目使用 Zod 进行运行时类型验证和模式定义，确保数据的类型安全和完整性。

#### 项目模式 (`project-schema.ts`)

```typescript
// packages/api/src/schemas/project-schema.ts

// 项目创建模式
export const projectSchema = z.object({
  name: z.string().optional(),
  initialMessage: z.string().optional(),
  visibility: z.string().optional(),
  templateType: z.string().optional(),
  attachment: z.object({
    key: z.string(),
    name: z.string(),
    type: z.string(),
  }).optional(),
  planId: z.string().optional(),
})

// 项目更新模式
export const updateSchema = z.object({
  projectId: z.string().min(1),
  initialMessage: z.string().optional(),
})

// 项目配置更新模式
export const updateProjectConfigSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .optional(),
  knowledge: z.string().optional(),
})

// Git 信息模式
export const gitInfoSchema = z.object({
  gitUrl: z.string()
    .url('Invalid URL format')
    .regex(GIT_URL_REGEX, 'Invalid Git repository URL format')
    .optional(),
  gitBranch: z.string()
    .min(1, 'Branch name cannot be empty')
    .max(250, 'Branch name too long')
    .regex(GIT_BRANCH_REGEX, 'Invalid branch name format')
    .optional(),
})

// GitHub 仓库信息模式
export const githubRepoInfoSchema = z.object({
  gitUrl: z.string()
    .url('Invalid GitHub URL format')
    .regex(GITHUB_URL_REGEX, 'Must be a valid GitHub repository URL')
    .optional(),
  gitBranch: z.string()
    .min(1, 'Branch name cannot be empty')
    .max(250, 'Branch name too long')
    .regex(GIT_BRANCH_REGEX, 'Invalid branch name format')
    .default('main'),
})

// 部署模式
export const deployProjectSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  customDomain: z.string()
    .regex(DOMAIN_REGEX, 'Invalid domain name format')
    .optional(),
})

// 自定义域名模式
export const customDomainSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  customDomain: z.string()
    .min(1, 'Domain name is required')
    .regex(DOMAIN_REGEX, 'Invalid domain name format'),
})
```

#### 文件结构模式 (`file.ts`)

```typescript
// packages/api/src/schemas/file.ts

// 文件条目模式
export const fileEntrySchema = z.object({
  type: z.literal('file'),
  isBinary: z.boolean(),
  content: z.string(),
})

// 目录条目模式
export const directoryEntrySchema: z.ZodType<{
  type: 'directory'
  children: Record<string, FileEntry | DirectoryEntry>
}> = z.object({
  type: z.literal('directory'),
  children: z.record(
    z.string(),
    z.lazy(() => fileEntrySchema.or(directoryEntrySchema))
  ),
})

// 文件或目录条目
export const fileOrDirEntrySchema = fileEntrySchema.or(directoryEntrySchema)

// 完整文件结构模式
export const fileStructureSchema = z.record(z.string(), fileOrDirEntrySchema)

// 文件内容获取输入模式
export const getFileContentSchema = z.object({
  path: z.string().min(1, 'File path cannot be empty'),
})

// 类型定义导出
export type FileEntry = z.infer<typeof fileEntrySchema>
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>
export type FileOrDirEntry = z.infer<typeof fileOrDirEntrySchema>
export type FileStructure = z.infer<typeof fileStructureSchema>
export type GetFileContentInput = z.infer<typeof getFileContentSchema>
```

#### 历史记录类型 (`history.ts`)

```typescript
// packages/api/src/schemas/history.ts

// 文件类型
export type FileType = {
  type: 'file'
  modified: string
  original: string | null
  path: string
  basename: string
  dirname: string
  description: string
  isNew?: boolean
}

// 文件差异类型
export type FileDiffType = {
  modified: string
  original: string | null
  basename: string
  dirname: string
  path: string
  additions: number
  deletions: number
  type: 'edit' | 'create' | 'delete'
}

// 用户消息类型
export type UserMessageType = {
  type: 'user'
  message: string
  planId: string
  attachment?: {
    key: string
    name: string
    type: string
  }
}

// 命令消息类型
export type CommandMessageType = {
  type: 'command'
  planId: string
  command: 'bun install'
  packages: string[]
  description: string
}

// 差异消息类型
export type DiffMessageType = {
  type: 'diff'
  planId: string
  diff: FileDiffType[]
}

// 计划消息类型
export type PlanMessageType = {
  type: 'plan'
  planId: string
  content: string
}

// 思考消息类型
export type ThinkingMessageType = {
  type: 'thinking'
  planId: string
  content: string
}

// 截图消息类型
export type ScreenshotMessageType = {
  type: 'screenshot'
  planId: string
  previewUrl: string
  screenshotKey?: string
  screenshotTimestamp?: number
}

// 时间消息类型
export type TimingMessageType = {
  type: 'timing'
  planId: string
  timestamp: number
}

// 消息联合类型
export type MessageType =
  | UserMessageType
  | DiffMessageType
  | CommandMessageType
  | PlanMessageType
  | ThinkingMessageType
  | ScreenshotMessageType
  | TimingMessageType

// 历史类型
export type HistoryType = Array<MessageType>
```

#### 安全验证模式 (`turnstile.ts`)

```typescript
// packages/api/src/schemas/turnstile.ts

// Turnstile 验证请求模式
export const turnstileVerificationSchema = z.object({
  token: z.string().min(1, 'Turnstile token is required'),
  remoteip: z.string().ip().optional(),
})

// Turnstile 验证响应模式
export const turnstileResponseSchema = z.object({
  success: z.boolean(),
  'error-codes': z.array(z.string()).optional(),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  cdata: z.string().optional(),
})

// API 响应模式
export const turnstileApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
})

export type TurnstileVerificationRequest = z.infer<typeof turnstileVerificationSchema>
export type TurnstileResponse = z.infer<typeof turnstileResponseSchema>
export type TurnstileApiResponse = z.infer<typeof turnstileApiResponseSchema>
```

## 工具函数

### 数据库连接管理

在 `@libra/api` 中，我们使用两种不同的数据库连接函数，每种都有特定的用途：

#### 数据库连接函数说明

```typescript
/**
 * 获取认证数据库连接 - 用于用户认证、会话管理、组织权限等
 * 适用场景：
 * - 用户登录验证
 * - 会话管理
 * - 组织成员权限检查
 * - 订阅和计费信息
 */
export async function getAuthDb() {
  // 返回认证数据库连接
}

/**
 * 获取业务数据库连接 - 用于核心业务逻辑和数据操作
 * 适用场景：
 * - 项目 CRUD 操作
 * - 文件管理
 * - 历史记录管理
 * - 部署信息存储
 */
export async function getBusinessDb() {
  // 返回业务数据库连接
}
```

#### 选择指南

| 操作类型 | 推荐函数 | 示例场景 |
|---------|---------|----------|
| 用户认证 | `getAuthDb()` | 登录验证、权限检查 |
| 组织管理 | `getAuthDb()` | 成员管理、订阅状态 |
| 项目操作 | `getBusinessDb()` | 创建、更新、删除项目 |
| 文件管理 | `getBusinessDb()` | 文件上传、版本控制 |
| 历史记录 | `getBusinessDb()` | 消息历史、操作日志 |

### 项目工具 (`project.ts`)

项目工具函数提供通用的项目操作和验证功能。

```typescript
// packages/api/src/utils/project.ts

/**
 * 要求组织和用户权限
 */
export async function requireOrgAndUser(ctx: any) {
  const orgId = ctx?.orgId
  const userId = ctx?.session?.user?.id

  if (!orgId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Organization ID is missing'
    })
  }

  if (!userId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User ID is missing'
    })
  }

  return { orgId, userId }
}

/**
 * 获取业务数据库连接
 */
export async function getBusinessDb() {
  const db = await getDbAsync()
  if (!db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database connection is not available',
    })
  }
  return db
}

/**
 * 获取项目数据
 */
export async function fetchProject(db: any, projectId: string) {
  const results = await db.select().from(project).where(eq(project.id, projectId))

  if (results.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Project not found'
    })
  }

  const projectData = results[0]
  if (!projectData) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Project data is corrupted'
    })
  }

  return projectData
}

/**
 * 确保组织访问权限
 */
export function ensureOrgAccess(
  projectData: { organizationId?: string },
  orgId: string,
  action: string
) {
  if (projectData.organizationId !== orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You do not have permission to ${action} this project`,
    })
  }
}

/**
 * 解析消息历史
 */
export function parseMessageHistory(messageHistory: string): HistoryType {
  try {
    const parsed = JSON.parse(messageHistory || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('[Project Utils] Failed to parse message history:', error)
    return []
  }
}

/**
 * 更新项目 Git 信息
 */
export async function updateProjectGitInfo(
  db: any,
  projectId: string,
  gitInfo: { gitUrl?: string; gitBranch?: string }
) {
  const projectData = await fetchProject(db, projectId)
  const updates: any = {}

  if (gitInfo.gitUrl !== undefined) {
    updates.gitUrl = gitInfo.gitUrl
  }

  if (gitInfo.gitBranch !== undefined) {
    updates.gitBranch = gitInfo.gitBranch
  }

  // 只有在有变更时才更新
  if (Object.keys(updates).length === 0) {
    return projectData
  }

  // 执行原子更新
  const [updatedProject] = await db
    .update(project)
    .set(updates)
    .where(eq(project.id, projectId))
    .returning()

  if (!updatedProject) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update project Git information',
    })
  }

  return updatedProject
}
```

### 容器管理 (`container.ts`)

容器管理工具提供 E2B 沙箱环境的创建、管理和清理功能。

```typescript
// packages/api/src/utils/container.ts

/**
 * 沙箱清理结果接口
 */
export interface SandboxCleanupResult {
  success: boolean
  containerId: string
  error?: string
}

/**
 * 沙箱终止选项
 */
export interface TerminationOptions {
  timeoutMs?: number
  retryCount?: number
  maxRetries?: number
}

/**
 * 准备和管理项目容器
 * 处理容器创建、恢复和文件同步
 */
export async function prepareContainer(
  ctx: any,
  projectId: string,
  projectData: { containerId?: string; messageHistory: string }
): Promise<any> {
  const TEMPLATE = 'vite-shadcn-template-zepid'
  const TIMEOUT_MS = 10 * 60_000
  await requireOrgAndUser(ctx)
  const db = await getBusinessDb()

  const containerId = projectData.containerId
  let container: any

  if (containerId) {
    // 尝试恢复现有容器
    const [resumedContainer, resumeError] = await tryCatch(async () =>
      Sandbox.resume(containerId, { timeoutMs: TIMEOUT_MS })
    )

    if (resumeError) {
      console.error(
        `Failed to resume container ${containerId} for project ${projectId}:`,
        resumeError
      )
      container = await handleContainerRecovery(db, projectId, containerId, TEMPLATE, TIMEOUT_MS)
    } else {
      container = resumedContainer
    }
  } else {
    // 创建新容器
    container = await createNewContainer(db, projectId, TEMPLATE, TIMEOUT_MS)
  }

  // 同步文件到容器
  await syncFilesToContainer(container, projectData.messageHistory)
  return container
}

/**
 * 处理容器恢复
 */
async function handleContainerRecovery(
  db: any,
  projectId: string,
  failedContainerId: string,
  template: string,
  timeoutMs: number
): Promise<any> {
  // 清理失败的容器 ID
  await db
    .update(project)
    .set({ containerId: null })
    .where(eq(project.id, projectId))

  // 创建新容器
  return await createNewContainer(db, projectId, template, timeoutMs)
}

/**
 * 创建新容器
 */
async function createNewContainer(
  db: any,
  projectId: string,
  template: string,
  timeoutMs: number
): Promise<any> {
  // 乐观更新：首先尝试设置容器 ID 为占位符值
  const placeholderContainerId = `pending-${Date.now()}`
  const updateResult = await db
    .update(project)
    .set({ containerId: placeholderContainerId })
    .where(
      and(
        eq(project.id, projectId),
        or(isNull(project.containerId), eq(project.containerId, ''))
      )
    )
    .returning()

  // 如果更新失败（没有行被更新），说明另一个进程已经更新了容器 ID
  if (updateResult.length === 0) {
    return
  }

  // 成功获取锁，创建新沙箱
  return await createSandboxWithLock(db, projectId, placeholderContainerId, template, timeoutMs)
}

/**
 * 在获取锁后创建沙箱
 */
async function createSandboxWithLock(
  db: any,
  projectId: string,
  placeholderContainerId: string,
  template: string,
  timeoutMs: number
): Promise<any> {
  const [container, sandboxError] = await tryCatch(async () =>
    Sandbox.create(template, { timeoutMs })
  )

  if (sandboxError) {
    // 如果沙箱创建失败，清理占位符
    await db
      .update(project)
      .set({ containerId: null })
      .where(and(eq(project.id, projectId), eq(project.containerId, placeholderContainerId)))
    throw sandboxError
  }

  // 更新为真实的容器 ID
  await db
    .update(project)
    .set({ containerId: container.id })
    .where(and(eq(project.id, projectId), eq(project.containerId, placeholderContainerId)))

  return container
}

/**
 * 同步文件到容器
 */
async function syncFilesToContainer(container: any, messageHistory: string): Promise<void> {
  const [, syncError] = await tryCatch(async () => {
    const initFiles = templateConfigs.vite as FileStructure
    const history = parseMessageHistory(messageHistory)
    const { fileMap } = buildFilesWithHistory(initFiles, history) || { fileMap: {} }

    const filesToWrite = Object.entries(fileMap)
      .filter(([path]) => !isExcludedFile(path))
      .map(([path, fileInfo]) => ({
        path: `/home/user/vite-shadcn-template-zepid/${path}`,
        data:
          fileInfo.type === 'file' && !fileInfo.isBinary
            ? fileInfo.content
            : JSON.stringify(fileInfo.content),
      }))

    await container.files.write(filesToWrite)
  })

  if (syncError) {
    console.error('[Container] Failed to sync files to container:', syncError)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to sync files to container',
    })
  }
}

/**
 * 终止沙箱并清理资源
 */
export async function terminateSandbox(
  containerId: string,
  options: TerminationOptions = {}
): Promise<SandboxCleanupResult> {
  const { timeoutMs = 30_000, retryCount = 0, maxRetries = 3 } = options

  if (!containerId || containerId.startsWith('pending-')) {
    return {
      success: true,
      containerId,
      error: 'Placeholder container ID, no actual sandbox to terminate',
    }
  }

  const [result, terminationError] = await tryCatch(async () => {
    // 使用静态方法终止沙箱
    const killed = await Sandbox.kill(containerId, { requestTimeoutMs: timeoutMs })
    return killed
  })

  if (terminationError) {
    console.error(`[Container] Failed to terminate sandbox ${containerId}:`, terminationError)

    // 如果还有重试次数，则重试
    if (retryCount < maxRetries) {
      console.log(`[Container] Retrying termination for ${containerId} (${retryCount + 1}/${maxRetries})`)
      return await terminateSandbox(containerId, {
        ...options,
        retryCount: retryCount + 1,
      })
    }

    return {
      success: false,
      containerId,
      error: terminationError instanceof Error ? terminationError.message : String(terminationError),
    }
  }

  return {
    success: true,
    containerId,
  }
}
```

### GitHub 认证 (`github-auth.ts`)

GitHub 认证工具提供 OAuth 和 GitHub App 的认证管理功能。

```typescript
// packages/api/src/utils/github-auth.ts

/**
 * GitHub 认证结果接口
 */
export interface GitHubAuthResult {
  token: string
  type: 'user' | 'installation'
  expiresAt: Date | null
}

/**
 * 生成 GitHub App 安装令牌
 */
export async function generateInstallationToken(installationId: number): Promise<string> {
  const GITHUB_APP_ID = process.env['GITHUB_APP_ID']
  const GITHUB_APP_PRIVATE_KEY = process.env['GITHUB_APP_PRIVATE_KEY']

  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'GitHub App credentials not configured',
    })
  }

  try {
    // 创建 GitHub App 实例
    const { App } = await import('@octokit/app')
    const app = new App({
      appId: GITHUB_APP_ID,
      privateKey: GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })

    // 生成安装访问令牌
    const installationOctokit = await app.getInstallationOctokit(installationId)
    const { data } = await installationOctokit.request(
      'POST /app/installations/{installation_id}/access_tokens',
      {
        installation_id: installationId,
      }
    )

    return data.token
  } catch (error) {
    console.error('[GitHub Auth] Error generating installation token:', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate GitHub installation token',
    })
  }
}

/**
 * 获取 GitHub 认证令牌
 */
export async function getGitHubAuthToken(organizationId: string): Promise<GitHubAuthResult> {
  try {
    const db = await getAuthDb()

    // 首先检查 GitHub App 安装
    const installation = await db.query.githubInstallation.findFirst({
      where: eq(githubInstallation.organizationId, organizationId),
    })

    if (installation) {
      // 检查账户类型
      if (installation.githubAccountType === 'User') {
        // 个人用户安装 - 使用用户令牌
        const userToken = await db.query.githubUserToken.findFirst({
          where: eq(githubUserToken.organizationId, organizationId),
        })

        if (!userToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'GitHub user token not found. Please complete the OAuth authorization.',
          })
        }

        // 检查令牌是否过期并刷新
        if (userToken.expiresAt && userToken.expiresAt < new Date()) {
          const refreshResult = await refreshGitHubUserToken(db, userToken)
          return {
            token: refreshResult.accessToken,
            type: 'user' as const,
            expiresAt: refreshResult.expiresAt ?? null,
          }
        }

        return {
          token: userToken.accessToken,
          type: 'user',
          expiresAt: userToken.expiresAt,
        }
      }

      // 组织安装 - 使用安装令牌
      const installationToken = await generateInstallationToken(installation.installationId)
      return {
        token: installationToken,
        type: 'installation',
        // 安装令牌 1 小时后过期
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }
    }

    // 没有找到安装 - 检查用户令牌作为后备
    const userToken = await db.query.githubUserToken.findFirst({
      where: eq(githubUserToken.organizationId, organizationId),
    })

    if (!userToken) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'GitHub not connected. Please install the GitHub App or complete OAuth authorization.',
      })
    }

    // 检查令牌是否过期并刷新
    if (userToken.expiresAt && userToken.expiresAt < new Date()) {
      const refreshResult = await refreshGitHubUserToken(db, userToken)
      return {
        token: refreshResult.accessToken,
        type: 'user' as const,
        expiresAt: refreshResult.expiresAt ?? null,
      }
    }

    return {
      token: userToken.accessToken,
      type: 'user',
      expiresAt: userToken.expiresAt,
    }
  } catch (error) {
    // 不记录 UNAUTHORIZED 错误，因为这些是预期的
    if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') {
      throw error
    }

    console.error('[GitHub Auth] Error getting auth token:', error)
    if (error instanceof TRPCError) {
      throw error
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get GitHub authentication token',
    })
  }
}

/**
 * 刷新 GitHub 用户令牌
 */
async function refreshGitHubUserToken(db: any, userToken: any) {
  const GITHUB_CLIENT_ID = process.env['GITHUB_CLIENT_ID']
  const GITHUB_CLIENT_SECRET = process.env['GITHUB_CLIENT_SECRET']

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'GitHub OAuth credentials not configured',
    })
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        refresh_token: userToken.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
    }

    // 更新数据库中的令牌
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null

    const [updatedToken] = await db
      .update(githubUserToken)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || userToken.refreshToken,
        expiresAt,
      })
      .where(eq(githubUserToken.id, userToken.id))
      .returning()

    return updatedToken
  } catch (error) {
    console.error('[GitHub Auth] Error refreshing user token:', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to refresh GitHub user token',
    })
  }
}
```

### Stripe 工具 (`stripe-utils.ts`)

Stripe 工具函数提供支付和订阅管理的辅助功能。

```typescript
// packages/api/src/utils/stripe-utils.ts

/**
 * 获取应用程序 URL
 */
export const getURL = (path?: string) => {
  let url =
    process.env['NEXT_PUBLIC_APP_URL'] ?? // 配置的 URL
    'http://localhost:3000/' // 默认开发 URL

  // 确保 URL 不以斜杠结尾
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`

  // 如果提供了路径，添加到 URL
  if (path) {
    // 确保路径不以斜杠开头
    const cleanPath = path.startsWith('/') ? path.substring(1) : path
    url = `${url}${cleanPath}`
  }

  return url
}

/**
 * 解析计划限制
 */
function parsePlanLimits(limits: any) {
  try {
    return typeof limits === 'string' ? JSON.parse(limits) : limits || {}
  } catch {
    return {}
  }
}

/**
 * 解析营销特性
 */
function parseMarketingFeatures(features: any) {
  try {
    return typeof features === 'string' ? JSON.parse(features) : features || []
  } catch {
    return []
  }
}

/**
 * 获取计划配置
 */
function getPlanConfig(planName: string) {
  const name = planName.toLowerCase()

  if (name.includes('free')) {
    return { priority: 0, category: 'free' }
  } else if (name.includes('pro')) {
    return { priority: 2, category: 'pro' }
  } else if (name.includes('basic')) {
    return { priority: 1, category: 'basic' }
  }

  return { priority: 999, category: 'other' }
}

/**
 * 将数据库记录映射为计划对象
 */
export function mapToPlans(planPrices: any[], currentPlan?: string) {
  const plansMap = new Map()

  for (const item of planPrices) {
    const planId = item.plan.id
    const priceId = item.price?.id

    if (!plansMap.has(planId)) {
      const metadata = parsePlanLimits(item.plan.limits)
      const marketingFeatures = parseMarketingFeatures(item.plan.marketing_features)
      const planConfig = getPlanConfig(item.plan.name || '')

      // 构建特性数组
      const features = Array.isArray(metadata.features) ? [...metadata.features] : []
      if (metadata.project_nums) {
        features.push(`Up to ${metadata.project_nums} projects`)
      }
      if (metadata.ai_nums) {
        features.push(`${metadata.ai_nums} AI messages per month`)
      }

      // 确定席位限制
      const seatsLimit =
        typeof metadata.seats === 'number'
          ? metadata.seats
          : Number.parseInt(metadata.seats as string, 10) || 1

      plansMap.set(planId, {
        id: planId,
        name: item.plan.name,
        description: item.plan.description,
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'usd',
        features,
        marketingFeatures,
        limits: {
          projects: metadata.project_nums || 0,
          aiMessages: metadata.ai_nums || 0,
          seats: seatsLimit,
        },
        isCurrentPlan: item.plan.name === currentPlan,
        category: planConfig.category,
        priority: planConfig.priority,
        prices: [],
      })
    }

    // 添加价格信息
    if (priceId && item.price) {
      const plan = plansMap.get(planId)
      const priceAmount = item.price.amount / 100 // 转换为美元

      plan.prices.push({
        id: priceId,
        amount: priceAmount,
        currency: item.price.currency,
        interval: item.price.interval,
      })

      // 设置月度和年度价格
      if (item.price.interval === 'month') {
        plan.monthlyPrice = priceAmount
      } else if (item.price.interval === 'year') {
        plan.yearlyPrice = priceAmount
      }
    }
  }

  // 转换为数组并排序
  const plansArray = Array.from(plansMap.values())
  plansArray.sort((a, b) => {
    const aIsFree = a.name?.toLowerCase().includes('free')
    const bIsFree = b.name?.toLowerCase().includes('free')

    if (aIsFree && !bIsFree) return -1
    if (!aIsFree && bIsFree) return 1

    return a.monthlyPrice - b.monthlyPrice
  })

  return plansArray
}

/**
 * 免费用户的默认订阅限制
 */
export const DEFAULT_FREE_LIMITS = {
  aiNums: 0,
  aiNumsLimit: 10,
  seats: 0,
  seatsLimit: 1,
  projectNums: 0,
  projectNumsLimit: 1,
  plan: 'FREE',
  isActive: false,
}
```

## 错误处理

### 错误处理模式

API 包采用统一的错误处理模式，确保错误信息的一致性和可追踪性。

#### 1. tRPC 错误类型

```typescript
// 常用的 tRPC 错误代码
export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',           // 400 - 请求参数错误
  UNAUTHORIZED: 'UNAUTHORIZED',         // 401 - 未认证
  FORBIDDEN: 'FORBIDDEN',               // 403 - 权限不足
  NOT_FOUND: 'NOT_FOUND',               // 404 - 资源不存在
  CONFLICT: 'CONFLICT',                 // 409 - 资源冲突
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR', // 500 - 服务器内部错误
} as const
```

#### 2. 错误处理工具

```typescript
// packages/api/src/utils/error-handling.ts

/**
 * 安全执行函数，返回结果或错误
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

/**
 * 创建标准化的 tRPC 错误
 */
export function createTRPCError(
  code: keyof typeof ERROR_CODES,
  message: string,
  cause?: unknown
): TRPCError {
  return new TRPCError({
    code,
    message,
    cause,
  })
}

/**
 * 处理数据库错误
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`[Database Error] ${operation}:`, error)

  if (error instanceof Error) {
    // 检查常见的数据库错误
    if (error.message.includes('unique constraint')) {
      throw createTRPCError('CONFLICT', 'Resource already exists')
    }

    if (error.message.includes('foreign key constraint')) {
      throw createTRPCError('BAD_REQUEST', 'Invalid reference to related resource')
    }

    if (error.message.includes('not found')) {
      throw createTRPCError('NOT_FOUND', 'Resource not found')
    }
  }

  throw createTRPCError('INTERNAL_SERVER_ERROR', `Database operation failed: ${operation}`)
}

/**
 * 处理外部 API 错误
 */
export function handleExternalAPIError(error: unknown, service: string): never {
  console.error(`[External API Error] ${service}:`, error)

  if (error instanceof Error) {
    // 检查网络错误
    if (error.message.includes('fetch')) {
      throw createTRPCError('INTERNAL_SERVER_ERROR', `${service} service is unavailable`)
    }

    // 检查认证错误
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      throw createTRPCError('UNAUTHORIZED', `${service} authentication failed`)
    }

    // 检查权限错误
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      throw createTRPCError('FORBIDDEN', `Insufficient permissions for ${service}`)
    }

    // 检查配额错误
    if (error.message.includes('quota') || error.message.includes('limit')) {
      throw createTRPCError('FORBIDDEN', `${service} quota exceeded`)
    }
  }

  throw createTRPCError('INTERNAL_SERVER_ERROR', `${service} service error`)
}
```

#### 3. 日志记录

```typescript
// 使用 @libra/common 的日志系统
import { log } from '@libra/common'

// 记录不同级别的日志
log.project('info', 'Project created successfully', {
  orgId,
  userId,
  projectId: newProject.id,
})

log.ai('warn', 'AI generation quota exceeded', {
  userId,
  organizationId: orgId,
  operation: 'generateText',
})

log.github('error', 'Failed to push code to GitHub', context, error)

log.deployment('info', 'Project deployment completed', {
  projectId,
  workerUrl: deployResult.workerUrl,
})
```

#### 4. 错误恢复策略

```typescript
// 配额检查和恢复
const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
if (!quotaDeducted) {
  // 记录配额超限
  log.project('warn', 'Project creation failed - quota exceeded', {
    orgId, userId, operation: 'create'
  })

  // 抛出用户友好的错误
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Project quota exceeded. Please upgrade your plan or delete existing projects.'
  })
}

// 容器恢复策略
if (containerId) {
  const [resumedContainer, resumeError] = await tryCatch(async () =>
    Sandbox.resume(containerId, { timeoutMs: TIMEOUT_MS })
  )

  if (resumeError) {
    // 记录恢复失败
    console.error(`Failed to resume container ${containerId}:`, resumeError)

    // 尝试创建新容器
    container = await handleContainerRecovery(db, projectId, containerId, TEMPLATE, TIMEOUT_MS)
  } else {
    container = resumedContainer
  }
}
```

## 集成指南

### 在 Next.js 应用中使用

#### 1. 安装和配置

```bash
# 安装依赖
npm install @libra/api @trpc/client @trpc/server @trpc/react-query
```

```typescript
// app/api/trpc/[trpc]/route.ts
import { appRouter, createTRPCContext } from '@libra/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  })

export { handler as GET, handler as POST }
```

#### 2. 客户端配置

```typescript
// lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@libra/api'

export const trpc = createTRPCReact<AppRouter>()

// providers/trpc-provider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from '@/lib/trpc'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

#### 3. 在组件中使用

```typescript
// components/project-list.tsx
'use client'

import { trpc } from '@/lib/trpc'

export function ProjectList() {
  const { data: projects, isLoading, error } = trpc.project.list.useQuery()
  const createProject = trpc.project.create.useMutation()

  const handleCreateProject = async () => {
    try {
      await createProject.mutateAsync({
        name: 'New Project',
        templateType: 'vite',
        visibility: 'private',
      })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={handleCreateProject}>Create Project</button>
      <ul>
        {projects?.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 服务端调用

#### 1. 创建服务端调用器

```typescript
// lib/trpc-server.ts
import { createCaller, createTRPCContext } from '@libra/api'
import { headers } from 'next/headers'

export async function createServerCaller() {
  const headersList = await headers()
  const context = await createTRPCContext({ headers: headersList })
  return createCaller(context)
}
```

#### 2. 在服务端组件中使用

```typescript
// app/dashboard/page.tsx
import { createServerCaller } from '@/lib/trpc-server'

export default async function DashboardPage() {
  const trpc = await createServerCaller()

  try {
    const projects = await trpc.project.list()
    const usage = await trpc.subscription.getUsage()

    return (
      <div>
        <h1>Dashboard</h1>
        <p>Projects: {projects.length}</p>
        <p>AI Messages Used: {usage.aiNums}/{usage.aiNumsLimit}</p>
      </div>
    )
  } catch (error) {
    return <div>Error loading dashboard data</div>
  }
}
```

### 环境变量配置

```bash
# .env.local

# 数据库
DATABASE_URL="postgresql://..."

# 认证
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Azure OpenAI
AZURE_RESOURCE_NAME="your-resource-name"
AZURE_API_KEY="your-api-key"
AZURE_BASE_URL="https://your-gateway.com"
REASONING_ENABLED="true"

# GitHub
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_APP_ID="your-github-app-id"
GITHUB_APP_PRIVATE_KEY="your-github-app-private-key"
GITHUB_APP_NAME="your-github-app-name"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudflare
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
CLOUDFLARE_AIGATEWAY_NAME="your-gateway-name"

# E2B
E2B_API_KEY="your-e2b-api-key"
```

## 安全最佳实践

### 1. 权限验证

#### 组织级权限控制

```typescript
// ✅ 正确的权限验证实现
export const organizationProcedure = protectedProcedure
  .input(z.object({ orgId: z.string().optional() }))
  .use(async ({ ctx, input, next }) => {
    const activeOrganizationId = ctx.session?.session?.activeOrganizationId
    const orgId = input.orgId || activeOrganizationId

    if (!orgId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      })
    }

    // 关键：验证跨组织访问权限
    if (input.orgId && input.orgId !== activeOrganizationId) {
      const hasAccess = await verifyOrganizationAccess(ctx.session.user.id, input.orgId)
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
        })
      }
    }

    return next({ ctx: { ...ctx, orgId, session: ctx.session } })
  })

// ❌ 错误的实现 - 忽略输入参数
export const badOrganizationProcedure = protectedProcedure
  .input(z.object({ orgId: z.string().optional() }))
  .use(({ ctx, next }) => {
    const activeOrganizationId = ctx.session?.session?.activeOrganizationId
    const orgId = activeOrganizationId // 🚨 安全漏洞：忽略用户输入

    return next({ ctx: { ...ctx, orgId } })
  })
```

#### 资源访问控制

```typescript
// ✅ 验证资源所有权
export const updateProject = organizationProcedure
  .input(updateProjectSchema)
  .mutation(async ({ ctx, input }) => {
    const { orgId } = await requireOrgAndUser(ctx)
    const db = await getBusinessDb()

    // 获取项目并验证所有权
    const projectData = await fetchProject(db, input.projectId)
    ensureOrgAccess(projectData, orgId, 'update')

    // 执行更新操作...
  })

// ❌ 缺少所有权验证
export const badUpdateProject = organizationProcedure
  .input(updateProjectSchema)
  .mutation(async ({ ctx, input }) => {
    const db = await getBusinessDb()

    // 🚨 安全漏洞：直接更新，未验证所有权
    await db.update(project)
      .set(input.updates)
      .where(eq(project.id, input.projectId))
  })
```

### 2. 输入验证与清理

```typescript
// ✅ 严格的输入验证
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in project name'),
  gitUrl: z.string()
    .url('Invalid URL format')
    .regex(GITHUB_URL_REGEX, 'Must be a valid GitHub repository URL')
    .optional(),
  customDomain: z.string()
    .regex(DOMAIN_REGEX, 'Invalid domain name format')
    .optional(),
})

// ✅ SQL 注入防护（使用 Drizzle ORM）
const projects = await db
  .select()
  .from(project)
  .where(and(
    eq(project.organizationId, orgId),
    eq(project.userId, userId)
  ))
  .orderBy(desc(project.createdAt))

// ❌ 避免原始 SQL 查询
// const projects = await db.execute(
//   `SELECT * FROM projects WHERE org_id = '${orgId}'` // 🚨 SQL 注入风险
// )
```

### 3. 敏感数据处理

```typescript
// ✅ 敏感信息过滤
export const getUserProfile = protectedProcedure
  .query(async ({ ctx }) => {
    const user = await db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        // 排除敏感字段：password, apiKeys, tokens
      }
    })

    return user
  })

// ✅ API 密钥安全存储
export const storeGitHubToken = organizationProcedure
  .input(z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getAuthDb()

    // 加密存储敏感信息
    const encryptedToken = await encrypt(input.accessToken)
    const encryptedRefresh = input.refreshToken
      ? await encrypt(input.refreshToken)
      : null

    await db.insert(githubUserToken).values({
      organizationId: ctx.orgId,
      accessToken: encryptedToken,
      refreshToken: encryptedRefresh,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8小时
    })
  })
```

## 最佳实践

### 1. 错误处理

```typescript
// ✅ 好的做法：使用 tryCatch 包装异步操作
const [result, error] = await tryCatch(async () => {
  return await someAsyncOperation()
})

if (error) {
  log.error('Operation failed', context, error)
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Operation failed',
  })
}

// ❌ 避免：直接抛出未处理的错误
try {
  const result = await someAsyncOperation()
} catch (error) {
  throw error // 不要直接重新抛出
}
```

### 2. 权限验证

```typescript
// ✅ 好的做法：使用适当的过程类型
export const sensitiveOperation = memberProcedure
  .input(z.object({ projectId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // 自动验证付费会员权限
    const { orgId } = await requireOrgAndUser(ctx)
    // 业务逻辑...
  })

// ❌ 避免：在公共过程中手动检查权限
export const sensitiveOperation = publicProcedure
  .mutation(async ({ ctx, input }) => {
    // 手动权限检查容易遗漏
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
  })
```

### 3. 配额管理

```typescript
// ✅ 好的做法：在操作前检查配额
const quotaDeducted = await checkAndUpdateProjectUsage(orgId)
if (!quotaDeducted) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Project quota exceeded',
  })
}

// 执行操作...

// 如果操作失败，恢复配额
if (operationFailed) {
  await restoreProjectQuotaOnDeletion(orgId)
}
```

### 4. 日志记录

```typescript
// ✅ 好的做法：结构化日志记录
log.project('info', 'Project creation started', {
  orgId,
  userId,
  projectName: input.name,
  templateType: input.templateType,
})

// ✅ 包含上下文信息
const context = {
  userId: ctx.session.user.id,
  organizationId: ctx.orgId,
  operation: 'createProject',
}

log.project('error', 'Project creation failed', context, error)
```

### 5. 数据验证

```typescript
// ✅ 好的做法：使用 Zod 模式验证
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  visibility: z.enum(['public', 'private']).default('private'),
  templateType: z.string().optional(),
})

// ✅ 在路由中使用输入验证
export const createProject = organizationProcedure
  .input(projectSchema)
  .mutation(async ({ ctx, input }) => {
    // input 已经被验证和类型化
  })
```

### 6. 资源清理

```typescript
// ✅ 好的做法：确保资源清理
export const deleteProject = organizationProcedure
  .input(z.object({ projectId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const projectData = await fetchProject(db, input.projectId)

    // 清理容器资源
    if (projectData.containerId) {
      await terminateSandbox(projectData.containerId)
    }

    // 删除项目
    await db.delete(project).where(eq(project.id, input.projectId))

    // 恢复配额
    await restoreProjectQuotaOnDeletion(orgId)
  })
```

### 7. 类型安全

```typescript
// ✅ 严格的类型定义
interface TRPCContext {
  db: Database
  session: Session | null
  orgId?: string
}

interface AuthenticatedContext extends TRPCContext {
  session: Session & { user: User }
}

interface OrganizationContext extends AuthenticatedContext {
  orgId: string
}

// ✅ 类型安全的工具函数
export async function requireOrgAndUser(
  ctx: TRPCContext
): Promise<{ orgId: string; userId: string }> {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User authentication required'
    })
  }

  if (!ctx.orgId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Organization ID is missing'
    })
  }

  return {
    orgId: ctx.orgId,
    userId: ctx.session.user.id
  }
}

// ✅ 使用类型推断
import type { RouterInputs, RouterOutputs } from '@libra/api'

type ProjectCreateInput = RouterInputs['project']['create']
type ProjectListOutput = RouterOutputs['project']['list']

// ✅ 导出类型定义
export type { AppRouter } from '@libra/api'

// ✅ 严格的返回类型
export const getProject = organizationProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }): Promise<ProjectWithDetails> => {
    const { orgId } = await requireOrgAndUser(ctx)
    const db = await getBusinessDb()

    const projectData = await fetchProject(db, input.projectId)
    ensureOrgAccess(projectData, orgId, 'access')

    return projectData
  })

// ❌ 避免使用 any 类型
export const badGetProject = organizationProcedure
  .query(async ({ ctx }): Promise<any> => { // 🚨 类型不安全
    const data = await someFunction()
    return data
  })
```

### 8. 性能优化

```typescript
// ✅ 好的做法：使用数据库事务
await db.transaction(async (tx) => {
  const [newProject] = await tx.insert(project).values(projectData).returning()
  await tx.insert(projectAsset).values(assetData)
  return newProject
})

// ✅ 批量操作
const filesToWrite = Object.entries(fileMap)
  .filter(([path]) => !isExcludedFile(path))
  .map(([path, fileInfo]) => ({ path, data: fileInfo.content }))

await container.files.write(filesToWrite)
```

---

## 故障排除

### 常见问题与解决方案

#### 1. 权限相关问题

**问题**: `Organization ID is required` 错误
```typescript
// 原因：会话中缺少活跃组织ID
const activeOrganizationId = ctx.session?.session?.activeOrganizationId
const orgId = input.orgId || activeOrganizationId // orgId 为 undefined
```

**解决方案**:
```typescript
// 1. 确保用户已选择活跃组织
// 2. 在客户端调用时显式传递 orgId
const result = await trpc.project.create.mutate({
  name: 'New Project',
  orgId: currentOrganization.id // 显式传递组织ID
})

// 3. 服务端添加更详细的错误信息
if (!orgId) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Organization ID is required. Please select an organization or provide orgId parameter.',
  })
}
```

**问题**: `You do not have access to this organization` 错误

**解决方案**:
```typescript
// 检查用户的组织成员关系
const membership = await db.query.organizationMember.findFirst({
  where: and(
    eq(organizationMember.userId, userId),
    eq(organizationMember.organizationId, orgId),
    eq(organizationMember.status, 'active')
  ),
})

// 确保用户是组织的活跃成员
if (!membership) {
  // 用户需要被邀请加入组织或重新激活成员资格
}
```

#### 2. 数据库连接问题

**问题**: `Database connection is not available` 错误

**解决方案**:
```typescript
// 1. 检查环境变量配置
DATABASE_URL="postgresql://user:password@host:port/database"

// 2. 确保数据库服务正在运行
// 3. 验证连接池配置
const db = drizzle(connection, {
  schema,
  logger: process.env.NODE_ENV === 'development',
})

// 4. 添加连接重试逻辑
export async function getBusinessDb() {
  let retries = 3
  while (retries > 0) {
    try {
      const db = await getDbAsync()
      if (!db) throw new Error('Database connection failed')
      return db
    } catch (error) {
      retries--
      if (retries === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection is not available',
        })
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}
```

#### 3. 类型错误

**问题**: TypeScript 类型不匹配错误

**解决方案**:
```typescript
// 1. 确保导入正确的类型
import type { RouterInputs, RouterOutputs } from '@libra/api'

// 2. 使用类型断言时要谨慎
const projectData = result as ProjectWithDetails // 确保类型正确

// 3. 更新 Zod 模式定义
export const projectSchema = z.object({
  name: z.string().min(1),
  templateType: z.enum(['vite', 'next', 'react']).default('vite'),
  visibility: z.enum(['public', 'private']).default('private'),
})

// 4. 保持类型定义与数据库模式同步
export type Project = InferSelectModel<typeof project>
export type NewProject = InferInsertModel<typeof project>
```

#### 4. 配额和限制问题

**问题**: `Project quota exceeded` 或 `Enhance quota exceeded` 错误

**解决方案**:
```typescript
// 1. 检查当前配额使用情况
const usage = await trpc.subscription.getUsage.query()
console.log(`Projects: ${usage.projectNums}/${usage.projectNumsLimit}`)

// 2. 实现配额恢复机制
export async function restoreProjectQuotaOnDeletion(orgId: string) {
  const db = await getAuthDb()

  await db
    .update(subscriptionLimit)
    .set({
      projectNums: sql`${subscriptionLimit.projectNums} + 1`,
      updatedAt: sql`now()`,
    })
    .where(eq(subscriptionLimit.organizationId, orgId))
}

// 3. 升级订阅计划
const upgradeUrl = await trpc.stripe.createCheckoutSession.mutate({
  planId: 'pro-plan',
  successUrl: '/dashboard?upgraded=true',
})
```

### 调试技巧

#### 1. 启用详细日志

```typescript
// 开发环境启用 tRPC 日志
export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
  isDev: process.env.NODE_ENV === 'development',
})

// 添加请求日志中间件
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now()
  const result = await next()
  const durationMs = Date.now() - start

  console.log(`${type} ${path} - ${durationMs}ms`)
  return result
})
```

#### 2. 错误追踪

```typescript
// 集成错误监控服务
import * as Sentry from '@sentry/node'

export const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    // 发送错误到监控服务
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      Sentry.captureException(error.cause)
    }

    return shape
  },
})
```

---

## 总结

`@libra/api` 包提供了一个完整、类型安全、可扩展的 API 层，支持 Zepid 平台的所有核心功能。通过遵循本文档中的模式和最佳实践，开发者可以：

- 构建类型安全的 API 接口
- 实现细粒度的权限控制
- 管理复杂的业务逻辑
- 集成第三方服务
- 确保系统的可靠性和可维护性

如需更多信息，请参考：
- [tRPC 官方文档](https://trpc.io/)
- [Zod 验证库](https://zod.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
