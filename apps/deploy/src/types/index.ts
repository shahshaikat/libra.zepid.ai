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

import type { Context } from 'hono'
import type { betterAuth } from 'better-auth'

// Rate limiting binding interface (imported from middleware)
export interface RateLimitBinding {
  limit: (options: { key: string }) => Promise<{ success: boolean }>
}

/**
 * Cloudflare Workers environment bindings for Deploy V2 service
 * @description Contains all the bindings available in the Cloudflare Workers environment
 */
export interface Bindings {
  // Core Cloudflare bindings
  DATABASE?: D1Database
  HYPERDRIVE?: Hyperdrive
  KV?: KVNamespace

  // Queue bindings
  DEPLOYMENT_QUEUE: Queue<import('./queue').QueueMessage>
  DEPLOYMENT_DLQ: Queue<import('./queue').QueueMessage>

  // R2 Storage bindings
  DEPLOYMENT_LOGS: R2Bucket
  DEPLOYMENT_ARTIFACTS: R2Bucket

  // Rate limiting bindings
  DEPLOYMENT_RATE_LIMITER?: RateLimitBinding

  // Cloudflare API credentials
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string

  // Authentication environment variables
  BETTER_GITHUB_CLIENT_ID: string
  BETTER_GITHUB_CLIENT_SECRET: string
  TURNSTILE_SECRET_KEY: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string

  // Application URLs
  NEXT_PUBLIC_DISPATCHER_URL?: string

  // Sandbox provider configuration
  E2B_API_KEY?: string
  DAYTONA_API_KEY?: string
  NEXT_PUBLIC_SANDBOX_BUILDER_DEFAULT_PROVIDER?: string

  // Dispatch namespace configuration
  DISPATCH_NAMESPACE_NAME?: string

  // Environment variables
  LOG_LEVEL?: string
  ENVIRONMENT?: string
  NODE_ENV?: string

  // Database connection
  POSTGRES_URL?: string

  // Queue configuration
  DEPLOYMENT_QUEUE_NAME?: string
  DEPLOYMENT_DLQ_NAME?: string
  MAX_DEPLOYMENT_TIMEOUT?: string
  MAX_CONCURRENT_DEPLOYMENTS?: string
}

/**
 * Hono context variables for Deploy V2 service
 * @description Variables available in the request context
 */
export interface Variables {
  session?: Awaited<ReturnType<ReturnType<typeof betterAuth>['api']['getSession']>>
  userId?: string
  organizationId?: string
  requestId?: string
  userSession?: {
    session: {
      id: string
      token: string
      userId: string
      expiresAt: Date
      createdAt: Date
      updatedAt: Date
      ipAddress?: string | null
      userAgent?: string | null
      activeOrganizationId?: string | null
    }
    user: {
      id: string
      email: string
      name?: string | null
    }
  }
}

/**
 * Application context type for Deploy V2 service
 * @description The main context type used throughout the application
 */
export type AppContext = Context<{
  Bindings: Bindings
  Variables: Variables
}>

// Re-export types from other modules
export type {
  QueueMessage,
  QueueBatch,
  QueueMessageMetadata,
  QueueProcessingResult,
  QueueBatchResult,
  QueueProducerOptions
} from './queue'
export type {
  DeploymentParams,
  DeploymentState,
  DeploymentStatus,
  DeploymentResult,
  DeploymentContext,
  DeploymentStepResult,
  ValidationResult,
  SandboxResult,
  SyncResult,
  BuildResult,
  DeployResult,
  CleanupResult,
  DeploymentRequest,
  DeploymentResponse,
  DeploymentStatusResponse
} from './deployment'

/**
 * Health check response
 */
export interface HealthResponse {
  status: string
  timestamp: string
  service?: string
  version?: string
  queues?: {
    deployment: {
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
 * Service info response
 */
export interface ServiceInfoResponse {
  message: string
  endpoints: string[]
  timestamp: string
  service?: string
  version?: string
}
