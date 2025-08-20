/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * deploy.ts
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

import { connectToSandbox, executeCommand, DEPLOYMENT_CONFIG } from '../../utils/deployment'
import type { DeploymentContext, DeployResult } from '../../types'

/**
 * Deploy-specific timeout configuration
 */
const DEPLOY_TIMEOUTS = {
  DEPLOY: 180000, // 3 minutes
  COMMAND: 30000 // 30 seconds
}

/**
 * Deploy to Cloudflare Workers
 * Migrated from original DeploymentWorkflow.deployToCloudflare
 */
export async function deployToCloudflare(context: DeploymentContext): Promise<DeployResult> {
  const { env, logger, state } = context

  // Get sandbox info from previous step
  const sandboxResult = state.stepResults.sandbox
  if (!sandboxResult?.data?.sandboxId) {
    throw new Error('Sandbox ID not found from sandbox creation step')
  }

  // Get deployment config from validation step
  const validationResult = state.stepResults.validation
  if (!validationResult?.data?.deploymentConfig) {
    throw new Error('Deployment configuration not found from validation step')
  }

  const sandboxId = sandboxResult.data.sandboxId
  const { workerName } = validationResult.data.deploymentConfig

  logger.info('Starting Cloudflare Workers deployment', {
    sandboxId,
    workerName
  })

  // Connect to the sandbox
  const container = await connectToSandbox(sandboxId)

  // Deploy to Cloudflare Workers
  logger.info('Deploying to Cloudflare Workers', {
    workerName,
    dispatchNamespace: env.DISPATCH_NAMESPACE_NAME || 'libra-dispatcher'
  })

  const deployCommand = `cd ${DEPLOYMENT_CONFIG.PROJECT_PATH} && bun wrangler deploy --dispatch-namespace ${env.DISPATCH_NAMESPACE_NAME || 'libra-dispatcher'} --name ${workerName}`

  const deployResult = await executeCommand(
    container,
    deployCommand,
    DEPLOY_TIMEOUTS.DEPLOY,
    'Deploy'
  )

  const deployOutput = deployResult.stdout || ''

  logger.info('Deployment command executed', {
    output: deployOutput.slice(-300) // Log last 300 chars
  })

  // Parse deployment output to extract worker URL
  let workerUrl = ''
  const deploymentSuccess = !deployOutput.toLowerCase().includes('error') &&
                           !deployOutput.toLowerCase().includes('failed')

  if (deploymentSuccess) {
    // Try to extract worker URL from output
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.workers\.dev/i) ||
                     deployOutput.match(/https:\/\/[^\s]+\.libra\.sh/i)

    if (urlMatch) {
      workerUrl = urlMatch[0]
    } else {
      // Construct expected URL based on worker name
      workerUrl = `https://${workerName}.libra.sh`
    }

    logger.info('Deployment successful', {
      workerName,
      workerUrl,
      deploymentSuccess
    })
  } else {
    throw new Error(`Deployment failed. Output: ${deployOutput}`)
  }

  // Verify deployment by checking if worker is accessible
  try {
    logger.info('Verifying deployment accessibility', { workerUrl })
    
    const verifyResponse = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Zepid-Deploy-Verification/1.0'
      }
    })

    logger.info('Deployment verification completed', {
      workerUrl,
      status: verifyResponse.status,
      accessible: verifyResponse.ok || verifyResponse.status < 500
    })

  } catch (verifyError) {
    logger.warn('Deployment verification failed, but deployment may still be successful', {
      workerUrl,
      error: verifyError instanceof Error ? verifyError.message : String(verifyError)
    })
    // Don't fail the deployment just because verification failed
  }

  return {
    success: true,
    duration: 0, // Will be set by workflow
    data: {
      workerUrl,
      deploymentSuccess,
      workerName
    }
  }
}
