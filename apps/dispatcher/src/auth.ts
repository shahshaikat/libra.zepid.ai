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

import { betterAuth, type Session } from "better-auth";
import { withCloudflare } from "@libra/better-auth-cloudflare";
// import { plugins } from "@libra/auth/plugins"; // Avoid triggering environment variable validation
import { getDispatcherEnv } from "./env";
import { tryCatch } from '@libra/common';

// Simplified auth configuration for dispatcher
async function authBuilder(c: any) {
    // Get validated environment variables
    const env = getDispatcherEnv(c);

    // For dispatcher, we might not need a full database connection
    // We can use KV for session storage only
    const authOptions = withCloudflare(
        {
            autoDetectIpAddress: true,
            geolocationTracking: true,
            // Use KV for session storage
            kv: c.env.KV,
            // Optional: Use D1 if available for full auth features
            ...(c.env.DATABASE && {
                d1: {
                    db: c.env.DATABASE,
                    options: {
                        // debugLogs: true,
                    },
                },
            }),
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
                'https://dispatcher.zepid.dev',
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
            // Use minimal plugins for dispatcher to avoid environment variable issues
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
        return null;
    }

    return sessionData;
}

// Check if user has dispatch permissions
export async function hasDispatchPermission(session: Session | null): Promise<boolean> {
    if (!session) {
        return false;
    }

    // For now, all authenticated users have dispatch permission
    // This can be extended with role-based access control
    return true;
}
