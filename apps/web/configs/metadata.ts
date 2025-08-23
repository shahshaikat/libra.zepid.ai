/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * metadata.ts
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

import type { Metadata } from 'next/types'

export const METADATA = {
  title: 'Zepid - Code Interpreting for AI apps',
  description: 'Open-source  for AI code execution',
}

function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: '',
      images: '/banner.png',
      siteName: 'Zepid',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@nextify2024',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: '/banner.png',
      ...override.twitter,
    },
  }
}

export const baseUrl =
  process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_APP_URL
    ? new URL('http://localhost:3000')
    : new URL(`https://${process.env.NEXT_PUBLIC_APP_URL}`)
