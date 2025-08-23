# @libra/better-auth-stripe

> Better Auth 的 Stripe 集成插件，提供完整的订阅管理功能

[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](#)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Private Package](https://img.shields.io/badge/package-private-red.svg)](#)

一个为 Better Auth 提供的全面 Stripe 集成插件，为 SaaS 应用程序提供完整的订阅管理、客户处理和支付处理功能。此包是 Zepid AI 平台单体仓库的一部分，专为 Zepid 的订阅和配额管理系统设计。

## 🚀 功能特性

- **🔄 订阅管理** - 完整的生命周期管理（创建、升级、取消、恢复）
- **👥 客户管理** - 自动创建 Stripe 客户并同步
- **🔗 Webhook 处理** - 安全处理 Stripe 事件与 Better Auth 集成
- **💳 计费门户** - 集成 Stripe 客户门户访问
- **🏢 多租户** - 基于组织的订阅管理（Zepid 的核心模型）
- **💺 配额管理** - AI 使用量、项目限制和席位管理
- **📊 使用量跟踪** - 实时配额跟踪和执行
- **🔄 自动续费** - 免费计划配额刷新和付费计划管理
- **🔒 类型安全** - 完整的 TypeScript 支持和全面的类型定义

## 📦 安装

```bash
# 注意：这是 Zepid 单体仓库内的私有包
# 不会发布到 npm，仅供内部使用

# 在单体仓库内开发：
bun install  # 从工作区根目录安装所有依赖

# 对等依赖（在工作区根目录安装）：
# - better-auth ^1.3.1
# - stripe (最新版)
# - zod (最新版)
# - @libra/common (工作区包)
```

## 🏃‍♂️ 快速开始

### 1. 环境设置

```env
# Stripe 配置
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# 数据库配置（Better Auth 使用多个数据库）
DATABASE_URL=postgresql://...  # PostgreSQL 用于项目数据
DATABASE=auth.db               # SQLite 用于认证数据

# Better Auth 配置
BETTER_AUTH_SECRET=your-32-character-secret-key
```

### 2. 服务器配置

```typescript
import { betterAuth } from "better-auth"
import { stripe } from "@libra/better-auth-stripe"
import Stripe from "stripe"

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil", // Zepid 中使用的当前 API 版本
})

export const auth = betterAuth({
  database: {
    provider: "sqlite", // Zepid 使用 SQLite 存储认证数据
    url: process.env.DATABASE || "auth.db",
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "libra pro",
            priceId: "price_pro_monthly",
            limits: { aiNums: 1000, seats: 5, projectNums: 10 },
          },
          {
            name: "libra max",
            priceId: "price_max_monthly",
            limits: { aiNums: 5000, seats: 20, projectNums: 50 },
          },
        ],
      },
    }),
  ],
})
```

### 3. 客户端设置

```typescript
import { createAuthClient } from "better-auth/react"
import { stripeClient } from "@libra/better-auth-stripe/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || '',
  plugins: [stripeClient({ subscription: true })],
})

export const {
  signIn,
  signOut,
  useSession,
  // Stripe 特定方法
  subscription: {
    upgrade: authClient.subscription.upgrade,
    cancel: authClient.subscription.cancel,
    list: authClient.subscription.list,
    restore: authClient.subscription.restore,
  }
} = authClient
```

### 4. 订阅管理

```typescript
// 升级订阅
const upgradeSubscription = async () => {
  const response = await fetch('/api/auth/subscription/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: 'Pro',
      successUrl: '/dashboard/success',
      cancelUrl: '/dashboard/billing',
    }),
  })

  const { url, redirect } = await response.json()
  if (redirect && url) window.location.href = url
}

// 取消订阅
const cancelSubscription = async () => {
  const response = await fetch('/api/auth/subscription/cancel', {
    method: 'POST',
    body: JSON.stringify({ returnUrl: '/dashboard/billing' }),
  })

  const { url } = await response.json()
  window.location.href = url
}

// 列出订阅
const getSubscriptions = async () => {
  const response = await fetch('/api/auth/subscription/list')
  return response.json()
}
```

## 🔗 Webhook 设置

1. 前往您的 [Stripe 控制台](https://dashboard.stripe.com/webhooks)
2. 创建新的 webhook 端点：`https://yourdomain.com/api/auth/stripe/webhook`
3. 选择事件：
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. 将 webhook 密钥复制到您的环境变量中

> **重要**：webhook 端点必须匹配 Better Auth 路由结构。在 Zepid 中，这由 Better Auth Stripe 插件自动处理。

> **注意**：当插件配置完成后，webhook 端点会自动在 `/stripe/webhook` 创建。

## 📊 数据库架构

插件会自动扩展 Better Auth 架构，添加以下字段：

```sql
-- 订阅管理（Better Auth 架构格式）
CREATE TABLE subscription (
    id TEXT PRIMARY KEY,
    plan TEXT NOT NULL,
    referenceId TEXT NOT NULL,        -- 注意：实际架构中使用驼峰命名
    stripeCustomerId TEXT,            -- 注意：实际架构中使用驼峰命名
    stripeSubscriptionId TEXT,        -- 注意：实际架构中使用驼峰命名
    status TEXT DEFAULT 'incomplete',
    periodStart TIMESTAMP,            -- 注意：实际架构中使用驼峰命名
    periodEnd TIMESTAMP,              -- 注意：实际架构中使用驼峰命名
    cancelAtPeriodEnd BOOLEAN DEFAULT false, -- 注意：实际架构中使用驼峰命名
    seats INTEGER
);

-- 用户扩展
ALTER TABLE user ADD COLUMN stripeCustomerId TEXT; -- 注意：实际架构中使用驼峰命名
```

## 🏗️ 架构

```text
@libra/better-auth-stripe/
├── src/
│   ├── index.ts          # 主插件，包含所有端点
│   ├── client.ts         # 客户端插件
│   ├── hooks.ts          # Webhook 事件处理器
│   ├── schema.ts         # 数据库架构定义
│   ├── types.ts          # TypeScript 类型定义
│   └── utils.ts          # 工具函数
├── dist/                 # 编译输出
├── DEV.md               # 英文开发指南
├── DEV_ZH.md            # 中文开发指南
├── package.json         # 包配置
├── tsconfig.json        # TypeScript 配置
└── tsup.config.ts       # 构建配置
```

> **注意**：此包与 Zepid 的订阅系统深度集成，与 `@libra/auth` 配合工作，用于配额管理和基于组织的计费。

## 📚 文档

- **[开发指南（中文）](DEV_ZH.md)** - 完整的中文开发指南
- **[Development Guide (English)](./DEV.md)** - 完整的英文开发指南
- **[Stripe 文档](https://stripe.com/docs)** - 官方 Stripe 文档
- **[Better Auth 文档](https://better-auth.com)** - 官方 Better Auth 文档

## 🔧 高级功能

### 组织订阅

```typescript
stripe({
  subscription: {
    enabled: true,
    // 授权访问组织订阅
    authorizeReference: async ({ user, referenceId }) => {
      const org = await getOrganization(referenceId)
      return org.ownerId === user.id || org.members.includes(user.id)
    },
    // 组织特定配置
    organization: {
      enabled: true,
    },
    // 自定义结账参数
    getCheckoutSessionParams: async ({ user, plan, referenceId }) => ({
      params: {
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          organizationId: referenceId,
          userId: user.id,
        },
      },
    }),
  },
})
```

### 免费试用

```typescript
{
  name: "libra pro",
  priceId: "price_pro",
  freeTrial: {
    days: 14,
    onTrialStart: async (subscription) => {
      await sendTrialStartEmail(subscription)
    },
    onTrialEnd: async ({ subscription }) => {
      await sendTrialEndEmail(subscription)
    },
  },
}
```

### 自定义结账参数

```typescript
stripe({
  subscription: {
    enabled: true,
    getCheckoutSessionParams: async ({ user, plan, referenceId }) => ({
      params: {
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
        metadata: {
          userId: user.id,
          planName: plan.name,
          organizationId: referenceId,
        },
      },
      options: {
        // 如需要，可添加 Stripe 请求选项
      },
    }),
  },
})
```

## 🧪 测试

```bash
# 安装 Stripe CLI 用于 webhook 测试
brew install stripe/stripe-cli/stripe

# 将 webhook 转发到本地开发环境（正确的端点）
stripe listen --forward-to localhost:3000/api/auth/stripe/webhook

# 运行测试（注意：此包目前没有专门的测试文件）
# 测试主要是通过主认证包中的集成测试进行
bun test

# 运行类型检查
bun run typecheck
```

> **注意**：此包目前依赖于通过主 `@libra/auth` 包进行集成测试，而不是拥有专门的单元测试。文档中的测试示例指的是在 Zepid 平台中使用的更广泛的 Stripe 集成测试模式。

## 🤝 贡献

我们欢迎贡献！请查看我们的[行为准则](../../code_of_conduct.md)和[技术指南](../../TECHNICAL_GUIDELINES.md)了解详情。

## 📄 许可证

此项目采用 AGPL-3.0 许可证 - 详情请参阅 [LICENSE](../../LICENSE) 文件。

## 🆘 支持

- 📖 [开发指南](./DEV.md) - 全面的开发文档
- 📖 [中文开发指南](./DEV_ZH.md) - 中文开发指南
- 🐛 [Issues](https://github.com/libra-ai/libra/issues) - 报告错误或请求功能
- 💬 [Discussions](https://github.com/libra-ai/libra/discussions) - 社区讨论

---

由 Zepid 团队用 ❤️ 构建。