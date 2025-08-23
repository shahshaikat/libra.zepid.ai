# @libra/api

[![Version](https://img.shields.io/npm/v/@libra/api.svg)](https://npmjs.org/package/@libra/api)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/libra-ai/libra/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **Zepid AI 平台的企业级类型安全 API 层**

`@libra/api` 是一个基于 tRPC 构建的全面、类型安全的后端服务，为 Zepid 平台的核心业务功能提供支持。它为 AI 驱动的开发工作流、项目管理、用户认证、支付处理和第三方集成提供了统一、可扩展的 API 接口。

## ✨ 核心特性

### 🔒 **类型安全的 API 层**
- **端到端类型安全** - 使用 tRPC 和 TypeScript
- **自动类型推断** - 输入和输出的自动类型推断
- **运行时验证** - 使用 Zod 模式进行验证
- **全面的错误处理** - 结构化错误响应

### 🚀 **核心业务功能**
- **AI 集成** - Azure OpenAI 集成与配额管理
- **项目管理** - 完整的项目生命周期管理
- **文件系统** - 基于模板的文件结构管理
- **版本控制** - Git/GitHub 集成与自动化工作流
- **容器管理** - E2B 沙箱环境配置
- **部署管理** - 部署状态跟踪和配置
- **自定义域名** - 自定义域名管理和验证

### 💳 **企业级功能**
- **支付处理** - Stripe 集成与订阅管理
- **用户认证** - 基于组织的访问控制
- **审计日志** - 全面的活动跟踪
- **速率限制** - 使用配额和公平使用策略
- **安全性** - 使用 Cloudflare Turnstile 的 CSRF 保护

### 🛠 **开发者体验**
- **模块化架构** - 清晰的关注点分离和有组织的路由结构
- **可扩展设计** - 易于添加新的路由和中间件
- **丰富的文档** - 全面的 API 参考和示例
- **类型安全** - 使用 tRPC 和 TypeScript 的端到端类型推断

## 🏗 架构概览

```
@libra/api
├── 🎯 路由器 (业务逻辑)
│   ├── ai.ts          # AI 文本生成和增强
│   ├── custom-domain.ts # 自定义域名管理
│   ├── file.ts        # 文件结构和模板管理
│   ├── github.ts      # GitHub 集成和仓库管理
│   ├── hello.ts       # 健康检查和基础端点
│   ├── history.ts     # 项目历史和版本控制
│   ├── project/       # 项目操作 (模块化结构)
│   │   ├── basic-operations.ts      # CRUD 操作
│   │   ├── container-operations.ts  # 容器管理
│   │   ├── deployment-operations.ts # 部署状态管理
│   │   ├── history-operations.ts    # 截图和历史
│   │   ├── special-operations.ts    # 分叉和英雄项目
│   │   └── status-operations.ts     # 状态和配额查询
│   ├── project.ts     # 主项目路由聚合
│   ├── session.ts     # 用户会话管理
│   ├── stripe.ts      # 支付和订阅处理
│   └── subscription.ts # 使用限制和配额管理
├── 📋 模式 (数据验证)
│   ├── file.ts        # 文件结构验证
│   ├── history.ts     # 历史记录类型
│   ├── project-schema.ts # 项目数据验证
│   └── turnstile.ts   # 安全验证
├── 🔧 工具 (辅助函数)
│   ├── cloudflare-domain.ts # Cloudflare 域名工具
│   ├── container.ts   # E2B 沙箱管理
│   ├── excludedFiles.ts # 文件排除模式
│   ├── github-auth.ts # GitHub 认证
│   ├── membership-validation.ts # 组织成员验证
│   ├── project-operations.ts # 项目操作辅助
│   ├── project.ts     # 项目工具
│   ├── screenshot-client.ts # 截图服务客户端
│   ├── screenshot-service.ts # 截图服务
│   └── stripe-utils.ts # 支付工具
└── ⚙️ 核心基础设施
    ├── trpc.ts        # tRPC 配置和中间件
    ├── root.ts        # 路由聚合
    └── index.ts       # 包导出
```

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @libra/api

# 使用 pnpm
pnpm add @libra/api

# 使用 bun
bun add @libra/api
```

### 基本用法

#### 服务端用法 (App Router)

```typescript
import { createCaller, createTRPCContext } from '@libra/api'

// 创建服务端调用器
export async function getProjects() {
  const trpc = createCaller(await createTRPCContext({ headers: new Headers() }))
  const projects = await trpc.project.list()
  return projects
}
```

#### 客户端用法 (React 组件)

```typescript
'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery, useMutation } from '@tanstack/react-query'

export function ProjectList() {
  const trpc = useTRPC()

  // 查询数据
  const { data: projects, isLoading } = useQuery({
    ...trpc.project.list.queryOptions({}),
  })

  // 变更操作
  const createProject = useMutation(trpc.project.create.mutationOptions())

  const handleCreate = () => {
    createProject.mutate({
      name: '我的新项目',
      visibility: 'private',
      templateType: 'default'
    })
  }

  if (isLoading) return <div>加载中...</div>

  return (
    <div>
      <button onClick={handleCreate}>创建项目</button>
      {projects?.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  )
}
```

## 📚 API 概览

> **注意**: 部署功能由独立的服务（`@libra/deploy` 和 `@libra/deploy-workflow`）处理，而不是此包中的专用路由器。`project` 路由器包含部署状态管理操作。

### 核心路由器

| 路由器 | 描述 | 主要操作 |
|--------|------|----------|
| `ai` | AI 文本生成和增强 | `generateText` |
| `project` | 项目生命周期管理 | `create`, `update`, `list`, `delete`, `fork`, `getDeploymentStatus`, `updateDeploymentStatus` |
| `github` | GitHub 集成 | `getRepositories`, `pushCode`, `createProjectRepository` |
| `customDomain` | 自定义域名管理 | 域名配置和验证 |
| `file` | 文件管理 | `getFileTree` |
| `history` | 项目历史 | `getAll`, `appendHistory`, `revert` |
| `stripe` | 支付处理 | `getUserPlans`, `createPortalSession` |
| `subscription` | 使用管理 | `getUsage` |
| `session` | 会话管理 | `list` |
| `hello` | 健康检查和基础端点 | 基本 API 健康检查 |

### 认证级别

- **`publicProcedure`** - 无需认证
- **`protectedProcedure`** - 需要用户认证
- **`organizationProcedure`** - 需要组织成员身份

## 🔧 环境配置

```bash
# AI 配置
AZURE_RESOURCE_NAME=your-azure-resource
AZURE_API_KEY=your-azure-api-key
AZURE_DEPLOYMENT_NAME=your-deployment
AZURE_BASE_URL=https://your-gateway.com

# GitHub 集成
GITHUB_APP_ID=your-app-id
GITHUB_APP_CLIENT_ID=your-client-id
GITHUB_APP_CLIENT_SECRET=your-client-secret
GITHUB_APP_PRIVATE_KEY=your-private-key

# Stripe 配置
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Cloudflare 配置
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_AI_GATEWAY_NAME=your-gateway

# 应用设置
NEXT_PUBLIC_APP_URL=https://your-app.com
```

## 🏢 技术栈

### 核心框架
- **[tRPC](https://trpc.io/)** - 具有端到端类型安全的类型安全 API 框架
- **[SuperJSON](https://github.com/blitz-js/superjson)** - 复杂数据类型的增强序列化

### 数据和验证
- **[Zod](https://zod.dev/)** - 运行时验证和类型推断
- **[Drizzle ORM](https://orm.drizzle.team/)** - 类型安全的数据库操作（通过 @libra/db）

### 金融和支付
- **[Dinero.js](https://dinerojs.com/)** - 不可变的货币处理和计算
- **[Stripe](https://stripe.com/)** - 支付处理和订阅管理

### AI 和开发
- **[Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)** - AI 功能和文本生成
- **[E2B](https://e2b.dev/)** - 代码执行的沙箱环境

### 基础设施
- **[Better Auth](https://better-auth.com/)** - 认证和会话管理
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - 边缘部署平台

## 📖 文档

- **[开发指南](./DEV.md)** - 全面的开发文档
- **[中文开发指南](./DEV_ZH.md)** - 中文开发指南
- **[路由器详情](./DEV.md#router-details)** - 详细的 API 路由器文档
- **[集成指南](./DEV.md#integration-guide)** - 设置和集成示例

## 🤝 贡献

我们欢迎贡献！请查看我们的[行为准则](../../code_of_conduct.md)和[技术指南](../../TECHNICAL_GUIDELINES.md)了解详情。

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/libra-ai/libra.git
cd libra

# 安装依赖
bun install

# 构建包
cd packages/api
bun run build

# 运行类型检查
bun run typecheck

# 运行代码检查和格式化
bun run format-and-lint
```

### 测试

目前，此包专注于通过主应用程序进行类型安全和集成测试。全面测试包括：

- **类型安全**: 通过 TypeScript 和 tRPC 的端到端类型推断确保
- **集成测试**: 通过主 Web 应用程序执行
- **API 测试**: 在开发模式下使用 tRPC 客户端进行交互式测试

未来版本将包含专用的单元和集成测试套件。

## 📄 许可证

此项目根据 [AGPL-3.0 许可证](https://github.com/libra-ai/libra/blob/main/LICENSE) 授权。

## 🔗 相关包

- **[@libra/auth](../auth)** - 认证和授权
- **[@libra/common](../common)** - 共享工具和类型
- **[@libra/db](../db)** - 数据库模式和操作
- **[@libra/sandbox](../sandbox)** - 沙箱环境管理
- **[@libra/ui](../ui)** - UI 组件和设计系统

---

<div align="center">
  <strong>由 Zepid 团队用 ❤️ 构建</strong>
</div>