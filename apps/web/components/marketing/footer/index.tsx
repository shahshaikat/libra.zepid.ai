/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * index.tsx
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

import { cn } from '@libra/ui/lib/utils'
import type { ReactNode } from 'react'
import { Logo } from '@/components/common/logo/LogoImage'
import { Footer, FooterBottom, FooterColumn, FooterContent } from '@/components/ui/footer'
import { siteConfig } from '@/configs/site'
import * as m from '@/paraglide/messages'
import { TextGif } from '../../ui/text-gif'

interface FooterLink {
  text: string
  href: string
  id: string
}

interface FooterColumnProps {
  title: string
  links: FooterLink[]
  id: string
}

interface FooterProps {
  logo?: ReactNode
  name?: string
  columns?: FooterColumnProps[]
  copyright?: string
  policies?: FooterLink[]
  className?: string
}

export default function FooterSection({
  logo = <Logo />,
  name = 'Libra AI',
  columns = [
    {
      id: 'product',
      title: m['footer.product'](),
      links: [
        { id: 'changelog', text: m['footer.changelog'](), href: siteConfig.url },
        { id: 'documentation', text: m['footer.documentation'](), href: siteConfig.url },
      ],
    },
    {
      id: 'contact',
      title: m['footer.contact'](),
      links: [
        { id: 'forum', text: m['footer.community'](), href: siteConfig.links.forum },
        { id: 'twitter', text: m['footer.twitter'](), href: siteConfig.links.twitter },
        { id: 'github', text: m['footer.github'](), href: siteConfig.links.github },
      ],
    },
  ],
  copyright = m['footer.copyright_nextify'](),
  policies = [
    { id: 'privacy', text: m['footer.privacy'](), href: '/privacy' },
    { id: 'terms', text: m['footer.terms'](), href: '/terms' },
  ],
  className,
}: FooterProps) {
  return (
    <footer className={cn('w-full px-4 sm:px-6 lg:px-8', className)}>
      <div className='max-w-container mx-auto'>
        <Footer>
          <FooterContent>
            <FooterColumn className='col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-1'>
              <div className='flex items-center gap-1'>
                {logo}
                <h3 className='text-lg sm:text-xl font-bold'>
                  <TextGif text={name} weight='bold' />
                </h3>
              </div>
            </FooterColumn>
            {columns.map((column) => (
              <FooterColumn key={column.id}>
                <h3 className='text-sm sm:text-md pt-1 font-semibold'>{column.title}</h3>
                {column.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    className='text-muted-foreground text-sm'
                    data-attr={link.id === 'github' || link.href?.includes('github.com') ? 'github' : undefined}
                  >
                    {link.text}
                  </a>
                ))}
              </FooterColumn>
            ))}
          </FooterContent>
          <FooterBottom>
            <div>{copyright}</div>
            <div className='flex flex-wrap items-center gap-3 sm:gap-4'>
              {policies.map((policy) => (
                <a key={policy.id} href={policy.href}>
                  {policy.text}
                </a>
              ))}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  )
}
