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
import { openApiApp } from './openapi'
import { dispatchRoute } from './routes/dispatch'
import { isValidWorkerSubdomain, extractSubdomain } from './config/domains'
import { handleCustomDomainRequest } from './utils/custom-domain'
import { log } from '@libra/common'

import type { CloudflareBindings, ContextVariables } from './types'

// Use shared type definitions
type Bindings = CloudflareBindings
type Variables = ContextVariables

// Create Hono app instance with NO middleware to avoid header issues
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * Handle worker forwarding for zapid.dev subdomains
 */
async function handleLibraSubdomainWorker(request: Request, env: Bindings, subdomain: string, requestId: string): Promise<Response> {
  try {
    log.dispatcher('info', 'Dispatching to worker', {
      workerName: subdomain,
      requestId,
      operation: 'worker_dispatch'
    })

    const userWorker = env.dispatcher.get(subdomain)
    const response = await userWorker.fetch(request)

    log.dispatcher('info', 'Worker dispatch completed', {
      workerName: subdomain,
      responseStatus: response.status,
      requestId,
      operation: 'worker_dispatch'
    })

    return response

  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Worker not found')) {
      log.dispatcher('warn', 'Worker not found', {
        workerName: subdomain,
        requestId,
        operation: 'worker_dispatch'
      })

      return new Response(JSON.stringify({
        error: 'Worker not found',
        message: `Worker '${subdomain}' is not deployed or does not exist`,
        workerName: subdomain,
        requestId,
        suggestion: 'Please check if the worker is deployed correctly'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    log.dispatcher('error', 'Worker dispatch failed', {
      workerName: subdomain,
      requestId,
      operation: 'worker_dispatch'
    }, error instanceof Error ? error : undefined)

    const errorMessage = error instanceof Error ? error.message : 'Worker dispatch failed'
    return new Response(JSON.stringify({
      error: 'Worker dispatch failed',
      message: errorMessage,
      workerName: subdomain,
      requestId
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}





// Priority 1: Dispatcher's own routes (for zapid.dev root domain)
// Integrate OpenAPI application routes
app.route('/', openApiApp)

// Main dispatch routes
app.route('/dispatch', dispatchRoute)
app.route('/api/dispatch', dispatchRoute)

// Add Scalar API documentation route
app.get(
  '/docs',
  Scalar({
    url: '/openapi.json',
    theme: 'default',
    pageTitle: 'Zepid Dispatcher API Documentation',
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

// Priority 2: Domain routing for all other requests
app.all('*', async (c) => {
  const url = new URL(c.req.url)
  const hostname = url.hostname
  const pathname = url.pathname
  const requestId = c.get('requestId') || crypto.randomUUID()

  log.dispatcher('info', 'Processing domain routing request', {
    hostname,
    pathname,
    method: c.req.method,
    requestId,
    operation: 'domain_routing'
  })

  try {
    // 1. Check if it's a zapid.dev domain
    if (hostname === 'zapid.dev' || hostname.endsWith('.zapid.dev')) {
      // Check if it's the root domain zapid.dev
      if (hostname === 'zapid.dev') {
        // Root domain request, return dispatcher information
        if (pathname === '/') {
          return c.json({
            service: 'Zepid Dispatcher',
            version: '1.0.0',
            status: 'running',
            domain: 'zapid.dev',
            description: 'Cloudflare Workers dispatcher for Zepid platform',
            timestamp: new Date().toISOString(),
            requestId
          })
        }
        // Other paths for root domain, return 404 (let previous routes handle)
        return c.json({
          error: 'Not found',
          message: 'The requested resource was not found on this server',
          path: pathname,
          hostname,
          requestId
        }, 404)
      }

      // Handle subdomain routing
      const subdomain = extractSubdomain(hostname)
      if (!subdomain) {
        log.dispatcher('warn', 'No valid subdomain found for zapid.dev domain', {
          hostname,
          requestId,
          operation: 'libra_domain_routing'
        })

        return c.json({
          error: 'Invalid subdomain',
          message: 'No valid subdomain found for zapid.dev domain',
          hostname,
          requestId
        }, 400)
      }

      // Validate if subdomain is valid
      const validation = isValidWorkerSubdomain(subdomain)
      if (!validation.valid) {
        log.dispatcher('warn', 'Invalid worker subdomain', {
          subdomain,
          hostname,
          requestId,
          operation: 'libra_domain_routing',
          validationError: validation.error
        })

        return c.json({
          error: 'Invalid worker name',
          message: validation.error,
          subdomain,
          hostname,
          requestId
        }, 400)
      }

      // Forward to worker
      return await handleLibraSubdomainWorker(c.req.raw, c.env, subdomain, requestId)
    }

    // 2. Handle custom domains
    log.dispatcher('info', 'Processing custom domain request', {
      hostname,
      requestId,
      operation: 'custom_domain_routing'
    })

    const result = await handleCustomDomainRequest(c, hostname)

    if (result.success && result.response) {
      log.dispatcher('info', 'Custom domain request handled successfully', {
        hostname,
        requestId,
        operation: 'custom_domain_routing'
      })
      return result.response
    }

    log.dispatcher('warn', 'Custom domain request failed', {
      hostname,
      requestId,
      operation: 'custom_domain_routing',
      error: result.error
    })

    return result.response || c.json({
      error: 'Custom domain not configured',
      message: result.error || 'Domain is not configured or verified',
      hostname,
      requestId
    }, 404)

  } catch (error) {
    log.dispatcher('error', 'Domain routing failed', {
      hostname,
      pathname,
      requestId,
      operation: 'domain_routing'
    }, error instanceof Error ? error : undefined)

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return c.json({
      error: 'Internal server error',
      message: errorMessage,
      hostname,
      requestId,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default app
