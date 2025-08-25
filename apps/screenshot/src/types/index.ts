/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * index.ts
 * Copyright (C) 2025 Nextify Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * Cloudflare Workers environment bindings for Screenshot Service
 * @description Contains all the bindings available in the Cloudflare Workers environment
 */
export interface Bindings {
  // Core Cloudflare bindings
  DATABASE?: D1Database
  HYPERDRIVE?: Hyperdrive
  KV?: KVNamespace

  // Queue bindings
  SCREENSHOT_QUEUE: Queue<import('./queue').ScreenshotQueueMessage>
  SCREENSHOT_DLQ: Queue<import('./queue').ScreenshotQueueMessage>

  // R2 Storage bindings
  SCREENSHOT_LOGS: R2Bucket
  SCREENSHOT_ARTIFACTS: R2Bucket

  // Rate limiting bindings (optional)
  SCREENSHOT_RATE_LIMITER?: any

  // Cloudflare API credentials
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ZONE_ID: string

  // Authentication configuration
  BETTER_GITHUB_CLIENT_ID: string
  BETTER_GITHUB_CLIENT_SECRET: string

  // Database configuration
  DATABASE_ID: string
  POSTGRES_URL: string

  // Sandbox providers
  E2B_API_KEY: string
  DAYTONA_API_KEY: string
  NEXT_PUBLIC_SANDBOX_BUILDER_DEFAULT_PROVIDER: string

  // Application URLs
  NEXT_PUBLIC_DISPATCHER_URL: string

  // Queue configuration
  SCREENSHOT_QUEUE_NAME: string
  SCREENSHOT_DLQ_NAME: string
  MAX_SCREENSHOT_TIMEOUT: string
  MAX_CONCURRENT_SCREENSHOTS: string

  // Environment configuration
  ENVIRONMENT: string
  LOG_LEVEL: string
  NODE_ENV: string
}

/**
 * Variables available in the request context
 */
export interface Variables {
  /** User session information */
  userSession?: any
  /** Request ID for tracking */
  requestId: string
  /** Organization context */
  organizationId?: string
  /** User context */
  userId?: string
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string
  timestamp: string
  service?: string
  version?: string
  queues?: {
    screenshot: {
      status: string
      backlog?: number
    }
    dlq: {
      status: string
      backlog?: number
    }
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false
  error: string
  message: string
  details?: any
  requestId?: string
}

/**
 * Success response format
 */
export interface SuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  requestId?: string
}

/**
 * API response format (union of success and error)
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

// Re-export types from other modules
export type {
  ScreenshotQueueMessage,
  ScreenshotQueueBatch,
  ScreenshotQueueMessageMetadata,
  ScreenshotQueueProcessingResult,
  ScreenshotQueueBatchResult,
  ScreenshotQueueProducerOptions,
  ScreenshotQueueParams,
  ScreenshotDLQMessage
} from './queue'

export type {
  ScreenshotParams,
  ScreenshotStatus,
  ScreenshotResult,
  ScreenshotContext,
  ScreenshotStepResult,
  ValidationResult,
  SandboxResult,
  SyncResult,
  PreviewResult,
  CaptureResult,
  StorageResult,
  CleanupResult,
  ScreenshotRequest,
  ScreenshotResponse,
  ScreenshotStatusResponse,
  ScreenshotStepFunction,
  BaseStepResult
} from './screenshot'

/**
 * Logger interface (imported from utils)
 */
export interface Logger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any, error?: Error): void
}

/**
 * Common utility types
 */
export type Awaitable<T> = T | Promise<T>
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
  isDevelopment: boolean
  isProduction: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxTimeout: number
  maxConcurrency: number
}

/**
 * Service metadata
 */
export interface ServiceMetadata {
  name: string
  version: string
  description: string
  architecture: string
  timestamp: string
}
