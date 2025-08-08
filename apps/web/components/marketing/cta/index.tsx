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

import * as m from '@/paraglide/messages'
import { Badge } from '@libra/ui/components/badge'
import { Section } from '@libra/ui/components/section'
import { cn } from '@libra/ui/lib/utils'
import type { ReactNode } from 'react'
import { Button, type ButtonProps } from '../../ui/button'

interface CTAButtonProps {
  href: string
  text: string
  variant?: ButtonProps['variant']
  icon?: ReactNode
  iconRight?: ReactNode
}

interface CTAProps {
  badgeText?: string
  title?: string
  description?: string
  buttons?: CTAButtonProps[] | false
  className?: string
}

export default function CTA({
  badgeText = m['cta.title'](),
  title = m['cta.title'](),
  description = m['cta.subtitle'](),
  buttons = [
    {
      href: '#',
      text: m['cta.button'](),
      variant: 'default',
    },
  ],
  className,
}: CTAProps) {
  return (
    <Section className={cn('w-full overflow-hidden pt-0 md:pt-0', className)}>
      <div className='max-w-container relative mx-auto flex flex-col items-center gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-24 text-center'>
        <Badge variant='outline'>
          <span className='text-muted-foreground'>{badgeText}</span>
        </Badge>
        <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl'>{title}</h2>
        {description && <p className='text-base sm:text-lg text-muted-foreground max-w-full sm:max-w-[600px]'>{description}</p>}
        {buttons !== false && buttons.length > 0 && (
          <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full sm:w-auto'>
            {buttons.map((button, index) => (
              <Button key={`${button.text}-${button.href}-${index}`} variant={button.variant || 'default'} size='lg' asChild className='w-full sm:w-auto'>
                <a href={button.href} data-attr={button.href?.includes('#price') ? 'upgrade' : undefined}>
                  {button.icon}
                  {button.text}
                  {button.iconRight}
                </a>
              </Button>
            ))}
          </div>
        )}
        <div className='fade-top-lg pointer-events-none absolute inset-0 rounded-2xl shadow-[0_-16px_128px_0_var(--brand-foreground)_inset,0_-16px_32px_0_var(--brand)_inset]' />
      </div>
    </Section>
  )
}
