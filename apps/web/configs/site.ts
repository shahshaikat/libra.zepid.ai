/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * site.ts
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

export const siteConfig = {
  name: 'Libra AI',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://zepid.dev',
  getStartedUrl: 'https://zepid.dev',
  ogImage: 'https://libra.dev/opengraph-image.png',
  description:
    'Libra is a platform for building AI-powered applications.',
  links: {
    twitter: 'https://twitter.com/nextify2024',
    github: 'https://github.com/nextify-limited/libra',
    email: 'mailto:contact@zepid.dev',
    forum: 'https://forum.zepid.dev',
  },
}

type SiteConfig = typeof siteConfig
