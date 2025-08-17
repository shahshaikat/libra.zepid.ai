import { cors } from 'hono/cors'
import type { MiddlewareHandler, Next } from 'hono'

import { corsConfig, getConfig } from '../config'
import type { AppContext } from '../types'

/**
 * Enhanced CORS middleware with security best practices
 * @description Provides CORS handling with environment-specific configuration
 * @returns CORS middleware handler
 */
export function createCorsMiddleware() {
  return async (c: AppContext, next: Next) => {
    try {
      const config = getConfig(c)
      const allowedOrigins = corsConfig.getAllowedOrigins(config)

      // Get request origin (unused in current implementation but kept for potential future use)
      // const origin = c.req.header('origin')

      // Apply CORS middleware with dynamic configuration
      return cors({
        origin: (requestOrigin) => {
          if (!requestOrigin) return null

          // Check exact match first
          if (allowedOrigins.includes(requestOrigin)) {
            return requestOrigin
          }

          // Check pattern match for development
          if (config.ENVIRONMENT === 'development') {
            // Allow any localhost port in development
            if (requestOrigin.match(/^https?:\/\/localhost:\d+$/)) {
              return requestOrigin
            }
            // Allow any 127.0.0.1 port in development
            if (requestOrigin.match(/^https?:\/\/127\.0\.0\.1:\d+$/)) {
              return requestOrigin
            }
          }

          // Check for subdomain match in production
          if (config.ENVIRONMENT === 'production') {
            // Allow any subdomain of libra.dev
            if (requestOrigin.match(/^https:\/\/[a-zA-Z0-9-]+\.libra\.dev$/)) {
              return requestOrigin
            }
          }

          // Log rejected origin for debugging
          if (config.LOG_LEVEL === 'debug') {
            console.log(`CORS: Rejected origin ${requestOrigin}`)
          }

          return null
        },
        allowMethods: [...corsConfig.allowMethods],
        allowHeaders: [...corsConfig.allowHeaders],
        credentials: corsConfig.credentials,
        maxAge: corsConfig.maxAge,
        exposeHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      })(c, next)
    } catch (error) {
      // Fallback to restrictive CORS on error
      console.error('CORS middleware error:', error)

      return cors({
        origin: 'https://zepid.dev',
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Content-Type'],
        credentials: false,
        maxAge: 3600,
      })(c, next)
    }
  }
}

/**
 * Strict CORS middleware for sensitive endpoints
 * @description Applies strict CORS policy regardless of environment
 * @param allowedOrigins - Explicit list of allowed origins
 * @returns CORS middleware handler
 */
export function createStrictCorsMiddleware(allowedOrigins: string[]): MiddlewareHandler {
  return cors({
    origin: (requestOrigin) => {
      if (!requestOrigin) return null
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : null
    },
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600, // 1 hour
    exposeHeaders: ['X-Request-Id'],
  })
}

/**
 * Public CORS middleware for CDN assets
 * @description Allows access from any origin for public assets
 * @returns CORS middleware handler
 */
export function createPublicCorsMiddleware(): MiddlewareHandler {
  return cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    allowHeaders: ['Range', 'If-None-Match', 'If-Modified-Since'],
    credentials: false,
    maxAge: 86400 * 7, // 7 days
    exposeHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
  })
}