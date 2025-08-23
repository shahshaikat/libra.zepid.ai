# Vite Shadcn 模板

一个由 Vite 驱动的现代 React 模板，包含 Shadcn UI 组件、Tailwind CSS 和用于轻松开发的组件检查器。

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 特性

- ⚡️ **Vite** - 闪电般快速的前端工具
- 🧩 **Shadcn UI** - 使用 Radix UI 和 Tailwind CSS 构建的高质量 UI 组件
- 🔍 **组件检查器** - 组件的可视化调试和检查
- 🎨 **Tailwind CSS** - 实用优先的 CSS 框架
- 📦 **TypeScript** - 为组件提供类型安全
- 🔄 **React Query** - 强大的数据获取和状态管理
- 📱 **响应式设计** - 所有组件都采用移动优先的方法
- 🧪 **Firecracker 沙箱** - 预配置的开发沙箱环境

## 技术栈

- **React**: UI 库
- **Vite**: 构建工具
- **TypeScript**: 类型检查
- **Tailwind CSS**: 样式
- **Shadcn UI**: 组件库
- **React Router**: 路由
- **React Query**: 数据获取
- **React Hook Form**: 表单处理

## 开始使用

### 前提条件

- Node.js (v18 或更高版本)
- Bun (推荐) 或 npm/yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/vite-shadcn-template.git
cd vite-shadcn-template

# 安装依赖
bun install
# 或使用 npm
npm install
```

### 开发

```bash
# 启动开发服务器
bun run dev
# 或使用 npm
npm run dev
```

应用将在 `http://localhost:5173` 上可用。

### 生产构建

```bash
# 构建项目
bun run build
# 或使用 npm
npm run build

# 预览生产构建
bun run preview
# 或使用 npm
npm run preview
```

## 项目结构

```
vite-shadcn-template/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 图片、字体等
│   ├── components/
│   │   └── ui/          # Shadcn UI 组件
│   ├── hooks/           # 自定义 React hooks
│   ├── lib/             # 实用函数
│   ├── pages/           # 页面组件
│   ├── App.tsx          # 主应用组件
│   ├── index.css        # 全局样式
│   └── main.tsx         # 应用入口点
├── .dockerignore        # Docker 忽略文件
├── .gitignore           # Git 忽略文件
├── components.json      # Shadcn UI 配置
├── index.html           # HTML 入口点
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 组件检查器

此模板包含一个组件检查器，帮助您实时调试和检查 React 组件。

检查器在开发模式下自动启用，可通过浏览器访问。它允许您：

- 检查组件层次结构
- 查看组件属性和状态
- 调试组件渲染

您可以使用以下环境变量配置检查器：

- `VITE_INSPECTOR_URL` - 检查器的自定义 URL

## 环境变量

在根目录创建一个 `.env` 文件来自定义配置：

```
# 检查器配置
VITE_INSPECTOR_HOST=localhost
VITE_INSPECTOR_PORT=3004
VITE_INSPECTOR_URL=https://cdn.zepid.dev
```

## 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

此项目在 MIT 许可证下授权 - 有关详细信息，请参见 LICENSE 文件。

---

由 [Zepid](https://zepid.dev) 用 ❤️ 构建
