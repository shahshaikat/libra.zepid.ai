# @libra/dispatcher 开发指南

> 基于 Cloudflare Workers 的高性能请求分发服务

版本：1.0.0
最后更新：2025-07-30

## 目录

- [概述](#概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [环境设置](#环境设置)
- [开发指南](#开发指南)
- [API 参考](#api-参考)
- [部署指南](#部署指南)
- [故障排除](#故障排除)
- [相关资源](#相关资源)

## 概述

`@libra/dispatcher` 是 Zepid AI 平台的核心请求分发服务，基于 Cloudflare Workers 边缘计算架构构建。它实现了智能路由系统，支持通配符子域名、自定义域名，能够将用户请求高效分发到对应的 Worker 脚本，提供全球化的高性能、低延迟分发服务。

## 核心功能

### 🚀 路由分发
| 功能 | 说明 | 技术特点 |
|-----|------|----------|
| **通配符子域名路由** | 支持 `*.zapid.dev` 形式的动态子域名路由 | 自动解析子域名、Worker 名称验证、RFC 1123 兼容 |
| **自定义域名支持** | 完整的用户自定义域名处理和数据库集成 | 数据库查询、域名验证、项目关联 |
| **多策略路由** | 支持子域名、路径、查询参数等多种路由方式 | 灵活的路由策略、智能匹配 |
| **智能转发** | 自动处理请求转发和响应代理 | 完整的 HTTP 方法支持、头部转发 |

### 🔐 认证与安全
| 功能 | 说明 | 限制 |
|-----|------|------|
| **OpenAPI 集成** | 基于 @hono/zod-openapi 的 API 文档 | 自动生成文档、类型安全 |
| **输入验证** | 严格的 Worker 名称和域名格式验证 | Zod 模式验证、错误处理 |
| **请求验证** | 请求大小、头部、格式验证 | 防止恶意请求、资源保护 |
| **错误处理** | 统一的错误处理和请求 ID 追踪 | 结构化错误响应、调试支持 |

### 📊 监控与调试
| 功能 | 说明 | 安全性 |
|-----|------|--------|
| **健康检查** | 基础和详细的服务状态检查 | 多级检查、依赖状态 |
| **结构化日志** | 基于 `@libra/common` 的详细日志记录 | 请求追踪、性能监控 |
| **API 文档** | Scalar 交互式文档（OpenAPI 3.1） | 实时测试、完整规范 |
| **错误追踪** | 统一的错误处理和请求 ID 追踪 | 问题定位、调试支持 |

### 🎯 开发者工具
| 工具 | 用途 | 访问路径 |
|-----|------|----------|
| **API 文档** | Scalar 交互式文档（OpenAPI 3.1） | `/docs` |
| **OpenAPI** | API 规范导出 | `/openapi.json` |
| **健康检查** | 服务状态监控 | `/health` |
| **命名空间信息** | Dispatch 命名空间状态 | `/dispatch` |

## 技术架构

### 🏗️ 核心技术栈
```text
// 运行时环境
├── Cloudflare Workers    // 边缘计算平台
├── Hono v4.8.5          // 高性能 Web 框架
├── TypeScript 5.x       // 类型安全保障
└── Node.js 24+          // 开发环境要求

// 存储层
├── Hyperdrive           // 数据库连接池（PostgreSQL）
├── Dispatch Namespace   // Worker 分发命名空间
├── PostgreSQL           // 主数据库（自定义域名）
└── Cache API            // 边缘缓存

// API 层
├── @hono/zod-openapi    // OpenAPI 集成
├── Zod Schemas          // 运行时验证
├── @scalar/hono-api-ref // API 文档 UI
└── @libra/middleware    // 中间件库

// 高级功能
├── @libra/common        // 日志和工具库
├── @libra/db            // 数据库抽象层
└── drizzle-orm          // ORM 查询构建器
```

### 🔐 安全架构
| 层级 | 技术 | 说明 |
|-----|------|------|
| **输入验证** | Zod Schemas | 请求/响应验证、Worker 名称校验 |
| **域名验证** | 自定义验证器 | RFC 1123 兼容、保留名称保护 |
| **错误处理** | 统一错误处理 | 安全的错误信息、请求追踪 |
| **日志记录** | @libra/common | 结构化日志、性能监控 |
| **请求限制** | 请求大小验证 | 防止资源滥用、恶意请求 |

## 目录结构

```text
apps/dispatcher/                   # Dispatcher 服务根目录
├── README.md                      # 基础服务文档
├── DEV.md                         # 英文开发指南
├── DEV_ZH.md                      # 中文开发指南
├── DEPLOYMENT.md                  # 部署指南
├── package.json                   # 依赖和脚本定义
├── biome.json                     # 代码格式化配置
├── tsconfig.json                  # TypeScript 配置
├── wrangler.jsonc                 # Cloudflare Workers 配置（使用兼容日期2025-07-17）
├── public/                        # 静态资源目录
│   └── favicon.ico               # 网站图标
├── src/                          # 源代码目录
│   ├── index.ts                  # Worker 主入口，域名路由和分发逻辑
│   ├── openapi.ts                # OpenAPI 应用配置和路由注册
│   ├── dispatcher.ts             # 核心分发器逻辑和命名空间管理
│   ├── types.ts                  # 全局类型定义和 Cloudflare 绑定
│   ├── env.ts                    # 环境变量类型定义和验证
│   ├── auth.ts                   # better-auth 配置（简化版）
│   ├── config/                   # 配置文件目录
│   │   └── domains.ts           # 域名配置和验证规则
│   ├── routes/                   # API 路由处理器
│   │   └── dispatch.ts          # 分发路由处理（路径和查询参数）
│   ├── middleware/               # 中间件目录
│   │   └── auth-middleware.ts   # 认证中间件
│   ├── utils/                    # 工具函数库
│   │   ├── custom-domain.ts     # 自定义域名处理逻辑
│   │   ├── routing.ts           # 路由解析和请求构建
│   │   ├── validation.ts        # 输入验证和格式检查
│   │   └── error-handler.ts     # 错误处理工具
│   └── db/                       # 数据库相关
│       ├── db-postgres.ts       # PostgreSQL 数据库配置
│       └── custom-domain.ts     # 自定义域名数据库操作
└── node_modules/                 # 依赖包目录
```

### 架构设计

#### 路由流程

```text
用户请求: https://vite-shadcn-template.zapid.dev/
    ↓
Cloudflare DNS: *.zapid.dev → zepid-dispatcher Worker
    ↓
Dispatcher 解析子域名: "vite-shadcn-template"
    ↓
验证 Worker 名称格式（RFC 1123）
    ↓
调用: env.dispatcher.get("vite-shadcn-template")
    ↓
转发请求到用户 Worker
    ↓
返回 Worker 响应给用户
```

#### 自定义域名流程

```text
用户请求: https://myapp.example.com/
    ↓
Dispatcher 检测非 zapid.dev 域名
    ↓
查询数据库获取域名关联的项目
    ↓
获取项目对应的 Worker 名称
    ↓
转发到对应的 Worker
    ↓
返回响应给用户
```

## 环境设置

### 前置要求

```bash
# 必需工具
node >= 24.0.0
bun >= 1.0.0
wrangler >= 4.25.0

# 全局安装 Wrangler
npm install -g wrangler

# Cloudflare 认证
wrangler auth login
```

### 环境变量

在 `apps/dispatcher` 目录创建 `.dev.vars` 文件，可以从示例文件开始：

```bash
# 复制示例文件
cp apps/dispatcher/.dev.vars.example apps/dispatcher/.dev.vars

# 编辑环境变量
nano apps/dispatcher/.dev.vars
```

基于 `.dev.vars.example` 的配置项：

```bash
# GitHub OAuth（认证必需）
BETTER_GITHUB_CLIENT_ID="your_github_client_id"
BETTER_GITHUB_CLIENT_SECRET="your_github_client_secret"

# Cloudflare 设置（分发器操作必需）
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
DATABASE_ID="your_d1_database_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"

# 安全设置（认证必需）
TURNSTILE_SECRET_KEY="your_turnstile_secret_key"

# 数据库（分发器可选）
POSTGRES_URL="your_postgres_connection_string"

# 邮件服务（可选）
RESEND_FROM="noreply@yourdomain.com"
RESEND_API_KEY="your_resend_api_key"

# 支付服务（可选）
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# 注意：
# 1. 大部分配置已在 wrangler.jsonc 的 vars 部分预设
# 2. .dev.vars 主要用于覆盖敏感信息
# 3. Cloudflare 资源（Hyperdrive、Dispatch Namespace）通过 wrangler.jsonc 配置
```

### 安装

```bash
# 进入 Dispatcher 目录
cd apps/dispatcher

# 安装依赖（在项目根目录执行）
cd ../../ && bun install

# 返回 Dispatcher 目录
cd apps/dispatcher

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
# - 本地：http://localhost:3005
# - API 文档：http://localhost:3005/docs
# - 健康检查：http://localhost:3005/health
```

### wrangler.jsonc 配置

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "zepid-dispatcher",
  "main": "src/index.ts",
  "compatibility_date": "2025-07-17",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "binding": "ASSETS",
    "directory": "public"
  },
  "minify": true,
  "placement": { "mode": "smart" },

  // 数据库连接池
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "your_hyperdrive_id",
      "localConnectionString": "postgresql://postgres:postgres@libra:5432/libra"
    }
  ],

  // Worker 分发命名空间
  "dispatch_namespaces": [
    {
      "binding": "dispatcher",
      "namespace": "zepid-dispatcher"
    }
  ],

  // 通配符子域名路由（SaaS 模式）
  "routes": [
    {
      "pattern": "*/*",
      "zone_name": "zapid.dev"
    }
  ],

  // 监控配置
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },

  // 环境变量
  "vars": {
    "DISPATCH_NAMESPACE_NAME": "zepid-dispatcher",
    "NEXT_PUBLIC_APP_URL": "http://localhost:3000",
    "BETTER_AUTH_SECRET": "your_secret_key",
    "POSTGRES_URL": "your_postgres_url",
    "LOG_LEVEL": "DEBUG"
  }
}
```

### API 测试与文档

#### API 文档访问

```bash
# 启动服务后，访问自动生成的 API 文档
open http://localhost:3005/docs

# 查看 OpenAPI 规范
curl http://localhost:3005/openapi.json
```

#### 健康检查

```bash
# 基础健康检查
curl http://localhost:3005/health

# 详细健康检查
curl http://localhost:3005/health/detailed
```

#### Worker 分发测试

```bash
# 路径分发（需要部署对应的 Worker）
curl http://localhost:3005/dispatch/my-worker/api/test

# 查询参数分发
curl "http://localhost:3005/dispatch?worker=my-worker"

# 获取命名空间信息
curl http://localhost:3005/dispatch
```

#### 子域名路由测试

```bash
# 测试子域名路由（需要配置 DNS）
curl https://my-worker.zapid.dev/

# 测试自定义域名（需要数据库配置）
curl https://myapp.example.com/
```

### 核心功能实现

#### 主入口文件 (src/index.ts)

<augment_code_snippet path="apps/dispatcher/src/index.ts" mode="EXCERPT">
````typescript
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { openApiApp } from './openapi'
import { dispatchRoute } from './routes/dispatch'
import { isValidWorkerSubdomain, extractSubdomain } from './config/domains'
import { handleCustomDomainRequest } from './utils/custom-domain'
import { log } from '@libra/common'

import type { CloudflareBindings, ContextVariables } from './types'
````
</augment_code_snippet>

#### 分发逻辑实现 (src/routes/dispatch.ts)

<augment_code_snippet path="apps/dispatcher/src/routes/dispatch.ts" mode="EXCERPT">
````typescript
import { Hono } from 'hono'
import { dispatchToWorker, getNamespaceInfo } from '../dispatcher'
import { parseRouteInfo, createWorkerRequest } from '../utils/routing'
import { validateDispatchRequest, validateRequestHeaders, validateRequestSize } from '../utils/validation'
import { log, tryCatch } from '@libra/common'

export const dispatchRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get namespace information and routing help
dispatchRoute.get('/', async (c) => {
  const requestId = c.get('requestId') || crypto.randomUUID()
  const session = c.get('userSession')

  log.dispatcher('info', 'Namespace info request received', {
    requestId,
    operation: 'namespace_info',
    hasSession: !!session
  })
````
</augment_code_snippet>

#### 域名验证实现 (src/config/domains.ts)

<augment_code_snippet path="apps/dispatcher/src/config/domains.ts" mode="EXCERPT">
````typescript
/**
 * 从主机名中提取子域名
 */
export function extractSubdomain(hostname: string): string | null {
  if (!hostname.endsWith('.zapid.dev')) {
    return null
  }

  const subdomain = hostname.replace('.zapid.dev', '')
  return subdomain || null
}

/**
 * 验证子域名是否为有效的 Worker 名称
 */
export function isValidWorkerSubdomain(subdomain: string): ValidationResult {
  return isValidWorkerName(subdomain)
}
````
</augment_code_snippet>

### 路由策略

#### 1. 子域名路由（主要策略）✅

这是推荐的路由方式，提供最佳性能和用户体验：

```text
# 标准 Libra 子域名
https://your-worker.zapid.dev/ → Worker "your-worker"
https://vite-template.zapid.dev/about → Worker "vite-template" + /about 路径
```

#### 2. 自定义域名路由（新功能）✅

完整支持用户自定义域名，通过数据库查询项目关联：

```text
# 用户绑定的自定义域名
https://myapp.example.com/ → 查询数据库 → 对应的 Worker
https://blog.mysite.org/posts → 自定义域名 + 路径转发
```

#### 3. 路径路由（API 访问）✅

适用于 API 调用和程序化访问：

```text
https://zapid.dev/dispatch/your-worker/path/to/resource
https://zapid.dev/api/dispatch/your-worker/api/endpoint
```

#### 4. 查询参数路由✅

适用于简单的 Worker 调用：

```text
https://zapid.dev/dispatch?worker=your-worker
https://zapid.dev/dispatch?worker=my-app&debug=true
```

### Worker 名称规则

基于 `src/config/domains.ts` 的实际实现：

<augment_code_snippet path="apps/dispatcher/src/config/domains.ts" mode="EXCERPT">
````typescript
export function isValidWorkerSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (!subdomain || subdomain.trim() === '') {
    return { valid: false, error: 'Subdomain is required' }
  }

  // Check if subdomain is reserved
  if (DOMAIN_CONFIG.reservedSubdomains.includes(subdomain.toLowerCase())) {
    return { valid: false, error: `Subdomain '${subdomain}' is reserved` }
  }

  // Basic format validation
  if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
    return { valid: false, error: 'Subdomain can only contain letters, numbers, and hyphens' }
  }

  // Length validation
  if (subdomain.length > 63) {
    return { valid: false, error: 'Subdomain must be 63 characters or less' }
  }

  // Cannot start or end with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return { valid: false, error: 'Subdomain cannot start or end with a hyphen' }
  }

  return { valid: true }
}
````
</augment_code_snippet>

**验证规则**:

- 可以包含大小写字母、数字和连字符
- 长度 1-63 个字符
- 不能以连字符开头或结尾
- 不能使用保留名称（api、www、cdn、dispatcher等）
- 返回详细的验证结果和错误信息

### 域名配置

基于实际代码，域名处理策略：

**域名处理策略**:

1. **智能路由**: 自动检测 Libra 域名 vs 自定义域名
2. **数据库集成**: 自定义域名通过数据库查询关联项目
3. **保留名称保护**: 防止使用系统保留的子域名
4. **灵活配置**: 支持任意自定义域名绑定

### 认证系统（简化实现）

Dispatcher 使用简化版的 better-auth 集成：

<augment_code_snippet path="apps/dispatcher/src/auth.ts" mode="EXCERPT">
````typescript
export function getBetterAuth() {
  return betterAuth({
    database: getDB(),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    // 使用最小插件避免环境变量问题
    plugins: []
  })
}
````
</augment_code_snippet>

**特点**:
- **简化配置**: 避免复杂的环境变量依赖
- **基础认证**: 支持邮箱密码登录
- **会话管理**: 自动处理用户会话
- **API 路由**: `/api/auth/**` 处理所有认证请求

### 错误处理（结构化实现）

使用 `@libra/common` 的 `tryCatch` 模式：

<augment_code_snippet path="apps/dispatcher/src/dispatcher.ts" mode="EXCERPT">
````typescript
// 统一的错误处理模式
const [result, error] = await tryCatch(async () => {
  // 业务逻辑
  return await performOperation()
})

if (error) {
  log.dispatcher('error', 'Operation failed', { context }, error)
  return c.json({ error: 'Internal server error' }, 500)
}

return result
````
</augment_code_snippet>

**错误类型**:
- `Worker not found` (404)
- `Invalid worker name format` (400)
- `Internal dispatch error` (500)
- `Database connection failed` (503)

## API 参考

### 健康检查

#### 基础健康检查

```http
GET /health
```

响应：

```json
{
  "status": "healthy",
  "timestamp": "2025-07-22T12:00:00.000Z",
  "service": "Libra Dispatcher",
  "version": "0.0.0",
  "environment": "development"
}
```

#### 详细健康检查

```http
GET /health/detailed
```

响应：

```json
{
  "status": "healthy",
  "timestamp": "2025-07-22T12:00:00.000Z",
  "service": "Libra Dispatcher",
  "version": "0.0.0",
  "environment": "development",
  "checks": {
    "hyperdrive": {
      "status": "available",
      "connection_pool": "active"
    },
    "dispatcher": {
      "status": "available",
      "namespace": "zepid-dispatcher"
    }
  }
}
```

### 分发服务

#### 获取命名空间信息

```http
GET /dispatch
```

响应：

```json
{
  "service": "Libra Dispatcher",
  "namespace": "zepid-dispatcher",
  "status": "available",
  "timestamp": "2025-07-22T12:00:00.000Z",
  "requestId": "uuid-string"
}
```

#### 路径分发

```http
ALL /dispatch/:workerName/*
```

**示例**:

```bash
# 转发到 Worker "my-app" 的 /api/users 路径
curl https://zapid.dev/dispatch/my-app/api/users

# POST 请求转发
curl -X POST https://zapid.dev/dispatch/blog-app/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello World"}'
```

#### 查询参数分发

```http
ALL /dispatch?worker=:workerName
```

**示例**:

```bash
# 简单的 Worker 调用
curl "https://zapid.dev/dispatch?worker=my-app"

# 带额外查询参数
curl "https://zapid.dev/dispatch?worker=my-app&debug=true&env=staging"
```

### 开发工具

#### API 文档

```http
GET /docs
```

访问 Scalar 交互式 API 文档界面。

#### OpenAPI 规范

```http
GET /openapi.json
```

获取完整的 OpenAPI 3.1.0 规范。

## 部署指南

### 准备工作

1. **Cloudflare 账户设置**
   - 活跃的 Cloudflare 账户
   - 启用 Workers 服务
   - 配置 Hyperdrive 连接池
   - 配置 Dispatch Namespace

2. **认证设置**
   ```bash
   wrangler auth login
   wrangler whoami
   ```

### 资源配置

#### Hyperdrive 连接池

```bash
# 创建 Hyperdrive 连接池
wrangler hyperdrive create libra-hyperdrive --connection-string="postgresql://user:password@host:port/database"

# 查看连接池列表
wrangler hyperdrive list
```

#### Dispatch Namespace

```bash
# 创建 Dispatch Namespace
wrangler dispatch-namespace create zepid-dispatcher

# 查看命名空间列表
wrangler dispatch-namespace list
```

### 环境部署

#### 开发环境

```bash
# 启动开发服务器
bun dev

# 开发服务器将在 http://localhost:3005 启动
```

#### 生产环境

```bash
# 设置生产环境密钥
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put POSTGRES_URL --env production
wrangler secret put BETTER_GITHUB_CLIENT_SECRET --env production

# 部署到生产环境
bun run deploy
```

### 自定义域名

```bash
# 添加自定义域名路由
wrangler route add "*.zapid.dev/*" zepid-dispatcher

# 查看当前路由
wrangler route list
```

### 用户 Worker 部署

为每个项目部署 Worker 到 dispatch namespace：

```bash
# 部署示例项目
wrangler deploy --name vite-shadcn-template --dispatch-namespace zepid-dispatcher

# 部署其他项目
wrangler deploy --name my-react-app --dispatch-namespace zepid-dispatcher
```

### 验证部署

访问以下 URL 验证部署：

- `https://vite-shadcn-template.zapid.dev/` （需要先部署对应的 Worker）
- `https://my-react-app.zapid.dev/` （需要先部署对应的 Worker）
- `https://dispatcher.zapid.dev/health` （Dispatcher 健康检查）

## 故障排除

### 常见问题

#### Q: 子域名无法访问

```bash
# 检查 DNS 配置
dig *.zapid.dev

# 检查 Worker 部署状态
wrangler status

# 查看实时日志
wrangler tail zepid-dispatcher
```

#### Q: Worker 部署失败

```bash
# 检查命名空间
wrangler dispatch-namespace list

# 重新部署
wrangler deploy --name worker-name --dispatch-namespace zepid-dispatcher

# 检查 Hyperdrive 配置
wrangler hyperdrive list
```

#### Q: 数据库连接失败

- 检查 Hyperdrive 配置
- 验证 PostgreSQL 连接字符串
- 确认数据库权限设置
- 检查环境变量 POSTGRES_URL 是否正确设置

### 性能优化

1. **缓存策略**: 利用 Cloudflare 的全球缓存网络
2. **请求优化**: 减少不必要的数据库查询
3. **错误处理**: 快速失败机制，避免超时

### 调试工具

#### 日志查看

```bash
# 查看 Worker 日志
wrangler tail zepid-dispatcher

# 实时监控
wrangler tail zepid-dispatcher --format pretty
```

#### 性能监控

- Cloudflare Dashboard → Workers → zepid-dispatcher → Analytics
- 查看请求量、错误率、响应时间等指标

## 相关资源

### 文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Dispatch Namespace 文档](https://developers.cloudflare.com/workers/runtime-apis/bindings/dispatch-namespace/)
- [Cloudflare Hyperdrive 文档](https://developers.cloudflare.com/hyperdrive/)
- [Hono 文档](https://hono.dev/)
- [OpenAPI 3.1 规范](https://spec.openapis.org/oas/v3.1.0)

### 内部资源

- `@libra/common` - 共享工具库（日志、错误处理）
- `@libra/middleware` - 中间件库
- `@libra/db` - 数据库抽象层
- `apps/web` - 主 Web 应用
- `apps/cdn` - CDN 服务

### 相关工具

- [Scalar API 文档](https://github.com/scalar/scalar) - API 文档生成
- [Zod](https://zod.dev/) - TypeScript 模式验证
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Biome](https://biomejs.dev/) - 代码格式化和检查