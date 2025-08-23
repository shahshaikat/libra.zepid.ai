/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * dispatch.ts
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
import { dispatchToWorker, getNamespaceInfo } from '../dispatcher'
import { parseRouteInfo, createWorkerRequest } from '../utils/routing'
import { validateDispatchRequest, validateRequestHeaders, validateRequestSize } from '../utils/validation'
import { log, tryCatch } from '@libra/common'

type Bindings = {
  DATABASE?: D1Database
  KV?: KVNamespace
  dispatcher: DispatchNamespace
  DISPATCH_NAMESPACE_NAME: string
  DISPATCH_NAMESPACE_ACCOUNT_ID: string
}

type Variables = {
  userSession?: any
  requestId: string
}

export const dispatchRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get namespace information and routing help
dispatchRoute.get('/', async (c) => {
  const requestId = c.get('requestId') || crypto.randomUUID()
  const session = c.get('userSession')

  log.dispatcher('info', 'Namespace info request received', {
    requestId,
    operation: 'namespace_info',
    hasSession: !!session
  })

  const [result, error] = await tryCatch(async () => {
    const namespaceInfo = getNamespaceInfo(c)

    log.dispatcher('info', 'Namespace info request completed', {
      requestId,
      operation: 'namespace_info',
      namespace: namespaceInfo.name
    })

    return c.json({
      message: 'Zepid Dispatcher API - Solution A (Wildcard Subdomain Routing)',
      description: 'Use subdomain routing for optimal performance: https://your-worker.zapid.dev/',
      namespace: namespaceInfo,
      routing: {
        primary: 'Subdomain-based routing (recommended)',
        example: 'https://vite-shadcn-template.zapid.dev/',
        fallback: 'Path-based routing for API access',
        apiExample: '/api/dispatch/vite-shadcn-template/'
      },
      user: session ? {
        id: session.userId,
        email: session.email
      } : null,
      timestamp: new Date().toISOString(),
      requestId
    })
  })

  if (error) {
    log.dispatcher('error', 'Failed to get namespace info', {
      requestId,
      operation: 'namespace_info'
    }, error instanceof Error ? error : new Error(String(error)))

    return c.json({
      error: 'Failed to get namespace information',
      requestId
    }, 500)
  }

  return result
})

// Dispatch with worker name in query parameter
dispatchRoute.all('/', async (c) => {
  const requestId = c.get('requestId') || crypto.randomUUID()
  const url = new URL(c.req.url)
  const workerName = url.searchParams.get('worker')

  log.dispatcher('info', 'Query-based dispatch request received', {
    requestId,
    operation: 'dispatch_query',
    method: c.req.method,
    url: c.req.url,
    hasWorkerParam: !!workerName
  })

  if (!workerName) {
    log.dispatcher('warn', 'Missing worker parameter in query dispatch', {
      requestId,
      operation: 'dispatch_query'
    })

    return c.json({
      error: 'Missing worker parameter',
      message: 'Worker name must be specified in the URL path or as a query parameter',
      examples: [
        '/dispatch/my-worker',
        '/dispatch?worker=my-worker'
      ],
      requestId
    }, 400)
  }

  const [result, error] = await tryCatch(async () => {

    // Validate the dispatch request
    const validation = validateDispatchRequest(c, workerName)
    if (!validation.valid) {
      log.dispatcher('warn', 'Query dispatch request validation failed', {
        workerName,
        requestId,
        operation: 'validation',
        validationError: validation.error,
        validationCode: validation.code
      })

      return c.json({
        error: 'Validation failed',
        message: validation.error,
        code: validation.code,
        requestId
      }, 400)
    }

    // Parse route information
    const routeInfo = parseRouteInfo(c)

    // Create modified request for the worker
    const workerRequest = createWorkerRequest(c.req.raw, routeInfo)

    log.dispatcher('info', 'Initiating query-based worker dispatch', {
      workerName,
      requestId,
      operation: 'dispatch',
      routingStrategy: routeInfo.strategy,
      targetPath: routeInfo.targetPath
    })

    // Dispatch to worker
    const result = await dispatchToWorker({
      workerName,
      request: workerRequest,
      context: c
    })

    if (!result.success) {
      if (result.error?.includes('not found')) {
        log.dispatcher('error', 'Worker not found during query dispatch', {
          workerName,
          requestId,
          operation: 'dispatch',
          error: result.error
        })

        return c.json({
          error: 'Worker not found',
          message: result.error,
          worker: workerName,
          requestId
        }, 404)
      }

      log.dispatcher('error', 'Query-based worker dispatch failed', {
        workerName,
        requestId,
        operation: 'dispatch',
        error: result.error
      })

      return c.json({
        error: 'Dispatch failed',
        message: result.error,
        worker: workerName,
        requestId
      }, 500)
    }

    // Return the worker's response
    if (result.response) {
      log.dispatcher('info', 'Query-based worker dispatch completed successfully', {
        workerName,
        requestId,
        operation: 'dispatch',
        responseStatus: result.response.status
      })
      return result.response
    }

    // This should not happen if result.success is true, but handle it gracefully
    log.dispatcher('error', 'No response from query worker despite success', {
      workerName,
      requestId,
      operation: 'dispatch'
    })

    return c.json({
      error: 'No response from worker',
      worker: workerName,
      requestId
    }, 500)

  })

  if (error) {
    log.dispatcher('error', 'Internal error during query-based dispatch', {
      workerName,
      requestId,
      operation: 'dispatch_query'
    }, error instanceof Error ? error : new Error(String(error)))

    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      worker: workerName,
      requestId
    }, 500)
  }

  return result
})
