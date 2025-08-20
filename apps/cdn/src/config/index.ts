import { z } from 'zod'
import type { AppContext } from '../types'

/**
 * Environment configuration schema
 */
const envSchema = z.object({
    // Core environment
    ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
    LOG_LEVEL: z.string().transform((val) => val.toLowerCase()).pipe(z.enum(['debug', 'info', 'warn', 'error'])).default('info'),
    POSTGRES_URL: z.url({ error: 'Invalid database URL' }),

    // OAuth providers
    BETTER_GITHUB_CLIENT_ID: z.string().optional(),
    BETTER_GITHUB_CLIENT_SECRET: z.string().optional(),

    // File upload limits
    MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024), // 5MB
    ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,image/webp,image/avif'),

    // Rate limiting
    RATE_LIMIT_WINDOW: z.coerce.number().default(10), // seconds
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1),

    // Caching
    CACHE_MAX_AGE: z.coerce.number().default(30 * 24 * 60 * 60), // 30 days
    CACHE_TTL_STRATEGY: z.enum(['fixed', 'dynamic']).default('fixed'), // New field with default
})

export type EnvConfig = z.infer<typeof envSchema>

/**
 * CORS configuration
 * @description Provides CORS settings based on environment
 */
export const corsConfig = {
    /**
     * Get allowed origins based on environment
     * @param env - Environment configuration
     * @returns Array of allowed origin URLs
     */
    getAllowedOrigins: (env: EnvConfig) => {
        const origins: string[] = []

        // Development origins
        if (env.ENVIRONMENT === 'development') {
            origins.push(
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:5173',
                'http://localhost:5174'
            )
        }

        // Production origins
        origins.push(
            'https://zepid.dev',
            'https://cdn.zepid.dev',
            "https://zapid.dev"
        )

        return origins
    },

    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] as const,
    credentials: true,
    maxAge: 86400, // 1 day
}

/**
 * File upload configuration
 * @description Configuration for file upload validation and processing
 */
export const uploadConfig = {
    /**
     * Get maximum allowed file size
     * @param env - Environment configuration
     * @returns Maximum file size in bytes
     */
    getMaxFileSize: (env: EnvConfig) => env.MAX_FILE_SIZE,

    getAllowedMimeTypes: (env: EnvConfig) =>
        env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),

    isValidFileType: (mimeType: string, env: EnvConfig) => {
        const allowedTypes = uploadConfig.getAllowedMimeTypes(env)
        return allowedTypes.includes(mimeType)
    },

    compressionOptions: {
        quality: 80,
        format: 'avif' as const,
        enableAdvancedOptimization: true,
    }
}

/**
 * Cache configuration
 */
export const cacheConfig = {
    getMaxAge: (env: EnvConfig) => env.CACHE_MAX_AGE,

    getCacheHeaders: (env: EnvConfig, isPublic = true) => ({
        'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${env.CACHE_MAX_AGE}`,
        'CDN-Cache-Control': `max-age=${env.CACHE_MAX_AGE}`,
    })
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
    window: (env: EnvConfig) => env.RATE_LIMIT_WINDOW,
    maxRequests: (env: EnvConfig) => env.RATE_LIMIT_MAX_REQUESTS,
}

/**
 * Validate and get environment configuration
 */
export function getConfig(c: AppContext): EnvConfig {
    try {
        // Merge environment variables from different sources
        const env = {
            ...process.env,
            ...c.env,
            ENVIRONMENT: c.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
        }

        return envSchema.parse(env)
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue =>
                `${issue.path.join('.')}: ${issue.message}`
            ).join(', ')

            throw new Error(`Invalid environment configuration: ${issues}`)
        }
        throw error
    }
}

/**
 * Check if running in production
 */
export function isProduction(env: EnvConfig): boolean {
    return env.ENVIRONMENT === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(env: EnvConfig): boolean {
    return env.ENVIRONMENT === 'development'
}

/**
 * Get API base URL based on environment
 */
export function getApiBaseUrl(env: EnvConfig): string {
    if (isProduction(env)) {
        return 'https://cdn.zepid.dev'
    }
    return 'http://localhost:8787'
}