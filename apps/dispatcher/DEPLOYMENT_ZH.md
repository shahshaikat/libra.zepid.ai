# Dispatcher 部署指南 - 方案 A (通配符子域名路由)

## 概述

本 dispatcher 应用已实现了通配符子域名路由系统。用户可以通过 `*.libra.sh` 的子域名直接访问对应的 Worker。

## 架构流程

```
用户请求: https://vite-shadcn-template.libra.sh/
    ↓
Cloudflare DNS: *.libra.sh → libra-dispatcher Worker
    ↓
Dispatcher 解析子域名: "vite-shadcn-template"
    ↓
调用: env.dispatcher.get("vite-shadcn-template")
    ↓
转发请求到用户 Worker
```

## 部署步骤

### 1. 部署 Dispatcher Worker

```bash
cd apps/dispatcher
wrangler deploy
```

这将自动应用 `wrangler.jsonc` 中的路由配置：
```json
"routes": [
  {
    "pattern": "*.libra.sh/*",
    "zone_name": "libra.sh"
  }
]
```

**重要**: 使用对象格式的路由配置是为了支持 SaaS 模式的通配符 SSL，必须指定 `zone_name` 以避免部署时的 10082 错误。

### 2. 配置 DNS

在 Cloudflare Dashboard 中为 `libra.sh` 域名添加：

```
类型: CNAME
名称: *
目标: libra-dispatcher.<your-account>.workers.dev
代理状态: 已代理 (橙色云)
```

### 3. 部署用户 Worker

为每个项目部署 Worker 到 dispatch namespace：

```bash
# 示例：部署 vite-shadcn-template 项目
wrangler deploy --name vite-shadcn-template --dispatch-namespace libra-dispatcher

# 示例：部署其他项目
wrangler deploy --name my-react-app --dispatch-namespace libra-dispatcher
```

### 4. 验证部署

部署完成后，可以通过以下 URL 访问：

- `https://vite-shadcn-template.libra.sh/` → Worker "vite-shadcn-template"
- `https://my-react-app.libra.sh/` → Worker "my-react-app"

## 配置文件说明

### wrangler.jsonc 关键配置

```json
{
  "name": "libra-dispatcher",
  "dispatch_namespaces": [
    {
      "binding": "dispatcher",
      "namespace": "libra-dispatcher"
    }
  ],
  "routes": [
    {
      "pattern": "*.libra.sh/*",
      "zone_name": "libra.sh"
    }
  ]
}
```

### 支持的域名

当前配置支持以下域名的子域名路由：
- `*.libra.sh` (生产环境)
- `*.dispatcher.zepid.dev` (测试环境)
- `*.localhost` (本地开发)

## 保留子域名

以下子域名为系统保留，不能用作 Worker 名称：
- `dispatcher`
- `api`
- `health`
- `admin`
- `system`
- `www`
- `mail`
- `ftp`
- `cdn`
- `assets`
- `static`

## Worker 名称规则

- 只能包含字母、数字和连字符
- 长度不超过 63 个字符
- 不能以连字符开头或结尾
- 不能使用保留名称

## 错误处理

Dispatcher 提供详细的错误信息：

- **404 Worker not found**: Worker 不存在于 dispatch namespace
- **400 Invalid worker name**: 子域名不符合命名规则
- **400 No subdomain specified**: 未提供子域名
- **404 Unsupported domain**: 域名不在支持列表中

## 监控和调试

- 查看 Dispatcher 信息: `GET /dispatch`
- 健康检查: `GET /health`
- 查看日志: Cloudflare Dashboard → Workers → libra-dispatcher → Logs

## 故障排除

### 1. 子域名无法访问

检查：
- DNS 配置是否正确
- Worker 是否已部署到正确的 dispatch namespace
- 子域名是否符合命名规则

### 2. Worker 部署失败

检查：
- dispatch namespace 名称是否正确
- Worker 名称是否符合规则
- 是否有足够的权限

### 3. 路由不生效

检查：
- wrangler.jsonc 中的 routes 配置
- Cloudflare Dashboard 中的路由设置
- DNS 代理状态是否开启

## 性能优化

- 使用 Cloudflare 的全球网络，延迟极低
- 直接子域名路由，无需复杂的路径解析
- 支持 HTTP/2 和 HTTP/3
- 自动 SSL/TLS 证书管理

## 安全考虑

- 所有流量通过 Cloudflare 代理，享受 DDoS 保护
- 自动 SSL/TLS 加密
- Worker 隔离执行环境
- 支持 CSP 和其他安全头设置
