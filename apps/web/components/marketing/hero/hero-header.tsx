/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * hero-header.tsx
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

import { ColourfulText } from '@/components/ui/colourful-text'
import * as m from '@/paraglide/messages'
import { Badge } from '@libra/ui/components/badge'
import { siteConfig } from 'apps/web/configs/site'
import { ArrowRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

interface HeroHeaderProps {
  title?: string
  description?: string
  badge?: ReactNode | false
}

/**
 * Hydration-safe Badge component
 */
const HydrationSafeBadge = () => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <Badge variant='outline' className='animate-appear'>
      <span className='text-muted-foreground'>
        {isHydrated ? m['hero.badge']() : 'Introducing Zepid'}
      </span>
      <a href={siteConfig.getStartedUrl} className='flex items-center gap-1'>
        {isHydrated ? m['hero.cta_primary']() : 'Get Started'}
        <ArrowRightIcon className='size-3' />
      </a>
    </Badge>
  )
}

/**
 * Hero component header section including title, badge and description
 */
export const HeroHeader = ({ title, description, badge }: HeroHeaderProps) => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Use default values after hydration to avoid mismatch
  const displayTitle = m['hero.title']()
  const displayDescription =
    description ||
    (isHydrated
      ? m['hero.subtitle']()
      : 'Everything you need to launch your SaaS product quickly. Authentication, payments, database, and more - all pre-configured and ready to go.')
  const displayBadge = badge !== undefined ? badge : <HydrationSafeBadge />
  return (
    <>
      {displayBadge !== false && displayBadge}
      <h1 className='text-sm animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-linear-to-r bg-clip-text text-4xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-6xl lg:text-7xl xl:text-8xl md:leading-tight'>
        {displayTitle} &nbsp;
        <ColourfulText text={isHydrated ? m['hero.title_minutes']() : 'minutes'} />
      </h1>
      <p className='text-md animate-appear text-muted-foreground relative z-10 max-w-full sm:max-w-[600px] md:max-w-[700px] px-2 sm:px-0 font-medium text-balance opacity-0 delay-100 sm:text-lg md:text-xl'>
        {displayDescription}
      </p>
    </>
  )
}
