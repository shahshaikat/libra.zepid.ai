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

import { TextGif } from '@/components/ui/text-gif'
import { siteConfig } from '@/configs/site'
import { Button, type ButtonProps } from '@libra/ui/components/button'
import { Navbar as NavbarComponent, NavbarLeft, NavbarRight } from '@libra/ui/components/navbar'
import { Sheet, SheetContent, SheetTrigger } from '@libra/ui/components/sheet'
import { cn } from '@libra/ui/lib/utils'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import Navigation from './navigation'
import { Logo } from "@/components/common/logo/LogoImage"
import { LanguageSwitcher } from '@/components/language-switcher'
import * as m from '@/paraglide/messages'

interface NavbarLink {
  text: string
  href: string
}

interface NavbarActionProps {
  text: string
  href: string
  variant?: ButtonProps['variant']
  icon?: ReactNode
  iconRight?: ReactNode
  isButton?: boolean
}

interface NavbarProps {
  logo?: ReactNode
  name?: string
  homeUrl?: string
  mobileLinks?: NavbarLink[]
  actions?: NavbarActionProps[]
  showNavigation?: boolean
  customNavigation?: ReactNode
  className?: string
  isAuthenticated?: boolean
}

export default function Navbar({
  name = 'Zepid',
  homeUrl = siteConfig.url,
  mobileLinks = [
    { text: m["nav.documentation"](), href: siteConfig.url },
    { text: m["nav.templates"](), href: siteConfig.url },
    { text: m["nav.playground"](), href: siteConfig.url },
  ],
  actions,
  showNavigation = true,
  customNavigation,
  className,
  isAuthenticated = false,
}: NavbarProps) {
  // Generate actions based on authentication status
  const defaultActions: NavbarActionProps[] = isAuthenticated
    ? [
      {
        text: m["nav.dashboard"](),
        href: "/dashboard",
        isButton: true,
        variant: 'default' as const,
      },
    ]
    : [
      { text: m["nav.login"](), href: "/login", isButton: false },
    ]

  const finalActions = actions || defaultActions
  return (
    <header className={cn('sticky top-0 z-50 -mb-4 px-4 pb-4', className)}>
      <div className='fade-bottom bg-[var(--background-landing)]/15 absolute left-0 h-24 w-full backdrop-blur-lg' />
      <div className='max-w-container relative mx-auto'>
        <NavbarComponent>
          <NavbarLeft>
            <div className='flex items-center gap-2'>
              <Link href={homeUrl}>
                <div className='flex items-center gap-1 justify-center rounded-xl'>
                  <Logo />
                  <TextGif
                    text={name}
                    weight="bold"
                  />
                </div>
              </Link>
            </div>
            {showNavigation && (customNavigation || <Navigation />)}
          </NavbarLeft>
          <NavbarRight>
            {finalActions.map((action, index) =>
              action.isButton ? (
                <Button key={index} variant={action.variant || 'default'} asChild>
                  <Link href={action.href}>
                    {action.icon}
                    {action.text}
                    {action.iconRight}
                  </Link>
                </Button>
              ) : (
                <Link key={index} href={action.href} className='hidden text-sm md:block'>
                  {action.text}
                </Link>
              )
            )}
            <LanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon' className='shrink-0 md:hidden'>
                  <Menu className='size-5' />
                  <span className='sr-only'>{m["nav.toggleNavigation"]()}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side='right'>
                <nav className='grid gap-6 text-lg font-medium'>
                  <Link href={homeUrl} className='flex items-center gap-2 text-xl font-bold'>
                    <span>{name}</span>
                  </Link>
                  {mobileLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className='text-muted-foreground hover:text-foreground'
                    >
                      {link.text}
                    </Link>
                  ))}
                  {finalActions.map((action, index) => (
                    <Link
                      key={`mobile-${index}`}
                      href={action.href}
                      className='text-muted-foreground hover:text-foreground'
                    >
                      {action.text}
                    </Link>
                  ))}
                  <div className='pt-4 border-t border-border'>
                    <LanguageSwitcher />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </NavbarRight>
        </NavbarComponent>
      </div>
    </header>
  )
}
