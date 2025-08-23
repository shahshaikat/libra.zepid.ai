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
import { createDeploymentRateLimitMiddleware, extractProjectIdFromRequest } from './middleware/rate-limit'
import { deployHandler, deployRoute } from './routes/deploy'
import { healthHandler, healthRoute } from './routes/health'
import { statusHandler, statusRoute } from './routes/status'
import type { Bindings, Variables } from './types'

// Create OpenAPI Hono app instance
export const openApiApp = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Request validation failed',
          details: result.error.flatten(),
        },
        400
      )
    }
  },
})

// Apply authentication middleware to protected routes
// Note: CORS and error handling are handled by the main app
openApiApp.use('/deploy', authMiddleware)
openApiApp.use('/deploy-status', authMiddleware)

// Apply rate limiting specifically to deployment routes
openApiApp.use('/deploy', (c, next) => {
  if (c.env.DEPLOYMENT_RATE_LIMITER) {
    const rateLimitMiddleware = createDeploymentRateLimitMiddleware(
      c.env.DEPLOYMENT_RATE_LIMITER,
      extractProjectIdFromRequest
    )
    return rateLimitMiddleware(c, next)
  }
  return next()
})

// Register OpenAPI routes
openApiApp.openapi(deployRoute, deployHandler)
openApiApp.openapi(statusRoute, statusHandler)
openApiApp.openapi(healthRoute, healthHandler)

// Service info endpoint
openApiApp.get('/', async (c) => {
  return c.json({
    message: 'Zepid Deployment Service',
    endpoints: ['/deploy', '/deploy-status', '/health'],
    timestamp: new Date().toISOString(),
    service: 'Zepid Deploy Service',
    version: '1.0.0'
  })
})

// OpenAPI document configuration
openApiApp.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Zepid Deploy API',
    version: '1.0.0',
    description: 'API for deploying projects using Cloudflare Workflows',
    contact: {
      name: 'Zepid Team',
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
      url: 'https://deploy.zepid.dev',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3008',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Deployment',
      description: 'Project deployment operations',
    },
    {
      name: 'Health',
      description: 'Service health and status checks',
    },
  ],
})
