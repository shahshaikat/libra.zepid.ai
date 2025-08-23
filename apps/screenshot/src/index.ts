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

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import {
  createCorsMiddleware,
  createLoggingMiddleware,
  createRequestIdMiddleware
} from '@libra/middleware'
import { handleQueueBatch } from './queue/consumer'
import { openApiApp } from './api/openapi'
import { createLogger } from './utils/logger'
import type {
  Bindings,
  Variables,
  ScreenshotQueueMessage
} from './types'

/**
 * Main Hono application for Screenshot Service
 */
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * Global middleware
 */
app.use('*', createRequestIdMiddleware())
app.use('*', createLoggingMiddleware({ service: 'screenshot', level: 'info' }))
app.use('*', secureHeaders())
app.use('*', createCorsMiddleware())

/**
 * Error handling middleware
 */
app.onError((err, c) => {
  const logger = createLogger(c.env)
  const requestId = c.get('requestId') || 'unknown'

  logger.error('Unhandled error in screenshot service', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method
  }, err)

  return c.json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    requestId
  }, 500)
})

/**
 * Mount OpenAPI routes
 */
app.route('/', openApiApp)

/**
 * API documentation route
 */
app.get('/docs', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Zepid Screenshot Service API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/openapi.json"
          data-configuration='{"theme":"purple"}'
        ></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `)
})

/**
 * Default export for Cloudflare Workers
 */
export default {
  /**
   * Handle HTTP requests
   */
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  /**
   * Handle queue messages for screenshot processing
   */
  async queue(batch: MessageBatch<ScreenshotQueueMessage>, env: Bindings, ctx: ExecutionContext): Promise<void> {
    const logger = createLogger(env)

    try {
      logger.info('Processing screenshot queue batch', {
        batchSize: batch.messages.length,
        queueName: env.SCREENSHOT_QUEUE_NAME || 'screenshot-queue',
        timestamp: new Date().toISOString()
      })

      // Process the batch of screenshot messages
      await handleQueueBatch(batch, env, ctx)

      logger.info('Screenshot queue batch processed successfully', {
        batchSize: batch.messages.length,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logger.error('Screenshot queue batch processing failed', {
        batchSize: batch.messages.length,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, error instanceof Error ? error : undefined)

      // Don't throw - let Cloudflare handle retry logic
    }
  },

  /**
   * Handle scheduled events (optional)
   */
  async scheduled(event: ScheduledEvent, env: Bindings, _ctx: ExecutionContext): Promise<void> {
    const logger = createLogger(env)

    try {
      logger.info('Scheduled event triggered', {
        scheduledTime: new Date(event.scheduledTime).toISOString(),
        cron: event.cron
      })

      // Perform scheduled maintenance tasks
      // For example: cleanup old artifacts, health checks, etc.

      logger.info('Scheduled event completed', {
        scheduledTime: new Date(event.scheduledTime).toISOString()
      })

    } catch (error) {
      logger.error('Scheduled event failed', {
        scheduledTime: new Date(event.scheduledTime).toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined)
    }
  }
}

/**
 * Type exports for external use
 */
export type {
  Bindings,
  Variables,
  ScreenshotQueueMessage,
  HealthResponse
} from './types'
