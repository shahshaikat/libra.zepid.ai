/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * upgrade-tooltip.tsx
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

'use client'

import * as m from '@/paraglide/messages'
import { ArrowUpRight, Crown, Sparkles } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@libra/ui/components/tooltip'
import { Button } from '@libra/ui/components/button'
import { PLAN_TYPES, type AIModel } from '@/configs/ai-models'
import { cn } from '@libra/ui/lib/utils'

interface UpgradeTooltipProps {
  model: AIModel
  children: React.ReactNode
}

export const UpgradeTooltip = ({ model, children }: UpgradeTooltipProps) => {
  const getPlanInfo = (requiredPlan: string) => {
    switch (requiredPlan) {
      case PLAN_TYPES.PRO:
        return {
          name: 'Zepid Pro',
          icon: Crown,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          features: [
            m["chatPanel.modelItem.upgradeTooltip.planFeatures.pro1"](),
            m["chatPanel.modelItem.upgradeTooltip.planFeatures.pro2"](),
            m["chatPanel.modelItem.upgradeTooltip.planFeatures.pro3"]()
          ]
        }
      case PLAN_TYPES.MAX:
        return {
          name: 'Zepid Max',
          icon: Sparkles,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          features: [
            m["chatPanel.modelItem.upgradeTooltip.planFeatures.max1"](),
            m["chatPanel.modelItem.upgradeTooltip.planFeatures.max2"](),
            m["chatPanel.modelItem.upgradeTooltip.planFeatures.max3"](),
            m["chatPanel.modelItem.upgradeTooltip.planFeatures.max4"]()
          ]
        }
      default:
        return null
    }
  }

  const planInfo = getPlanInfo(model.requiredPlan)
  if (!planInfo) return children

  const Icon = planInfo.icon

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Navigate to upgrade page
  }

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        className={cn(
          'max-w-xs p-0 border-0 shadow-xl',
          'bg-white dark:bg-gray-900',
          'rounded-lg overflow-hidden'
        )}
        sideOffset={8}
      >
        <div className={cn(
          'p-4 space-y-3',
          planInfo.bgColor,
          planInfo.borderColor,
          'border'
        )}>
          {/* Header */}
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', planInfo.color)} />
            <span className={cn('font-semibold text-sm', planInfo.color)}>
              {m["chatPanel.modelItem.upgradeTooltip.requiresPlan"]({ plan: planInfo.name })}
            </span>
          </div>

          {/* Model Info */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {model.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {m["chatPanel.modelItem.upgradeTooltip.description"]({ plan: planInfo.name })}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {m["chatPanel.modelItem.upgradeTooltip.upgradeToAccess"]()}
            </p>
            <ul className="space-y-0.5">
              {planInfo.features.map((feature, index) => (
                <li
                  key={index}
                  className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
                >
                  <div className={cn(
                    'w-1 h-1 rounded-full',
                    planInfo.color.replace('text-', 'bg-')
                  )} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade Button */}
          <Button
            size="sm"
            onClick={handleUpgradeClick}
            className={cn(
              'w-full text-xs h-7',
              'bg-gradient-to-r from-blue-600 to-blue-700',
              'hover:from-blue-700 hover:to-blue-800',
              'text-white border-0 shadow-sm',
              'transition-all duration-200'
            )}
          >
            <span>{m["chatPanel.modelItem.upgradeTooltip.upgradeButtonText"]({ plan: planInfo.name })}</span>
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
