/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * custom-domain.ts
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

import type { Context } from 'hono'
import { tryCatch } from '@libra/common'
import { getProjectByCustomDomain, validateCustomDomainProject, type CustomDomainProject } from '@libra/db'
import { getPostgresDb } from '../db-postgres'

import type { CloudflareBindings, ContextVariables } from '../types'

type Bindings = CloudflareBindings
type Variables = ContextVariables

export interface CustomDomainResult {
  success: boolean
  response?: Response
  error?: string
  project?: CustomDomainProject
}

/**
 * Check if a hostname is a custom domain (not zapid.dev)
 * @param hostname The hostname to check
 * @returns True if it's a custom domain, false if it's zapid.dev
 */
export function isCustomDomain(hostname: string): boolean {
  // Check if hostname ends with zapid.dev
  const isCustom = !hostname.endsWith('zapid.dev')
  return isCustom
}

/**
 * Handle custom domain request by looking up project and forwarding to production URL
 * @param c Hono context
 * @param hostname The custom domain hostname
 * @returns Response or error result
 */
export async function handleCustomDomainRequest(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  hostname: string
): Promise<CustomDomainResult> {
  const requestId = c.get('requestId') || crypto.randomUUID()



  // Get database connection using unified getPostgresDb function
  const db = await getPostgresDb(c)

  try {
    // Use unified database connection
    const [dbResult, dbError] = await tryCatch(async () => {
      // Query PostgreSQL database using unified function
      return await getProjectByCustomDomain(db, hostname)
    })

    if (dbError || !dbResult) {
      return {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Database operation failed',
        response: c.json({
          error: 'Database error',
          message: 'Failed to query custom domain',
          domain: hostname,
          requestId
        }, 500)
      }
    }

    if (!dbResult.success || !dbResult.project) {
      return {
        success: false,
        error: dbResult.error || 'Custom domain not found or not verified',
        response: c.json({
          error: 'Custom domain not found',
          message: `The domain '${hostname}' is not configured or not verified`,
          domain: hostname,
          requestId
        }, 404)
      }
    }

    const project = dbResult.project

    // Validate project configuration using @libra/db function
    const validation = validateCustomDomainProject(project)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Domain validation failed',
        response: c.json({
          error: 'Custom domain configuration invalid',
          message: validation.error,
          domain: hostname,
          requestId
        }, 403)
      }
    }


    // Forward request to production deploy URL
    const [forwardResult, forwardError] = await tryCatch(async () => {
      if (!project.productionDeployUrl) {
        throw new Error('Production deploy URL is not configured')
      }
      return await forwardRequestToProductionUrl(c, project.productionDeployUrl, requestId)
    })

    if (forwardError || !forwardResult) {
      return {
        success: false,
        error: forwardError instanceof Error ? forwardError.message : 'Request forwarding failed',
        response: c.json({
          error: 'Service temporarily unavailable',
          message: 'Failed to forward request to application',
          domain: hostname,
          requestId
        }, 502)
      }
    }

    return {
      success: true,
      response: forwardResult,
      project
    }
  } finally {
    // Clean up database connection
    c.executionCtx.waitUntil(db.$client.end())
  }
}

/**
 * Forward the original request to the production deploy URL
 * @param c Hono context
 * @param productionUrl The production deploy URL to forward to
 * @param requestId Request ID for logging
 * @returns Response from the production URL
 */
async function forwardRequestToProductionUrl(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  productionUrl: string,
  requestId: string
): Promise<Response> {
  // Parse the original request URL
  const originalUrl = new URL(c.req.url)

  // Parse the production URL
  const targetUrl = new URL(productionUrl)

  // Construct the target URL with original path and query parameters
  const forwardUrl = new URL(originalUrl.pathname + originalUrl.search, targetUrl.origin)


  // Get request body for non-GET/HEAD requests
  const hasBody = c.req.method !== 'GET' && c.req.method !== 'HEAD'
  const requestBody = hasBody ? c.req.raw.body : null

  // Create new request with the same method, headers, and body
  const forwardRequest = new Request(forwardUrl.href, {
    method: c.req.method,
    headers: c.req.header(),
    body: requestBody,
  })

  // Add custom headers for debugging and tracking
  forwardRequest.headers.set('X-Forwarded-Host', originalUrl.hostname)
  forwardRequest.headers.set('X-Forwarded-Proto', originalUrl.protocol.slice(0, -1))
  forwardRequest.headers.set('X-Request-ID', requestId)
  forwardRequest.headers.set('X-Custom-Domain', 'true')

  // Forward the request
  const response = await fetch(forwardRequest)

  // Log the response status

  return response
}

/**
 * Extract the base domain from a hostname (remove subdomain)
 * @param hostname The hostname to process
 * @returns Base domain without subdomain
 */
export function extractBaseDomain(hostname: string): string {
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  return hostname
}
