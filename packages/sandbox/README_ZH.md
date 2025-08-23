# @libra/sandbox

Zepid AI 的统一沙箱抽象层，支持多个沙箱提供商（E2B、Daytona），提供一致的接口。

## 功能特性

- **多提供商支持**：在 E2B 和 Daytona 沙箱提供商之间无缝切换
- **类型安全接口**：完整的 TypeScript 支持，包含全面的类型定义
- **工厂模式**：简单的提供商实例化和管理
- **配置管理**：基于环境变量和编程式配置
- **重试逻辑**：内置重试机制，支持指数退避
- **文件操作**：批量文件操作，包含错误处理
- **命令执行**：安全的命令执行，包含验证
- **健康监控**：沙箱健康检查和就绪状态检测

## 安装

```bash
# 此包是 Zepid monorepo 的一部分
# 安装依赖
bun install
```

## 快速开始

### 基本用法

```typescript
import {
  initializeSandboxFactory,
  createSandbox,
  createConfigFromEnvironment
} from '@libra/sandbox';

// 使用基于环境变量的配置初始化工厂
const config = createConfigFromEnvironment();
await initializeSandboxFactory(config);

// 创建沙箱
const sandbox = await createSandbox({
  provider: 'e2b',
  template: 'vite-shadcn-template-libra',
  timeoutMs: 10 * 60_000,
  env: {
    NODE_ENV: 'development'
  }
});

// 执行命令
const result = await sandbox.executeCommand('npm install');
console.log(result.stdout);

// 写入文件
await sandbox.writeFiles([
  {
    path: 'package.json',
    content: JSON.stringify({ name: 'my-app' }, null, 2)
  },
  {
    path: 'src/index.ts',
    content: 'console.log("Hello, World!");'
  }
]);

// 清理资源
await sandbox.terminate();
```

### 高级配置

```typescript
import {
  SandboxFactory,
  createConfigBuilder,
  E2BSandboxProvider,
  DaytonaSandboxProvider
} from '@libra/sandbox';

// 创建自定义配置
const config = createConfigBuilder()
  .setDefaultProvider('e2b')
  .addE2BProvider({
    type: 'e2b',
    timeout: 30_000,
    retries: 3
  })
  .addDaytonaProvider({
    type: 'daytona',
    apiUrl: 'https://api.daytona.io',
    apiKey: process.env.DAYTONA_API_KEY,
    timeout: 45_000
  })
  .build();

// 初始化工厂
const factory = new SandboxFactory(config);
await factory.initialize();

// 使用特定提供商
const e2bSandbox = await factory.createSandbox({
  provider: 'e2b',
  template: 'vite-shadcn-template-libra'
});

const daytonaSandbox = await factory.createSandbox({
  provider: 'daytona',
  template: 'my-daytona-template'
});
```

### 提供商切换

```typescript
import { getSandboxFactory } from '@libra/sandbox';

const factory = getSandboxFactory();

// 运行时切换默认提供商
factory.setDefaultProvider('daytona');

// 使用新的默认提供商创建沙箱
const sandbox = await factory.createSandbox({
  template: 'my-template'
  // 将使用 Daytona 提供商
});
```

## 配置

### 环境变量

```bash
# 默认提供商
NEXT_PUBLIC_SANDBOX_DEFAULT_PROVIDER=e2b

# E2B 配置
E2B_API_KEY=your-e2b-api-key
E2B_TIMEOUT=30000
E2B_RETRIES=3

# Daytona 配置
DAYTONA_API_KEY=your-daytona-api-key
DAYTONA_API_URL=https://api.daytona.io
DAYTONA_TIMEOUT=45000
DAYTONA_RETRIES=3
```

### 编程式配置

```typescript
import { createConfigBuilder } from '@libra/sandbox';

const config = createConfigBuilder()
  .setDefaultProvider('e2b')
  .addE2BProvider({
    type: 'e2b',
    apiKey: 'your-api-key',
    timeout: 30_000
  })
  .fromEnvironment() // 与环境变量合并
  .build();
```

## API 参考

### 核心接口

#### ISandboxProvider

```typescript
interface ISandboxProvider {
  readonly providerType: string;
  initialize(config: ProviderConfig): Promise<void>;
  create(config: SandboxConfig): Promise<ISandbox>;
  connect(sandboxId: string, options?: SandboxConnectOptions): Promise<ISandbox>;
  resume(sandboxId: string, options?: SandboxConnectOptions): Promise<ISandbox>;
  list(): Promise<SandboxInfo[]>;
  terminate(sandboxId: string, options?: SandboxTerminationOptions): Promise<SandboxCleanupResult>;
  getInfo(sandboxId: string): Promise<SandboxInfo>;
  isAvailable(): Promise<boolean>;
}
```

#### ISandbox

```typescript
interface ISandbox {
  readonly id: string;
  readonly providerType: string;
  getInfo(): Promise<SandboxInfo>;
  executeCommand(command: string, options?: CommandOptions): Promise<CommandResult>;
  writeFile(file: SandboxFile): Promise<FileOperationResult>;
  writeFiles(files: SandboxFile[]): Promise<BatchFileOperationResult>;
  readFile(path: string): Promise<string>;
  listFiles(path: string): Promise<string[]>;
  deleteFile(path: string): Promise<FileOperationResult>;
  fileExists(path: string): Promise<boolean>;
  terminate(options?: SandboxTerminationOptions): Promise<SandboxCleanupResult>;
  getNativeInstance(): any;
}
```

### 工厂方法

```typescript
// 初始化全局工厂
await initializeSandboxFactory(config);

// 获取全局工厂实例
const factory = getSandboxFactory();

// 便捷方法
const sandbox = await createSandbox(options);
const sandbox = await connectToSandbox(sandboxId, providerType);
const sandbox = await resumeSandbox(sandboxId, providerType);
```

### 实用工具函数

```typescript
// 带退避的重试
await retryWithBackoff(operation, retryConfig);

// 带重试的命令执行
await executeCommandWithRetry(sandbox, command, options);

// 带重试和批处理的文件写入
await writeFilesWithRetry(sandbox, files, batchSize);

// 健康检查
const isHealthy = await checkSandboxHealth(sandbox);
await waitForSandboxReady(sandbox, timeoutMs);

// 安全工具
const safePath = sanitizeFilePath(userPath);
validateCommand(userCommand);
```

## 提供商特定功能

### E2B 提供商

- 基于 E2B SDK
- 支持所有 E2B 模板
- 自动连接恢复
- 内置文件操作
- 支持流式命令执行

### Daytona 提供商

- 基于 REST API 集成
- 工作空间管理
- 自定义模板支持
- 环境变量管理
- 文件上传/下载操作

**注意**：Daytona 提供商实现目前是一个模板，需要根据 Daytona 的实际 API 进行完善。

## 迁移指南

### 从直接使用 E2B 迁移

**之前：**

```typescript
import Sandbox from 'e2b';

const container = await Sandbox.create('template-id');
await container.files.write([{ path: 'file.txt', data: 'content' }]);
const result = await container.commands.run('npm install');
await container.kill();
```

**之后：**

```typescript
import { createSandbox } from '@libra/sandbox';

const sandbox = await createSandbox({
  provider: 'e2b',
  template: 'template-id'
});
await sandbox.writeFile({ path: 'file.txt', content: 'content' });
const result = await sandbox.executeCommand('npm install');
await sandbox.terminate();
```

### 渐进式迁移

您仍然可以访问原生提供商实例以进行高级操作：

```typescript
const sandbox = await createSandbox({ provider: 'e2b', template: 'my-template' });

// 使用抽象接口
await sandbox.writeFile({ path: 'file.txt', content: 'content' });

// 访问原生 E2B 实例以使用高级功能
const e2bContainer = sandbox.getNativeInstance();
await e2bContainer.someAdvancedE2BFeature();
```

## 错误处理

```typescript
import { SandboxError, SandboxErrorType } from '@libra/sandbox';

try {
  const sandbox = await createSandbox(config);
} catch (error) {
  if (error instanceof SandboxError) {
    switch (error.type) {
      case SandboxErrorType.CREATION_FAILED:
        console.error('创建沙箱失败:', error.message);
        break;
      case SandboxErrorType.CONFIGURATION_ERROR:
        console.error('配置错误:', error.message);
        break;
      default:
        console.error('沙箱错误:', error.message);
    }
  }
}
```

## 开发

```bash
# 构建包
bun run build

# 运行类型检查
bun run typecheck

# 格式化和代码检查
bun run format-and-lint:fix
```

## 许可证

AGPL-3.0-only - 详情请参阅 LICENSE 文件。