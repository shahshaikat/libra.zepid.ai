/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * types.ts
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

// Type definitions for Zepid Dispatcher

import type { CustomDomainProject } from '@libra/db'

export interface DispatchNamespace {
  get(name: string): {
    fetch(input: URL | RequestInfo, init?: RequestInit<CfProperties<unknown>> | undefined): Promise<Response>
    connect(address: string | SocketAddress, options?: SocketOptions | undefined): Socket
  }
}

export interface CloudflareBindings {
  DATABASE?: D1Database
  HYPERDRIVE?: Hyperdrive
  KV?: KVNamespace
  dispatcher: DispatchNamespace
  DISPATCH_NAMESPACE_NAME: string
  DISPATCH_NAMESPACE_ACCOUNT_ID: string
  POSTGRES_URL: string
}

export interface ContextVariables {
  userSession?: UserSession
  requestId: string
}

export interface UserSession {
  userId: string
  email?: string
  activeOrganizationId?: string
  [key: string]: any
}

export interface DispatchRequest {
  workerName: string
  method: string
  url: string
  headers: Record<string, string>
  body?: string | ArrayBuffer | ReadableStream
}

export interface CustomDomainResult {
  success: boolean
  response?: Response
  error?: string
  project?: CustomDomainProject
}

export interface DispatchResponse {
  success: boolean
  status?: number
  headers?: Record<string, string>
  body?: string | ArrayBuffer | ReadableStream
  error?: string
  requestId: string
}

export interface RouteStrategy {
  type: 'subdomain' | 'path' | 'header' | 'query'
  value: string
}

export interface ValidationError {
  code: string
  message: string
  field?: string
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'error'
  timestamp: string
  service: string
  version: string
  requestId: string
  checks?: {
    [key: string]: boolean | {
      status: boolean
      message: string
    }
  }
  error?: string
}

export interface NamespaceInfo {
  name: string
  accountId: string
}

export interface DispatchMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  workerStats: {
    [workerName: string]: {
      requests: number
      errors: number
      lastAccessed: string
    }
  }
}

// Error codes
export enum DispatchErrorCode {
  WORKER_NOT_FOUND = 'WORKER_NOT_FOUND',
  INVALID_WORKER_NAME = 'INVALID_WORKER_NAME',
  NAMESPACE_NOT_CONFIGURED = 'NAMESPACE_NOT_CONFIGURED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  REQUEST_TOO_LARGE = 'REQUEST_TOO_LARGE',
  INVALID_REQUEST_FORMAT = 'INVALID_REQUEST_FORMAT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// HTTP status codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  REQUEST_TOO_LARGE = 413,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// Middleware types
export interface MiddlewareContext {
  requestId: string
  startTime: number
  userSession?: UserSession
}

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  requestId: string
  metadata?: Record<string, any>
}

// Configuration types
export interface DispatcherConfig {
  maxRequestSize: number
  allowedMethods: string[]
  corsOrigins: string[]
  authRequired: boolean
  rateLimiting?: {
    enabled: boolean
    requestsPerMinute: number
  }
}
