/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * types.ts
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

// Unified plan type constants to avoid magic strings
export const PLAN_TYPES = {
  FREE: 'zepid free',
  PRO: 'zepid pro',
  MAX: 'zepid max'
} as const

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES]

// Plan limits interface definition
export interface PlanLimits {
  aiNums: number
  seats: number
  projectNums: number
  uploadLimit?: number
  deployLimit?: number
}

// Subscription limit record interface
export interface SubscriptionLimitRecord {
  id: string
  organizationId: string
  planName: string
  planId: string
  aiNums: number
  enhanceNums: number
  uploadLimit: number
  deployLimit: number
  seats: number
  projectNums: number
  isActive: boolean
  periodStart: string
  periodEnd: string
  stripeCustomerId: string | null
  createdAt: string | null
  updatedAt: string
}

// Plan details interface
export interface PlanDetails {
  aiNums: number
  aiNumsLimit: number
  seats: number
  seatsLimit: number
  projectNums: number
  projectNumsLimit: number
  plan: string
  periodEnd: string
  source: 'DB' | 'CONST' // Indicates data source
}

// Usage return interface
export interface SubscriptionUsage {
  aiNums: number
  aiNumsLimit: number
  seats: number
  seatsLimit: number
  projectNums: number
  projectNumsLimit: number
  plan: string
  periodEnd?: string
  planDetails: {
    free: PlanDetails | null
    paid: PlanDetails | null
  }
}