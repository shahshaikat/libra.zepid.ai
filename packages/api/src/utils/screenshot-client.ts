/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * screenshot-client.ts
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

import { log, tryCatch } from '@libra/common'

/**
 * Screenshot service client for making requests to the screenshot service
 */

interface ScreenshotRequest {
  projectId: string
  planId: string
  orgId: string
  userId: string
  previewUrl?: string
}

interface ScreenshotResponse {
  success: boolean
  screenshotId?: string
  message?: string
  error?: string
}

/**
 * Get screenshot service URL from environment
 */
function getScreenshotServiceUrl(): string {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3009'
  }

  // In production, use the deployed service
  return 'https://screenshot.zepid.dev'
}

/**
 * Submit screenshot request to the screenshot service
 */
/**
 * Normalize URL to ensure it has a protocol prefix
 */
function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;

  // If URL already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For localhost URLs, use http:// instead of https://
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return `http://${url}`;
  }

  // For all other URLs, add https:// prefix
  return `https://${url}`;
}

export async function submitScreenshotRequest(
  projectId: string,
  planId: string,
  orgId: string,
  userId: string,
  previewUrl?: string,
  requestHeaders?: HeadersInit
): Promise<ScreenshotResponse> {
  const screenshotServiceUrl = getScreenshotServiceUrl()

  // Normalize previewUrl to ensure it has a protocol prefix
  const normalizedPreviewUrl = normalizeUrl(previewUrl)

  log.project('info', 'Submitting screenshot request to service', {
    projectId,
    planId,
    orgId,
    userId,
    hasPreviewUrl: !!normalizedPreviewUrl,
    originalUrl: previewUrl,
    normalizedUrl: normalizedPreviewUrl,
    screenshotServiceUrl,
    operation: 'submit_screenshot_request'
  })

  const [result, error] = await tryCatch(async () => {
    const requestBody: ScreenshotRequest = {
      projectId,
      planId,
      orgId,
      userId,
      previewUrl: normalizedPreviewUrl
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Pass through authentication headers if provided
    if (requestHeaders) {
      if (requestHeaders instanceof Headers) {
        const cookieHeader = requestHeaders.get('cookie')
        if (cookieHeader) {
          headers.cookie = cookieHeader
        }
        const authHeader = requestHeaders.get('authorization')
        if (authHeader) {
          headers.authorization = authHeader
        }
      } else if (typeof requestHeaders === 'object') {
        const cookieHeader = (requestHeaders as Record<string, string>).cookie
        if (cookieHeader) {
          headers.cookie = cookieHeader
        }
        const authHeader = (requestHeaders as Record<string, string>).authorization
        if (authHeader) {
          headers.authorization = authHeader
        }
      }
    }

    const response = await fetch(`${screenshotServiceUrl}/screenshot`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Screenshot service error: ${response.status} ${errorText}`)
    }

    const responseData = await response.json() as ScreenshotResponse

    log.project('info', 'Screenshot request submitted successfully', {
      projectId,
      planId,
      screenshotId: responseData.screenshotId,
      operation: 'submit_screenshot_request'
    })

    return responseData
  })

  if (error) {
    log.project('error', 'Failed to submit screenshot request', {
      projectId,
      planId,
      orgId,
      userId,
      operation: 'submit_screenshot_request',
      error: error.message
    }, error)

    return {
      success: false,
      error: error.message
    }
  }

  return result
}

/**
 * Get screenshot status from the screenshot service
 */
export async function getScreenshotStatus(
  screenshotId: string
): Promise<any> {
  const screenshotServiceUrl = getScreenshotServiceUrl()

  log.project('info', 'Getting screenshot status from service', {
    screenshotId,
    screenshotServiceUrl,
    operation: 'get_screenshot_status'
  })

  const [result, error] = await tryCatch(async () => {
    const response = await fetch(`${screenshotServiceUrl}/screenshot-status?id=${encodeURIComponent(screenshotId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Screenshot service error: ${response.status} ${errorText}`)
    }

    return await response.json()
  })

  if (error) {
    log.project('error', 'Failed to get screenshot status', {
      screenshotId,
      operation: 'get_screenshot_status',
      error: error.message
    }, error)

    return {
      success: false,
      error: error.message
    }
  }

  return result
}

/**
 * Check if screenshot service is healthy
 */
export async function checkScreenshotServiceHealth(): Promise<boolean> {
  const screenshotServiceUrl = getScreenshotServiceUrl()

  const [result, error] = await tryCatch(async () => {
    const response = await fetch(`${screenshotServiceUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    return response.ok
  })

  if (error) {
    log.project('warn', 'Screenshot service health check failed', {
      screenshotServiceUrl,
      operation: 'health_check',
      error: error.message
    })
    return false
  }

  return result
}

/**
 * Helper function to replace the old handleAsyncScreenshot function
 * This maintains the same interface but uses the new screenshot service
 */
export async function handleAsyncScreenshotViaService(
  ctx: any,
  projectId: string,
  planId: string,
  organizationId: string,
  previewInfo: any
): Promise<void> {
  if (!previewInfo?.url) {
    throw new Error('Failed to get preview URL from prepared container')
  }

  log.project('info', 'Handling screenshot via service', {
    projectId,
    planId,
    organizationId,
    previewUrl: previewInfo.url,
    operation: 'handle_async_screenshot_via_service'
  })

  try {
    // Prepare request headers for authentication
    const requestHeaders: HeadersInit = {}

    if (ctx.headers) {
      const cookieHeader = ctx.headers.get('cookie')
      if (cookieHeader) {
        (requestHeaders as Record<string, string>).cookie = cookieHeader
      }

      const authHeader = ctx.headers.get('authorization')
      if (authHeader) {
        (requestHeaders as Record<string, string>).authorization = authHeader
      }
    }

    // Submit screenshot request to the service
    const response = await submitScreenshotRequest(
      projectId,
      planId,
      organizationId,
      ctx.session.user.id,
      previewInfo.url,
      requestHeaders
    )

    if (!response.success) {
      throw new Error(`Screenshot service request failed: ${response.error || 'Unknown error'}`)
    }

    log.project('info', 'Screenshot request submitted successfully via service', {
      projectId,
      planId,
      screenshotId: response.screenshotId,
      operation: 'handle_async_screenshot_via_service'
    })

  } catch (error) {
    log.project('error', 'Failed to handle screenshot via service', {
      projectId,
      planId,
      organizationId,
      operation: 'handle_async_screenshot_via_service',
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof Error ? error : undefined)

    // Don't throw - screenshot failure shouldn't break the main flow
    // The screenshot will be processed asynchronously
  }
}
