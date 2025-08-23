# @libra/db

为整个 Zepid 应用程序提供统一业务数据访问层的现代化、类型安全的数据库管理包。

## ✨ 特性

- 🎯 **类型安全操作** - 通过 Drizzle ORM 实现完整的类型安全
- ⚡ **高性能** - Cloudflare Hyperdrive 加速和连接池
- 🔄 **环境自适应** - 开发/生产环境无缝切换
- 🧩 **模块化架构** - 按领域分离的模式定义
- 🛡️ **企业级就绪** - 迁移管理、性能监控、安全性

## 🚀 快速开始

### 环境设置

```bash
# 开发环境
POSTGRES_URL=postgresql://username:password@localhost:5432/libra_dev

# 生产环境自动使用 Cloudflare Hyperdrive
```

### 基本用法

```typescript
import { getDbAsync, project, projectAIUsage } from '@libra/db'
import { eq, and, desc } from 'drizzle-orm'

// 获取数据库连接
const db = await getDbAsync()

// 创建新项目
const newProject = await db.insert(project).values({
  name: 'My Project',
  templateType: 'nextjs',
  userId: 'user_123',
  organizationId: 'org_456'
}).returning()

// 查询项目
const userProjects = await db
  .select()
  .from(project)
  .where(and(
    eq(project.userId, 'user_123'),
    eq(project.isActive, true)
  ))
  .orderBy(desc(project.createdAt))
```

### 数据库操作

```bash
# 生成迁移文件
bun db:generate

# 执行迁移
bun db:migrate
```

## 🏗️ 架构

### 技术栈

- **Drizzle ORM** - 类型安全的数据库操作
- **PostgreSQL** - 企业级数据库
- **Cloudflare Hyperdrive** - 连接加速
- **React Cache** - 服务端连接优化

### 数据模型

- **Projects** - 核心项目管理
- **AI Usage** - 使用量跟踪和限制
- **Subscriptions** - 计费和资源限制
- **Components** - UI 组件库

## 📁 模式结构

```text
schema/
├── project-schema.ts     # 项目管理表
└── components-schema.ts  # 组件库表
```

## 🔧 核心功能

- **环境检测** - 开发/生产配置自动切换
- **连接池** - 优化的 PostgreSQL 连接管理
- **类型生成** - 从模式自动生成 TypeScript 类型
- **迁移管理** - 版本控制的数据库模式变更
- **事务支持** - ACID 兼容的复杂操作

## 📖 文档

- **[DEV-ZH.md](DEV_ZH.md)** - 详细中文文档
- **[DEV.md](./DEV.md)** - 详细英文文档

## 🤝 贡献

欢迎贡献！请查看开发文档了解以下指南：

- 添加新的模式定义
- 数据库查询最佳实践
- 性能优化技术
- 迁移文件管理

## 📄 许可证

AGPL-3.0 许可证 - 详情请查看项目根目录。

---

**Zepid DB - 让类型安全的数据库操作变得简单** ✨