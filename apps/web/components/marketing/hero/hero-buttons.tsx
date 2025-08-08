/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * hero-buttons.tsx
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

'use client'

import { MdForum } from "react-icons/md"
import Github from '@/components/logos/github'
import { siteConfig } from 'apps/web/configs/site'
import { Button } from '../../ui/button'
import type { HeroButtonProps } from './types'
import * as m from '@/paraglide/messages'

interface HeroButtonsGroupProps {
  buttons?: HeroButtonProps[] | false
}

/**
 * Default button configuration
 */
const getDefaultButtons = (): HeroButtonProps[] => [
  {
    href: siteConfig.links.forum,
    text: m['hero.examples.buttons.forum'](),
    variant: 'default',
    icon: <MdForum className='mr-2 size-4' />,
  },
  {
    href: siteConfig.links.github,
    text: m['hero.examples.buttons.github'](),
    variant: 'secondary',
    icon: <Github className='mr-2 size-4' />,
  },
]

/**
 * Bottom button area of Hero component
 */
export const HeroButtons = ({ buttons = getDefaultButtons() }: HeroButtonsGroupProps) => {
  // Removed log: console.log('HeroButtons rendering')

  if (buttons === false || buttons.length === 0) {
    return null
  }

  return (
    <div className='animate-appear relative flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 opacity-0 delay-400 z-[5] w-full px-4 sm:px-0'>
      {buttons.map((button, index) => (
        <Button key={`${button.text}-${button.href}-${index}`} variant={button.variant || 'default'} size='lg' asChild className='w-full sm:w-auto'>
          <a
            href={button.href}
            className='relative'
            data-attr={button.href?.includes('github.com') ? 'github' : undefined}
          >
            {button.icon}
            {button.text}
            {button.iconRight}
          </a>
        </Button>
      ))}
    </div>
  )
}
