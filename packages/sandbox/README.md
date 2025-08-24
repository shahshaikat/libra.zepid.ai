# @libra/sandbox

A unified sandbox abstraction layer for Zepid AI, supporting multiple sandbox providers (E2B, Daytona) with a consistent interface.

## Features

- **Multi-Provider Support**: Seamlessly switch between E2B and Daytona sandbox providers
- **Type-Safe Interface**: Full TypeScript support with comprehensive type definitions
- **Factory Pattern**: Easy provider instantiation and management
- **Configuration Management**: Environment-based and programmatic configuration
- **Retry Logic**: Built-in retry mechanisms with exponential backoff
- **File Operations**: Batch file operations with error handling
- **Command Execution**: Secure command execution with validation
- **Health Monitoring**: Sandbox health checks and readiness detection

## Installation

```bash
# This package is part of the Zepid monorepo
# Install dependencies
bun install
```

## Quick Start

### Basic Usage

```typescript
import { 
  initializeSandboxFactory, 
  createSandbox,
  createConfigFromEnvironment 
} from '@libra/sandbox';

// Initialize the factory with environment-based configuration
const config = createConfigFromEnvironment();
await initializeSandboxFactory(config);

// Create a sandbox
const sandbox = await createSandbox({
  provider: 'e2b',
  template: 'vite-shadcn-template-zepid',
  timeoutMs: 10 * 60_000,
  env: {
    NODE_ENV: 'development'
  }
});

// Execute commands
const result = await sandbox.executeCommand('npm install');
console.log(result.stdout);

// Write files
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

// Clean up
await sandbox.terminate();
```

### Advanced Configuration

```typescript
import { 
  SandboxFactory,
  createConfigBuilder,
  E2BSandboxProvider,
  DaytonaSandboxProvider 
} from '@libra/sandbox';

// Create custom configuration
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

// Initialize factory
const factory = new SandboxFactory(config);
await factory.initialize();

// Use specific provider
const e2bSandbox = await factory.createSandbox({
  provider: 'e2b',
  template: 'vite-shadcn-template-zepid'
});

const daytonaSandbox = await factory.createSandbox({
  provider: 'daytona',
  template: 'my-daytona-template'
});
```

### Provider Switching

```typescript
import { getSandboxFactory } from '@libra/sandbox';

const factory = getSandboxFactory();

// Switch default provider at runtime
factory.setDefaultProvider('daytona');

// Create sandbox with new default
const sandbox = await factory.createSandbox({
  template: 'my-template'
  // Will use Daytona provider
});
```

## Configuration

### Environment Variables

```bash
# Default provider
NEXT_PUBLIC_SANDBOX_DEFAULT_PROVIDER=e2b

# E2B Configuration
E2B_API_KEY=your-e2b-api-key
E2B_TIMEOUT=30000
E2B_RETRIES=3

# Daytona Configuration
DAYTONA_API_KEY=your-daytona-api-key
DAYTONA_API_URL=https://api.daytona.io
DAYTONA_TIMEOUT=45000
DAYTONA_RETRIES=3
```

### Programmatic Configuration

```typescript
import { createConfigBuilder } from '@libra/sandbox';

const config = createConfigBuilder()
  .setDefaultProvider('e2b')
  .addE2BProvider({
    type: 'e2b',
    apiKey: 'your-api-key',
    timeout: 30_000
  })
  .fromEnvironment() // Merge with environment variables
  .build();
```

## API Reference

### Core Interfaces

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

### Factory Methods

```typescript
// Initialize global factory
await initializeSandboxFactory(config);

// Get global factory instance
const factory = getSandboxFactory();

// Convenience methods
const sandbox = await createSandbox(options);
const sandbox = await connectToSandbox(sandboxId, providerType);
const sandbox = await resumeSandbox(sandboxId, providerType);
```

### Utility Functions

```typescript
// Retry with backoff
await retryWithBackoff(operation, retryConfig);

// Execute command with retry
await executeCommandWithRetry(sandbox, command, options);

// Write files with retry and batching
await writeFilesWithRetry(sandbox, files, batchSize);

// Health checks
const isHealthy = await checkSandboxHealth(sandbox);
await waitForSandboxReady(sandbox, timeoutMs);

// Security utilities
const safePath = sanitizeFilePath(userPath);
validateCommand(userCommand);
```

## Provider-Specific Features

### E2B Provider

- Based on E2B SDK
- Supports all E2B templates
- Automatic connection recovery
- Built-in file operations
- Command execution with streaming

### Daytona Provider

- REST API based integration
- Workspace management
- Custom template support
- Environment variable management
- File upload/download operations

**Note**: Daytona provider implementation is currently a template and needs to be completed based on Daytona's actual API.

## Migration Guide

### From Direct E2B Usage

**Before:**
```typescript
import Sandbox from 'e2b';

const container = await Sandbox.create('template-id');
await container.files.write([{ path: 'file.txt', data: 'content' }]);
const result = await container.commands.run('npm install');
await container.kill();
```

**After:**
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

### Gradual Migration

You can still access the native provider instance for advanced operations:

```typescript
const sandbox = await createSandbox({ provider: 'e2b', template: 'my-template' });

// Use abstracted interface
await sandbox.writeFile({ path: 'file.txt', content: 'content' });

// Access native E2B instance for advanced features
const e2bContainer = sandbox.getNativeInstance();
await e2bContainer.someAdvancedE2BFeature();
```

## Error Handling

```typescript
import { SandboxError, SandboxErrorType } from '@libra/sandbox';

try {
  const sandbox = await createSandbox(config);
} catch (error) {
  if (error instanceof SandboxError) {
    switch (error.type) {
      case SandboxErrorType.CREATION_FAILED:
        console.error('Failed to create sandbox:', error.message);
        break;
      case SandboxErrorType.CONFIGURATION_ERROR:
        console.error('Configuration error:', error.message);
        break;
      default:
        console.error('Sandbox error:', error.message);
    }
  }
}
```

## Development

```bash
# Build the package
bun run build

# Run type checking
bun run typecheck

# Format and lint
bun run format-and-lint:fix
```

## License

AGPL-3.0-only - See LICENSE file for details.
