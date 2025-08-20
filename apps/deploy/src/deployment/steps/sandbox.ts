/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * sandbox.ts
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

import {
  getSandboxFactory,
  initializeSandboxFactory,
  createConfigFromEnvironment,
  getBuilderDefaultProvider
} from '@libra/sandbox'
import type { DeploymentContext, SandboxResult } from '../../types'

/**
 * Create deployment sandbox
 * Migrated from original DeploymentWorkflow.createSandbox
 */
export async function createSandbox(context: DeploymentContext): Promise<SandboxResult> {
  const { env, logger, state } = context

  // Get deployment config from validation step
  const validationResult = state.stepResults.validation
  if (!validationResult?.data?.deploymentConfig) {
    throw new Error('Deployment configuration not found from validation step')
  }

  const { template, timeout } = validationResult.data.deploymentConfig

  logger.info('Creating deployment sandbox', {
    template,
    timeout
  })

  // Initialize sandbox factory if needed
  const config = createConfigFromEnvironment()
  await initializeSandboxFactory(config)

  const factory = getSandboxFactory()
  const provider = getBuilderDefaultProvider()
  const resolvedTemplate = template // Use the template directly

  logger.info('Sandbox configuration resolved', {
    provider,
    baseTemplate: template,
    resolvedTemplate,
    timeout
  })

  // Prepare environment variables for sandbox
  const sandboxEnvs = {
    CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN,
    DISPATCH_NAMESPACE_NAME: env.DISPATCH_NAMESPACE_NAME || 'zepid-dispatcher'
  }

  logger.info('Sandbox environment variables prepared', {
    hasCloudflareAccountId: !!sandboxEnvs.CLOUDFLARE_ACCOUNT_ID,
    hasCloudflareApiToken: !!sandboxEnvs.CLOUDFLARE_API_TOKEN,
    dispatchNamespace: sandboxEnvs.DISPATCH_NAMESPACE_NAME
  })

  // Create sandbox with environment variables
  const sandbox = await factory.createSandbox({
    provider,
    template: resolvedTemplate,
    timeoutMs: timeout,
    env: sandboxEnvs
  })

  logger.info('Sandbox created successfully', {
    sandboxId: sandbox.id,
    provider,
    template: resolvedTemplate
  })

  return {
    success: true,
    duration: 0, // Will be set by workflow
    data: {
      sandboxId: sandbox.id,
      sandboxInfo: {
        provider,
        template: resolvedTemplate,
        createdAt: new Date().toISOString()
      },
      provider
    }
  }
}
