/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * auth.ts
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

import type { MiddlewareHandler } from 'hono'
import type { AuthConfig, BaseContext, UserSession } from './types'
import { CommonErrors } from './error-handler'

/**
 * Default authentication configuration
 */
const DEFAULT_AUTH_CONFIG: AuthConfig = {
  required: true,
  skipPaths: ['/health', '/docs', '/openapi.json'],
  skipMethods: ['OPTIONS'],
  headerName: 'Authorization',
  cookieName: 'session',
}

/**
 * Check if path should skip authentication
 */
function shouldSkipAuth(
  path: string,
  method: string,
  config: AuthConfig
): boolean {
  // Skip specific methods
  if (config.skipMethods?.includes(method)) {
    return true
  }

  // Skip specific paths
  if (config.skipPaths?.some(skipPath => {
    if (skipPath.endsWith('*')) {
      return path.startsWith(skipPath.slice(0, -1))
    }
    return path === skipPath
  })) {
    return true
  }

  return false
}

/**
 * Extract token from request headers or cookies
 */
function extractToken(c: BaseContext, config: AuthConfig): string | null {
  // Try header first
  if (config.headerName) {
    const authHeader = c.req.header(config.headerName)
    if (authHeader) {
      // Handle "Bearer <token>" format
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7)
      }
      return authHeader
    }
  }

  // Try cookie
  if (config.cookieName) {
    const cookieHeader = c.req.header('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)

      const cookieValue = cookies[config.cookieName]
      if (cookieValue) {
        return cookieValue
      }
    }
  }

  return null
}

/**
 * Basic JWT token validation (without signature verification)
 * For production use, implement proper JWT verification with your auth service
 */
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - (payload?.length || 0) % 4) % 4)
    const decoded = atob(paddedPayload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(
  config?: Partial<AuthConfig>,
  sessionValidator?: (token: string) => Promise<UserSession | null>
): MiddlewareHandler {
  const finalConfig: AuthConfig = {
    ...DEFAULT_AUTH_CONFIG,
    ...config,
  }

  return async (c: BaseContext, next) => {
    const path = c.req.path
    const method = c.req.method

    // Check if authentication should be skipped
    if (shouldSkipAuth(path, method, finalConfig)) {
      await next()
      return
    }

    // Extract token from request
    const token = extractToken(c, finalConfig)

    if (!token) {
      if (finalConfig.required) {
        throw CommonErrors.unauthorized('Authentication token required')
      }
      await next()
      return
    }

    try {
      let userSession: UserSession | null = null

      if (sessionValidator) {
        // Use custom session validator
        userSession = await sessionValidator(token)
      } else {
        // Basic JWT parsing (for development/testing)
        const payload = parseJwtPayload(token)
        if (payload?.sub) {
          userSession = {
            userId: payload.sub as string,
            email: payload.email as string,
            activeOrganizationId: payload.org as string,
          }
        }
      }

      if (!userSession) {
        throw CommonErrors.unauthorized('Invalid authentication token')
      }

      // Set user session in context
      c.set('userSession', userSession)

      await next()
    } catch (error) {
      if (error instanceof Error && error.message.includes('unauthorized')) {
        throw error
      }
      throw CommonErrors.unauthorized('Authentication failed')
    }
  }
}

/**
 * Create optional authentication middleware
 * Sets user session if valid token is provided, but doesn't require it
 */
export function createOptionalAuthMiddleware(
  sessionValidator?: (token: string) => Promise<UserSession | null>
): MiddlewareHandler {
  return createAuthMiddleware(
    { required: false },
    sessionValidator
  )
}

/**
 * Create role-based authorization middleware
 * Requires authentication and checks user roles
 */
export function createRoleAuthMiddleware(
  requiredRoles: string[],
  config?: Partial<AuthConfig>,
  sessionValidator?: (token: string) => Promise<UserSession | null>
): MiddlewareHandler {
  const authMiddleware = createAuthMiddleware(config, sessionValidator)

  return async (c: BaseContext, next) => {
    // First run authentication
    await authMiddleware(c, async () => {
      const userSession = c.get('userSession')

      if (!userSession) {
        throw CommonErrors.unauthorized('Authentication required for role check')
      }

      // Check if user has required roles
      const userRoles = (userSession as any).roles || []
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))

      if (!hasRequiredRole) {
        throw CommonErrors.forbidden(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        )
      }

      await next()
    })
  }
}

/**
 * Create organization-based authorization middleware
 * Requires authentication and checks organization membership
 */
export function createOrgAuthMiddleware(
  config?: Partial<AuthConfig>,
  sessionValidator?: (token: string) => Promise<UserSession | null>
): MiddlewareHandler {
  const authMiddleware = createAuthMiddleware(config, sessionValidator)

  return async (c: BaseContext, next) => {
    // First run authentication
    await authMiddleware(c, async () => {
      const userSession = c.get('userSession')

      if (!userSession?.activeOrganizationId) {
        throw CommonErrors.forbidden('Organization membership required')
      }

      await next()
    })
  }
}

/**
 * Create API key authentication middleware
 * For service-to-service authentication
 */
export function createApiKeyAuthMiddleware(
  validApiKeys: string[] | ((apiKey: string) => Promise<boolean>),
  headerName = 'X-API-Key'
): MiddlewareHandler {
  return async (c: BaseContext, next) => {
    const apiKey = c.req.header(headerName)

    if (!apiKey) {
      throw CommonErrors.unauthorized('API key required')
    }

    let isValid = false

    if (Array.isArray(validApiKeys)) {
      isValid = validApiKeys.includes(apiKey)
    } else {
      isValid = await validApiKeys(apiKey)
    }

    if (!isValid) {
      throw CommonErrors.unauthorized('Invalid API key')
    }

    // Set a service session
    c.set('userSession', {
      userId: 'service',
      email: 'service@zepid.dev',
    })

    await next()
  }
}

/**
 * Authentication utilities
 */
export const AuthUtils = {
  /**
   * Get user session from context
   */
  getUserSession: (c: BaseContext): UserSession | null => {
    return c.get('userSession') || null
  },

  /**
   * Get user ID from context
   */
  getUserId: (c: BaseContext): string | null => {
    const session = c.get('userSession')
    return session?.userId || null
  },

  /**
   * Get organization ID from context
   */
  getOrgId: (c: BaseContext): string | null => {
    const session = c.get('userSession')
    return session?.activeOrganizationId || null
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (c: BaseContext): boolean => {
    return !!c.get('userSession')
  },

  /**
   * Require authentication (throws if not authenticated)
   */
  requireAuth: (c: BaseContext): UserSession => {
    const session = c.get('userSession')
    if (!session) {
      throw CommonErrors.unauthorized('Authentication required')
    }
    return session
  },

  /**
   * Require organization membership (throws if not member)
   */
  requireOrg: (c: BaseContext): string => {
    const session = AuthUtils.requireAuth(c)
    if (!session.activeOrganizationId) {
      throw CommonErrors.forbidden('Organization membership required')
    }
    return session.activeOrganizationId
  },
}
