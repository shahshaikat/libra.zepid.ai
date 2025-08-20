/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * deployment-confirmation.tsx
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

import { Globe, Zap, Rocket } from 'lucide-react'
import { UrlPreview, ActionButton } from './atoms'
import * as m from '@/paraglide/messages'

interface DeploymentConfirmationProps {
  onConfirm: () => Promise<void>
  existingUrl?: string
  isDeploying: boolean
  onClose: () => void
  projectId: string
}

export function DeploymentConfirmation({
  onConfirm,
  existingUrl,
  isDeploying,
  onClose,
  projectId
}: DeploymentConfirmationProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  // Generate expected deployment URL based on projectId
  const generateExpectedUrl = (projectId: string): string => {
    return `https://${projectId}-worker.zapid.dev`
  }

  const expectedUrl = generateExpectedUrl(projectId)
  const hasExistingDeployment = existingUrl && !isDeploying

  return (
    <main
      className="deployment-section flex flex-col"
      style={{ gap: 'var(--deployment-section-gap)' }}
      aria-label={hasExistingDeployment ? m["ide.deployment.dialog.redeployConfirmationAriaLabel"]() : m["ide.deployment.dialog.confirmationAriaLabel"]()}
    >


      {/* URL preview card with left-aligned icon */}
      <div className="deployment-card-primary">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="deployment-text-subtitle text-foreground font-semibold">
              {hasExistingDeployment
                ? m["ide.deployment.dialog.currentDeploymentAddress"]()
                : m["ide.deployment.dialog.previewDeploymentAddress"]()
              }
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasExistingDeployment ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="deployment-text-caption text-muted-foreground">
                {hasExistingDeployment ? m["ide.deployment.dialog.live"]() : m["ide.deployment.dialog.availableAfterDeploy"]()}
              </span>
            </div>
          </div>

          <UrlPreview
            url={expectedUrl}
            status={hasExistingDeployment ? "live" : "preview"}
            showActions={true}
            className="!mt-3"
          />
        </div>
      </div>

      {/* Compact deployment features */}
      <div className="deployment-card-enhanced">
        <div className="space-y-3">
          <h4 className="deployment-text-subtitle font-semibold text-foreground">
            {m["ide.deployment.dialog.deploymentFeatures"]()}
          </h4>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <span className="text-foreground font-medium">
                {m["ide.deployment.dialog.globalCdn"]()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <span className="text-foreground font-medium">
                {m["ide.deployment.dialog.sslSecurity"]()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced action bar */}
      <div className="deployment-action-bar-responsive">
        <ActionButton
          intent="secondary"
          onClick={onClose}
          className="flex-1"
          aria-label={m["ide.deployment.dialog.cancelDeploymentAriaLabel"]()}
        >
          {m["ide.deployment.dialog.cancel"]()}
        </ActionButton>
        <ActionButton
          intent="primary"
          onClick={handleConfirm}
          icon={Rocket}
          className="flex-1"
          aria-label={hasExistingDeployment
            ? m["ide.deployment.dialog.redeployProjectAriaLabel"]()
            : m["ide.deployment.dialog.startDeploymentAriaLabel"]()
          }
        >
          {hasExistingDeployment
            ? m["ide.deployment.dialog.redeploy"]()
            : m["ide.deployment.dialog.deploy"]()
          }
        </ActionButton>
      </div>
    </main>
  )
}
