/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * cloudflare-workers.ts
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
import { env } from '../../env.mjs'

/**
 * Configuration for Cloudflare Workers for Platforms API
 */
const CLOUDFLARE_CONFIG = {
  baseUrl: 'https://api.cloudflare.com/client/v4',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const

/**
 * Error types for worker operations
 */
export type WorkerOperationError =
  | 'WORKER_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'CONFIG_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Result of worker deletion operation
 */
export interface WorkerDeletionResult {
  success: boolean
  workerName: string
  error?: {
    type: WorkerOperationError
    message: string
    originalError?: unknown
  }
}

/**
 * Generate worker name using the correct deployment naming convention
 * Based on actual deployment logic: ${projectId}-worker
 */
function generateWorkerName(projectId: string): string {
  // Worker name format: {projectId}-worker
  return `${projectId}-worker`
}

/**
 * Classify error type based on HTTP status and response
 */
function classifyError(status: number, responseText: string): WorkerOperationError {
  if (status === 404) {
    return 'WORKER_NOT_FOUND'
  }
  if (status === 401 || status === 403) {
    return 'PERMISSION_DENIED'
  }
  if (status >= 500) {
    return 'NETWORK_ERROR'
  }
  return 'UNKNOWN_ERROR'
}

/**
 * Delete a worker from Cloudflare Workers for Platforms
 */
export async function deleteWorkerForPlatforms(
  workerName: string,
  context: {
    orgId: string
    projectId: string
    operation: string
  }
): Promise<WorkerDeletionResult> {
  const { orgId, projectId, operation } = context

  log.project('info', 'Starting worker deletion', {
    orgId,
    projectId,
    operation,
    workerName,
  })

  // Validate configuration
  const accountId = env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = env.CLOUDFLARE_API_TOKEN
  const dispatchNamespace = env.DISPATCH_NAMESPACE_NAME || 'zepid-dispatcher'

  if (!accountId || !apiToken) {
    const error = {
      type: 'CONFIG_ERROR' as WorkerOperationError,
      message: 'Cloudflare API credentials not configured'
    }

    log.project('error', 'Worker deletion failed - missing configuration', {
      orgId,
      projectId,
      operation,
      workerName,
      error: error.message,
    })

    return {
      success: false,
      workerName,
      error
    }
  }

  const [result, requestError] = await tryCatch(async () => {
    const url = `${CLOUDFLARE_CONFIG.baseUrl}/accounts/${accountId}/workers/dispatch/namespaces/${dispatchNamespace}/scripts/${workerName}`

    log.project('info', 'Calling Cloudflare Workers API for deletion', {
      orgId,
      projectId,
      operation,
      workerName,
      dispatchNamespace,
      accountId: accountId.substring(0, 8) + '...', // Log partial account ID for debugging
    })

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(CLOUDFLARE_CONFIG.timeout),
    })

    if (!response.ok) {
      const responseText = await response.text()
      const errorType = classifyError(response.status, responseText)

      // Don't treat "worker not found" as an error - it might already be deleted
      if (errorType === 'WORKER_NOT_FOUND') {
        log.project('info', 'Worker not found during deletion (may already be deleted)', {
          orgId,
          projectId,
          operation,
          workerName,
          status: response.status,
        })

        return {
          success: true,
          workerName,
        }
      }

      throw new Error(`Cloudflare API error: ${response.status} ${responseText}`)
    }

    const responseData = await response.json()

    log.project('info', 'Worker deleted successfully', {
      orgId,
      projectId,
      operation,
      workerName,
      dispatchNamespace,
    })

    return {
      success: true,
      workerName,
    }
  })

  if (requestError) {
    const errorType: WorkerOperationError = requestError.name === 'AbortError'
      ? 'NETWORK_ERROR'
      : 'UNKNOWN_ERROR'

    const error = {
      type: errorType,
      message: requestError.message,
      originalError: requestError
    }

    log.project('error', 'Worker deletion failed', {
      orgId,
      projectId,
      operation,
      workerName,
      error: requestError.message,
      errorType,
    })

    return {
      success: false,
      workerName,
      error
    }
  }

  return result
}

/**
 * Delete worker by project information
 * Generates worker name using project ID only: {projectId}-worker
 */
export async function deleteProjectWorker(
  projectId: string,
  context: {
    orgId: string
    operation: string
  }
): Promise<WorkerDeletionResult> {
  const workerName = generateWorkerName(projectId)

  return deleteWorkerForPlatforms(workerName, {
    ...context,
    projectId,
  })
} 