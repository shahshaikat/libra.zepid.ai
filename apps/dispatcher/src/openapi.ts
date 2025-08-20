/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * openapi.ts
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

import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from './middleware/auth-middleware'
import type { CloudflareBindings, ContextVariables } from './types'

// Create OpenAPI Hono app instance
export const openApiApp = new OpenAPIHono<{ Bindings: CloudflareBindings; Variables: ContextVariables }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: result.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        400
      )
    }
  },
})

// Health check endpoint
openApiApp.get('/health', async (c) => {
  const requestId = c.get('requestId') || crypto.randomUUID()

  try {
    // Basic health checks
    const checks = {
      service: true,
      namespace: !!c.env.DISPATCH_NAMESPACE_NAME,
      database: !!c.env.DATABASE,
      postgres: !!c.env.POSTGRES_URL,
    }

    const allHealthy = Object.values(checks).every(Boolean)

    return c.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Libra Dispatcher',
      version: '1.0.0',
      requestId,
      checks,
      namespace: {
        name: c.env.DISPATCH_NAMESPACE_NAME,
        accountId: c.env.DISPATCH_NAMESPACE_ACCOUNT_ID,
      }
    }, allHealthy ? 200 : 503)
  } catch (error) {
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'Libra Dispatcher',
      version: '1.0.0',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// OpenAPI document configuration
openApiApp.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Libra Dispatcher API',
    version: '1.0.0',
    description: 'API for dispatching requests to Cloudflare Workers using subdomain routing',
    contact: {
      name: 'Libra Team',
      url: 'https://zepid.dev',
      email: 'support@zepid.dev',
    },
    license: {
      name: 'AGPL-3.0',
      url: 'https://www.gnu.org/licenses/agpl-3.0.html',
    },
  },
  servers: [
    {
      url: 'https://dispatcher.zapid.dev',
      description: 'Production server',
    },
    {
      url: 'https://libra.sh',
      description: 'Production dispatcher (subdomain routing)',
    },
    {
      url: 'http://localhost:3007',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Dispatch',
      description: 'Worker dispatch operations',
    },
    {
      name: 'Health',
      description: 'Service health and status',
    },
    {
      name: 'Info',
      description: 'Service information and metadata',
    },
  ],

})
