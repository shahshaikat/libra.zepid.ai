/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * health.ts
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

import { createRoute } from '@hono/zod-openapi'
import { log } from '@libra/common'
import { healthResponseSchema } from '../schemas/deploy'
import type { AppContext } from '../types'

/**
 * OpenAPI route definition for health check endpoint
 */
export const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  summary: 'Health check',
  description: 'Check the health status of the deployment service',
  tags: ['Health'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: healthResponseSchema
        }
      },
      description: 'Service is healthy'
    }
  }
})

/**
 * Health route handler implementation
 */
export const healthHandler = async (c: AppContext) => {
  try {
    const requestId = c.get('requestId') || crypto.randomUUID()

    log.deployment('info', 'Health check request', {
      requestId,
      operation: 'health_check'
    })

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Zepid Deploy Service',
      version: '1.0.0'
    }, 200)
  } catch (error) {
    // Handle any unexpected errors
    const requestId = c.get('requestId') || crypto.randomUUID()

    log.deployment('error', 'Unexpected error in health handler', {
      requestId,
      operation: 'health_handler',
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof Error ? error : new Error(String(error)))

    // Return 200 with unhealthy status instead of 500
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Zepid Deploy Service',
      version: '1.0.0'
    }, 200)
  }
}
