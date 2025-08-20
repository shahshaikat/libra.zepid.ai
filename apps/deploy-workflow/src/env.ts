/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * env.ts
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

import { z } from 'zod/v4'
import { tryCatch } from '@libra/common'

// Environment validation schema for Deploy service
// Includes essential variables needed for deployment operations and authentication
export const deployEnvSchema = z.object({
  // GitHub OAuth (required for authentication)
  BETTER_GITHUB_CLIENT_ID: z.string().min(1),
  BETTER_GITHUB_CLIENT_SECRET: z.string().min(1),

  // Cloudflare settings (required for deployment operations)
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_API_TOKEN: z.string().min(1),

  // Security (required for authentication)
  TURNSTILE_SECRET_KEY: z.string().min(1),

  // Dispatcher URL (optional, defaults to zapid.dev)
  NEXT_PUBLIC_DISPATCHER_URL: z.string().optional(),

  // Sandbox provider configuration
  E2B_API_KEY: z.string().optional(),
  DAYTONA_API_KEY: z.string().optional(),
  SANDBOX_BUILDER_DEFAULT_PROVIDER: z.string().optional(),

  // Optional variables
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  ENVIRONMENT: z.string().optional(),
  NODE_ENV: z.string().optional(),
})

export type DeployEnv = z.infer<typeof deployEnvSchema>

// Validate environment variables for Cloudflare Workers
export function validateDeployEnv(env: Record<string, unknown>): DeployEnv {
  const [result, error] = tryCatch(() => {
    return deployEnvSchema.parse(env)
  })

  if (error) {
    console.error('[Deploy Env] Environment validation failed:', error)
    throw new Error('Invalid environment variables for deploy service')
  }

  return result
}

// Get environment variables from Cloudflare Workers context
export function getDeployEnv(c: any): DeployEnv {
  // In Cloudflare Workers, environment variables are available via c.env
  const env = {
    BETTER_GITHUB_CLIENT_ID: c.env.BETTER_GITHUB_CLIENT_ID,
    BETTER_GITHUB_CLIENT_SECRET: c.env.BETTER_GITHUB_CLIENT_SECRET,
    CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
    TURNSTILE_SECRET_KEY: c.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_DISPATCHER_URL: c.env.NEXT_PUBLIC_DISPATCHER_URL,
    E2B_API_KEY: c.env.E2B_API_KEY,
    DAYTONA_API_KEY: c.env.DAYTONA_API_KEY,
    SANDBOX_BUILDER_DEFAULT_PROVIDER: c.env.SANDBOX_BUILDER_DEFAULT_PROVIDER,
    STRIPE_SECRET_KEY: c.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: c.env.STRIPE_WEBHOOK_SECRET,
    LOG_LEVEL: c.env.LOG_LEVEL,
    ENVIRONMENT: c.env.ENVIRONMENT,
    NODE_ENV: c.env.NODE_ENV,
  }

  return validateDeployEnv(env)
}
