# @libra/common

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive collection of shared utilities, types, and tools for the Zepid AI platform. This package provides essential building blocks for file manipulation, data processing, logging, error handling, and type safety across all Libra applications.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Core Modules](#-core-modules)
- [API Reference](#-api-reference)
- [Advanced Usage](#-advanced-usage)
- [Performance & Best Practices](#-performance--best-practices)
- [Troubleshooting](#-troubleshooting)
- [Testing](#-testing)
- [Contributing](#-contributing)

## 🚀 Features

- **📁 File System Utilities**: Complete file structure processing, tree building, and content mapping
- **📝 Type Definitions**: Comprehensive TypeScript types for files, messages, and data structures
- **🔧 Utility Functions**: Debouncing, deep merging, exponential smoothing, and Cloudflare Workers utilities
- **📊 Logging System**: Structured, centralized logging with component-specific loggers
- **🛡️ Error Handling**: Type-safe error handling with `tryCatch` utility and database error classification
- **💬 Message Types**: Extended message type definitions for chat, collaboration, and history features
- **🐙 GitHub Integration**: GitHub file structure validation and processing
- **🌐 CDN Integration**: Unified CDN URL management for frontend and backend environments
- **🗄️ Database Error Handling**: Comprehensive database error classification and user-friendly messaging
- **⚡ Performance**: Optimized utilities for production use with tree-shaking support

## 📦 Installation

> **Note**: This is an internal package within the Libra monorepo and is not published to npm.

### Within Libra Project

```bash
# Install dependencies in the monorepo root
bun install

# The package is automatically available as a workspace dependency
# Add to your package.json dependencies:
"@libra/common": "*"
```

### External Projects

If you want to use this package outside the Libra monorepo, you'll need to copy the source files and install the required dependencies:

```bash
# Core dependencies (if needed)
bun add resend@^4.7.0
bun add @trpc/client@^11.4.3 @trpc/server@^11.4.3

# Development dependencies
bun add -D typescript@latest
```

## 🚀 Quick Start

### Basic Usage

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

// Debounce a function
const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query)
}, 300)

// Merge objects deeply
const config = deepMerge(
  { api: { timeout: 5000 } },
  { api: { retries: 3 }, debug: true }
)

// Process file structures
const fileMap = createFileContentMap(fileStructure)

// Format utilities
const fileSize = formatBytes(1024 * 1024) // "1.00 MB"

// Retry with exponential backoff
const result = await retryWithBackoff(async () => {
  return await fetch('/api/data')
}, { maxRetries: 3, baseDelay: 1000 })

// Structured logging
logger.info('Application started', {
  component: 'APP',
  version: '1.0.0'
})

// Safe error handling
const [operationResult, error] = await tryCatch(async () => {
  return await someAsyncOperation()
})

if (error) {
  logger.error('Operation failed', { operation: 'someAsyncOperation' }, error)
}
```

## 🏗️ Architecture

### Package Structure

```text
@libra/common/
├── src/
│   ├── index.ts              # Main exports and public API
│   ├── utils.ts              # Core utility functions
│   ├── types.ts              # Base type definitions
│   ├── message-types.ts      # Extended message types
│   ├── history.ts            # History-related types
│   ├── logger.ts             # Centralized logging system
│   ├── error.ts              # Error handling utilities
│   ├── db-error-handler.ts   # Database error management
│   ├── cdn-utils.ts          # CDN URL management
│   ├── github.ts             # GitHub integration types
│   └── file.ts               # File system utilities
├── __tests__/                # Test files (to be added)
├── dist/                     # Built distribution files
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
└── tsup.config.ts            # Build configuration
```

### Core Design Principles

1. **Type Safety**: Comprehensive TypeScript types for all utilities and data structures
2. **Tree Shaking**: Modular exports to support optimal bundling
3. **Environment Agnostic**: Works in Node.js, browsers, and Cloudflare Workers
4. **Performance First**: Optimized utilities with minimal overhead
5. **Error Resilience**: Robust error handling with user-friendly messages
6. **Logging Consistency**: Structured logging across all Libra applications

### Module Dependencies

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

### Working with File Structures

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

// Build file map and tree structure
const { fileMap, treeContents } = buildFiles(fileStructure, initialMessages)

// Build file map only
const fileMap = buildFileMap(fileStructure)

// Get specific file content
const content = getFileContent(fileMap, 'src/components/Button.tsx')

// Convert to tree structure for UI
const treeNodes = convertToTreeStructure(fileStructure)

// Sort file explorer items
const sortedItems = sortFileExplorer(files)

// Type guards for file/directory checking
if (isFileType(data)) {
  console.log('File content:', data.content)
}

if (isDirectoryType(data)) {

}
```

### Advanced Logging

```typescript
import { logger, log, LogLevel } from '@libra/common'

// Basic logging with context
logger.info('Application started', {
  component: 'APP',
  version: '1.0.0'
})

logger.error('Operation failed', {
  operation: 'someAsyncOperation',
  userId: '123'
}, error)

// Component-specific logging
log.auth('info', 'User authenticated', { userId: '123' })
log.api('error', 'Request failed', { endpoint: '/api/users' }, error)
log.db('warn', 'Slow query detected', { query: 'SELECT * FROM users', duration: 2000 })

// Set log level dynamically
logger.setLogLevel(LogLevel.DEBUG)

// Check current log level
const currentLevel = logger.getLogLevel()
```

## 📚 API Reference

### File System Utilities

#### `buildFiles(fileStructure, initialMessages?)`

Builds both file map and tree contents from a file structure.

**Parameters:**

- `fileStructure: FileStructure` - The file structure to process
- `initialMessages?: any[]` - Optional initial messages for context

**Returns:** `{ fileMap: FileContentMap, treeContents: TreeNode[] }`

#### `buildFileMap(fileStructure)`

Creates a flat map of file paths to content.

**Parameters:**

- `fileStructure: FileStructure` - The file structure to process

**Returns:** `FileContentMap` - Map of file paths to content

#### `getFileContent(fileMap, filePath)`

Retrieves content for a specific file path.

**Parameters:**

- `fileMap: FileContentMap` - The file content map
- `filePath: string` - Path to the file

**Returns:** `string | undefined` - File content or undefined if not found

#### `convertToTreeStructure(fileStructure)`

Converts file structure to tree nodes for UI display.

**Parameters:**

- `fileStructure: FileStructure` - The file structure to convert

**Returns:** `TreeNode[]` - Array of tree nodes

### Utility Functions

#### `debounce<T>(func, wait)`

Creates a debounced version of the provided function.

**Parameters:**

- `func: T` - Function to debounce
- `wait: number` - Wait time in milliseconds

**Returns:** `T` - Debounced function

#### `deepMerge(target, source)`

Deeply merges two objects.

**Parameters:**

- `target: any` - Target object
- `source: any` - Source object to merge

**Returns:** `any` - Merged object

#### `retryWithBackoff(fn, options?)`

Retries a function with exponential backoff.

**Parameters:**

- `fn: () => Promise<T>` - Async function to retry
- `options?: { maxRetries?: number, baseDelay?: number, maxDelay?: number }`

**Returns:** `Promise<T>` - Result of the function

### Logging System

#### `logger.info(message, context?)`

Logs an info message with optional context.

**Parameters:**

- `message: string` - Log message
- `context?: LogContext` - Additional context data

#### `logger.error(message, context?, error?)`

Logs an error message with optional context and error object.

**Parameters:**

- `message: string` - Log message
- `context?: LogContext` - Additional context data
- `error?: Error` - Error object

#### `log.{component}(level, message, context?, error?)`

Component-specific logging methods.

**Available components:** `auth`, `api`, `db`, `ui`, `worker`

### Error Handling

#### `tryCatch<T>(fn)`

Safely executes an async function and returns a tuple result.

**Parameters:**

- `fn: () => Promise<T>` - Async function to execute

**Returns:** `Promise<[T | null, Error | null]>` - Tuple of [result, error]

### CDN Utilities

#### `getCdnUrl(path)`

Gets a CDN URL for any path.

**Parameters:**

- `path: string` - Path to the resource

**Returns:** `string` - Full CDN URL

#### `getCdnImageUrl(key)`

Gets a CDN URL for an image.

**Parameters:**

- `key: string` - Image key

**Returns:** `string` - Full image URL

## 📚 Core Modules

### 🔧 Utilities (`utils.ts`)

- **File Processing**: `buildFiles`, `buildFileMap`, `createFileContentMap`, `getFileContent`
- **Tree Operations**: `convertToTreeStructure`, `sortFileExplorer`
- **General Utils**: `debounce`, `deepMerge`, `exponentialSmoothing`
- **Type Guards**: `isFileType`, `isDirectoryType`
- **Cloudflare Workers Utils**: `getRequestId`, `sleep`, `safeJsonParse`, `safeJsonStringify`
- **Formatting Utils**: `formatBytes`, `formatDuration`, `truncateString`
- **Environment Utils**: `isDevelopment`, `isProduction`, `getEnvironment`
- **Validation Utils**: `isValidUrl`, `validateIdentifier`, `sanitizeIdentifier`, `isValidCustomDomain`
- **Retry Utils**: `retryWithBackoff`

### 📝 Types (`types.ts`, `message-types.ts`, `history.ts`)

- **File Types**: `FileType`, `TFile`, `TFolder`, `TTab`, `FileContentMap`
- **Tree Types**: `TreeNode`, `FileStructure`, `DirectoryEntry`, `FileEntry`, `FileOrDirEntry`
- **Message Types**: `UserMessageType`, `CommandMessageType`, `DiffMessageType`, `PlanMessageType`
- **Extended Types**: `ThinkingMessageType`, `ScreenshotMessageType`, `TimingMessageType`
- **History Types**: `HistoryType`, `FileDiffType`, `ContentType`

### 📊 Logging (`logger.ts`)

- **Structured Logging**: Centralized logging with context support and singleton pattern
- **Component Loggers**: Pre-configured loggers for different components via `log` object
- **Log Levels**: Debug, Info, Warn, Error with environment-based filtering
- **Dynamic Configuration**: Runtime log level adjustment with `setLogLevel`
- **Context Support**: Rich context objects with component, operation, user tracking

### 🛡️ Error Handling (`error.ts`)

- **Type-Safe Errors**: `tryCatch` function for safe async operations
- **Result Types**: Tuple pattern returning `[result, error]` for safe error handling

### 🗄️ Database Error Handling (`db-error-handler.ts`)

- **Error Classification**: `DatabaseErrorType` enum for categorizing database errors
- **User-Friendly Messages**: `DB_ERROR_MESSAGES` with localized error descriptions
- **Error Transformation**: `transformDatabaseError`, `classifyDatabaseError` utilities
- **Type Guards**: `isDatabaseError` for runtime error type checking
- **Wrapper Functions**: `withDatabaseErrorHandling` for automatic error processing

### 🌐 CDN Integration (`cdn-utils.ts`)

- **Unified URL Management**: Cross-environment CDN URL handling for frontend/backend
- **Multiple URL Types**: Image, file, upload, screenshot, and static asset URLs
- **Environment Detection**: Automatic detection of Next.js vs backend environments
- **CDN Utils Class**: Object-oriented interface with `getCdnUrl`, `getCdnImageUrl`, etc.
- **Functional Interface**: Direct function exports for simple usage

### 🐙 GitHub Integration (`github.ts`)

- **Schema Validation**: Zod schemas for GitHub file structures
- **Type Definitions**: `GitHubFileNode`, `GithubNodeBase` for GitHub API integration

## � Advanced Usage Examples

### CDN Integration

```typescript
import {
  getCdnUrl,
  getCdnImageUrl,
  getCdnFileUrl,
  CDNUtils
} from '@libra/common'

// Direct function usage
const imageUrl = getCdnImageUrl('profile-pic.jpg')
const fileUrl = getCdnFileUrl('documents/report.pdf')
const uploadUrl = getCdnUploadUrl('temp/upload.zip')

// Class-based usage
const cdn = new CDNUtils()
const screenshotUrl = cdn.getCdnScreenshotUrl('screenshot-123.png')
const staticAssetUrl = cdn.getCdnStaticAssetUrl('css/styles.css')
```

### Database Error Handling

```typescript
import {
  withDatabaseErrorHandling,
  classifyDatabaseError,
  isDatabaseError,
  DatabaseErrorType
} from '@libra/common'

// Automatic error handling wrapper
const safeDbOperation = withDatabaseErrorHandling(async () => {
  return await db.user.findMany()
})

const [users, error] = await safeDbOperation()

if (error) {
  console.log('User-friendly message:', error.userMessage)
  console.log('Error type:', error.type)
}

// Manual error classification
try {
  await db.query('SELECT * FROM users')
} catch (err) {
  if (isDatabaseError(err)) {
    const errorType = classifyDatabaseError(err)
    console.log('Classified as:', errorType)
  }
}
```

### Cloudflare Workers Utilities

```typescript
import {
  getRequestId,
  sleep,
  safeJsonParse,
  retryWithBackoff,
  validateIdentifier
} from '@libra/common'

// Generate unique request ID
const requestId = getRequestId()

// Safe JSON parsing
const [data, parseError] = safeJsonParse(jsonString)

// Retry with exponential backoff
const result = await retryWithBackoff(
  async () => fetch('/api/unstable-endpoint'),
  { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
)

// Validate identifiers
if (validateIdentifier(userInput)) {
  // Safe to use as identifier
}
```

## 🔧 Advanced Usage

### Environment-Specific Utilities

```typescript
import {
  isDevelopment,
  isProduction,
  getEnvironment,
  getRequestId
} from '@libra/common'

// Environment detection
if (isDevelopment()) {
  logger.setLogLevel(LogLevel.DEBUG)
}

// Request tracking in Cloudflare Workers
const requestId = getRequestId()
logger.info('Processing request', { requestId })

// Environment-based configuration
const config = {
  logLevel: isDevelopment() ? 'debug' : 'info',
  enableMetrics: isProduction(),
  environment: getEnvironment()
}
```

### Advanced File Processing

```typescript
import {
  buildFiles,
  sortFileExplorer,
  isFileType,
  isDirectoryType,
  validateIdentifier,
  sanitizeIdentifier
} from '@libra/common'

// Process large file structures efficiently
const processFileStructure = async (structure: FileStructure) => {
  const { fileMap, treeContents } = buildFiles(structure)

  // Sort for optimal display
  const sortedFiles = sortFileExplorer(treeContents)

  // Process files with type safety
  for (const item of sortedFiles) {
    if (isFileType(item)) {
      // Handle file
      const content = item.content
      console.log(`Processing file: ${item.name}`)
    } else if (isDirectoryType(item)) {
      // Handle directory
      const children = Object.keys(item.children)
      console.log(`Processing directory: ${item.name} with ${children.length} items`)
    }
  }

  return { fileMap, sortedFiles }
}

// Safe identifier handling
const createSafeIdentifier = (userInput: string) => {
  if (validateIdentifier(userInput)) {
    return userInput
  }
  return sanitizeIdentifier(userInput)
}
```

### Robust Error Handling Patterns

```typescript
import {
  tryCatch,
  withDatabaseErrorHandling,
  DatabaseErrorType,
  logger
} from '@libra/common'

// Nested error handling
const complexOperation = async () => {
  const [dbResult, dbError] = await tryCatch(
    withDatabaseErrorHandling(async () => {
      return await database.complexQuery()
    })
  )

  if (dbError) {
    logger.error('Database operation failed', {
      operation: 'complexQuery',
      errorType: dbError.type,
      isRetryable: dbError.isRetryable
    }, dbError)

    if (dbError.isRetryable) {
      // Implement retry logic
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

## 📊 Performance & Best Practices

### Memory Management

- **Tree Shaking**: Import only what you need to minimize bundle size
- **Lazy Loading**: Use dynamic imports for large utilities when possible
- **Memory Leaks**: Always clear timeouts and intervals created by `debounce`

```typescript
// Good: Import specific functions
import { debounce, logger } from '@libra/common'

// Avoid: Importing everything
// import * as common from '@libra/common'

// Good: Clear debounced functions when component unmounts
const debouncedFn = debounce(myFunction, 300)
// In cleanup: debouncedFn.cancel?.() if available
```

### Error Handling Best Practices

- **Always use `tryCatch`** for async operations that might fail
- **Classify database errors** using the built-in error handling
- **Log with context** to make debugging easier
- **Handle retryable errors** appropriately

```typescript
// Good: Comprehensive error handling
const [result, error] = await tryCatch(async () => {
  return await riskyOperation()
})

if (error) {
  logger.error('Operation failed', {
    operation: 'riskyOperation',
    userId: currentUser.id
  }, error)

  // Handle error appropriately
  return { success: false, error: error.message }
}

// Good: Database error handling
const safeDbOperation = withDatabaseErrorHandling(async () => {
  return await db.query('SELECT * FROM users')
})
```

### Logging Best Practices

- **Use appropriate log levels** (DEBUG for development, INFO for production)
- **Include relevant context** in all log messages
- **Use component-specific loggers** for better organization
- **Avoid logging sensitive information**

```typescript
// Good: Structured logging with context
logger.info('User action completed', {
  component: 'USER_MANAGEMENT',
  action: 'UPDATE_PROFILE',
  userId: user.id,
  duration: Date.now() - startTime
})

// Good: Component-specific logging
log.auth('info', 'User authenticated', { userId: user.id })
log.api('error', 'Request failed', { endpoint: '/api/users' }, error)

// Avoid: Logging sensitive data
// logger.info('User login', { password: user.password }) // DON'T DO THIS
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Import Errors

**Problem:** Cannot resolve module '@libra/common'

**Solution:**

```bash
# Ensure you're in the Libra monorepo
cd /path/to/libra

# Install dependencies
bun install

# Check package.json includes the dependency
"@libra/common": "*"
```

#### 2. TypeScript Errors

**Problem:** Type definitions not found

**Solution:**

```typescript
// Ensure proper imports
import type { FileType, TFile, LogContext } from '@libra/common'
import { logger, tryCatch, buildFiles } from '@libra/common'

// Check tsconfig.json includes proper paths
{
  "compilerOptions": {
    "paths": {
      "@libra/common": ["./packages/common/src"]
    }
  }
}
```

#### 3. Logger Not Working

**Problem:** Log messages not appearing

**Solution:**

```typescript
import { logger, LogLevel } from '@libra/common'

// Set appropriate log level
logger.setLogLevel(LogLevel.DEBUG)

// Check environment variables
process.env.LOG_LEVEL = 'debug'
process.env.NODE_ENV = 'development'
```

#### 4. CDN URLs Not Working

**Problem:** CDN URLs returning 404 or incorrect URLs

**Solution:**

```typescript
// Check environment variables
process.env.NEXT_PUBLIC_CDN_URL = 'https://your-cdn-domain.com'
process.env.CDN_URL = 'https://your-cdn-domain.com'

// Verify CDN service is running
import { getCdnUrl } from '@libra/common'
console.log('CDN Base URL:', getCdnUrl(''))
```

## 🧪 Testing

### Unit Testing

Currently, the package doesn't include tests, but here's how you should test the utilities:

```typescript
// Example test structure
import { debounce, deepMerge, tryCatch } from '@libra/common'

describe('@libra/common utilities', () => {
  test('debounce should delay function execution', async () => {
    let callCount = 0
    const debouncedFn = debounce(() => callCount++, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    expect(callCount).toBe(0)

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(callCount).toBe(1)
  })

  test('deepMerge should merge objects recursively', () => {
    const target = { a: { b: 1 } }
    const source = { a: { c: 2 }, d: 3 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: { b: 1, c: 2 }, d: 3 })
  })

  test('tryCatch should handle errors safely', async () => {
    const [result, error] = await tryCatch(async () => {
      throw new Error('Test error')
    })

    expect(result).toBeNull()
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('Test error')
  })
})
```

### Integration Testing

```typescript
// Test with actual file structures
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

## 🔗 Related Packages

- [`@libra/auth`](../auth/README.md) - Authentication and authorization
- [`@libra/api`](../api/README.md) - tRPC API definitions
- [`@libra/ui`](../ui/README.md) - UI components and design system
- [`@libra/db`](../db/README.md) - Database schemas and utilities

## 📖 Documentation

For detailed API reference and usage examples, please refer to the source code and TypeScript definitions. The package is fully typed and provides comprehensive IntelliSense support.

## 🤝 Contributing

This package is part of the Zepid AI platform. Please refer to the main repository's contributing guidelines.

## 📄 License

AGPL-3.0-only - See LICENSE file for details.