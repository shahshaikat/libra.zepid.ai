/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * success-header.tsx
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

import { CheckCircle } from 'lucide-react'
import * as m from '@/paraglide/messages'

interface SuccessHeaderProps {
  showExistingDeployment: boolean
}

/**
 * Enhanced success header component for deployment success dialog
 * Displays modern, visually appealing success state with Zepid UI design system
 */
export function SuccessHeader({ showExistingDeployment }: SuccessHeaderProps) {
  return (
    <div className="relative p-6">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-transparent rounded-2xl" />

      <div className="relative glass-2 rounded-2xl p-8 border border-border/50 text-center">
        {/* Success icon with enhanced styling */}
        <div className="flex items-center justify-center mb-6">
          {/* Outer glow ring */}
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-xl animate-pulse" />

          {/* Main icon container */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30 shadow-lg">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 drop-shadow-sm" />
          </div>
        </div>

        {/* Title and description */}
        <div className="space-y-4 max-w-md mx-auto">
          <h3 className="text-2xl font-bold text-foreground tracking-tight">
            {showExistingDeployment
              ? m["ide.deployment.dialog.projectDeployedTitle"]()
              : m["ide.deployment.dialog.deploymentSuccessTitle"]()
            }
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed">
            {showExistingDeployment
              ? m["ide.deployment.dialog.projectRunningDescription"]()
              : m["ide.deployment.dialog.successNetworkDescription"]()
            }
          </p>
        </div>

        {/* Success indicator */}
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border/30">
          <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground font-medium">{m["ide.deployment.dialog.deploymentComplete"]()}</span>
        </div>
      </div>
    </div>
  )
}
