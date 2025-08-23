# Zepid UI 设计系统

> 现代化、可扩展的 React 组件库和设计系统

Zepid UI 是一个基于 **Tailwind CSS v4** 和 **Radix UI** 构建的企业级设计系统，为现代 Web 应用提供一致、美观且功能强大的用户界面解决方案。该系统包含 **47+ 精心设计的组件**，涵盖从基础元素到复杂交互的完整 UI 生态。

## 🚀 核心特性

### 🎨 现代化设计语言
- **Tailwind CSS v4 集成**：采用最新的 CSS-in-CSS 语法和工具类系统
- **语义化颜色系统**：基于 OKLCH 色彩空间的科学配色方案
- **动态主题切换**：完整的亮色/暗色模式支持，平滑过渡动画
- **品牌定制化**：灵活的品牌色彩和视觉风格配置

### 🧩 组件化架构
- **原子化设计**：遵循原子设计原则，从基础原子到复杂模板
- **组合式 API**：支持灵活的组件组合和嵌套使用
- **变体系统**：使用 CVA (Class Variance Authority) 实现类型安全的样式变体
- **插槽模式**：通过 `asChild` 属性实现组件的灵活替换和扩展

### ♿ 可访问性优先
- **WCAG 2.1 AA 标准**：所有组件均符合国际可访问性标准
- **键盘导航**：完整的键盘操作支持，包括焦点管理和快捷键
- **屏幕阅读器**：语义化 HTML 结构和 ARIA 属性支持
- **高对比度模式**：自动适应系统高对比度设置

### 📱 响应式设计
- **移动优先**：采用移动优先的设计和开发策略
- **断点系统**：灵活的响应式断点配置
- **自适应组件**：组件自动适应不同屏幕尺寸和设备类型
- **触摸友好**：优化的触摸交互体验

### 🛠️ 开发体验
- **TypeScript 支持**：完整的类型定义和智能提示
- **Tree Shaking**：按需导入，优化打包体积
- **开发工具**：丰富的开发辅助工具和调试功能
- **文档完善**：详细的 API 文档和使用示例

## 📁 项目结构

```text
packages/ui/                    # UI 包根目录
├── src/                        # 源码目录
│   ├── components/             # React 组件库
│   │   ├── ui/                 # 基础 UI 组件
│   │   ├── layout/             # 布局组件
│   │   ├── feedback/           # 反馈组件
│   │   ├── navigation/         # 导航组件
│   │   ├── data-display/       # 数据展示组件
│   │   ├── data-entry/         # 数据输入组件
│   │   └── overlay/            # 浮层组件
│   ├── lib/                    # 工具函数库
│   │   ├── utils.ts            # 通用工具函数
│   │   ├── hooks/              # 自定义 React Hooks
│   │   └── constants/          # 常量定义
│   └── styles/                 # 样式系统
│       ├── globals.css         # 全局样式入口
│       ├── theme.css           # 主题配置
│       ├── variables.css       # CSS 变量定义
│       ├── utils.css           # 工具类扩展
│       └── animations.css      # 动画定义
├── components.json             # shadcn/ui 配置
├── package.json               # 包配置
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 项目说明
```

## 🎯 快速开始

### 安装依赖

```bash
# 只使用 Bun（项目默认包管理器）
bun add @libra/ui
```

### 基础配置

1. **导入全局样式**

```tsx
// app/globals.css 或 src/index.css
import '@libra/ui/globals.css'
```

**注意**：样式导入路径基于实际的 exports 配置，确保项目已正确配置模块解析。

2. **配置主题提供者**

```tsx
// app/layout.tsx 或 src/App.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

3. **使用组件**

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@libra/ui'

export default function HomePage() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>欢迎使用 Zepid UI</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>开始使用</Button>
      </CardContent>
    </Card>
  )
}
```

## 📦 组件库

### 🎨 基础组件 (Foundation)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Button** | 按钮组件 | 8种变体、4种尺寸、支持图标和加载状态 |
| **Badge** | 徽章组件 | 状态指示、数量显示、多种颜色主题 |
| **Avatar** | 头像组件 | 图片头像、文字头像、占位符、尺寸变体 |
| **Separator** | 分割线组件 | 水平/垂直分割、自定义样式 |
| **Skeleton** | 骨架屏组件 | 内容加载占位、动画效果 |

### 📝 数据输入 (Data Entry)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Input** | 输入框组件 | 前后缀、验证状态、禁用状态 |
| **Textarea** | 文本域组件 | 自适应高度、字符计数、调整大小 |
| **Select** | 下拉选择组件 | 单选/多选、搜索过滤、分组选项 |
| **Checkbox** | 复选框组件 | 三态支持、自定义样式 |
| **Switch** | 开关组件 | 开关状态、禁用状态、尺寸变体 |
| **Slider** | 滑块组件 | 单值/范围、步长控制、标记点 |
| **Input OTP** | 验证码输入 | 自动聚焦、粘贴支持、自定义长度 |
| **Form** | 表单组件 | 字段验证、错误处理、表单布局 |

### 🗂️ 数据展示 (Data Display)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Table** | 表格组件 | 排序、筛选、分页、响应式 |
| **Card** | 卡片组件 | 标题、内容、底部、阴影效果 |
| **Accordion** | 折叠面板 | 单个/多个展开、动画过渡 |
| **Tabs** | 选项卡组件 | 水平/垂直布局、键盘导航 |
| **Calendar** | 日历组件 | 日期选择、范围选择、本地化 |
| **Chart** | 图表组件 | 多种图表类型、响应式、主题适配 |
| **Progress** | 进度条组件 | 线性进度、环形进度、动画效果 |

### 🧭 导航组件 (Navigation)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Navbar** | 导航栏组件 | 响应式布局、品牌区域、操作按钮 |
| **Sidebar** | 侧边栏组件 | 折叠展开、移动端适配、多级菜单 |
| **Breadcrumb** | 面包屑导航 | 路径导航、自定义分隔符、溢出处理 |
| **Command** | 命令面板 | 快捷搜索、键盘导航、分组显示 |

### 💬 反馈组件 (Feedback)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Alert** | 警告提示 | 4种类型、图标支持、可关闭 |
| **Toast** | 消息通知 | 多种位置、自动消失、操作按钮 |
| **Toaster** | 通知容器 | Toast 系统容器、全局通知管理 |
| **Sonner** | 现代通知 | 堆叠效果、手势操作、丰富样式 |
| **Loader** | 加载指示器 | 多种样式、尺寸变体、颜色主题 |
| **Multi Step Loader** | 多步骤加载 | 步骤指示、进度动画、状态管理 |

### 🎭 浮层组件 (Overlay)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Dialog** | 对话框组件 | 模态窗口、键盘导航、焦点管理 |
| **Alert Dialog** | 确认对话框 | 危险操作确认、自定义按钮 |
| **Sheet** | 抽屉组件 | 四个方向、手势操作、响应式 |
| **Drawer** | 底部抽屉 | 移动端优化、拖拽操作 |
| **Popover** | 弹出框组件 | 智能定位、点击外部关闭 |
| **Tooltip** | 工具提示 | 悬停显示、键盘触发、延迟控制 |
| **Dropdown Menu** | 下拉菜单 | 多级菜单、分组、快捷键 |

### 🎨 视觉效果 (Visual Effects)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Beam** | 光束效果 | 径向渐变、多种色调、动态效果 |
| **Glow** | 光晕效果 | 背景光晕、位置控制、透明度调节 |
| **Gradient Border** | 渐变边框 | 自定义方向、颜色渐变、动画效果 |
| **Grid Pattern** | 网格背景 | 点阵图案、渐变遮罩、尺寸控制 |
| **Mockup** | 设备样机 | 设备外壳、屏幕内容、阴影效果 |
| **Tile** | 磁贴组件 | 特色展示、悬停效果、内容布局 |

### 🔧 工具组件 (Utilities)

| 组件 | 描述 | 特性 |
|------|------|------|
| **Scroll Area** | 滚动区域 | 自定义滚动条、平滑滚动、触摸支持 |
| **Section** | 区块组件 | 页面分区、容器布局、间距控制 |
| **Label** | 标签组件 | 表单标签、关联控件、样式变体 |
| **Kbd** | 键盘按键 | 快捷键显示、平台适配、样式美化 |
| **use-mobile** | 移动端检测 | 响应式Hook、断点监听、设备判断 |

## 🎨 主题系统

### Tailwind CSS v4 集成

Zepid UI 基于 **Tailwind CSS v4** 构建，采用最新的 CSS-in-CSS 语法，提供更强大的主题定制能力：

```css
/* theme.css - 使用 @theme 指令定义主题 */
@theme inline {
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --radius-lg: var(--radius);
  --animate-accordion-down: accordion-down 0.2s ease-out;
}
```

### 颜色系统

#### 语义化颜色

基于用途而非外观的颜色命名系统：

| 颜色类别 | 用途 | 示例 |
|----------|------|------|
| **Primary** | 主要操作、品牌色 | 主按钮、链接、重要信息 |
| **Secondary** | 次要操作 | 次要按钮、辅助信息 |
| **Accent** | 强调、高亮 | 选中状态、活跃元素 |
| **Muted** | 次要内容 | 占位文本、禁用状态 |
| **Destructive** | 危险操作 | 删除按钮、错误信息 |
| **Brand** | 品牌标识 | Logo、品牌元素 |

#### OKLCH 色彩空间

使用现代 OKLCH 色彩空间，提供更准确的颜色表示：

```css
/* variables.css - OKLCH 颜色定义 */
:root {
  --primary: oklch(47.78% 0.111 255.58);
  --primary-foreground: oklch(98.81% 0.004 316.6);
  --brand: oklch(60% 0.15 280);
}

.dark {
  --primary: oklch(83.25% 0.184 255.58);
  --primary-foreground: oklch(23.84% 0.065 255.58);
  --brand: oklch(70% 0.18 280);
}
```

### 暗色模式

#### 自动主题切换

```tsx
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
```

#### 主题变量

所有颜色都支持明暗主题自动切换：

```css
/* 自动适应主题的组件样式 */
.card {
  background-color: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
}
```

### CSS 变量架构

#### 分层变量系统

```css
/* 1. 基础变量层 - variables.css */
:root {
  --radius: 0.5rem;
  --shadow: oklch(0% 0 0 / 0.1);
}

/* 2. 主题映射层 - theme.css */
@theme inline {
  --color-background: var(--background);
  --radius-lg: var(--radius);
}

/* 3. 组件应用层 */
.button {
  background: var(--primary);
  border-radius: var(--radius-lg);
}
```

### 动画系统

#### 内置动画

| 动画名称 | 用途 | 持续时间 |
|----------|------|----------|
| `accordion-down/up` | 折叠面板展开收起 | 0.2s |
| `appear` | 元素淡入出现 | 0.4s |
| `appear-zoom` | 元素缩放出现 | 0.4s |
| `marquee` | 跑马灯滚动 | 可配置 |
| `pulse-fade` | 脉冲淡入淡出 | 6s |
| `shiny-text` | 文字光泽效果 | 2.5s |

#### 自定义动画

```css
/* theme.css - 定义关键帧 */
@keyframes custom-slide {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 注册动画 */
@theme inline {
  --animate-custom-slide: custom-slide 0.3s ease-out;
}
```

### 工具类扩展

#### 自定义工具类

```css
/* utils.css - 使用 @utility 指令 */
@utility glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@utility text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

#### 响应式工具类

```tsx
// 使用响应式前缀
<div className="p-4 md:p-8 lg:p-12">
  <h1 className="text-lg md:text-xl lg:text-2xl">
    响应式标题
  </h1>
</div>
```

## 🧩 组件设计模式

### 组合模式 (Composition Pattern)

大多数复杂组件使用组合模式设计，允许灵活组装不同部分：

```tsx
// Card 组件的组合使用
<Card className="w-96">
  <CardHeader>
    <CardTitle>项目统计</CardTitle>
    <CardDescription>本月数据概览</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex justify-between">
        <span>总访问量</span>
        <Badge variant="secondary">12,345</Badge>
      </div>
      <Progress value={75} className="w-full" />
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">查看详情</Button>
  </CardFooter>
</Card>
```

### 变体系统 (Variant System)

使用 **CVA (Class Variance Authority)** 实现类型安全的样式变体：

```tsx
// Button 组件变体定义
const buttonVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// 使用变体
<Button variant="destructive" size="lg">
  删除项目
</Button>
```

### 插槽模式 (Slot Pattern)

使用 `asChild` 属性实现组件插槽，允许自定义元素替换：

```tsx
// Button 组件作为 Link 使用
<Button asChild>
  <Link href="/dashboard">
    <BarChart className="mr-2 h-4 w-4" />
    查看仪表板
  </Link>
</Button>

// Dialog 触发器自定义
<DialogTrigger asChild>
  <Card className="cursor-pointer hover:shadow-md">
    <CardContent className="p-6">
      <h3>点击打开对话框</h3>
    </CardContent>
  </Card>
</DialogTrigger>
```

### 上下文共享 (Context Pattern)

复杂组件使用 React Context 在组件树中共享状态：

```tsx
// Sidebar 上下文实现
const SidebarContext = React.createContext<SidebarContextProps | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }
  return context
}

// 使用上下文
function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
      <PanelLeft className="h-4 w-4" />
    </Button>
  )
}
```

## 🛠️ 开发指南

### 组件导入

所有组件可以从 `@libra/ui` 直接导入：

```tsx
// 基础组件导入（通过 package.json exports 配置）
import { Button } from '@libra/ui/components/button'
import { Input } from '@libra/ui/components/input'
import { Card, CardContent, CardHeader, CardTitle } from '@libra/ui/components/card'

// 样式工具导入
import { cn } from '@libra/ui/lib/utils'

// 样式文件导入
import '@libra/ui/globals.css'
```

### 自定义组件样式

#### 使用 className 属性

```tsx
import { Button } from '@libra/ui'
import { cn } from '@libra/ui/lib/utils'

function CustomButton({ className, ...props }) {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-purple-500 to-pink-500",
        "hover:from-purple-600 hover:to-pink-600",
        "text-white font-bold",
        className
      )}
      {...props}
    />
  )
}
```

#### 扩展现有组件

```tsx
import { Card, CardContent } from '@libra/ui'
import { cn } from '@libra/ui/lib/utils'

interface FeatureCardProps extends React.ComponentProps<typeof Card> {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description, className, ...props }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group hover:shadow-lg transition-shadow duration-200",
        "border-2 hover:border-primary/20",
        className
      )}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 主题切换实现

```tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@libra/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@libra/ui'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          深色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## 📋 最佳实践

### 1. 保持设计一致性

```tsx
// ✅ 推荐：使用设计系统提供的组件
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default">操作按钮</Button>
  </CardContent>
</Card>

// ❌ 不推荐：自定义实现相同功能
<div className="border rounded-lg p-4 shadow">
  <h3 className="font-bold text-lg mb-2">标题</h3>
  <div className="pt-4">
    <button className="bg-blue-500 text-white px-4 py-2 rounded">
      操作按钮
    </button>
  </div>
</div>
```

### 2. 尊重主题系统

```tsx
// ✅ 推荐：使用语义化颜色变量
<div className="bg-card text-card-foreground border border-border">
  <p className="text-muted-foreground">次要文本</p>
  <Button variant="destructive">危险操作</Button>
</div>

// ❌ 不推荐：硬编码颜色值
<div className="bg-white text-black border border-gray-200 dark:bg-gray-900 dark:text-white">
  <p className="text-gray-500 dark:text-gray-400">次要文本</p>
  <button className="bg-red-500 text-white">危险操作</button>
</div>
```

### 3. 优先使用组件变体

```tsx
// ✅ 推荐：使用内置变体
<Button variant="outline" size="lg">
  大型轮廓按钮
</Button>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>错误</AlertTitle>
  <AlertDescription>操作失败，请重试</AlertDescription>
</Alert>

// ❌ 不推荐：完全自定义样式
<Button className="border-2 border-gray-300 bg-transparent text-gray-700 px-8 py-3 text-lg">
  大型轮廓按钮
</Button>
```

### 4. 响应式设计

```tsx
// ✅ 推荐：使用响应式前缀
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="p-4 md:p-6">
    <h3 className="text-lg md:text-xl lg:text-2xl">响应式标题</h3>
    <Button size="sm" className="md:size-default lg:size-lg">
      响应式按钮
    </Button>
  </Card>
</div>
```

### 5. 可访问性考虑

```tsx
// ✅ 推荐：完整的可访问性支持
<Dialog>
  <DialogTrigger asChild>
    <Button>
      <Settings className="mr-2 h-4 w-4" />
      设置
      <span className="sr-only">打开设置对话框</span>
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>设置</DialogTitle>
      <DialogDescription>
        配置您的应用程序设置
      </DialogDescription>
    </DialogHeader>
    {/* 对话框内容 */}
  </DialogContent>
</Dialog>

// 表单标签关联
<div className="space-y-2">
  <Label htmlFor="email">邮箱地址</Label>
  <Input
    id="email"
    type="email"
    placeholder="请输入邮箱"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-sm text-destructive">
    请输入有效的邮箱地址
  </p>
</div>
```

## ❓ 常见问题

### Q: 如何自定义主题颜色？

A: 修改 `variables.css` 文件中的颜色变量：

```css
:root {
  /* 自定义主色 */
  --primary: oklch(50% 0.2 280); /* 紫色主题 */
  --primary-foreground: oklch(98% 0.02 280);

  /* 自定义品牌色 */
  --brand: oklch(60% 0.15 120); /* 绿色品牌 */
  --brand-foreground: oklch(98% 0.02 120);
}

.dark {
  --primary: oklch(70% 0.25 280);
  --primary-foreground: oklch(20% 0.05 280);
}
```

### Q: 如何添加新的组件变体？

A: 扩展现有的 CVA 变体定义：

```tsx
import { buttonVariants } from '@libra/ui'
import { cva } from 'class-variance-authority'

// 扩展按钮变体
const extendedButtonVariants = cva(buttonVariants(), {
  variants: {
    variant: {
      // 继承原有变体
      ...buttonVariants.config.variants.variant,
      // 添加新变体
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      neon: 'bg-black text-green-400 border border-green-400 shadow-[0_0_10px_theme(colors.green.400)]',
    },
  },
})
```

### Q: 如何处理组件的服务端渲染 (SSR)？

A: 确保正确配置主题提供者：

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Q: 如何优化打包体积？

A: 使用按需导入和 Tree Shaking：

```tsx
// ✅ 推荐：按需导入（基于实际 exports 配置）
import { Button } from '@libra/ui/components/button'
import { Card, CardContent } from '@libra/ui/components/card'

// ❌ 避免：全量导入
import * as UI from '@libra/ui'

// ✅ 工具函数导入
import { cn } from '@libra/ui/lib/utils'
```

### Q: 如何集成到现有项目？

A: 渐进式集成步骤：

1. **安装依赖**
```bash
# 使用项目推荐的包管理器
bun add @libra/ui
```

2. **导入样式**
```tsx
import '@libra/ui/globals.css'
```

3. **逐步替换组件**
```tsx
// 原有组件
<button className="btn btn-primary">按钮</button>

// 替换为 Zepid UI
<Button variant="default">按钮</Button>
```

4. **配置主题**
```tsx
<ThemeProvider attribute="class" defaultTheme="system">
  <App />
</ThemeProvider>
```

### Q: 如何解决模块导入错误？

A: 常见导入问题及解决方案：

```tsx
// ❌ 可能导致错误的导入方式
import { Button } from '@libra/ui'

// ✅ 正确的导入方式（基于实际 exports）
import { Button } from '@libra/ui/components/button'

// ✅ 工具函数导入
import { cn } from '@libra/ui/lib/utils'

// ✅ 样式导入
import '@libra/ui/globals.css'
```

确保 package.json 中的模块解析配置正确，或检查 TypeScript 的 `paths` 配置。

### Q: Tailwind CSS v4 配置问题？

A: 确保正确配置 Tailwind v4：

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

```css
/* globals.css - 使用新的 @import 语法 */
@import "tailwindcss";
@import "./utils.css";
@import "./theme.css";
@import "./variables.css";
```

## 🚀 总结

Zepid UI 设计系统为现代 Web 应用开发提供了完整的解决方案：

### 🎯 核心优势

- **🎨 现代化设计**：基于 Tailwind CSS v4 和 OKLCH 色彩空间
- **🧩 组件丰富**：40+ 精心设计的组件，覆盖所有常用场景
- **♿ 可访问性**：符合 WCAG 2.1 AA 标准，支持键盘导航和屏幕阅读器
- **📱 响应式**：移动优先的设计理念，完美适配各种设备
- **🎭 主题系统**：完整的明暗主题支持，灵活的品牌定制
- **🛠️ 开发友好**：TypeScript 支持，完善的文档和示例

### 📈 适用场景

- **企业级应用**：管理后台、数据仪表板、业务系统
- **产品官网**：营销页面、产品展示、用户中心
- **移动应用**：响应式 Web 应用、PWA 应用
- **原型设计**：快速原型开发、概念验证

### 🔧 开发环境配置

### 必需依赖

基于实际 package.json 分析，@libra/ui 核心依赖包括：

```json
{
  "dependencies": {
    "@radix-ui/react-*": "^1.x", // Radix UI 组件基础
    "class-variance-authority": "^0.7.1", // CVA 变体系统
    "next-themes": "^0.4.6", // 主题切换
    "lucide-react": "^0.486.0", // 图标库
    "tailwindcss": "^4.1.11", // Tailwind CSS v4
    "sonner": "^2.0.5", // 现代通知系统
    "cmdk": "^0.2.1", // Command 组件
    "react-hook-form": "^7.59.0" // 表单处理
  }
}
```

### Tailwind 配置

项目使用 Tailwind CSS v4 的最新语法：

```css
/* globals.css */
@import "tailwindcss";
@import "./utils.css";
@import "./theme.css";
@import "./variables.css";
```

### PostCSS 配置

确保 PostCSS 正确配置以支持 Tailwind v4：

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 实际颜色系统

基于 variables.css 文件，项目使用 OKLCH 色彩空间：

```css
:root {
  /* 品牌色 */
  --brand: oklch(66.5% 0.1804 47.04);
  --brand-foreground: oklch(75.77% 0.159 55.91);
  
  /* 基础色彩 */
  --background: oklch(98% 0.01 95.1);
  --foreground: oklch(34% 0.03 95.72);
  --primary: oklch(62% 0.14 39.04);
  --primary-foreground: oklch(100% 0 0);
  
  /* 边框和半径 */
  --radius: 0.625rem;
}

.dark {
  --brand: oklch(83.6% 0.1177 66.87);
  --background: oklch(27% 0 106.64);
  --foreground: oklch(81% 0.01 93.01);
}
```

### 组件导入模式

基于实际 exports 配置，支持以下导入方式：

```tsx
// 样式文件
import '@libra/ui/globals.css'

// 单个组件
import { Button } from '@libra/ui/components/button'

// 工具函数
import { cn } from '@libra/ui/lib/utils'
```

## 🔮 未来规划

- **组件扩展**：持续添加新组件和功能
- **性能优化**：Bundle 体积优化、运行时性能提升
- **生态建设**：模板库、示例项目、社区贡献

---

## 📚 相关资源

- **GitHub 仓库**: [libra](https://github.com/nextify-limited/libra)
- **社区讨论**: [GitHub Discussions](https://github.com/nextify-limited/libra/discussions)

## 🤝 贡献指南

欢迎社区贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详细的贡献指南。

### 贡献方式

- 🐛 **Bug 报告**：发现问题请提交 Issue
- 💡 **功能建议**：新功能想法欢迎讨论
- 📝 **文档改进**：帮助完善文档内容
- 🔧 **代码贡献**：提交 Pull Request

---
