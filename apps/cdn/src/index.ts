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

import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'

import { createErrorHandler } from '@libra/middleware'
import { createCorsMiddleware } from '@libra/middleware/cors'
import { createLoggingMiddleware, createRequestIdMiddleware } from '@libra/middleware/logging'

import { registerInspectorRoutes } from './inspector'
import { openApiApp } from './openapi'
import type { Bindings, Variables } from './types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Apply middleware stack
app.use('*', createRequestIdMiddleware())
app.onError(createErrorHandler('cdn'))
app.use('*', createCorsMiddleware())
app.use('*', createLoggingMiddleware({ service: 'cdn', level: 'info' }))

// Specific OPTIONS handler for /upload to ensure preflight requests are handled correctly,
// even if the global CORS middleware somehow doesn't catch it perfectly for this specific case.
// Or if more specific headers are needed for this route.
app.options('/upload', (c) => {
  // The global CORS middleware should ideally handle this,
  // but an explicit OPTIONS handler can provide more control or act as a fallback.
  // Ensure headers set here are compatible with the global CORS policy.
  // If global cors() is working as expected, this explicit handler might not be strictly necessary
  // but can be useful for debugging or very specific overrides.

  // Minimal response for preflight, actual CORS headers are often best managed by the main cors() middleware.
  // If the global cors middleware is applied correctly, it should automatically handle OPTIONS requests.
  // This explicit handler is more of a belt-and-suspenders approach or for very custom needs.
  return c.newResponse(null, 204) // No Content - Corrected way to send 204
})
// --- END CORS Configuration ---


app.get('/', async (c) => {
  return c.text('Hello Zepid AI!')
})


// Register inspector related routes (development only)
// Note: We register these routes conditionally but at startup time, not per-request
// The environment check will be done at runtime when the routes are accessed
registerInspectorRoutes(app)

// Integrate OpenAPI application routes
app.route('/', openApiApp)

// Add Scalar API documentation route
app.get(
  '/docs',
  Scalar({
    url: '/openapi.json',
    theme: 'default',
    pageTitle: 'Zepid CDN API Documentation',
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
