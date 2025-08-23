/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * sitemap.ts
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

/**
 * Sitemap Generator for Zepid Website
 *
 * This module generates a sitemap for the Zepid website based on the actual route structure.
 * It includes all static pages and handles proper URL formatting to ensure all content
 * is discoverable by search engines.
 */

import type { MetadataRoute } from 'next'
import { siteConfig } from '@/configs/site'

/**
 * Valid change frequency values for sitemap entries
 * @see https://www.sitemaps.org/protocol.html
 */
type ChangeFrequency =
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'

/**
 * Static routes configuration for the Zepid website
 * Based on the actual app router structure in apps/web/app/(frontend)
 */
const staticRoutes: Array<{
    url: string
    lastModified?: string | Date
    changeFrequency?: ChangeFrequency
    priority?: number
}> = [
        // Marketing pages
        {
            url: '',
            priority: 1.0,
            changeFrequency: 'weekly',
            lastModified: new Date(),
        },
        {
            url: '/contact',
            priority: 0.8,
            changeFrequency: 'monthly',
            lastModified: new Date(),
        },
        {
            url: '/privacy',
            priority: 0.5,
            changeFrequency: 'yearly',
            lastModified: new Date(),
        },
        {
            url: '/terms',
            priority: 0.5,
            changeFrequency: 'yearly',
            lastModified: new Date(),
        },
        // Authentication pages
        {
            url: '/login',
            priority: 0.7,
            changeFrequency: 'monthly',
            lastModified: new Date(),
        },
        // Dashboard pages (public routes only)
        {
            url: '/dashboard',
            priority: 0.9,
            changeFrequency: 'daily',
            lastModified: new Date(),
        },
    ]



/**
 * Main sitemap generation function that Next.js calls
 *
 * Generates a sitemap based on the static routes defined in the application
 *
 * @returns Complete sitemap for the Zepid website
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Generate sitemap entries from static routes
    const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${siteConfig.url}${route.url}`,
        lastModified: route.lastModified || new Date(),
        changeFrequency: route.changeFrequency || 'monthly',
        priority: route.priority || 0.5,
    }))

    // Sort URLs alphabetically for consistency
    return sitemapEntries.sort((a, b) => a.url.localeCompare(b.url))
}
