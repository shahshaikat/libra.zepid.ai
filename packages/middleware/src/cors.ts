/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * cors.ts
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

import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'
import type { CorsConfig, EnvironmentConfig } from './types'

/**
 * Default CORS configuration
 */
const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
  exposeHeaders: ['X-Request-Id', 'X-Response-Time'],
}

/**
 * Get environment-specific CORS origins
 */
function getEnvironmentOrigins(environment: string): string[] {
  const isDevelopment = environment === 'development'

  if (isDevelopment) {
    // Development: Allow localhost and common development ports
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3007',
      'http://localhost:3008',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:3004',
      'http://127.0.0.1:3005',
      'http://127.0.0.1:3006',
      'http://127.0.0.1:3007',
      'http://127.0.0.1:3008',
    ]
  }

  // Production: Allow specific Libra domains
  return [
    'https://zepid.dev',
    'https://www.zepid.dev',
    'https://app.zepid.dev',
    'https://cdn.zepid.dev',
    'https://docs.zepid.dev',
    'https://auth.zepid.dev',
    'https://api.zepid.dev',
    'https://dispatcher.zepid.dev',
    'https://builder.zepid.dev',
    'https://email.zepid.dev',
    'https://web.zepid.dev',
    'https://deploy.zepid.dev',
    'https://auth-studio.zepid.dev',
    'https://vite-shadcn-template.zepid.dev',
  ]
}

/**
 * Create environment-aware CORS middleware
 * @param config Optional CORS configuration override
 * @param envConfig Optional environment configuration
 * @returns CORS middleware handler
 */
export function createCorsMiddleware(
  config?: Partial<CorsConfig>,
  envConfig?: Partial<EnvironmentConfig>
): MiddlewareHandler {
  const environment = envConfig?.ENVIRONMENT || process.env.ENVIRONMENT || 'development'
  const isDevelopment = environment === 'development'

  const finalConfig: CorsConfig = {
    ...DEFAULT_CORS_CONFIG,
    allowedOrigins: getEnvironmentOrigins(environment),
    ...config,
  }

  return cors({
    origin: (requestOrigin) => {
      if (!requestOrigin) {
        // Allow requests without origin (e.g., same-origin requests)
        return isDevelopment ? '*' : null
      }

      // Check exact match first
      if (finalConfig.allowedOrigins.includes(requestOrigin)) {
        return requestOrigin
      }

      // Development: Allow any localhost or 127.0.0.1 port
      if (isDevelopment) {
        if (requestOrigin.match(/^https?:\/\/localhost:\d+$/)) {
          return requestOrigin
        }
        if (requestOrigin.match(/^https?:\/\/127\.0\.0\.1:\d+$/)) {
          return requestOrigin
        }
      }

      // Production: Allow subdomains of libra.dev and libra.sh
      if (!isDevelopment) {
        if (requestOrigin.match(/^https:\/\/[a-zA-Z0-9-]+\.libra\.dev$/)) {
          return requestOrigin
        }
        if (requestOrigin.match(/^https:\/\/[a-zA-Z0-9-]+\.libra\.sh$/)) {
          return requestOrigin
        }
      }

      // Log rejected origin for debugging
      if (envConfig?.LOG_LEVEL === 'debug') {
        console.log(`CORS: Rejected origin ${requestOrigin}`)
      }

      return null
    },
    allowMethods: finalConfig.allowMethods,
    allowHeaders: finalConfig.allowHeaders,
    credentials: finalConfig.credentials,
    maxAge: finalConfig.maxAge,
    exposeHeaders: finalConfig.exposeHeaders,
  })
}

/**
 * Create public CORS middleware for public endpoints
 * Allows all origins for public access
 */
export function createPublicCorsMiddleware(): MiddlewareHandler {
  return cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400,
    exposeHeaders: ['X-Request-Id'],
  })
}

/**
 * Create strict CORS middleware for sensitive endpoints
 * Only allows specific origins
 */
export function createStrictCorsMiddleware(allowedOrigins: string[]): MiddlewareHandler {
  return cors({
    origin: (requestOrigin) => {
      if (!requestOrigin) return null
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : null
    },
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600, // 1 hour
    exposeHeaders: ['X-Request-Id'],
  })
}

/**
 * Create CDN-specific CORS middleware for asset delivery
 */
export function createCdnCorsMiddleware(): MiddlewareHandler {
  return cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    allowHeaders: ['Range', 'If-None-Match', 'If-Modified-Since'],
    credentials: false,
    maxAge: 86400 * 7, // 7 days
    exposeHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
  })
}
