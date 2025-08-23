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
import {
  createErrorHandler,
  createCorsMiddleware,
  createLoggingMiddleware,
  createRequestIdMiddleware
} from '@libra/middleware'
import { handleQueueBatch } from './queue/consumer'
import { openApiApp } from './openapi'
import { createLogger } from './utils/logger'
import type { Bindings, Variables, QueueMessage } from './types'

/**
 * Main Hono application for HTTP API
 */
const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

// Register global error handler
app.onError(createErrorHandler('deploy-v2'))

// Apply global middleware
app.use('*', createRequestIdMiddleware())
app.use('*', createLoggingMiddleware({ service: 'deploy-v2', level: 'info' }))
app.use('*', createCorsMiddleware())

// Integrate OpenAPI application routes
app.route('/', openApiApp)

// Add Scalar API documentation route
app.get(
  '/docs',
  Scalar({
    url: '/openapi.json',
    theme: 'default',
    pageTitle: 'Zepid Deploy V2 API Documentation',
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

/**
 * Cloudflare Worker entry point
 */
export default {
  /**
   * Handle HTTP requests
   */
  fetch: app.fetch,

  /**
   * Handle queue messages for deployment processing
   */
  async queue(batch: MessageBatch<QueueMessage>, env: Bindings, ctx: ExecutionContext): Promise<void> {
    const logger = createLogger(env)

    try {
      logger.info('Processing queue batch', {
        batchSize: batch.messages.length,
        queueName: env.DEPLOYMENT_QUEUE_NAME || 'deployment-queue',
        timestamp: new Date().toISOString()
      })

      // Process the batch of deployment messages
      await handleQueueBatch(batch, env, ctx)

      logger.info('Queue batch processed successfully', {
        batchSize: batch.messages.length,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logger.error('Failed to process queue batch', {
        error: error instanceof Error ? error.message : String(error),
        batchSize: batch.messages.length,
        timestamp: new Date().toISOString()
      })

      // Re-throw to trigger queue retry mechanism
      throw error
    }
  },

  /**
   * Handle scheduled events (for future use)
   */
  async scheduled(event: ScheduledEvent, env: Bindings, _ctx: ExecutionContext): Promise<void> {
    const logger = createLogger(env)

    logger.info('Scheduled event triggered', {
      scheduledTime: new Date(event.scheduledTime).toISOString(),
      cron: event.cron
    })

    // Future: Add scheduled tasks like cleanup, monitoring, etc.
    // For now, this is a placeholder
  }
}

/**
 * Export types for external use
 */
export type { Bindings, QueueMessage, DeploymentParams, DeploymentResult } from './types'
