/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * github.ts
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

import { githubInstallation, githubUserToken } from '@libra/auth/db/schema/github-schema'
import { generateSecureNonce } from '@libra/auth/utils/nonce'
import type { FileStructure, HistoryType } from '@libra/common'
import { buildFiles, log, tryCatch } from '@libra/common'
import { templateConfigs } from '@libra/templates'
import { Octokit } from '@octokit/rest'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { githubRepoInfoSchema } from '../schemas/project-schema'
import { createTRPCRouter, organizationProcedure } from '../trpc'
import { getGitHubAuthToken } from '../utils/github-auth'
import {
  ensureOrgAccess,
  fetchProject,
  getBusinessDb,
  requireOrgAndUser,
  updateProjectGitInfo,
  validateGitUrl,
} from '../utils/project'

// GitHub OAuth and GitHub App configurations are handled separately
// OAuth App is used for personal user repository access
// GitHub App is used for organization installations

// Schemas for validation
const GitHubUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatar_url: z.string(),
  html_url: z.string(),
  public_repos: z.number(),
  followers: z.number(),
  following: z.number(),
})

const RepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  private: z.boolean(),
  html_url: z.string(),
  clone_url: z.string(),
  ssh_url: z.string(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  language: z.string().nullable(),
  updated_at: z.string(),
  default_branch: z.string(),
})

export const githubRouter = createTRPCRouter({
  // Get GitHub OAuth URL for user access token
  getOAuthUrl: organizationProcedure.mutation(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'getOAuthUrl',
    }

    log.github('info', 'Starting GitHub OAuth URL generation', context)

    // Check if OAuth App credentials are configured
    const GITHUB_OAUTH_CLIENT_ID = process.env['GITHUB_OAUTH_CLIENT_ID']
    if (!GITHUB_OAUTH_CLIENT_ID) {
      log.github('error', 'GitHub OAuth App client ID not configured', context)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'GitHub OAuth App client ID not configured. Please set GITHUB_OAUTH_CLIENT_ID.',
      })
    }

    const [oauthResult, oauthError] = await tryCatch(async () => {
      // Generate a cryptographically secure nonce for replay protection
      const nonceData = await generateSecureNonce(ctx.orgId, ctx.session.user.id)

      // Create a state parameter to identify the organization and user during callback
      const state = Buffer.from(
        JSON.stringify({
          orgId: ctx.orgId,
          userId: ctx.session.user.id,
          timestamp: nonceData.timestamp,
          nonce: nonceData.nonce,
        })
      ).toString('base64')

      // Get the base URL for the OAuth callback
      const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'
      const redirectUri = `${baseUrl}/api/github/callback`

      // GitHub OAuth authorization URL
      const oauthUrl = new URL('https://github.com/login/oauth/authorize')
      oauthUrl.searchParams.set('client_id', GITHUB_OAUTH_CLIENT_ID)
      oauthUrl.searchParams.set('redirect_uri', redirectUri) // Add redirect_uri parameter
      oauthUrl.searchParams.set('state', state)
      oauthUrl.searchParams.set('scope', 'user:email,repo') // Add required scopes

      log.github('info', 'GitHub OAuth URL generated successfully', {
        ...context,
        redirectUri,
        scopes: 'user:email,repo',
      })

      return {
        oauthUrl: oauthUrl.toString(),
        redirectUri,
        state, // Return state for debugging
      }
    })

    if (oauthError) {
      log.github(
        'error',
        'Failed to generate secure nonce for OAuth',
        context,
        oauthError instanceof Error ? oauthError : new Error(String(oauthError))
      )
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate secure OAuth state',
      })
    }

    return oauthResult
  }),

  // Get GitHub App installation URL
  getInstallationUrl: organizationProcedure.mutation(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'getInstallationUrl',
    }
    const GITHUB_APP_ID = process.env['GITHUB_APP_ID']

    log.github('info', 'Starting GitHub App installation URL generation', context)

    if (!GITHUB_APP_ID) {
      log.github('error', 'GitHub App ID not configured', context)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'GitHub App ID not configured',
      })
    }

    const [installResult, installError] = await tryCatch(async () => {
      // Generate a secure nonce for the installation flow
      const nonceData = await generateSecureNonce(ctx.orgId, ctx.session.user.id)

      // Create state parameter for installation callback
      const state = Buffer.from(
        JSON.stringify({
          organizationId: ctx.orgId,
          userId: ctx.session.user.id,
          timestamp: nonceData.timestamp,
          nonce: nonceData.nonce,
        })
      ).toString('base64')

      // GitHub App installation URL
      const installUrl = new URL(
        `https://github.com/apps/${process.env['GITHUB_APP_NAME'] || 'nextify-limited'}/installations/new`
      )
      installUrl.searchParams.set('state', state)

      log.github('info', 'GitHub App installation URL generated successfully', {
        ...context,
        appName: process.env['GITHUB_APP_NAME'] || 'nextify-limited',
      })

      return {
        installUrl: installUrl.toString(),
        state,
      }
    })

    if (installError) {
      log.github(
        'error',
        'Failed to generate GitHub App installation URL',
        context,
        installError instanceof Error ? installError : new Error(String(installError))
      )
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate GitHub App installation URL',
      })
    }

    return installResult
  }),

  // Get GitHub App installation status
  getInstallationStatus: organizationProcedure.query(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'getInstallationStatus',
    }

    log.github('info', 'Checking GitHub installation status', context)

    const [statusResult, statusError] = await tryCatch(async () => {
      // Check if there's a GitHub installation for this organization
      const installation = await ctx.db.query.githubInstallation.findFirst({
        where: and(
          eq(githubInstallation.organizationId, ctx.orgId),
          eq(githubInstallation.isActive, true)
        ),
      })

      if (!installation) {
        log.github('info', 'No GitHub installation found', context)
        return {
          isInstalled: false,
          installationType: null,
          requiresOAuth: false,
          hasUserToken: false,
          accountLogin: null,
          accountType: null,
        }
      }

      // Check if user token exists for personal installations
      const userToken = await ctx.db.query.githubUserToken.findFirst({
        where: eq(githubUserToken.organizationId, ctx.orgId),
      })

      // Personal users always require OAuth for repository access
      const requiresOAuth = installation.githubAccountType === 'User'

      log.github('info', 'GitHub installation status retrieved', {
        ...context,
        isInstalled: true,
        accountType: installation.githubAccountType,
        accountLogin: installation.githubAccountLogin,
        requiresOAuth,
        hasUserToken: !!userToken,
        userTokenId: userToken?.id,
        userTokenGithubUserId: userToken?.githubUserId,
        userTokenScope: userToken?.scope,
        userTokenExpiresAt: userToken?.expiresAt,
      })

      return {
        isInstalled: true,
        installationType: installation.githubAccountType.toLowerCase() as 'user' | 'organization',
        requiresOAuth,
        hasUserToken: !!userToken,
        accountLogin: installation.githubAccountLogin,
        accountType: installation.githubAccountType,
        installedAt: installation.installedAt,
      }
    })

    if (statusError) {
      log.github(
        'error',
        'Failed to check GitHub installation status',
        context,
        statusError instanceof Error ? statusError : new Error(String(statusError))
      )
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check GitHub installation status',
      })
    }

    return statusResult
  }),

  // Check GitHub connection status
  getConnectionStatus: organizationProcedure.query(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'getConnectionStatus',
    }

    log.github('info', 'Starting GitHub connection status check', context)

    const [connectionResult, connectionError] = await tryCatch(async () => {
      // Try to get authentication token - this will handle both installation and user tokens
      const [authResult, authError] = await tryCatch(async () => {
        const authResult = await getGitHubAuthToken(ctx.db, ctx.orgId)

        log.github('info', 'GitHub auth token retrieved, verifying validity', {
          ...context,
          authType: authResult.type,
          tokenPrefix: authResult.token.substring(0, 10),
          expiresAt: authResult.expiresAt,
        })

        // Verify the token is still valid by making a test API call
        // Use appropriate authorization format and endpoint based on token type
        const authHeader = authResult.type === 'installation'
          ? `Bearer ${authResult.token}`  // Installation tokens use Bearer
          : `token ${authResult.token}`   // User tokens use token

        // For installation tokens, test with /app endpoint; for user tokens, test with /user endpoint
        const testUrl = authResult.type === 'installation'
          ? 'https://api.github.com/app'
          : 'https://api.github.com/user'


        const requestHeaders = {
          Authorization: authHeader,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Libra-AI/1.0',
        }

        const testResponse = await fetch(testUrl, {
          headers: requestHeaders,
        })

        if (!testResponse.ok) {
          // Token is invalid - get detailed error info
          const errorText = await testResponse.text().catch(() => 'Unable to read error response')

          log.github('warn', 'GitHub token validation failed', {
            ...context,
            status: testResponse.status,
            statusText: testResponse.statusText,
            authType: authResult.type,
            errorResponse: errorText.substring(0, 200), // First 200 chars of error
          })
          return {
            isConnected: false,
            user: null,
            connectedAt: null,
            error: 'Token expired or invalid',
          }
        }

        const githubUserData = await testResponse.json()
        const githubUser = GitHubUserSchema.parse(githubUserData)

        // Get connection details based on auth type
        let connectedAt: Date | null = null
        let scope: string | undefined

        if (authResult.type === 'user') {
          // Get user token details
          const userToken = await ctx.db.query.githubUserToken.findFirst({
            where: eq(githubUserToken.organizationId, ctx.orgId),
          })
          connectedAt = userToken?.createdAt || null
          scope = userToken?.scope
        } else {
          // Get installation details
          const installation = await ctx.db.query.githubInstallation.findFirst({
            where: and(
              eq(githubInstallation.organizationId, ctx.orgId),
              eq(githubInstallation.isActive, true)
            ),
          })
          connectedAt = installation?.installedAt || null
        }

        log.github('info', 'GitHub connection status verified successfully', {
          ...context,
          isConnected: true,
          authType: authResult.type,
          githubLogin: githubUser.login,
          scope,
        })

        return {
          isConnected: true,
          user: GitHubUserSchema.parse(githubUser),
          connectedAt,
          scope,
          authType: authResult.type,
        }
      })

      if (authError) {
        // No valid authentication found
        // log.github(
        //   'warn',
        //   'GitHub authentication not available',
        //   context,
        //   authError instanceof Error ? authError : new Error(String(authError))
        // )
        return {
          isConnected: false,
          user: null,
          connectedAt: null,
          error:
            authError instanceof TRPCError ? authError.message : 'Authentication not available',
        }
      }

      return authResult
    })

    if (connectionError) {
      log.github(
        'error',
        'Failed to check GitHub connection status',
        context,
        connectionError instanceof Error ? connectionError : new Error(String(connectionError))
      )
      return {
        isConnected: false,
        user: null,
        connectedAt: null,
        error: 'Failed to check connection status',
      }
    }

    return connectionResult
  }),

  // Get GitHub user info
  getUser: organizationProcedure.query(async ({ ctx }) => {
    const [userResult, userError] = await tryCatch(async () => {
      // Use the existing auth flow to get a valid token and fetch fresh user data
      const authResult = await getGitHubAuthToken(ctx.db, ctx.orgId)

      // Fetch user info from GitHub API using the valid token
      // Use appropriate authorization format based on token type
      const authHeader = authResult.type === 'installation'
        ? `Bearer ${authResult.token}`  // Installation tokens use Bearer
        : `token ${authResult.token}`   // User tokens use token

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: authHeader,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Libra-AI/1.0',
        },
      })

      if (!userResponse.ok) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'GitHub token is invalid or expired',
        })
      }

      const githubUser = await userResponse.json()
      return GitHubUserSchema.parse(githubUser)
    })

    if (userError) {
      if (userError instanceof TRPCError) {
        throw userError
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch GitHub user info',
      })
    }

    return userResult
  }),

  // Get user's GitHub repositories
  getRepositories: organizationProcedure.query(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'getRepositories',
    }

    log.github('info', 'Starting GitHub repositories fetch', context)

    const [reposResult, reposError] = await tryCatch(async () => {
      // Get the appropriate GitHub authentication token
      const authResult = await getGitHubAuthToken(ctx.db, ctx.orgId)

      // Determine the API endpoint based on authentication type
      let apiUrl: string
      if (authResult.type === 'installation') {
        // For installation tokens, we need to get repositories accessible to the installation
        // First get the installation details to determine the account
        const installation = await ctx.db.query.githubInstallation.findFirst({
          where: and(
            eq(githubInstallation.organizationId, ctx.orgId),
            eq(githubInstallation.isActive, true)
          ),
        })

        if (!installation) {
          log.github('error', 'GitHub installation not found for repositories fetch', context)
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'GitHub installation not found',
          })
        }

        // For organization installations, get organization repos
        if (installation.githubAccountType === 'Organization') {
          apiUrl = `https://api.github.com/orgs/${installation.githubAccountLogin}/repos?sort=updated&per_page=50`
        } else {
          // For user installations, get user repos via installation
          apiUrl = 'https://api.github.com/installation/repositories?sort=updated&per_page=50'
        }

        log.github('info', 'Using installation auth for repositories', {
          ...context,
          accountType: installation.githubAccountType,
          accountLogin: installation.githubAccountLogin,
          endpoint: apiUrl,
        })
      } else {
        // For user tokens, get user repositories
        apiUrl = 'https://api.github.com/user/repos?sort=updated&per_page=50'
        log.github('info', 'Using user auth for repositories', {
          ...context,
          endpoint: apiUrl,
        })
      }

      // Fetch repositories from GitHub API
      // Use appropriate authorization format based on token type
      const authHeader = authResult.type === 'installation'
        ? `Bearer ${authResult.token}`  // Installation tokens use Bearer
        : `token ${authResult.token}`   // User tokens use token

      const reposResponse = await fetch(apiUrl, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Libra-AI/1.0',
        },
      })

      if (!reposResponse.ok) {
        const errorText = await reposResponse.text()
        log.github('error', 'GitHub API request failed for repositories', {
          ...context,
          status: reposResponse.status,
          endpoint: apiUrl,
          errorText: errorText.substring(0, 200),
        })
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'GitHub API request failed. Please check your authentication.',
        })
      }

      const responseData = await reposResponse.json()

      // Handle different response formats
      let repositories: any[]
      if (authResult.type === 'installation' && (responseData as any).repositories) {
        // Installation repositories endpoint returns { repositories: [...] }
        repositories = (responseData as any).repositories
      } else if (Array.isArray(responseData)) {
        // User/org repositories endpoint returns [...]
        repositories = responseData
      } else {
        log.github('error', 'Invalid response format from GitHub API', {
          ...context,
          responseType: typeof responseData,
          hasRepositories: !!(responseData as any).repositories,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid response format from GitHub API',
        })
      }

      log.github('info', 'GitHub repositories fetched successfully', {
        ...context,
        repositoryCount: repositories.length,
        authType: authResult.type,
      })

      return repositories.map((repo: any) => RepositorySchema.parse(repo))
    })

    if (reposError) {
      if (reposError instanceof TRPCError) {
        throw reposError
      }
      log.github(
        'error',
        'Failed to fetch GitHub repositories',
        context,
        reposError instanceof Error ? reposError : new Error(String(reposError))
      )
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch GitHub repositories',
      })
    }

    return reposResult
  }),

  // Push code to a GitHub repository using Git Data API for batch operations
  pushCode: organizationProcedure
    .input(
      z.object({
        repositoryId: z.number(),
        repositoryFullName: z.string().optional(), // For virtual repository's full_name
        projectId: z.string().min(1, 'Project ID is required'), // Project ID for getting file data
        commitMessage: z.string().min(1, 'Commit message is required'),
        branch: z.string().default('main'),
        forcePush: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = {
        userId: ctx.session.user.id,
        organizationId: ctx.orgId,
        projectId: input.projectId,
        operation: 'pushCode',
      }

      log.github('info', 'Starting GitHub code push operation', {
        ...context,
        repositoryId: input.repositoryId,
        branch: input.branch,
        forcePush: input.forcePush,
        repositoryFullName: input.repositoryFullName,
      })

      const [result, error] = await tryCatch(async () => {
        // Get the appropriate GitHub authentication token
        const authResult = await getGitHubAuthToken(ctx.db, ctx.orgId)

        log.github('info', 'GitHub auth token obtained for push', {
          ...context,
          authType: authResult.type,
        })

        // Initialize Octokit with the authentication token
        const octokit = new Octokit({
          auth: authResult.token,
        })

        // Get repository information
        let repository: any
        if (input.repositoryId === -1) {
          if (!input.repositoryFullName) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Repository full name is required for virtual repositories',
            })
          }

          const [repoData, repoError] = await tryCatch(async () => {
            // Get repository info through full_name
            if (!input.repositoryFullName) {
              throw new Error('Repository full name is required')
            }
            const parts = input.repositoryFullName.split('/')
            if (parts.length !== 2) {
              throw new Error('Invalid repository full name format')
            }
            const [owner, repo] = parts
            if (!owner || !repo) {
              throw new Error('Invalid repository full name format')
            }
            const { data } = await octokit.rest.repos.get({
              owner,
              repo,
            })
            return data
          })

          if (repoError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `Repository ${input.repositoryFullName} not found or access denied: ${repoError.message}`,
            })
          }

          repository = repoData
        } else {
          const [repoByIdData, repoByIdError] = await tryCatch(async () => {
            // Normal repository ID handling - use GitHub API to get repository info by ID
            // Note: Octokit doesn't have a direct method to get repository by ID, we need to use REST API
            // Use appropriate authorization format based on token type
            const authHeader = authResult.type === 'installation'
              ? `Bearer ${authResult.token}`  // Installation tokens use Bearer
              : `token ${authResult.token}`   // User tokens use token

            const response = await fetch(
              `https://api.github.com/repositories/${input.repositoryId}`,
              {
                headers: {
                  Authorization: authHeader,
                  Accept: 'application/vnd.github.v3+json',
                  'User-Agent': 'Libra-AI/1.0',
                },
              }
            )

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            return await response.json()
          })

          if (repoByIdError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `Repository not found or access denied: ${repoByIdError.message}`,
            })
          }

          repository = repoByIdData
        }

        // Get project data and build files
        const { orgId } = await requireOrgAndUser(ctx)
        const db = await getBusinessDb()

        // Fetch and validate project
        const projectData = await fetchProject(db, input.projectId)
        ensureOrgAccess(projectData, orgId, 'access')

        // Get initial file structure
        const initFiles = templateConfigs.vite as FileStructure

        // Get history messages
        const initialMessages = JSON.parse(projectData?.messageHistory || '[]') as HistoryType

        // Use buildFiles function to process file structure and apply history file diffs
        const { fileMap } = buildFiles(initFiles, initialMessages)

        // Convert fileMap to files array for GitHub push
        const filesToPush = Object.entries(fileMap)
          .filter(([, fileInfo]) => {
            // Filter out binary files and directories
            return fileInfo.type === 'file' && !fileInfo.isBinary
          })
          .map(([path, fileInfo]) => ({
            path,
            content: fileInfo.content,
          }))

        log.github('info', 'Files prepared for push', {
          ...context,
          totalFiles: Object.keys(fileMap).length,
          pushableFiles: filesToPush.length,
          fileTypes: filesToPush.map((f) => f.path.split('.').pop()).filter(Boolean),
        })

        if (filesToPush.length === 0) {
          log.github('warn', 'No files available to push to repository', context)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No files to push',
          })
        }

        // Use Octokit Git Data API for batch push operations
        const [owner, repo] = repository.full_name.split('/')

        // Step 1: Get current branch status
        const [branchData, branchError] = await tryCatch(async () => {
          const { data: branchData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${input.branch}`,
          })
          return branchData.object.sha
        })

        if (branchError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Branch ${input.branch} not found in repository: ${branchError.message}`,
          })
        }

        const currentCommitSha = branchData

        // Step 2: Get base tree
        const [baseTreeData, baseTreeError] = await tryCatch(async () => {
          const { data: baseTreeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: currentCommitSha,
          })
          return baseTreeData.sha
        })

        if (baseTreeError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to get base tree: ${baseTreeError.message}`,
          })
        }

        const baseTreeSha = baseTreeData

        // Step 3: Create blob objects for all files in parallel
        const blobPromises = filesToPush.map(async (file) => {
          const [blobResult, blobError] = await tryCatch(async () => {
            const { data: blobData } = await octokit.rest.git.createBlob({
              owner,
              repo,
              content: Buffer.from(file.content, 'utf-8').toString('base64'),
              encoding: 'base64',
            })

            return {
              path: file.path,
              mode: '100644' as const, // File mode
              type: 'blob' as const,
              sha: blobData.sha,
            }
          })

          if (blobError) {
            throw new Error(`Failed to create blob for ${file.path}: ${blobError.message}`)
          }

          return blobResult
        })

        const treeItems = await Promise.all(blobPromises)

        // Step 4: Create new Tree object
        const [treeResult, treeError] = await tryCatch(async () => {
          const { data: treeData } = await octokit.rest.git.createTree({
            owner,
            repo,
            tree: treeItems,
            base_tree: baseTreeSha,
          })
          return treeData.sha
        })

        if (treeError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create tree: ${treeError.message}`,
          })
        }

        const newTreeSha = treeResult

        // Step 5: Create new Commit
        const [commitData, commitError] = await tryCatch(async () => {
          const { data } = await octokit.rest.git.createCommit({
            owner,
            repo,
            tree: newTreeSha,
            message: input.commitMessage,
            parents: [currentCommitSha],
          })
          return data
        })

        if (commitError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create commit: ${commitError.message}`,
          })
        }

        const newCommitSha = commitData.sha

        // Step 6: Update branch reference (supports force push)
        const [, updateRefError] = await tryCatch(async () => {
          await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${input.branch}`,
            sha: newCommitSha,
            force: input.forcePush, // Support force push
          })
        })

        if (updateRefError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update branch reference: ${updateRefError.message}`,
          })
        }

        log.github('info', 'GitHub code push completed successfully', {
          ...context,
          repositoryFullName: repository.full_name,
          branch: input.branch,
          commitSha: newCommitSha,
          filesCount: filesToPush.length,
          commitMessage: input.commitMessage,
        })

        return {
          success: true,
          message: `Successfully pushed ${filesToPush.length} file(s) to ${repository.full_name}`,
          commit: {
            sha: newCommitSha,
            url: commitData.html_url,
            message: input.commitMessage,
          },
          filesCount: filesToPush.length,
          repository: {
            name: repository.name,
            full_name: repository.full_name,
            html_url: repository.html_url,
          },
        }
      })

      if (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        log.github(
          'error',
          'Failed to push code to GitHub repository',
          context,
          error instanceof Error ? error : new Error(String(error))
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to push code to GitHub repository',
        })
      }

      return result
    }),

  // Disconnect GitHub integration
  disconnect: organizationProcedure.mutation(async ({ ctx }) => {
    const context = {
      userId: ctx.session.user.id,
      organizationId: ctx.orgId,
      operation: 'disconnect',
    }

    log.github('info', 'Starting GitHub integration disconnect', context)

    const [result, error] = await tryCatch(async () => {
      let disconnectedItems = 0

      // Find and delete GitHub user token for this organization
      const userToken = await ctx.db.query.githubUserToken.findFirst({
        where: eq(githubUserToken.organizationId, ctx.orgId),
      })

      if (userToken) {
        await ctx.db.delete(githubUserToken).where(eq(githubUserToken.id, userToken.id))
        disconnectedItems++
        log.github('info', 'GitHub user token removed', {
          ...context,
          tokenId: userToken.id,
        })
      }

      // Find and deactivate GitHub installations for this organization
      const installations = await ctx.db.query.githubInstallation.findMany({
        where: and(
          eq(githubInstallation.organizationId, ctx.orgId),
          eq(githubInstallation.isActive, true)
        ),
      })

      if (installations.length > 0) {
        await ctx.db
          .update(githubInstallation)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(githubInstallation.organizationId, ctx.orgId),
              eq(githubInstallation.isActive, true)
            )
          )
        disconnectedItems += installations.length
        log.github('info', 'GitHub installations deactivated', {
          ...context,
          installationCount: installations.length,
          installationIds: installations.map((i) => i.id),
        })
      }

      if (disconnectedItems === 0) {
        log.github('warn', 'No GitHub connections found to disconnect', context)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No GitHub connections found for this organization',
        })
      }

      log.github('info', 'GitHub integration disconnected successfully', {
        ...context,
        disconnectedItems,
      })

      return {
        success: true,
        message: `GitHub integration disconnected successfully (${disconnectedItems} connection(s) removed)`,
      }
    })

    if (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      log.github(
        'error',
        'Failed to disconnect GitHub integration',
        context,
        error instanceof Error ? error : new Error(String(error))
      )
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to disconnect GitHub integration',
      })
    }

    return result
  }),

  // Get project repository information
  getProjectRepository: organizationProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
      })
    )
    .query(async ({ ctx, input }) => {
      const [result, error] = await tryCatch(async () => {
        const { orgId } = await requireOrgAndUser(ctx)
        const db = await getBusinessDb()

        // Fetch and validate project
        const projectData = await fetchProject(db, input.projectId)
        ensureOrgAccess(projectData, orgId, 'access')

        // Return project's git information
        return {
          projectId: projectData.id,
          projectName: projectData.name,
          gitUrl: projectData.gitUrl,
          gitBranch: projectData.gitBranch,
          hasRepository: !!projectData.gitUrl,
        }
      })

      if (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project repository information',
        })
      }

      return result
    }),

  // Create repository for project automatically with atomic project update
  createProjectRepository: organizationProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'Project ID is required'),
        description: z.string().optional(),
        private: z.boolean().default(true),
        forceUpdate: z.boolean().default(false), // Allow updating existing repository info
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = {
        userId: ctx.session.user.id,
        organizationId: ctx.orgId,
        projectId: input.projectId,
        operation: 'createProjectRepository',
      }

      log.github('info', 'Starting project repository creation', {
        ...context,
        private: input.private,
        forceUpdate: input.forceUpdate,
      })

      const [result, error] = await tryCatch(async () => {
        const { orgId } = await requireOrgAndUser(ctx)
        const db = await getBusinessDb()

        // Fetch and validate project
        const projectData = await fetchProject(db, input.projectId)
        ensureOrgAccess(projectData, orgId, 'update')

        // Handle existing repository case
        if (projectData.gitUrl && !input.forceUpdate) {
          // Project already has a repository, return existing info
          const repoName = projectData.gitUrl.split('/').pop()?.replace('.git', '') || 'unknown'

          log.github('info', 'Project already has repository linked', {
            ...context,
            existingGitUrl: projectData.gitUrl,
            repositoryName: repoName,
            branch: projectData.gitBranch,
          })

          return {
            repository: {
              name: repoName,
              clone_url: projectData.gitUrl,
              html_url: projectData.gitUrl
                .replace('.git', '')
                .replace('https://github.com/', 'https://github.com/'),
              default_branch: projectData.gitBranch || 'main',
            },
            projectUpdated: false,
            alreadyLinked: true,
            message: `Project is already linked to repository ${repoName}`,
          }
        }

        // Get GitHub authentication
        const authResult = await getGitHubAuthToken(ctx.db, orgId)

        // Generate repository name based on project name
        const baseRepoName =
          projectData.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, '') || // Remove leading/trailing hyphens
          `libra-project-${projectData.id.slice(-8)}` // Fallback name

        // Get installation info if needed for repository checking
        let installation: any = null
        if (authResult.type === 'installation') {
          installation = await ctx.db.query.githubInstallation.findFirst({
            where: and(
              eq(githubInstallation.organizationId, orgId),
              eq(githubInstallation.isActive, true)
            ),
          })

          if (!installation) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'GitHub installation not found',
            })
          }
        }

        // Generate unique repository name with date suffix
        const now = new Date()
        const dateString = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD format
        const repoName = `${baseRepoName}-${dateString}`

        // Determine API endpoint based on auth type
        let apiUrl: string
        if (authResult.type === 'installation') {
          if (installation.githubAccountType === 'Organization') {
            apiUrl = `https://api.github.com/orgs/${installation.githubAccountLogin}/repos`
          } else {
            apiUrl = 'https://api.github.com/user/repos'
          }
        } else {
          apiUrl = 'https://api.github.com/user/repos'
        }

        // Create repository on GitHub
        // Use appropriate authorization format based on token type
        const authHeader = authResult.type === 'installation'
          ? `Bearer ${authResult.token}`  // Installation tokens use Bearer
          : `token ${authResult.token}`   // User tokens use token

        const createRepoResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Libra-AI/1.0',
          },
          body: JSON.stringify({
            name: repoName,
            description:
              input.description || `Repository for ${projectData.name} - Created with Zepid AI`,
            private: input.private,
            auto_init: true,
            gitignore_template: 'Node',
            license_template: 'mit',
          }),
        })

        if (!createRepoResponse.ok) {
          const errorData = await createRepoResponse.json().catch(() => ({}))
          const githubError = (errorData as any).message || 'Unknown error'

          // Repository creation failed

          // Provide specific error messages for common issues
          let errorMessage = githubError
          if (createRepoResponse.status === 422 && githubError.includes('already exists')) {
            errorMessage = `Repository name "${repoName}" already exists. This shouldn't happen as we check for duplicates. Please try again.`
          } else if (createRepoResponse.status === 403) {
            errorMessage =
              'Insufficient permissions to create repository. Please check your GitHub app installation.'
          } else if (createRepoResponse.status === 401) {
            errorMessage = 'GitHub authentication expired. Please reconnect your GitHub account.'
          } else {
            errorMessage = `Failed to create repository: ${githubError}`
          }

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: errorMessage,
          })
        }

        const repository = await createRepoResponse.json()
        const parsedRepo = RepositorySchema.parse(repository)

        log.github('info', 'GitHub repository created successfully', {
          ...context,
          repositoryName: parsedRepo.name,
          repositoryFullName: parsedRepo.full_name,
          repositoryId: parsedRepo.id,
          isPrivate: parsedRepo.private,
          cloneUrl: parsedRepo.clone_url,
        })

        // Validate Git URL format before updating project
        const gitUrlValidation = validateGitUrl(parsedRepo.clone_url)
        if (!gitUrlValidation.isValid) {
          log.github('error', 'Invalid Git URL format from created repository', {
            ...context,
            repositoryUrl: parsedRepo.clone_url,
            validationError: gitUrlValidation.error,
          })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Invalid repository URL format: ${gitUrlValidation.error}`,
          })
        }

        // Validate repository data with schema
        const gitInfo = {
          gitUrl: gitUrlValidation.normalizedUrl || parsedRepo.clone_url,
          gitBranch: parsedRepo.default_branch || 'main',
        }

        const validationResult = githubRepoInfoSchema.safeParse(gitInfo)
        if (!validationResult.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Repository data validation failed',
          })
        }

        // Atomic operation: Update project with repository information using enhanced utility
        // This ensures consistency between repository creation and project linking
        const [updatedProject, updateError] = await tryCatch(async () => {
          const gitInfo: { gitUrl?: string; gitBranch?: string } = {}
          if (validationResult.data.gitUrl !== undefined) {
            gitInfo.gitUrl = validationResult.data.gitUrl
          }
          if (validationResult.data.gitBranch !== undefined) {
            gitInfo.gitBranch = validationResult.data.gitBranch
          }
          return await updateProjectGitInfo(db, input.projectId, gitInfo, orgId)
        })

        if (updateError) {
          // Enhanced error handling with detailed logging
          log.github(
            'error',
            'Failed to update project after creating repository',
            {
              ...context,
              repositoryFullName: parsedRepo.full_name,
              repositoryId: parsedRepo.id,
              gitUrl: parsedRepo.clone_url,
              gitBranch: parsedRepo.default_branch,
            },
            updateError instanceof Error ? updateError : new Error(String(updateError))
          )

          // Attempt to delete the repository (best effort cleanup)
          const [, deleteError] = await tryCatch(async () => {
            // Use appropriate authorization format based on token type
            const authHeader = authResult.type === 'installation'
              ? `Bearer ${authResult.token}`  // Installation tokens use Bearer
              : `token ${authResult.token}`   // User tokens use token

            await fetch(`https://api.github.com/repos/${parsedRepo.full_name}`, {
              method: 'DELETE',
              headers: {
                Authorization: authHeader,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Libra-AI/1.0',
              },
            })
          })

          if (deleteError) {
            // Failed to cleanup repository after project update failure
          }

          // Provide detailed error message based on the type of update error
          let errorMessage = 'Repository was created but failed to link to project.'
          if (updateError instanceof TRPCError) {
            errorMessage += ` ${updateError.message}`
          } else if (updateError instanceof Error) {
            errorMessage += ` Error: ${updateError.message}`
          }
          errorMessage +=
            ' The repository has been cleaned up. Please try again or contact support.'

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
          })
        }

        log.github('info', 'Project repository created and linked successfully', {
          ...context,
          repositoryName: parsedRepo.name,
          repositoryFullName: parsedRepo.full_name,
          gitUrl: validationResult.data.gitUrl,
          gitBranch: validationResult.data.gitBranch,
        })

        return {
          repository: parsedRepo,
          project: updatedProject,
          projectUpdated: true,
          alreadyLinked: false,
          message: `Repository ${parsedRepo.name} created and linked to project successfully`,
        }
      })

      if (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        log.github(
          'error',
          'Failed to create project repository',
          context,
          error instanceof Error ? error : new Error(String(error))
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project repository',
        })
      }

      return result
    }),
})
