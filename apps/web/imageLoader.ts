/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * imageLoader.ts
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

const normalizeSrc = (src: string) => {
  return src.startsWith('/') ? src.slice(1) : src
}

export default function cloudflareLoader({
  src,
  width,
  quality,
}: { src: string; width: number; quality?: number }) {
  const params = [`width=${width}`]
  if (quality) {
    params.push(`quality=${quality}`)
  }
  const paramsString = params.join(',')

  // ✅ 1. Skip Cloudflare optimization for anything in /public
  // (like .svg, .png, .jpg, .ico, etc.)
  if (src.startsWith('/')) {
    return src
  }

  // ✅ 2. In dev, use CLOUDFLARE_DOMAIN if available
  if (process.env.NODE_ENV === 'development') {
    if (process.env.CLOUDFLARE_DOMAIN) {
      return `https://${process.env.CLOUDFLARE_DOMAIN}/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`
    }
    return src
  }

  // ✅ 3. Skip Cloudflare optimization for CDN-hosted images
  if (src.startsWith('https://cdn.zepid.dev/') || src.startsWith('http://cdn.zepid.dev/')) {
    return src
  }

  // ✅ 4. Otherwise, use Cloudflare optimization
  return `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`
}
