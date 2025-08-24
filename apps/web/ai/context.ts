/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * context.ts
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

import { api } from '@/trpc/server'
import {
  checkAndUpdateAIMessageUsage,
  checkAndUpdateEnhanceUsage,
  getSubscriptionUsage,
} from '@libra/auth/utils/subscription-limits'
import { type HistoryType, buildFiles as buildFilesWithHistory, tryCatch, DatabaseError } from '@libra/common'
import { buildFilesToXml, buildSingleFileXml } from './files'
import type { ProjectData, GenerationConfig, GenerationContext } from './types'

// ============================================================================
// Context Building and Data Fetching
// ============================================================================

/**
 * Fetch and validate project data using tRPC
 */
export const fetchProjectData = async (projectId: string): Promise<ProjectData> => {
  const [projectData, projectError] = await tryCatch(async () =>
    api.project.getById({ id: projectId })
  )

  if (projectError) {
    throw projectError
  }

  if (!projectData) {
    throw new Error('Sandbox not found')
  }

  return projectData
}

/**
 * Check quota and validate usage permissions
 */
export const validateQuota = async (
  organizationId: string,
  quotaType: 'ai' | 'enhance'
): Promise<void> => {
  const checkFunction = quotaType === 'ai' ? checkAndUpdateAIMessageUsage : checkAndUpdateEnhanceUsage
  const errorMessage = quotaType === 'ai'
    ? 'AI quota exceeded'
    : 'Enhance quota exceeded. Please upgrade your plan or wait for next billing cycle.'

  const [canUse, quotaError] = await tryCatch(async () => checkFunction(organizationId))
  if (quotaError) throw quotaError
  if (!canUse) throw new Error(errorMessage)
}

/**
 * Get user subscription plan
 */
export const getUserPlan = async (organizationId: string): Promise<string> => {
  const [usageData, usageError] = await tryCatch(async () =>
    getSubscriptionUsage(organizationId)
  )
  if (usageError) {
    // If it's a database error, throw the user-friendly version
    if (usageError instanceof DatabaseError) {
      throw new Error(usageError.userMessage)
    }
    throw usageError
  }
  return usageData?.plan || 'zepid free'
}

/**
 * Build file map with history
 */
export const buildFileMapWithHistory = async (projectData: ProjectData): Promise<Record<string, any>> => {
  const [initFiles, fileTreeError] = await tryCatch(async () => api.file.getFileTree())
  if (fileTreeError) throw fileTreeError

  const initialMessages = JSON.parse(projectData?.messageHistory || '[]') as HistoryType
  const { fileMap } = buildFilesWithHistory(initFiles, initialMessages)
  return fileMap
}

/**
 * Build generation context from project data
 */
export const buildGenerationContext = async (
  projectData: ProjectData,
  config: GenerationConfig
): Promise<GenerationContext> => {
  try {
    const userPlan = await getUserPlan(projectData.organizationId)
    const fileMap = await buildFileMapWithHistory(projectData)

    let xmlFiles: string
    if (config.isFileEdit && config.targetFilename) {
      xmlFiles = buildSingleFileXml(fileMap, config.targetFilename, projectData.id)
    } else {
      xmlFiles = buildFilesToXml(fileMap, projectData.id)
    }

    return {
      projectData,
      userPlan,
      fileMap,
      xmlFiles,
    }
  } catch (error) {
    // Re-throw with context for better error tracking
    if (error instanceof Error) {
      throw new Error(`Failed to build AI generation context: ${error.message}`)
    }
    throw error
  }
}
