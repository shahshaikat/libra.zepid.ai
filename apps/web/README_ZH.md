# Libra Web 应用程序

[English Version](./README.md)

![版本](https://img.shields.io/badge/version-0.0.0-blue)
![许可证](https://img.shields.io/badge/license-AGPL--3.0-green)
![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)

---

## 概述

**@libra/web** 是 Libra AI 生态系统的核心 Web 应用程序 - 一个基于 Next.js 15 和 React 19 构建的现代 AI 原生开发平台。它提供类似 IDE 的界面和体验，集成多个 AI 助手、GitHub 集成、团队协作和智能代码生成，创造了一个全面的开发环境。

* **AI 原生体验**：深度集成多个 AI 模型（Anthropic Claude、Azure OpenAI、XAI）
* **现代化架构**：基于 Next.js 15 App Router 和 React 19 Server Components 构建
* **类 IDE 界面**：专业的开发体验，支持实时代码编辑和预览
* **全球部署**：基于 Cloudflare Workers 的无服务器架构，边缘优化
* **企业级功能**：团队协作、订阅计费、配额管理和安全保障

## 核心功能

| 类别 | 亮点 |
|------|------|
| **AI 集成** | 多模型 AI 支持、智能代码生成、上下文感知辅助 |
| **开发体验** | 类 IDE 界面、实时预览、GitHub 集成、版本控制 |
| **团队协作** | 组织管理、成员权限、项目共享 |
| **国际化** | 基于 Paraglide.js 的类型安全 i18n，支持英文和中文 |
| **身份认证** | Better-auth 集成、GitHub OAuth、会话管理 |
| **计费订阅** | Stripe 集成、配额管理、使用量跟踪 |
| **性能优化** | Server Components、边缘部署、智能缓存 |
| **开发工具** | TypeScript、tRPC 类型安全、全面测试 |

## 目录结构

```text
apps/web/
├── ai/                     # AI 集成和提供商
│   ├── providers.ts        # AI 模型配置
│   ├── generate.ts         # 代码生成逻辑
│   └── prompts/           # AI 提示模板
├── app/                   # Next.js App Router
│   ├── (fontend)/         # 前端路由
│   │   ├── (dashboard)/   # 仪表板页面
│   │   └── (marketing)/   # 营销页面
│   └── api/               # API 路由
├── components/            # React 组件
│   ├── auth/              # 身份认证组件
│   ├── billing/           # 计费和订阅
│   ├── dashboard/         # 仪表板 UI
│   ├── ide/               # IDE 界面
│   ├── marketing/         # 营销页面
│   └── ui/                # 共享 UI 组件
├── configs/               # 配置文件
├── hooks/                 # 自定义 React Hooks
├── lib/                   # 工具库
├── messages/              # i18n 消息文件
├── paraglide/             # 生成的 i18n 代码
├── trpc/                  # tRPC 客户端/服务器设置
└── types/                 # TypeScript 类型定义
```

## 快速开始（本地开发）

```bash
# 1. 在 monorepo 根目录安装依赖
bun install

# 2. 设置环境变量
cp ../../.env.example ../../.env
nano ../../.env

# 3. 启动开发服务器（端口 3000）
cd apps/web
bun dev
```

启动后，您可以访问：

* **主应用程序**：<http://localhost:3000>
* **仪表板**：<http://localhost:3000/dashboard>
* **API 文档**：通过 tRPC 集成提供

<details>
<summary>环境变量设置示例</summary>

```bash
# 数据库
POSTGRES_URL="postgresql://user:password@localhost:5432/libra"

# 身份认证
BETTER_AUTH_SECRET="your-secret-key"
BETTER_GITHUB_CLIENT_ID="your-github-client-id"
BETTER_GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI 提供商
ANTHROPIC_API_KEY="your-anthropic-key"
AZURE_OPENAI_API_KEY="your-azure-key"
XAI_API_KEY="your-xai-key"

# Cloudflare
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
```

</details>

## 必需的环境变量

| 键名 | 描述 | 必需性 |
|-----|-----|--------|
| `POSTGRES_URL` | PostgreSQL 数据库连接字符串 | ✅ **必需** |
| `BETTER_AUTH_SECRET` | 身份认证的 JWT 密钥 | ✅ **必需** |
| `BETTER_GITHUB_CLIENT_ID` | GitHub OAuth 客户端 ID | ✅ **必需** |
| `BETTER_GITHUB_CLIENT_SECRET` | GitHub OAuth 客户端密钥 | ✅ **必需** |
| `ANTHROPIC_API_KEY` | Anthropic Claude API 密钥 | ✅ **必需** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | ✅ **必需** |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌 | ✅ **必需** |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API 密钥 | 🔧 可选 |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI 端点 URL | 🔧 可选 |
| `XAI_API_KEY` | xAI API 密钥 | 🔧 可选 |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥，用于额外模型 | 🔧 可选 |
| `STRIPE_SECRET_KEY` | Stripe 计费密钥 | 🔧 可选 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 密钥 | 🔧 可选 |
| `RESEND_API_KEY` | Resend 邮件服务 API 密钥 | 🔧 可选 |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 验证密钥 | 🔧 可选 |

## NPM/Bun 脚本

| 脚本 | 描述 |
|------|-----|
| `bun dev` | 使用 Turbo 启动开发服务器（端口 3000） |
| `bun run build` | 构建生产应用程序，包含 i18n 编译 |
| `bun run deploy` | 部署到 Cloudflare Workers |
| `bun run test` | 使用 Vitest 运行测试套件 |
| `bun run test:watch` | 在监视模式下运行测试 |
| `bun run cf-typegen` | 生成 Cloudflare 类型定义 |
| `bun run machine-translate` | 自动翻译 i18n 消息 |
| `bun run analyze` | 分析包大小 |
| `bun run payload` | 运行 Payload CMS 命令 |
| `bun run migrate` | 运行数据库迁移 |
| `bun update` | 更新依赖项 |

## 部署

### Cloudflare Workers 部署

```bash
# 使用 Cloudflare 进行身份认证
wrangler auth login

# 部署到生产环境
bun run deploy
```

### 自定义域名配置

```bash
# 添加自定义域名路由
wrangler route add "zepid.dev/*" libra
```

### 环境变量设置

```bash
# 设置生产环境密钥
wrangler secret put POSTGRES_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put ANTHROPIC_API_KEY
# ... 根据需要添加其他密钥
```

## 架构

### 技术栈

| 组件 | 技术 | 版本 | 用途 |
|------|------|------|-----|
| **框架** | Next.js | 15.3.5 | 带 App Router 的 React 框架 |
| **运行时** | React | 19.1.0 | 带 Server Components 的 UI 库 |
| **语言** | TypeScript | 5.0+ | 类型安全的 JavaScript |
| **样式** | Tailwind CSS | v4 | 实用优先的 CSS 框架 |
| **状态管理** | Zustand | 5.0.6 | 客户端状态管理 |
| **服务器状态** | TanStack Query | 5.83.0 | 服务器状态管理 |
| **API 层** | tRPC | 最新版 | 类型安全的 API 通信 |
| **数据库** | PostgreSQL | 最新版 | 通过 Hyperdrive 的主数据库 |
| **身份认证** | Better-auth | 最新版 | 现代身份认证解决方案 |
| **AI 集成** | AI SDK | 4.3.19 | 统一的 AI 提供商接口 |
| **国际化** | Paraglide.js | 2.2.0 | 类型安全的 i18n 解决方案 |
| **部署** | Cloudflare Workers | 最新版 | 边缘计算平台 |

### AI 模型支持

应用程序集成了多个 AI 提供商：

* **Anthropic Claude**：用于代码生成的主要 AI 模型
* **Azure OpenAI**：GPT-4 和推理模型
* **xAI Grok**：替代 AI 提供商
* **OpenRouter**：访问额外模型
* **Databricks**：企业 AI 解决方案

### 数据库架构

* **PostgreSQL**：通过 Cloudflare Hyperdrive 的主数据库
* **D1**：用于边缘数据的 Cloudflare SQLite
* **KV**：用于缓存的键值存储
* **R2**：用于资产和缓存的对象存储

## API 参考

### 身份认证

应用程序使用 Better-auth 进行身份认证，支持以下提供商：

* **GitHub OAuth**：主要身份认证方法
* **会话管理**：基于 JWT 的会话
* **组织支持**：多租户架构

### tRPC API 路由

通过 tRPC 提供的主要 API 端点：

* **用户管理**：个人资料、偏好设置、组织
* **项目操作**：CRUD 操作、协作
* **AI 集成**：代码生成、模型选择
* **计费**：订阅管理、使用量跟踪
* **分析**：使用统计、性能指标

### 速率限制

* **AI 请求**：基于订阅计划和配额
* **API 调用**：Cloudflare 默认保护
* **文件上传**：与 CDN 服务限制集成

## 国际化

### 支持的语言

* **英语 (en)**：默认语言
* **中文 (zh)**：简体中文支持

### 配置

应用程序使用 Paraglide.js 进行类型安全的国际化：

```typescript
// 自动语言检测来源：
// 1. URL 参数
// 2. Cookies
// 3. 浏览器偏好
// 4. 默认为英语

// 在组件中使用
import { m } from '@/paraglide/messages'

function Component() {
  return <h1>{m.welcome_message()}</h1>
}
```

### 添加新语言

1. 在 `project.inlang/settings.json` 中添加语言代码
2. 在 `messages/{locale}.json` 中创建消息文件
3. 运行 `bun run machine-translate` 进行自动翻译
4. 在 `next.config.mjs` 中更新语言配置

## 开发

### 本地开发设置

1. **前置要求**：
   * Node.js 18+ 和 Bun
   * PostgreSQL 数据库
   * Cloudflare 账户（用于部署）

2. **环境设置**：

   ```bash
   # 克隆并安装
   git clone <repository>
   bun install

   # 数据库设置
   docker run --name libra -e POSTGRES_PASSWORD=postgres -d postgres

   # 环境配置
   cp .env.example .env
   # 编辑 .env 文件填入您的值
   ```

3. **开发工作流**：

   ```bash
   # 启动开发服务器
   bun dev

   # 运行测试
   bun test

   # 类型检查
   bun run typecheck

   # 数据库迁移
   bun run migrate
   ```

### 代码质量

* **TypeScript**：启用严格类型检查
* **ESLint**：使用自定义规则进行代码检查
* **Prettier**：代码格式化
* **Biome**：快速检查和格式化
* **测试**：使用 Vitest 进行单元和集成测试

## 故障排除

### 常见问题

#### 端口已被占用 (3000)

```bash
# 终止现有进程
lsof -ti:3000 | xargs kill -9
# 或使用不同端口
bun dev --port 3001
```

#### 数据库连接错误

* 验证 `POSTGRES_URL` 格式
* 检查数据库服务器是否运行
* 确保 Hyperdrive 配置正确

#### AI API 错误

* 验证 API 密钥设置正确
* 检查提供商的配额限制
* 查看模型可用性和权限

#### 构建失败

* 清除 Next.js 缓存：`rm -rf .next`
* 重新生成 i18n：`bun run prebuild`
* 检查 TypeScript 错误：`bun run typecheck`

#### 部署问题

* 验证 Cloudflare 身份认证：`wrangler whoami`
* 检查 `wrangler.jsonc` 配置
* 确保在生产环境中设置了所有密钥

### 获取帮助

* 查看 [DEV.md](./DEV.md) 获取详细开发指南
* 查看 [DEV_ZH.md](./DEV_ZH.md) 获取中文文档
* 查看 [LOCAL_DEV.md](./LOCAL_DEV.md) 获取本地开发详情
* 在仓库中提交问题报告错误或功能请求

## 性能优化

### 缓存策略

* **Server Components**：React 19 自动缓存
* **静态资产**：通过 Cloudflare 进行 CDN 缓存
* **API 响应**：TanStack Query 缓存
* **数据库**：通过 Hyperdrive 进行连接池

### 包优化

* **代码分割**：Next.js App Router 自动处理
* **Tree Shaking**：消除未使用的代码
* **图片优化**：使用 Cloudflare Images 的自定义加载器
* **包分析**：通过 `bun run analyze` 可用

## 安全

### 身份认证安全

* **JWT 令牌**：安全的会话管理
* **OAuth 集成**：具有适当作用域的 GitHub OAuth
* **会话验证**：服务器端会话验证
* **CSRF 保护**：内置 CSRF 保护

### 数据保护

* **输入验证**：Zod 模式验证
* **SQL 注入**：使用 Prisma 的参数化查询
* **XSS 保护**：React 内置的 XSS 保护
* **内容安全策略**：配置的安全头

## 进一步阅读

* [DEV.md](./DEV.md) – 完整英文开发指南
* [DEV_ZH.md](./DEV_ZH.md) – 完整中文开发指南
* [LOCAL_DEV.md](./LOCAL_DEV.md) – 本地开发设置
* Next.js 文档：<https://nextjs.org/docs>
* React 19 特性：<https://react.dev/blog/2024/12/05/react-19>
* Cloudflare Workers：<https://developers.cloudflare.com/workers/>
* Better-auth：<https://www.better-auth.com/>
* Paraglide.js：<https://inlang.com/m/gerre34r/library-inlang-paraglideJs>

---

© 2025 Libra AI. Licensed under AGPL-3.0.