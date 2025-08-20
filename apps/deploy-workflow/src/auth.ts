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

import { betterAuth } from "better-auth";
import type { Session as BaseSession } from "better-auth";
import { withCloudflare } from "@libra/better-auth-cloudflare";
import { tryCatch } from '@libra/common';
import { getActiveOrganization } from '@libra/auth/utils/organization-utils';
import { getDeployEnv } from "./env";
import { checkAndUpdateDeployUsageForHono } from "./utils/deploy-quota";
import { getAuthDb } from "./database";

// Extended Session type with deploy-specific fields
interface Session extends BaseSession {
    activeOrganizationId?: string
    userId: string
}

// Auth configuration for Deploy service
async function authBuilder(c: any) {
    // Get validated environment variables
    const env = getDeployEnv(c);

    // Get D1 database instance using local function
    const dbInstance = await getAuthDb(c);

    // Configure auth with Cloudflare bindings
    const authOptions = withCloudflare(
        {
            autoDetectIpAddress: true,
            geolocationTracking: true,
            // Use KV for session storage
            kv: c.env.KV,
            // Use D1 database instance
            d1: {
                db: dbInstance,
                options: {
                    // debugLogs: true,
                },
            },
        },
        {
            socialProviders: {
                github: {
                    clientId: env.BETTER_GITHUB_CLIENT_ID,
                    clientSecret: env.BETTER_GITHUB_CLIENT_SECRET,
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
            // Use minimal plugins for deploy service to avoid environment variable issues
            plugins: [
                // Temporarily not using complex plugins to avoid triggering environment variable validation
                // If specific features are needed, can individually import plugins that don't depend on environment variables
            ]
        }
    );

    return betterAuth(authOptions);
}

let authInstance: Awaited<ReturnType<typeof authBuilder>> | null = null;

// Initialize and get shared auth instance
export async function initAuth(c: any) {
    if (!authInstance) {
        authInstance = await authBuilder(c);
    }
    return authInstance;
}

// Validate session helper
export async function validateSession(c: any): Promise<Session | null> {
    const [sessionData, error] = await tryCatch(async () => {
        const auth = await initAuth(c);
        const sessionData = await auth.api.getSession({
            headers: c.req.raw.headers,
        });
        // getSession returns a { session, user } object, we need the session part
        return sessionData?.session || null;
    });

    if (error) {
        console.error('[Deploy Auth] Session validation error:', error);
        return null;
    }

    return sessionData;
}

// Check if user has deployment permissions and deduct deploy quota
export async function hasDeployPermission(session: Session | null, c: any): Promise<boolean> {
    if (!session) {
        console.log('[Deploy Auth] No session provided for deploy permission check');
        return false;
    }

    // Get organization ID from session
    const organizationId = await getOrganizationIdFromSession(session);
    if (!organizationId) {
        console.log('[Deploy Auth] No organization ID found for user:', session.userId);
        return false;
    }

    // Check and deduct deploy quota using Hono-specific function
    const [hasQuota, error] = await tryCatch(async () => {
        return await checkAndUpdateDeployUsageForHono(organizationId, c);
    });

    if (error) {
        console.error('[Deploy Auth] Error checking deploy quota:', error);
        return false;
    }

    if (!hasQuota) {
        console.log('[Deploy Auth] Deploy quota exhausted for organization:', organizationId);
        return false;
    }

    console.log('[Deploy Auth] Deploy permission granted for organization:', organizationId);
    return true;
}

// Check if user has basic deployment permissions without deducting quota
export async function hasBasicDeployPermission(session: Session | null): Promise<boolean> {
    if (!session) {
        console.log('[Deploy Auth] No session provided for basic permission check');
        return false;
    }

    // Get organization ID from session
    const organizationId = await getOrganizationIdFromSession(session);
    if (!organizationId) {
        console.log('[Deploy Auth] No organization ID found for user:', session.userId);
        return false;
    }

    console.log('[Deploy Auth] Basic deploy permission granted for organization:', organizationId);
    return true;
}

// Helper function to get organization ID from session
async function getOrganizationIdFromSession(session: Session): Promise<string | null> {
    // First try to get from session activeOrganizationId
    if (session.activeOrganizationId) {
        return session.activeOrganizationId;
    }

    // Fallback: Get organization from user's membership
    const [organization, error] = await tryCatch(async () => {
        return await getActiveOrganization(session.userId);
    });

    if (error) {
        console.error('[Deploy Auth] Error getting organization for user:', session.userId, error);
        return null;
    }

    return organization?.id || null;
}
