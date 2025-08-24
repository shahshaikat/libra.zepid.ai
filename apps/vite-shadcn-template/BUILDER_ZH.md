# Sandbox Templates

本文档介绍如何创建自定义沙盒模板。通过指定 `e2b.Dockerfile`，我们将创建一个新的沙盒模板并提供模板 ID。然后，您可以使用此模板 ID 通过 SDK 基于您创建的模板创建新的沙盒。

## 创建自定义沙盒的步骤

### 目录
- [Sandbox Templates](#sandbox-templates)
  - [创建自定义沙盒的步骤](#创建自定义沙盒的步骤)
    - [目录](#目录)
    - [1. 安装 E2B CLI](#1-安装-e2b-cli)
    - [2. 初始化沙盒模板](#2-初始化沙盒模板)
    - [3. 自定义 `e2b.Dockerfile`](#3-自定义-e2bdockerfile)
    - [4. 构建沙盒模板](#4-构建沙盒模板)
    - [5. 启动自定义沙盒](#5-启动自定义沙盒)
  - [Docker 构建和 Daytona 快照命令](#docker-构建和-daytona-快照命令)
    - [Docker 构建命令](#docker-构建命令)
    - [Daytona 快照创建命令](#daytona-快照创建命令)
    - [使用 Daytona snapshot push 命令](#使用-daytona-snapshot-push-命令)
- [文件结构](#文件结构)

### 1. 安装 E2B CLI

**使用 Homebrew (macOS)**


```bash
brew install e2b
```


**使用 NPM**

```bash
bun i -g @e2b/cli
```

### 2. 初始化沙盒模板

以下命令将在当前目录中创建一个基本的 `e2b.Dockerfile`。

```bash
e2b template init
```

### 3. 自定义 `e2b.Dockerfile`

现在您可以通过编辑 `e2b.Dockerfile` 文件来自定义沙盒模板。


### 4. 构建沙盒模板

现在您可以构建沙盒模板。我们将使用 Docker 和 E2B CLI。
E2B CLI 将调用 Docker 构建镜像，然后将其推送到 E2B 云。
然后，我们将 Docker 镜像转换为微型 VM，可以通过 SDK 作为沙盒启动。

```bash
e2b template build --cpu-count 2 -n "vite-shadcn-template-zepid" --memory-mb 1024 -c "/compile_page.sh"
```

此过程需要一些时间。最后，您将看到创建的模板 ID，您需要使用此 ID 通过 SDK 创建沙盒。

### 5. 启动自定义沙盒

现在您可以使用模板 ID 通过 SDK 创建沙盒。

```javascript {{ language: 'js' }}
import { sandbox } from '@e2b/code-interpreter'

// 上一步中获取的模板 ID
const templateID = 'id-of-your-template' // $HighlightLine
// 将模板 ID 传递给 `Sandbox.create` 方法
const sandbox = await Sandbox.create(templateID) // $HighlightLine

// 模板安装了 cowsay，所以我们可以使用它
const execution = await sandbox.runCode(`
import cowsay
cowsay.say('Hello from E2B!')
`)

console.log(execution.stdout)

```

## Docker 构建和 Daytona 快照命令

### Docker 构建命令
```bash
docker buildx build --platform linux/amd64 -t vite-shadcn-template-zepid:1.0.0 -f ./daytona.Dockerfile .
```

### Daytona 快照创建命令
<!-- ```bash
daytona snapshot create vite-shadcn-template-zepid-debug --dockerfile ./daytona.Dockerfile
``` -->

### 使用 Daytona snapshot push 命令
daytona snapshot push vite-shadcn-template-zepid:1.0.0 --entrypoint "bun run dev --host 0.0.0.0" --name vite-shadcn-template-zepid:1.0.0 --cpu 1 --memory 1 --disk 1
```
# 文件结构

使用 bun generate-structure.ts 为 AI 编辑器生成文件结构 [fileStructure.ts](fileStructure.ts)

然后将结果复制到 [vite-shadcn-template.ts](../../packages/templates/vite-shadcn-template.ts)