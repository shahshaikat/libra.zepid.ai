# @libra/auth

基于 better-auth 框架构建的综合身份验证和授权解决方案，专为 Cloudflare Workers 优化，集成 Stripe 支付处理和订阅管理。

## 🚀 特性

- **🔐 身份验证与授权**：完整的用户身份验证系统，支持多种登录方式
- **💳 Stripe 集成**：完整的订阅生命周期管理和支付处理
- **☁️ Cloudflare 优化**：专为 Cloudflare Workers 环境构建
- **🗄️ 数据库管理**：Drizzle ORM 与 D1 数据库支持
- **📧 邮件系统**：身份验证和订阅事件的自动邮件通知
- **🔒 安全性**：会话管理、CSRF 保护、OAuth nonce 验证
- **🏢 组织管理**：多租户组织和团队管理
- **🪝 Webhooks**：第三方服务集成的完整 webhook 处理

## 📦 安装

```bash
bun add @libra/auth
```

## 🛠️ 依赖项

此包需要几个对等依赖项：

```bash
# 核心身份验证框架
bun add better-auth better-auth-harmony stripe drizzle-orm

# Zepid 特定包（在 monorepo 中自动安装）
bun add @libra/better-auth-cloudflare @libra/better-auth-stripe
bun add @libra/email @libra/db @libra/common @libra/ui
```

> **注意**：此包使用 `better-auth-harmony` (v1.2.5+)，它提供增强的邮件身份验证功能。核心 `better-auth` 包作为对等依赖项包含。

## ⚙️ 环境变量

```env
# 必需 - GitHub OAuth
BETTER_GITHUB_CLIENT_ID=your_github_client_id
BETTER_GITHUB_CLIENT_SECRET=your_github_client_secret

# 可选 - Stripe 支付（订阅功能必需）
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 必需 - Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
DATABASE_ID=your_d1_database_id
CLOUDFLARE_API_TOKEN=your_api_token

# 必需 - 安全性
TURNSTILE_SECRET_KEY=your_turnstile_secret

# 必需 - 管理员配置
ADMIN_USER_IDS=user_id_1,user_id_2  # 管理员用户 ID 的逗号分隔列表

# 必需 - 邮件服务（用于 OTP 和通知）
# 注意：RESEND_API_KEY 在 @libra/email 包中配置
RESEND_API_KEY=re_...  # 用于邮件发送的 Resend API 密钥

# 可选 - 开发环境
NODE_ENV=development  # 生产环境设置为 'production'
LOG_LEVEL=info        # 日志级别（debug, info, warn, error）
```

## 🚀 快速开始

### 服务器设置

```typescript
import { initAuth } from '@libra/auth/auth-server'

// 初始化身份验证实例
const auth = await initAuth()

// 在 API 路由中使用
export default auth.handler
```

### 客户端设置

```typescript
import { authClient, signIn, signOut, useSession } from '@libra/auth/auth-client'

// 在 React 组件中
function AuthComponent() {
  const { data: session, isPending } = useSession()

  const handleSignIn = async () => {
    // 使用邮件 OTP 进行无密码身份验证
    await signIn.emailOtp({
      email: 'user@example.com'
    })
  }

  if (isPending) return <div>加载中...</div>
  if (!session) return <button onClick={handleSignIn}>登录</button>

  return (
    <div>
      欢迎，{session.user.name}！
      <button onClick={() => signOut()}>退出登录</button>
    </div>
  )
}
```

### 订阅管理

```typescript
import { getSubscriptionUsage, checkAndUpdateAIMessageUsage } from '@libra/auth/utils/subscription-limits'

// 检查订阅使用情况
const usage = await getSubscriptionUsage(organizationId)
console.log(`AI 消息：${usage.aiNums}/${usage.aiNumsLimit}`)

// 扣除 AI 消息配额
const success = await checkAndUpdateAIMessageUsage(organizationId)
if (!success) {
  throw new Error('AI 配额已超出')
}
```

## 📚 文档

- **[开发指南 (英文)](./DEV.md)** - 综合开发文档
- **[开发指南 (中文)](./DEV_ZH.md)** - 中文版开发文档
- **[OAuth Nonce 安全性](./utils/README.md)** - OAuth 重放攻击保护

## 🏗️ 架构

```text
@libra/auth
├── auth-client.ts          # 客户端身份验证
├── auth-server.ts          # 服务器端身份验证
├── plugins.ts              # better-auth 插件配置
├── env.mjs                 # 环境配置
├── db/                     # 数据库模式和迁移
│   ├── index.ts           # 数据库连接工具
│   ├── schema.ts          # 组合模式导出
│   ├── schema/            # 单独的模式定义
│   └── migrations/        # 数据库迁移文件
├── plugins/               # 自定义身份验证插件
│   ├── captcha-plugin.ts  # Turnstile 验证码集成
│   ├── email-otp-plugin.ts # 邮件 OTP 验证
│   ├── organization-plugin.ts # 多租户组织支持
│   ├── stripe-plugin.ts   # Stripe 订阅集成
│   └── stripe/            # Stripe 特定工具
├── utils/                 # 工具函数和助手
│   ├── admin-utils.ts     # 管理员管理工具
│   ├── email-service.ts   # 邮件发送服务
│   ├── nonce.ts           # OAuth nonce 验证
│   ├── organization-utils.ts # 组织管理
│   ├── subscription-limits.ts # 订阅配额管理
│   └── subscription-limits/ # 模块化订阅工具
└── webhooks/              # Webhook 事件处理器
    ├── stripe-handler.ts  # Stripe webhook 导出和重新导出
    ├── handlers/          # 单独的 webhook 处理器
    │   ├── checkout-handlers.ts  # 结账会话处理器
    │   ├── price-handlers.ts     # 价格事件处理器
    │   └── product-handlers.ts   # 产品事件处理器
    ├── shared/            # 共享 webhook 工具
    │   ├── constants.ts   # Webhook 常量
    │   └── types.ts       # Webhook 类型定义
    └── utils/             # Webhook 工具函数
        └── subscription-analysis.ts  # 订阅分析工具
```

## 🔧 核心 API

### 身份验证

```typescript
// 客户端
import { authClient } from '@libra/auth/auth-client'
// 或直接使用导出的函数
import { signIn, signOut, signUp, useSession } from '@libra/auth/auth-client'

// 服务器端
import { initAuth } from '@libra/auth/auth-server'
```

### 订阅工具

```typescript
import {
  getSubscriptionUsage,
  checkAndUpdateAIMessageUsage,
  createOrUpdateSubscriptionLimit,
  checkAndUpdateEnhanceUsage,
  checkAndUpdateProjectUsage,
  checkAndUpdateDeployUsage
} from '@libra/auth/utils/subscription-limits'
```

### 组织管理

```typescript
// 从插件导入（为方便起见重新导出）
import { getActiveOrganization } from '@libra/auth/plugins'

// 或直接从工具导入
import { getActiveOrganization } from '@libra/auth/utils/organization-utils'
```

### 数据库访问

```typescript
import { getAuthDb } from '@libra/auth/db'
```

### Webhook 处理

```typescript
// 导入单独的 webhook 处理器
import {
  handleProductCreatedOrUpdated,
  handleProductDeleted,
  handlePriceCreatedOrUpdated,
  handlePriceDeleted
} from '@libra/auth/webhooks/stripe-handler'

// 或使用 better-auth-stripe 插件的内置 webhook 端点
import { initAuth } from '@libra/auth/auth-server'
const auth = await initAuth()
// Webhook 端点可在以下位置访问：/api/auth/stripe/webhook
```

## 🔌 插件系统

身份验证包包含几个强大的插件：

### 验证码插件
- **Turnstile 集成**：Cloudflare Turnstile 验证码验证
- **机器人保护**：防止对身份验证端点的自动化攻击

### 邮件 OTP 插件
- **魔法链接身份验证**：通过邮件进行无密码登录
- **OTP 验证**：一次性密码验证系统
- **Resend 集成**：通过 Resend 服务进行邮件发送

### 组织插件
- **多租户支持**：基于组织的用户管理
- **基于角色的访问**：组织特定的用户角色和权限
- **团队管理**：邀请和管理团队成员

### Stripe 插件
- **订阅管理**：完整的订阅生命周期
- **支付处理**：安全的支付处理
- **Webhook 集成**：实时支付事件处理

## 🪝 Webhook 系统

### Stripe Webhooks

身份验证包通过 better-auth-stripe 插件提供全面的 Stripe webhook 处理：

```typescript
// 当在身份验证配置中使用 stripe 插件时，
// webhook 端点自动在 /api/auth/stripe/webhook 可用

// 对于自定义 webhook 处理，导入单独的处理器：
import {
  handleProductCreatedOrUpdated,
  handleProductDeleted,
  handlePriceCreatedOrUpdated,
  handlePriceDeleted
} from '@libra/auth/webhooks/stripe-handler'
```

### 支持的事件

**订阅事件**（由 better-auth-stripe 插件处理）：
- `checkout.session.completed` - 新订阅创建
- `customer.subscription.updated` - 订阅变更
- `customer.subscription.deleted` - 订阅取消
- `invoice.payment_succeeded` - 支付成功
- `invoice.payment_failed` - 支付失败

**产品和定价事件**（由自定义处理器处理）：
- `product.created` - 新产品创建
- `product.updated` - 产品信息更新
- `product.deleted` - 产品删除
- `price.created` - 新定价层创建
- `price.updated` - 价格变更
- `price.deleted` - 价格删除

## 🛡️ 安全功能

- **会话管理**：安全的会话处理和自动清理
- **CSRF 保护**：内置 CSRF 令牌验证
- **OAuth Nonce 验证**：OAuth 流程的重放攻击保护
- **速率限制**：身份验证端点的可配置速率限制
- **地理位置跟踪**：按地理位置跟踪用户会话

## 🎯 使用场景

- **SaaS 应用程序**：完整的身份验证和订阅计费
- **多租户平台**：基于组织的访问控制
- **API 服务**：安全的 API 身份验证和使用配额
- **电子商务**：用户身份验证和支付处理

## 📊 订阅计划

该包支持多个订阅层级：

- **免费计划**：基本使用限制
- **专业计划**：增强的限制和功能
- **最大计划**：最大限制和高级功能

## 🗄️ 数据库管理

该包包含全面的数据库管理工具：

### 可用脚本

```bash
# 从 better-auth 配置生成身份验证模式
bun auth:generate

# 生成数据库迁移
bun db:generate

# 本地应用迁移
bun db:migrate

# 将迁移应用到远程 D1 数据库
bun db:migrate-remote

# 打开 Drizzle Studio 进行数据库检查
bun db:studio
```

### 模式管理

数据库模式从 better-auth 配置自动生成，包括：

- **用户管理**：用户、会话、账户、验证令牌
- **组织支持**：组织、成员、邀请
- **订阅数据**：计划、订阅、使用限制
- **安全性**：OAuth nonces、管理员角色、速率限制

## 🐛 故障排除

### 常见问题

1. **D1 数据库连接**：确保您的 D1 数据库配置正确且设置了 `DATABASE_ID`
2. **Stripe Webhooks**：验证 webhook 端点配置正确，包含正确的 `STRIPE_WEBHOOK_SECRET`
3. **环境变量**：仔细检查所有必需的环境变量是否已设置
4. **KV 存储**：确保 KV 命名空间在您的 Cloudflare Workers 环境中绑定
5. **邮件发送**：验证 `RESEND_API_KEY` 有效且邮件模板已配置

### 本地开发

```bash
# 测试 D1 数据库连接
bun wrangler d1 execute libra --local --command='SELECT 1'

# 运行数据库迁移
bun db:migrate

# 使用正确的环境启动开发
bun with-env dev

# 运行测试
bun test
```

### 调试模式

通过设置以下内容启用调试日志：

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 🤝 贡献

请参考主项目的贡献指南。

## 📄 许可证

AGPL-3.0-only - 详情请参见 LICENSE 文件。