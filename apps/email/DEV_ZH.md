# @libra/email 应用开发文档

> React Email 模板预览和开发工具

版本：1.0.0 - 2025-07-30  
最后更新：2025-07-30

## 概述

`apps/email` 是 Libra 项目的邮件模板预览开发工具，基于 React Email 构建。它为开发者提供了一个可视化的界面来预览、测试和开发项目中使用的各种邮件模板。

**重要说明**: 这是一个开发时的预览工具，实际的邮件发送功能由 `@libra/email` 包提供。

## 核心功能

- **邮件模板预览**: 实时预览各种邮件模板的渲染效果
- **开发模式**: 热重载开发环境，支持实时编辑和预览
- **模板管理**: 统一管理和预览系统中的所有邮件模板
- **响应式设计**: 支持不同设备和邮件客户端的预览
- **浏览器测试**: 在浏览器中测试邮件模板的兼容性

## 技术栈

- **框架**: React Email v4.1.0
- **开发服务器**: @react-email/preview-server
- **类型检查**: TypeScript
- **包管理**: Bun/Yarn Workspaces
- **构建工具**: React Email CLI

## 目录结构

```text
apps/email/
├── emails/                    # 邮件模板预览文件
│   ├── welcome-email.tsx      # 欢迎邮件模板预览
│   ├── sign-in.tsx            # 登录验证邮件预览
│   ├── email-verification.tsx # 邮箱验证模板预览
│   ├── organization-invitation.tsx # 组织邀请模板预览
│   └── cancellation-email.tsx # 取消订阅模板预览
├── package.json              # 项目配置和脚本
├── tsconfig.json            # TypeScript 配置
└── README.md                # 项目说明文档
```

### 模板预览文件结构

每个模板预览文件的结构如下：

```typescript
import { TemplateComponent } from '@libra/email/templates/emails/template-name'

// 示例数据，用于预览
const ExampleTemplate = () => (
  <TemplateComponent 
    prop1="示例值1"
    prop2="示例值2"
  />
)

export default ExampleTemplate
```

## 环境要求

- **Node.js**: 18.0.0 或更高版本
- **Bun**: 1.0.0 或更高版本（推荐）
- **TypeScript**: 5.0.0 或更高版本

## 安装和配置

### 1. 环境准备

确保你在项目根目录，并已安装所有依赖：

```bash
# 安装项目依赖
bun install
```

### 2. 启动开发服务器

```bash
# 进入 email 应用目录
cd apps/email

# 启动开发服务器
bun dev
```

开发服务器将在 `http://localhost:3001` 启动。

### 3. 访问预览界面

打开浏览器访问 `http://localhost:3001`，你将看到：
- 所有可用的邮件模板列表
- 实时预览功能
- 不同设备的响应式预览
- 源代码查看器

## 开发指南

### 创建新的邮件模板预览

1. 在 `emails/` 目录下创建新的 `.tsx` 文件
2. 从 `@libra/email` 包导入对应的模板组件
3. 设置真实的示例数据进行预览

#### 登录验证邮件示例 (emails/sign-in.tsx)

```tsx
import { SignInTemplate } from '@libra/email/templates/emails/sign-in'

/**
 * 登录验证邮件预览
 * 展示用户登录时收到的验证码邮件
 */
const SignInEmailPreview = () => (
  <SignInTemplate 
    otp="123456"
    userEmail="user@example.com"
    expiresAt={new Date(Date.now() + 15 * 60 * 1000)} // 15分钟后过期
  />
)

export default SignInEmailPreview
```

#### 欢迎邮件示例 (emails/welcome-email.tsx)

```tsx
import { WelcomeTemplate } from '@libra/email/templates/emails/welcome'

/**
 * 欢迎邮件预览
 * 展示新用户注册后收到的欢迎邮件
 */
const WelcomeEmailPreview = () => (
  <WelcomeTemplate 
    userName="张三"
    userEmail="zhangsan@example.com"
    loginUrl="https://zapid.dev/auth/sign-in"
    dashboardUrl="https://zapid.dev/dashboard"
  />
)

export default WelcomeEmailPreview
```

#### 组织邀请邮件示例 (emails/organization-invitation.tsx)

```tsx
import { OrganizationInvitationTemplate } from '@libra/email/templates/emails/organization-invitation'

/**
 * 组织邀请邮件预览
 * 展示用户被邀请加入组织时收到的邮件
 */
const OrganizationInvitationPreview = () => (
  <OrganizationInvitationTemplate 
    inviterName="李四"
    organizationName="示例科技公司"
    inviteeEmail="invited@example.com"
    acceptUrl="https://zapid.dev/accept-invitation?token=abc123"
    role="developer"
  />
)

export default OrganizationInvitationPreview
```

### 模板开发最佳实践

1. **组件命名**: 使用 `Example` 前缀命名预览组件
2. **数据模拟**: 提供真实的示例数据用于预览
3. **响应式设计**: 确保模板在不同客户端正常显示
4. **无障碍性**: 遵循邮件无障碍性最佳实践

### 支持的邮件模板

| 模板名称 | 文件名 | 用途 |
|---------|-------|------|
| 登录邮件 | `signIn.tsx` | 用户登录验证 |
| 欢迎邮件 | `welcomeEmail.tsx` | 新用户欢迎 |
| 邮箱验证 | `emailVerification.tsx` | 邮箱地址验证 |
| 组织邀请 | `organizationInvitation.tsx` | 团队邀请 |
| 取消订阅 | `cancellationEmail.tsx` | 服务取消确认 |

## 构建和部署

### 本地构建

```bash
# 构建邮件模板
bun run build
```

这将生成静态的邮件模板文件，可用于生产环境。

### 与邮件系统集成

邮件模板通过 `@libra/email` 包在主应用中使用。预览应用帮助开发者在开发过程中验证模板效果：

#### 在主应用中使用邮件模板

```typescript
// packages/auth/src/lib/email/index.ts
import { sendEmail } from '@libra/email'
import { SignInTemplate } from '@libra/email/templates/emails/sign-in'

// 发送登录验证邮件
export async function sendSignInEmail(email: string, otp: string) {
  return await sendEmail({
    to: email,
    subject: '登录验证码 - Zepid AI',
    react: SignInTemplate({ 
      otp,
      userEmail: email,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    })
  })
}

// 发送欢迎邮件
export async function sendWelcomeEmail(userName: string, userEmail: string) {
  return await sendEmail({
    to: userEmail,
    subject: '欢迎加入 Zepid AI',
    react: WelcomeTemplate({
      userName,
      userEmail,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-in`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    })
  })
}
```

#### 预览应用的作用

1. **开发时预览**: 在开发邮件模板时实时查看效果
2. **设计验证**: 验证邮件在不同邮件客户端的显示效果
3. **内容审查**: 团队成员可以审查邮件内容和样式
4. **测试数据**: 使用真实的示例数据测试模板渲染

## 配置说明

### package.json 配置

```json
{
  "scripts": {
    "build": "email build",          // 构建邮件模板
    "dev": "email dev --port 3001"  // 启动开发服务器
  },
  "dependencies": {
    "@libra/email": "*",           // 核心邮件包
    "react-email": "^4.1.0-canary.8"       // React Email 框架
  }
}
```

### TypeScript 配置

继承项目的基础 TypeScript 配置：

```json
{
  "extends": "@libra/typescript-config/base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json"
  }
}
```

## 开发工作流程

### 1. 模板开发

```bash
# 启动开发服务器
bun dev

# 在另一个终端创建新模板
touch emails/newTemplate.tsx
```

### 2. 实时预览

- 修改模板文件后，浏览器会自动刷新
- 支持多设备预览模式
- 可以查看邮件的 HTML 源代码

### 3. 测试验证

- 在不同邮件客户端中测试渲染效果
- 验证响应式设计
- 检查无障碍性支持

## 故障排除

### 常见问题

**Q: 开发服务器启动失败**
```bash
# 检查端口是否被占用
lsof -i :3001

# 清理缓存重新安装
rm -rf node_modules/.cache
bun install
```

**Q: 模板样式显示异常**
- 检查 CSS 是否符合邮件客户端兼容性要求
- 使用内联样式而非外部 CSS
- 避免使用不支持的 CSS 属性

**Q: 热重载不工作**
```bash
# 重启开发服务器
bun dev
```
