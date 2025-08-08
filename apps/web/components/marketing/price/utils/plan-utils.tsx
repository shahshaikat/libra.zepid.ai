/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * plan-utils.tsx
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

import { User, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ApiPlan, Plan } from '../types'

export function transformApiPlanToPlan(
  plan: ApiPlan,
  isAuthenticated: boolean,
  handleUpgradeSubscription: (planName: string, seats: number) => Promise<void>,
  handleManageSubscription?: () => Promise<void>,
  hasPaidSubscription?: boolean
): Plan {
  let icon: ReactNode = undefined
  if (plan.group === 'team') {
    icon = <User className='size-4' />
  } else if (plan.group === 'enterprise') {
    icon = <Users className='size-4' />
  }

  const isFree = plan.name.toLowerCase().includes('free')
  const isPro = plan.name.toLowerCase().includes('pro')
  const isCurrentPlan = plan.isCurrentPlan || false

  // If user has any paid subscription and current plan is not free, show manage subscription button
  const shouldShowManageButton = hasPaidSubscription && !isFree && handleManageSubscription

  const ctaConfig = {
    variant: !isPro ? 'glow' as const : 'default' as const,
    label: shouldShowManageButton ? 'Manage Subscribe' : (isFree ? 'Start for Free' : 'Get Started'),
  }

  const basePlan = {
    id: plan.id,
    name: plan.name,
    description: plan.description || '',
    icon: icon,
    monthlyPrice: plan.monthlyPrice || 0,
    yearlyPrice: plan.yearlyPrice || 0,
    seats: plan.seats || 1,
    features: plan.features || [],
    marketingFeatures: plan.marketingFeatures || [],
    variant: (plan.variant as Plan['variant']) || 'default',
    isEnterprise: plan.isEnterprise || false,
    isCurrentPlan: plan.isCurrentPlan || false,
  }

  if (isAuthenticated) {
    return {
      ...basePlan,
      cta: {
        ...ctaConfig,
        onClick: shouldShowManageButton
          ? handleManageSubscription
          : () => handleUpgradeSubscription(plan.name, plan.seats || 1)
      }
    }
  }

  return {
    ...basePlan,
    cta: {
      ...ctaConfig,
      href: isFree ? '/login' : '/login',
    }
  }
}

export function createEnterprisePlan(): Plan {
  return {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For custom requirements, dedicated support, SSO and data protection',
    icon: <Users className='size-4' />,
    monthlyPrice: 0,
    yearlyPrice: 0,
    seats: -1,
    cta: {
      variant: 'glow' as const,
      label: 'Contact Us',
      href: 'mailto:contact@libra.dev'
    },
    features: [
      'All Premium features',
      'Dedicated customer support',
      'Custom integration solutions',
      'Service Level Agreement (SLA)',
      'Single Sign-On (SSO)',
      'Advanced data protection options',
    ],
    marketingFeatures: [
      'Dedicated deployment solutions',
      'Compliance and audit support',
      'Custom training and consulting services',
      'Dedicated technical support',
    ],
    variant: 'enterprise',
    isEnterprise: true,
  }
}