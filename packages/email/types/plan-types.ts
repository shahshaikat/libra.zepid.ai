/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * plan-types.ts
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
 * Plan types for email templates
 */
export const PLAN_TYPES = {
  FREE: 'zepid free',
  PRO: 'zepid pro',
  MAX: 'zepid max',
} as const;

/**
 * Plan type union type
 */
export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES];

/**
 * Plan benefits interface for email templates
 */
export interface PlanBenefits {
  /**
   * List of features for the plan
   */
  features: string[];

  /**
   * Marketing description for the plan
   */
  description: string;

  /**
   * Call to action text
   */
  ctaText: string;

  /**
   * Welcome message
   */
  welcomeMessage: string;
}

/**
 * Plan configuration interface for email templates
 */
export interface PlanConfig {
  /**
   * Plan benefits
   */
  benefits: PlanBenefits;

  /**
   * Plan price information
   */
  pricing: {
    /**
     * Monthly price
     */
    monthly: number;

    /**
     * Yearly price
     */
    yearly: number;

    /**
     * Currency
     */
    currency: string;
  };

  /**
   * Plan limits
   */
  limits: {
    /**
     * Number of projects
     */
    projects: number;

    /**
     * Number of AI messages
     */
    aiMessages: number;

    /**
     * Number of team seats
     */
    seats: number;
  };
}

/**
 * Plan configuration map
 */
export type PlanConfigMap = Record<PlanType, PlanConfig>;
