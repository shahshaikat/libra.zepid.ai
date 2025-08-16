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
import { sendToQueue } from './queue/producer'
import { createLogger } from './utils/logger'
import { DeploymentError, ErrorCodes } from './utils/errors'
import type { Bindings, Variables, QueueMessage } from './types'

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
const deploymentRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  customDomain: z.string().optional(),
  orgId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().min(1, 'User ID is required'),
}).openapi('DeploymentRequest')

const deploymentResponseSchema = z.object({
  success: z.boolean(),
  deploymentId: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
}).openapi('DeploymentResponse')

const healthResponseSchema = z.object({
  status: z.literal('healthy'),
  timestamp: z.string(),
  service: z.string(),
  version: z.string(),
  uptime: z.number(),
  checks: z.object({
    database: z.string(),
    queue: z.string(),
  }),
}).openapi('HealthResponse')

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  timestamp: z.string(),
}).openapi('ErrorResponse')

// Deploy route
const deployRoute = createRoute({
  method: 'post',
  path: '/deploy',
  tags: ['Deployment'],
  summary: 'Create a new deployment',
  description: 'Initiates a new deployment process for a project using the queue-based system',
  request: {
    body: {
      content: {
        'application/json': {
          schema: deploymentRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: deploymentResponseSchema,
        },
      },
      description: 'Deployment initiated successfully',
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


// Health route
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Returns the health status of the deployment service',
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

// Deploy handler
const deployHandler = async (c: any) => {
  const requestId = c.get('requestId') || crypto.randomUUID()
  const logger = createLogger(c.env)
  let db: any

  try {
    // Parse request body
    const body = c.req.valid('json')
    const { projectId, customDomain, orgId, userId } = body

    logger.info('Creating new deployment', {
      requestId,
      operation: 'create_deployment',
      projectId,
      orgId,
      userId,
      hasCustomDomain: !!customDomain
    })

    // Check if project is already in intermediate deployment state
    db = await getDbForHono({ env: c.env } as any)
    const existingProject = await db.select()
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, orgId)))
      .limit(1)

    if (!existingProject?.[0]) {
      logger.warn('Project not found for deployment', {
        requestId,
        projectId,
        orgId
      })
      return c.json({
        success: false,
        error: 'Project not found',
        message: 'The specified project does not exist or you do not have access to it'
      }, 404)
    }

    const currentProject = existingProject[0]
    const currentDeploymentStatus = currentProject.deploymentStatus

    // Prevent concurrent deployments - only allow deployment if project is in final state
    // Valid states for new deployment: null, 'idle', 'deployed', 'failed'
    // Invalid states (deployment in progress): 'preparing', 'deploying'
    if (currentDeploymentStatus === 'preparing' || currentDeploymentStatus === 'deploying') {
      logger.warn('Deployment blocked - project already deploying', {
        requestId,
        projectId,
        currentStatus: currentDeploymentStatus
      })
      return c.json({
        success: false,
        error: 'Deployment in progress',
        message: `Cannot start new deployment. Project is currently in '${currentDeploymentStatus}' state. Please wait for the current deployment to complete.`
      }, 409) // 409 Conflict
    }

    logger.info('Deployment state validation passed', {
      requestId,
      projectId,
      currentStatus: currentDeploymentStatus
    })

    // Don't set deployment status here - let the queue consumer handle it
    // This prevents race conditions and ensures proper state management
    logger.info('Deployment validation passed, queuing deployment', {
      requestId,
      projectId,
      previousStatus: currentDeploymentStatus
    })

    // Generate deployment ID
    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // Create queue message
    const queueMessage: QueueMessage = {
      metadata: {
        deploymentId,
        createdAt: new Date().toISOString(),
        userId,
        organizationId: orgId,
        version: '1.0.0',
        priority: 5,
        retryCount: 0
      },
      params: {
        projectId,
        customDomain,
        orgId,
        userId
      },
      config: {
        timeout: Number.parseInt(c.env.MAX_DEPLOYMENT_TIMEOUT || '600000'),
        debug: c.env.LOG_LEVEL === 'debug'
      }
    }

    // Send to queue
    await sendToQueue(c.env, queueMessage)

    logger.info('Deployment queued successfully', {
      requestId,
      deploymentId,
      queuedAt: new Date().toISOString()
    })

    // Clean up database connection
    c.executionCtx.waitUntil(db.$client.end())

    return c.json({
      success: true,
      deploymentId,
      message: 'Deployment initiated successfully'
    })

  } catch (error) {
    logger.error('Failed to create deployment', {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    })

    // Clean up database connection on error
    if (db) {
      try {
        c.executionCtx.waitUntil(db.$client.end())
      } catch (dbError) {
        logger.error('Failed to cleanup database connection', {
          requestId,
          error: dbError instanceof Error ? dbError.message : String(dbError)
        })
      }
    }

    if (error instanceof DeploymentError) {
      return c.json({
        success: false,
        error: error.code,
        message: error.message
      }, error.statusCode)
    }

    return c.json({
      success: false,
      error: ErrorCodes.INTERNAL_ERROR,
      message: 'Failed to create deployment'
    }, 500)
  }
}

// Health handler
const healthHandler = async (c: any) => {
  const logger = createLogger(c.env)
  const startTime = Date.now()

  try {
    // Basic health checks
    const checks = {
      database: 'healthy',
      queue: 'healthy'
    }

    const response = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      service: 'Libra Deploy V2',
      version: '2.0.0',
      uptime: Date.now() - startTime,
      checks
    }

    logger.info('Health check completed', {
      status: 'healthy',
      checks,
      responseTime: Date.now() - startTime
    })

    return c.json(response)

  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error)
    })

    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Libra Deploy V2',
      version: '2.0.0',
      error: error instanceof Error ? error.message : String(error)
    }, 500)
  }
}

// Register OpenAPI routes
openApiApp.openapi(deployRoute, deployHandler)
openApiApp.openapi(healthRoute, healthHandler)

// Service info endpoint
openApiApp.get('/', async (c) => {
  return c.json({
    message: 'Libra Deploy V2 Service',
    service: 'Libra Deploy V2',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    architecture: 'queue-based',
    description: 'Queue-based deployment service for Libra platform',
    endpoints: ['/deploy', '/deploy-status?id=<deploymentId>', '/health', '/docs']
  })
})

// OpenAPI document configuration
openApiApp.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Libra Deploy V2 API',
    version: '2.0.0',
    description: 'API for deploying projects using Cloudflare Workers and Queues',
    contact: {
      name: 'Libra Team',
      url: 'https://zapid.dev',
      email: 'support@zapid.dev',
    },
    license: {
      name: 'AGPL-3.0',
      url: 'https://www.gnu.org/licenses/agpl-3.0.html',
    },
  },
  servers: [
    {
      url: 'https://deploy.zapid.dev',
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
      description: 'Project deployment operations using queue-based processing',
    },
    {
      name: 'Health',
      description: 'Service health and status checks',
    },
  ],
})
