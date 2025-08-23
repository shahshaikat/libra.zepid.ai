# Libra CDN 服务

[English Version](./README.md)

![版本](https://img.shields.io/badge/version-0.0.0-blue)
![许可证](https://img.shields.io/badge/license-AGPL--3.0-green)

---

## 概述

**@libra/cdn** 是基于 Cloudflare Workers 的无服务器 CDN 服务，为 Zepid AI 应用提供安全的文件上传、边缘缓存、图片优化及截图存储能力。

* 边缘优先的无服务器架构，运行在 Cloudflare Workers
* 使用 TypeScript 5.x + Hono v4.8+ 框架构建
* 高级集成：R2 存储、KV 元数据、D1 数据库、Cloudflare Images
* 通过 **@libra/auth** 提供企业级认证，基于 better-auth
* 智能配额管理和限流控制（1次上传/10秒）

## 核心功能

| 类别 | 亮点 |
|------|------|
| **文件管理** | SHA-256 去重、基于 planId 的替换、配额跟踪 |
| **图片处理** | Cloudflare Images 优化、AVIF/WebP/JPEG/PNG 支持 |
| **截图服务** | Base64 存储、planId 检索、公开 iframe 访问 |
| **开发者工具** | 组件检查器、"Made with Libra" 徽章、实时调试 |
| **API 文档** | OpenAPI 3.1 与 Scalar UI，在 `/docs` 提供交互式测试 |
| **安全性能** | 限流保护、CORS 防护、30天边缘缓存 |

## 目录结构（简）

```
apps/cdn/
├── src/            # Worker 源码
│   ├── routes/     # upload | image | screenshot | delete | badge
│   ├── schemas/    # Zod 校验模式
│   ├── utils/      # 文件 / 配额 / 截图 工具
│   └── index.ts    # 入口 & CORS
├── public/         # 静态资源 (badge.js, logo.png)
└── wrangler.jsonc  # Workers 配置
```

## 快速开始（本地开发）

```bash
# 1. 在仓库根目录安装依赖
bun install

# 2. 复制环境变量模板并填写
cp apps/cdn/.dev.vars.example apps/cdn/.dev.vars
nano apps/cdn/.dev.vars

# 3. 启动本地开发服务器 (端口 3004)
cd apps/cdn
bun dev
```

运行后可访问：

* API 文档: <http://localhost:3004/docs>
* 组件 Inspector: <http://localhost:3004/inspector>

<details>
<summary>示例 cURL – 文件上传</summary>

```bash
curl -X PUT http://localhost:3004/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@example.jpg" \
  -F "planId=my_plan"
```

</details>

## 必需环境变量

| 变量 | 描述 | 必需性 |
|------|------|--------|
| `BETTER_AUTH_SECRET` | JWT 认证密钥 | ✅ **必需** |
| `POSTGRES_URL` | 数据库连接用于配额跟踪 | ✅ **必需** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Images 账户 ID | 🔧 可选 |
| `CLOUDFLARE_IMAGES_TOKEN` | 图片优化服务 Token | 🔧 可选 |
| `HYPERDRIVE_ID` | 数据库连接池 ID | 🔧 可选 |
| `TURNSTILE_SECRET_KEY` | 人机验证密钥 | 🔧 可选 |
| `RESEND_API_KEY` | 邮件通知服务 | 🔧 可选 |
| `LOG_LEVEL` | 日志级别 (`debug`/`info`/`warn`/`error`) | 🔧 可选 |

## Bun/NPM 脚本

| 脚本 | 说明 |
|------|------|
| `bun dev` | `wrangler dev`，本地端口 3004 |
| `bun run deploy` | 部署到 Cloudflare |
| `bun run cf-typegen` | 生成 CF Bindings 类型定义 |
| `bun update` | 更新依赖 |

## 部署到生产

```bash
# 首次认证
wrangler auth login

# 设置密钥并部署
bun run deploy
```

自定义域名示例：

```bash
wrangler route add "cdn.zepid.dev/*" libra-cdn
```

## API 参考

### 认证矩阵

| 端点 | 认证要求 | 用途 |
|------|---------|------|
| **公开端点** | ❌ 无需认证 | |
| `GET /` | ❌ | 健康检查 |
| `GET /image/{key}` | ❌ | 图片访问（缓存30天） |
| `GET /screenshot/{planId}` | ❌ | 截图密钥查找（支持iframe） |
| `GET /badge.js` | ❌ | "Made with Libra" 徽章脚本 |
| `GET /docs` | ❌ | API 文档 |
| `GET /openapi.json` | ❌ | OpenAPI 规范 |
| `GET /inspector` | ❌ | 组件检查器（仅开发环境） |
| **受保护端点** | ✅ Bearer Token | |
| `PUT /upload` | ✅ | 文件上传与配额执行 |
| `POST /screenshot` | ✅ | 截图存储 |
| `DELETE /file/{planId}` | ✅ | 文件删除与配额恢复 |

### 限流控制

- **文件上传**：每用户每10秒1次请求
- **其他端点**：无特殊限制（Cloudflare 默认保护）

完整的 OpenAPI 3.1 规范位于 `/openapi.json`，带测试功能的交互式文档可在 `/docs` 访问。

## 进一步阅读

* [DEV_ZH.md](./DEV_ZH.md) – 完整中文开发指南
* [DEV.md](./DEV.md) – Full English guide
* Cloudflare Workers 文档: <https://developers.cloudflare.com/workers/>
* Hono 框架: <https://hono.dev/>

## 组件检查器

开发环境中强大的调试工具，可在 `/inspector` 访问：

- **实时 DOM 检查**，支持元素选择
- **组件属性查看器**，实时更新
- **Shadow DOM 隔离**，保持样式整洁
- **跨域 iframe 支持**，安全预览
- **元素高亮显示**，点击检查

---

© 2025 Zepid AI. 使用 AGPL-3.0 许可证发布。 