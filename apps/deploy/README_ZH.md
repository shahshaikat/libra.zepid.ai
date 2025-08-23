# Zepid Deploy V2 - 基于队列的部署服务

现代化的、基于队列的 Zepid 平台部署服务，构建于 Cloudflare Workers、Queues 和 R2 存储。

## 架构

该服务取代了原始的基于工作流的部署系统，具有更具可扩展性的基于队列的架构：

- **队列处理**：使用 Cloudflare Queues 进行异步部署作业处理

- **状态管理**：混合存储，使用 D1 进行元数据存储，R2 进行详细日志/工件存储

- **批量处理**：具有可配置并发限制的高效批量处理

- **错误处理**：全面的错误处理，支持死信队列

- **监控**：内置健康检查和部署状态跟踪

## 功能

- ✅ 基于队列的部署处理

- ✅ 具有并发控制的批量处理

- ✅ 全面的错误处理和重试逻辑

- ✅ R2 存储用于日志和工件

- ✅ D1 数据库用于状态管理

- ✅ 用于部署管理的 HTTP API

- ✅ 健康检查和监控端点

- ✅ 死信队列用于失败的部署

- ✅ 部署配额管理

- ✅ TypeScript 支持，具有完全的类型安全性

## 快速开始

### 前置条件

- Node.js 18+ 和 Bun

- 具有已启用 Workers、Queues、R2 和 D1 的 Cloudflare 账户

- 已安装和配置的 Wrangler CLI

### 安装

```bash
# 安装依赖
bun install

# 生成 Cloudflare 类型
bun run cf-typegen

# 启动开发服务器
bun run dev
```

### 配置

1. 使用您的 Cloudflare 账户详细信息更新 `wrangler.jsonc`

2. 创建所需的 R2 存储桶：

- `libra-deployment-logs`

- `libra-deployment-artifacts`

3. 设置部署队列和死信队列

4. 配置环境变量

### 部署

```bash
# 部署到开发环境
bun run deploy:dev

# 部署到生产环境
bun run deploy:prod
```

## API 端点

### 部署管理

- `POST /deploy` - 队列化新的部署

- `GET /deploy/:id/status` - 获取部署状态

- `GET /deploy/:id/logs` - 获取部署日志

### 监控

- `GET /health` - 基本健康检查

- `GET /health/detailed` - 具有依赖状态的详细健康检查

- `GET /health/ready` - 就绪探测

- `GET /health/live` - 存活探测

### 状态和统计

- `GET /status` - 服务状态和统计

- `GET /status/deployments` - 列出最近的部署

- `GET /status/queue` - 队列状态和指标

- `POST /status/cleanup` - 清理旧部署数据

## 队列配置

服务使用两个队列：

- **deployment-queue**：部署作业的主队列

- 最大批量大小：10

- 最大批量超时：30 秒

- 最大重试次数：3

- **deployment-dlq**：失败作业的死信队列

- 存储超过重试限制的作业

- 用于调试和手动干预

## 存储

### D1 数据库

存储部署元数据和状态，以便快速查询：

- 部署状态和进度

- 错误信息

- 基本元数据

### R2 存储

存储详细的日志和工件：

- 逐步部署日志

- 构建工件和输出

- 部署历史

- 错误详细信息和堆栈跟踪

## 开发

### 项目结构

```
src/
├── api/ # HTTP API 路由和中间件
├── deployment/ # 部署工作流和步骤
│ └── steps/ # 单个部署步骤
├── queue/ # 队列消费者和生产者
├── types/ # TypeScript 类型定义
└── utils/ # 实用函数和帮助程序
```

### 关键组件

- **QueueDeploymentWorkflow**：主要的部署协调器

- **DeploymentStateManager**：状态持久化和检索

- **队列消费者**：部署作业的批量处理

### 测试

```bash
# 运行类型检查
bun run typecheck

# 运行测试（当实现时）
bun run test

# 运行测试并覆盖
bun run test:coverage
```

## 从 V1 迁移

该服务旨在作为原始的基于工作流的部署服务的直接替代：

1. **API 兼容性**：HTTP 端点保持不变

2. **响应格式**：为了向后兼容而维护响应格式

3. **错误代码**：错误代码和消息保持一致

4. **部署流程**：六步部署流程得以保留

### 主要区别

- **异步处理**：部署被队列化，而不是立即处理

- **更好的可扩展性**：基于队列的处理允许更好的资源利用

- **增强的监控**：更详细的日志记录和监控功能

- **改进的错误处理**：更好的错误分类和重试逻辑

## 配置

### 环境变量

必需：

- `CLOUDFLARE_ACCOUNT_ID`：您的 Cloudflare 账户 ID

- `CLOUDFLARE_API_TOKEN`：具有适当权限的 Cloudflare API令牌

可选：

- `LOG_LEVEL`：日志级别（debug，info，warn，error）

- `MAX_CONCURRENT_DEPLOYMENTS`：最大并发部署（默认值：5）

- `MAX_DEPLOYMENT_TIMEOUT`：最大部署超时（毫秒）（默认值：600000）

### 队列设置

在 `wrangler.jsonc` 中配置：

- `max_batch_size`：每批次的最大消息数（默认值：10）

- `max_batch_timeout`：最大批次等待时间（秒）（默认值：30）

- `max_retries`：最大重试尝试次数（默认值：3）

## 监控和可观察性

服务包括全面的监控：

- **结构化日志记录**：具有相关 ID 的 JSON 格式日志

- **健康检查**：针对不同用例的多个健康检查端点

- **指标**：部署统计和队列指标

- **错误跟踪**：具有上下文的详细错误日志记录

## 安全

- **输入验证**：所有输入都经过验证和净化

- **错误处理**：错误被记录，但不暴露敏感信息

- **配额管理**：按组织强制执行部署配额

- **访问控制**：与现有身份验证系统的集成

## 支持

如有问题和疑问：

1. 在 R2 存储中检查日志

2. 使用健康检查端点诊断问题

3. 查看部署状态 API 以获取详细的错误信息

4. 检查死信队列中的失败部署

## 许可证

AGPL-3.0-only - 有关详细信息，请参见 LICENSE 文件。