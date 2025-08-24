/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * container.ts
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

import type { FileStructure } from '@libra/common'
import { buildFiles as buildFilesWithHistory, tryCatch } from '@libra/common'
import { project, hasPremiumMembership } from '@libra/db'
import { templateConfigs } from '@libra/templates'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull, or, like } from 'drizzle-orm'
// Import sandbox abstraction layer
import {
  getSandboxFactory,
  type ISandbox,
  initializeSandboxFactory,
  createConfigFromEnvironment,
  type SandboxProviderType,
  CONTAINER_TIMEOUTS,
  TEMPLATE_MAPPINGS,
  getTimeoutForUserTier
} from '@libra/sandbox'
// Keep E2B import as fallback
import Sandbox from 'e2b'
import { isExcludedFile } from './excludedFiles'
import { getBusinessDb, parseMessageHistory, requireOrgAndUser } from './project'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { captureAndStoreScreenshot } from './screenshot-service'
import { env } from "../../env.mjs";

/**
 * Sandbox cleanup result interface
 */
export interface SandboxCleanupResult {
  success: boolean
  containerId: string
  error?: string
}

/**
 * Sandbox termination options
 */
export interface TerminationOptions {
  timeoutMs?: number
  retryCount?: number
  maxRetries?: number
}

/**
 * Global flag to track if sandbox factory is initialized
 */
let sandboxFactoryInitialized = false

/**
 * Get the default sandbox provider from configuration or environment
 * Uses a hybrid approach: factory config first, then environment variable, then fallback to 'e2b'
 *
 * @returns {SandboxProviderType} The selected sandbox provider type
 * @throws {Error} Never throws - always returns a valid provider with fallback
 */
function getDefaultSandboxProvider(): SandboxProviderType {
  try {
    // Try to get from initialized factory first
    if (sandboxFactoryInitialized) {
      const factory = getSandboxFactory()
      const defaultProvider = factory.getConfig().defaultProvider
      if (defaultProvider) {
        return defaultProvider
      }
    }
  } catch (error) {
    // Failed to get provider from factory, falling back to environment
  }

  // Fallback to environment variable
  const envProvider = process.env.NEXT_PUBLIC_SANDBOX_DEFAULT_PROVIDER as SandboxProviderType
  if (envProvider && (envProvider === 'e2b' || envProvider === 'daytona')) {
    return envProvider
  }

  // Final fallback to e2b
  return 'e2b'
}

/**
 * Check if error indicates sandbox not found (should create new instead of recover)
 */
function isSandboxNotFoundError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || error.status

  // Check for common "not found" indicators
  return (
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('sandbox not found') ||
    errorMessage.includes('container not found') ||
    errorCode === 404 ||
    errorCode === 'NOT_FOUND' ||
    // E2B specific not found errors
    errorMessage.includes('sandbox with id') && errorMessage.includes('not found')
  )
}

/**
 * Initialize sandbox factory if not already initialized
 *
 * @returns {Promise<boolean>} True if factory is available, false if fallback to E2B is needed
 */
async function ensureSandboxFactory(): Promise<boolean> {
  if (sandboxFactoryInitialized) {
    return true
  }

  try {
    const config = createConfigFromEnvironment()
    await initializeSandboxFactory(config)
    sandboxFactoryInitialized = true
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get sandbox instance using abstraction layer with fallback to direct E2B
 *
 * @param operation - The sandbox operation to perform
 * @param templateOrId - Template name for create, or sandbox ID for connect/resume
 * @param options - Optional configuration including timeout
 * @returns {Promise<any>} Sandbox instance (ISandbox or native E2B)
 * @throws {Error} If both abstraction layer and E2B fallback fail
 */
export async function getSandboxInstance(
  operation: 'create' | 'connect' | 'resume',
  templateOrId: string,
  options: { timeoutMs?: number } = {}
): Promise<any> {
  const provider = getDefaultSandboxProvider()

  const factoryAvailable = await ensureSandboxFactory()

  if (factoryAvailable) {
    try {
      const factory = getSandboxFactory()
      let sandbox: ISandbox


      switch (operation) {
        case 'create':
          sandbox = await factory.createSandbox({
            provider,
            template: templateOrId,
            timeoutMs: options.timeoutMs
          })
          break
        case 'connect':
          sandbox = await factory.connectToSandbox(templateOrId, provider, {
            timeoutMs: options.timeoutMs
          })
          break
        case 'resume':
          sandbox = await factory.resumeSandbox(templateOrId, provider, {
            timeoutMs: options.timeoutMs
          })
          break
        default:
          throw new Error(`Unknown sandbox operation: ${operation}`)
      }

      return sandbox
    } catch (error) {
      // Abstraction layer operation failed, falling back to E2B
    }
  }

  let sandbox: any
  try {
    switch (operation) {
      case 'create':
        sandbox = await Sandbox.create(templateOrId, { timeoutMs: options.timeoutMs })
        break
      case 'connect':
        sandbox = await Sandbox.connect(templateOrId)
        break
      case 'resume':
        sandbox = await Sandbox.resume(templateOrId, { timeoutMs: options.timeoutMs })
        break
      default:
        throw new Error(`Unknown sandbox operation: ${operation}`)
    }

    return sandbox
  } catch (error) {
    throw error
  }
}

/**
 * Prepare and manage project container
 * Handle container creation, recovery, and file synchronization
 */
export async function prepareContainer(
  ctx: any,
  projectId: string,
  projectData: { containerId?: string; messageHistory: string }
): Promise<any> {
  const envProvider = env.NEXT_PUBLIC_SANDBOX_DEFAULT_PROVIDER as SandboxProviderType
  // Use unified configuration for template selection
  const TEMPLATE = TEMPLATE_MAPPINGS.getTemplateForProvider(envProvider || 'e2b', 'basic')

  // Get organization and user information
  const { orgId } = await requireOrgAndUser(ctx)
  const db = await getBusinessDb()

  // Determine user tier based on premium membership status
  const isPremium = await hasPremiumMembership(orgId)
  const userTier: 'FREE' | 'PAID' = isPremium ? 'PAID' : 'FREE'

  // Get dynamic timeout based on user tier
  const TIMEOUT_MS = getTimeoutForUserTier(userTier)

  const containerId = projectData.containerId
  let container: ISandbox

  if (containerId) {
    const [resumeResult, resumeError] = await tryCatch(async () =>
      getSandboxInstance('resume', containerId, { timeoutMs: TIMEOUT_MS })
    )

    if (resumeError) {
      // Check if this is a "not found" error - if so, create new instead of recovery
      if (isSandboxNotFoundError(resumeError)) {

        // Clear the old container ID and create new
        await db
          .update(project)
          .set({ containerId: "" })
          .where(eq(project.id, projectId))

        container = await createNewContainer(db, projectId, TEMPLATE, TIMEOUT_MS)
      } else {
        // For other errors, try recovery
        container = await handleContainerRecovery(db, projectId, containerId, TEMPLATE, TIMEOUT_MS)
      }
    } else {
      container = resumeResult
    }
  } else {
    container = await createNewContainer(db, projectId, TEMPLATE, TIMEOUT_MS)
  }

  await syncFilesToContainer(container, projectData.messageHistory)
  return container
}

/**
 * Handle container recovery failure cases
 */
async function handleContainerRecovery(
  db: any,
  projectId: string,
  oldContainerId: string,
  template: string,
  timeoutMs: number
): Promise<any> {
  // Successfully acquired lock, create new sandbox
  return await createSandboxWithLock(db, projectId, template, timeoutMs)
}

/**
 * Create new container
 */
async function createNewContainer(
  db: any,
  projectId: string,
  template: string,
  timeoutMs: number
): Promise<any> {
  // Successfully acquired lock, create new sandbox
  return await createSandboxWithLock(db, projectId, template, timeoutMs)
}

/**
 * Create Sandbox after acquiring lock
 */
async function createSandboxWithLock(
  db: any,
  projectId: string,
  template: string,
  timeoutMs: number
): Promise<any> {

  const [sandbox, sandboxError] = await tryCatch(async () =>
    getSandboxInstance('create', template, { timeoutMs })
  )

  if (sandboxError) {
    throw sandboxError
  }

  const containerId = sandbox.sandboxId || sandbox.id

  // Update to the actual containerId
  const [updateResult, updateError] = await tryCatch(async () =>
    db
      .update(project)
      .set({ containerId })
      .where(and(
        eq(project.id, projectId),
        or(isNull(project.containerId), eq(project.containerId, ''))
      ))
      .returning()
  )

  if (updateError) {
    // Clean up the placeholder on update failure
    // Destroy sandbox
    const sandboxId = sandbox.sandboxId || sandbox.id
    const [cleanupResult, cleanupError] = await tryCatch(async () =>
      terminateSandbox(sandboxId)
    )

    throw updateError
  }
  // Return the sandbox (already native instance from getSandboxInstance)
  return sandbox
}

/**
 * Synchronize files to container
 */
async function syncFilesToContainer(container: ISandbox, messageHistory: string): Promise<void> {
  const [, syncError] = await tryCatch(async () => {
    const initFiles = templateConfigs.vite as FileStructure
    const history = parseMessageHistory(messageHistory)
    const { fileMap } = buildFilesWithHistory(initFiles, history) || { fileMap: {} }

    const filesToWrite = Object.entries(fileMap)
      .filter(([path]) => !isExcludedFile(path))
      .map(([path, fileInfo]) => ({
        path: `/home/user/vite-shadcn-template-libra/${path}`,
        data:
          fileInfo.type === 'file' && !fileInfo.isBinary
            ? fileInfo.content
            : JSON.stringify(fileInfo.content),
      }))

    // Check if container is an abstraction layer instance (ISandbox)
    if (container.writeFiles && typeof container.writeFiles === 'function') {
      // Use abstraction layer method
      const sandboxFiles = filesToWrite.map(file => ({
        path: file.path,
        content: file.data,
        isBinary: false
      }))

      const result = await container.writeFiles(sandboxFiles)

      // Check for errors in the result
      if (!result.success) {
        const errorDetails = result.results
          .filter((r: { success: boolean }) => !r.success)
          .map((r: { path?: string; error?: string }) => `${r.path || 'Unknown path'}: ${r.error || 'Unknown error'}`)
          .join(', ')
        throw new Error(`Failed to sync files: ${errorDetails}`)
      }
    }
    // Fallback for native E2B container
    // else if (container.files && container.files.write) {
    //   await container.files.write(filesToWrite)
    // }
    // No supported file writing method
    else {
      throw new Error('Container does not support file writing operations')
    }
  })

  if (syncError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to sync files to container',
    })
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || error.status

  // Network errors are retryable
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('enotfound')
  ) {
    return true
  }

  // HTTP status codes that are retryable
  if (
    errorCode === 429 || // Rate limit
    errorCode === 502 || // Bad gateway
    errorCode === 503 || // Service unavailable
    errorCode === 504
  ) {
    // Gateway timeout
    return true
  }

  // E2B specific retryable errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('temporarily unavailable')) {
    return true
  }

  return false
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(retryCount: number): number {
  // Base delay of 1 second, exponentially increasing
  const baseDelay = 1000
  const maxDelay = 30000 // Max 30 seconds

  const delay = Math.min(baseDelay * 2 ** retryCount, maxDelay)

  // Add some jitter to avoid thundering herd
  const jitter = Math.random() * 0.1 * delay

  return Math.floor(delay + jitter)
}

/**
 * Terminate a sandbox and clean up resources
 */
export async function terminateSandbox(
  containerId: string,
  options: TerminationOptions = {}
): Promise<SandboxCleanupResult> {
  // Use unified configuration for default timeout
  const { timeoutMs = CONTAINER_TIMEOUTS.API_DEFAULT, retryCount = 0, maxRetries = 3 } = options

  if (!containerId || containerId.startsWith('pending-')) {
    return {
      success: true,
      containerId,
      error: 'Placeholder container ID, no actual sandbox to terminate',
    }
  }

  const [result, terminationError] = await tryCatch(async () => {
    // Try to use abstraction layer first
    const factoryAvailable = await ensureSandboxFactory()

    if (factoryAvailable) {
      try {
        const factory = getSandboxFactory()
        const terminationResult = await factory.getProvider(getDefaultSandboxProvider()).terminate(containerId, {
          timeoutMs,
          retryCount,
          maxRetries
        })
        return terminationResult
      } catch (abstractionError) {
        // Abstraction layer termination failed, falling back to direct E2B
      }
    }

    // Fallback to direct E2B termination
    await Sandbox.kill(containerId, { requestTimeoutMs: timeoutMs })
    return { success: true, sandboxId: containerId }
  })

  if (terminationError) {

    // Determine if this is a retryable error
    const isRetryable = isRetryableError(terminationError)

    if (isRetryable && retryCount < maxRetries) {
      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, getRetryDelay(retryCount)))

      return terminateSandbox(containerId, {
        ...options,
        retryCount: retryCount + 1,
      })
    }

    return {
      success: false,
      containerId,
      error: terminationError.message || 'Unknown termination error',
    }
  }

  if (result?.success) {
    return {
      success: true,
      containerId,
      error: result.error
    }
  }

  return {
    success: true,
    containerId,
    error: 'Sandbox not found or already terminated',
  }
}

/**
 * Verify that a sandbox has been properly cleaned up
 */
export async function verifySandboxCleanup(
  containerId: string,
  timeoutMs = 10_000
): Promise<boolean> {
  if (!containerId || containerId.startsWith('pending-')) {
    // Placeholder IDs don't have actual sandboxes
    return true
  }

  const [sandboxList, listError] = await tryCatch(async () => {
    // Try to use abstraction layer first
    const factoryAvailable = await ensureSandboxFactory()

    if (factoryAvailable) {
      try {
        const factory = getSandboxFactory()
        const sandboxes = await factory.getProvider(getDefaultSandboxProvider()).list()
        return sandboxes
      } catch (abstractionError) {
        // Abstraction layer list failed, falling back to direct E2B
      }
    }

    // Fallback to direct E2B listing
    return Sandbox.list({ requestTimeoutMs: timeoutMs })
  })

  if (listError) {
    // If we can't verify, assume cleanup failed
    return false
  }

  // Check if the sandbox still exists in the list
  const [sandboxExists, checkError] = await tryCatch(async () => {
    if (sandboxList && Array.isArray(sandboxList)) {
      // Abstraction layer returns array directly
      return sandboxList.some(
        (sandbox: any) => sandbox.id === containerId
      )
    }

    if (sandboxList && typeof sandboxList === 'object') {
      // Direct E2B returns a paginator, we need to get the items
      const items = (sandboxList as any).items || sandboxList
      if (Array.isArray(items)) {
        return items.some(
          (sandbox: any) => sandbox.sandboxId === containerId || sandbox.id === containerId
        )
      }
    }

    return false
  })

  if (checkError) {
    return false
  }

  if (sandboxExists) {
    return false
  }

  return true
}

/**
 * Helper function to handle async screenshot operation with proper waitUntil
 * Uses prepareContainer to ensure sandbox state reflects complete message history
 */
export const handleAsyncScreenshot = async (
  ctx: any,
  projectId: string,
  planId: string,
  organizationId: string,
  previewInfo: any
) => {
  if (!previewInfo?.url) {
      throw new Error('Failed to get preview URL from prepared container')
  }
  const screenshotPromise = (async () => {
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

          // Call screenshot service with prepared preview URL
          return await captureAndStoreScreenshot({
              projectId,
              planId,
              userId: ctx.session.user.id,
              organizationId: organizationId,
              requestHeaders,
              previewUrl: previewInfo.url
          })
      } catch (error) {
          throw error
      }
  })

  try {
      // Try to use Cloudflare Workers waitUntil
      const cloudflareContext = await getCloudflareContext({async: true})
      const executionContext = cloudflareContext.ctx

      if (executionContext?.waitUntil) {
          executionContext.waitUntil(screenshotPromise())
          return
      }
  } catch (contextError) {
      // Cloudflare context not available, using Promise fallback
  }
}