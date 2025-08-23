# @libra/middleware

Shared middleware package for Zepid applications, providing consistent middleware implementations across all services.

## Features

- **CORS Middleware**: Environment-aware CORS configuration
- **Error Handling**: Structured error responses with proper logging
- **Logging**: Request/response logging with performance monitoring
- **Rate Limiting**: Cloudflare Workers native rate limiting for distributed, persistent rate limiting
- **Authentication**: JWT and API key authentication support
- **Type Safety**: Full TypeScript support with shared types

## Installation

```bash
bun add @libra/middleware
```

## Quick Start

### Using Middleware Presets

```typescript
import { Hono } from 'hono'
import { MiddlewarePresets, createCloudflareRateLimitMiddlewareFromEnv } from '@libra/middleware'

const app = new Hono()

// Use API service preset (includes auth, CORS, logging)
const middleware = MiddlewarePresets.api('my-service')

app.use('*', middleware.requestId)
app.onError(middleware.errorHandler)
app.use('*', middleware.cors)
app.use('*', middleware.logging)
app.use('/api/*', middleware.auth!)

// Add rate limiting separately
app.use('/api/*', createCloudflareRateLimitMiddlewareFromEnv())
```

### Custom Middleware Stack

```typescript
import {
  createCorsMiddleware,
  createErrorHandler,
  createLoggingMiddleware,
  createAuthMiddleware,
  createCloudflareRateLimitMiddlewareFromEnv,
} from '@libra/middleware'

const app = new Hono()

// Error handling
app.onError(createErrorHandler('my-service'))

// CORS
app.use('*', createCorsMiddleware({
  allowedOrigins: ['https://myapp.com'],
  credentials: true,
}))

// Logging
app.use('*', createLoggingMiddleware({
  service: 'my-service',
  level: 'info',
}))

// Authentication
app.use('/protected/*', createAuthMiddleware({
  required: true,
  skipPaths: ['/health'],
}))

// Rate limiting (Cloudflare Workers native)
app.use('/api/*', createCloudflareRateLimitMiddlewareFromEnv({
  message: 'API rate limit exceeded',
  retryAfterSeconds: 60,
}))
```

## Available Middleware

### CORS Middleware

```typescript
import { createCorsMiddleware, createPublicCorsMiddleware } from '@libra/middleware'

// Environment-aware CORS
app.use('*', createCorsMiddleware())

// Public CORS (allows all origins)
app.use('/public/*', createPublicCorsMiddleware())
```

### Error Handling

```typescript
import { createErrorHandler, CommonErrors, LibraError } from '@libra/middleware'

// Global error handler
app.onError(createErrorHandler('my-service'))

// Throw structured errors
throw CommonErrors.unauthorized('Invalid token')
throw new LibraError(400, 'CUSTOM_ERROR', 'Custom error message')
```

### Logging

```typescript
import { createLoggingMiddleware, createLogger } from '@libra/middleware'

// Request/response logging
app.use('*', createLoggingMiddleware({
  service: 'my-service',
  level: 'info',
  excludePaths: ['/health'],
}))

// Application logging
const logger = createLogger('my-service')
logger.info('Something happened', { userId: '123' })
```

### Rate Limiting

#### Cloudflare Workers Native Rate Limiting

This middleware package is optimized for Cloudflare Workers and uses the native rate limiting API for distributed, persistent rate limiting across all Worker instances:

```typescript
import {
  createCloudflareRateLimitMiddlewareFromEnv,
  createCloudflareUserRateLimitMiddleware,
  createCloudflareUploadRateLimitMiddleware,
  CloudflareRateLimitPresets
} from '@libra/middleware'

// General rate limiting using RATE_LIMITER binding
app.use('/api/*', createCloudflareRateLimitMiddlewareFromEnv({
  message: 'API rate limit exceeded',
  retryAfterSeconds: 60
}))

// User-specific rate limiting using USER_RATE_LIMITER binding
app.use('/user/*', createCloudflareUserRateLimitMiddleware(
  CloudflareRateLimitPresets.moderate
))

// Upload-specific rate limiting using UPLOAD_RATE_LIMITER binding
app.use('/upload/*', createCloudflareUploadRateLimitMiddleware(
  CloudflareRateLimitPresets.upload
))
```

**Configuring Cloudflare Rate Limiting Bindings:**

Add rate limiting bindings to your `wrangler.toml`:

```toml
[[unsafe.bindings]]
name = "RATE_LIMITER"
type = "ratelimit"
namespace_id = "1001"
simple = { limit = 100, period = 60 }

[[unsafe.bindings]]
name = "USER_RATE_LIMITER"
type = "ratelimit"
namespace_id = "1002"
simple = { limit = 1000, period = 60 }

[[unsafe.bindings]]
name = "UPLOAD_RATE_LIMITER"
type = "ratelimit"
namespace_id = "1003"
simple = { limit = 10, period = 60 }
```

## Migration from Memory-based Rate Limiting

If you were previously using memory-based rate limiting functions, please migrate to Cloudflare Workers native rate limiting:

**Old (Removed):**
```typescript
// These functions have been removed
createRateLimitMiddleware()
createUserRateLimitMiddleware()
createEndpointRateLimitMiddleware()
RateLimitPresets
```

**New (Recommended):**
```typescript
// Use Cloudflare Workers native rate limiting
createCloudflareRateLimitMiddlewareFromEnv()
createCloudflareUserRateLimitMiddleware()
createCloudflareEndpointRateLimitMiddleware()
CloudflareRateLimitPresets
```

Configure rate limiting bindings in your `wrangler.toml` as shown above.

### Authentication

```typescript
import { 
  createAuthMiddleware, 
  createOptionalAuthMiddleware,
  AuthUtils 
} from '@libra/middleware'

// Required authentication
app.use('/protected/*', createAuthMiddleware({
  required: true,
  skipPaths: ['/health'],
}))

// Optional authentication
app.use('*', createOptionalAuthMiddleware())

// Use auth utilities in handlers
app.get('/profile', (c) => {
  const user = AuthUtils.requireAuth(c)
  return c.json({ userId: user.userId })
})
```

## Middleware Presets

Pre-configured middleware stacks for common use cases:

- **`MiddlewarePresets.api`**: Full stack for API services (CORS, logging, auth)
- **`MiddlewarePresets.cdn`**: Optimized for CDN/static content
- **`MiddlewarePresets.dispatcher`**: Optimized for request routing
- **`MiddlewarePresets.deploy`**: Authenticated service for deployments
- **`MiddlewarePresets.public`**: Basic stack for public services

**Note**: Rate limiting is not included in presets. Use Cloudflare rate limiting middleware separately:

```typescript
const middleware = MiddlewarePresets.api('my-service')

app.use('*', middleware.requestId)
app.onError(middleware.errorHandler)
app.use('*', middleware.cors)
app.use('*', middleware.logging)
app.use('/api/*', middleware.auth!)

// Add rate limiting separately
app.use('/api/*', createCloudflareRateLimitMiddlewareFromEnv())
```

## Environment Configuration

Middleware automatically adapts to environment:

```bash
# Development
ENVIRONMENT=development
LOG_LEVEL=debug

# Production
ENVIRONMENT=production
LOG_LEVEL=info
```

## Error Codes

Standard error codes across all services:

```typescript
import { CommonErrorCodes } from '@libra/middleware'

// Client errors (4xx)
CommonErrorCodes.INVALID_REQUEST
CommonErrorCodes.UNAUTHORIZED
CommonErrorCodes.FORBIDDEN
CommonErrorCodes.NOT_FOUND
CommonErrorCodes.VALIDATION_ERROR
CommonErrorCodes.RATE_LIMITED

// Server errors (5xx)
CommonErrorCodes.INTERNAL_ERROR
CommonErrorCodes.SERVICE_UNAVAILABLE
CommonErrorCodes.DATABASE_ERROR
```

## Type Definitions

```typescript
import type {
  BaseContext,
  UserSession,
  ErrorResponse,
  CorsConfig,
  CloudflareRateLimitConfig
} from '@libra/middleware'

// Use in your handlers
function myHandler(c: BaseContext) {
  const user: UserSession | null = c.get('userSession')
  // ...
}
```

## Best Practices

1. **Always use request ID middleware first**
2. **Set up error handling early in the middleware stack**
3. **Use environment-specific configurations**
4. **Leverage presets for consistency**
5. **Use structured errors with proper codes**
6. **Use Cloudflare Workers native rate limiting for distributed, persistent rate limiting**
7. **Configure rate limiting bindings in wrangler.toml for proper rate limit management**

## License

AGPL-3.0
