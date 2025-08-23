/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * install-step.tsx
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

import { AlertCircle, Lock, Shield, Loader2 } from 'lucide-react'

import { Alert, AlertDescription } from '@libra/ui/components/alert'
import { Button } from '@libra/ui/components/button'

import Github from '@/components/logos/github'

interface InstallStepProps {
  isLoading: boolean
  error: string | null
  onInstall: () => void
}

export function InstallStep({ isLoading, error, onInstall }: InstallStepProps) {
  return (
    <div className="space-y-8" aria-labelledby="install-title">
      {/* Simplified Header */}
      <div className="text-center space-y-4">
        <div className="space-y-3">
          <h1
            id="install-title"
            className="text-2xl font-bold text-foreground"
          >
            Install GitHub App
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            Connect your GitHub account to enable seamless code export and repository management
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Installation Requirements */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Installation Required
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Install the Zepid GitHub App to enable repository access and code export
              </p>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Secure OAuth
                </h4>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Industry-standard authentication
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Limited Access
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Only requested permissions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <Button
          onClick={onInstall}
          disabled={isLoading}
          className="w-full h-12 text-base font-semibold"
          size="lg"
          aria-describedby={error ? "install-error" : undefined}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
              Installing GitHub App...
            </>
          ) : (
            <>
              <Github className="w-5 h-5 mr-2" aria-hidden="true" />
              Install GitHub App
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <Alert
            variant="error"
            className="border-destructive/50 bg-destructive/5"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription
              id="install-error"
              className="text-sm leading-relaxed"
            >
              <span className="font-medium">Installation failed:</span> {error}
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Please try again or check your browser's popup settings.
              </span>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
