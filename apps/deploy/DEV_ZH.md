# @libra/deploy 开发指南

> 基于 Cloudflare Workers 队列的高性能部署服务

版本：1.0.0  
最后更新：2025-07-30

## 目录

- [概述](#概述)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [目录结构](#目录结构)
- [环境设置](#环境设置)
- [开发指南](#开发指南)
- [部署工作流](#部署工作流)
- [API 参考](#api-参考)
- [队列系统](#队列系统)
- [部署指南](#部署指南)
- [故障排除](#故障排除)
- [相关资源](#相关资源)

## 概述

`@libra/deploy` 是 Libra AI 平台的核心部署服务，基于 Cloudflare Workers 队列架构构建。提供项目部署、状态管理、配额控制、错误处理等功能，支持异步队列处理和智能重试策略。通过队列驱动的架构，实现了高可扩展性和可靠性的部署体系。

## 核心功能

### 🚀 部署管理
| 功能 | 说明 | 技术特点 |
|-----|------|----------|
| **队列部署** | 基于 Cloudflare Queues 的异步处理 | 批处理、并发控制、自动重试 |
| **六步工作流** | 验证→同步→沙箱→构建→部署→清理 | 状态追踪、错误恢复、日志记录 |
| **状态管理** | D1 数据库 + R2 存储混合架构 | 快速查询、详细日志、持久化 |
| **配额控制** | 组织级别的部署配额管理 | 自动扣除、限制检查、使用统计 |
| **错误处理** | 死信队列 + 重试机制 | 3次重试、失败分类、手动干预 |

### 📊 监控与状态
| 功能 | 说明 | 访问方式 |
|-----|------|----------|
| **实时状态** | 部署进度和状态查询 | `GET /deploy-status?id={deploymentId}` |
| **健康检查** | 服务和依赖状态监控 | `GET /health` |
| **队列监控** | 队列状态和处理统计 | 内置监控、日志分析 |
| **部署历史** | 历史部署记录和日志 | D1 查询、R2 日志存储 |

### 🔧 开发者工具
| 工具 | 用途 | 访问路径 |
|-----|------|----------|
| **API 文档** | Scalar 交互式文档（OpenAPI 3.1） | `/docs` |
| **OpenAPI** | API 规范导出 | `/openapi.json` |
| **健康检查** | 服务状态监控 | `/health` |
| **服务信息** | 版本和端点信息 | `/` |

## 技术架构

### 🏗️ 核心技术栈
```typescript
// 运行时环境
├── Cloudflare Workers    // 边缘计算平台
├── Hono v4.x            // 高性能 Web 框架  
├── TypeScript 5.x       // 类型安全保障
└── Node.js 18+          // 开发环境要求

// 队列系统
├── Cloudflare Queues    // 异步消息队列
├── Dead Letter Queue    // 失败消息处理
├── Batch Processing     // 批量消息处理
└── Retry Mechanism      // 智能重试策略

// 存储层
├── D1 Database          // SQLite（状态管理）
├── R2 Storage           // 对象存储（日志和构件）
├── KV Namespace         // 键值存储（缓存）
└── Cache API            // 边缘缓存

// API 层
├── @hono/zod-openapi    // OpenAPI 集成
├── Zod Schemas          // 运行时验证
├── @scalar/hono-api-ref // API 文档 UI
└── @libra/auth          // 认证授权框架

// 部署工具链
├── @libra/sandbox       // 沙箱环境管理
├── @libra/templates     // 项目模板系统
├── @libra/db            // 数据库操作
└── @libra/common        // 日志和工具库
```

### 🔄 队列架构
| 组件 | 功能 | 配置 |
|-----|------|------|
| **deployment-queue** | 主部署队列 | 批大小:1, 超时:0s, 重试:2次 |
| **deployment-dlq** | 死信队列 | 失败消息存储和手动处理 |
| **Queue Consumer** | 消息消费者 | 最大并发:5, 批处理支持 |
| **Queue Producer** | 消息生产者 | HTTP API 触发, 消息序列化 |

### 🔐 安全架构
| 层级 | 技术 | 说明 |
|-----|------|------|
| **认证** | @libra/auth | Bearer Token、Session 管理 |
| **授权** | 中间件链 | 路由级权限控制 |
| **验证** | Zod Schemas | 请求/响应验证、参数校验 |
| **CORS** | 动态配置 | localhost/zepid.dev 白名单 |
| **配额** | D1 存储 | 组织级别的部署限制 |
| **错误处理** | 结构化日志 | 敏感信息过滤、错误分类 |

## 目录结构

```text
apps/deploy/                           # 部署服务根目录
├── README.md                          # 基础服务文档
├── ARCH.md                           # 架构设计文档
├── package.json                      # 依赖和脚本定义
├── tsconfig.json                     # TypeScript 配置
├── vitest.config.ts                  # 测试配置
├── wrangler.jsonc                    # Cloudflare Workers 配置（使用兼容日期2025-07-17）
├── wrangler.jsonc.example            # 配置文件示例
├── worker-configuration.d.ts         # Cloudflare Workers 环境类型
├── public/                           # 静态资源目录
│   └── favicon.ico                   # 服务图标
├── src/                              # 源代码目录
│   ├── index.ts                      # Worker 主入口，集成 HTTP API 和队列处理
│   ├── openapi.ts                    # OpenAPI 应用配置和路由注册
│   ├── api/                          # HTTP API 路由和中间件
│   │   └── middleware/               # API 中间件目录
│   ├── deployment/                   # 部署工作流核心
│   │   ├── workflow.ts               # 队列部署工作流编排器
│   │   ├── state.ts                  # 部署状态管理器
│   │   └── steps/                    # 六步部署流程实现
│   │       ├── validate.ts           # 步骤1: 参数验证和项目检查
│   │       ├── sync.ts               # 步骤2: 数据同步和准备
│   │       ├── sandbox.ts            # 步骤3: 沙箱环境创建
│   │       ├── build.ts              # 步骤4: 项目构建和编译
│   │       ├── deploy.ts             # 步骤5: 部署到目标环境
│   │       └── cleanup.ts            # 步骤6: 资源清理和收尾
│   ├── queue/                        # 队列系统实现
│   │   ├── consumer.ts               # 队列消息消费者
│   │   └── producer.ts               # 队列消息生产者
│   ├── types/                        # TypeScript 类型定义
│   │   ├── index.ts                  # 主要类型导出
│   │   ├── deployment.ts             # 部署相关类型
│   │   └── queue.ts                  # 队列消息类型
│   └── utils/                        # 工具函数库
│       ├── common.ts                 # 通用工具函数
│       ├── logger.ts                 # 日志记录工具
│       ├── errors.ts                 # 错误处理工具
│       ├── deployment.ts             # 部署辅助工具
│       └── deploy-quota.ts           # 配额管理工具
└── node_modules/                     # 依赖包目录
```

## 环境设置

### 前置要求

```bash
# 必需工具
node >= 18.0.0
bun >= 1.0.0
wrangler >= 4.0.0

# 全局安装 Wrangler
npm install -g wrangler

# Cloudflare 认证
wrangler auth login
```

### 环境变量

在 `apps/deploy` 目录创建 `.dev.vars` 文件：

```bash
# GitHub OAuth 配置
BETTER_GITHUB_CLIENT_ID=your_github_client_id
BETTER_GITHUB_CLIENT_SECRET=your_github_client_secret

# Cloudflare 配置
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id

# 数据库配置
DATABASE_ID=your_database_id
POSTGRES_URL=postgresql://user:password@host:port/database

# 沙箱提供商配置
E2B_API_KEY=your_e2b_api_key
DAYTONA_API_KEY=your_daytona_api_key
SANDBOX_BUILDER_DEFAULT_PROVIDER=daytona

# 安全配置
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# 队列配置
DEPLOYMENT_QUEUE_NAME=deployment-queue
DEPLOYMENT_DLQ_NAME=deployment-dlq
MAX_DEPLOYMENT_TIMEOUT=600000
MAX_CONCURRENT_DEPLOYMENTS=5

# 注意：
# 1. 大部分配置已在 wrangler.jsonc 的 vars 部分预设
# 2. .dev.vars 主要用于覆盖敏感信息
# 3. Cloudflare 资源（Queues、D1、R2）通过 wrangler.jsonc 配置
```

### 安装

```bash
# 进入部署服务目录
cd apps/deploy

# 安装依赖（在项目根目录执行）
cd ../../ && bun install

# 返回部署服务目录
cd apps/deploy

# 生成 Cloudflare 类型定义
bun run cf-typegen

# 创建环境变量文件（如果需要）
touch .dev.vars

# 编辑环境变量
nano .dev.vars
```

## 开发指南

### 快速开始

```bash
# 启动开发服务器
bun dev

# 服务将在以下地址可用：
# - 本地：http://localhost:3008
# - API 文档：http://localhost:3008/docs
# - 服务信息：http://localhost:3008/
```

### API 测试与文档

#### API 文档访问

```bash
# 启动服务后，访问自动生成的 API 文档
open http://localhost:3008/docs

# 查看 OpenAPI 规范
curl http://localhost:3008/openapi.json
```

#### 部署请求

```bash
# 创建新部署（需要认证）
curl -X POST http://localhost:3008/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "your_project_id",
    "orgId": "your_org_id",
    "userId": "your_user_id",
    "customDomain": "example.com",
    "initFiles": [
      {
        "path": "index.html",
        "content": "<!DOCTYPE html><html>...</html>"
      }
    ],
    "historyMessages": [
      {
        "role": "user",
        "content": "Create a simple website"
      }
    ]
  }'

# 响应示例
{
  "success": true,
  "deploymentId": "abc123def456789",
  "status": "queued",
  "message": "Deployment queued successfully",
  "timestamp": "2025-07-22T10:30:00.000Z"
}
```

#### 状态查询

```bash
# 查询部署状态
curl "http://localhost:3008/deploy-status?id=abc123def456789"

# 响应示例
{
  "deploymentId": "abc123def456789",
  "status": "building",
  "currentStep": "build",
  "progress": 60,
  "steps": {
    "validate": { "status": "completed", "timestamp": "2025-07-22T10:30:05.000Z" },
    "sync": { "status": "completed", "timestamp": "2025-07-22T10:30:10.000Z" },
    "sandbox": { "status": "completed", "timestamp": "2025-07-22T10:30:15.000Z" },
    "build": { "status": "in_progress", "timestamp": "2025-07-22T10:30:20.000Z" },
    "deploy": { "status": "pending" },
    "cleanup": { "status": "pending" }
  },
  "logs": [
    "Validating deployment parameters...",
    "Syncing project data...",
    "Creating sandbox environment...",
    "Building project..."
  ],
  "timestamp": "2025-07-22T10:30:25.000Z"
}
```

#### 健康检查

```bash
# 基础健康检查
curl "http://localhost:3008/health"

# 响应示例
{
  "status": "healthy",
  "timestamp": "2025-07-22T10:30:00.000Z",
  "service": "Libra Deploy V2",
  "version": "2.0.0",
  "uptime": 1234567,
  "checks": {
    "database": "healthy",
    "queue": "healthy"
  }
}
```

### 核心功能实现

#### 主入口文件 (src/index.ts)

```typescript
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import {
  createErrorHandler,
  createCorsMiddleware,
  createLoggingMiddleware,
  createRequestIdMiddleware
} from '@libra/middleware'
import { handleQueueBatch } from './queue/consumer'
import { openApiApp } from './openapi'
import { createLogger } from './utils/logger'
import type { Bindings, Variables, QueueMessage } from './types'

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

// 应用中间件栈
app.onError(createErrorHandler('deploy-v2'))
app.use('*', createRequestIdMiddleware())
app.use('*', createLoggingMiddleware({ service: 'deploy-v2', level: 'info' }))
app.use('*', createCorsMiddleware())

// 集成 OpenAPI 应用路由
app.route('/', openApiApp)

// API 文档
app.get('/docs', Scalar({
  url: '/openapi.json',
  theme: 'default',
  pageTitle: 'Libra Deploy V2 API Documentation'
}))

// Cloudflare Worker 导出
export default {
  fetch: app.fetch,

  // 队列消息处理
  async queue(batch: MessageBatch<QueueMessage>, env: Bindings, ctx: ExecutionContext) {
    const logger = createLogger(env)

    try {
      await handleQueueBatch(batch, env, ctx)
    } catch (error) {
      logger.error('Queue batch processing failed', { error })
      throw error
    }
  }
}
```

## 部署工作流

### 六步部署流程

部署服务采用标准化的六步工作流，每个步骤都有明确的职责和错误处理机制：

#### 步骤 1: 验证 (Validate)
**文件**: `src/deployment/steps/validate.ts`

**功能**:
- 验证部署参数完整性和有效性
- 检查项目存在性和权限
- 验证配额和限制
- 检查自定义域名可用性

**实现要点**:
```typescript
export async function validateStep(params: DeploymentParams, context: DeploymentContext) {
  // 参数验证
  if (!params.projectId || !params.orgId || !params.userId) {
    throw new DeploymentError('Missing required parameters', ErrorCodes.VALIDATION_ERROR)
  }

  // 项目存在性检查
  const project = await getProject(params.projectId)
  if (!project) {
    throw new DeploymentError('Project not found', ErrorCodes.PROJECT_NOT_FOUND)
  }

  // 配额检查
  await checkDeploymentQuota(params.orgId)

  // 自定义域名验证
  if (params.customDomain) {
    await validateCustomDomain(params.customDomain)
  }
}
```

#### 步骤 2: 同步 (Sync)
**文件**: `src/deployment/steps/sync.ts`

**功能**:
- 从数据库获取项目数据和文件
- 同步历史消息和上下文
- 准备部署所需的所有数据
- 创建部署工作目录

**关键特性**:
- 数据完整性检查
- 增量同步支持
- 错误恢复机制

#### 步骤 3: 沙箱 (Sandbox)
**文件**: `src/deployment/steps/sandbox.ts`

**功能**:
- 创建隔离的沙箱环境
- 配置运行时环境和依赖
- 设置安全策略和资源限制
- 准备构建环境

**支持的沙箱提供商**:
- **Daytona**: 默认提供商，云原生开发环境
- **E2B**: 备选提供商，代码执行沙箱

#### 步骤 4: 构建 (Build)
**文件**: `src/deployment/steps/build.ts`

**功能**:
- 在沙箱环境中执行项目构建
- 处理依赖安装和编译
- 生成静态资源和构建产物
- 优化和压缩输出文件

**构建特性**:
- 多框架支持（React、Vue、Next.js等）
- 智能缓存机制
- 构建日志记录
- 错误诊断和报告

#### 步骤 5: 部署 (Deploy)
**文件**: `src/deployment/steps/deploy.ts`

**功能**:
- 将构建产物部署到目标环境
- 配置 CDN 和缓存策略
- 设置自定义域名和 SSL
- 更新 DNS 记录

**部署目标**:
- Cloudflare Pages（主要）
- 静态文件托管
- 边缘函数部署

#### 步骤 6: 清理 (Cleanup)
**文件**: `src/deployment/steps/cleanup.ts`

**功能**:
- 清理临时文件和沙箱环境
- 释放资源和连接
- 更新部署状态和统计
- 发送完成通知

### 工作流编排器

**文件**: `src/deployment/workflow.ts`

```typescript
export class QueueDeploymentWorkflow {
  private steps = [
    { name: 'validate', handler: validateStep },
    { name: 'sync', handler: syncStep },
    { name: 'sandbox', handler: sandboxStep },
    { name: 'build', handler: buildStep },
    { name: 'deploy', handler: deployStep },
    { name: 'cleanup', handler: cleanupStep }
  ]

  async execute(params: DeploymentParams, context: DeploymentContext) {
    const stateManager = new DeploymentStateManager(context.env)

    try {
      for (const step of this.steps) {
        await stateManager.updateStepStatus(
          context.deploymentId,
          step.name,
          'in_progress'
        )

        await step.handler(params, context)

        await stateManager.updateStepStatus(
          context.deploymentId,
          step.name,
          'completed'
        )
      }

      await stateManager.updateDeploymentStatus(
        context.deploymentId,
        'completed'
      )

    } catch (error) {
      await stateManager.updateDeploymentStatus(
        context.deploymentId,
        'failed',
        error.message
      )
      throw error
    }
  }
}
```

### 状态管理

**文件**: `src/deployment/state.ts`

部署状态通过混合存储架构管理：

**D1 数据库**:
- 部署基本信息和状态
- 步骤进度和时间戳
- 错误信息和重试计数

**R2 存储**:
- 详细的构建日志
- 部署产物和构件
- 错误堆栈和调试信息

```typescript
export class DeploymentStateManager {
  async updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus,
    error?: string
  ) {
    // 更新 D1 数据库状态
    await this.db.update(deployments)
      .set({
        status,
        error,
        updatedAt: new Date()
      })
      .where(eq(deployments.id, deploymentId))

    // 如果有详细日志，存储到 R2
    if (error) {
      await this.storeDetailedLogs(deploymentId, { error, timestamp: new Date() })
    }
  }
}
```

## API 参考

### 认证

所有需要认证的接口都需要在请求头中包含有效的 Bearer Token 或 Session：

```bash
# Bearer Token 认证
Authorization: Bearer YOUR_TOKEN

# Session 认证（通过 Cookie）
Cookie: session=YOUR_SESSION_TOKEN
```

**公开端点（无需认证）**：
- `GET /` - 服务信息
- `GET /health` - 健康检查
- `GET /docs` - API 文档
- `GET /openapi.json` - OpenAPI 规范

### 部署管理

#### POST /deploy

创建新的部署任务并加入队列处理。

**认证**：必需

**请求体**：
```typescript
{
  projectId: string,        // 项目 ID（必需）
  orgId: string,           // 组织 ID（必需）
  userId: string,          // 用户 ID（必需）
  customDomain?: string,   // 自定义域名（可选）
  initFiles?: Array<{      // 初始文件（可选）
    path: string,
    content: string
  }>,
  historyMessages?: Array<{ // 历史消息（可选）
    role: 'user' | 'assistant',
    content: string
  }>
}
```

**响应**：
```typescript
{
  success: boolean,        // 操作是否成功
  deploymentId: string,    // 部署任务 ID
  status: 'queued',        // 初始状态
  message: string,         // 操作结果消息
  timestamp: string        // 时间戳
}
```

#### GET /deploy-status

查询部署任务的当前状态和进度。

**认证**：不需要

**查询参数**：
- `id`：部署任务 ID

**响应**：
```typescript
{
  deploymentId: string,    // 部署任务 ID
  status: 'queued' | 'in_progress' | 'completed' | 'failed', // 总体状态
  currentStep?: string,    // 当前执行步骤
  progress: number,        // 进度百分比 (0-100)
  steps: {                 // 各步骤详细状态
    validate: StepStatus,
    sync: StepStatus,
    sandbox: StepStatus,
    build: StepStatus,
    deploy: StepStatus,
    cleanup: StepStatus
  },
  logs: string[],          // 执行日志
  error?: string,          // 错误信息（如果失败）
  timestamp: string        // 最后更新时间
}

// StepStatus 类型
{
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  timestamp?: string,
  error?: string
}
```

### 监控和健康检查

#### GET /health

获取服务健康状态。

**认证**：不需要

**响应**：
```typescript
{
  status: 'healthy' | 'unhealthy',  // 服务状态
  timestamp: string,                // 检查时间
  service: string,                  // 服务名称
  version: string,                  // 服务版本
  uptime: number,                   // 运行时间（毫秒）
  checks: {                         // 依赖检查
    database: 'healthy' | 'unhealthy',
    queue: 'healthy' | 'unhealthy'
  }
}
```

#### GET /

获取服务基本信息。

**认证**：不需要

**响应**：
```typescript
{
  message: string,          // 服务描述
  service: string,          // 服务名称
  version: string,          // 版本号
  status: string,           // 运行状态
  timestamp: string,        // 当前时间
  architecture: string,     // 架构类型
  description: string,      // 详细描述
  endpoints: string[]       // 可用端点列表
}
```

### 错误响应

所有 API 在出错时都会返回统一的错误格式：

```typescript
{
  success: false,
  error: string,            // 错误类型
  message: string,          // 错误描述
  details?: any,            // 详细信息（可选）
  timestamp: string         // 错误时间
}
```

**常见错误码**：
- `400` - 请求参数错误
- `401` - 认证失败
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求频率限制
- `500` - 服务器内部错误

## 队列系统

### 队列配置

部署服务使用两个 Cloudflare Queues：

#### deployment-queue（主队列）
```json
{
  "queue": "deployment-queue",
  "max_batch_size": 1,        // 批处理大小：1个消息
  "max_batch_timeout": 0,     // 批处理超时：立即处理
  "max_retries": 2,           // 最大重试次数：2次
  "max_concurrency": 5,       // 最大并发数：5个
  "dead_letter_queue": "deployment-dlq"
}
```

#### deployment-dlq（死信队列）
```json
{
  "queue": "deployment-dlq",
  "binding": "DEPLOYMENT_DLQ"
}
```

### 消息格式

队列消息采用标准化的 JSON 格式：

```typescript
interface QueueMessage {
  deploymentId: string,     // 部署任务唯一标识
  params: DeploymentParams, // 部署参数
  metadata: {
    timestamp: string,      // 消息创建时间
    retryCount: number,     // 重试次数
    priority: number        // 优先级（预留）
  }
}
```

### 队列处理流程

#### 消息生产者 (src/queue/producer.ts)

```typescript
export async function sendToQueue(
  queue: Queue<QueueMessage>,
  deploymentId: string,
  params: DeploymentParams
) {
  const message: QueueMessage = {
    deploymentId,
    params,
    metadata: {
      timestamp: new Date().toISOString(),
      retryCount: 0,
      priority: 1
    }
  }

  await queue.send(message)
}
```

#### 消息消费者 (src/queue/consumer.ts)

```typescript
export async function handleQueueBatch(
  batch: MessageBatch<QueueMessage>,
  env: Bindings,
  ctx: ExecutionContext
) {
  const workflow = new QueueDeploymentWorkflow()

  for (const message of batch.messages) {
    try {
      const context = createDeploymentContext(message.body.deploymentId, env)
      await workflow.execute(message.body.params, context)

      // 确认消息处理成功
      message.ack()

    } catch (error) {
      // 记录错误并重试
      console.error('Deployment failed:', error)
      message.retry()
    }
  }
}
```

## 部署指南

### 准备工作

1. **Cloudflare 账户设置**
   - 活跃的 Cloudflare 账户
   - 启用 Workers 服务
   - 配置 Queues 服务
   - 配置 D1 数据库
   - 配置 R2 存储桶（可选）

2. **认证设置**
   ```bash
   wrangler auth login
   wrangler whoami
   ```

### 资源配置

#### Cloudflare Queues

```bash
# 创建主部署队列
wrangler queues create deployment-queue

# 创建死信队列
wrangler queues create deployment-dlq

# 查看队列列表
wrangler queues list
```

#### D1 数据库

```bash
# 创建 D1 数据库
wrangler d1 create libra

# 查看数据库列表
wrangler d1 list

# 执行数据库迁移（如果需要）
wrangler d1 migrations apply libra
```

#### R2 存储桶（可选）

```bash
# 创建日志存储桶
wrangler r2 bucket create libra-deployment-logs

# 创建构件存储桶
wrangler r2 bucket create libra-deployment-artifacts

# 查看存储桶列表
wrangler r2 bucket list
```

### 环境部署

#### 开发环境

```bash
# 启动开发服务器
bun dev

# 开发服务器将在 http://localhost:3008 启动
# 队列处理器会自动启动并监听消息
```

#### 生产环境

```bash
# 设置生产环境密钥
wrangler secret put BETTER_GITHUB_CLIENT_SECRET --env production
wrangler secret put POSTGRES_URL --env production
wrangler secret put E2B_API_KEY --env production
wrangler secret put DAYTONA_API_KEY --env production

# 部署到生产环境
bun run deploy:prod
```

### 自定义域名

```bash
# 添加自定义域名路由
wrangler route add "deploy.zepid.dev/*" libra-deploy

# 查看当前路由
wrangler route list
```

### wrangler.jsonc 配置

```json
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "libra-deploy",
  "main": "src/index.ts",
  "compatibility_date": "2025-07-17",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],

  "routes": [
    {
      "pattern": "deploy.zepid.dev",
      "custom_domain": true
    }
  ],

  "d1_databases": [
    {
      "binding": "DATABASE",
      "database_name": "zepid-d1",
      "database_id": "your_database_id"
    }
  ],

  "queues": {
    "consumers": [
      {
        "queue": "deployment-queue",
        "max_batch_size": 1,
        "max_batch_timeout": 0,
        "max_retries": 2,
        "max_concurrency": 5,
        "dead_letter_queue": "deployment-dlq"
      }
    ],
    "producers": [
      {
        "queue": "deployment-queue",
        "binding": "DEPLOYMENT_QUEUE"
      },
      {
        "queue": "deployment-dlq",
        "binding": "DEPLOYMENT_DLQ"
      }
    ]
  },

  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info",
    "DEPLOYMENT_QUEUE_NAME": "deployment-queue",
    "DEPLOYMENT_DLQ_NAME": "deployment-dlq",
    "MAX_DEPLOYMENT_TIMEOUT": "600000",
    "MAX_CONCURRENT_DEPLOYMENTS": "5"
  }
}
```

## 故障排除

### 常见问题

#### 部署请求失败

**症状**：部署请求返回 400 或 500 错误。

**解决方案**：
```bash
# 检查认证状态
curl -X POST http://localhost:3008/deploy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","orgId":"test","userId":"test"}' -v

# 检查队列配置
wrangler queues list

# 检查 D1 数据库
wrangler d1 list

# 查看实时日志
wrangler tail
```

#### 队列处理失败

**症状**：部署任务卡在 "queued" 状态。

**解决方案**：
- 检查队列消费者配置
- 查看死信队列中的失败消息
- 检查并发限制设置
- 验证环境变量配置

#### 部署状态查询异常

**症状**：状态查询返回 404 或过期数据。

**解决方案**：
- 确认部署 ID 正确
- 检查 D1 数据库连接
- 验证状态管理器实现
- 查看数据库表结构

#### 沙箱环境创建失败

**症状**：部署在 sandbox 步骤失败。

**解决方案**：
```bash
# 检查沙箱提供商配置
echo $E2B_API_KEY
echo $DAYTONA_API_KEY

# 验证沙箱提供商状态
# 检查 src/deployment/steps/sandbox.ts 配置

# 测试沙箱连接
curl -X GET "https://api.e2b.dev/health" \
  -H "Authorization: Bearer $E2B_API_KEY"
```

### 调试工具

#### 日志查看

```bash
# 实时查看 Worker 日志
wrangler tail

# 查看开发日志
bun dev --verbose

# 查看队列处理日志
wrangler queues consumer --name deployment-queue
```

#### 队列监控

```bash
# 查看队列状态
wrangler queues list

# 查看死信队列消息
wrangler queues consumer --name deployment-dlq

# 手动发送测试消息
wrangler queues producer --name deployment-queue --message '{"test": true}'
```

#### 性能监控

```bash
# 检查部署性能
curl -w "@curl-format.txt" http://localhost:3008/health

# curl-format.txt 内容：
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

## 相关资源

### 文档
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Queues 文档](https://developers.cloudflare.com/queues/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Hono 文档](https://hono.dev/)
- [Zod 文档](https://zod.dev/)

### 内部资源
- `@libra/auth` - 认证工具库
- `@libra/common` - 共享工具库（日志、错误处理）
- `@libra/db` - 数据库操作库
- `@libra/sandbox` - 沙箱环境管理
- `@libra/templates` - 项目模板系统
- `apps/cdn` - CDN 服务
- `apps/web` - 主 Web 应用

### 开发工具
- [Scalar API 文档](https://github.com/scalar/scalar) - API 文档生成
- [Vitest](https://vitest.dev/) - 单元测试框架
- [TypeScript](https://www.typescriptlang.org/) - 类型系统

### 沙箱提供商
- [E2B](https://e2b.dev/) - 代码执行沙箱
- [Daytona](https://www.daytona.io/) - 云原生开发环境
