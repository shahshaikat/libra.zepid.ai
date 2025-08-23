# Zepid ShikiCode Package

Zepid ShikiCode is a modern code editor component built on **Shiki**, providing high-performance syntax highlighting and code editing capabilities for web applications. The package adopts a factory pattern design with a rich plugin system that implements professional code editor features like auto-indentation, bracket auto-closing, and comment toggling. It supports all Shiki programming languages and themes, providing VS Code-consistent syntax highlighting while maintaining lightweight and highly customizable characteristics.

## 🚀 Core Features

### ✨ Syntax Highlighting
- **Complete Language Support**: Supports precise syntax highlighting for all Shiki built-in programming languages
- **VS Code-level Highlighting**: Based on TextMate syntax and Shiki engine
- **Theme System**: Supports all Shiki built-in themes with dynamic theme switching
- **Dynamic Loading**: Languages and themes loaded on demand for optimized performance

### 🔧 Editing Features
- **Smart Indentation**: Intelligent indentation management based on tabs and spaces with auto-detection support
- **Bracket Auto-closing**: Supports auto-closing of brackets, quotes, and other paired symbols for multiple languages
- **Line Numbers**: Configurable line number display with visual styling
- **Code Comments**: Supports single-line and multi-line comment toggling with language-specific comment rules

### 🧩 Plugin System
- **Functional Plugin Architecture**: Lifecycle-based plugin management mechanism
- **Built-in Core Plugins**: autoload, closing_pairs, comments, tab
- **Custom Plugins**: Support for developing custom functionality plugins with complete API
- **Plugin Composition**: Support for multi-plugin composition and configuration

### ⚡ Performance Optimization
- **Dual-layer Rendering Architecture**: Efficient architecture with transparent textarea input layer + div display layer
- **Event Synchronization**: Precise synchronization mechanism for input and scroll events
- **Memory Management**: Complete disposal and cleanup mechanism
- **CSS Variables**: Style system based on CSS custom properties

## 📁 Project Structure

```bash
packages/shikicode/
├── lib/                       # Build artifacts
│   ├── index.js              # Main export build file
│   ├── index.d.ts            # TypeScript type definitions
│   └── plugins/              # Plugin system build artifacts
├── src/                       # Source code directory
│   ├── index.ts              # Package export entry, re-exports core.ts
│   ├── core.ts               # Core editor implementation, factory function and interfaces
│   ├── scroll.ts             # Scroll synchronization, input-output layer sync
│   ├── style.ts              # CSS style injection and management
│   └── plugins/              # Plugin system
│       ├── index.ts          # Plugin type definitions and exports
│       ├── autoload.ts       # Auto-load languages and themes
│       ├── closing_pairs.ts  # Bracket and quote auto-closing
│       ├── comments.ts       # Line and block comment toggling
│       ├── tab.ts            # Tab indentation, smart Enter newlines
│       └── common.ts         # Plugin utility functions
├── index.html                # Demo page and test environment
├── package.json              # Package dependencies and script definitions
├── tsconfig.json             # TypeScript configuration
└── tsup.config.ts            # Build configuration
```

## 🛠️ Technical Implementation

### Core Technology Stack
- **Shiki v3.7.0**: JavaScript implementation of TextMate syntax, providing VS Code-level syntax highlighting
- **TypeScript**: Type-safe development experience with strict mode
- **Native DOM API**: Framework-independent, direct use of browser APIs
- **CSS Variables**: Custom properties like `--fg`, `--bg`, `--tab-size`

### Architecture Design
- **Dual-layer Rendering**: Transparent `textarea` for input, `div` for syntax highlighting display
- **Event Synchronization**: `input` events trigger re-rendering, `scroll` events sync scroll positions
- **Factory Pattern**: `shikiCode()` factory function provides chainable configuration API
- **Plugin System**: Functional plugins returning cleanup functions, supporting dynamic addition and removal
- **Style Isolation**: Avoids style conflicts through hash values, dynamic CSS rule injection

## 🚀 Installation and Usage

### Package Dependencies

In the Zepid project, shikicode is used as an internal package:

```json
{
  "name": "@libra/shikicode",
  "version": "0.0.0",
  "devDependencies": {
    "shiki": "^3.7.0"
  }
}
```

### Basic Usage

```typescript
import { createHighlighter } from 'shiki'
import { shikiCode } from '@libra/shikicode'

// Create highlighter instance
const highlighter = await createHighlighter({
    langs: ['javascript', 'typescript'],
    themes: ['github-dark', 'github-light']
})

// Create editor instance
const editor = shikiCode()
    .withOptions({
        lineNumbers: 'on',     // Show line numbers
        readOnly: false,       // Editable
        tabSize: 4,           // Tab size of 4 spaces
        insertSpaces: true    // Use spaces instead of tab characters
    })
    .create(containerElement, highlighter, {
        value: 'console.log("Hello, ShikiCode!")',
        language: 'javascript',
        theme: 'github-dark'
    })

// Get and set content
console.log(editor.value) // Get current code
editor.value = 'const message = "New code"' // Set new code and re-render
```

### Advanced Configuration

```typescript
import { shikiCode } from '@libra/shikicode'
import {
    autoload,
    hookClosingPairs,
    hookTab,
    comments
} from '@libra/shikicode/plugins'

const editor = shikiCode()
    .withOptions({
        lineNumbers: 'on',
        readOnly: false,
        tabSize: 4,
        insertSpaces: true
    })
    .withPlugins(
        // Auto-load missing languages and themes
        autoload,
        // Auto-close brackets (uses default rules with no parameters)
        hookClosingPairs(),
        // Tab indentation support, smart Enter newlines
        hookTab,
        // Comment toggling (Ctrl/Cmd + /)
        comments({
            language: 'typescript',
            lineComment: '//',
            blockComment: ['/*', '*/'],
            insertSpace: true
        })
    )
    .create(container, highlighter, {
        value: initialCode,
        language: 'typescript',
        theme: 'github-dark'
    })

// Dynamically update options
editor.updateOptions({
    theme: 'github-light',
    language: 'python'
})

// Dynamically add plugins
editor.addPlugin(autoload)

// Clean up editor
editor.dispose()
```

## 🧩 Plugin System

### Built-in Plugins

#### 1. AutoLoad Plugin (`autoload`)
Auto-loads missing languages and themes, converting `updateOptions` to an async method:

```typescript
import { autoload } from '@libra/shikicode/plugins'

editor.addPlugin(autoload)

// Now updateOptions is async
await editor.updateOptions({
    language: 'rust',  // Auto-load rust language
    theme: 'monokai'   // Auto-load monokai theme
})
```

#### 2. Bracket Auto-closing Plugin (`hookClosingPairs`)
Supports bracket and quote auto-closing for multiple languages:

```typescript
import { hookClosingPairs } from '@libra/shikicode/plugins'

// Use default configuration (supports all built-in language rules)
editor.addPlugin(hookClosingPairs())

// Custom language rules
editor.addPlugin(hookClosingPairs({
    language: 'javascript',
    pairs: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
        ['"', '"'],
        ["'", "'"],
        ['`', '`']
    ]
}))
```

**Features:**
- Auto-insert closing bracket when typing opening bracket
- Wrap selected text with brackets
- Delete paired brackets on Backspace
- Skip existing closing bracket when typing

#### 3. Comment Toggle Plugin (`comments`)
Supports line and block comment toggling (Ctrl/Cmd + /):

```typescript
import { comments } from '@libra/shikicode/plugins'

editor.addPlugin(comments({
    language: 'typescript',
    lineComment: '//',
    blockComment: ['/*', '*/'],
    insertSpace: true // Insert space after comment symbol
}))
```

**Features:**
- Single line: Auto comment/uncomment current line
- Multiple lines: Batch comment/uncomment selected lines
- Smart space handling

#### 4. Tab Indentation Plugin (`hookTab`)
Smart Tab indentation and Enter newlines:

```typescript
import { hookTab } from '@libra/shikicode/plugins'

editor.addPlugin(hookTab)
```

**Features:**
- **Tab**: Smart indentation, batch indent when multiple lines selected
- **Shift+Tab**: Reduce indentation
- **Enter**: Smart newline, auto-inherit current line indentation
- **Backspace**: Smart delete to previous tab position on whitespace
- **Escape**: Blur editor
- Support auto-indent increase when creating newlines inside brackets

### Custom Plugin Development

Plugins are functions that receive editor instance and options, returning cleanup functions:

```typescript
import type { EditorPlugin, ShikiCode, EditorOptions } from '@libra/shikicode/plugins'

const myCustomPlugin: EditorPlugin = (editor: ShikiCode, options: EditorOptions) => {
    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'F1') {
            // Custom shortcut logic
            console.log('F1 pressed, current language:', options.language)
            console.log('Current value:', editor.value)
        }
    }

    // Bind event to input element
    editor.input.addEventListener('keydown', handleKeydown)

    // Must return cleanup function
    return () => {
        editor.input.removeEventListener('keydown', handleKeydown)
    }
}

// Use custom plugin
editor.addPlugin(myCustomPlugin)
```

**Plugin Development Points:**
- Receives `ShikiCode` instance and `EditorOptions` configuration
- Can access `editor.input` (textarea), `editor.output` (div), `editor.highlighter`
- Must return cleanup function to avoid memory leaks
- Can listen to keyboard events, input events, etc.
- Support accessing and modifying editor content

## 🎨 Themes and Styling

### Theme Switching

```typescript
// Dynamically switch theme (ensure theme is loaded)
editor.updateOptions({
    theme: 'github-light'
})

// Switch both language and theme
editor.updateOptions({
    language: 'python',
    theme: 'monokai'
})

// Auto-load when using autoload plugin
await editor.updateOptions({
    theme: 'material-theme-darker'  // Auto-load new theme
})
```

### CSS Variables System

The editor uses CSS custom properties for style management:

```css
/* Container-level variables */
.editor-container {
    --fg: #24292f;        /* Foreground color (text color) */
    --bg: #ffffff;        /* Background color */
    --tab-size: 4;        /* Tab size */
    --font-family: 'JetBrains Mono', monospace;
}

/* Custom input layer styling */
.shikicode.input {
    font-family: var(--font-family, monospace);
    font-size: 14px;
    line-height: 1.5;
    caret-color: var(--fg, black);
}

/* Custom line number styling */
.shikicode.output.line-numbers .line::before {
    color: #6b7280;
    background-color: var(--bg);
    width: 5em;
    padding-right: 2em;
}

/* Adjust line number area size */
.shikicode.input.line-numbers {
    padding-left: 5em;
}
```

## 📚 API Reference

### ShikiCode Interface

```typescript
interface ShikiCode {
    // DOM elements
    readonly input: HTMLTextAreaElement      // Transparent input layer
    readonly output: HTMLDivElement          // Syntax highlighting display layer
    readonly container: HTMLElement          // Container element

    // Highlighter instance
    readonly highlighter: Highlighter       // Shiki highlighter

    // Content management
    value: string                           // Get/set editor content
    forceRender(value?: string): void       // Force re-render

    // Configuration updates
    updateOptions(options: UpdateOptions): void

    // Plugin management
    addPlugin(plugin: EditorPlugin): void   // Dynamically add plugin

    // Destroy editor
    dispose(): void                         // Clean up resources and event listeners
}
```

### Factory Function Interface

```typescript
interface ShikiCodeFactory {
    create(domElement: HTMLElement, highlighter: Highlighter, options: InitOptions): ShikiCode
    withOptions(options: UpdateOptions): ShikiCodeFactory
    withPlugins(...plugins: readonly EditorPlugin[]): ShikiCodeFactory
}

// Factory function
function shikiCode(): ShikiCodeFactory
```

### Configuration Options

```typescript
interface EditorOptions extends IndentOptions {
    // Line number display
    lineNumbers: 'on' | 'off'

    // Read-only mode
    readOnly: boolean

    // Language setting (supports all Shiki languages + extensions)
    language: BundledLanguage | 'plaintext' | 'txt' | 'text' | 'plain' | (string & {})

    // Theme setting (supports all Shiki themes + 'none')
    theme: BundledTheme | 'none' | (string & {})
}

interface IndentOptions {
    // Tab size (default 4)
    tabSize: number

    // Use spaces instead of tab characters (default true)
    insertSpaces: boolean
}

// Initialization options
interface InitOptions extends Pick<EditorOptions, 'language' | 'theme'> {
    readonly value?: string
}

// Update options (all properties optional)
interface UpdateOptions extends Partial<EditorOptions> {}
```

## 🔧 Development Guide

### Local Development

In the Zepid project root directory:

```bash
# Install dependencies
bun install

# Build shikicode package
bun run build

# Run type checking
bun run typecheck

# Clean build artifacts
bun run clean
```

### Package Build

Build using tsup:

```bash
# In packages/shikicode directory
bun run build
```

Build configuration (`tsup.config.ts`):
- Output format: ESM
- Target: `lib/` directory
- Type definitions: Auto-generate `.d.ts` files
- Plugin system: Independently packaged as `plugins/` subdirectory

### Testing Editor

Open demo page:

```bash
# In packages/shikicode directory, start static server
python -m http.server 8000
# Or use bun
bun --bun vite

# Visit http://localhost:8000/index.html
```

### Extending Editor

#### Add New Language Support

```typescript
// Manually load new language
await editor.highlighter.loadLanguage('rust')
editor.updateOptions({ language: 'rust' })

// Use autoload plugin for automatic loading
editor.addPlugin(autoload)
await editor.updateOptions({ language: 'rust' })  // Auto-load
```

#### Add New Bracket Closing Rules

```typescript
import { hookClosingPairs } from '@libra/shikicode/plugins'

// Add bracket rules for custom language
editor.addPlugin(hookClosingPairs({
    language: 'my-language',
    pairs: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
        ['<', '>'],  // XML/HTML tags
        ['"', '"'],
        ["'", "'"]
    ]
}))
```

#### Create Custom Theme

```typescript
// Load custom theme object
await editor.highlighter.loadTheme({
    name: 'my-custom-theme',
    type: 'dark',
    colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#d4d4d4'
    },
    tokenColors: [
        {
            scope: ['comment'],
            settings: { foreground: '#6A9955' }
        }
    ]
})

editor.updateOptions({ theme: 'my-custom-theme' })
```

## 🎯 Problems Solved

### 1. High-quality Syntax Highlighting
- **Precise Syntax Parsing**: Based on TextMate syntax rules, completely consistent with VS Code
- **Complete Language Support**: Supports all Shiki built-in languages without additional configuration
- **Theme Consistency**: Fully compatible with VS Code themes, providing consistent visual experience

### 2. Web Platform Code Editing
- **Dual-layer Architecture**: Transparent input layer + highlighting display layer, solving browser editor technical challenges
- **Event Synchronization**: Precise input and scroll event synchronization mechanism
- **Framework Independent**: Pure DOM API implementation, integrable with any frontend technology stack

### 3. Extensibility and Customization
- **Plugin System**: Functional plugin architecture supporting custom editing behaviors
- **Type Safety**: Complete TypeScript type definitions and interfaces
- **CSS Variables**: Style system based on CSS custom properties

### 4. Performance Optimization
- **On-demand Loading**: Dynamic loading of languages and themes, reducing initial bundle size
- **Memory Management**: Complete disposal mechanism, avoiding memory leaks
- **Style Isolation**: Hashed styles, avoiding global style conflicts

## 📖 Related Resources

- **Shiki Official Documentation**: [https://shiki.style/](https://shiki.style/)
- **TextMate Syntax Specification**: [https://macromates.com/manual/en/language_grammars](https://macromates.com/manual/en/language_grammars)
- **VS Code Theme Development**: [https://code.visualstudio.com/api/extension-guides/color-theme](https://code.visualstudio.com/api/extension-guides/color-theme)
- **Original Inspiration Project**: [magic-akari/shikicode](https://github.com/magic-akari/shikicode)

## 🛠️ Internal Implementation Details

### Core File Descriptions

| File | Function | Main Exports |
|------|----------|--------------|
| `core.ts` | Core editor implementation | `shikiCode`, `ShikiCode`, `EditorOptions` |
| `scroll.ts` | Scroll synchronization | `hookScroll` |
| `style.ts` | Style injection | `injectStyle` |
| `plugins/index.ts` | Plugin type definitions | `EditorPlugin`, `IDisposable` |
| `plugins/autoload.ts` | Auto-loading | `autoload` |
| `plugins/closing_pairs.ts` | Bracket closing | `hookClosingPairs`, default language rules |
| `plugins/comments.ts` | Comment toggling | `comments` |
| `plugins/tab.ts` | Indentation management | `hookTab`, `indentText`, `outdentText` |
| `plugins/common.ts` | Utility functions | `setRangeText`, `visibleWidthFromLeft` |

### Build and Export

```json
{
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "default": "./lib/index.js"
    },
    "./plugins": {
      "types": "./lib/plugins/index.d.ts",
      "default": "./lib/plugins/index.js"
    }
  }
}
```
