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
import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod/v4'
import { and, eq } from 'drizzle-orm'
import { project, getDbForHono } from '@libra/db'
import { submitScreenshotRequest } from '../queue/producer'
import { createLogger } from '../utils/logger'
import { ScreenshotError, ErrorCodes, CommonErrors } from '../utils/errors'
import type { Bindings, Variables, ScreenshotQueueMessage } from '../types'

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

// Schemas
const screenshotRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  orgId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  previewUrl: z.string().url({ message: 'Valid preview URL is required' }),
}).openapi('ScreenshotRequest')

const screenshotResponseSchema = z.object({
  success: z.boolean(),
  screenshotId: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
}).openapi('ScreenshotResponse')

const statusResponseSchema = z.object({
  screenshotId: z.string(),
  status: z.string(),
  progress: z.number(),
  stage: z.string(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  error: z.string().optional(),
  screenshotUrl: z.string().optional(),
  duration: z.number().optional(),
}).openapi('StatusResponse')

const healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  service: z.string().optional(),
  version: z.string().optional(),
  queues: z.object({
    screenshot: z.object({
      status: z.string(),
      backlog: z.number().optional(),
    }),
    dlq: z.object({
      status: z.string(),
      backlog: z.number().optional(),
    }),
  }).optional(),
}).openapi('HealthResponse')

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
}).openapi('ErrorResponse')

// Screenshot route
const screenshotRoute = createRoute({
  method: 'post',
  path: '/screenshot',
  tags: ['Screenshot'],
  summary: 'Create a new screenshot',
  description: 'Initiates a new screenshot process for a project using the queue-based system',
  request: {
    body: {
      content: {
        'application/json': {
          schema: screenshotRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: screenshotResponseSchema,
        },
      },
      description: 'Screenshot initiated successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
      description: 'Invalid request parameters',
    },
    500: {
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

// Status route
const statusRoute = createRoute({
  method: 'get',
  path: '/screenshot-status',
  tags: ['Screenshot'],
  summary: 'Get screenshot status',
  description: 'Returns the current status of a screenshot request',
  request: {
    query: z.object({
      id: z.string().min(1, 'Screenshot ID is required'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: statusResponseSchema,
        },
      },
      description: 'Screenshot status retrieved successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
      description: 'Screenshot not found',
    },
    500: {
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

// Health route
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Returns the health status of the screenshot service',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: healthResponseSchema,
        },
      },
      description: 'Service is healthy',
    },
  },
})

// Screenshot handler
const screenshotHandler = async (c: any) => {
  const requestId = c.get('requestId') || crypto.randomUUID()
  const logger = createLogger(c.env)
  let db: any

  try {
    // Parse request body
    const body = c.req.valid('json')
    const { projectId, planId, orgId, userId, previewUrl } = body

    logger.info('Creating new screenshot', {
      requestId,
      operation: 'create_screenshot',
      projectId,
      planId,
      orgId,
      userId,
      hasPreviewUrl: !!previewUrl
    })

    // Check if project exists and user has access
    db = await getDbForHono({ env: c.env } as any)
    const existingProject = await db.select()
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, orgId)))
      .limit(1)

    if (!existingProject || existingProject.length === 0) {
      throw CommonErrors.projectNotFound(projectId)
    }

    const projectRecord = existingProject[0]

    // Validate organization access
    if (projectRecord.organizationId !== orgId) {
      throw CommonErrors.permissionDenied('Project does not belong to the specified organization')
    }

    // Check if project has message history
    if (!projectRecord.messageHistory) {
      throw CommonErrors.invalidRequest('Project has no message history to screenshot')
    }

    logger.info('Project validation successful, submitting to queue', {
      requestId,
      projectId,
      planId,
      orgId,
      userId
    })

    // Submit screenshot request to queue
    const screenshotId = await submitScreenshotRequest(c.env, {
      projectId,
      planId,
      orgId,
      userId,
      previewUrl
    }, {
      deduplicate: true, // Prevent duplicate screenshots for same project/plan
      config: {
        timeout: Number.parseInt(c.env.MAX_SCREENSHOT_TIMEOUT || '300000'),
        debug: c.env.LOG_LEVEL === 'debug'
      }
    })

    logger.info('Screenshot queued successfully', {
      requestId,
      screenshotId,
      queuedAt: new Date().toISOString()
    })

    return c.json({
      success: true,
      screenshotId,
      message: 'Screenshot request submitted successfully'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    logger.error('Screenshot request failed', {
      requestId,
      error: errorMessage
    }, error instanceof Error ? error : undefined)

    if (error instanceof ScreenshotError) {
      return c.json(error.toApiResponse(), error.statusCode)
    }

    return c.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: errorMessage
    }, 500)
  }
}

// Status handler - simplified version
const statusHandler = async (c: any) => {
  const requestId = c.get('requestId') || crypto.randomUUID()
  const logger = createLogger(c.env)

  try {
    const { id: screenshotId } = c.req.valid('query')

    logger.info('Getting screenshot status', {
      requestId,
      screenshotId
    })

    // Simplified response - screenshot service processes asynchronously
    // Status tracking is not implemented in this simplified version
    const response = {
      screenshotId,
      status: 'processing',
      progress: 50,
      stage: 'Screenshot is being processed asynchronously',
      startedAt: new Date().toISOString(),
      message: 'Screenshot will be available when processing completes'
    }

    return c.json(response)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    logger.error('Status request failed', {
      requestId,
      error: errorMessage
    })

    return c.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: errorMessage
    }, 500)
  }
}

// Health handler
const healthHandler = async (c: any) => {
  const requestId = c.get('requestId') || crypto.randomUUID()
  const logger = createLogger(c.env)

  try {
    logger.debug('Health check requested', { requestId })

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Zepid Screenshot Service',
      version: '1.0.0',
      queues: {
        screenshot: {
          status: 'operational',
          backlog: 0 // Would need actual queue monitoring
        },
        dlq: {
          status: 'operational',
          backlog: 0 // Would need actual DLQ monitoring
        }
      }
    }

    return c.json(response)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    logger.error('Health check failed', {
      requestId,
      error: errorMessage
    })

    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage
    }, 500)
  }
}

// Register OpenAPI routes
openApiApp.openapi(screenshotRoute, screenshotHandler)
openApiApp.openapi(statusRoute, statusHandler)
openApiApp.openapi(healthRoute, healthHandler)

// Service info endpoint
openApiApp.get('/', async (c) => {
  return c.json({
    message: 'Zepid Screenshot Service',
    service: 'Zepid Screenshot Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    architecture: 'queue-based',
    description: 'Queue-based screenshot service for Zepid platform',
    endpoints: ['/screenshot', '/screenshot-status?id=<screenshotId>', '/health', '/docs']
  })
})

// OpenAPI document configuration
openApiApp.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Zepid Screenshot Service API',
    version: '1.0.0',
    description: 'API for capturing screenshots using Cloudflare Workers and Queues',
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
      url: 'https://screenshot.zepid.dev',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3009',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Screenshot',
      description: 'Project screenshot operations using queue-based processing',
    },
    {
      name: 'Health',
      description: 'Service health and status checks',
    },
  ],
})
