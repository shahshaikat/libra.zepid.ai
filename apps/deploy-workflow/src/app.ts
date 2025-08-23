/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * app.ts
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

import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import {
  createErrorHandler,
  createCorsMiddleware,
  createLoggingMiddleware,
  createRequestIdMiddleware
} from '@libra/middleware'
import { openApiApp } from './openapi'
import type { Bindings, Variables } from './types'

// Create main Hono app instance
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Register global error handler
app.onError(createErrorHandler('deploy'))

// Apply global middleware
app.use('*', createRequestIdMiddleware())
app.use('*', createLoggingMiddleware({ service: 'deploy', level: 'info' }))
app.use('*', createCorsMiddleware())

// Root endpoint
app.get('/', async (c) => {
  return c.json({
    message: 'Zepid Deployment Service',
    endpoints: ['/deploy', '/deploy-status', '/health', '/docs'],
    timestamp: new Date().toISOString(),
    service: 'Zepid Deploy Service',
    version: '1.0.0'
  })
})

// Integrate OpenAPI application routes
app.route('/', openApiApp)

// Add Scalar API documentation route
app.get(
  '/docs',
  Scalar({
    url: '/openapi.json',
    theme: 'default',
    pageTitle: 'Zepid Deploy API Documentation',
    customCss: `
      .light-mode {
        --scalar-color-accent: #0099ff;
      }
      .dark-mode {
        --scalar-color-accent: #e36002;
      }
    `,
  })
)

export default app
