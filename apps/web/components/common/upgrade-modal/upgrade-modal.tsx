/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * upgrade-modal.tsx
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

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@libra/ui/components/dialog'
import { Button } from '@libra/ui/components/button'
import { Badge } from '@libra/ui/components/badge'
import { cn } from '@libra/ui/lib/utils'
import { Sparkles, Crown, Check, X } from 'lucide-react'
import { useUpgradeModalContext } from './upgrade-modal-provider'

export const UpgradeModal = () => {
  const { isOpen, config, hideUpgradeModal } = useUpgradeModalContext()

  if (!config) return null

  const handleUpgrade = () => {
    hideUpgradeModal()
    config.onUpgrade?.()
  }

  const handleCancel = () => {
    hideUpgradeModal()
    config.onCancel?.()
  }

  const getPlanBadgeConfig = (plan: 'PRO' | 'MAX') => {
    if (plan === 'MAX') {
      return {
        icon: Crown,
        text: 'Zepid Max',
        className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      }
    }
    return {
      icon: Crown,
      text: 'Zepid Pro',
      className: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
    }
  }

  const planConfig = getPlanBadgeConfig(config.targetPlan || 'PRO')
  const PlanIcon = planConfig.icon
  const isMinimal = config.variant === 'minimal' || config.variant === undefined

  if (isMinimal) {
    // Minimal variant (default) - simple and clean like reference design
    return (
      <Dialog open={isOpen} onOpenChange={hideUpgradeModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px]" showCloseButton={false}>
          {/* Close Button */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Simple Header */}
          <DialogHeader className="space-y-3 mb-6">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {config.description}
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons - Right aligned like reference */}
          <DialogFooter className="flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="min-w-20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              className="min-w-20"
            >
              {config.buttonText || 'Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Full variant - original complex layout
  return (
    <Dialog open={isOpen} onOpenChange={hideUpgradeModal}>
      <DialogContent className="max-w-[90vw] sm:max-w-[440px] bg-gray-900 border-gray-700/50 text-white p-6 sm:p-8 lg:p-10 shadow-2xl" showCloseButton={false}>
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Header with Icon */}
        <DialogHeader className="text-center space-y-6 mb-12">
          <div className="mx-auto w-20 h-20 bg-orange-900/40 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-orange-500" />
          </div>
          <div className="space-y-3">
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-base sm:text-lg leading-relaxed">
              {config.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Features List */}
        {config.features && config.features.length > 0 && (
          <div className="space-y-6 mb-12">
            {config.features.map((feature, index) => (
              <div
                key={feature.id}
                className={cn(
                  "flex items-center gap-5 py-2",
                  feature.highlight && "bg-blue-500/15 border border-blue-500/25 rounded-lg px-4 py-4"
                )}
              >
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className={cn(
                  "text-lg leading-relaxed",
                  feature.highlight ? "text-white font-semibold" : "text-gray-300"
                )}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleUpgrade}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg border-0 shadow-xl transition-all duration-200 rounded-xl"
            size="lg"
          >
            {config.buttonText || `Upgrade to ${planConfig.text}`}
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full text-gray-400 hover:text-gray-300 hover:bg-transparent h-12 text-lg font-medium transition-colors duration-200"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 