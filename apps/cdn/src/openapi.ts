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
import type { Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'

import { initAuth } from './auth-server'
import { createUploadRateLimitMiddleware } from './middleware/rate-limit'
import { badgeHandler, badgeRoute } from './routes/badge'
import { deleteHandler, deleteRoute } from './routes/delete'
import { imageHandler, imageRoute } from './routes/image'
import {
  screenshotRetrieveHandler,
  screenshotRetrieveRoute,
  screenshotStoreHandler,
  screenshotStoreRoute,
} from './routes/screenshot'
import { uploadHandler, uploadRoute } from './routes/upload'
import type { AppContext, Bindings, Variables } from './types'

// Create OpenAPI Hono app instance
export const openApiApp = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation Error',
          message: 'Request validation failed',
          details: result.error.flatten(),
        },
        400
      )
    }
  },
})

// Note: CORS, error handling, and logging are handled by the main app
// Only keep business-specific middleware here

// Authentication middleware
const authMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: () => Promise<void>
) => {
  // Skip authentication for public endpoints
  if (
    c.req.method === 'GET' &&
    (c.req.url.includes('/screenshot/') ||
      c.req.url.includes('/badge.js') ||
      c.req.url.includes('/health/'))
  ) {
    await next()
    return
  }

  const auth = await initAuth(c as AppContext)
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Access denied. Valid session required.',
      },
      401
    )
  }

  c.set('userSession', session)
  await next()
}

// Apply authentication middleware only to protected routes
// Public routes: /screenshot/*, /badge.js, /health don't need auth
openApiApp.use('/upload', authMiddleware)
openApiApp.use('/image/*', authMiddleware)
openApiApp.use('/delete/*', authMiddleware)

// Apply rate limiting specifically to upload routes
openApiApp.use('/upload', (c, next) => {
  if (c.env.FILE_UPLOAD_RATE_LIMITER) {
    const rateLimitMiddleware = createUploadRateLimitMiddleware(c.env.FILE_UPLOAD_RATE_LIMITER)
    return rateLimitMiddleware(c, next)
  }
  return next()
})

openApiApp.use(
  '*',
  bodyLimit({
    maxSize: 5 * 1024 * 1024, // 5MB
    onError: (c) => {
      return c.json(
        {
          error: 'File Too Large',
          message: 'File is too large (max 5MB)',
        },
        413
      )
    },
  })
)


// Register OpenAPI routes
// Note: Type assertion needed due to complex OpenAPI handler type inference
openApiApp.openapi(uploadRoute, uploadHandler as any)
openApiApp.openapi(imageRoute, imageHandler as any)
openApiApp.openapi(deleteRoute, deleteHandler as any)
openApiApp.openapi(screenshotStoreRoute, screenshotStoreHandler as any)
openApiApp.openapi(screenshotRetrieveRoute, screenshotRetrieveHandler as any)
openApiApp.openapi(badgeRoute, badgeHandler)

// OpenAPI document configuration
openApiApp.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Zepid CDN API',
    version: '1.0.0',
    description: 'API for uploading and retrieving images from Zepid CDN service',
    contact: {
      name: 'Zepid Team',
      url: 'https://zepid.dev',
      email: 'support@zepid.dev',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://cdn.zepid.dev',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3004',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Images',
      description: 'Image upload and retrieval operations',
    },
    {
      name: 'Files',
      description: 'File management operations',
    },
    {
      name: 'Badge',
      description: 'Zepid badge script for websites',
    },
  ],
})
