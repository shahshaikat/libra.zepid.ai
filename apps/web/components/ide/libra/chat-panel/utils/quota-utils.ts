/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * quota-utils.ts
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

/**
 * Utility functions for checking quota status and limits
 */

// Type definition for usage data
export interface UsageData {
  aiNums: number
  aiNumsLimit: number
  seats: number
  seatsLimit: number
  projectNums: number
  projectNumsLimit: number
  plan: string
  periodEnd?: Date
  planDetails: {
    free: {
      aiNums: number
      aiNumsLimit: number
      seats: number
      seatsLimit: number
      projectNums: number
      projectNumsLimit: number
      plan: string
      periodEnd: Date
      source: 'DB' | 'CONST'
    } | null
    paid: {
      aiNums: number
      aiNumsLimit: number
      seats: number
      seatsLimit: number
      projectNums: number
      projectNumsLimit: number
      plan: string
      periodEnd: Date
      source: 'DB' | 'CONST'
    } | null
  }
}

/**
 * Check if AI quota is exceeded based on usage data
 * @param usageData - The subscription usage data
 * @returns true if quota is exceeded, false otherwise
 */
export function isQuotaExceeded(usageData: UsageData | null | undefined): boolean {
  if (!usageData) {
    return false // If no data, assume quota is not exceeded
  }

  // Check if AI quota is exhausted
  // aiNums represents remaining quota, so if it's 0 or less, quota is exceeded
  return usageData.aiNums <= 0
}

/**
 * Check if user is on a free plan
 * @param usageData - The subscription usage data
 * @returns true if user is on free plan, false otherwise
 */
export function isFreePlan(usageData: UsageData | null | undefined): boolean {
  if (!usageData) {
    return true // Default to free plan if no data
  }

  return usageData.plan === 'zepid free' || usageData.plan.toLowerCase().includes('free')
}

/**
 * Get remaining AI quota count
 * @param usageData - The subscription usage data
 * @returns number of remaining AI messages
 */
export function getRemainingQuota(usageData: UsageData | null | undefined): number {
  if (!usageData) {
    return 0
  }

  return Math.max(0, usageData.aiNums)
}

/**
 * Get total AI quota limit
 * @param usageData - The subscription usage data
 * @returns total AI message limit
 */
export function getTotalQuota(usageData: UsageData | null | undefined): number {
  if (!usageData) {
    return 0
  }

  return usageData.aiNumsLimit
}

/**
 * Calculate quota usage percentage
 * @param usageData - The subscription usage data
 * @returns percentage of quota used (0-100)
 */
export function getQuotaUsagePercentage(usageData: UsageData | null | undefined): number {
  if (!usageData || usageData.aiNumsLimit === 0) {
    return 0
  }

  const used = usageData.aiNumsLimit - usageData.aiNums
  return Math.min(100, Math.max(0, (used / usageData.aiNumsLimit) * 100))
}

/**
 * Check if quota is running low (less than 20% remaining)
 * @param usageData - The subscription usage data
 * @returns true if quota is running low, false otherwise
 */
export function isQuotaRunningLow(usageData: UsageData | null | undefined): boolean {
  if (!usageData) {
    return false
  }

  const percentage = getQuotaUsagePercentage(usageData)
  return percentage >= 80 // 80% used means 20% or less remaining
}
