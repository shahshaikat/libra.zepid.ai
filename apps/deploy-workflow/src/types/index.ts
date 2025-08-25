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
 * Cloudflare Workers environment bindings for Deploy service
 * @description Contains all the bindings available in the Cloudflare Workers environment
 */
export interface Bindings {
  // Core Cloudflare bindings
  DATABASE?: D1Database
  HYPERDRIVE?: Hyperdrive
  KV?: KVNamespace

  // Workflow bindings
  DEPLOY_WORKFLOW: Workflow

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

  // Environment variables
  LOG_LEVEL?: string
  ENVIRONMENT?: string
  NODE_ENV?: string

  // Database connection
  POSTGRES_URL?: string
}

/**
 * Hono context variables for Deploy service
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
 * Application context type for Deploy service
 * @description The main context type used throughout the application
 */
export type AppContext = Context<{
  Bindings: Bindings
  Variables: Variables
}>

/**
 * Deployment parameters passed to the workflow
 */
export interface DeploymentParams {
  projectId: string
  customDomain?: string
  orgId: string
  userId: string
  initFiles: any
  historyMessages: any
}

/**
 * Deployment request body
 */
export interface DeploymentRequest {
  projectId: string
  customDomain?: string
  orgId: string
  userId: string
  initFiles?: any
  historyMessages?: any
}

/**
 * Deployment response
 */
export interface DeploymentResponse {
  success: boolean
  id?: string
  details?: any
  error?: string
  message?: string
}

/**
 * Deployment status response
 */
export interface DeploymentStatusResponse {
  status: any
  error?: string
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string
  timestamp: string
  service?: string
  version?: string
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

// Step result types for workflow state persistence
export interface ValidationResult {
  projectData: any
  deploymentConfig: {
    projectId: string
    workerName: string
    customDomain?: string
    template: string
    timeout: number
  }
}

export interface SandboxResult {
  sandboxId: string
  sandboxInfo: any
}

export interface SyncResult {
  filesSynced: number
  buildReady: boolean
}

export interface BuildResult {
  buildSuccess: boolean
  buildOutput: string
}

export interface DeployResult {
  workerUrl: string
  deploymentSuccess: boolean
}

export interface CleanupResult {
  databaseUpdated: boolean
  sandboxCleaned: boolean
}
