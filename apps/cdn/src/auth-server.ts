/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * auth-server.ts
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

import { plugins } from '@libra/auth/plugins'
import { withCloudflare } from '@libra/better-auth-cloudflare'
import { betterAuth } from 'better-auth'
import { getAuthDb } from './db'
import type { AppContext } from './types'

async function authBuilder(c: AppContext) {
  const dbInstance = await getAuthDb(c)
  return betterAuth(
    withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        d1: {
          db: dbInstance,
          options: {
            // usePlural: true,
            // debugLogs: true,
          },
        },
        // Use global KV binding in Cloudflare Workers
        kv: c.env.KV,
      },
      {
        socialProviders: {
          github: {
            clientId: process.env.BETTER_GITHUB_CLIENT_ID as string,
            clientSecret: process.env.BETTER_GITHUB_CLIENT_SECRET as string,
          },
        },
        // Enable cross-subdomain cookies for zepid.dev and subdomains
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            domain: '.zepid.dev',
          },
        },
        // Configure trusted origins for cross-subdomain authentication
        trustedOrigins: [
          'https://zepid.dev',
          'https://cdn.zepid.dev',
          'https://deploy.zepid.dev',
          'https://dispatcher.zapid.dev',
          'https://auth.zepid.dev',
          'https://api.zepid.dev',
          'https://docs.zepid.dev',
          'https://web.zepid.dev',
          // Development origins
          'http://localhost:3000',
          'http://localhost:3004',
          'http://localhost:3008',
          'http://localhost:3007',
        ],
        plugins,
      }
    )
  )
}

let authInstance: Awaited<ReturnType<typeof authBuilder>> | null = null

// Initialize and get shared auth instance
export async function initAuth(c: AppContext) {
  if (!authInstance) {
    authInstance = await authBuilder(c)
  }
  return authInstance
}
