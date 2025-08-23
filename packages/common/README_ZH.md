# @libra/common

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Zepid AI 平台的共享工具、类型和实用程序的综合集合。此包为 Zepid 应用程序中的文件操作、数据处理、日志记录、错误处理和类型安全提供了基本构建块。

## 📋 目录

- [特性](#-特性)
- [安装](#-安装)
- [快速开始](#-快速开始)
- [架构](#-架构)
- [核心模块](#-核心模块)
- [API 参考](#-api-参考)
- [高级用法](#-高级用法)
- [性能和最佳实践](#-性能和最佳实践)
- [故障排除](#-故障排除)
- [测试](#-测试)
- [贡献](#-贡献)

## 🚀 特性

- **📁 文件系统工具**: 完整的文件结构处理、树构建和内容映射
- **📝 类型定义**: 文件、消息和数据结构的全面 TypeScript 类型
- **🔧 实用函数**: 防抖、深度合并、指数平滑和 Cloudflare Workers 工具
- **📊 日志系统**: 结构化、集中式日志记录，支持组件特定的日志记录器
- **🛡️ 错误处理**: 类型安全的错误处理，包含 `tryCatch` 工具和数据库错误分类
- **💬 消息类型**: 聊天、协作和历史功能的扩展消息类型定义
- **🐙 GitHub 集成**: GitHub 文件结构验证和处理
- **🌐 CDN 集成**: 前端和后端环境的统一 CDN URL 管理
- **🗄️ 数据库错误处理**: 全面的数据库错误分类和用户友好的消息
- **⚡ 性能**: 针对生产使用优化的工具，支持 tree-shaking

## 📦 安装

> **注意**: 这是 Zepid monorepo 内部的包，不会发布到 npm。

### 在 Zepid 项目中

```bash
# 在 monorepo 根目录安装依赖
bun install

# 该包作为工作区依赖自动可用
# 添加到你的 package.json 依赖中：
"@libra/common": "*"
```

### 外部项目

如果你想在 Zepid monorepo 之外使用此包，你需要复制源文件并安装所需的依赖：

```bash
# 核心依赖（如果需要）
bun add resend@^4.7.0
bun add @trpc/client@^11.4.3 @trpc/server@^11.4.3

# 开发依赖
bun add -D typescript@latest
```

## 🚀 快速开始

### 基本用法

```typescript
import {
  debounce,
  deepMerge,
  createFileContentMap,
  logger,
  tryCatch,
  formatBytes,
  retryWithBackoff
} from '@libra/common'

// 防抖函数
const debouncedSearch = debounce((query: string) => {

}, 300)

// 深度合并对象
const config = deepMerge(
  { api: { timeout: 5000 } },
  { api: { retries: 3 }, debug: true }
)

// 处理文件结构
const fileMap = createFileContentMap(fileStructure)

// 格式化工具
const fileSize = formatBytes(1024 * 1024) // "1.00 MB"

// 指数退避重试
const result = await retryWithBackoff(async () => {
  return await fetch('/api/data')
}, { maxRetries: 3, baseDelay: 1000 })

// 结构化日志
logger.info('Application started', {
  component: 'APP',
  version: '1.0.0'
})

// 安全错误处理
const [operationResult, error] = await tryCatch(async () => {
  return await someAsyncOperation()
})

if (error) {
  logger.error('Operation failed', { operation: 'someAsyncOperation' }, error)
}
```

## 🏗️ 架构

### 包结构

```text
@libra/common/
├── src/
│   ├── index.ts              # 主要导出和公共 API
│   ├── utils.ts              # 核心实用函数
│   ├── types.ts              # 基础类型定义
│   ├── message-types.ts      # 扩展消息类型
│   ├── history.ts            # 历史相关类型
│   ├── logger.ts             # 集中式日志系统
│   ├── error.ts              # 错误处理工具
│   ├── db-error-handler.ts   # 数据库错误管理
│   ├── cdn-utils.ts          # CDN URL 管理
│   ├── github.ts             # GitHub 集成类型
│   └── file.ts               # 文件系统工具
├── __tests__/                # 测试文件（待添加）
├── dist/                     # 构建分发文件
├── package.json              # 包配置
├── tsconfig.json             # TypeScript 配置
└── tsup.config.ts            # 构建配置
```

### 核心设计原则

1. **类型安全**: 所有工具和数据结构的全面 TypeScript 类型
2. **Tree Shaking**: 模块化导出以支持最佳打包
3. **环境无关**: 在 Node.js、浏览器和 Cloudflare Workers 中工作
4. **性能优先**: 优化的工具，开销最小
5. **错误恢复**: 强大的错误处理和用户友好的消息
6. **日志一致性**: 所有 Zepid 应用程序的结构化日志

### 模块依赖关系

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Utils    │    │   Logger        │    │   Error Handler │
│                 │    │                 │    │                 │
│ • buildFiles    │    │ • Structured    │    │ • tryCatch      │
│ • fileMap       │    │ • Component     │    │ • DB Errors     │
│ • treeStructure │    │ • Contextual    │    │ • Type Safe     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Core Types    │
                    │                 │
                    │ • FileType      │
                    │ • MessageType   │
                    │ • TreeNode      │
                    └─────────────────┘
```

### 文件结构处理

```typescript
import {
  buildFiles,
  buildFileMap,
  getFileContent,
  convertToTreeStructure,
  sortFileExplorer,
  isFileType,
  isDirectoryType
} from '@libra/common'

// 构建文件映射和树结构
const { fileMap, treeContents } = buildFiles(fileStructure, initialMessages)

// 仅构建文件映射
const fileMap = buildFileMap(fileStructure)

// 获取特定文件内容
const content = getFileContent(fileMap, 'src/components/Button.tsx')

// 转换为 UI 的树结构
const treeNodes = convertToTreeStructure(fileStructure)

// 排序文件浏览器项目
const sortedItems = sortFileExplorer(files)

// 文件/目录检查的类型守卫
if (isFileType(data)) {
  console.log('File content:', data.content)
}

if (isDirectoryType(data)) {
  console.log('Directory children:', Object.keys(data.children))
}
```

### 高级日志记录

```typescript
import { logger, log, LogLevel } from '@libra/common'

// 带上下文的基本日志记录
logger.info('Application started', {
  component: 'APP',
  version: '1.0.0'
})

logger.error('Operation failed', {
  operation: 'someAsyncOperation',
  userId: '123'
}, error)

// 组件特定的日志记录
log.auth('info', 'User authenticated', { userId: '123' })
log.api('error', 'Request failed', { endpoint: '/api/users' }, error)
log.db('warn', 'Slow query detected', { query: 'SELECT * FROM users', duration: 2000 })

// 动态设置日志级别
logger.setLogLevel(LogLevel.DEBUG)

// 检查当前日志级别
const currentLevel = logger.getLogLevel()
```

## 📚 API 参考

### 文件系统工具

#### `buildFiles(fileStructure, initialMessages?)`

从文件结构构建文件映射和树内容。

**参数:**

- `fileStructure: FileStructure` - 要处理的文件结构
- `initialMessages?: any[]` - 可选的初始消息上下文

**返回:** `{ fileMap: FileContentMap, treeContents: TreeNode[] }`

#### `buildFileMap(fileStructure)`

创建文件路径到内容的平面映射。

**参数:**

- `fileStructure: FileStructure` - 要处理的文件结构

**返回:** `FileContentMap` - 文件路径到内容的映射

#### `getFileContent(fileMap, filePath)`

检索特定文件路径的内容。

**参数:**

- `fileMap: FileContentMap` - 文件内容映射
- `filePath: string` - 文件路径

**返回:** `string | undefined` - 文件内容，如果未找到则为 undefined

#### `convertToTreeStructure(fileStructure)`

将文件结构转换为 UI 显示的树节点。

**参数:**

- `fileStructure: FileStructure` - 要转换的文件结构

**返回:** `TreeNode[]` - 树节点数组

### 实用函数

#### `debounce<T>(func, wait)`

创建提供函数的防抖版本。

**参数:**

- `func: T` - 要防抖的函数
- `wait: number` - 等待时间（毫秒）

**返回:** `T` - 防抖函数

#### `deepMerge(target, source)`

深度合并两个对象。

**参数:**

- `target: any` - 目标对象
- `source: any` - 要合并的源对象

**返回:** `any` - 合并后的对象

#### `retryWithBackoff(fn, options?)`

使用指数退避重试函数。

**参数:**

- `fn: () => Promise<T>` - 要重试的异步函数
- `options?: { maxRetries?: number, baseDelay?: number, maxDelay?: number }`

**返回:** `Promise<T>` - 函数的结果

### 日志系统

#### `logger.info(message, context?)`

记录带有可选上下文的信息消息。

**参数:**

- `message: string` - 日志消息
- `context?: LogContext` - 附加上下文数据

#### `logger.error(message, context?, error?)`

记录带有可选上下文和错误对象的错误消息。

**参数:**

- `message: string` - 日志消息
- `context?: LogContext` - 附加上下文数据
- `error?: Error` - 错误对象

#### `log.{component}(level, message, context?, error?)`

组件特定的日志记录方法。

**可用组件:** `auth`, `api`, `db`, `ui`, `worker`

### 错误处理

#### `tryCatch<T>(fn)`

安全执行异步函数并返回元组结果。

**参数:**

- `fn: () => Promise<T>` - 要执行的异步函数

**返回:** `Promise<[T | null, Error | null]>` - [结果, 错误] 的元组

### CDN 工具

#### `getCdnUrl(path)`

获取任何路径的 CDN URL。

**参数:**

- `path: string` - 资源路径

**返回:** `string` - 完整的 CDN URL

#### `getCdnImageUrl(key)`

获取图像的 CDN URL。

**参数:**

- `key: string` - 图像键

**返回:** `string` - 完整的图像 URL

## 📚 核心模块

### 🔧 工具 (`utils.ts`)

- **文件处理**: `buildFiles`, `buildFileMap`, `createFileContentMap`, `getFileContent`
- **树操作**: `convertToTreeStructure`, `sortFileExplorer`
- **通用工具**: `debounce`, `deepMerge`, `exponentialSmoothing`
- **类型守卫**: `isFileType`, `isDirectoryType`
- **Cloudflare Workers 工具**: `getRequestId`, `sleep`, `safeJsonParse`, `safeJsonStringify`
- **格式化工具**: `formatBytes`, `formatDuration`, `truncateString`
- **环境工具**: `isDevelopment`, `isProduction`, `getEnvironment`
- **验证工具**: `isValidUrl`, `validateIdentifier`, `sanitizeIdentifier`, `isValidCustomDomain`
- **重试工具**: `retryWithBackoff`

### 📝 类型 (`types.ts`, `message-types.ts`, `history.ts`)

- **文件类型**: `FileType`, `TFile`, `TFolder`, `TTab`, `FileContentMap`
- **树类型**: `TreeNode`, `FileStructure`, `DirectoryEntry`, `FileEntry`, `FileOrDirEntry`
- **消息类型**: `UserMessageType`, `CommandMessageType`, `DiffMessageType`, `PlanMessageType`
- **扩展类型**: `ThinkingMessageType`, `ScreenshotMessageType`, `TimingMessageType`
- **历史类型**: `HistoryType`, `FileDiffType`, `ContentType`

### 📊 日志记录 (`logger.ts`)

- **结构化日志**: 支持上下文和单例模式的集中式日志记录
- **组件日志记录器**: 通过 `log` 对象为不同组件预配置的日志记录器
- **日志级别**: Debug、Info、Warn、Error，支持基于环境的过滤
- **动态配置**: 使用 `setLogLevel` 进行运行时日志级别调整
- **上下文支持**: 丰富的上下文对象，支持组件、操作、用户跟踪

### 🛡️ 错误处理 (`error.ts`)

- **类型安全错误**: 用于安全异步操作的 `tryCatch` 函数
- **结果类型**: 返回 `[result, error]` 的元组模式，用于安全错误处理

### 🗄️ 数据库错误处理 (`db-error-handler.ts`)

- **错误分类**: 用于分类数据库错误的 `DatabaseErrorType` 枚举
- **用户友好消息**: 带有本地化错误描述的 `DB_ERROR_MESSAGES`
- **错误转换**: `transformDatabaseError`, `classifyDatabaseError` 工具
- **类型守卫**: 用于运行时错误类型检查的 `isDatabaseError`
- **包装函数**: 用于自动错误处理的 `withDatabaseErrorHandling`

### 🌐 CDN 集成 (`cdn-utils.ts`)

- **统一 URL 管理**: 前端/后端的跨环境 CDN URL 处理
- **多种 URL 类型**: 图像、文件、上传、截图和静态资源 URL
- **环境检测**: 自动检测 Next.js 与后端环境
- **CDN 工具类**: 面向对象接口，包含 `getCdnUrl`, `getCdnImageUrl` 等
- **函数式接口**: 用于简单使用的直接函数导出

### 🐙 GitHub 集成 (`github.ts`)

- **模式验证**: GitHub 文件结构的 Zod 模式
- **类型定义**: 用于 GitHub API 集成的 `GitHubFileNode`, `GithubNodeBase`

## 🔧 高级用法示例

### CDN 集成

```typescript
import {
  getCdnUrl,
  getCdnImageUrl,
  getCdnFileUrl,
  CDNUtils
} from '@libra/common'

// 直接函数使用
const imageUrl = getCdnImageUrl('profile-pic.jpg')
const fileUrl = getCdnFileUrl('documents/report.pdf')
const uploadUrl = getCdnUploadUrl('temp/upload.zip')

// 基于类的使用
const cdn = new CDNUtils()
const screenshotUrl = cdn.getCdnScreenshotUrl('screenshot-123.png')
const staticAssetUrl = cdn.getCdnStaticAssetUrl('css/styles.css')
```

### 数据库错误处理

```typescript
import {
  withDatabaseErrorHandling,
  classifyDatabaseError,
  isDatabaseError,
  DatabaseErrorType
} from '@libra/common'

// 自动错误处理包装器
const safeDbOperation = withDatabaseErrorHandling(async () => {
  return await db.user.findMany()
})

const [users, error] = await safeDbOperation()

if (error) {
  console.log('用户友好消息:', error.userMessage)
  console.log('错误类型:', error.type)
}

// 手动错误分类
try {
  await db.query('SELECT * FROM users')
} catch (err) {
  if (isDatabaseError(err)) {
    const errorType = classifyDatabaseError(err)
    console.log('分类为:', errorType)
  }
}
```

### Cloudflare Workers 工具

```typescript
import {
  getRequestId,
  sleep,
  safeJsonParse,
  retryWithBackoff,
  validateIdentifier
} from '@libra/common'

// 生成唯一请求 ID
const requestId = getRequestId()

// 安全 JSON 解析
const [data, parseError] = safeJsonParse(jsonString)

// 指数退避重试
const result = await retryWithBackoff(
  async () => fetch('/api/unstable-endpoint'),
  { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
)

// 验证标识符
if (validateIdentifier(userInput)) {
  // 安全用作标识符
}
```

## 🔧 高级用法

### 环境特定工具

```typescript
import {
  isDevelopment,
  isProduction,
  getEnvironment,
  getRequestId
} from '@libra/common'

// 环境检测
if (isDevelopment()) {
  logger.setLogLevel(LogLevel.DEBUG)
}

// Cloudflare Workers 中的请求跟踪
const requestId = getRequestId()
logger.info('Processing request', { requestId })

// 基于环境的配置
const config = {
  logLevel: isDevelopment() ? 'debug' : 'info',
  enableMetrics: isProduction(),
  environment: getEnvironment()
}
```

### 高级文件处理

```typescript
import {
  buildFiles,
  sortFileExplorer,
  isFileType,
  isDirectoryType,
  validateIdentifier,
  sanitizeIdentifier
} from '@libra/common'

// 高效处理大型文件结构
const processFileStructure = async (structure: FileStructure) => {
  const { fileMap, treeContents } = buildFiles(structure)

  // 排序以优化显示
  const sortedFiles = sortFileExplorer(treeContents)

  // 使用类型安全处理文件
  for (const item of sortedFiles) {
    if (isFileType(item)) {
      // 处理文件
      const content = item.content
      console.log(`处理文件: ${item.name}`)
    } else if (isDirectoryType(item)) {
      // 处理目录
      const children = Object.keys(item.children)
      console.log(`处理目录: ${item.name}，包含 ${children.length} 个项目`)
    }
  }

  return { fileMap, sortedFiles }
}

// 安全标识符处理
const createSafeIdentifier = (userInput: string) => {
  if (validateIdentifier(userInput)) {
    return userInput
  }
  return sanitizeIdentifier(userInput)
}
```

### 强大的错误处理模式

```typescript
import {
  tryCatch,
  withDatabaseErrorHandling,
  DatabaseErrorType,
  logger
} from '@libra/common'

// 嵌套错误处理
const complexOperation = async () => {
  const [dbResult, dbError] = await tryCatch(
    withDatabaseErrorHandling(async () => {
      return await database.complexQuery()
    })
  )

  if (dbError) {
    logger.error('数据库操作失败', {
      operation: 'complexQuery',
      errorType: dbError.type,
      isRetryable: dbError.isRetryable
    }, dbError)

    if (dbError.isRetryable) {
      // 实现重试逻辑
      return await retryWithBackoff(() => complexOperation(), {
        maxRetries: 3,
        baseDelay: 1000
      })
    }

    throw new Error(dbError.userMessage)
  }

  return dbResult
}
```

## 📊 性能和最佳实践

### 内存管理

- **Tree Shaking**: 只导入需要的内容以最小化包大小
- **懒加载**: 在可能的情况下对大型工具使用动态导入
- **内存泄漏**: 始终清理由 `debounce` 创建的超时和间隔

```typescript
// 好的做法：导入特定函数
import { debounce, logger } from '@libra/common'

// 避免：导入所有内容
// import * as common from '@libra/common'

// 好的做法：在组件卸载时清理防抖函数
const debouncedFn = debounce(myFunction, 300)
// 在清理时：如果可用，调用 debouncedFn.cancel?.()
```

### 错误处理最佳实践

- **始终使用 `tryCatch`** 处理可能失败的异步操作
- **使用内置错误处理分类数据库错误**
- **使用上下文记录日志** 以便于调试
- **适当处理可重试错误**

```typescript
// 好的做法：全面的错误处理
const [result, error] = await tryCatch(async () => {
  return await riskyOperation()
})

if (error) {
  logger.error('操作失败', {
    operation: 'riskyOperation',
    userId: currentUser.id
  }, error)

  // 适当处理错误
  return { success: false, error: error.message }
}

// 好的做法：数据库错误处理
const safeDbOperation = withDatabaseErrorHandling(async () => {
  return await db.query('SELECT * FROM users')
})
```

### 日志记录最佳实践

- **使用适当的日志级别**（开发环境使用 DEBUG，生产环境使用 INFO）
- **在所有日志消息中包含相关上下文**
- **使用组件特定的日志记录器** 以便更好地组织
- **避免记录敏感信息**

```typescript
// 好的做法：带上下文的结构化日志
logger.info('用户操作完成', {
  component: 'USER_MANAGEMENT',
  action: 'UPDATE_PROFILE',
  userId: user.id,
  duration: Date.now() - startTime
})

// 好的做法：组件特定的日志记录
log.auth('info', '用户已认证', { userId: user.id })
log.api('error', '请求失败', { endpoint: '/api/users' }, error)

// 避免：记录敏感数据
// logger.info('用户登录', { password: user.password }) // 不要这样做
```

## 🔧 故障排除

### 常见问题

#### 1. 导入错误

**问题:** 无法解析模块 '@libra/common'

**解决方案:**

```bash
# 确保你在 Zepid monorepo 中
cd /path/to/libra

# 安装依赖
bun install

# 检查 package.json 包含依赖
"@libra/common": "*"
```

#### 2. TypeScript 错误

**问题:** 找不到类型定义

**解决方案:**

```typescript
// 确保正确的导入
import type { FileType, TFile, LogContext } from '@libra/common'
import { logger, tryCatch, buildFiles } from '@libra/common'

// 检查 tsconfig.json 包含正确的路径
{
  "compilerOptions": {
    "paths": {
      "@libra/common": ["./packages/common/src"]
    }
  }
}
```

#### 3. 日志记录器不工作

**问题:** 日志消息不显示

**解决方案:**

```typescript
import { logger, LogLevel } from '@libra/common'

// 设置适当的日志级别
logger.setLogLevel(LogLevel.DEBUG)

// 检查环境变量
process.env.LOG_LEVEL = 'debug'
process.env.NODE_ENV = 'development'
```

#### 4. CDN URL 不工作

**问题:** CDN URL 返回 404 或错误的 URL

**解决方案:**

```typescript
// 检查环境变量
process.env.NEXT_PUBLIC_CDN_URL = 'https://your-cdn-domain.com'
process.env.CDN_URL = 'https://your-cdn-domain.com'

// 验证 CDN 服务正在运行
import { getCdnUrl } from '@libra/common'
console.log('CDN 基础 URL:', getCdnUrl(''))
```

## 🧪 测试

### 单元测试

目前，该包不包含测试，但以下是你应该如何测试这些工具：

```typescript
// 示例测试结构
import { debounce, deepMerge, tryCatch } from '@libra/common'

describe('@libra/common utilities', () => {
  test('debounce 应该延迟函数执行', async () => {
    let callCount = 0
    const debouncedFn = debounce(() => callCount++, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    expect(callCount).toBe(0)

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(callCount).toBe(1)
  })

  test('deepMerge 应该递归合并对象', () => {
    const target = { a: { b: 1 } }
    const source = { a: { c: 2 }, d: 3 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: { b: 1, c: 2 }, d: 3 })
  })

  test('tryCatch 应该安全处理错误', async () => {
    const [result, error] = await tryCatch(async () => {
      throw new Error('Test error')
    })

    expect(result).toBeNull()
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('Test error')
  })
})
```

### 集成测试

```typescript
// 使用实际文件结构进行测试
import { buildFiles, convertToTreeStructure } from '@libra/common'

const testFileStructure = {
  'src/': {
    type: 'folder',
    children: {
      'index.ts': {
        type: 'file',
        content: 'export * from "./utils"'
      }
    }
  }
}

const { fileMap, treeContents } = buildFiles(testFileStructure)
expect(fileMap['src/index.ts']).toBe('export * from "./utils"')
```

## 🔗 相关包

- [`@libra/auth`](../auth/README.md) - 身份验证和授权
- [`@libra/api`](../api/README.md) - tRPC API 定义
- [`@libra/ui`](../ui/README.md) - UI 组件和设计系统
- [`@libra/db`](../db/README.md) - 数据库模式和工具

## 📖 文档

有关详细的 API 参考和使用示例，请参考源代码和 TypeScript 定义。该包完全类型化，并提供全面的 IntelliSense 支持。

## 🤝 贡献

此包是 Zepid AI 平台的一部分。请参考主仓库的贡献指南。

## 📄 许可证

AGPL-3.0-only - 详情请参见 LICENSE 文件。