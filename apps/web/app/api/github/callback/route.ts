/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * route.ts
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

import { getAuthDb } from '@libra/auth/db'
import { githubUserToken } from '@libra/auth/db/schema/github-schema'
import { validateAndConsumeNonce } from '@libra/auth/utils/nonce'
import { tryCatch } from '@libra/common'
import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Type definitions for GitHub OAuth responses
interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
  refresh_token?: string
  expires_in?: number
  refresh_token_expires_in?: number
  error?: string
  error_description?: string
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

// Handle GitHub App OAuth callback for user access tokens
// This is called after a user authorizes the GitHub App to access their account
export async function GET(request: NextRequest) {
  const [result, error] = await tryCatch(async () => {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(new URL(`/github-error?reason=${error}`, request.url))
    }

    // Validate required parameters for OAuth callback
    if (!code) {
      return NextResponse.redirect(new URL('/github-error?reason=missing_code', request.url))
    }

    if (!state) {
      return NextResponse.redirect(new URL('/github-error?reason=missing_state', request.url))
    }

    // Parse and validate state parameter
    let orgId: string | null = null
    let nonce: string | null = null
    let userId: string | null = null

    const [, stateError] = await tryCatch(async () => {
      // Decode base64 state parameter
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      orgId = stateData.orgId
      nonce = stateData.nonce
      userId = stateData.userId

      // Validate required fields
      if (!orgId || !nonce) {
        throw new Error('Invalid state data')
      }

      // Validate nonce for replay protection
      const isNonceValid = await validateAndConsumeNonce(nonce, orgId, userId || undefined)
      if (!isNonceValid) {
        throw new Error('Invalid nonce')
      }

      return { orgId, nonce, userId }
    })

    if (stateError) {
      return NextResponse.redirect(new URL('/github-error?reason=invalid_state', request.url))
    }

    // Ensure orgId is not null after successful validation
    if (!orgId) {
      return NextResponse.redirect(new URL('/github-error?reason=invalid_state', request.url))
    }

    const [oauthResult, oauthError] = await tryCatch(async () => {
      // Exchange authorization code for access token
      // Use GITHUB_OAUTH_CLIENT_ID for personal user OAuth (OAuth App)
      // This endpoint only handles OAuth App flow, not GitHub App
      const GITHUB_CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID
      const GITHUB_CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET

      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        throw new Error('GitHub OAuth App credentials not configured. Please set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET.')
      }

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code: code,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`GitHub OAuth token exchange failed: ${tokenResponse.status} - ${errorText}`)
      }

      const tokenData = (await tokenResponse.json()) as GitHubTokenResponse

      if (tokenData.error) {
        throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`)
      }

      if (!tokenData.access_token) {
        throw new Error('No access token received from GitHub')
      }

      // Get user info from GitHub to identify the user
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${tokenData.access_token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Zepid-Platform/1.0',
        },
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        throw new Error(`Failed to get user info from GitHub: ${userResponse.status} - ${errorText}`)
      }

      const githubUser = (await userResponse.json()) as GitHubUser

      // Store the user access token in database
      const db = await getAuthDb()

      // Check if user token already exists for this organization and GitHub user
      const existingToken = await db.query.githubUserToken.findFirst({
        where: (table, { eq, and }) => and(
          eq(table.organizationId, orgId as string),
          eq(table.githubUserId, githubUser.id)
        ),
      })

      const tokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

      const refreshTokenExpiresAt = tokenData.refresh_token_expires_in
        ? new Date(Date.now() + tokenData.refresh_token_expires_in * 1000)
        : null

      if (existingToken) {
        // Update existing token
        await db
          .update(githubUserToken)
          .set({
            githubUserId: githubUser.id,
            githubUsername: githubUser.login,
            githubEmail: githubUser.email,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            scope: tokenData.scope || '',
            tokenType: tokenData.token_type || 'bearer',
            expiresAt: tokenExpiresAt,
            refreshTokenExpiresAt: refreshTokenExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(githubUserToken.id, existingToken.id))
      } else {
        // Create new token record
        await db.insert(githubUserToken).values({
          organizationId: orgId as string,
          githubUserId: githubUser.id,
          githubUsername: githubUser.login,
          githubEmail: githubUser.email,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          scope: tokenData.scope || '',
          tokenType: tokenData.token_type || 'bearer',
          expiresAt: tokenExpiresAt,
          refreshTokenExpiresAt: refreshTokenExpiresAt,
        })
      }

      // Redirect to success page
      const successUrl = new URL('/github-success', request.url)
      successUrl.searchParams.set('org_id', orgId as string)

      return NextResponse.redirect(successUrl)
    })

    if (oauthError) {
      return NextResponse.redirect(new URL('/github-error?reason=processing', request.url))
    }

    return oauthResult
  })

  if (error) {
    return NextResponse.redirect(new URL('/github-error?reason=unexpected', request.url))
  }

  return result
}
